from django.conf import settings
import cv2
import base64
import tempfile
import numpy as np
from ultralytics import YOLO
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status
from io import BytesIO
import time
from datetime import datetime
from rest_framework.parsers import JSONParser
import os
import re, shutil
from PIL import Image
import fitz  # PyMuPDF
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import warnings
from rest_framework.permissions import AllowAny, IsAuthenticated
from .logger.logger import logging
from .models import AITool, Credit, ToolUsage, ApiCallLog
from django.utils.timezone import now
from .authentication import SIDAuthentication
warnings.filterwarnings("ignore")

# # Load the YOLO backendapp/em_models from backendapp/em_models directory
# driving_model = YOLO("backendapp/em_models/driving_front_back.pt")
# id_model = YOLO("backendapp/em_models/ID_front_back.pt")
# vehicle_model = YOLO("backendapp/em_models/vehicle_front_back.pt")
# pass_model = YOLO("backendapp/em_models/pass.pt")
# trade_model = YOLO("backendapp/em_models/trade.pt")

# # Load the OCR reader
# reader = easyocr.Reader(['en'])
# ar_en_reader = easyocr.Reader(['ar', 'en'])

special_chars = r'[!@#$%^&*()_+=\[\]{};:\'",.<>?`~]'

# Utility functions for processing
def process_file(file_path: str, model_path: str = 'backendapp/em_models/classify.pt', cropped_dir: str = 'cropped_images', oriented_dir: str = 'oriented_images'):
    model_classify = YOLO(model_path)
    os.makedirs(cropped_dir, exist_ok=True)
    os.makedirs(oriented_dir, exist_ok=True)

    rotation_map = {'0': 0, '90': 270, '180': 180, '270': 90}

    def process_pdf(pdf_path, dpi=300):
        doc = fitz.open(pdf_path)
        image_paths = []
        for i in range(len(doc)):
            page = doc[i]
            zoom = dpi / 72
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat, alpha=False)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            img_path = f"{os.path.splitext(pdf_path)[0]}_page_{i + 1}.png"
            img.save(img_path, format="PNG", dpi=(dpi, dpi), quality=95)
            image_paths.append(img_path)
        doc.close()
        return image_paths

    def process_image(image_path):
        results = model_classify(source=image_path, save=True, conf=0.5)
        processed_images = []
        for i, result in enumerate(results):
            img = Image.open(result.path)
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            for j, box in enumerate(result.boxes.xyxy):
                class_idx = int(result.boxes.cls[j].item())
                class_name = result.names[class_idx]
                parts = class_name.split('_')
                if len(parts) == 3:
                    doc_type, side, orient = parts
                    xmin, ymin, xmax, ymax = map(int, box)
                    cropped_img = img.crop((xmin, ymin, xmax, ymax))
                    cropped_img_name = f'{doc_type}_{side}_{orient}_{i}_{j}_cropped.jpg'
                    cropped_img_path = os.path.join(cropped_dir, cropped_img_name)
                    cropped_img.save(cropped_img_path)
                    processed_images.append(cropped_img_path)
                    if orient in rotation_map:
                        rotation_angle = rotation_map[orient]
                        if rotation_angle != 0:
                            cropped_img = cropped_img.rotate(rotation_angle, expand=True)
                    oriented_img_name = f'{doc_type}_{side}_{orient}_{i}_{j}_oriented.jpg'
                    oriented_img_path = os.path.join(oriented_dir, oriented_img_name)
                    cropped_img.save(oriented_img_path)
                    processed_images.append(oriented_img_path)
        return processed_images

    processed_files = []
    if file_path.endswith('.pdf'):
        image_paths = process_pdf(file_path)
        for img_path in image_paths:
            processed_files.extend(process_image(img_path))
    else:
        processed_files.extend(process_image(file_path))
    return processed_files

