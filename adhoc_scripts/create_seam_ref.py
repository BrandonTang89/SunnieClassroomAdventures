from PIL import Image

def create_reference():
    combined_path = 'c:/Users/tangy/Desktop/SunnieClassroomAdventures/img/title_bg_combined.png'
    out_path = 'c:/Users/tangy/Desktop/SunnieClassroomAdventures/img/seam_reference.png'

    img = Image.open(combined_path).convert('RGBA')
    w, h = img.size

    # We want a square image H x H
    ref_img = Image.new('RGBA', (h, h), (0, 0, 0, 0))

    # Take rightmost part of combined and put on left of ref_img
    # Let's take h//3 width
    part_w = h // 3
    right_part = img.crop((w - part_w, 0, w, h))
    ref_img.paste(right_part, (0, 0))

    # Take leftmost part of combined and put on right of ref_img
    left_part = img.crop((0, 0, part_w, h))
    ref_img.paste(left_part, (h - part_w, 0))

    # Save reference image
    ref_img.save(out_path)
    print(f"Created reference image at {out_path} with size {h}x{h}")

if __name__ == '__main__':
    create_reference()
