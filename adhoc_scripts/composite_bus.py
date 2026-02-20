import cv2
import numpy as np
import os

bus_path = r"C:\Users\tangy\.gemini\antigravity\brain\ef05674d-7902-44e0-98d8-5e7451c91680\standalone_minibus_1771622505345.png"
sunnie_path = r"img/sunnie_sprite.png"
out_path = r"img/sunnie_minibus_sheet.png"

# Read images
bus_img = cv2.imread(bus_path)
sunnie_img = cv2.imread(sunnie_path, cv2.IMREAD_UNCHANGED)

if bus_img is None or sunnie_img is None:
    print("Could not read input images.")
    exit(1)

# Convert bus to BGRA
bus_rgba = cv2.cvtColor(bus_img, cv2.COLOR_BGR2BGRA)

# Remove magenta background from bus
magenta_mask = (bus_rgba[:,:,0] > 200) & (bus_rgba[:,:,1] < 50) & (bus_rgba[:,:,2] > 200)
bus_rgba[magenta_mask, 3] = 0

# Find bounding box for bus
coords = cv2.findNonZero(bus_rgba[:,:,3])
if coords is not None:
    x, y, w, h = cv2.boundingRect(coords)
    bus_cropped = bus_rgba[y:y+h, x:x+w]
else:
    bus_cropped = bus_rgba
    h, w = bus_cropped.shape[:2]

# Scale bus down to fit inside 640x210 frame
FRAME_W = 640
FRAME_H = 210

scale_w = (FRAME_W - 40) / w
scale_h = (FRAME_H - 20) / h
scale = min(scale_w, scale_h)

new_w = int(w * scale)
new_h = int(h * scale)

bus_resized = cv2.resize(bus_cropped, (new_w, new_h), interpolation=cv2.INTER_NEAREST)

# ==========================================
# Extract Sunnie eating toast from sunnie_sprite.png
# sunnie_sprite.png is 640x640 with grid of characters
# Looking at the original prompt, she is "eating toast from a clear plastic bag"
# I'll just use the bottom-left character (the one cropped originally by crop_sunnie.py)
# Actually, the user's single sprite `sunnie_single.png` or `sunnie_pose_x` might be better.
# Let's crop the bottom-left of sunnie_sprite.png directly (which is roughly x:0-300, y:300-640).
sunnie_h, sunnie_w = sunnie_img.shape[:2]
quadrant = sunnie_img[300:640, 0:300]

# remove the background of sunnie (the background color is likely the top-left pixel)
bg_color = quadrant[0, 0]
sunnie_mask = (abs(quadrant[:,:,0] - bg_color[0]) < 15) & \
              (abs(quadrant[:,:,1] - bg_color[1]) < 15) & \
              (abs(quadrant[:,:,2] - bg_color[2]) < 15)

quadrant[sunnie_mask, 3] = 0

# find tight crop for sunnie
sunnie_coords = cv2.findNonZero(quadrant[:,:,3])
if sunnie_coords is not None:
    sx, sy, sw, sh = cv2.boundingRect(sunnie_coords)
    sunnie_tight = quadrant[sy:sy+sh, sx:sx+sw]
else:
    sunnie_tight = quadrant

# Scale Sunnie to fit in the window
# Bus window is roughly 1/3 of the bus height
target_sunnie_h = int(new_h * 0.4)
target_sunnie_w = int(sunnie_tight.shape[1] * (target_sunnie_h / sunnie_tight.shape[0]))
sunnie_resized = cv2.resize(sunnie_tight, (target_sunnie_w, target_sunnie_h), interpolation=cv2.INTER_NEAREST)

# Position Sunnie in the front window.
# Front of the bus is on the left. The window is roughly at x = 10% to 30%, y = 20% to 50%
sunnie_x = int(new_w * 0.15)
sunnie_y = int(new_h * 0.25)

# Composite Sunnie into the bus
def composite_alpha(bg, fg, x, y):
    h_bg, w_bg = bg.shape[:2]
    h_fg, w_fg = fg.shape[:2]
    
    # Calculate bounds
    y1 = max(y, 0)
    y2 = min(y + h_fg, h_bg)
    x1 = max(x, 0)
    x2 = min(x + w_fg, w_bg)
    
    fy1 = y1 - y
    fy2 = fy1 + (y2 - y1)
    fx1 = x1 - x
    fx2 = fx1 + (x2 - x1)
    
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

cv2.imwrite(out_path, sheet)
print("Saved composited standalone bus sheet.")
