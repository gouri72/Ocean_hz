import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    genai.configure(api_key=api_key)
    print("Available models that support generateContent:\n")
    for model in genai.list_models():
        if 'generateContent' in model.supported_generation_methods:
            print(f"Name: {model.name}")
            print(f"  Display name: {model.display_name}")
            print(f"  Description: {model.description[:100] if model.description else 'N/A'}...")
            print()
