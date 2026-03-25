from PIL import Image

def remove_bg(input_path, output_path):
    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()
        
        newData = []
        for item in datas:
            # white or near-white (JPG compression artifacts)
            if item[0] > 230 and item[1] > 230 and item[2] > 230:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)
                
        img.putdata(newData)
        img.save(output_path, "PNG")
        print("Success")
    except Exception as e:
        print("Error:", e)

remove_bg("7317982.jpg", "public/tourist-car-red.png")
