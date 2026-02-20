from PIL import Image
import os

imgpath1 = 'c:/Users/tangy/Desktop/SunnieClassroomAdventures/img/title_bg.png'
# The generated alternate background tile
imgpath2 = 'C:/Users/tangy/.gemini/antigravity/brain/25969fa9-811d-4d00-b2e7-0c6d2ae886cd/title_bg_alternate_1771628247749.png'

img1 = Image.open(imgpath1).convert('RGBA')
img2 = Image.open(imgpath2).convert('RGBA')

if img1.height != img2.height:
    aspect = img2.width / img2.height
    new_w = int(img1.height * aspect)
    img2 = img2.resize((new_w, img1.height), Image.Resampling.LANCZOS)

dst = Image.new('RGBA', (img1.width + img2.width, img1.height))
dst.paste(img1, (0, 0))
dst.paste(img2, (img1.width, 0))
dst.save('c:/Users/tangy/Desktop/SunnieClassroomAdventures/img/title_bg_combined.png')
print("Successfully combined backgrounds into title_bg_combined.png")
