from fastapi import FastAPI, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from logic.calculator import calcular_prestamo, calcular_probabilidad, generar_sugerencias_inteligentes
from dependencies import get_current_user_id, get_current_user_email
from sqlalchemy.orm import Session
from infrastructure import database, models
import schemas
from infrastructure.notifications import enviar_correo_cambio_estado

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
    # 1. Crear la solicitud base
    nueva_solicitud = models.Solicitud(
        usuario_id=usuario_id,
        monto=solicitud.monto,
        plazo=solicitud.plazo,
        estado="APROBADO"
    )
    db.add(nueva_solicitud)
    db.flush() # Flush para obtener el ID de la solicitud sin hacer commit todavía

    # 2. Crear registros de documentos asociados
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
    
    # 3. Confirmar cambios
    db.commit()
    db.refresh(nueva_solicitud)

    # 4. Disparar el correo asíncrono en segundo plano
    background_tasks.add_task(
        enviar_correo_cambio_estado,
        correo_destino=email,
        monto=solicitud.monto,
        plazo=solicitud.plazo,
        nuevo_estado="Aprobado"
    )

    return nueva_solicitud


@app.get("/datos")
def obtener_datos_usuario(
    db: Session = Depends(get_db),
    usuario_id: str = Depends(get_current_user_id)
):
    # Buscamos en la base de datos filtrando por el ID del usuario
    solicitudes = db.query(models.Solicitud).filter(models.Solicitud.usuario_id == usuario_id).all()
    
    # Para obtener los préstamos, debemos unir con la tabla Solicitud
    prestamos = db.query(models.Prestamo)\
        .join(models.Solicitud)\
        .filter(models.Solicitud.usuario_id == usuario_id)\
        .all()
    
    # Retornamos exactamente la estructura que espera tu Dashboard.jsx
    return {
        "solicitudes": solicitudes,
        "prestamos": prestamos
    }

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
