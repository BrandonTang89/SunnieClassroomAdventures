import cv2
import numpy as np
import os

def extract_sprites(img_path, out_prefix):
    # Load image with alpha channel
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    
    # Extract alpha channel
    if img.shape[2] == 4:
        alpha = img[:, :, 3]
    else:
        print("No alpha channel found.")
        return

    # Find contours on the alpha channel
    contours, _ = cv2.findContours(alpha, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Filter out very small contours (noise)
    min_area = 100
    valid_contours = [c for c in contours if cv2.contourArea(c) > min_area]
    
    # Sort contours by x position (left to right)
    valid_contours = sorted(valid_contours, key=lambda c: cv2.boundingRect(c)[0])
    
    count = 1
    for c in valid_contours:
        x, y, w, h = cv2.boundingRect(c)
        # Add some padding
        pad = 10
        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(img.shape[1], x + w + pad)
        y2 = min(img.shape[0], y + h + pad)
        
        cropped = img[y1:y2, x1:x2]
        
        out_path = f"{out_prefix}_{count}.png"
        cv2.imwrite(out_path, cropped)
        print(f"Saved {out_path} (size {w}x{h})")
        count += 1

extract_sprites("img/sunnie_sprite.png", "img/sunnie_pose")
