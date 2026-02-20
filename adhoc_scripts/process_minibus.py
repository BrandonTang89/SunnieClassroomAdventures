import cv2
import numpy as np

def process_minibus_sprite(img_path, out_path):
    # Load image with alpha channel
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    
    # The generated image might be RGB or RGBA. 
    # If it's RGB and has a solid background (like magenta), we convert to RGBA and make it transparent.
    if img.shape[2] == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
        
    # Assume the top-left pixel is the background color
    bg_color = img[0, 0]
    
    # Create a mask for pixels that match the background color (with some tolerance)
    diff = np.abs(img[:, :, :3].astype(int) - bg_color[:3].astype(int))
    mask = np.all(diff < 20, axis=2)
    
    # Set alpha to 0 for background pixels
    img[mask, 3] = 0
    
    cv2.imwrite(out_path, img)
    print(f"Processed minibus sprite saved to {out_path}")

process_minibus_sprite(
    r"C:\Users\tangy\.gemini\antigravity\brain\ef05674d-7902-44e0-98d8-5e7451c91680\sunnie_minibus_sprite_1771607252634.png", 
    "img/sunnie_minibus.png"
)
