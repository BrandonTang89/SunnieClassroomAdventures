import cv2
import numpy as np

# A hue of ~20-25 in OpenCV is often a desaturated brown/orange, let's look at the reference image BGR output: [43, 153, 200]
# which is RGB [200, 153, 43] -> an earthy orange / gold brown. 
target_hue = 21

sheet_path = r"c:\Users\tangy\Desktop\SunnieClassroomAdventures\img\sunnie_minibus_sheet.png"
sheet = cv2.imread(sheet_path, cv2.IMREAD_UNCHANGED)

if sheet is None:
    print("Could not read sheet.")
    exit(1)

# OpenCV uses BGR natively, but our image is BGRA
hsv = cv2.cvtColor(sheet[:,:,:3], cv2.COLOR_BGR2HSV)
h, s, v = cv2.split(hsv)

# Yellow hues in OpenCV HSV usually range from 20 to 35. Let's find exactly the yellow of the bus.
# The bus is distinctly yellow. Sunnie's hair is more reddish (0-15), skin is pale.
# Let's isolate the yellow of the bus body.
yellow_mask = (h >= 20) & (h <= 35) & (s > 100) & (v > 100)

# But wait, our target hue is 21! So changing 25-35 to 21 is a very subtle shift to orange
# Maybe the reference bus is a different color? Let's aggressively shift the yellow towards the target hue.
# The user said "recolour the bus to look more like img/references/minibusreference.png"
# Let's just apply the exact hue (21) and a slight saturation drop if it's too bright.

h[yellow_mask] = target_hue
# Let's also slightly lower the saturation and value to match a more earthy/rusty reference
# if the original yellow is too neon
s[yellow_mask] = np.clip(s[yellow_mask] * 0.8, 0, 255).astype(np.uint8)
v[yellow_mask] = np.clip(v[yellow_mask] * 0.9, 0, 255).astype(np.uint8)

merged_hsv = cv2.merge([h, s, v])
recolored_bgr = cv2.cvtColor(merged_hsv, cv2.COLOR_HSV2BGR)

# Apply alpha channel back
sheet[:,:,:3] = recolored_bgr

out_path = r"c:\Users\tangy\Desktop\SunnieClassroomAdventures\img\sunnie_minibus_sheet.png"
cv2.imwrite(out_path, sheet)
print("Saved recolored sheet.")
