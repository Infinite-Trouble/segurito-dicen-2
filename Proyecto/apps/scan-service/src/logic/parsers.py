import re
from datetime import datetime

MESES_MAP = {
    "ENE": 1, "FEB": 2, "MAR": 3, "ABR": 4, "MAY": 5, "JUN": 6,
    "JUL": 7, "AGO": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DIC": 12
}

class DocumentParser:
    @staticmethod
    def parse_cedula(text: str):
        """
        Extrae datos de una cédula de identidad chilena con regex robustos.
        """
        try:
            # 1. Extraer RUN (Permitir espacios o saltos de línea después de RUN)
            # Buscamos el patrón XX.XXX.XXX-X o X.XXX.XXX-X
            run_match = re.search(r"RUN\s*([\d.\-kK]+)", text, re.IGNORECASE)
            run = run_match.group(1).strip() if run_match else None

            # 2. Extraer Número de Documento
            # Suele ser una cadena alfanumérica con puntos. 
            # Si hay una fecha antes (como en tu ejemplo), buscamos el último grupo de caracteres de la línea.
            doc_line = re.search(r"NÚMERO DOCUMENTO\s*(.*)", text, re.IGNORECASE)
            numero_cedula = None
            if doc_line:
                # Del resto de la línea, tomamos el último bloque que parezca un ID (letras, números, puntos)
                parts = doc_line.group(1).split()
                if parts:
                    numero_cedula = parts[-1]

            # 3. Extraer Nombres y Apellidos
            # Usamos patrones que no dependan estrictamente de un salto de línea inmediato
            apellidos_match = re.search(r"APELLIDOS\s+(.*?)\s+NOMBRES", text, re.DOTALL | re.IGNORECASE)
            nombres_match = re.search(r"NOMBRES\s+(.*?)\s+(RUN|NACIONALIDAD)", text, re.DOTALL | re.IGNORECASE)
            
            nombre_completo = None
            if nombres_match and apellidos_match:
                nombres = nombres_match.group(1).replace("\n", " ").strip()
                apellidos = apellidos_match.group(1).replace("\n", " ").strip()
                nombre_completo = f"{nombres} {apellidos}"
            elif nombres_match:
                nombre_completo = nombres_match.group(1).replace("\n", " ").strip()

            # 4. Vigencia (Fecha de Vencimiento)
            # Buscamos todas las fechas en el documento. La mayor siempre será la de vencimiento.
            # Regex flexible para meses de 3 o más letras (ej: MAY vs MAYO)
            all_dates_found = re.findall(r"(\d{2})\s+([a-zA-Z]{3,})\s+(\d{4})", text)
            
            vigencia = False
            parsed_dates = []
            
            for dia, mes_str, anho in all_dates_found:
                # Tomamos las primeras 3 letras del mes para el mapeo
                mes_idx = MESES_MAP.get(mes_str[:3].upper())
                if mes_idx:
                    try:
                        parsed_dates.append(datetime(int(anho), mes_idx, int(dia)))
                    except ValueError:
                        continue
            
            if parsed_dates:
                fecha_vencimiento = max(parsed_dates)
                vigencia = fecha_vencimiento > datetime.today()

            return {
                "rut": run,
                "numero_cedula": numero_cedula,
                "vigencia": vigencia,
                "nombre": nombre_completo,
                #"fecha_vencimiento_detectada": fecha_vencimiento.strftime("%d-%m-%Y") if parsed_dates else None
            }
        except Exception as e:
            print(f"Error parseando cédula: {e}")
            return None

#______________________________ Sólo el parser

    @staticmethod
    def parse_liquidacion(text: str):
        """
        Extrae datos de liquidación de sueldo de forma robusta.
        """
        # Regex flexible para etiquetas y montos
        total_haberes = re.search(r"TOTAL\s+HABERES\s*[\$\s]*([\d.]+)", text, re.IGNORECASE)
        liquido = re.search(r"LÍQUIDO\s+A\s+PAGAR\s*[\$\s]*([\d.]+)", text, re.IGNORECASE)
        descuentos = re.search(r"TOTAL\s+DESCUENTOS\s*[\$\s]*([\d.]+)", text, re.IGNORECASE)
        
        haberes_int = DocumentParser._to_int(total_haberes) or 0
        liquido_int = DocumentParser._to_int(liquido) or 0
        descuentos_int = DocumentParser._to_int(descuentos) or 0

        # Si no hay descuentos pero hay haberes y líquido, calculamos la diferencia
        if haberes_int > 0 and liquido_int > 0 and descuentos_int == 0:
            descuentos_int = haberes_int - liquido_int

        return {
            "total_haberes": haberes_int,
            "sueldo_liquido": liquido_int,
            "total_descuento": descuentos_int
        }

    @staticmethod
    def parse_cotizaciones(text: str):
        """
        Extrae la cantidad de cotizaciones efectivamente pagadas y el RUT del empleador.
        """
        # 1. Contar estados "Pagada/o" reales
        # Buscamos todas las ocurrencias de Pagada/o
        total_menciones_pagado = len(re.findall(r"\bPagad[ao]s?\b", text, re.IGNORECASE))
        # Buscamos cuántas de esas están precedidas por "No"
        total_no_pagados = len(re.findall(r"No\s+Pagad[ao]s?\b", text, re.IGNORECASE))
        
        # La diferencia son las cotizaciones efectivamente pagadas
        conteo_efectivo = total_menciones_pagado - total_no_pagados
        
        # 2. Buscar RUT Empleador
        # A veces aparece como "RUT EMPLEADOR" o cerca de los datos de la empresa
        rut_empleador = re.search(r"RUT\s+(?:EMPLEADOR|EMPRESA)\s*[\:\s]*([\d.\-kK]+)", text, re.IGNORECASE)
        
        return {
            "meses_cotizados_consecutivos": max(0, conteo_efectivo),
            "rut_empleador": rut_empleador.group(1).strip() if rut_empleador else "No detectado"
        }

    @staticmethod
    def parse_deudas(text: str):
        """
        Extrae deudas totales y deudas en mora (+90 días) del certificado CMF.
        La mora se identifica por el monto seguido de una 'x' según validación en PoC.
        """
        # Deuda Total
        match_total = re.search(r"Deuda\s+total\s+y\s+estado\s+de\s+pago\s+[\$\s]*([\d.]+)", text, re.IGNORECASE)
        
        # Mora 90+ días (identificada con una x)
        match_mora = re.search(r"([\d.]+)\s*[xX]", text)
        
        return {
            "deudas_totales": DocumentParser._to_int(match_total) or 0,
            "mora_90_dias": DocumentParser._to_int(match_mora) or 0
        }

    @staticmethod
    def _to_int(match):
        if not match:
            return None
        # Limpiar puntos de miles y convertir
        val = match.group(1).replace(".", "").replace(",", "")
        try:
            return int(val)
        except:
            return None
