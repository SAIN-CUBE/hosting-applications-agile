# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework.parsers import MultiPartParser, FormParser
# from django.http import JsonResponse
# import torch
# from PIL import Image
# import cv2
# import io
# import time
# from datetime import datetime
# import numpy as np
# from ultralytics import YOLO
# import easyocr

# # Load the models
# model = YOLO(r'backendapp/emirates_models/front.pt')
# model_back = YOLO(r'backendapp/emirates_models/back.pt')
# new_model = YOLO(r'backendapp/emirates_models/certificate.pt')
# reader = easyocr.Reader(['en'])
# reader_vehicle = easyocr.Reader(['en', 'ar'])


# def read_image(file_stream: io.BytesIO) -> np.ndarray:
#     file_bytes = np.asarray(bytearray(file_stream.read()), dtype=np.uint8)
#     img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
#     return img


# def certificate(img):
#     class_names = {'inspection date': 'inspection date'}
#     detected_info = {"inspection date": None}
#     results = new_model.predict(source=img)
#     for result in results:
#         boxes = result.boxes.xyxy.cpu().numpy()
#         for box, cls in zip(boxes, result.boxes.cls):
#             x1, y1, x2, y2 = map(int, box)
#             crop_img = img[y1:y2, x1:x2]
#             results = reader.readtext(crop_img)
#             if results:
#                 text = results[0][1].strip().lower()
#                 class_name = result.names[int(cls)].lower()
#                 if class_name in class_names:
#                     key = class_names[class_name]
#                     detected_info[key] = text
#     return detected_info


# def driving(img):
#     class_names = {
#         'issue date': 'issue date',
#         'date of birth': 'date of birth',
#         'exp date': 'exp date',
#         'nationality': 'nationality',
#         'name': 'name',
#         'licence-no': 'licence-no'
#     }
#     detected_info = {
#         "issue date": None,
#         "date of birth": None,
#         "exp date": None,
#         "nationality": None,
#         "name": None,
#         "licence-no": None
#     }
#     results = model.predict(source=img)
#     for result in results:
#         boxes = result.boxes.xyxy.cpu().numpy()
#         for box, cls in zip(boxes, result.boxes.cls):
#             x1, y1, x2, y2 = map(int, box)
#             crop_img = img[y1:y2, x1:x2]
#             dr_results = reader.readtext(crop_img)
#             if dr_results:
#                 text = dr_results[0][1].strip().lower()
#                 class_name = result.names[int(cls)].lower()
#                 if class_name in class_names:
#                     key = class_names[class_name]
#                     detected_info[key] = text
#     return detected_info


# def back_driving(img):
#     class_names = {'traffic code': 'traffic Code'}
#     detected_info = {"traffic Code": None}
#     results = model_back.predict(source=img)
#     for result in results:
#         boxes = result.boxes.xyxy.cpu().numpy()
#         for box, cls in zip(boxes, result.boxes.cls):
#             x1, y1, x2, y2 = map(int, box)
#             crop_img = img[y1:y2, x1:x2]
#             back_driving_results = reader.readtext(crop_img)
#             if back_driving_results:
#                 text = back_driving_results[0][1].strip().lower()
#                 class_name = result.names[int(cls)].lower()
#                 if class_name in class_names:
#                     key = class_names[class_name]
#                     detected_info[key] = text
#     return detected_info


# def id(img):
#     class_names = {
#         'name': 'name',
#         'emirates id': 'emirates ID',
#         'exp date': 'exp date',
#         'date of birth': 'date of birth'
#     }
#     detected_info = {
#         'name': None,
#         'emirates ID': None,
#         'exp date': None,
#         'date of birth': None
#     }
#     results = model.predict(source=img)
#     for result in results:
#         boxes = result.boxes.xyxy.cpu().numpy()
#         for box, cls in zip(boxes, result.boxes.cls):
#             x1, y1, x2, y2 = map(int, box)
#             crop_img = img[y1:y2, x1:x2]
#             ID_results = reader.readtext(crop_img)
#             if ID_results:
#                 text = ID_results[0][1].strip().lower()
#                 class_name = result.names[int(cls)].lower()
#                 if class_name in class_names:
#                     key = class_names[class_name]
#                     detected_info[key] = text
#     return detected_info


