from PIL import Image

def crop_sprite(path, out_path):
    img = Image.open(path).convert("RGBA")
    
    # The image is 640x640 with 5 characters scattered.
    # We will crop a 300x300 bounding box from the bottom-left quadrant.
    # Adjust via trial and error if needed, but 0, 340 to 300, 640 should grab the bottom left character comfortably
    cropped = img.crop((0, 300, 300, 640))
    cropped.save(out_path, "PNG")
    print(f"Cropped to {out_path}")

crop_sprite("img/sunnie_sprite.png", "img/sunnie_single.png")
