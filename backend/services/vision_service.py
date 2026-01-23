import os
import json
import google.generativeai as genai
from typing import Dict
import logging
from PIL import Image

logger = logging.getLogger(__name__)


class GeminiVisionService:
    """Service for analyzing images using Google Gemini Vision API"""

    def __init__(self):
        self.ocean_keywords = {
            'tsunami': [
                'tsunami', 'tidal wave', 'sea wave', 'ocean wave',
                'flooding', 'inundation', 'massive wave', 'wall of water'
            ],
            'cyclone': [
                'cyclone', 'hurricane', 'storm', 'typhoon', 'wind',
                'rain', 'clouds', 'weather', 'tropical storm', 'severe weather'
            ],
            'high_tide': [
                'high tide', 'tide', 'coastal flooding', 'sea level',
                'shoreline', 'beach erosion', 'king tide', 'storm surge'
            ]
        }

        self.ocean_related_keywords = [
            'ocean', 'sea', 'water', 'wave', 'beach', 'coast', 'shore',
            'marine', 'maritime', 'coastal', 'bay', 'harbor', 'surf',
            'flooding', 'storm', 'wind', 'rain', 'weather'
        ]

        self.enabled = False
        self.model = None
        self._setup()

    def _setup(self):
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            logger.warning("Gemini API key not configured. Image analysis will be disabled.")
            self.enabled = False
            return

        try:
            genai.configure(api_key=api_key)

            available_models = []
            for model in genai.list_models():
                if 'generateContent' in model.supported_generation_methods:
                    available_models.append(model.name)

            if not available_models:
                logger.error("No Gemini models available")
                return

            for model_name in available_models:
                try:
                    self.model = genai.GenerativeModel(model_name)
                    self.enabled = True
                    logger.info(f"✓ Gemini Vision initialized with {model_name}")
                    return
                except Exception:
                    continue

            self.enabled = False

        except Exception as e:
            logger.error("Failed to initialize Gemini", exc_info=True)
            self.enabled = False

    def _ensure_enabled(self):
        if not self.enabled:
            self._setup()
        return self.enabled

    def _get_image_mime_type(self, image_path: str) -> str:
        try:
            with Image.open(image_path) as img:
                return {
                    'JPEG': 'image/jpeg',
                    'PNG': 'image/png',
                    'WEBP': 'image/webp',
                    'GIF': 'image/gif',
                    'BMP': 'image/bmp'
                }.get(img.format, 'image/jpeg')
        except Exception:
            return 'image/jpeg'

    async def analyze_image(self, image_path: str) -> Dict:
        if not self._ensure_enabled():
            return self._get_fallback_result()

        try:
            mime_type = self._get_image_mime_type(image_path)

            with open(image_path, 'rb') as f:
                image_data = f.read()

            prompt = """You are an AI validator for a coastal disaster reporting system.
Respond ONLY in valid JSON with confidence between 0.0 and 1.0.
"""

            response = self.model.generate_content([
                prompt,
                {"mime_type": mime_type, "data": image_data}
            ])

            response_text = response.text.strip()

            try:
                if '```' in response_text:
                    response_text = response_text.split('```')[1]
                gemini_result = json.loads(response_text)
            except Exception:
                gemini_result = self._parse_text_response(response_text)

            ocean_related = gemini_result.get('ocean_related', False)
            hazard_detected = gemini_result.get('hazard_detected', False)
            hazard_type = gemini_result.get('hazard_type', 'none')
            confidence = float(gemini_result.get('confidence', 0.0))

            # ✅ RELEVANCE SCORE (NOT DEAD)
            if ocean_related and hazard_detected:
                relevance_score = min(1.0, confidence + 0.2)
            elif ocean_related:
                relevance_score = confidence * 0.7
            else:
                relevance_score = confidence * 0.3

            detected_elements = gemini_result.get('detected_elements', [])
            scene_description = gemini_result.get('scene_description', '')
            reasoning = gemini_result.get('reasoning', '')

            result = {
                'ocean_related': ocean_related,
                'hazard_detected': hazard_detected,
                'detected_hazard_type': hazard_type if hazard_detected else None,

                # ✅ dashboard keys
                'confidence': confidence,
                'confidence_score': confidence,
                'relevance_score': relevance_score,

                'labels': detected_elements[:10],
                'objects': detected_elements,
                'web_entities': [],
                'scene_description': scene_description,
                'all_elements': detected_elements,
                'reasoning': reasoning
            }

            logger.info(
                f"✓ Gemini analysis | hazard={hazard_type} "
                f"| confidence={confidence:.2f} "
                f"| relevance={relevance_score:.2f}"
            )

            return result

        except Exception:
            logger.error("Error analyzing image", exc_info=True)
            return self._get_fallback_result()

    def _parse_text_response(self, text: str) -> Dict:
        text_lower = text.lower()

        ocean_related = any(k in text_lower for k in self.ocean_related_keywords)

        hazard_type = 'none'
        max_matches = 0
        for h, keywords in self.ocean_keywords.items():
            matches = sum(1 for k in keywords if k in text_lower)
            if matches > max_matches:
                max_matches = matches
                hazard_type = h

        hazard_detected = max_matches > 0 and ocean_related
        confidence = min(max_matches / 5.0, 1.0) if hazard_detected else 0.0

        return {
            'ocean_related': ocean_related,
            'hazard_detected': hazard_detected,
            'hazard_type': hazard_type if hazard_detected else 'none',
            'confidence': confidence,
            'detected_elements': [],
            'scene_description': text[:200],
            'reasoning': 'Parsed from text fallback'
        }

    def _get_fallback_result(self) -> Dict:
        return {
            'ocean_related': False,
            'hazard_detected': False,
            'detected_hazard_type': None,
            'confidence': 0.0,
            'confidence_score': 0.0,
            'relevance_score': 0.0,
            'labels': [],
            'objects': [],
            'web_entities': [],
            'scene_description': 'Image analysis unavailable',
            'all_elements': [],
            'reasoning': 'Gemini API unavailable'
        }


vision_service = GeminiVisionService()