# def id_back(img):
#     class_names = {
#         'employer': 'employer',
#         'occupation': 'occupation',
#         'card-number': 'card-number',
#         'place of issue': 'place of issue'
#     }
#     detected_info = {
#         "employer": None,
#         "occupation": None,
#         "card-number": None,
#         "place of issue": None
#     }
#     results = model_back.predict(source=img)
#     for result in results:
#         boxes = result.boxes.xyxy.cpu().numpy()
#         for box, cls in zip(boxes, result.boxes.cls):
#             x1, y1, x2, y2 = map(int, box)
#             crop_img = img[y1:y2, x1:x2]
#             back_id_results = reader.readtext(crop_img)
#             if back_id_results:
#                 text = back_id_results[0][1].strip().lower()
#                 class_name = result.names[int(cls)].lower()
#                 if class_name in class_names:
#                     key = class_names[class_name]
#                     detected_info[key] = text
#     return detected_info


# def vehicle(img):
#     class_names = {
#         "tc": "TC",
#         "insurance company": "Insurance company",
#         'vehicle license': "vehicle license",
#         'reg date': 'reg date',
#         'exp date': 'exp date',
#         'ins date': 'ins date',
#         'owner': 'owner',
#         "place of issue": 'place of issue',
#         "nationality": 'nationality'
#     }
#     detected_info = {
#         "vehicle license": None,
#         "reg date": None,
#         "exp date": None,
#         "ins date": None,
#         "owner": None,
#         "Insurance company": None,
#         "TC": None,
#         "place of issue": None,
#         "nationality": None
#     }
#     results = model.predict(source=img)
#     for result in results:
#         boxes = result.boxes.xyxy.cpu().numpy()
#         for box, cls in zip(boxes, result.boxes.cls):
#             x1, y1, x2, y2 = map(int, box)
#             crop_img = img[y1:y2, x1:x2]
#             veh_results = reader_vehicle.readtext(crop_img)
#             if veh_results:
#                 text = veh_results[0][1].strip()
#                 class_name = result.names[int(cls)].lower()
#                 if class_name in class_names:
#                     key = class_names[class_name]
#                     detected_info[key] = text
#     return detected_info


# def back_vehic(img):
#     class_names = {
#         'model': 'model',
#         'chassis no': 'chassis no',
#         'origin': 'origin',
#         'eng no': 'eng no',
#         'veh type': 'veh type'
#     }
#     detected_info = {
#         "model": None,
#         "chassis no": None,
#         "origin": None,
#         "eng no": None,
#         "veh type": None
#     }
#     results = model_back.predict(source=img)
#     for result in results:
#         boxes = result.boxes.xyxy.cpu().numpy()
#         for box, cls in zip(boxes, result.boxes.cls):
#             x1, y1, x2, y2 = map(int, box)
#             crop_img = img[y1:y2, x1:x2]
#             back_vehicle_results = reader.readtext(crop_img)
#             if back_vehicle_results:
#                 text = back_vehicle_results[0][1].strip().lower()
#                 class_name = result.names[int(cls)].lower()
#                 if class_name in class_names:
#                     key = class_names[class_name]
#                     detected_info[key] = text
#     return detected_info


# def trade(img):
#     class_names = {
#         'trade name': 'trade name',
#         'issue date': 'issue date',
#         'exp date': 'exp date'
#     }
#     detected_info = {
#         "trade name": None,
#         "issue date": None,
#         "exp date": None
#     }
#     results = new_model.predict(source=img)
#     for result in results:
#         boxes = result.boxes.xyxy.cpu().numpy()
#         for box, cls in zip(boxes, result.boxes.cls):
#             x1, y1, x2, y2 = map(int, box)
#             crop_img = img[y1:y2, x1:x2]
#             trades = reader.readtext(crop_img)
#             if trades:
#                 detected_text = trades[0][1].strip().lower()
#                 class_name = result.names[int(cls)].lower()
#                 if class_name in class_names:
#                     key = class_names[class_name]
#                     detected_info[key] = detected_text
#     return detected_info


