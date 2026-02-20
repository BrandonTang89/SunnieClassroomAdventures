from PIL import Image, ImageDraw

def create_triple():
    combined_path = 'c:/Users/tangy/Desktop/SunnieClassroomAdventures/img/title_bg_combined_fixed.png'
    img3_path = 'C:/Users/tangy/.gemini/antigravity/brain/25969fa9-811d-4d00-b2e7-0c6d2ae886cd/title_bg_img3_1771628721534.png'
    ref_path = 'c:/Users/tangy/Desktop/SunnieClassroomAdventures/img/seam_reference.png'
    out_path = 'c:/Users/tangy/Desktop/SunnieClassroomAdventures/img/title_bg_triple.png'

    combined = Image.open(combined_path).convert('RGBA')
    img3 = Image.open(img3_path).convert('RGBA')
    ref = Image.open(ref_path).convert('RGBA')

    h = combined.height
    
    if img3.size != (h, h):
        img3 = img3.resize((h, h), Image.Resampling.LANCZOS)
    if ref.size != (h, h):
        ref = ref.resize((h, h), Image.Resampling.LANCZOS)

    # Blend img3 with ref so edges are perfect
    mask = Image.new('L', (h, h), 0)
    draw = ImageDraw.Draw(mask)
    
    fade_len = int(h * 0.15)
    
    # We want max of 'ref' at edges, and max of 'img3' in middle
    # Actually wait. The mask defines how much of 'img3' we see.
    # At x=0, mask=0 (so we see ref)
    # At x=fade_len, mask=255 (so we see img3)
    # At x=h-fade_len, mask=255 
    # At x=h, mask=0
    for x in range(h):
        if x < fade_len:
            alpha = int(255 * (x / fade_len))
        elif x > h - fade_len - 1:
            alpha = int(255 * ((h - 1 - x) / fade_len))
        else:
            alpha = 255
        draw.line((x, 0, x, h), fill=alpha)
        
    blended_img3 = Image.composite(img3, ref, mask)
    
    # Create triple image
    cw, ch = combined.size
    triple = Image.new('RGBA', (cw + h, ch))
    triple.paste(combined, (0, 0))
    triple.paste(blended_img3, (cw, 0))
    
    triple.save(out_path)
    print(f"Successfully created 3-tile background at {out_path} with size {cw+h}x{ch}")

if __name__ == '__main__':
    create_triple()