# Function for ID card detection and extraction
def id(img):
    class_names = {
        'Name': 'Name',
        'ID Number': 'ID Number',
        'Expiry Date': 'Expiry Date',
        'Date of birth': 'Date of birth',
        'Nationality': 'Nationality',
        'Card Number': 'Card Number',
        'Employer': 'Employer',
        'Occupation': 'Occupation',
        'Place of issue': 'Place of issue',
        'Issue Date' : 'Issue Date'
        }
    detected_info = {
        'Name': None,
        'ID Number': None,
        'Expiry Date': None,
        'Date of birth': None,
        'Nationality': None,
        'Card Number': None,
        'Employer': None,
        'Occupation': None,
        'Place of issue': None,
        'Issue Date': None
    }
    id_model = settings.ID_MODEL
    results = id_model.predict(img, line_width=2)
    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy()
        for box, cls in zip(boxes, result.boxes.cls):
            x1, y1, x2, y2 = map(int, box[:4])
            crop_img = img[y1:y2, x1:x2]
            crop_img = cv2.resize(crop_img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
            ID_results = settings.READER.readtext(crop_img)       
            if ID_results:
                text = ID_results[0][1].strip()
                text = re.sub(special_chars, '', text)
                class_name = result.names[int(cls)]
                if class_name in class_names:
                    key = class_names[class_name]
                    detected_info[key] = text
    # Remove any null values from the detected_info dictionary
    return {k: v for k, v in detected_info.items() if v is not None}



# Function for driving license detection and extraction
def driving(img):
    class_names = {
        'Customer Name': 'Customer Name',
        'DOB': 'DOB',
        'Expiry date': 'Expiry date',
        'Issue Date': 'Issue Date',
        'License No': 'License No',
        'Nationality': 'Nationality',
        'Place of Issue': 'Place of Issue',
        'Traffic Code No': 'Traffic Code No'
    }

    detected_info = {
        'Customer Name': None,
        'DOB': None,
        'Expiry date': None,
        'Issue Date': None,
        'License No': None,
        'Nationality': None,
        'Place of Issue': None,
        'Traffic Code No': None
    }

    driving_model = settings.DRIVING_MODEL
    results = driving_model.predict(img, line_width=2)
    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy()
        for box, cls in zip(boxes, result.boxes.cls):
            x1, y1, x2, y2 = map(int, box[:4])
            crop_img = img[y1:y2, x1:x2]
            crop_img = cv2.resize(crop_img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
            ID_results = settings.READER.readtext(crop_img)       
            if ID_results:
                text = ID_results[0][1].strip()
                text = re.sub(special_chars, '', text)
                class_name = result.names[int(cls)]
                if class_name in class_names:
                    key = class_names[class_name]
                    detected_info[key] = text
    # Remove any null values from the detected_info dictionary
    return {k: v for k, v in detected_info.items() if v is not None}



# Function for vehicle registration detection and extraction
def vehicle(img):
    class_names = {
        "TC no":  "TC no",
        "Insurance company": "Insurance company",
        'Reg date' : 'Reg date',
        'Exp date':'Exp date',
        'Ins Exp': 'Ins Exp',
        'Owner': 'Owner',
        "place of issue":'place of issue',
        "nationality":'nationality',
        "Model":'Model',
        "Origin":'Origin',
        "veh type":'veh type',
        "Eng no":'Eng no',
        "chassis no":'chassis no'}
    
    detected_info = {
        "TC no": None,
        "Insurance company": None,
        'Reg date': None,
        'Exp date': None,
        'Ins Exp': None,
        'Owner': None,
        "place of issue": None,
        "nationality": None,
        "Model": None,
        "Origin": None,
        "veh type": None,
        "Eng no": None,
        "chassis no": None}
    
    vehicle_model = settings.VEHICLE_MODEL
    results = vehicle_model.predict(img, line_width=1)
    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy()
        for box, cls in zip(boxes, result.boxes.cls):
            x1, y1, x2, y2 = map(int, box[:4])
            crop_img = img[y1:y2, x1:x2]
            crop_img = cv2.resize(crop_img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
            veh_results = settings.AR_EN_READER.readtext(crop_img)
            if veh_results:
                text = veh_results[0][1].strip()
                text = re.sub(special_chars, '', text)
                class_name = result.names[int(cls)]
                if class_name in class_names:
                    key = class_names[class_name]
                    detected_info[key] = text
    return {k: v for k, v in detected_info.items() if v is not None}


# Function for Pass
def pass_certificate(img):
    class_names = {
        'inspection date': 'inspection date'
        }
    detected_info = {
        'inspection date': None
    }
    pass_model = settings.PASS_MODEL
    results = pass_model.predict(img, line_width=2)
    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy()
        for box, cls in zip(boxes, result.boxes.cls):
            x1, y1, x2, y2 = map(int, box[:4])
            crop_img = img[y1:y2, x1:x2]
            crop_img = cv2.resize(crop_img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
            ID_results = settings.READER.readtext(crop_img)       
            if ID_results:
                text = ID_results[0][1].strip()
                text = re.sub(special_chars, '', text)
                class_name = result.names[int(cls)]
                if class_name in class_names:
                    key = class_names[class_name]
                    detected_info[key] = text
    # Remove any null values from the detected_info dictionary
    return {k: v for k, v in detected_info.items() if v is not None}
      


def trade_certificate(img):
    class_names = {
        'Trade Name': 'trade name',
        'Issue Date': 'issue date',
        'Exp Date': 'exp date',
        'activity': 'activity'
    }
    detected_info = {
        'trade name': None,
        'issue date': None,
        'exp date': None,
        'activity': None
    }

    trade_model = settings.TRADE_MODEL
    results = trade_model.predict(img, line_width=2)
    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy()
        for box, cls in zip(boxes, result.boxes.cls):
            x1, y1, x2, y2 = map(int, box[:4])
            crop_img = img[y1:y2, x1:x2]
            crop_img = cv2.resize(crop_img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
            ID_results = settings.READER.readtext(crop_img)       
            if ID_results:
                text = ID_results[0][1].strip()
                text = re.sub(special_chars, '', text)
                class_name = result.names[int(cls)]
                if class_name in class_names:
                    key = class_names[class_name]
                    detected_info[key] = text
    # Remove any null values from the detected_info dictionary
    return {k: v for k, v in detected_info.items() if v is not None}


@method_decorator(csrf_exempt, name='dispatch')
class EmiratesDataView(APIView):
    parser_classes = [MultiPartParser]
    authentication_classes = [SIDAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        start_time = time.time()
        try:
            # Retrieve multiple uploaded files
            uploaded_files = request.FILES.getlist('file')
            
            # Extract the source identifier from custom header or fallback to "api"
            source = request.headers.get('Call-Source', 'api')  # Default to 'api' if header not provided

            # Validate source (only allow "app" or "api")
            if source not in ['app', 'api']:
                return Response({'error': 'Invalid source. Must be "app" or "api".'}, status=400)
            
            if not uploaded_files:
                return Response({"error": "No files uploaded"}, status=status.HTTP_400_BAD_REQUEST)

            all_image_results = []  # To store results for each file
            tokens = 0
            for uploaded_file in uploaded_files:
                temp_file_path = f"temp_{uploaded_file.name}"
                with open(temp_file_path, "wb") as buffer:
                    buffer.write(uploaded_file.read())

                # Process each file
                processed_files = process_file(temp_file_path)

                # Initialize a list to hold the detected information for each image
                image_results = []
                oriented_files = [file for file in processed_files if 'oriented' in file]
                for oriented_file in oriented_files:
                    img = cv2.imread(oriented_file)
                    img_np = np.array(img)
                    image_height, image_width = img_np.shape[:2]
                    tokens_used = (image_height * image_width) // 1000
                    file_name = os.path.basename(oriented_file)
                    doc_type = file_name.split('_')[0]
                    if 'ID' in oriented_file:
                        detected_info = id(img)
                    elif 'Driving' in oriented_file:
                        detected_info = driving(img)
                    elif 'vehicle' in oriented_file:
                        detected_info = vehicle(img)
                    elif 'pass' in oriented_file:
                        detected_info = pass_certificate(img)
                    elif 'trade' in oriented_file:
                        detected_info = trade_certificate(img)
                    else:
                        detected_info = {}
                    image_result = {
                        "image_metadata": {
                            "Image_Path": oriented_file,
                            "Document_Type": doc_type,
                            "side": "front" if "front" in oriented_file else "back",
                            "Tokens_Used": tokens_used
                        },
                        "detected_data": detected_info
                    }
                    
                    tokens  += tokens_used

                    image_results.append(image_result)

                # Append results of the current file to the overall results
                all_image_results.append({
                    "file_name": uploaded_file.name,
                    "file_results": image_results
                })

                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)

            processing_time = time.time() - start_time
            response_data = {
                "overall_metadata": {
                    "Total_PTime": f"{processing_time:.2f} seconds",
                    "Timestamp": datetime.now().isoformat()
                },
                "files_results": all_image_results
            }
            
            # print("tokens", tokens)
            
            try:
                logging.info("Deducting credits...")
                self.deduct_credits(request.user, tokens//100, "emirates-data-extraction", source)
                logging.info(f"Credits deducted for {request.user.email} for emirates-data-extraction")
                return Response(response_data, status=status.HTTP_200_OK)
            except Exception as e:
                print(f"Error creating ApiCallLog: {e}")
                raise e
                
            # return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                shutil.rmtree(os.path.join(os.getcwd(),'cropped_images'))
                shutil.rmtree(os.path.join(os.getcwd(),'oriented_images'))


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
            # print(credits.remaining_credits)
            # print(tokens_used)

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
                        tool_name='emirates-data-extraction',
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

@method_decorator(csrf_exempt, name='dispatch')
class EmiratesEncodedImageView(APIView):
    parser_classes = [MultiPartParser]
    permission_classes = [IsAuthenticated]
    authentication_classes = [SIDAuthentication]

    def post(self, request):
        data = JSONParser().parse(request)
        base64_data = data.get('data')
        file_ext = data.get('ext')
        
        # Extract the source identifier from custom header or fallback to "api"
        source = request.headers.get('Call-Source', 'api')  # Default to 'api' if header not provided

        # Validate source (only allow "app" or "api")
        if source not in ['app', 'api']:
            return Response({'error': 'Invalid source. Must be "app" or "api".'}, status=400)

        if not base64_data or not file_ext:
            return Response({"error": "Invalid input"}, status=status.HTTP_400_BAD_REQUEST)

        start_time = time.time()

        try:
            file_bytes = base64.b64decode(base64_data)
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
                temp_file.write(file_bytes)
                temp_file_path = temp_file.name

            processed_files = process_file(temp_file_path)

            image_results = []
            oriented_files = [file for file in processed_files if 'oriented' in file]

            for oriented_file in oriented_files:
                img = cv2.imread(oriented_file)
                img_np = np.array(img)
                image_height, image_width = img_np.shape[:2]
                tokens_used = (image_height * image_width) // 1000

                file_name = os.path.basename(oriented_file)
                doc_type = file_name.split('_')[0]

                if 'ID' in oriented_file:
                    detected_info = id(img)
                elif 'Driving' in oriented_file:
                    detected_info = driving(img)
                elif 'vehicle' in oriented_file:
                    detected_info = vehicle(img)
                elif 'pass' in oriented_file:
                    detected_info = pass_certificate(img)
                elif 'trade' in oriented_file:
                    detected_info = trade_certificate(img)
                else:
                    detected_info = {}

                image_result = {
                    "image_metadata": {
                        "Image_Path": oriented_file,
                        "Document_Type": doc_type,
                        "side": "front" if "front" in oriented_file else "back",
                        "Tokens_Used": tokens_used
                    },
                    "detected_data": detected_info
                }

                image_results.append(image_result)

            processing_time = time.time() - start_time

            response_data = {
                "overall_metadata": {
                    "Total_PTime": f"{processing_time:.2f} seconds",
                    "Total_Tokens_Used": sum([result['image_metadata']['Tokens_Used'] for result in image_results]),
                    "Timestamp": datetime.now().isoformat()
                },
                "images_results": image_results
            }

            
            # print("tokens", tokens_used)
            try:
                logging.info("Deducting credits...")
                self.deduct_credits(request.user, tokens_used//100, "emirates-data-extraction", source)
                logging.info(f"Credits deducted for {request.user.email} for emirates-data-extraction")
                return Response(response_data, status=status.HTTP_200_OK)
            except Exception as e:
                print(f"Error creating ApiCallLog: {e}")
                raise e

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        finally:
            if 'temp_file_path' in locals():
                os.remove(temp_file_path)
                
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
            # print(credits.remaining_credits)
            # print(tokens_used)

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
                        tool_name='emirates-data-extraction',
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

    