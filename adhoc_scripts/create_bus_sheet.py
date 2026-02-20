import cv2
import numpy as np

img_path = r"C:\Users\tangy\.gemini\antigravity\brain\ef05674d-7902-44e0-98d8-5e7451c91680\minibus_single_1771621491343.png"
out_path = "img/sunnie_minibus_sheet.png"

# Read image
img = cv2.imread(img_path)
if img is None:
    print(f"Could not read {img_path}")
    exit(1)

img_rgba = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)

# We know the background is magenta (255, 0, 255)
# Let's actively look for magenta
magenta_mask = (img_rgba[:,:,0] > 200) & (img_rgba[:,:,1] < 50) & (img_rgba[:,:,2] > 200)
img_rgba[magenta_mask, 3] = 0

# Find bounding box
coords = cv2.findNonZero(img_rgba[:,:,3]) # Find all non-transparent pixels
if coords is not None:
    x, y, w, h = cv2.boundingRect(coords)
    cropped = img_rgba[y:y+h, x:x+w]
else:
    cropped = img_rgba
    h, w = cropped.shape[:2]

# We need each frame to be exactly 640x210
FRAME_W = 640
FRAME_H = 210

# Calculate scale to fit within 640x210
scale_w = (FRAME_W - 40) / w
scale_h = (FRAME_H - 20) / h
scale = min(scale_w, scale_h)

new_w = int(w * scale)
new_h = int(h * scale)

# Resize using NEAREST to preserve pixel art look (if it scales up)
# If it scales down, AREA is sometimes better, but let's try NEAREST for pixel art
resized = cv2.resize(cropped, (new_w, new_h), interpolation=cv2.INTER_NEAREST)

# Create 3-frame sheet
sheet = np.zeros((FRAME_H, FRAME_W * 3, 4), dtype=np.uint8)

# Calculate paste coordinates (centered horizontally, anchored near the bottom)
paste_x = (FRAME_W - new_w) // 2
paste_y = FRAME_H - new_h - 10  # 10 pixels above the bottom to leave room for the bounce

for i in range(3):
    # Bounce animation: Frame 0 (y=0), Frame 1 (y=+4), Frame 2 (y=+2)
    y_offset = [0, 4, 2][i] 
    
    start_x = i * FRAME_W + paste_x
    start_y = paste_y + y_offset
    
    sheet[start_y:start_y+new_h, start_x:start_x+new_w] = resized

cv2.imwrite(out_path, sheet)
print(f"Saved {out_path} with original {w}x{h} scaled to {new_w}x{new_h}")
