import cv2
import numpy as np

in_path = r"img/sunnie_minibus_no_bg.png"
out_sheet_path = r"img/sunnie_minibus_sheet.png"

img = cv2.imread(in_path, cv2.IMREAD_UNCHANGED)
if img is None:
    print("Could not read input image.")
    exit(1)

if img.shape[2] == 3:
    print("Image does not have alpha channel. Please make sure it has a transparent background.")
    exit(1)

# Crop to alpha bounding box
coords = cv2.findNonZero(img[:,:,3])
if coords is not None:
    x, y, w, h = cv2.boundingRect(coords)
    cropped = img[y:y+h, x:x+w]
else:
    cropped = img
    h, w = cropped.shape[:2]

# Scale to fit inside 640x210 frame
FRAME_W = 640
FRAME_H = 210

scale = min((FRAME_W - 40) / w, (FRAME_H - 20) / h)
new_w, new_h = int(w * scale), int(h * scale)
resized = cv2.resize(cropped, (new_w, new_h), interpolation=cv2.INTER_AREA)

# Create 3-frame sheet
sheet = np.zeros((FRAME_H, FRAME_W * 3, 4), dtype=np.uint8)

paste_x = (FRAME_W - new_w) // 2
paste_y = FRAME_H - new_h - 10

for i in range(3):
    y_offset = [0, 4, 2][i] 
    start_x = i * FRAME_W + paste_x
    start_y = paste_y + y_offset
    
    # Ensure background stays transparent by properly pasting alpha
    sheet[start_y:start_y+new_h, start_x:start_x+new_w] = resized

cv2.imwrite(out_sheet_path, sheet)
print("Saved tiled user minibus sheet.")
