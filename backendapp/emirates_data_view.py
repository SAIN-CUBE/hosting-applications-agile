# import os
# import time
# import cv2
# import shutil
# import warnings
# import numpy as np
# import logging
# from io import BytesIO
# from PIL import Image
# from datetime import datetime
# from django.http import JsonResponse
# from django.views import View
# from django.views.decorators.csrf import csrf_exempt
# from django.utils.decorators import method_decorator
# from ultralytics import YOLO
# import easyocr
# import fitz  # PyMuPDF
# from rest_framework.permissions import IsAuthenticated

# # Setup logging configuration
# logging.basicConfig(
#     filename='emirates_data_view.log',  # Log to file
#     level=logging.DEBUG,  # Set the lowest-severity log message level
#     format='%(asctime)s %(levelname)s: %(message)s',  # Log format
#     datefmt='%Y-%m-%d %H:%M:%S'
# )

# # Create logger
# logger = logging.getLogger(__name__)

# warnings.filterwarnings("ignore")


# @method_decorator(csrf_exempt, name='dispatch')
# class EmiratesDataView(View):
#     permission_classes = []

#     def get(self, request, *args, **kwargs):
#         return JsonResponse({'message': 'Please use POST method to ask a question.'})

#     def post(self, request, *args, **kwargs):
#         logger.info("Starting POST request processing...")
#         start_time = time.time()
#         file = request.FILES.get('file')

#         if file is None:
#             logger.warning("No file was provided in the request.")
#             return JsonResponse({"error": "No file was provided in the request."}, status=400)

#         logger.info(f"File received: {file.name}")

#         # Initialize models and readers
#         models = self.initialize_models()
#         rotation_map = {'0': 0, '90': 270, '180': 180, '270': 90}

#         try:
#             temp_file_path = self.save_temp_file(file)
#             logger.info(f"File saved temporarily at: {temp_file_path}")

#             processed_files = self.process_file(temp_file_path, rotation_map, models)

#             image_results = self.process_images(processed_files, models)

#             processing_time = time.time() - start_time
#             logger.info(f"Processing completed in {processing_time:.2f} seconds")

#             response_data = self.build_response(image_results, processing_time)

#             return JsonResponse(response_data)

#         except Exception as e:
#             logger.error(f"Error during processing: {str(e)}", exc_info=True)
#             return JsonResponse({"error": str(e)}, status=500)

#         finally:
#             self.cleanup(temp_file_path)

#     @staticmethod
#     def initialize_models():
#         logger.info("Initializing YOLO models and EasyOCR readers...")
#         return {
#             'driving_model': YOLO(r'backendapp/em_models/driving_front_back.pt'),
#             'id_model': YOLO(r'backendapp/em_models/ID_front_back.pt'),
#             'vehicle_model': YOLO(r'backendapp/em_models/vehicle_front_back.pt'),
#             'pass_model': YOLO(r'backendapp/em_models/pass.pt'),
#             'trade_model': YOLO(r'backendapp/em_models/trade.pt'),
#             'reader': easyocr.Reader(['en']),
#             'ar_en_reader': easyocr.Reader(['ar', 'en'])
#         }

#     @staticmethod
#     def save_temp_file(file):
#         temp_file_path = f"temp_{file.name}"
#         with open(temp_file_path, "wb") as buffer:
#             for chunk in file.chunks():
#                 buffer.write(chunk)
#         logger.info(f"Temporary file saved at {temp_file_path}")
#         return temp_file_path

#     def process_file(self, file_path, rotation_map, models):
#         logger.debug(f"Processing file: {file_path}")
#         if file_path.endswith('.pdf'):
#             logger.info("Detected PDF file format.")
#             return self.process_pdf(file_path)
#         else:
#             logger.info("Detected image file format.")
#             return self.process_image(file_path, models['id_model'], rotation_map)

#     @staticmethod
#     def process_pdf(pdf_path):
#         logger.info(f"Processing PDF file: {pdf_path}")
#         doc = fitz.open(pdf_path)
#         image_paths = []
#         pdf_images_dir = 'pdf_images'
#         os.makedirs(pdf_images_dir, exist_ok=True)

#         for i in range(len(doc)):
#             page = doc.load_page(i)
#             pix = page.get_pixmap()
#             img_path = os.path.join(pdf_images_dir, f"{os.path.splitext(os.path.basename(pdf_path))[0]}_page_{i + 1}.png")
#             pix.save(img_path)
#             image_paths.append(img_path)
#             logger.debug(f"Extracted image from PDF page {i + 1}: {img_path}")
#         return image_paths

#     def process_image(self, image_path, model, rotation_map):
#         logger.debug(f"Processing image: {image_path}")
#         results = model(source=image_path, save=True, conf=0.5)
#         processed_images = []

