import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class UserTable(Base):
    """
    Representación de la tabla 'users' en PostgreSQL.
    Define la estructura de identidad del cliente siguiendo el modelo de dominio.
    """
    __tablename__ = "users"

    # Usamos UUID para evitar IDs secuenciales predecibles y mejorar la seguridad
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # RUT como índice único para búsquedas rápidas durante el login/registro
    rut = Column(String(12), unique=True, nullable=False, index=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    # Almacenará el hash resultante de Bcrypt, nunca la clave real
    password = Column(String(255), nullable=False) 
    email = Column(String(150), unique=True, nullable=False)
    telefono = Column(String(20), nullable=True)
    verificado = Column(Boolean, default=False)

    # Relación con Cuenta Bancaria
    # Esto permite hacer consultas como estas:
    #           
    #               usuario_id: str = Depends(get_current_user_id)
    #               solicitudes = db.query(models.Solicitud).filter(models.Solicitud.usuario_id == usuario_id).all()
    # así:
    #               usuario_id: str = Depends(get_current_user_id)
    #               user = db.query(models.User).filter(models.User.id == usuario_id).first()
    #               solicitudes = user.solicitudes
    #              
    # al final esto hace una consulta más cuando hay que cruzar bases de datos,
    # pero por ejemplo si fuese solo para consultar por las cuentas bancarias
    # bum babi, aquí funciona mucho mejor. por ejemplo si se quiere consultar por cuentas de un usuario
    #           
    #           @app.get("/mis-cuentas")
    #           def obetener_cuentas:
    #               user: models.User = Depends(get_current_user)
    #               return user.cuentas
    # y listo!

    cuentas = relationship("CuentaBancaria", back_populates="usuario")
    
class CuentaBancaria(Base):
    __tablename__ = "cuentas_bancarias"

    # En el diagrama UUID es FK hacia Usuario
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    numero_cuenta = Column(String(50), primary_key=True) # PK compuesta o única
    nombre_titular = Column(String(200), nullable=False)
    tipo_cuenta = Column(String(50), nullable=False)
    banco = Column(String(100), nullable=False)

    usuario = relationship("UserTable", back_populates="cuentas")
    