# def detect_document_type(img):
#     results = model.predict(source=img)
#     detected_classes = [results[0].names[int(cls)] for cls in results[0].boxes.cls.cpu().numpy()]

#     back_res = model_back.predict(source=img)
#     detected_back_classes = [back_res[0].names[int(cls)] for cls in back_res[0].boxes.cls.cpu().numpy()]

#     certificate_doc = new_model.predict(source=img)
#     new_classes = [certificate_doc[0].names[int(cls)] for cls in certificate_doc[0].boxes.cls.cpu().numpy()]

#     if any("emirates ID" in cls for cls in detected_classes):
#         return "front", id(img)
#     elif any("licence-no" in cls for cls in detected_classes):
#         return "front", driving(img)
#     elif any("vehicle license" in cls for cls in detected_classes):
#         return "front", vehicle(img)

#     if any("model" in cls for cls in detected_back_classes):
#         return "back", back_vehic(img)
#     elif any("traffic code" in cls for cls in detected_back_classes):
#         return "back", back_driving(img)
#     elif any("card-number" in cls for cls in detected_back_classes):
#         return "back", id_back(img)

#     if any("commercial license" in cls for cls in new_classes):
#         return "front", trade(img)
#     elif any("test certificate" in cls for cls in new_classes):
#         return "front", certificate(img)

#     return {"message": "Document type not recognized"}


# class UploadImageView(APIView):
#     parser_classes = [MultiPartParser, FormParser]

#     def post(self, request, format=None):
#         start_time = time.time()
#         file = request.FILES.get('file')

#         if file is None:
#             return Response({"detail": "No file was provided in the request."}, status=400)

#         try:
#             img = read_image(io.BytesIO(file.read()))
#             image_height, image_width = img.shape[:2]
#             tokens_used = (image_height * image_width) // 1000

#             side, detected_info = detect_document_type(img)

#             processing_time = time.time() - start_time
#             response_data = {
#                 "metadata": {
#                     "Side": side,
#                     "PTime": f"{processing_time:.2f} seconds",
#                     "Tokens_Used": tokens_used,
#                     "Timestamp": datetime.now().isoformat()
#                 },
#                 "data": detected_info
#             }
#             return JsonResponse(response_data)

#         except Exception as e:
#             return JsonResponse({"error": str(e)}, status=500)

import os
import time
import cv2
import shutil
import warnings
import numpy as np
from io import BytesIO
from PIL import Image
from datetime import datetime
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from ultralytics import YOLO
import easyocr
import fitz  # PyMuPDF
from rest_framework.permissions import IsAuthenticated

warnings.filterwarnings("ignore")

