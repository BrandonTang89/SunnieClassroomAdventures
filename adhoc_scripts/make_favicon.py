from PIL import Image
import numpy as np

filename = r"C:\Users\tangy\.gemini\antigravity\brain\4c9368d4-db17-4be4-a63a-920cefb07499\sunnie_favicon_1771631285550.png"
img = Image.open(filename).convert("RGBA")

data = np.array(img)
r, g, b, a = data.T
# Find white pixels
white_areas = (r > 240) & (g > 240) & (b > 240)
data[..., :][white_areas.T] = (0, 0, 0, 0)

img_out = Image.fromarray(data)
bbox = img_out.getbbox()
if bbox:
    img_out = img_out.crop(bbox)

# Make square
w, h = img_out.size
max_dim = max(w, h)
sq = Image.new('RGBA', (max_dim, max_dim), (0,0,0,0))
offset_x = (max_dim - w) // 2
offset_y = (max_dim - h) // 2
sq.paste(img_out, (offset_x, offset_y))

# Resize nicely
sq = sq.resize((256, 256), Image.Resampling.LANCZOS)
sq.save(r"C:\Users\tangy\Desktop\SunnieClassroomAdventures\img\sunnie_favicon.png")
print("Saved img/sunnie_favicon.png")