#         for i, result in enumerate(results):
#             processed_images.extend(self.handle_image_inference(result, i, rotation_map))

#         return processed_images

#     @staticmethod
#     def handle_image_inference(result, image_idx, rotation_map):
#         img = Image.open(result.path)
#         processed_images = []
#         logger.debug(f"Model inference result on image {image_idx}: {result.path}")

#         for j, box in enumerate(result.boxes.xyxy):
#             class_idx = int(result.boxes.cls[j].item())
#             class_name = result.names[class_idx]
#             parts = class_name.split('_')

#             processed_images.extend(
#                 EmiratesDataView.save_cropped_oriented_image(img, parts, box, j, rotation_map)
#             )
#         return processed_images

#     @staticmethod
#     def save_cropped_oriented_image(img, parts, box, j, rotation_map):
#         xmin, ymin, xmax, ymax = map(int, box)
#         cropped_dir = 'cropped_images'
#         oriented_dir = 'oriented_images'
#         os.makedirs(cropped_dir, exist_ok=True)
#         os.makedirs(oriented_dir, exist_ok=True)
#         processed_images = []

#         if len(parts) == 3:
#             doc_type, side, orient = parts
#             cropped_img, oriented_img_path = EmiratesDataView.crop_and_orient_image(
#                 img, (xmin, ymin, xmax, ymax), doc_type, side, orient, j, rotation_map, cropped_dir, oriented_dir
#             )
#             logger.debug(f"Cropped and oriented image saved: {oriented_img_path}")
#             processed_images.extend([cropped_img, oriented_img_path])
#         else:
#             processed_images.append(EmiratesDataView.save_non_cropped_image(img, parts, j, cropped_dir, oriented_dir))

#         return processed_images

#     @staticmethod
#     def crop_and_orient_image(img, box, doc_type, side, orient, idx, rotation_map, cropped_dir, oriented_dir):
#         cropped_img = img.crop(box)
#         cropped_img_name = f'{doc_type}_{side}_{orient}_{idx}_cropped.jpg'
#         cropped_img_path = os.path.join(cropped_dir, cropped_img_name)
#         cropped_img.save(cropped_img_path)

#         if orient in rotation_map:
#             rotation_angle = rotation_map[orient]
#             if rotation_angle != 0:
#                 cropped_img = cropped_img.rotate(rotation_angle, expand=True)

#         oriented_img_name = f'{doc_type}_{side}_{orient}_{idx}_oriented.jpg'
#         oriented_img_path = os.path.join(oriented_dir, oriented_img_name)
#         cropped_img.save(oriented_img_path)

#         return cropped_img_path, oriented_img_path

#     @staticmethod
#     def save_non_cropped_image(img, parts, idx, cropped_dir, oriented_dir):
#         doc_type, orient = parts[0], parts[1]
#         side = 'front'
#         non_cropped_img_name = f'{doc_type}_{side}_{orient}_{idx}_non_cropped.jpg'
#         non_cropped_img_path = os.path.join(cropped_dir, non_cropped_img_name)
#         img.save(non_cropped_img_path)

#         oriented_img_name = f'{doc_type}_{side}_{orient}_{idx}_oriented.jpg'
#         oriented_img_path = os.path.join(oriented_dir, oriented_img_name)
#         img.save(oriented_img_path)

#         return non_cropped_img_path, oriented_img_path

#     def process_images(self, processed_files, models):
#         image_results = []
#         for img_path in processed_files:
#             if "oriented_images" in img_path:
#                 img = cv2.imread(img_path)
#                 img_np = np.array(img)

#                 tokens_used = (img_np.shape[0] * img_np.shape[1]) // 1000
#                 doc_type = os.path.basename(img_path).split('_')[0]
#                 detected_info = self.detect_information_by_type(img_path, img, doc_type, models)

#                 image_results.append({
#                     "image_metadata": {
#                         "Image_Path": img_path,
#                         "Document_Type": doc_type,
#                         "Side": "front" if "front" in img_path else "back",
#                         "Tokens_Used": tokens_used
#                     },
#                     "detected_data": detected_info
#                 })
#                 logger.info(f"Processed {doc_type} document: {img_path}")
#         return image_results

#     @staticmethod
#     def detect_information_by_type(img_path, img, doc_type, models):
#         if 'ID' in img_path:
#             return EmiratesDataView.id_detection(img, models['id_model'], models['reader'])
#         elif 'Driving' in img_path:
#             return EmiratesDataView.driving_detection(img, models['driving_model'], models['reader'])
#         elif 'vehicle' in img_path:
#             return EmiratesDataView.vehicle_detection(img, models['vehicle_model'], models['ar_en_reader'])
#         elif 'pass' in img_path:
#             return EmiratesDataView.pass_certificate_detection(img, models['pass_model'], models['reader'])
#         elif 'trade' in img_path:
#             return EmiratesDataView.trade_certificate_detection(img, models['trade_model'], models['reader'])
#         else:
#             return {}

