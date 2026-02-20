import cv2
import numpy as np

sheet_path = r"img/sunnie_minibus_sheet.png"
sheet = cv2.imread(sheet_path, cv2.IMREAD_UNCHANGED)

if sheet is None:
    print("Could not read sheet.")
    exit(1)

# OpenCV uses BGR natively, but our image is BGRA
hsv = cv2.cvtColor(sheet[:,:,:3], cv2.COLOR_BGR2HSV)
h, s, v = cv2.split(hsv)

# Yellow hues in OpenCV HSV usually range from 20 to 35. Let's find exactly the yellow of the bus.
# The bus is distinctly yellow. Sunnie's hair is more reddish (0-15), skin is pale.
yellow_mask = (h >= 15) & (h <= 40) & (s > 100) & (v > 100)

# We want the bus to be mostly white with a small yellow stripe.
# So we will turn all yellow pixels white, *except* for a horizontal band.
# In a 640x210 frame, the bus occupies some height. Let's say the middle is around Y=100 to 120.
# We will apply the white recolor only outside the stripe area.
# Actually, since it's a 3-frame sheet (width = 1920), the stripe will go across the entire sheet.

stripe_y_start = 110
stripe_y_end = 125

# Create a mask for the area outside the stripe
white_mask = yellow_mask.copy()
# Remove the stripe area from the mask
white_mask[stripe_y_start:stripe_y_end, :] = False

# Turn the non-stripe yellow pixels white by dropping saturation and maximizing value
s[white_mask] = 10 # very low saturation
v[white_mask] = np.clip(v[white_mask] * 1.5, 0, 255).astype(np.uint8) # make it bright white

# For the stripe area itself, it's already yellow! So we just leave it alone.
# Wait, let's make sure the stripe is a nice distinct yellow/orange if needed,
# or just leave the original yellow. Leaving it is probably easiest and looks best.

merged_hsv = cv2.merge([h, s, v])
recolored_bgr = cv2.cvtColor(merged_hsv, cv2.COLOR_HSV2BGR)

# Apply alpha channel back
sheet[:,:,:3] = recolored_bgr

out_path = r"img/sunnie_minibus_sheet.png"
cv2.imwrite(out_path, sheet)
print("Saved recolored sheet (White with yellow stripe).")
