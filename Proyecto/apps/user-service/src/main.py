from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from infrastructure.db.database import get_db, engine
from infrastructure.db.models import UserTable
from infrastructure.auth.hash_handler import hash_password
from infrastructure.auth.hash_handler import verify_password
from infrastructure.auth.jwt_handler import create_access_token
from infrastructure.db import models
from dotenv import load_dotenv
import schemas
import jwt
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


app = FastAPI()

# Configuración de CORS: Necesaria para permitir peticiones desde el origen del Frontend (Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/register")
def register_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Registra un nuevo cliente en el sistema.
    
    1. Valida unicidad de RUT y Email.
    2. Aplica hashing a la contraseña para almacenamiento seguro.
    3. Persiste los datos en la base de datos relacional.
    """
    db_user = db.query(UserTable).filter(
        (UserTable.rut == user_data.rut) | (UserTable.email == user_data.email)
    ).first()
    
    if db_user:
        raise HTTPException(status_code=400, detail="El RUT o Email ya está registrado")

    new_user = UserTable(
        rut=user_data.rut,
        nombre=user_data.nombre,
        apellido=user_data.apellido,
        email=user_data.email,
        password=hash_password(user_data.password),
        telefono=user_data.telefono
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "Usuario registrado exitosamente", "user_id": str(new_user.id)}

@app.post("/login")
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    # 1. Buscar al usuario por email
    user = db.query(UserTable).filter(UserTable.email == login_data.email).first()
    
    # 2. Verificar existencia y contraseña (usando el verificador de hash)
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    # 3. Generar el token incluyendo el RUT y el ID del usuario
    token = create_access_token(data={"sub": str(user.id), "rut": user.rut, "email": user.email})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"nombre": user.nombre, 
                 "apellido": user.apellido,
                 "email": user.email,
                 "telefono": user.telefono
        }
    }

@app.put("/perfil")
def actualizar_perfil(datos_nuevos: dict, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        # 1. Decodificar el token para obtener el ID del usuario (que guardamos como 'sub')
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
            
        # 2. Buscar al usuario usando UserTable y el ID del token
        usuario = db.query(UserTable).filter(UserTable.id == user_id).first()
        
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # 3. Actualizar campos
        if "telefono" in datos_nuevos:
            usuario.telefono = datos_nuevos["telefono"]
            
        if "email" in datos_nuevos and datos_nuevos["email"] != usuario.email:
            existe = db.query(UserTable).filter(UserTable.email == datos_nuevos["email"]).first()
            if existe:
                raise HTTPException(status_code=400, detail="El email ya está en uso")
            usuario.email = datos_nuevos["email"]

        if "password" in datos_nuevos and datos_nuevos["password"]:
            # Usamos el hash_password que ya tienes importado arriba
            usuario.password = hash_password(datos_nuevos["password"])

        db.commit() 
        return {"status": "success", "message": "Perfil actualizado correctamente"}

    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token expirado o inválido")