#     @staticmethod
#     def build_response(image_results, processing_time):
#         return {
#             "overall_metadata": {
#                 "Total_PTime": f"{processing_time:.2f} seconds",
#                 "Total_Tokens_Used": sum(result["image_metadata"]["Tokens_Used"] for result in image_results),
#                 "Timestamp": datetime.now().isoformat()
#             },
#             "images_results": image_results
#         }

#     @staticmethod
#     def cleanup(temp_file_path):
#         logger.info("Cleaning up temporary files and directories...")
#         os.remove(temp_file_path)
#         shutil.rmtree('cropped_images', ignore_errors=True)
#         shutil.rmtree('oriented_images', ignore_errors=True)
#         shutil.rmtree('pdf_images', ignore_errors=True)
#         logger.info("Cleanup completed.")

## updated
import cv2
import easyocr
import numpy as np
from ultralytics import YOLO
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status
from io import BytesIO
import time
from datetime import datetime
import json
import os
from PIL import Image
import fitz  # PyMuPDF
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import warnings
warnings.filterwarnings("ignore")

# Load the YOLO backendapp/em_models from backendapp/em_models directory
driving_model = YOLO("backendapp/em_models/driving_front_back.pt")
id_model = YOLO("backendapp/em_models/ID_front_back.pt")
vehicle_model = YOLO("backendapp/em_models/vehicle_front_back.pt")
pass_model = YOLO("backendapp/em_models/pass.pt")
trade_model = YOLO("backendapp/em_models/trade.pt")

# Load the OCR reader
reader = easyocr.Reader(['en'])
ar_en_reader = easyocr.Reader(['ar', 'en'])

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
    results = id_model.predict(img, line_width=2)
    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy()
        for box, cls in zip(boxes, result.boxes.cls):
            x1, y1, x2, y2 = map(int, box[:4])
            crop_img = img[y1:y2, x1:x2]
            crop_img = cv2.resize(crop_img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
            ID_results = reader.readtext(crop_img)       
            if ID_results:
                text = ID_results[0][1].strip()
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

    results = driving_model.predict(img, line_width=2)
    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy()
        for box, cls in zip(boxes, result.boxes.cls):
            x1, y1, x2, y2 = map(int, box[:4])
            crop_img = img[y1:y2, x1:x2]
            crop_img = cv2.resize(crop_img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
            ID_results = reader.readtext(crop_img)       
            if ID_results:
                text = ID_results[0][1].strip()
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
    

    results = vehicle_model.predict(img, line_width=1)
    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy()
        for box, cls in zip(boxes, result.boxes.cls):
            x1, y1, x2, y2 = map(int, box[:4])
            crop_img = img[y1:y2, x1:x2]
            crop_img = cv2.resize(crop_img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
            veh_results = ar_en_reader.readtext(crop_img)
            if veh_results:
                text = veh_results[0][1].strip()
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
    results = pass_model.predict(img, line_width=2)
    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy()
        for box, cls in zip(boxes, result.boxes.cls):
            x1, y1, x2, y2 = map(int, box[:4])
            crop_img = img[y1:y2, x1:x2]
            crop_img = cv2.resize(crop_img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
            ID_results = reader.readtext(crop_img)       
            if ID_results:
                text = ID_results[0][1].strip()
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

    results = trade_model.predict(img, line_width=2)
    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy()
        for box, cls in zip(boxes, result.boxes.cls):
            x1, y1, x2, y2 = map(int, box[:4])
            crop_img = img[y1:y2, x1:x2]
            crop_img = cv2.resize(crop_img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
            ID_results = reader.readtext(crop_img)       
            if ID_results:
                text = ID_results[0][1].strip()
                class_name = result.names[int(cls)]
                if class_name in class_names:
                    key = class_names[class_name]
                    detected_info[key] = text
    # Remove any null values from the detected_info dictionary
    return {k: v for k, v in detected_info.items() if v is not None}

# Django API View
@method_decorator(csrf_exempt, name='dispatch')
class EmiratesDataView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request, *args, **kwargs):
        start_time = time.time()
        try:
            # Retrieve uploaded file
            uploaded_file = request.FILES['file']
            temp_file_path = f"temp_{uploaded_file.name}"
            with open(temp_file_path, "wb") as buffer:
                buffer.write(uploaded_file.read())

            # Process the file
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
            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)

