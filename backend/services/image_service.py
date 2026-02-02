from PIL import Image, ImageDraw, ImageFont
from datetime import datetime
import os
import logging

logger = logging.getLogger(__name__)


class ImageProcessingService:
    """Service for image watermarking and processing"""
    
    def __init__(self):
        self.upload_dir = "uploads"
        self.watermarked_dir = "uploads/watermarked"
        
        # Create directories if they don't exist
        os.makedirs(self.upload_dir, exist_ok=True)
        os.makedirs(self.watermarked_dir, exist_ok=True)
        
        # Load BLIP model for image-text matching
        self.processor = None
        self.model = None
        try:
            logger.info("Loading BLIP model for image relevance validation...")
            from transformers import BlipProcessor, BlipForImageTextRetrieval
            import torch
            
            self.processor = BlipProcessor.from_pretrained("Salesforce/blip-itm-base-coco")
            self.model = BlipForImageTextRetrieval.from_pretrained("Salesforce/blip-itm-base-coco")
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            self.model.to(self.device)
            self.model.eval()
            
            logger.info(f"BLIP model loaded successfully on {self.device}")
        except Exception as e:
            logger.warning(f"Failed to load BLIP model: {e}. Image relevance validation will be skipped.")
            self.processor = None
            self.model = None
    
    async def add_watermark(
        self, 
        image_path: str, 
        location_name: str, 
        latitude: float, 
        longitude: float,
        timestamp: datetime = None
    ) -> str:
        """
        Add watermark to image with location, date, and time
        
        Args:
            image_path: Path to original image
            location_name: Name of location
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            timestamp: Timestamp (defaults to now)
            
        Returns:
            Path to watermarked image
        """
        try:
            # Open image
            image = Image.open(image_path)
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Create drawing context
            draw = ImageDraw.Draw(image)
            
            # Use default font (PIL's built-in)
            try:
                # Try to use a nicer font if available
                font_large = ImageFont.truetype("arial.ttf", 40)
                font_small = ImageFont.truetype("arial.ttf", 30)
            except:
                # Fallback to default
                font_large = ImageFont.load_default()
                font_small = ImageFont.load_default()
            
            # Prepare watermark text
            if timestamp is None:
                timestamp = datetime.utcnow()
            
            date_str = timestamp.strftime("%d %b %Y")
            time_str = timestamp.strftime("%I:%M %p")
            coords_str = f"{latitude:.4f}, {longitude:.4f}"
            
            # Image dimensions
            width, height = image.size
            
            # Watermark position (bottom of image)
            margin = 20
            y_position = height - 150
            
            # Semi-transparent background for text
            overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
            overlay_draw = ImageDraw.Draw(overlay)
            
            # Draw semi-transparent rectangle
            overlay_draw.rectangle(
                [(0, y_position - 20), (width, height)],
                fill=(0, 0, 0, 180)
            )
            
            # Composite overlay onto image
            image = image.convert('RGBA')
            image = Image.alpha_composite(image, overlay)
            image = image.convert('RGB')
            
            # Redraw on composited image
            draw = ImageDraw.Draw(image)
            
            # Draw watermark text
            text_color = (255, 255, 255)
            
            # Location
            if location_name:
                draw.text((margin, y_position), f"📍 {location_name}", 
                         fill=text_color, font=font_large)
            
            # Coordinates
            draw.text((margin, y_position + 45), coords_str, 
                     fill=text_color, font=font_small)
            
            # Date and time
            datetime_text = f"📅 {date_str}  🕐 {time_str}"
            draw.text((margin, y_position + 85), datetime_text, 
                     fill=text_color, font=font_small)
            
            # Generate watermarked filename
            original_filename = os.path.basename(image_path)
            watermarked_filename = f"wm_{original_filename}"
            watermarked_path = os.path.join(self.watermarked_dir, watermarked_filename)
            
            # Save watermarked image
            image.save(watermarked_path, quality=90)
            
            logger.info(f"Watermarked image saved: {watermarked_path}")
            
            return watermarked_path
            
        except Exception as e:
            logger.error(f"Error adding watermark: {str(e)}")
            # Return original path if watermarking fails
            return image_path
    
    async def validate_image(self, image_path: str) -> bool:
        """
        Validate image file
        
        Args:
            image_path: Path to image
            
        Returns:
            True if valid, False otherwise
        """
        try:
            # Check file exists
            if not os.path.exists(image_path):
                return False
            
            # Check file size (max 10MB)
            max_size = int(os.getenv("MAX_IMAGE_SIZE_MB", "10")) * 1024 * 1024
            file_size = os.path.getsize(image_path)
            
            if file_size > max_size:
                logger.warning(f"Image too large: {file_size} bytes")
                return False
            
            # Try to open image
            with Image.open(image_path) as img:
                # Verify it's a valid image
                img.verify()
            
            return True
            
        except Exception as e:
            logger.error(f"Image validation failed: {str(e)}")
            return False

    async def validate_image_relevance(self, image_path: str, target_tag: str) -> float:
        """
        Validate image relevance using BLIP Image-Text Matching model.
        
        Args:
            image_path: Path to the image file
            target_tag: Target text to match (e.g., "tsunami ocean hazard")
            
        Returns:
            Relevance score as percentage (0-100)
        """
        if self.processor is None or self.model is None:
            logger.warning("BLIP model not loaded, skipping relevance validation")
            return 0.0
        
        try:
            import torch
            from PIL import Image as PILImage
            import asyncio
            from concurrent.futures import ThreadPoolExecutor
            
            def _run_blip_inference():
                """Run BLIP inference in a separate thread to avoid blocking"""
                try:
                    # Load and process image
                    image = PILImage.open(image_path).convert('RGB')
                    
                    # Generate prompt variations to find best match
                    # BLIP often prefers "a photo of..." style prompts
                    prompts = [
                        target_tag,
                        f"a photo of {target_tag}",
                        f"an image showing {target_tag}",
                        f"{target_tag} in the ocean",
                        "disaster scene" # Baseline check
                    ]
                    
                    max_score = 0.0
                    
                    # Batch process prompts if possible, or loop
                    # Processing one by one for simplicity and strict pairing
                    
                    for text in prompts:
                        inputs = self.processor(
                            images=image,
                            text=text,
                            return_tensors="pt"
                        ).to(self.device)
                        
                        with torch.no_grad():
                            outputs = self.model(**inputs)
                            itm_score = outputs.itm_score
                            probs = torch.nn.functional.softmax(itm_score, dim=1)
                            match_prob = probs[0][1].item()
                            
                            if match_prob > max_score:
                                max_score = match_prob
                                
                    return max_score * 100
                    
                except Exception as e:
                    logger.error(f"BLIP inference error: {e}")
                    return 0.0
                    logger.error(f"BLIP inference error: {e}")
                    return 0.0
            
            # Run in thread pool to avoid blocking async event loop
            loop = asyncio.get_event_loop()
            with ThreadPoolExecutor() as executor:
                relevance_score = await loop.run_in_executor(executor, _run_blip_inference)
            
            logger.info(f"BLIP relevance score: {relevance_score:.2f}% for '{target_tag}'")
            return relevance_score
            
        except Exception as e:
            logger.error(f"BLIP validation failed: {str(e)}")
            return 0.0

# Singleton instance
image_service = ImageProcessingService()
