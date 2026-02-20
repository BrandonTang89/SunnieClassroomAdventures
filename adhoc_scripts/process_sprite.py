from PIL import Image

def process_sprite(path):
    img = Image.open(path).convert("RGBA")
    datas = img.getdata()
    # Assume the top-left pixel is the background color
    bg_color = datas[0] 
    
    new_data = []
    for item in datas:
        # Check if pixel is close to bg_color
        if abs(item[0] - bg_color[0]) < 15 and abs(item[1] - bg_color[1]) < 15 and abs(item[2] - bg_color[2]) < 15:
            new_data.append((255, 255, 255, 0)) # transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(path, "PNG")
    print(f"Processed sprite {path} size: {img.size}")

process_sprite("img/sunnie_sprite.png")
