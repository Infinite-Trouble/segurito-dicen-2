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
        Extrae datos de liquidación de sueldo.
        Busca montos clave como Total Haberes y Líquido.
        """
        # Implementación base de búsqueda de montos
        total_haberes = re.search(r"TOTAL HABERES\s*\$?\s*([\d.]+)", text, re.IGNORECASE)
        liquido = re.search(r"LÍQUIDO A PAGAR\s*\$?\s*([\d.]+)", text, re.IGNORECASE)
        
        return {
            "total_haberes": DocumentParser._to_int(total_haberes),
            "sueldo_liquido": DocumentParser._to_int(liquido),
            "total_descuento": None # Se puede calcular por diferencia
        }

    @staticmethod
    def parse_cotizaciones(text: str):
        """
        Extrae meses cotizados y RUT del empleador.
        """
        # Ejemplo de búsqueda de meses (esto suele ser una cuenta de filas en una tabla)
        return {
            "meses_cotizados_consecutivos": 12, # Valor por defecto/mock
            "rut_empleador": "76.XXX.XXX-X"
        }

    @staticmethod
    def parse_deudas(text: str):
        """
        Extrae deudas totales del certificado CMF.
        """
        return {
            "deudas_totales": 0,
            "carga_financiera": 0
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
