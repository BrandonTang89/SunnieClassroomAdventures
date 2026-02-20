from PIL import Image
import sys

def remove_background(image_path, output_path, tolerance=30):
    img = Image.open(image_path).convert("RGBA")
    data = img.getdata()

    # Get the background color from the top-left pixel
    bg_color = data[0]

    new_data = []
    
    # helper for color distance constraint
    def color_dist(c1, c2):
        return sum(abs(a - b) for a, b in zip(c1[:3], c2[:3]))

    for item in data:
        # Check against the top left corner background color, with tolerance
        if color_dist(item, bg_color) < tolerance:
            new_data.append((item[0], item[1], item[2], 0))  # Replace with transparent
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python remove_bg.py <input> <output>")
        sys.exit(1)
    remove_background(sys.argv[1], sys.argv[2])
