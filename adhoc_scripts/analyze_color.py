import cv2
import numpy as np

ref_path = r"c:\Users\tangy\Desktop\SunnieClassroomAdventures\img\references\minibusreference.png"
ref_img = cv2.imread(ref_path)

if ref_img is None:
    print("Could not read reference image.")
    exit(1)

# Convert to HSV to find the dominant hue
hsv_ref = cv2.cvtColor(ref_img, cv2.COLOR_BGR2HSV)
h, s, v = cv2.split(hsv_ref)

# Filter out very dark, very light, and unsaturated pixels to find the main color of the bus
mask = (s > 40) & (v > 40) & (v < 240)
valid_hues = h[mask]

# Find the most common hue (approximate)
hist = cv2.calcHist([valid_hues], [0], None, [180], [0, 180])
dominant_hue = int(np.argmax(hist))

# Get the BGR equivalent of this dominant hue
dominant_color = cv2.cvtColor(np.uint8([[[dominant_hue, 200, 200]]]), cv2.COLOR_HSV2BGR)[0][0]

print(f"Dominant Hue: {dominant_hue}")
print(f"Approximate Dominant BGR Color: {dominant_color}")
