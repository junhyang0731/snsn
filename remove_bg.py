
import sys
import os
try:
    from PIL import Image
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

def remove_background(input_path, output_path):
    print(f"Processing: {input_path}")
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # If pixel is white (or very close to white), make it transparent
            if item[0] > 220 and item[1] > 220 and item[2] > 220:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)

        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Saved to: {output_path}")
    except Exception as e:
        print(f"Error: {e}")

# Source path from the generated artifact
source_path = r"C:\Users\kihwa\.gemini\antigravity\brain\aca15d74-f0d9-4f25-818a-d7af599b4d54\snacksnake_icon_flat_1765693112880.png"
dest_path = r"c:\Users\kihwa\Downloads\valorant-cheat-site\public\logo.png"

remove_background(source_path, dest_path)
