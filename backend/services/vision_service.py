import os
import json
import google.generativeai as genai
from typing import Dict, List, Tuple
import logging
import base64
from PIL import Image
import io

logger = logging.getLogger(__name__)


class GeminiVisionService:
    """Service for analyzing images using Google Gemini Vision API"""
    
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        
        if not api_key:
            logger.warning("Gemini API key not configured. Image analysis will be disabled.")
            self.enabled = False
            return
        
        # Configure Gemini
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        self.enabled = True
        
        # Ocean hazard keywords for fallback
        self.ocean_keywords = {
            'tsunami': ['tsunami', 'tidal wave', 'sea wave', 'ocean wave', 'flooding', 'inundation', 'massive wave', 'wall of water'],
            'cyclone': ['cyclone', 'hurricane', 'storm', 'typhoon', 'wind', 'rain', 'clouds', 'weather', 'tropical storm', 'severe weather'],
            'high_tide': ['high tide', 'tide', 'coastal flooding', 'sea level', 'shoreline', 'beach erosion', 'king tide', 'storm surge']
        }
        
        self.ocean_related_keywords = [
            'ocean', 'sea', 'water', 'wave', 'beach', 'coast', 'shore', 
            'marine', 'maritime', 'coastal', 'bay', 'harbor', 'surf',
            'flooding', 'storm', 'wind', 'rain', 'weather'
        ]
    
    def _get_image_mime_type(self, image_path: str) -> str:
        """Detect actual MIME type of image"""
        try:
            with Image.open(image_path) as img:
                format_to_mime = {
                    'JPEG': 'image/jpeg',
                    'PNG': 'image/png',
                    'WEBP': 'image/webp',
                    'GIF': 'image/gif',
                    'BMP': 'image/bmp'
                }
                return format_to_mime.get(img.format, 'image/jpeg')
        except Exception as e:
            logger.warning(f"Could not detect image format: {e}. Defaulting to image/jpeg")
            return 'image/jpeg'
    
    async def analyze_image(self, image_path: str) -> Dict:
        """
        Analyze image for ocean hazard detection using Gemini Vision
        
        Returns:
            Dict with analysis results including:
            - ocean_related: bool
            - hazard_detected: bool
            - confidence_score: float
            - detected_hazard_type: str
            - labels: List[str]
            - scene_description: str
        """
        if not self.enabled:
            logger.error("Gemini API not enabled")
            return self._get_fallback_result()
        
        try:
            # Detect correct MIME type
            mime_type = self._get_image_mime_type(image_path)
            
            # Read and encode image
            with open(image_path, 'rb') as image_file:
                image_data = image_file.read()
            
            # Create improved prompt
            prompt = """You are an AI validator for a coastal disaster reporting system.

Your task: Determine if this image shows evidence of TSUNAMI, CYCLONE/HURRICANE, or HIGH TIDE/STORM SURGE events.

VALID OCEAN HAZARDS (Answer YES):
1. TSUNAMI: Massive waves, wall of water, unusual wave patterns, tsunami aftermath/damage
2. CYCLONE/HURRICANE: Heavy rain + strong winds, storm damage, hurricane conditions, severe weather with flooding
3. HIGH TIDE/STORM SURGE: Abnormally high water levels, coastal flooding, flooded streets near coast, water inundation, beach erosion

IMPORTANT RULES:
- If you see FLOODING (especially in coastal/urban areas) → Consider it VALID (likely storm surge or tsunami)
- If you see ROUGH SEAS, large waves, or stormy ocean → VALID
- If you see HEAVY RAIN with flooding → VALID (cyclone-related)
- If you see STORM DAMAGE (fallen trees, damaged buildings near coast) → VALID
- Normal beach/ocean scenes with calm weather → INVALID
- Rain alone (without flooding) → INVALID
- Images unrelated to water/weather → INVALID

Respond ONLY with this JSON format (no other text):
{
    "ocean_related": true or false,
    "hazard_detected": true or false,
    "hazard_type": "tsunami" or "cyclone" or "high_tide" or "none",
    "confidence": 0.0 to 1.0,
    "detected_elements": ["element1", "element2"],
    "scene_description": "brief description of what you see",
    "reasoning": "why you classified it this way"
}"""

            # Upload image and generate content with correct MIME type
            response = self.model.generate_content([
                prompt, 
                {"mime_type": mime_type, "data": image_data}
            ])
            
            # Parse response
            response_text = response.text.strip()
            logger.info(f"Gemini raw response: {response_text[:300]}")
            
            # Try to extract JSON from response
            try:
                # Remove markdown code blocks if present
                if '```json' in response_text:
                    response_text = response_text.split('```json')[1].split('```')[0].strip()
                elif '```' in response_text:
                    response_text = response_text.split('```')[1].split('```')[0].strip()
                
                gemini_result = json.loads(response_text)
                logger.info(f"Parsed JSON: {gemini_result}")
            except json.JSONDecodeError as e:
                logger.warning(f"Could not parse Gemini response as JSON: {e}")
                logger.warning(f"Response text: {response_text}")
                # Fallback: analyze text response
                gemini_result = self._parse_text_response(response_text)
            
            # Extract and validate results
            ocean_related = gemini_result.get('ocean_related', False)
            hazard_detected = gemini_result.get('hazard_detected', False)
            hazard_type = gemini_result.get('hazard_type', 'none')
            confidence = float(gemini_result.get('confidence', 0.0))
            detected_elements = gemini_result.get('detected_elements', [])
            scene_description = gemini_result.get('scene_description', 'Unable to analyze scene')
            reasoning = gemini_result.get('reasoning', '')
            
            # Normalize hazard type
            hazard_type_lower = hazard_type.lower()
            
            # Map variations to standard types
            if any(term in hazard_type_lower for term in ['flood', 'surge', 'tide', 'inundation']):
                hazard_type = 'high_tide'
            elif any(term in hazard_type_lower for term in ['storm', 'cyclone', 'hurricane', 'typhoon', 'weather']):
                hazard_type = 'cyclone'
            elif any(term in hazard_type_lower for term in ['tsunami', 'wave', 'tidal']):
                hazard_type = 'tsunami'
            elif hazard_type_lower not in ['tsunami', 'cyclone', 'high_tide', 'none']:
                # Unknown hazard type - if hazard was detected, default to high_tide
                if hazard_detected:
                    hazard_type = 'high_tide'
                    logger.warning(f"Unknown hazard type '{hazard_type_lower}', defaulting to 'high_tide'")
                else:
                    hazard_type = 'none'
            
            # Consistency check
            if hazard_type == 'none':
                hazard_detected = False
            
            if hazard_detected:
                ocean_related = True  # Force ocean_related if hazard detected
            
            # Create labels from detected elements
            labels = detected_elements[:10] if detected_elements else []
            
            result = {
                'ocean_related': ocean_related,
                'hazard_detected': hazard_detected,
                'detected_hazard_type': hazard_type if hazard_detected else None,
                'confidence_score': confidence,
                'labels': labels,
                'objects': detected_elements,
                'web_entities': [],
                'scene_description': scene_description,
                'all_elements': detected_elements,
                'reasoning': reasoning,
                'gemini_raw_response': response_text[:500]  # Store first 500 chars for debugging
            }
            
            logger.info(f"✓ Gemini analysis: ocean_related={ocean_related}, "
                       f"hazard={hazard_type}, confidence={confidence:.2f}, "
                       f"description='{scene_description[:100]}'")
            
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing image with Gemini: {str(e)}", exc_info=True)
            return self._get_fallback_result()
    
    def _parse_text_response(self, text: str) -> Dict:
        """Parse text response when JSON parsing fails"""
        text_lower = text.lower()
        
        # Check for ocean-related content
        ocean_related = any(keyword in text_lower for keyword in self.ocean_related_keywords)
        
        # Check for hazard types
        hazard_type = 'none'
        max_matches = 0
        
        for h_type, keywords in self.ocean_keywords.items():
            matches = sum(1 for keyword in keywords if keyword in text_lower)
            if matches > max_matches:
                max_matches = matches
                hazard_type = h_type
        
        hazard_detected = max_matches > 0 and ocean_related
        confidence = min(max_matches / 5.0, 1.0) if hazard_detected else 0.0
        
        return {
            'ocean_related': ocean_related,
            'hazard_detected': hazard_detected,
            'hazard_type': hazard_type if hazard_detected else 'none',
            'confidence': confidence,
            'detected_elements': [],
            'scene_description': text[:200],
            'reasoning': 'Parsed from text response (JSON parsing failed)'
        }
    
    def _get_fallback_result(self) -> Dict:
        """Return fallback result when API is not available"""
        return {
            'ocean_related': False,
            'hazard_detected': False,
            'detected_hazard_type': None,
            'confidence_score': 0.0,
            'labels': [],
            'objects': [],
            'web_entities': [],
            'scene_description': 'Image analysis unavailable - Gemini API not configured',
            'all_elements': [],
            'reasoning': 'API not available'
        }


# Singleton instance
vision_service = GeminiVisionService()