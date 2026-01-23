import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key found: {bool(api_key)}")

if api_key:
    try:
        genai.configure(api_key=api_key)
        print("\n✓ API Key configured successfully")
        
        print("\nAvailable models:")
        for model in genai.list_models():
            if 'generateContent' in model.supported_generation_methods:
                print(f"  - {model.name}")
    except Exception as e:
        print(f"\n✗ Error: {type(e).__name__}: {e}")
else:
    print("No API key found!")
