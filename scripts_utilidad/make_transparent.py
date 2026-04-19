import sys
from PIL import Image

def make_transparent(input_path, output_path):
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        datas = img.getdata()
        
        # Obtenemos el color de la esquina superior izquierda como fondo (usualmente blanco o color sólido)
        bg_color = datas[0]
        
        new_data = []
        for item in datas:
            # Tolerancia pequeña para bordes de PNG
            if abs(item[0] - bg_color[0]) < 15 and abs(item[1] - bg_color[1]) < 15 and abs(item[2] - bg_color[2]) < 15:
                # Transparente
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
                
        img.putdata(new_data)
        img.save(output_path, "PNG")
        print("Fondo hecho transparente exitosamente.")
    except Exception as e:
        print(f"Error procesando la imagen: {e}")

if __name__ == "__main__":
    make_transparent("docs/assets/favicon.png", "docs/assets/favicon.png")
