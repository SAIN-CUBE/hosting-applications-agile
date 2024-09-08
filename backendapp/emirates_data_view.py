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
    permission_classes = []
    
    def get(self, request, *args, **kwargs):
        return JsonResponse({'message': 'Please use POST method to ask a question.'})
    
    def post(self, request, *args, **kwargs):
        start_time = time.time()
        file = request.FILES.get('file')

        if file is None:
            return JsonResponse({"error": "No file was provided in the request."}, status=400)

        # Initialize models and readers
        driving_model = YOLO(r'backendapp/em_models/driving_front_back.pt')
        id_model = YOLO(r'backendapp/em_models/ID_front_back.pt')
        vehicle_model = YOLO(r'backendapp/em_models/vehicle_front_back.pt')
        pass_model = YOLO(r'backendapp/em_models/pass.pt')
        trade_model = YOLO(r'backendapp/em_models/trade.pt')
        reader = easyocr.Reader(['en'])
        ar_en_reader = easyocr.Reader(['ar', 'en'])

        # Rotation map to correct orientations
        rotation_map = {
            '0': 0,
            '90': 270,
            '180': 180,
            '270': 90,
        }

        def process_file(file_path: str, model_path: str = 'backendapp/em_models/classify.pt'):
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
                        else:
                            doc_type, orient = parts[0], parts[1]
                            side = 'front'
                            non_cropped_img_name = f'{doc_type}_{side}_{orient}_{i}_{j}_non_cropped.jpg'
                            non_cropped_img_path = os.path.join(cropped_dir, non_cropped_img_name)
                            img.save(non_cropped_img_path)
                            processed_images.append(non_cropped_img_path)
                            
                            oriented_img_name = f'{doc_type}_{side}_{orient}_{i}_{j}_oriented.jpg'
                            oriented_img_path = os.path.join(oriented_dir, oriented_img_name)
                            img.save(oriented_img_path)
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
                'Issue Date': 'Issue Date'
            }
            detected_info = {k: None for k in class_names.values()}
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
            return {k: v for k, v in detected_info.items() if v is not None}

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
            detected_info = {k: None for k in class_names.values()}
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
            return {k: v for k, v in detected_info.items() if v is not None}

        def vehicle(img):
            class_names = {
                "TC no": "TC no",
                "Insurance company": "Insurance company",
                'Reg date': 'Reg date',
                'Exp date': 'Exp date',
                'Ins Exp': 'Ins Exp',
                'Owner': 'Owner',
                "place of issue": 'place of issue',
                "nationality": 'nationality',
                "Model": 'Model',
                "Origin": 'Origin',
                "veh type": 'veh type',
                "Eng no": 'Eng no',
                "chassis no": 'chassis no'
            }
            detected_info = {k: None for k in class_names.values()}
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

        def pass_certificate(img):
            class_names = {'inspection date': 'inspection date'}
            detected_info = {'inspection date': None}
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
            return {k: v for k, v in detected_info.items() if v is not None}

        def trade_certificate(img):
            class_names = {
                'Trade Name': 'trade name',
                'Issue Date': 'issue date',
                'Exp Date': 'exp date',
                'activity': 'activity'
            }
            detected_info = {k: None for k in class_names.values()}
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
            return {k: v for k, v in detected_info.items() if v is not None}

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
                    img = cv2.imread(img_path)
                    img_np = np.array(img)

                    image_height, image_width = img_np.shape[:2]
                    tokens_used = (image_height * image_width) // 1000

                    file_name = os.path.basename(img_path)
                    doc_type = file_name.split('_')[0]

                    if 'ID' in img_path:
                        detected_info = id(img)
                    elif 'Driving' in img_path:
                        detected_info = driving(img)
                    elif 'vehicle' in img_path:
                        detected_info = vehicle(img)
                    elif 'pass' in img_path:
                        detected_info = pass_certificate(img)
                    elif 'trade' in img_path:
                        detected_info = trade_certificate(img)
                    else:
                        detected_info = {}

                    image_result = {
                        "image_metadata": {
                            "Image_Path": img_path,
                            "Document_Type": doc_type,
                            "Side": "front" if "front" in img_path else "back",
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
            # Clean up temporary files and directories
            os.remove(temp_file_path)
            shutil.rmtree('cropped_images', ignore_errors=True)
            shutil.rmtree('oriented_images', ignore_errors=True)
            shutil.rmtree('pdf_images', ignore_errors=True)