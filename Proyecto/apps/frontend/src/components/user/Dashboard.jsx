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

  // ==========================================
  // ESTAS SON LAS FUNCIONES QUE FALTABAN:
  // ==========================================
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-CL', options);
  };

  const renderEstadoSolicitud = (estado) => {
    const est = estado?.toUpperCase();
    
    if (est === 'APROBADA') {
      // Verde tenue
      return <span className="px-3 py-1 bg-green-100 text-green-800 border border-green-200 text-[10px] font-bold rounded-full">Aprobada</span>;
    } else if (est === 'RECHAZADA') {
      // Rojo tenue
      return <span className="px-3 py-1 bg-red-100 text-red-800 border border-red-200 text-[10px] font-bold rounded-full">Rechazada</span>;
    } else {
      // Amarillo tenue (Por defecto / Pendiente)
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 border border-yellow-200 text-[10px] font-bold rounded-full">Pendiente</span>;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      
      {/* Navegación y Cabecera */}
      <div className="mb-8">
        <button 
          onClick={() => setVista('inicio')}
          className="flex items-center gap-2 text-[#00346f] font-semibold text-sm hover:translate-x-[-4px] transition-transform"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Volver a Simulación
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Mi Panel de Control</h1>
          <p className="text-slate-500 max-w-md">Gestiona tus solicitudes de crédito y préstamos activos con total transparencia y seguridad.</p>
        </div>
        <button 
          onClick={() => setVista('perfil')}
          className="px-6 py-3 border border-slate-300 text-[#00346f] font-bold rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-lg">manage_accounts</span>
          Configurar Mi Cuenta
        </button>
      </div>

      <div className="space-y-12">
        
        {/* SECCIÓN DE PRÉSTAMOS ACTIVOS */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#00346f] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00346f]">account_balance_wallet</span>
              Préstamos Activos
            </h2>
          </div>
          
          {datos.prestamos.length > 0 ? (
            <div className="grid gap-6">
              {datos.prestamos.map((p) => (
                <div key={p.id} className="bg-[#00346f] p-8 rounded-2xl text-white relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#70d8c8]/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                  
                  <div className="relative z-10 grid md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-[#d7e2ff] text-xs font-bold uppercase tracking-widest mb-2">Total a Pagar</p>
                      <h3 className="text-4xl font-extrabold mb-6">{formatCurrency(p.monto_total)}</h3>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                          <span className="text-[#d7e2ff] text-sm">Cuota Mensual</span>
                          <span className="font-bold">{formatCurrency(p.valor_cuota)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                          <span className="text-[#d7e2ff] text-sm">Próximo Vencimiento</span>
                          <span className="font-bold">{formatDate(p.fecha_proximo_pago)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div className="px-3 py-1 bg-[#8df5e4] text-[#003d36] font-bold text-[10px] rounded-full uppercase">
                          {p.estado}
                        </div>
                        <span className="material-symbols-outlined text-white/40">credit_card</span>
                      </div>
                      
                      <div>
                        <p className="text-[#d7e2ff] text-[10px] font-bold uppercase mb-1">
                          Préstamo de Consumo #{p.id}
                        </p>
                        <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#70d8c8]" 
                            style={{ width: `${(p.cuotas_pagadas / p.cuotas_totales) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-right text-[10px] mt-1 text-[#d7e2ff]">
                          {p.cuotas_pagadas} de {p.cuotas_totales} cuotas
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
              No posees préstamos vigentes en este momento.
            </div>
          )}
        </section>

        {/* SECCIÓN DE ESTADO DE SOLICITUDES */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#00346f] flex items-center gap-2">
              <span className="material-symbols-outlined">pending_actions</span>
              Estado de mis Solicitudes
            </h2>
          </div>
          
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Monto</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Plazo</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {datos.solicitudes.length > 0 ? (
                    datos.solicitudes.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5 font-medium text-sm text-slate-900">{formatDate(s.fecha_solicitud)}</td>
                        <td className="px-6 py-5 font-bold text-sm text-slate-900">{formatCurrency(s.monto)}</td>
                        <td className="px-6 py-5 text-sm text-slate-500">{s.plazo} meses</td>
                        <td className="px-6 py-5">
                          {renderEstadoSolicitud(s.estado)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500 text-sm">
                        No tienes solicitudes activas. Si necesitas financiamiento, vuelve al simulador.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Dashboard;