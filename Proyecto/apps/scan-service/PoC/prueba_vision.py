import re
from datetime import datetime
from google.cloud import vision

meses = {"ENE":1,"FEB":2,"MAR":3,"ABR":4,"MAY":5,"JUN":6,
         "JUL":7,"AGO":8,"SEP":9,"OCT":10,"NOV":11,"DIC":12}


def detect_text(path):
    client = vision.ImageAnnotatorClient()
    with open(path, "rb") as image_file:
        content = image_file.read()
    image = vision.Image(content=content)
    response = client.text_detection(image=image)
    if response.error.message:
        raise Exception(response.error.message)
    return response.text_annotations

def extraer_datos_cedula(path):
    texts = detect_text(path)
    full_text = texts[0].description  # primer elemento = texto completo
    #print(full_text)

    run = re.search(r"RUN\n([\d.\-]+)", full_text).group(1)
    numero_cedula = re.search(r"NÚMERO DOCUMENTO\n(\S+)", full_text).group(1)
    
    fecha_str = re.search(r"FECHA DE VENCIMIENTO\n(\d{2} \w{3} \d{4})", full_text).group(1)
    dia, mes, anho = fecha_str.split()
    fecha_vencimiento = datetime(int(anho), meses[mes], int(dia))
    vigencia = fecha_vencimiento > datetime.today()
    apellidos = re.search(r"APELLIDOS\n(.+)\nNOMBRES", full_text, re.DOTALL).group(1).replace("\n", " ")
    nombres = re.search(r"NOMBRES\n(.+)\nRUN", full_text, re.DOTALL).group(1).replace("\n", " ")
    nombre_completo = f"{nombres} {apellidos}"

    return run, numero_cedula, vigencia, nombre_completo

# Ejemplo de que funciona el concepto vamo conchasumare webong!
run, numero_cedula, vigencia, nombre_completo = extraer_datos_cedula("test_carnet.jpeg")
#print(f'rut: {run}, numero cedula: {numero_cedula}, vigencia: {vigencia}, nombre completo : {nombre_completo}')

def extraer_datos_deuda(path):
    texts = detect_text(path)
    full_text = texts[0].description

    # Deuda Total: Buscamos después de la cabecera correspondiente
    # Usamos \s+ para ser flexibles con espacios y saltos de línea
    match_total = re.search(r"Deuda total\s+y estado de pago\s+[\$\s]*([\d.]+)", full_text, re.IGNORECASE)
    deuda_total = match_total.group(1).replace(".", "") if match_total else "0"

    # Mora 90+ días: Buscamos un monto con puntos seguido de una x
    match_mora = re.search(r"([\d.]+)\s*[xX]", full_text)
    mora_90 = match_mora.group(1).replace(".", "") if match_mora else "0"

    print("--- RESULTADOS POC DEUDA ---")
    print(f"Deuda Total: ${deuda_total}")
    print(f"Mora +90 días (Carga Financiera): ${mora_90}")
    print("-----------------------------")

    return deuda_total, mora_90

# Prueba del concepto para deuda
#u = extraer_datos_deuda("deuda_mia.png")


def extraer_datos_liquidacion(path):
    texts = detect_text(path)
    full_text = texts[0].description
    print(full_text)

#u = extraer_datos_liquidacion("deuda_mia.png")

def extraer_datos_cotizaciones(path):
    texts = detect_text(path)
    full_text = texts[0].description
    print(full_text)

u = extraer_datos_cotizaciones("cot_pau.png")

