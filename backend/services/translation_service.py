import os
from groq import Groq
from typing import Dict
import logging

logger = logging.getLogger(__name__)


class GroqTranslationService:
    """Service for multilingual translation using Groq API"""
    
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        
        if api_key:
            self.client = Groq(api_key=api_key)
            self.enabled = True
        else:
            logger.warning("Groq API key not configured. Translation disabled.")
            self.enabled = False
        
        self.language_names = {
            'en': 'English',
            'hi': 'Hindi',
            'kn': 'Kannada'
        }
    
    async def translate(self, text: str, target_language: str) -> str:
        """
        Translate text to target language
        
        Args:
            text: Text to translate
            target_language: Target language code (en, hi, kn)
            
        Returns:
            Translated text
        """
        if not self.enabled:
            logger.warning("Translation service not enabled. Returning original text.")
            return text
        
        # If target is English, return as-is
        if target_language == 'en':
            return text
        
        try:
            target_lang_name = self.language_names.get(target_language, 'English')
            
            prompt = f"""Translate the following text to {target_lang_name}. 
Only provide the translation, no explanations or additional text.

Text to translate:
{text}

Translation:"""
            
            response = self.client.chat.completions.create(
                model="llama-3.1-70b-versatile",
                messages=[
                    {
                        "role": "system",
                        "content": f"You are a professional translator. Translate text to {target_lang_name} accurately."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=1000
            )
            
            translated_text = response.choices[0].message.content.strip()
            
            logger.info(f"Translated text to {target_language}: {text[:50]}... -> {translated_text[:50]}...")
            
            return translated_text
            
        except Exception as e:
            logger.error(f"Translation error: {str(e)}")
            return text  # Return original on error
    
    async def translate_ui_elements(self, elements: Dict[str, str], target_language: str) -> Dict[str, str]:
        """
        Translate multiple UI elements at once
        
        Args:
            elements: Dictionary of key-value pairs to translate
            target_language: Target language code
            
        Returns:
            Dictionary with translated values
        """
        if not self.enabled or target_language == 'en':
            return elements
        
        try:
            # Combine all elements into one request for efficiency
            combined_text = "\n".join([f"{k}:::{v}" for k, v in elements.items()])
            
            target_lang_name = self.language_names.get(target_language, 'English')
            
            prompt = f"""Translate the following UI elements to {target_lang_name}.
Each line has format: KEY:::TEXT
Keep the KEY part unchanged, only translate the TEXT part.
Maintain the same format in your response.

{combined_text}

Translated:"""
            
            response = self.client.chat.completions.create(
                model="llama-3.1-70b-versatile",
                messages=[
                    {
                        "role": "system",
                        "content": f"You are a professional UI translator. Translate to {target_lang_name}."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            translated_lines = response.choices[0].message.content.strip().split('\n')
            
            # Parse response
            translated_elements = {}
            for line in translated_lines:
                if ':::' in line:
                    key, value = line.split(':::', 1)
                    translated_elements[key.strip()] = value.strip()
            
            # Fill in any missing translations with originals
            for key in elements:
                if key not in translated_elements:
                    translated_elements[key] = elements[key]
            
            logger.info(f"Translated {len(translated_elements)} UI elements to {target_language}")
            
            return translated_elements
            
        except Exception as e:
            logger.error(f"UI translation error: {str(e)}")
            return elements  # Return originals on error


# Singleton instance
translation_service = GroqTranslationService()
