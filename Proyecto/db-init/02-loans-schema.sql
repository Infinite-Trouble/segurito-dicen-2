-- Estructura para LOANS_DB

CREATE DATABASE loans_db;
\c loans_db;

CREATE TABLE IF NOT EXISTS solicitud (
    id UUID PRIMARY KEY,
    usuario_id UUID NOT NULL, -- Referencia lógica al microservicio de usuarios
    fecha DATE DEFAULT CURRENT_DATE,
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    monto BIGINT NOT NULL,
    plazo INTEGER NOT NULL,
    contrato_firmado TEXT
);

CREATE INDEX IF NOT EXISTS idx_solicitud_usuario ON solicitud(usuario_id);

CREATE TABLE IF NOT EXISTS prestamo (
    id UUID PRIMARY KEY,
    solicitud_id UUID UNIQUE REFERENCES solicitud(id),
    cuotas_faltantes INTEGER NOT NULL,
    estado VARCHAR(50) NOT NULL,
    monto_total BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS cuota (
    id SERIAL PRIMARY KEY,
    prestamo_id UUID REFERENCES prestamo(id),
    monto BIGINT NOT NULL,
    fecha_limite DATE NOT NULL,
    fecha_pago DATE,
    estado VARCHAR(50) NOT NULL,
    comprobante_pago TEXT
);

-- Modelos de Certificados (Documentación)
CREATE TABLE IF NOT EXISTS documento_carnet (
    solicitud_id UUID PRIMARY KEY REFERENCES solicitud(id),
    nombre VARCHAR(255) NOT NULL,
    rut VARCHAR(20) NOT NULL,
    numero_cedula VARCHAR(50) NOT NULL,
    vigencia BOOLEAN DEFAULT TRUE,
    archivo_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS certificado_liquidacion (
    solicitud_id UUID PRIMARY KEY REFERENCES solicitud(id),
    total_haberes INTEGER,
    total_descuento INTEGER,
    sueldo_liquido INTEGER,
    archivo_url TEXT
);

CREATE TABLE IF NOT EXISTS certificado_cotizaciones (
    solicitud_id UUID PRIMARY KEY REFERENCES solicitud(id),
    meses_cotizados_consecutivos INTEGER,
    rut_empleador VARCHAR(20),
    archivo_url TEXT
);

CREATE TABLE IF NOT EXISTS certificado_deudas (
    solicitud_id UUID PRIMARY KEY REFERENCES solicitud(id),
    deudas_totales INTEGER,
    carga_financiera INTEGER,
    archivo_url TEXT
);
