def evaluar_solicitud(ingreso_liquido: float, deudas_actuales: float, cuota_prestamo: float, tipo_contrato: str) -> dict:
    """
    Evalúa la capacidad de pago y determina si el préstamo es aprobado o rechazado
    basado en el Ratio de Carga Financiera (RCI).
    """
    # 1. Definir el multiplicador de riesgo según el tipo de contrato
    factores_riesgo = {
        "Indefinido": 1.0,
        "Plazo_Fijo": 0.8,
        "Honorarios": 0.7,
        "Jubilado": 0.9
    }
    
    # Obtener el factor (si no existe, por precaución asumimos el más riesgoso)
    factor_contrato = factores_riesgo.get(tipo_contrato, 0.7)
    
    # 2. Calcular Ingreso Ajustado al Riesgo
    ingreso_ajustado = ingreso_liquido * factor_contrato
    
    # Prevención de división por cero
    if ingreso_ajustado <= 0:
         return {
            "aprobado": False,
            "estado": "RECHAZADA",
            "motivo": "Ingreso insuficiente o no válido.",
            "carga_financiera": None
        }

    # 3. Calcular la Carga Financiera Total (RCI)
    carga_financiera = (deudas_actuales + cuota_prestamo) / ingreso_ajustado
    
    # 4. Lógica de Decisión (Umbral máximo del 45%)
    if carga_financiera <= 0.45:
        riesgo = "BAJO" if carga_financiera <= 0.30 else "MEDIO"
        return {
            "aprobado": True,
            "estado": "APROBADA",
            "motivo": f"Carga financiera aceptable ({carga_financiera*100:.1f}%). Riesgo {riesgo}.",
            "carga_financiera": round(carga_financiera, 4)
        }
    else:
        return {
            "aprobado": False,
            "estado": "RECHAZADA",
            "motivo": f"Carga financiera excesiva ({carga_financiera*100:.1f}%). Supera el límite del 45%.",
            "carga_financiera": round(carga_financiera, 4)
        }