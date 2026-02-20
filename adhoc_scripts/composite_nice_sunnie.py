import cv2
import numpy as np
import shutil

bus_path = r"C:\Users\tangy\.gemini\antigravity\brain\ef05674d-7902-44e0-98d8-5e7451c91680\standalone_minibus_1771622505345.png"
out_sheet_path = r"img/sunnie_minibus_sheet.png"
# Also save to the normal png so user sees it in their file explorer
out_single_path = r"img/sunnie_minibus.png"

nice_sunnie_path = r"img/NiceSunnieBadMinibus.png"

# Read images
bus_img = cv2.imread(bus_path)
old_bus_img = cv2.imread(nice_sunnie_path, cv2.IMREAD_UNCHANGED)

if bus_img is None or old_bus_img is None:
    print("Could not read input images.")
    exit(1)

# Ensure old_bus_img has alpha channel
if old_bus_img.shape[2] == 3:
    old_bus_rgba = cv2.cvtColor(old_bus_img, cv2.COLOR_BGR2BGRA)
else:
    old_bus_rgba = old_bus_img.copy()

# Remove magenta from the standalone bus
bus_rgba = cv2.cvtColor(bus_img, cv2.COLOR_BGR2BGRA)
magenta_mask = (bus_rgba[:,:,0] > 200) & (bus_rgba[:,:,1] < 50) & (bus_rgba[:,:,2] > 200)
bus_rgba[magenta_mask, 3] = 0

coords = cv2.findNonZero(bus_rgba[:,:,3])
x, y, w, h = cv2.boundingRect(coords) if coords is not None else (0, 0, bus_rgba.shape[1], bus_rgba.shape[0])
bus_cropped = bus_rgba[y:y+h, x:x+w]

# Scale bus down to fit inside 640x210 frame
FRAME_W = 640
FRAME_H = 210

scale = min((FRAME_W - 40) / w, (FRAME_H - 20) / h)
new_w, new_h = int(w * scale), int(h * scale)
bus_resized = cv2.resize(bus_cropped, (new_w, new_h), interpolation=cv2.INTER_NEAREST)

# ==========================================
# Extract the detailed Sunnie from old_bus_img (NiceSunnieBadMinibus.png)
# Remove magenta if it exists
magenta_mask_old = (old_bus_rgba[:,:,0] > 200) & (old_bus_rgba[:,:,1] < 50) & (old_bus_rgba[:,:,2] > 200)
old_bus_rgba[magenta_mask_old, 3] = 0

old_coords = cv2.findNonZero(old_bus_rgba[:,:,3])
ox, oy, ow, oh = cv2.boundingRect(old_coords) if old_coords is not None else (0, 0, old_bus_rgba.shape[1], old_bus_rgba.shape[0])
old_bus_cropped = old_bus_rgba[oy:oy+oh, ox:ox+ow]

# The window/Sunnie in the old bus is roughly in the middle of the bus bounding box.
# (NiceSunnieBadMinibus is a 640x640 frame, Sunnie is in the middle window)
sunnie_crop = old_bus_cropped[int(oh*0.1):int(oh*0.7), int(ow*0.35):int(ow*0.65)]

# Find yellow pixels in the crop (the bad bus body)
hsv_sunnie = cv2.cvtColor(sunnie_crop[:,:,:3], cv2.COLOR_BGR2HSV)
hue, sat, val = cv2.split(hsv_sunnie)
yellow_mask = (hue >= 15) & (hue <= 40) & (sat > 100) & (val > 100)
sunnie_crop[yellow_mask, 3] = 0 # Make yellow bus parts transparent

# Also find pure white and grey pixels from the bus roof, turning them transparent
white_mask = (sat < 30) & (val > 150)
sunnie_crop[white_mask, 3] = 0
grey_mask = (sat < 30) & (val < 150) & (val > 50)
sunnie_crop[grey_mask, 3] = 0

# Scale Sunnie to fit in the new white bus window
target_sunnie_h = int(new_h * 0.45) # Make her slightly larger
target_sunnie_w = int(sunnie_crop.shape[1] * (target_sunnie_h / sunnie_crop.shape[0]))
sunnie_resized = cv2.resize(sunnie_crop, (target_sunnie_w, target_sunnie_h), interpolation=cv2.INTER_NEAREST)

# Position Sunnie in the middle window.
sunnie_x = int(new_w * 0.35)
sunnie_y = int(new_h * 0.15)

def composite_alpha(bg, fg, x, y):
    h_bg, w_bg = bg.shape[:2]
    h_fg, w_fg = fg.shape[:2]
    
    y1, y2 = max(y, 0), min(y + h_fg, h_bg)
    x1, x2 = max(x, 0), min(x + w_fg, w_bg)
    
    if y2 <= y1 or x2 <= x1:
        return
        
    fy1, fy2 = y1 - y, y1 - y + (y2 - y1)
    fx1, fx2 = x1 - x, x1 - x + (x2 - x1)
    
    fg_crop = fg[fy1:fy2, fx1:fx2]
    bg_crop = bg[y1:y2, x1:x2]
    
    alpha_fg = fg_crop[:, :, 3] / 255.0
    alpha_bg = bg_crop[:, :, 3] / 255.0
    
    for c in range(0, 3):
        bg_crop[:, :, c] = (alpha_fg * fg_crop[:, :, c] + alpha_bg * bg_crop[:, :, c] * (1 - alpha_fg))
        
    bg_crop[:, :, 3] = (alpha_fg * 255 + alpha_bg * 255 * (1 - alpha_fg)).astype(np.uint8)
    bg[y1:y2, x1:x2] = bg_crop

composite_alpha(bus_resized, sunnie_resized, sunnie_x, sunnie_y)

# Create 3-frame sheet
sheet = np.zeros((FRAME_H, FRAME_W * 3, 4), dtype=np.uint8)

paste_x = (FRAME_W - new_w) // 2
paste_y = FRAME_H - new_h - 10

for i in range(3):
    y_offset = [0, 4, 2][i] 
    start_x = i * FRAME_W + paste_x
    start_y = paste_y + y_offset
    sheet[start_y:start_y+new_h, start_x:start_x+new_w] = bus_resized

cv2.imwrite(out_sheet_path, sheet)

# Also save a 'single' version for the user's reference at img/sunnie_minibus.png
# Just the first frame!
single_frame = sheet[:, 0:FRAME_W]
cv2.imwrite(out_single_path, single_frame)

print("Saved composited standalone bus sheet with NiceSunnieBadMinibus.png")
