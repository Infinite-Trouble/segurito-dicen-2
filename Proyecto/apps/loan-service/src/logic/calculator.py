def obtener_tasa_referencial(monto: float, cuotas: int) -> float:
    """
    Asigna una tasa mensual basada en el mercado actual chileno.
    Tasas menores para montos altos (menor riesgo relativo).
    """
    if monto < 1000000:
        return 0.032  # 3.2% mensual
    elif monto < 5000000:
        return 0.025  # 2.5% mensual
    else:
        return 0.018  # 1.8% mensual

def calcular_prestamo(monto: float, cuotas: int):
    tasa_mensual = obtener_tasa_referencial(monto, cuotas)
    
    # Fórmula de cuota nivelada (Sistema Francés)
    # Cuota = [M * i * (1+i)^n] / [(1+i)^n - 1]
    numerador = monto * tasa_mensual * ((1 + tasa_mensual) ** cuotas)
    denominador = ((1 + tasa_mensual) ** cuotas) - 1
    cuota = numerador / denominador
    
    return {
        "cuota_mensual": round(cuota, 2),
        "tasa_aplicada": (round(tasa_mensual * 100, 2)),
        "total_pagar": round(cuota * cuotas, 2),
        "cae": round((tasa_mensual * 12) * 100, 2) # Tasa anual aproximada
    }