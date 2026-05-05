import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Carga las variables del archivo .env al sistema
load_dotenv()

GMAIL_SENDER = os.getenv("GMAIL_SENDER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

def enviar_correo_cambio_estado(correo_destino: str, monto: int, plazo: int, nuevo_estado: str = "Pendiente"):
    """
    Envía un correo electrónico asíncrono sobre el estado de la solicitud vía Gmail SMTP.
    """
    try:
        # 1. Configurar la estructura del correo
        msg = MIMEMultipart()
        msg["From"] = f"Sistema de Préstamos <{GMAIL_SENDER}>"
        msg["To"] = correo_destino
        msg["Subject"] = f"Actualización de tu Solicitud de Préstamo - Estado: {nuevo_estado}"
        # 2. Cuerpo en formato HTML
        html_body = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #008080;">¡Hola! Tienes novedades en tu solicitud</h2>
            <p>Te escribimos para informarte que tu solicitud de crédito por el monto de <strong>${monto:,}</strong> a un plazo de <strong>{plazo} meses</strong>, se encuentra actualmente en estado:</p>
            
            <h3 style="background-color: #f1f5f9; padding: 10px; border-left: 4px solid #008080; display: inline-block;">
                {nuevo_estado.upper()}
            </h3>
            
            <p>Puedes revisar más detalles directamente en tu Portal de Gestión.</p>
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">Este es un correo automático, por favor no lo respondas.</p>
        </div>
        """
        
        # Adjuntamos el HTML al mensaje
        msg.attach(MIMEText(html_body, "html"))
        # 3. Conectar al servidor de Google y enviar
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_SENDER, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_SENDER, correo_destino, msg.as_string())
            
        print(f"Correo enviado exitosamente a {correo_destino} vía Gmail.")
        return True
        
    except Exception as e:
        print(f"Error al enviar correo a {correo_destino} vía Gmail: {str(e)}")
        return False