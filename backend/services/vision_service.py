import os
import json
import google.generativeai as genai
from typing import Dict, List, Tuple
import logging
import base64

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
        
        # Ocean hazard keywords
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
            # Read and encode image
            with open(image_path, 'rb') as image_file:
                image_data = image_file.read()
            
            # Create detailed prompt for ocean hazard detection
            prompt = """Analyze this image carefully and provide a detailed assessment for ocean hazard detection.

Please analyze:
1. Is this image related to ocean, sea, or coastal areas?
2. Does it show any ocean-related hazards (tsunami, cyclone/storm, high tide/flooding)?
3. What specific elements do you see? (water, waves, flooding, storm clouds, wind damage, etc.)
4. What is the severity or intensity of any hazard shown?
5. Describe the overall scene and context.

Provide your response in this exact JSON format:
{
    "ocean_related": true/false,
    "hazard_detected": true/false,
    "hazard_type": "tsunami" or "cyclone" or "high_tide" or "none",
    "confidence": 0.0-1.0,
    "detected_elements": ["element1", "element2", ...],
    "scene_description": "detailed description",
    "severity_indicators": ["indicator1", "indicator2", ...]
}

Be specific and accurate. Only mark as ocean_related if you clearly see ocean/sea/coastal elements. Only mark hazard_detected if there's clear evidence of a dangerous condition."""

            # Upload image and generate content
            response = self.model.generate_content([prompt, {"mime_type": "image/jpeg", "data": image_data}])
            
            # Parse response
            response_text = response.text.strip()
            
            # Try to extract JSON from response
            try:
                # Remove markdown code blocks if present
                if '```json' in response_text:
                    response_text = response_text.split('```json')[1].split('```')[0].strip()
                elif '```' in response_text:
                    response_text = response_text.split('```')[1].split('```')[0].strip()
                
                gemini_result = json.loads(response_text)
            except json.JSONDecodeError:
                logger.warning(f"Could not parse Gemini response as JSON: {response_text}")
                # Fallback: analyze text response
                gemini_result = self._parse_text_response(response_text)
            
            # Extract and validate results
            ocean_related = gemini_result.get('ocean_related', False)
            hazard_detected = gemini_result.get('hazard_detected', False)
            hazard_type = gemini_result.get('hazard_type', 'none')
            confidence = float(gemini_result.get('confidence', 0.0))
            detected_elements = gemini_result.get('detected_elements', [])
            scene_description = gemini_result.get('scene_description', 'Unable to analyze scene')
            
            # Validate hazard type
            if hazard_type not in ['tsunami', 'cyclone', 'high_tide', 'none']:
                hazard_type = 'none'
                hazard_detected = False
            
            # If hazard type is 'none', set hazard_detected to False
            if hazard_type == 'none':
                hazard_detected = False
            
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
                'gemini_raw_response': response_text[:500]  # Store first 500 chars for debugging
            }
            
            logger.info(f"Gemini analysis complete: ocean_related={ocean_related}, "
                       f"hazard={hazard_type}, confidence={confidence:.2f}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing image with Gemini: {str(e)}")
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
            'severity_indicators': []
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
            'all_elements': []
        }


# Singleton instance
vision_service = GeminiVisionService()
