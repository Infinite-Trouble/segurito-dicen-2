import re

def validar_rut(rut:str)-> bool:
    #1. regularizar los números
    rut = rut.replace(".","").replace("-","").upper()

    #2. ver si hay algo que no sean numeros
    if not re.match(r"^[0-9]+[0-9K]$", rut):
        return False
    
    # separar cuerpo y digito verificador
    cuerpo = rut[:-1]
    dv_ingresado = rut[-1]

    #4. calcular
    reverso = map(int, reversed(cuerpo))
    factores = [2, 3, 4, 5, 6, 7, 2, 3, 4, 5, 6, 7]

    suma = sum(d * f for d, f in zip(reverso, factores))
    residuio = suma % 11
    dv_calculado = 11 - residuio

    if dv_calculado==11:
        dv_esperado="0"
    elif dv_calculado == 10:
        dv_esperado = "K"
    else:
        dv_esperado = str(dv_calculado)
    return dv_ingresado == dv_esperado

