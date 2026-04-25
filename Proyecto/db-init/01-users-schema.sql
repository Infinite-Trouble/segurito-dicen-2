-- Estructura para USERS_DB
-- PostgreSQL se conecta a esta DB por defecto según docker-compose.yml

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    rut VARCHAR(12) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    verificado BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_users_rut ON users(rut);

CREATE TABLE IF NOT EXISTS cuentas_bancarias (
    usuario_id UUID REFERENCES users(id),
    numero_cuenta VARCHAR(50),
    nombre_titular VARCHAR(200) NOT NULL,
    tipo_cuenta VARCHAR(50) NOT NULL,
    banco VARCHAR(100) NOT NULL,
    PRIMARY KEY (usuario_id, numero_cuenta)
);
