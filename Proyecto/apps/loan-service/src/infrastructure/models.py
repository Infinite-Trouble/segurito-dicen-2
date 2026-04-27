import uuid
from sqlalchemy import Column, String, Integer, Date, BigInteger, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class Solicitud(Base):
    __tablename__ = "solicitud"

    # El diagrama marca Solicitud ID como PK y UUID (del usuario) como FK
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id = Column(UUID(as_uuid=True), nullable=False, index=True) 
    fecha = Column(Date, default=datetime.utcnow().date)
    estado = Column(String, default="PENDIENTE")
    monto = Column(BigInteger, nullable=False)
    plazo = Column(Integer, nullable=False)
    contrato_firmado = Column(String, nullable=True) # URL o Path al archivo

    # Relaciones
    prestamo = relationship("Prestamo", back_populates="solicitud", uselist=False)
    carnet = relationship("Carnet", back_populates="solicitud", uselist=False)
    liquidacion = relationship("CertificadoLiquidacion", back_populates="solicitud", uselist=False)
    cotizaciones = relationship("CertificadoCotizaciones", back_populates="solicitud", uselist=False)
    deudas = relationship("CertificadoDeudas", back_populates="solicitud", uselist=False)

class Prestamo(Base):
    __tablename__ = "prestamo"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    solicitud_id = Column(UUID(as_uuid=True), ForeignKey("solicitud.id"), unique=True)
    cuotas_faltantes = Column(Integer, nullable=False)
    estado = Column(String, nullable=False)
    monto_total = Column(BigInteger, nullable=False)

    solicitud = relationship("Solicitud", back_populates="prestamo")
    cuotas = relationship("Cuota", back_populates="prestamo")

class Cuota(Base):
    __tablename__ = "cuota"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prestamo_id = Column(UUID(as_uuid=True), ForeignKey("prestamo.id"))
    monto = Column(BigInteger, nullable=False)
    fecha_limite = Column(Date, nullable=False)
    fecha_pago = Column(Date, nullable=True)
    estado = Column(String, nullable=False)
    comprobante_pago = Column(String, nullable=True)

    prestamo = relationship("Prestamo", back_populates="cuotas")

# --- Modelos de Certificados (Documentación) ---

class Carnet(Base):
    __tablename__ = "documento_carnet"
    solicitud_id = Column(UUID(as_uuid=True), ForeignKey("solicitud.id"), primary_key=True)
    nombre = Column(String, nullable=False)
    rut = Column(String, nullable=False)
    numero_cedula = Column(String, nullable=False)
    vigencia = Column(Boolean, default=True)
    archivo_url = Column(String, nullable=False)
    solicitud = relationship("Solicitud", back_populates="carnet")

class CertificadoLiquidacion(Base):
    __tablename__ = "certificado_liquidacion"
    solicitud_id = Column(UUID(as_uuid=True), ForeignKey("solicitud.id"), primary_key=True)
    total_haberes = Column(Integer)
    total_descuento = Column(Integer)
    sueldo_liquido = Column(Integer)
    archivo_url = Column(String)
    solicitud = relationship("Solicitud", back_populates="liquidacion")

class CertificadoCotizaciones(Base):
    __tablename__ = "certificado_cotizaciones"
    solicitud_id = Column(UUID(as_uuid=True), ForeignKey("solicitud.id"), primary_key=True)
    meses_cotizados_consecutivos = Column(Integer)
    rut_empleador = Column(String)
    archivo_url = Column(String)
    solicitud = relationship("Solicitud", back_populates="cotizaciones")

class CertificadoDeudas(Base):
    __tablename__ = "certificado_deudas"
    solicitud_id = Column(UUID(as_uuid=True), ForeignKey("solicitud.id"), primary_key=True)
    deudas_totales = Column(Integer)
    mora_90_dias = Column(Integer)
    archivo_url = Column(String)
    solicitud = relationship("Solicitud", back_populates="deudas")