primero hacer el entorno virtual

python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install google-cloud-vision

Pasos para configuración de API key.

1. Crear la Cuenta de Servicio y asignar permisos
En la Consola de Google Cloud, ve a IAM y administración > Cuentas de servicio.
Haz clic en + CREAR CUENTA DE SERVICIO.
Asigna un nombre (ej. vision-api-client) y haz clic en CREAR Y CONTINUAR.
Asignar Rol (Paso crítico): En el buscador de roles, busca y selecciona Cloud Vision AI > Usuario de Cloud Vision. Esto le da permiso para realizar peticiones a la API.
Haz clic en LISTO.
2. Generar y descargar el archivo JSON
En la lista de cuentas de servicio, haz clic en el correo de la cuenta que acabas de crear.
Ve a la pestaña CLAVES (Keys).
Haz clic en AGREGAR CLAVE > Crear clave nueva.
Selecciona el formato JSON y haz clic en CREAR. Se descargará un archivo .json a tu computadora.
Advertencia: Este archivo es como una contraseña; no lo subas nunca a GitHub o repositorios públicos.
3. Configurar la Variable de Entorno
Para que las librerías de Google Cloud encuentren tu credencial automáticamente, debes configurar una variable llamada GOOGLE_APPLICATION_CREDENTIALS.
4. hacer:
            export GOOGLE_APPLICATION_CREDENTIALS="/ruta/a/tu/archivo-credenciales.json"


Después, si no funciona inmediatamente y tira un error  "This API method requires billing to be enabled"
Entonces hay que hacer lo siguiente:

Cómo solucionarlo:
Vincula una cuenta de facturación:

Haz clic directamente en el enlace que aparece en tu error: https://console.developers.google.com/billing/enable?project=564001551708 .
Si ya tienes una cuenta de facturación creada (por ejemplo, la de los $300 de prueba gratuita), selecciónala para este proyecto.
Si no tienes una, la consola te guiará para crear una. Necesitarás introducir un método de pago válido.
Verifica el estado en la Consola:

Ve a Facturación > Mis proyectos.
Busca el proyecto gen-lang-client-0908685018.
Asegúrate de que en la columna "Cuenta de facturación" no diga "La facturación está desactivada".
Espera unos minutos:

Una vez habilitada, los cambios pueden tardar de 2 a 5 minutos en propagarse. Si ejecutas el script inmediatamente, podrías ver el mismo error por un momento corto.