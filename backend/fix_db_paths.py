from database import SessionLocal, HazardPost
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_paths():
    db = SessionLocal()
    posts = db.query(HazardPost).all()
    fixed_count = 0
    
    for post in posts:
        changed = False
        if post.image_path and '\\' in post.image_path:
            post.image_path = post.image_path.replace('\\', '/')
            changed = True
            
        if post.watermarked_image_path and '\\' in post.watermarked_image_path:
            post.watermarked_image_path = post.watermarked_image_path.replace('\\', '/')
            changed = True
            
        if changed:
            logger.info(f"Fixed paths for post {post.id}")
            fixed_count += 1
            
    if fixed_count > 0:
        db.commit()
        logger.info(f"Successfully fixed {fixed_count} posts.")
    else:
        logger.info("No text paths needed fixing.")
        
    db.close()

if __name__ == "__main__":
    fix_paths()
