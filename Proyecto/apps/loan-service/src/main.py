from fastapi import FastAPI, Depends, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from logic.calculator import calcular_prestamo, calcular_probabilidad, generar_sugerencias_inteligentes
from logic.scoring import evaluar_solicitud
from dependencies import get_current_user_id, get_current_user_email
from sqlalchemy.orm import Session
from infrastructure import database, models
from infrastructure.notifications import enviar_correo_cambio_estado
from datetime import date, timedelta
from typing import List
from transbank.webpay.webpay_plus.transaction import Transaction
from transbank.common.options import WebpayOptions
from transbank.common.integration_type import IntegrationType
import schemas
import uuid

app = FastAPI(title="Loan Service", description="Servicio de simulaciones financieras")

# Configuración de CORS para permitir la conexión con el Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/simular", response_model=schemas.SimulacionResponse)
def simular_credito(request: schemas.SimulacionRequest):
    """
    Endpoint público para simular un préstamo de consumo.
    Calcula cuota, tasa y total basándose en el monto y plazo.
    """
    resultado = calcular_prestamo(request.monto, request.cuotas)
    return resultado

@app.post("/solicitud", response_model=schemas.SolicitudResponse)
def crear_solicitud(
    solicitud: schemas.SolicitudCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    usuario_id: str = Depends(get_current_user_id),
    email: str = Depends(get_current_user_email)
):
    # 1. Calcular la cuota estimada para el monto y plazo solicitados
    datos_prestamo = calcular_prestamo(solicitud.monto, solicitud.plazo)
    cuota_estimada = datos_prestamo["cuota_mensual"]

    # 2. Pasar los datos extraídos por el OCR al motor de Scoring
    resultado_evaluacion = evaluar_solicitud(
        ingreso_liquido=solicitud.liquidacion.sueldo_liquido,
        deudas_actuales=solicitud.deudas.deudas_totales,
        cuota_prestamo=cuota_estimada,
        tipo_contrato="Indefinido" 
    )

    estado_final = resultado_evaluacion["estado"] # "APROBADA" o "RECHAZADA"

    # 3. Crear la solicitud base con el estado real evaluado
    nueva_solicitud = models.Solicitud(
        usuario_id=usuario_id,
        monto=solicitud.monto,
        plazo=solicitud.plazo,
        estado=estado_final 
    )
    db.add(nueva_solicitud)
    db.flush() 

    # 4. Crear registros de documentos asociados
    nuevo_carnet = models.Carnet(
        solicitud_id=nueva_solicitud.id,
        nombre=solicitud.carnet.nombre,
        rut=solicitud.carnet.rut,
        numero_cedula=solicitud.carnet.numero_cedula,
        vigencia=solicitud.carnet.vigencia,
        archivo_url=solicitud.carnet.archivo_url
    )
    
    nueva_liquidacion = models.CertificadoLiquidacion(
        solicitud_id=nueva_solicitud.id,
        total_haberes=solicitud.liquidacion.total_haberes,
        total_descuento=solicitud.liquidacion.total_descuento,
        sueldo_liquido=solicitud.liquidacion.sueldo_liquido,
        archivo_url=solicitud.liquidacion.archivo_url
    )

    nuevas_cotizaciones = models.CertificadoCotizaciones(
        solicitud_id=nueva_solicitud.id,
        meses_cotizados_consecutivos=solicitud.cotizaciones.meses_cotizados_consecutivos,
        rut_empleador=solicitud.cotizaciones.rut_empleador,
        archivo_url=solicitud.cotizaciones.archivo_url
    )

    nuevas_deudas = models.CertificadoDeudas(
        solicitud_id=nueva_solicitud.id,
        deudas_totales=solicitud.deudas.deudas_totales,
        mora_90_dias=solicitud.deudas.mora_90_dias,
        archivo_url=solicitud.deudas.archivo_url
    )

    db.add_all([nuevo_carnet, nueva_liquidacion, nuevas_cotizaciones, nuevas_deudas])
    
    # 5. Lógica de Negocio: Generar el Préstamo SOLO si la solicitud fue aprobada
    if resultado_evaluacion["aprobado"]:
        nuevo_prestamo = models.Prestamo(
            solicitud_id=nueva_solicitud.id,
            monto_total=int(datos_prestamo["total_pagar"]), 
            cuotas_faltantes=solicitud.plazo,
            estado="ACTIVO"
        )
        db.add(nuevo_prestamo)
        db.flush() 

        cuotas_a_crear = []
        fecha_actual = date.today()

        for i in range(1, solicitud.plazo + 1):
            fecha_vencimiento = fecha_actual + timedelta(days=30 * i)
            
            nueva_cuota = models.Cuota(
                prestamo_id=nuevo_prestamo.id,
                monto=int(cuota_estimada),
                fecha_limite=fecha_vencimiento,
                estado="PENDIENTE"
            )
            cuotas_a_crear.append(nueva_cuota)
        
        db.add_all(cuotas_a_crear)

    # 6. Confirmar la transacción completa en la base de datos
    db.commit()
    db.refresh(nueva_solicitud)

    # 7. Disparar el correo asíncrono con el estado real
    background_tasks.add_task(
        enviar_correo_cambio_estado,
        correo_destino=email,
        monto=solicitud.monto,
        plazo=solicitud.plazo,
        nuevo_estado=estado_final
    )

    return nueva_solicitud


