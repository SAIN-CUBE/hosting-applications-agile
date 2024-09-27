from django.conf import settings
from PIL import Image
import io
import numpy as np
import time, json, base64
from datetime import datetime
import cv2
from deep_translator import GoogleTranslator
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from django.http import JsonResponse
import tempfile
import re
import easyocr
from .read import text_recognizer
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import JSONParser
from .logger.logger import logging
from .models import AITool, Credit, ToolUsage, ApiCallLog
from django.utils.timezone import now
from .authentication import SIDAuthentication

class ExtractCNICView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    authentication_classes = [SIDAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        files = request.FILES.getlist('cnic')
        logging.info(f"{len(files)} file(s) uploaded for CNIC data extraction")

        # Extract the source identifier from custom header or fallback to "api"
        source = request.headers.get('Call-Source', 'api')  # Default to 'api' if header not provided

        # Validate source (only allow "app" or "api")
        if source not in ['app', 'api']:
            return Response({'error': 'Invalid source. Must be "app" or "api".'}, status=400)

        if not files:
            return Response({"detail": "No files were provided in the request."}, status=400)

        response_data_list = []
        start_time = time.time()
        # credits = Credit.objects.get(user)

        tokens = 0
        for file in files:
            if not file.content_type.startswith('image'):
                return Response({"detail": f"Invalid file type for {file.name}. Only image files are allowed."}, status=400)

            try:
                img_np = self.load_image_into_numpy_array(file.read())
                image_height, image_width = img_np.shape[:2]
                image = Image.fromarray(img_np)

                chip_detection_model = settings.CHIP_DETECTION_MODEL
                chip_results = chip_detection_model.predict(source=image, conf=0.4, imgsz=1280, save=False, nms=True)
                chip_boxes = chip_results[0].boxes.xyxy.cpu().numpy().tolist()

                response_data = {
                    "file": file.name,
                    "metadata": {
                        "Mod": "eng" if chip_boxes else "urd",
                        "Side": "front" if chip_boxes else "back",
                        "PTime": None,
                        "Tokens_Used": None,
                        "Timestamp": datetime.now().isoformat()
                    },
                    "data": None
                }

                if chip_boxes:
                    # Perform English OCR
                    gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
                    ocr_results = self.perform_ocr(gray, ['en'])
                    texts = [text for (_, text, _) in ocr_results]
                    cnic_data = self.extract_cnic_data(texts)
                    response_data["data"] = cnic_data
                else:
                    urdu_detection_model = settings.URDU_DETECTION_MODEL
                    urdu_recognition_model = settings.URDU_RECOGNITION_MODEL
                    urdu_converter = settings.URDU_CONVERTER
                    urdu_device = settings.URDU_DEVICE

                    detection_results = urdu_detection_model.predict(source=image, conf=0.5, imgsz=1280, save=False, nms=True, device=urdu_device)
                    bounding_boxes = detection_results[0].boxes.xyxy.cpu().numpy().tolist()
                    bounding_boxes.sort(key=lambda x: x[1])

                    cropped_images = [image.crop(box) for box in bounding_boxes]

                    texts = [text_recognizer(img, urdu_recognition_model, urdu_converter, urdu_device) for img in cropped_images]
                    urdu_text = "\n".join(texts)

                    translated_text = GoogleTranslator(source='ur', target='en').translate(urdu_text)

                    formatted_data = self.format_translated_text(translated_text)

                    response_data["data"] = {
                        "urdu_text": urdu_text,
                        "translated_text": translated_text,
                        "formatted_data": formatted_data
                    }

                processing_time = time.time() - start_time
                response_data["metadata"]["PTime"] = f"{processing_time:.2f} s"
                tokens_used = (image_width * image_height) // 1000
                response_data["metadata"]["Tokens_Used"] = tokens_used

                response_data_list.append(response_data)
                tokens += tokens_used
                print(f"Tokens Used for {file}: ", tokens_used//100)
                

            except Exception as e:
                logging.error(f"Exception occurred for {file.name}: {e}")
                return Response({"detail": f"Internal Server Error for file {file.name}"}, status=500)

        try:
            logging.info("Deducting credits...")
            self.deduct_credits(request.user, tokens//100, "cnic-data-extraction", source)
            logging.info(f"Credits deducted for {request.user.email} for cnic-data-extraction")
            return JsonResponse({"files_data": response_data_list}, safe=False)
        except Exception as e:
            logging.error(f"Error deducting credits: {e}")
            return Response({"error": f"error in deucting credits {e}"})
    

    def deduct_credits(self, user, tokens_used, tool_name, source):
        """
        Directly handle credit deduction within the CNIC extraction view.
        Accumulate tool usage for the same day if the same tool is used multiple times.
        """
        try:
            # Fetch the tool details
            tool = AITool.objects.get(tool_name=tool_name)

            # Get the user's credits
            credits = Credit.objects.get(user=user)
            print(credits.remaining_credits)
            print(tokens_used)

            # Check if user has enough credits
            if credits.remaining_credits >= tokens_used:
                # Deduct credits and update the user's credits
                credits.remaining_credits -= tokens_used
                credits.used_credits += tokens_used
                credits.save()

                # Get today's date
                today = str(now().date())
                print(today)

                # Check if a ToolUsage entry exists for this user, tool, and today's date
                tool_usage_qs = ToolUsage.objects.filter(used_by=user, tool_name=tool_name, used_at=today)
                print("Filtered object", tool_usage_qs)


                if tool_usage_qs.exists():
                    # If a record already exists for today, accumulate the credits used
                    print("Inside filtered object")
                    tool_usage = tool_usage_qs.first()
                    tool_usage.credits_used += tokens_used
                    tool_usage.remaining_credits = credits.remaining_credits
                    tool_usage.save()
                    logging.info(f"Credits accumulated for {user.email}: {tokens_used} tokens added for {tool_name} on {today}.")
                else:
                    print("Inside else")
                    # If no record exists for today, create a new one
                    ToolUsage.objects.create(
                        used_by=user,
                        tool_name=tool_name,
                        used_at=today,
                        credits_used=tokens_used,
                        remaining_credits=credits.remaining_credits
                    )
                    
                try:
                # Create the API call log object
                    ApiCallLog.objects.create(
                        user=user,
                        tool_name='cnic-data-extraction',
                        credits_used=tokens_used,
                        source = source,
                        timestamp=now()
                    )
                    print("API call log created successfully.")
                except Exception as e:
                    print(f"Error creating ApiCallLog: {e}")
                logging.info(f"Credits deducted for user {user.email}: {tokens_used} tokens used today for {tool_name}.")
            else:
                logging.warning(f"User {user.email} has insufficient credits for {tool_name}.")
                raise ValueError("Insufficient credits")

        except AITool.DoesNotExist:
            logging.error(f"Tool {tool_name} not found.")
            raise ValueError("Tool not found")
            
        except Credit.DoesNotExist:
            logging.error(f"Credit record for user {user.email} not found.")
            raise ValueError(f"Credit record for user {user.email} not found.")
        except Exception as e:
            logging.error(f"Error deducting credits for user {user.email}: {e}")
            raise e

    
    def load_image_into_numpy_array(self, image_bytes):
        image = Image.open(io.BytesIO(image_bytes))
        return np.array(image)

    def perform_ocr(self, image_bytes, languages):
        reader = settings.READER
        return reader.readtext(image_bytes)

    def extract_cnic_data(self, ocr_text):
        cnic_data = {
            "Name": "",
            "Father_Name": "",
            "Husband_Name": "",
            "Gender": "",
            "Identity_Number": "",
            "Date_of_Birth": "",
            "Date_of_Issue": "",
            "Date_of_Expiry": ""
        }

        name_patterns = [r'\bName\b', r'\bNane\b', r'\bNarne\b', r'\bNarne\b']
        father_name_patterns = [r'\bFather Name\b', r'\bFatherNane\b', r'\bFather Nane\b', r'\bFathername\b']
        husband_name_patterns = [r'\bHusband Name\b', r'\bHusbandName\b', r'\bHusband Nane\b', r'\bHusbandname\b']

        for i, text in enumerate(ocr_text):
            if any(re.match(pattern, text, re.IGNORECASE) for pattern in name_patterns):
                cnic_data["Name"] = ocr_text[i + 1]

            if any(re.match(pattern, text, re.IGNORECASE) for pattern in father_name_patterns):
                cnic_data["Father_Name"] = ocr_text[i + 1]

            if any(re.match(pattern, text, re.IGNORECASE) for pattern in husband_name_patterns):
                cnic_data["Husband_Name"] = ocr_text[i + 1]

            if text in ["M", "F"]:
                cnic_data["Gender"] = text

            if re.match(r'^\d{5}[-+\s.:]?\d{7}[-+\s.:]?\d{1}$', text):
                cnic_data["Identity_Number"] = text.replace(" ", "-").replace("+", "-").replace(".", "-").replace(":", "-")

            if re.match(r'^\d{2}[-\.,/]\d{2}[-\.,/]\d{4}$', text):
                formatted_date = text.replace(".", "-").replace(",", "-").replace("/", "-")
                if not cnic_data["Date_of_Birth"]:
                    cnic_data["Date_of_Birth"] = formatted_date
                elif not cnic_data["Date_of_Issue"]:
                    cnic_data["Date_of_Issue"] = formatted_date
                elif not cnic_data["Date_of_Expiry"]:
                    cnic_data["Date_of_Expiry"] = formatted_date

        # Ensure "Father_Name" and "Husband_Name" are not both filled
        if cnic_data["Father_Name"]:
            cnic_data["Husband_Name"] = ""
        elif cnic_data["Husband_Name"]:
            cnic_data["Father_Name"] = ""

        # Remove empty fields
        cnic_data = {key: value for key, value in cnic_data.items() if value}

        return cnic_data

    def format_translated_text(self, translated_text):
        permanent_address = ""
        current_address = ""

        lines = translated_text.split("\n")

        for line in lines:
            if "Permanent Address" in line:
                permanent_address = line.replace("Permanent Address", "").strip()
            elif "Current Address" in line:
                current_address = line.replace("Current Address", "").strip()

        formatted_data = {}
        formatted_lines = [re.sub(r'^\d+\s*', '', line).strip() for line in lines if line.strip()]
        for i, line in enumerate(formatted_lines):
            formatted_data[f"Line_{i+1}"] = line

        return formatted_data



class ExtractEncodedCNICView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    authentication_classes = [SIDAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):

        # try:
        start_time = time.time()
        
        # Extract base64 image data and file extension from the JSON
        json_data = JSONParser().parse(request)
        image_data = json_data.get('data')
        file_ext = json_data.get('ext')
        
        source = request.headers.get('Call-Source', 'api')  # Default to 'api' if header not provided

        # Validate source (only allow "app" or "api")
        if source not in ['app', 'api']:
            return Response({'error': 'Invalid source. Must be "app" or "api".'}, status=400)


        if not image_data or not file_ext:
            return JsonResponse({"error": "Invalid JSON format. Must contain 'data' and 'ext' fields."}, status=400)

        # Decode the base64 image data
        image_bytes = base64.b64decode(image_data)

        # Save the decoded image to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
            temp_file.write(image_bytes)
            file_name = temp_file.name

        # Process the saved image (similar to the existing OCR endpoint)
        with open(file_name, "rb") as img_file:
            img_np = self.load_image_into_numpy_array(img_file.read())

        image = Image.fromarray(img_np)

        
        chip_detection_model = settings.CHIP_DETECTION_MODEL
        chip_results = chip_detection_model.predict(source=image, conf=0.4, imgsz=1280, save=False, nms=True)
        chip_boxes = chip_results[0].boxes.xyxy.cpu().numpy().tolist()

        response_data = {
            "metadata": {
                "Mod": "eng" if chip_boxes else "urd",
                "Side": "front" if chip_boxes else "back",
                "PTime": None,
                "Tokens_Used": None,
                "Timestamp": datetime.now().isoformat()
            },
            "data": None
        }

        if chip_boxes:
            # Perform English OCR
            gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
            ocr_results = self.perform_ocr(gray, ['en'])
            texts = [text for (_, text, _) in ocr_results]
            cnic_data = self.extract_cnic_data(texts)
            response_data["data"] = cnic_data
        else:
            urdu_detection_model = settings.URDU_DETECTION_MODEL
            urdu_recognition_model = settings.URDU_RECOGNITION_MODEL
            urdu_converter = settings.URDU_CONVERTER
            urdu_device = settings.URDU_DEVICE

            detection_results = urdu_detection_model.predict(source=image, conf=0.5, imgsz=1280, save=False, nms=True, device=urdu_device)
            bounding_boxes = detection_results[0].boxes.xyxy.cpu().numpy().tolist()
            bounding_boxes.sort(key=lambda x: x[1])

            cropped_images = [image.crop(box) for box in bounding_boxes]

            texts = [text_recognizer(img, urdu_recognition_model, urdu_converter, urdu_device) for img in cropped_images]
            urdu_text = "\n".join(texts)

            translated_text = GoogleTranslator(source='ur', target='en').translate(urdu_text)

            formatted_data = self.format_translated_text(translated_text)

            response_data["data"] = {
                "urdu_text": urdu_text,
                "translated_text": translated_text,
                "formatted_data": formatted_data
            }

        processing_time = time.time() - start_time
        response_data["metadata"]["PTime"] = f"{processing_time:.2f} s"
        image_height, image_width = img_np.shape[:2]
        tokens_used = (image_width * image_height) // 1000
        response_data["metadata"]["Tokens_Used"] = tokens_used
        
        print("Tokens used:", tokens_used//100)
        try:
            logging.info("Deducting credits...")
            self.deduct_credits(request.user, tokens_used//100, "cnic-data-extraction", source)
            logging.info(f"Credits deducted for {request.user.email} for cnic-data-extraction")
            return JsonResponse({"file_data": response_data}, safe=False)
        except Exception as e:
            logging.error(f"Error deducting credits: {e}")
            return Response({"error": f"error in deucting credits {e}"})
        
    def deduct_credits(self, user, tokens_used, tool_name, source):
        """
        Directly handle credit deduction within the CNIC extraction view.
        Accumulate tool usage for the same day if the same tool is used multiple times.
        """
        try:
            # Fetch the tool details
            tool = AITool.objects.get(tool_name=tool_name)

            # Get the user's credits
            credits = Credit.objects.get(user=user)
            print(credits.remaining_credits)
            print(tokens_used)

            # Check if user has enough credits
            if credits.remaining_credits >= tokens_used:
                # Deduct credits and update the user's credits
                credits.remaining_credits -= tokens_used
                credits.used_credits += tokens_used
                credits.save()

                # Get today's date
                today = str(now().date())
                print(today)

                # Check if a ToolUsage entry exists for this user, tool, and today's date
                tool_usage_qs = ToolUsage.objects.filter(used_by=user, tool_name=tool_name, used_at=today)
                print("Filtered object", tool_usage_qs)


                if tool_usage_qs.exists():
                    # If a record already exists for today, accumulate the credits used
                    print("Inside filtered object")
                    tool_usage = tool_usage_qs.first()
                    tool_usage.credits_used += tokens_used
                    tool_usage.remaining_credits = credits.remaining_credits
                    tool_usage.save()
                    logging.info(f"Credits accumulated for {user.email}: {tokens_used} tokens added for {tool_name} on {today}.")
                else:
                    print("Inside else")
                    # If no record exists for today, create a new one
                    ToolUsage.objects.create(
                        used_by=user,
                        tool_name=tool_name,
                        used_at=today,
                        credits_used=tokens_used,
                        remaining_credits=credits.remaining_credits
                    )
                    
                try:
                # Create the API call log object
                    ApiCallLog.objects.create(
                        user=user,
                        tool_name=tool_name,
                        credits_used=tokens_used,
                        source = source,
                        timestamp=now()
                    )
                    print("API call log created successfully.")
                except Exception as e:
                    print(f"Error creating ApiCallLog: {e}")
                logging.info(f"Credits deducted for user {user.email}: {tokens_used} tokens used today for {tool_name}.")
            else:
                logging.warning(f"User {user.email} has insufficient credits for {tool_name}.")
                raise ValueError("Insufficient credits")

        except AITool.DoesNotExist:
            logging.error(f"Tool {tool_name} not found.")
            raise ValueError("Tool not found")
            
        except Credit.DoesNotExist:
            logging.error(f"Credit record for user {user.email} not found.")
            raise ValueError(f"Credit record for user {user.email} not found.")
        except Exception as e:
            logging.error(f"Error deducting credits for user {user.email}: {e}")
            raise e

    
    
    def load_image_into_numpy_array(self, image_bytes):
        image = Image.open(io.BytesIO(image_bytes))
        return np.array(image)

    def perform_ocr(self, image_bytes, languages):
        reader = settings.READER
        return reader.readtext(image_bytes)

    def extract_cnic_data(self, ocr_text):
        cnic_data = {
            "Name": "",
            "Father_Name": "",
            "Husband_Name": "",
            "Gender": "",
            "Identity_Number": "",
            "Date_of_Birth": "",
            "Date_of_Issue": "",
            "Date_of_Expiry": ""
        }

        name_patterns = [r'\bName\b', r'\bNane\b', r'\bNarne\b', r'\bNarne\b']
        father_name_patterns = [r'\bFather Name\b', r'\bFatherNane\b', r'\bFather Nane\b', r'\bFathername\b']
        husband_name_patterns = [r'\bHusband Name\b', r'\bHusbandName\b', r'\bHusband Nane\b', r'\bHusbandname\b']

        for i, text in enumerate(ocr_text):
            if any(re.match(pattern, text, re.IGNORECASE) for pattern in name_patterns):
                cnic_data["Name"] = ocr_text[i + 1]

            if any(re.match(pattern, text, re.IGNORECASE) for pattern in father_name_patterns):
                cnic_data["Father_Name"] = ocr_text[i + 1]

            if any(re.match(pattern, text, re.IGNORECASE) for pattern in husband_name_patterns):
                cnic_data["Husband_Name"] = ocr_text[i + 1]

            if text in ["M", "F"]:
                cnic_data["Gender"] = text

            if re.match(r'^\d{5}[-+\s.:]?\d{7}[-+\s.:]?\d{1}$', text):
                cnic_data["Identity_Number"] = text.replace(" ", "-").replace("+", "-").replace(".", "-").replace(":", "-")

            if re.match(r'^\d{2}[-\.,/]\d{2}[-\.,/]\d{4}$', text):
                formatted_date = text.replace(".", "-").replace(",", "-").replace("/", "-")
                if not cnic_data["Date_of_Birth"]:
                    cnic_data["Date_of_Birth"] = formatted_date
                elif not cnic_data["Date_of_Issue"]:
                    cnic_data["Date_of_Issue"] = formatted_date
                elif not cnic_data["Date_of_Expiry"]:
                    cnic_data["Date_of_Expiry"] = formatted_date

        # Ensure "Father_Name" and "Husband_Name" are not both filled
        if cnic_data["Father_Name"]:
            cnic_data["Husband_Name"] = ""
        elif cnic_data["Husband_Name"]:
            cnic_data["Father_Name"] = ""

        # Remove empty fields
        cnic_data = {key: value for key, value in cnic_data.items() if value}

        return cnic_data

    def format_translated_text(self, translated_text):
        permanent_address = ""
        current_address = ""

        lines = translated_text.split("\n")

        for line in lines:
            if "Permanent Address" in line:
                permanent_address = line.replace("Permanent Address", "").strip()
            elif "Current Address" in line:
                current_address = line.replace("Current Address", "").strip()

        formatted_data = {}
        formatted_lines = [re.sub(r'^\d+\s*', '', line).strip() for line in lines if line.strip()]
        for i, line in enumerate(formatted_lines):
            formatted_data[f"Line_{i+1}"] = line

        return formatted_data

