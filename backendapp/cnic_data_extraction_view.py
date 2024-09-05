from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import JsonResponse
import torch
from PIL import Image
import io
import time
from datetime import datetime
import numpy as np
import cv2
import re
from ultralytics import YOLO
from deep_translator import GoogleTranslator
from .read import text_recognizer
from .model import Model
from .utils import CTCLabelConverter
import easyocr
from rest_framework.permissions import IsAuthenticated

# # Load Urdu glyphs
# with open("backendapp/models/UrduGlyphs.txt", "r", encoding="utf-8") as file:
#     urdu_content = file.read().replace('\n', '') + " "

# # Model configuration for Urdu OCR
# urdu_device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
# urdu_converter = CTCLabelConverter(urdu_content)
# urdu_recognition_model = Model(num_class=len(urdu_converter.character), device=urdu_device)
# urdu_recognition_model = urdu_recognition_model.to(urdu_device)
# urdu_recognition_model.load_state_dict(torch.load("backendapp/models/best_norm_ED.pth", map_location=urdu_device))
# urdu_recognition_model.eval()
# urdu_detection_model = YOLO("backendapp/models/yolov8m_UrduDoc.pt")

# # Model for detecting 'chip' class
# chip_detection_model = YOLO("backendapp/models/best.pt")


class ExtractOCRView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    authentication_classes = []  # Disable authentication for simplicity
    permission_classes = [IsAuthenticated]  # Disable permission for simplicity
    

    def post(self, request, format='jpg'):
        
        # Load Urdu glyphs
        with open("backendapp/models/UrduGlyphs.txt", "r", encoding="utf-8") as file:
            urdu_content = file.read().replace('\n', '') + " "

        # Model configuration for Urdu OCR
        urdu_device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        urdu_converter = CTCLabelConverter(urdu_content)
        urdu_recognition_model = Model(num_class=len(urdu_converter.character), device=urdu_device)
        urdu_recognition_model = urdu_recognition_model.to(urdu_device)
        urdu_recognition_model.load_state_dict(torch.load("backendapp/models/best_norm_ED.pth", map_location=urdu_device))
        urdu_recognition_model.eval()
        urdu_detection_model = YOLO("backendapp/models/yolov8m_UrduDoc.pt")

        # Model for detecting 'chip' class
        chip_detection_model = YOLO("backendapp/models/best.pt")
        
        
        file = request.FILES.get('cnic')
        print("file uploaded")

        # Check if the file is present in the request
        if file is None:
            return Response({"detail": "No file was provided in the request."}, status=400)

        # Check if the uploaded file is an image
        if not file.content_type.startswith('image'):
            return Response({"detail": "Invalid file type. Only image files are allowed."}, status=400)

        start_time = time.time()

        try:
            # Load image into numpy array
            img_np = self.load_image_into_numpy_array(file.read())

            # Calculate image resolution
            image_height, image_width = img_np.shape[:2]

            # Convert numpy array to PIL Image
            image = Image.fromarray(img_np)

            # Detect 'chip' class
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
                # Perform Urdu OCR
                detection_results = urdu_detection_model.predict(source=image, conf=0.5, imgsz=1280, save=False, nms=True, device=urdu_device)
                bounding_boxes = detection_results[0].boxes.xyxy.cpu().numpy().tolist()
                bounding_boxes.sort(key=lambda x: x[1])

                # Crop the detected lines
                cropped_images = [image.crop(box) for box in bounding_boxes]

                # Recognize the text
                texts = [text_recognizer(img, urdu_recognition_model, urdu_converter, urdu_device) for img in cropped_images]
                urdu_text = "\n".join(texts)

                # Translate to English
                translated_text = GoogleTranslator(source='ur', target='en').translate(urdu_text)

                # Process and format data
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

            return JsonResponse(response_data)

        except Exception as e:
            print(f"Exception occurred: {e}")
            return Response({"detail": "Internal Server Error"}, status=500)

    def load_image_into_numpy_array(self, image_bytes):
        image = Image.open(io.BytesIO(image_bytes))
        img_np = np.array(image)
        return img_np

    def perform_ocr(self, image_bytes, languages):
        reader = easyocr.Reader(languages)
        result = reader.readtext(image_bytes)
        return result

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