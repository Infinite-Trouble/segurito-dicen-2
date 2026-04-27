Para ver cómo funciona la wea en principio se puede hacer ordinariamente en PoC

Para verlo medio medianamente real, así:

cd apps/scan-service
source venv/bin/activate
pip install fastapi uvicorn google-cloud-vision python-dotenv python-multipart pydantic  
uvicorn src.main:app --reload --host 0.0.0.0 --port 8002

Si se levanta, para probar a la mala (porque no hay frontend todavía) es lo siguiente:

curl -X POST http://localhost:8002/analyze \
-F "file=@test_carnet.jpeg" \
-F "document_type=carnet"



Para hacer la consulta por las weas asociadas al prestamo:

docker exec -it postgres_db psql -U user_admin -d loans_db -c "

SELECT 

s.id AS solicitud_id,

s.monto,

c.nombre AS nombre_carnet,

c.rut AS rut_carnet,

l.sueldo_liquido,

cot.meses_cotizados_consecutivos AS meses_afp,

d.deudas_totales,

d.carga_financiera AS mora_90_dias

FROM solicitud s

LEFT JOIN documento_carnet c ON s.id = c.solicitud_id

LEFT JOIN certificado_liquidacion l ON s.id = l.solicitud_id

LEFT JOIN certificado_cotizaciones cot ON s.id = cot.solicitud_id

LEFT JOIN certificado_deudas d ON s.id = d.solicitud_id

ORDER BY s.fecha DESC LIMIT 1;"




PARA RESETEAR LOS CONTENEDORES Y QUE SE APLIQUEN LOS CAMBIOS EN LAS BASES DE DATOS
docker compose down -v && docker compose up -d
