import { useEffect, useState } from 'react';

const Dashboard = ({ token, setVista }) => {
  const [datos, setDatos] = useState({ solicitudes: [], prestamos: [] });

  // Aquí es donde el frontend conecta con PostgreSQL a través del loan-service
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const response = await fetch('http://localhost:8001/datos', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) setDatos(data);
      } catch (error) {
        console.error("Error al cargar el panel");
      }
    };
    if (token) cargarDatos();
  }, [token]);

  return (
    <div style={{ padding: '20px' }}>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setVista('inicio')} 
          style={{ cursor: 'pointer', padding: '8px 12px', border: '1px solid #333', background: '#f0f0f0' }}
        >
          Ir a Simulación de Prestamo
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Mi Panel de Control</h2>
        <button 
          onClick={() => setVista('perfil')}
          style={{ padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Configurar Mi Cuenta
        </button>
      </div>
      
      {/* SECCIÓN DE SOLICITUDES */}
      <section style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px' }}>
        <h3>Estado de mis Solicitudes</h3>
        <table style={{ width: '100%', textAlign: 'left' }}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Monto</th>
              <th>Plazo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {datos.solicitudes.map((s) => (
              <tr key={s.id}>
                <td>{s.fecha_solicitud}</td>
                <td>${s.monto.toLocaleString()}</td>
                <td>{s.plazo} meses</td>
                <td>{s.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {datos.solicitudes.length === 0 && <p>No tienes solicitudes activas.</p>}
      </section>

      {/* SECCIÓN DE PRÉSTAMOS */}
      <section style={{ border: '1px solid #ccc', padding: '15px' }}>
        <h3>Préstamos Activos</h3>
        <table style={{ width: '100%', textAlign: 'left' }}>
          <thead>
            <tr>
              <th>Cuota</th>
              <th>Total a Pagar</th>
              <th>Próximo Vencimiento</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {datos.prestamos.map((p) => (
              <tr key={p.id}>
                <td>${p.valor_cuota.toLocaleString()}</td>
                <td>${p.monto_total.toLocaleString()}</td>
                <td>{p.fecha_pago}</td>
                <td>{p.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {datos.prestamos.length === 0 && <p>No posees préstamos vigentes.</p>}
      </section>
    </div>
  );
};

export default Dashboard; 