@method_decorator(csrf_exempt, name='dispatch')
class EmiratesDataView(View):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        return JsonResponse({'message': 'Please use POST method to ask a question.'})
    def post(self, request, *args, **kwargs):
        start_time = time.time()
        file = request.FILES.get('file')

        if file is None:
            return JsonResponse({"error": "No file was provided in the request."}, status=400)

        # Initialize models and readers
        model = YOLO(r'backendapp/em_models/front.pt')
        model_back = YOLO(r'backendapp/em_models/back.pt')
        new_model = YOLO(r'backendapp/em_models/certificate.pt')
        reader = easyocr.Reader(['en'])
        reader_vehicle = easyocr.Reader(['en', 'ar'])

        # Rotation map to correct orientations
        rotation_map = {
            '0': 0,
            '90': 270,
            '180': 180,
            '270': 90,
        }

        def process_file(file_path: str, model_path: str = 'backendapp/em_models/classification.pt'):
            model = YOLO(model_path)
            cropped_dir = 'cropped_images'
            oriented_dir = 'oriented_images'
            pdf_images_dir = 'pdf_images'
            os.makedirs(cropped_dir, exist_ok=True)
            os.makedirs(oriented_dir, exist_ok=True)
            os.makedirs(pdf_images_dir, exist_ok=True)

            def process_pdf(pdf_path):
                doc = fitz.open(pdf_path)
                image_paths = []
                for i in range(len(doc)):
                    page = doc.load_page(i)
                    pix = page.get_pixmap()
                    img_path = os.path.join(pdf_images_dir, f"{os.path.splitext(os.path.basename(pdf_path))[0]}_page_{i + 1}.png")
                    pix.save(img_path)
                    image_paths.append(img_path)
                return image_paths

            def process_image(image_path):
                results = model(source=image_path, save=True, conf=0.5)
                processed_images = []
                for i, result in enumerate(results):
                    img = Image.open(result.path)
                    for j, box in enumerate(result.boxes.xyxy):
                        class_idx = int(result.boxes.cls[j].item())
                        class_name = result.names[class_idx]
                        orient = class_name.split('_')[-1]
                        xmin, ymin, xmax, ymax = map(int, box)
                        cropped_img = img.crop((xmin, ymin, xmax, ymax))

                        cropped_img_name = f'{class_name}_{i}_{j}_cropped.jpg'
                        cropped_img_path = os.path.join(cropped_dir, cropped_img_name)
                        cropped_img.save(cropped_img_path)
                        processed_images.append(cropped_img_path)

                        if orient in rotation_map:
                            rotation_angle = rotation_map[orient]
                            if rotation_angle != 0:
                                cropped_img = cropped_img.rotate(rotation_angle, expand=True)

                        oriented_img_name = f'{class_name}_{i}_{j}_oriented.jpg'
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

        def certificate(img):
            class_names = {'inspection date': 'inspection date'}
            detected_info = {"inspection date": None}
            results = new_model.predict(source=img)
            for result in results:
                boxes = result.boxes.xyxy.cpu().numpy()
                for box, cls in zip(boxes, result.boxes.cls):
                    x1, y1, x2, y2 = map(int, box)
                    crop_img = img[y1:y2, x1:x2]
                    results = reader.readtext(crop_img)
                    if results:
                        text = results[0][1].strip().lower()
                        class_name = result.names[int(cls)].lower()
                        if class_name in class_names:
                            key = class_names[class_name]
                            detected_info[key] = text
            return detected_info

        def driving(img):
            class_names = {
                'issue date': 'issue date',
                'date of birth': 'date of birth',
                'exp date': 'exp date',
                'nationality': 'nationality',
                'name': 'name',
                'licence-no': 'licence-no'
            }
            detected_info = {
                "issue date": None,
                "date of birth": None,
                "exp date": None,
                "nationality": None,
                "name": None,
                "licence-no": None
            }
            results = model.predict(source=img)
            for result in results:
                boxes = result.boxes.xyxy.cpu().numpy()
                for box, cls in zip(boxes, result.boxes.cls):
                    x1, y1, x2, y2 = map(int, box)
                    crop_img = img[y1:y2, x1:x2]
                    dr_results = reader.readtext(crop_img)
                    if dr_results:
                        text = dr_results[0][1].strip().lower()
                        class_name = result.names[int(cls)].lower()
                        if class_name in class_names:
                            key = class_names[class_name]
                            detected_info[key] = text
            return detected_info

        def back_driving(img):
            class_names = {'traffic code': 'traffic Code'}
            detected_info = {"traffic Code": None}
            results = model_back.predict(source=img)
            for result in results:
                boxes = result.boxes.xyxy.cpu().numpy()
                for box, cls in zip(boxes, result.boxes.cls):
                    x1, y1, x2, y2 = map(int, box)
                    crop_img = img[y1:y2, x1:x2]
                    back_driving_results = reader.readtext(crop_img)
                    if back_driving_results:
                        text = back_driving_results[0][1].strip().lower()
                        class_name = result.names[int(cls)].lower()
                        if class_name in class_names:
                            key = class_names[class_name]
                            detected_info[key] = text
            return detected_info

        def id(img):
            class_names = {
                'name': 'name',
                'emirates id': 'emirates ID',
                'exp date': 'exp date',
                'date of birth': 'date of birth'
            }
            detected_info = {
                'name': None,
                'emirates ID': None,
                'exp date': None,
                'date of birth': None
            }
            results = model.predict(source=img)
            for result in results:
                boxes = result.boxes.xyxy.cpu().numpy()
                for box, cls in zip(boxes, result.boxes.cls):
                    x1, y1, x2, y2 = map(int, box)
                    crop_img = img[y1:y2, x1:x2]
                    ID_results = reader.readtext(crop_img)
                    if ID_results:
                        text = ID_results[0][1].strip().lower()
                        class_name = result.names[int(cls)].lower()
                        if class_name in class_names:
                            key = class_names[class_name]
                            detected_info[key] = text
            return detected_info

        def id_back(img):
            class_names = {
                'employer': 'employer',
                'occupation': 'occupation',
                'card-number': 'card-number',
                'place of issue': 'place of issue'
            }
            detected_info = {
                "employer": None,
                "occupation": None,
                "card-number": None,
                "place of issue": None
            }
            results = model_back.predict(source=img)
            for result in results:
                boxes = result.boxes.xyxy.cpu().numpy()
                for box, cls in zip(boxes, result.boxes.cls):
                    x1, y1, x2, y2 = map(int, box)
                    crop_img = img[y1:y2, x1:x2]
                    back_id_results = reader.readtext(crop_img)
                    if back_id_results:
                        text = back_id_results[0][1].strip().lower()
                        class_name = result.names[int(cls)].lower()
                        if class_name in class_names:
                            key = class_names[class_name]
                            detected_info[key] = text
            return detected_info

        def vehicle(img):
            class_names = {
                "tc": "TC",
                "insurance company": "Insurance company",
                'vehicle license': "vehicle license",
                'reg date': 'reg date',
                'exp date': 'exp date',
                'ins date': 'ins date',
                'owner': 'owner',
                "place of issue": 'place of issue',
                "nationality": 'nationality'
            }
            detected_info = {
                "vehicle license": None,
                "reg date": None,
                "exp date": None,
                "ins date": None,
                "owner": None,
                "Insurance company": None,
                "TC": None,
                "place of issue": None,
                "nationality": None
            }
            results = model.predict(source=img)
            for result in results:
                boxes = result.boxes.xyxy.cpu().numpy()
                for box, cls in zip(boxes, result.boxes.cls):
                    x1, y1, x2, y2 = map(int, box)
                    crop_img = img[y1:y2, x1:x2]
                    veh_results = reader_vehicle.readtext(crop_img)
                    if veh_results:
                        text = veh_results[0][1].strip()
                        class_name = result.names[int(cls)].lower()
                        if class_name in class_names:
                            key = class_names[class_name]
                            detected_info[key] = text
            return detected_info

        def back_vehic(img):
            class_names = {
                'model': 'model',
                'chassis no': 'chassis no',
                'origin': 'origin',
                'eng no': 'eng no',
                'veh type': 'veh type'
            }
            detected_info = {
                "model": None,
                "chassis no": None,
                "origin": None,
                "eng no": None,
                "veh type": None
            }
            results = model_back.predict(source=img)
            for result in results:
                boxes = result.boxes.xyxy.cpu().numpy()
                for box, cls in zip(boxes, result.boxes.cls):
                    x1, y1, x2, y2 = map(int, box)
                    crop_img = img[y1:y2, x1:x2]
                    back_vehicle_results = reader.readtext(crop_img)
                    if back_vehicle_results:
                        text = back_vehicle_results[0][1].strip().lower()
                        class_name = result.names[int(cls)].lower()
                        if class_name in class_names:
                            key = class_names[class_name]
                            detected_info[key] = text
            return detected_info

        def trade(img):
            class_names = {
                'trade name': 'trade name',
                'issue date': 'issue date',
                'exp date': 'exp date'
            }
            detected_info = {
                "trade name": None,
                "issue date": None,
                "exp date": None
            }
            results = new_model.predict(source=img)
            for result in results:
                boxes = result.boxes.xyxy.cpu().numpy()
                for box, cls in zip(boxes, result.boxes.cls):
                    x1, y1, x2, y2 = map(int, box[:4])
                    crop_img = img[y1:y2, x1:x2]
                    trades = reader.readtext(crop_img)
                    if trades:
                        detected_text = trades[0][1].strip().lower()
                        class_name = result.names[int(cls)].lower()
                        if class_name in class_names:
                            key = class_names[class_name]
                            detected_info[key] = detected_text
            return detected_info

        def detect_document_type(img):
            results = model.predict(source=img)
            detected_classes = [results[0].names[int(cls)] for cls in results[0].boxes.cls.cpu().numpy()]

            back_res = model_back.predict(source=img)
            detected_back_classes = [back_res[0].names[int(cls)] for cls in back_res[0].boxes.cls.cpu().numpy()]

            certificate_doc = new_model.predict(source=img)
            new_classes = [certificate_doc[0].names[int(cls)] for cls in certificate_doc[0].boxes.cls.cpu().numpy()]

            if any("emirates ID" in cls for cls in detected_classes):
                return "front", id(img)
            elif any("licence-no" in cls for cls in detected_classes):
                return "front", driving(img)
            elif any("vehicle license" in cls for cls in detected_classes):
                return "front", vehicle(img)

            if any("model" in cls for cls in detected_back_classes):
                return "back", back_vehic(img)
            elif any("traffic code" in cls for cls in detected_back_classes):
                return "back", back_driving(img)
            elif any("card-number" in cls for cls in detected_back_classes):
                return "back", id_back(img)

            if any("commercial license" in cls for cls in new_classes):
                return "front", trade(img)
            elif any("test certificate" in cls for cls in new_classes):
                return "front", certificate(img)

            return {"message": "Document type not recognized"}

        try:
            # Save the uploaded file temporarily
            temp_file_path = f"temp_{file.name}"
            with open(temp_file_path, "wb") as buffer:
                for chunk in file.chunks():
                    buffer.write(chunk)

            # Process the file using the process_file method
            processed_files = process_file(temp_file_path)

            # Initialize a list to hold the detected information for each image
            image_results = []

            for img_path in processed_files:
                if "oriented_images" in img_path:
                    img = Image.open(img_path)
                    img = img.convert('RGB')
                    img_np = np.array(img)

                    image_height, image_width = img_np.shape[:2]
                    tokens_used = (image_height * image_width) // 1000

                    detected_info = detect_document_type(img_np)

                    image_result = {
                        "image_metadata": {
                            "Image_Path": img_path,
                            "Side": "front" if any("front" in cls for cls in detected_info) else "back",
                            "Tokens_Used": tokens_used
                        },
                        "detected_data": detected_info
                    }

                    image_results.append(image_result)

            processing_time = time.time() - start_time

            response_data = {
                "overall_metadata": {
                    "Total_PTime": f"{processing_time:.2f} seconds",
                    "Total_Tokens_Used": sum(result["image_metadata"]["Tokens_Used"] for result in image_results),
                    "Timestamp": datetime.now().isoformat()
                },
                "images_results": image_results
            }

            return JsonResponse(response_data)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

        finally:
            os.remove(temp_file_path)
            shutil.rmtree('cropped_images', ignore_errors=True)
            shutil.rmtree('oriented_images', ignore_errors=True)
            shutil.rmtree('pdf_images', ignore_errors=True)
