import os
import asyncio
from dotenv import load_dotenv
import logging
import json

# Configure logging to file
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('gemini_test.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load env
load_dotenv()

print(f"GEMINI_API_KEY present: {bool(os.getenv('GEMINI_API_KEY'))}")

from services.vision_service import vision_service

async def test():
    # Pick a file
    image_path = "uploads/user_marine_01_1768763653_offline.jpg"
    
    if not os.path.exists(image_path):
        print(f"Image not found: {image_path}")
        for f in os.listdir("uploads"):
            if f.endswith(".png") or f.endswith(".jpg"):
                image_path = os.path.join("uploads", f)
                break
    
    print(f"Testing with image: {image_path}")
    print(f"Vision service enabled: {vision_service.enabled}")
    print(f"Vision service model: {vision_service.model}")
    
    result = await vision_service.analyze_image(image_path)
    
    print("\n=== RESULT ===")
    print(json.dumps(result, indent=2))
    
    # Write to file
    with open('gemini_result.json', 'w') as f:
        json.dump(result, f, indent=2)
    print("\nResult written to gemini_result.json")

if __name__ == "__main__":
    asyncio.run(test())
