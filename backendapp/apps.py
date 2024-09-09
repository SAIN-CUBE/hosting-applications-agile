# from django.apps import AppConfig


# class BackendappConfig(AppConfig):
#     default_auto_field = "django.db.models.BigAutoField"
#     name = "backendapp"

from django.apps import AppConfig
from ultralytics import YOLO
import easyocr
import torch
from django.conf import settings
import logging
import os
from .utils import CTCLabelConverter
from .model import Model

class BackendAppConfig(AppConfig):
    name = 'backendapp'

    def ready(self):
        logging.info("Initializing models and resources for backendapp...")

        try:
            # Load Urdu OCR Model
            logging.info("Loading Urdu OCR model...")
            urdu_device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            urdu_content = self.load_urdu_glyphs()
            urdu_converter = CTCLabelConverter(urdu_content)
            urdu_recognition_model = Model(num_class=len(urdu_converter.character), device=urdu_device)
            urdu_recognition_model = urdu_recognition_model.to(urdu_device)
            urdu_recognition_model.load_state_dict(
                torch.load("backendapp/models/best_norm_ED.pth", map_location=urdu_device)
            )
            urdu_recognition_model.eval()

            # YOLO Urdu detection model
            urdu_detection_model = YOLO("backendapp/models/yolov8m_UrduDoc.pt")

            # Load YOLO models for chip detection and others
            logging.info("Loading chip and document detection YOLO models...")
            chip_detection_model = YOLO("backendapp/models/best.pt")

            # Load the YOLO models for Emirates data extraction
            logging.info("Loading YOLO models for Emirates data extraction...")
            driving_model = YOLO("backendapp/em_models/driving_front_back.pt")
            id_model = YOLO("backendapp/em_models/ID_front_back.pt")
            vehicle_model = YOLO("backendapp/em_models/vehicle_front_back.pt")
            pass_model = YOLO("backendapp/em_models/pass.pt")
            trade_model = YOLO("backendapp/em_models/trade.pt")

            # EasyOCR readers
            logging.info("Loading EasyOCR readers...")
            reader = easyocr.Reader(['en'], gpu=False)
            ar_en_reader = easyocr.Reader(['ar', 'en'])

            # Store models and resources globally using Django settings
            settings.URDU_RECOGNITION_MODEL = urdu_recognition_model
            settings.URDU_CONVERTER = urdu_converter
            settings.URDU_DEVICE = urdu_device
            settings.URDU_DETECTION_MODEL = urdu_detection_model
            settings.CHIP_DETECTION_MODEL = chip_detection_model
            settings.DRIVING_MODEL = driving_model
            settings.ID_MODEL = id_model
            settings.VEHICLE_MODEL = vehicle_model
            settings.PASS_MODEL = pass_model
            settings.TRADE_MODEL = trade_model
            settings.READER = reader
            settings.AR_EN_READER = ar_en_reader

            logging.info("All models and resources loaded successfully.")

        except Exception as e:
            logging.error(f"Error loading models and resources: {e}")

    def load_urdu_glyphs(self):
        # Load Urdu glyphs from the text file
        with open("backendapp/models/UrduGlyphs.txt", "r", encoding="utf-8") as file:
            return file.read().replace('\n', '') + " "