@app.get("/datos")
def obtener_datos_usuario(
    db: Session = Depends(get_db),
    usuario_id: str = Depends(get_current_user_id)
):
    solicitudes = db.query(models.Solicitud).filter(models.Solicitud.usuario_id == usuario_id).all()
    
    prestamos_raw = db.query(models.Prestamo)\
        .join(models.Solicitud)\
        .filter(models.Solicitud.usuario_id == usuario_id)\
        .all()
    
    prestamos_procesados = []
    for p in prestamos_raw:
        cuotas_totales = len(p.cuotas)
        cuotas_pagadas = sum(1 for c in p.cuotas if c.estado == "PAGADO")
        
        proxima_cuota = next((c for c in p.cuotas if c.estado == "PENDIENTE"), None)
        
        valor_cuota = proxima_cuota.monto if proxima_cuota else (p.cuotas[0].monto if p.cuotas else 0)
        fecha_proximo_pago = proxima_cuota.fecha_limite if proxima_cuota else None

        prestamos_procesados.append({
            "id": p.id,
            "monto_total": p.monto_total,
            "estado": p.estado,
            "cuotas_totales": cuotas_totales,
            "cuotas_pagadas": cuotas_pagadas,
            "valor_cuota": valor_cuota,
            "fecha_proximo_pago": fecha_proximo_pago
        })
    
    return {
        "solicitudes": solicitudes,
        "prestamos": prestamos_procesados
    }


@app.get("/prestamos/{prestamo_id}/cuotas", response_model=List[schemas.CuotaResponse])
def obtener_cuotas_prestamo(
    prestamo_id: str,
    db: Session = Depends(get_db),
    usuario_id: str = Depends(get_current_user_id)
):
    """Retorna las cuotas de desarrollo de un crédito verificado por usuario"""
    prestamo = db.query(models.Prestamo).join(models.Solicitud).filter(
        models.Prestamo.id == prestamo_id,
        models.Solicitud.usuario_id == usuario_id
    ).first()

    if not prestamo:
        raise HTTPException(status_code=404, detail="Préstamo inexistente o cuenta inválida.")
    
    return sorted(prestamo.cuotas, key=lambda x: x.id)

# =========================================================================
# FLUJO DE PAGOS: WEBPAY PLUS (TRANSBANK) 
# =========================================================================

@app.post("/prestamos/{prestamo_id}/iniciar-pago")
def iniciar_pago_webpay(
    prestamo_id: str,
    pago_data: schemas.PagoRequest,
    db: Session = Depends(get_db),
    usuario_id: str = Depends(get_current_user_id)
):
    # Genera el token de Webpay Plus y retorna la URL de redirección.
    prestamo = db.query(models.Prestamo).filter(
        models.Prestamo.id == prestamo_id,
        models.Prestamo.solicitud.has(usuario_id=usuario_id)
    ).first()

    if not prestamo:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado.")

    cuotas = db.query(models.Cuota).filter(models.Cuota.id.in_(pago_data.cuota_ids)).all()
    if not cuotas:
        raise HTTPException(status_code=400, detail="No se enviaron cuotas válidas.")

    monto_total = sum(c.monto for c in cuotas)
    
    buy_order = f"ORDEN-{prestamo_id[:6]}-{str(uuid.uuid4())[:4]}"
    session_id = f"SESION-{usuario_id[:8]}"
    
    cuotas_str = ",".join(map(str, pago_data.cuota_ids))
    return_url = f"http://localhost:5173/?cuotas={cuotas_str}&prestamo={prestamo_id}"

    try:
        opciones = WebpayOptions(
            "597055555532", 
            "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C", 
            IntegrationType.TEST
        )
        tx = Transaction(opciones)
        response = tx.create(buy_order, session_id, monto_total, return_url)
        url_transbank = f"{response['url']}?token_ws={response['token']}"
        
        return {"url_redireccion": url_transbank}

    except Exception as e:
        print("Error conectando con Transbank:", e)
        raise HTTPException(status_code=502, detail="Error de comunicación con Transbank.")


