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
        print("Starting POST request processing...")
        start_time = time.time()
        file = request.FILES.get('file')

        if file is None:
            print("No file was provided in the request.")
            return JsonResponse({"error": "No file was provided in the request."}, status=400)

        print("File received:", file.name)

        # Initialize models and readers
        models = self.initialize_models()
        rotation_map = {'0': 0, '90': 270, '180': 180, '270': 90}
        
        try:
            temp_file_path = self.save_temp_file(file)
            print(f"File saved temporarily at: {temp_file_path}")

            processed_files = self.process_file(temp_file_path, rotation_map, models)

            image_results = self.process_images(processed_files, models)
            
            processing_time = time.time() - start_time
            print(f"Processing completed in {processing_time:.2f} seconds")

            response_data = self.build_response(image_results, processing_time)

            return JsonResponse(response_data)

        except Exception as e:
            print(f"Error during processing: {str(e)}")
            return JsonResponse({"error": str(e)}, status=500)

        finally:
            self.cleanup(temp_file_path)

    @staticmethod
    def initialize_models():
        print("Initializing YOLO models and EasyOCR readers...")
        return {
            'driving_model': YOLO(r'backendapp/em_models/driving_front_back.pt'),
            'id_model': YOLO(r'backendapp/em_models/ID_front_back.pt'),
            'vehicle_model': YOLO(r'backendapp/em_models/vehicle_front_back.pt'),
            'pass_model': YOLO(r'backendapp/em_models/pass.pt'),
            'trade_model': YOLO(r'backendapp/em_models/trade.pt'),
            'reader': easyocr.Reader(['en']),
            'ar_en_reader': easyocr.Reader(['ar', 'en'])
        }

    @staticmethod
    def save_temp_file(file):
        temp_file_path = f"temp_{file.name}"
        with open(temp_file_path, "wb") as buffer:
            for chunk in file.chunks():
                buffer.write(chunk)
        return temp_file_path

    def process_file(self, file_path, rotation_map, models):
        print(f"Processing file: {file_path}")
        if file_path.endswith('.pdf'):
            return self.process_pdf(file_path)
        else:
            return self.process_image(file_path, models['id_model'], rotation_map)

    @staticmethod
    def process_pdf(pdf_path):
        print(f"Processing PDF file: {pdf_path}")
        doc = fitz.open(pdf_path)
        image_paths = []
        pdf_images_dir = 'pdf_images'
        os.makedirs(pdf_images_dir, exist_ok=True)

        for i in range(len(doc)):
            page = doc.load_page(i)
            pix = page.get_pixmap()
            img_path = os.path.join(pdf_images_dir, f"{os.path.splitext(os.path.basename(pdf_path))[0]}_page_{i + 1}.png")
            pix.save(img_path)
            image_paths.append(img_path)
            print(f"Extracted image from PDF page {i + 1}: {img_path}")
        return image_paths

    def process_image(self, image_path, model, rotation_map):
        print(f"Processing image: {image_path}")
        results = model(source=image_path, save=True, conf=0.5)
        processed_images = []

        for i, result in enumerate(results):
            processed_images.extend(self.handle_image_inference(result, i, rotation_map))

        return processed_images

    @staticmethod
    def handle_image_inference(result, image_idx, rotation_map):
        img = Image.open(result.path)
        processed_images = []
        print(f"Model inference result on image {image_idx}: {result.path}")

        for j, box in enumerate(result.boxes.xyxy):
            class_idx = int(result.boxes.cls[j].item())
            class_name = result.names[class_idx]
            parts = class_name.split('_')

            processed_images.extend(
                EmiratesDataView.save_cropped_oriented_image(img, parts, box, j, rotation_map)
            )
        return processed_images

    @staticmethod
    def save_cropped_oriented_image(img, parts, box, j, rotation_map):
        xmin, ymin, xmax, ymax = map(int, box)
        cropped_dir = 'cropped_images'
        oriented_dir = 'oriented_images'
        os.makedirs(cropped_dir, exist_ok=True)
        os.makedirs(oriented_dir, exist_ok=True)
        processed_images = []

        if len(parts) == 3:
            doc_type, side, orient = parts
            cropped_img, oriented_img_path = EmiratesDataView.crop_and_orient_image(
                img, (xmin, ymin, xmax, ymax), doc_type, side, orient, j, rotation_map, cropped_dir, oriented_dir
            )
            processed_images.extend([cropped_img, oriented_img_path])
        else:
            processed_images.append(EmiratesDataView.save_non_cropped_image(img, parts, j, cropped_dir, oriented_dir))

        return processed_images

    @staticmethod
    def crop_and_orient_image(img, box, doc_type, side, orient, idx, rotation_map, cropped_dir, oriented_dir):
        cropped_img = img.crop(box)
        cropped_img_name = f'{doc_type}_{side}_{orient}_{idx}_cropped.jpg'
        cropped_img_path = os.path.join(cropped_dir, cropped_img_name)
        cropped_img.save(cropped_img_path)

        if orient in rotation_map:
            rotation_angle = rotation_map[orient]
            if rotation_angle != 0:
                cropped_img = cropped_img.rotate(rotation_angle, expand=True)

        oriented_img_name = f'{doc_type}_{side}_{orient}_{idx}_oriented.jpg'
        oriented_img_path = os.path.join(oriented_dir, oriented_img_name)
        cropped_img.save(oriented_img_path)

        return cropped_img_path, oriented_img_path

    @staticmethod
    def save_non_cropped_image(img, parts, idx, cropped_dir, oriented_dir):
        doc_type, orient = parts[0], parts[1]
        side = 'front'
        non_cropped_img_name = f'{doc_type}_{side}_{orient}_{idx}_non_cropped.jpg'
        non_cropped_img_path = os.path.join(cropped_dir, non_cropped_img_name)
        img.save(non_cropped_img_path)

        oriented_img_name = f'{doc_type}_{side}_{orient}_{idx}_oriented.jpg'
        oriented_img_path = os.path.join(oriented_dir, oriented_img_name)
        img.save(oriented_img_path)

        return non_cropped_img_path, oriented_img_path

    def process_images(self, processed_files, models):
        image_results = []
        for img_path in processed_files:
            if "oriented_images" in img_path:
                img = cv2.imread(img_path)
                img_np = np.array(img)

                tokens_used = (img_np.shape[0] * img_np.shape[1]) // 1000
                doc_type = os.path.basename(img_path).split('_')[0]
                detected_info = self.detect_information_by_type(img_path, img, doc_type, models)

                image_results.append({
                    "image_metadata": {
                        "Image_Path": img_path,
                        "Document_Type": doc_type,
                        "Side": "front" if "front" in img_path else "back",
                        "Tokens_Used": tokens_used
                    },
                    "detected_data": detected_info
                })
        return image_results

    @staticmethod
    def detect_information_by_type(img_path, img, doc_type, models):
        if 'ID' in img_path:
            return EmiratesDataView.id_detection(img, models['id_model'], models['reader'])
        elif 'Driving' in img_path:
            return EmiratesDataView.driving_detection(img, models['driving_model'], models['reader'])
        elif 'vehicle' in img_path:
            return EmiratesDataView.vehicle_detection(img, models['vehicle_model'], models['ar_en_reader'])
        elif 'pass' in img_path:
            return EmiratesDataView.pass_certificate_detection(img, models['pass_model'], models['reader'])
        elif 'trade' in img_path:
            return EmiratesDataView.trade_certificate_detection(img, models['trade_model'], models['reader'])
        else:
            return {}

    @staticmethod
    def build_response(image_results, processing_time):
        return {
            "overall_metadata": {
                "Total_PTime": f"{processing_time:.2f} seconds",
                "Total_Tokens_Used": sum(result["image_metadata"]["Tokens_Used"] for result in image_results),
                "Timestamp": datetime.now().isoformat()
            },
            "images_results": image_results
        }

    @staticmethod
    def cleanup(temp_file_path):
        print("Cleaning up temporary files and directories...")
        os.remove(temp_file_path)
        shutil.rmtree('cropped_images', ignore_errors=True)
        shutil.rmtree('oriented_images', ignore_errors=True)
        shutil.rmtree('pdf_images', ignore_errors=True)
        print("Cleanup completed.")
