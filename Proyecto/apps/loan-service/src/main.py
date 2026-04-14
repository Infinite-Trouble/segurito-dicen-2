from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from logic.calculator import calcular_prestamo
from dependencies import get_current_user_id
from sqlalchemy.orm import Session
from infrastructure import database, models
import schemas

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
    db: Session = Depends(get_db),
    usuario_id: str = Depends(get_current_user_id) # Esto bloquea peticiones sin token válido
):
    # 1. Instanciar el modelo de la BD
    nueva_solicitud = models.Solicitud(
        usuario_id=usuario_id,
        monto=solicitud.monto,
        plazo=solicitud.plazo
        # estado y fecha_solicitud se ponen solos por los valores por defecto en models.py
    )

    # 2. Guardar en la base de datos
    db.add(nueva_solicitud)
    db.commit()
    db.refresh(nueva_solicitud) # Para obtener el ID generado

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