@app.post("/prestamos/confirmar-pago")
def confirmar_pago_webpay(
    datos_retorno: dict, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    token_ws = datos_retorno.get("token_ws")
    if not token_ws:
        raise HTTPException(status_code=400, detail="Transacción sin token válido.")

    try:
        opciones = WebpayOptions(
            "597055555532", 
            "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C", 
            IntegrationType.TEST
        )
        tx = Transaction(opciones)
        
        # 1. Transbank confirma el token y nos devuelve los datos de la transacción
        response = tx.commit(token_ws)
        
        if response.get("status") != "AUTHORIZED" or response.get("response_code") != 0:
            raise HTTPException(status_code=402, detail="El pago fue rechazado por el banco.")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error confirmando pago en Transbank: {str(e)}")

    # 2. Extraer datos del frontend
    prestamo_id = datos_retorno.get("prestamo")
    cuotas_ids_str = datos_retorno.get("cuotas")
    
    if not cuotas_ids_str:
        raise HTTPException(status_code=400, detail="No se especificaron cuotas a pagar.")
        
    cuotas_ids = [int(id) for id in cuotas_ids_str.split(",")]

    # 3. Consultar la base de datos como fuente de verdad
    prestamo = db.query(models.Prestamo).filter(models.Prestamo.id == prestamo_id).first()
    if not prestamo:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado.")
        
    cuotas = db.query(models.Cuota).filter(models.Cuota.id.in_(cuotas_ids)).all()

    # 4. Calcular el monto real que el usuario DEBÍA pagar según la BD
    monto_total_db = sum(c.monto for c in cuotas)
    
    # 5. Extraer el monto que Transbank EFECTIVAMENTE cobró
    monto_cobrado_tbk = response.get("amount")

    # 6. VALIDACIÓN CRÍTICA DE SEGURIDAD (Prevención de Fraude)
    if monto_total_db != monto_cobrado_tbk:
        # Aquí detenemos el fraude. Si alguien adulteró los IDs, los montos no cuadrarán.
        raise HTTPException(
            status_code=400, 
            detail=f"Inconsistencia financiera: El monto cobrado ({monto_cobrado_tbk}) no coincide con el valor de las cuotas solicitadas ({monto_total_db})."
        )

    # 7. Si llegamos aquí, la transacción es legítima y segura. Procedemos a actualizar.
    for cuota in cuotas:
        cuota.estado = "PAGADO"
        cuota.fecha_pago = date.today()
        cuota.comprobante_pago = f"WEBPAY-AUTH-{response.get('authorization_code', 'N/A')}"

    cuotas_restantes = db.query(models.Cuota).filter(
        models.Cuota.prestamo_id == prestamo_id,
        models.Cuota.estado == "PENDIENTE"
    ).count()
    
    prestamo.cuotas_faltantes = cuotas_restantes
    if cuotas_restantes == 0:
        prestamo.estado = "PAGADO"
    
    db.commit()

    return {
        "mensaje": "Pago registrado y validado correctamente", 
        "monto": monto_cobrado_tbk, 
        "auth_code": response.get('authorization_code')
    }


# =========================================================================
# EVALUACIÓN DE RIESGO
# =========================================================================

@app.post("/probabilidad", response_model=schemas.ProbabilidadResponse)
def endpoint_probabilidad(request: schemas.ProbabilidadRequest):
    """Evalúa el riesgo de una simulación puntual en vivo"""
    resultado = calcular_probabilidad(
        ingreso=request.ingreso,
        deuda=request.deuda,
        factor=request.factor_contrato,
        cuota=request.cuota
    )
    return resultado


@app.post("/sugerencias", response_model=schemas.SugerenciasResponse)
def endpoint_sugerencias(request: schemas.DatosSocioeconomicos):
    """Genera inteligentemente las 3 mejores opciones procesadas"""
    opciones = generar_sugerencias_inteligentes(
        ingreso=request.ingreso,
        deuda=request.deuda,
        factor=request.factor_contrato
    )
    return {"opciones": opciones}

