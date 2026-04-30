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
    background_tasks: BackgroundTasks, # NUEVO: Herramienta para tareas asíncronas
    db: Session = Depends(get_db),
    usuario_id: str = Depends(get_current_user_id),
    email: str = Depends(get_current_user_email) # NUEVO: Obtenemos el email
):
    # 1. Instanciar el modelo de la BD
    nueva_solicitud = models.Solicitud(
        usuario_id=usuario_id,
        monto=solicitud.monto,
        plazo=solicitud.plazo
    )

    # 2. Guardar en la base de datos
    db.add(nueva_solicitud)
    db.commit()
    db.refresh(nueva_solicitud) 

    # 3. NUEVO: Disparar el correo asíncrono en segundo plano
    background_tasks.add_task(
        enviar_correo_cambio_estado,
        correo_destino=email,
        monto=solicitud.monto,
        plazo=solicitud.plazo,
        nuevo_estado="Pendiente"
    )

    return nueva_solicitud


@app.get("/datos")
def obtener_datos_usuario(
    db: Session = Depends(get_db),
    usuario_id: str = Depends(get_current_user_id)
):
    # Buscamos en la base de datos filtrando por el ID del usuario
    solicitudes = db.query(models.Solicitud).filter(models.Solicitud.usuario_id == usuario_id).all()
    prestamos = db.query(models.Prestamo).filter(models.Prestamo.usuario_id == usuario_id).all()
    
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
