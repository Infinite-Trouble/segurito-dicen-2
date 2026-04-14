import { useState } from 'react';

const Formulario = ({ simulacionData, setVista }) => {
  // Estado para los inputs (aunque el backend no los pida, los mantenemos por la UI del video)
  const [formData, setFormData] = useState({
    rut: '',
    nombreCompleto: '',
    correo: ''
  });

  const [errorSesion, setErrorSesion] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. VALIDAR SESIÓN: Leemos el token tal como lo haces en App.jsx
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      setErrorSesion(true); // Activa el mensaje rojo
      return; // Detiene el envío
    }

    setErrorSesion(false);

    // 2. PREPARAR PAYLOAD: Solo enviamos lo que pide models.py
    const payload = {
      monto: simulacionData?.monto,
      plazo: simulacionData?.cuotas
    };

    // 3. ENVIAR AL LOAN-SERVICE (Puerto 8001)
    try {
      const response = await fetch('http://localhost:8001/solicitud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // El token JWT que autoriza la petición
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Su solicitud ha sido ingresada para revisión');
        setVista('dashboard'); // Redirigimos al panel de usuario al terminar
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Hubo un problema al enviar la solicitud');
      }
    } catch (error) {
      console.error('Error conectando con loan-service:', error);
      alert('Error de conexión con el servidor de préstamos');
    }
  };

  return (
    <div>
      <h2>Paso 2 - Completa tu Solicitud</h2>

      {/* BLOQUE DE ERROR DE SESIÓN */}
      {errorSesion && (
        <div style={{ color: '#ba1a1a', backgroundColor: '#ffdad6', padding: '15px', marginBottom: '20px', border: '1px solid #ba1a1a', borderRadius: '4px' }}>
          <p><strong>✖ Error de Sesión:</strong> Debes iniciar sesión para enviar una solicitud.</p>
          <button 
            type="button" 
            onClick={() => setVista('login')}
            style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}
          >
            Ir a Iniciar Sesión
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '40px' }}>
        
        {/* LADO IZQUIERDO: FORMULARIO DE DATOS */}
        <div style={{ flex: 1 }}>
          <h3>Datos del Solicitante</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block' }}>RUT (sin puntos y con guión)</label>
            <input 
              type="text" 
              name="rut" 
              value={formData.rut} 
              onChange={handleChange} 
              required 
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block' }}>Nombre completo</label>
            <input 
              type="text" 
              name="nombreCompleto" 
              value={formData.nombreCompleto} 
              onChange={handleChange} 
              required 
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block' }}>Correo electrónico</label>
            <input 
              type="email" 
              name="correo" 
              value={formData.correo} 
              onChange={handleChange} 
              required 
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        </div>

        {/* LADO DERECHO: RESUMEN DE LA SIMULACIÓN */}
        <div style={{ flex: 1, backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
          <h3>Resumen de tu Simulación</h3>
          <p><strong>Monto Solicitado:</strong> ${simulacionData?.monto}</p>
          <p><strong>Plazo:</strong> {simulacionData?.cuotas} meses</p>
          <p><strong>Cuota Mensual Aprox:</strong> ${simulacionData?.cuota_mensual}</p>
          
          <button 
            type="submit"
            style={{ width: '100%', padding: '12px', marginTop: '20px', cursor: 'pointer', backgroundColor: '#00346f', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Finalizar y Enviar
          </button>
        </div>

      </form>
    </div>
  );
};

export default Formulario;