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

def calcular_probabilidad(ingreso: float, deuda: float, factor: float, cuota: float) -> dict:
    """Calcula la probabilidad en vivo en base a una cuota puntual"""
    if ingreso <= 0:
        return {"texto": "Baja", "color": "text-[#ffb4ab]"}
    
    carga_financiera = (deuda + cuota) / (ingreso * factor)
    
    if carga_financiera <= 0.3:
        return {"texto": "Alta", "color": "text-green-300"}
    elif carga_financiera <= 0.45:
        return {"texto": "Media", "color": "text-yellow-300"}
    else:
        return {"texto": "Baja", "color": "text-[#ffb4ab]"}

def generar_sugerencias_inteligentes(ingreso: float, deuda: float, factor: float) -> list:
    """Calcula todo el batch de sugerencias directamente en el servidor"""
    if ingreso <= 0:
        raise ValueError("El Ingreso no puede ser igual o menor a cero.")
    if factor <=0:
        raise ValueError("El factor de contrato no puede ser igual o menor a cero")

    # escenarios_a_probar = [
    #     {"monto": 5000000, "cuotas": 24},
    #     {"monto": 8000000, "cuotas": 36},
    #     {"monto": 12000000, "cuotas": 48},
    #     {"monto": 15000000, "cuotas": 60},
    #     {"monto": 20000000, "cuotas": 60}
    # ]

    escenarios_a_probar = []
    for i in range(4):
        caso = {"monto": ingreso*(i+1), "cuotas": 12*(i+1)}
        escenarios_a_probar.append(caso)

    opciones_aprobables = []

    for esc in escenarios_a_probar:
        # Reutilizamos nuestra propia función de cálculo en lugar de llamar a la API
        simulacion = calcular_prestamo(esc["monto"], esc["cuotas"])
        
        carga_financiera = (deuda + simulacion["cuota_mensual"]) / (ingreso * factor)

        if carga_financiera <= 0.45:
            if carga_financiera <= 0.3:
                probabilidad = "Alta (90% - 95%)"
                tipo_probabilidad = "alta"
            else:
                probabilidad = "Media (50% - 70%)"
                tipo_probabilidad = "media"

            opciones_aprobables.append({
                "monto": esc["monto"],
                "cuotas": esc["cuotas"],
                "cuota_simulada": simulacion["cuota_mensual"],
                "tasa_aplicada": simulacion["tasa_aplicada"],
                "cae": simulacion["cae"],
                "total_pagar": simulacion["total_pagar"],
                "carga_financiera": carga_financiera,
                "probabilidad": probabilidad,
                "tipo_probabilidad": tipo_probabilidad
            })

    # Ordenamos por menor carga financiera (las de mayor probabilidad primero)
    opciones_aprobables.sort(key=lambda x: x["carga_financiera"])
    
    # Retornamos el top 3
    return opciones_aprobables[:3]
