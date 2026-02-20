from PIL import Image, ImageDraw

orig_path = 'c:/Users/tangy/Desktop/SunnieClassroomAdventures/img/title_bg_combined.png'
ai_path = 'C:/Users/tangy/.gemini/antigravity/brain/25969fa9-811d-4d00-b2e7-0c6d2ae886cd/title_bg_recombined_1771628508269.png'
out_path = 'c:/Users/tangy/Desktop/SunnieClassroomAdventures/img/title_bg_combined_fixed.png'

orig_img = Image.open(orig_path).convert('RGBA')
ai_img = Image.open(ai_path).convert('RGBA')

if orig_img.size != ai_img.size:
    ai_img = ai_img.resize(orig_img.size, Image.Resampling.LANCZOS)

mask = Image.new('L', orig_img.size, 0)
draw = ImageDraw.Draw(mask)

w, h = orig_img.size

fade_len = int(w * 0.15)

for x in range(w):
    if x < fade_len:
        alpha = int(255 * (x / fade_len))
    elif x > w - fade_len - 1:
        alpha = int(255 * ((w - 1 - x) / fade_len))
    else:
        alpha = 255
    draw.line((x, 0, x, h), fill=alpha)

result = Image.composite(ai_img, orig_img, mask)
result.save(out_path)
print("Blended successfully into title_bg_combined_fixed.png")
