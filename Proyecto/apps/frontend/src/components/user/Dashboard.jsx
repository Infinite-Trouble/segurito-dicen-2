import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';

const Dashboard = ({ token, setVista }) => {
  const [datos, setDatos] = useState({ solicitudes: [], prestamos: [] });
  
  // Control de estados de interacción de cuotas
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState(null);
  const [cuotas, setCuotas] = useState([]);
  
  // NUEVO: En lugar de un array de checkboxes, guardamos cuántas cuotas quiere pagar
  const [cantidadCuotasPagar, setCantidadCuotasPagar] = useState(1);
  const [exitoPago, setExitoPago] = useState(null);

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

  useEffect(() => {
    if (token) cargarDatos();
  }, [token]);

 
  // LECTOR DE RETORNO DE TRANSBANK WEBPAY PLUS =================

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token_ws = urlParams.get('token_ws'); 
    const tbk_token = urlParams.get('TBK_TOKEN'); 

    if (tbk_token) {
      alert("Has cancelado el pago en el portal de Transbank.");
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (token_ws) {
      window.history.replaceState({}, document.title, window.location.pathname);

      const confirmarPagoBackend = async () => {
        try {
          const response = await fetch('http://localhost:8001/prestamos/confirmar-pago', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token_ws: token_ws,
              cuotas: urlParams.get('cuotas'),
              prestamo: urlParams.get('prestamo')
            })
          });
          
          const data = await response.json();
          
          if (response.ok) {
            setExitoPago({
              mensaje: "¡Tu pago con Webpay Plus fue aprobado exitosamente!",
              codigo_autorizacion: data.auth_code || "N/A"
            });
          } else {
            alert(`El pago fue rechazado por el banco: ${data.detail}`);
          }
        } catch (error) {
          console.error("Error confirmando pago Webpay", error);
        } finally {
          cargarDatos(); 
        }
      };
      confirmarPagoBackend();
    }
  }, []);

  // =========================================================================

  const manejarSeleccionarPrestamo = async (prestamoId) => {
    if (prestamoSeleccionado === prestamoId) {
      setPrestamoSeleccionado(null);
      setCuotas([]);
      setCantidadCuotasPagar(1); // Reseteamos al cerrar
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:8001/prestamos/${prestamoId}/cuotas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setPrestamoSeleccionado(prestamoId);
        setCuotas(data);
        setCantidadCuotasPagar(1); // Reseteamos al abrir
      }
    } catch (error) {
      console.error("Error al cargar las cuotas del préstamo");
    }
  };

  // CÁLCULOS DINÁMICOS PARA LA UI DE PAGOS
  const cuotasPendientes = cuotas.filter(c => c.estado === 'PENDIENTE');
  const proximaCuota = cuotasPendientes.length > 0 ? cuotasPendientes[0] : null;
  
  const totalAPagar = cuotasPendientes
    .slice(0, cantidadCuotasPagar)
    .reduce((sum, c) => sum + c.monto, 0);

  // REDIRECCIÓN A WEBPAY
  const redirigirWebpay = async (e) => {
    e.preventDefault();
    
    // Extraemos secuencialmente los IDs exactos de las N cuotas que seleccionó
    const cuotasSeleccionadasIds = cuotasPendientes
      .slice(0, cantidadCuotasPagar)
      .map(c => c.id);

    try {
      const response = await fetch(`http://localhost:8001/prestamos/${prestamoSeleccionado}/iniciar-pago`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cuota_ids: cuotasSeleccionadasIds, metodo_pago: 'Webpay' })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        window.location.href = data.url_redireccion; 
      } else {
        alert("Error al iniciar pasarela de pagos: " + (data.detail || "Error desconocido."));
      }
    } catch (error) {
      alert('No se pudo conectar con el servidor para iniciar el pago.');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-CL', options);
  };

  const descargarContrato = (solicitud) => {
    const datosGuardados = JSON.parse(localStorage.getItem('datos_firma')) || {};

    const form = datosGuardados.formData || {};
    const simulacion = datosGuardados.simulacionData || {};
    const carnet = datosGuardados.carnet || {};
    const liquidacion = datosGuardados.liquidacion || {};
    const cotizaciones = datosGuardados.cotizaciones || {};
    const deudas = datosGuardados.deudas || {};

    const fecha = new Date();
    const fechaTexto = fecha.toLocaleDateString('es-CL');

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('CONTRATO DE PRÉSTAMO PERSONAL', 105, 20, { align: 'center' });

    doc.setFontSize(11);

    const textoContrato = `
  En Valparaíso, Chile, con fecha ${fechaTexto}.

  REUNIDOS

  De una parte, Sistema de Préstamos Online, en adelante denominado "el Banco".

  Y de otra parte, ${form.nombreCompleto || carnet.nombre || 'CLIENTE'}, con RUT ${form.rut || carnet.rut || 'NO INFORMADO'} y correo electrónico ${form.correo || 'NO INFORMADO'}, en adelante denominado "el Prestatario".

  CLÁUSULAS

  PRIMERA. OBJETO Y MONTO DEL PRÉSTAMO
  El Banco concede al Prestatario un préstamo por un monto total de $${simulacion.monto || solicitud.monto || 'NO INFORMADO'} CLP.

  SEGUNDA. PLAZO DE AMORTIZACIÓN
  El plazo de devolución será de ${simulacion.cuotas || simulacion.plazo || solicitud.plazo || 'NO INFORMADO'} meses.

  TERCERA. CUOTAS DE AMORTIZACIÓN
  El préstamo será pagado mediante cuotas mensuales. El valor aproximado de cada cuota será de $${simulacion.cuota_mensual || 'NO INFORMADO'} CLP.

  CUARTA. VALIDACIÓN DE DOCUMENTOS
  El Prestatario declara haber entregado y confirmado la información contenida en los siguientes documentos:
  - Cédula de identidad.
  - Última liquidación de sueldo.
  - Certificado de cotizaciones.
  - Certificado de deudas.

  QUINTA. ANTECEDENTES FINANCIEROS
  Sueldo informado: $${liquidacion.sueldo_liquido || liquidacion.sueldo || 'NO INFORMADO'} CLP.
  Cotizaciones confirmadas: ${cotizaciones.confirmado ? 'Sí' : 'No'}.
  Deudas confirmadas: ${deudas.confirmado ? 'Sí' : 'No'}.

  SEXTA. FIRMA DIGITAL
  El Prestatario valida su identidad mediante captura facial y firma digital en la plataforma.

  Y en prueba de conformidad, firma digitalmente el presente contrato.
  `;

    const lineas = doc.splitTextToSize(textoContrato, 180);
    doc.text(lineas, 15, 35);

    doc.text('Firma del Prestatario:', 15, 250);
    doc.text('Pendiente de firma', 15, 265);
    doc.text('Firma del Banco: Sistema de Préstamos Online', 110, 250);

    doc.save('contrato-prestamo-borrador.pdf');
  }; //final de agregado

  const renderEstadoSolicitud = (estado) => {
    const est = estado?.toUpperCase();
    if (est === 'APROBADA' || est === 'APROBADO') {
      return <span className="px-3 py-1 bg-green-100 text-green-800 border border-green-200 text-[10px] font-bold rounded-full">Aprobada</span>;
    } else if (est === 'RECHAZADA') {
      return <span className="px-3 py-1 bg-red-100 text-red-800 border border-red-200 text-[10px] font-bold rounded-full">Rechazada</span>;
    }
    return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 border border-yellow-200 text-[10px] font-bold rounded-full">Pendiente</span>;
  };

  // Filtramos la lista para quitar los prestamos que ya se pagaron
  const prestamosActivos = datos.prestamos.filter(p => p.cuotas_pagadas < p.cuotas_totales);

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 relative">
      
      {exitoPago && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex justify-between items-center shadow-sm animate-fade-in">
          <div>
            <p className="font-bold text-sm text-emerald-800">🎉 {exitoPago.mensaje}</p>
            <p className="text-xs text-emerald-600 mt-1">Código de Autorización: {exitoPago.codigo_autorizacion}</p>
          </div>
          <button onClick={() => setExitoPago(null)} className="text-emerald-500 font-bold hover:text-emerald-800 text-sm">Entendido</button>
        </div>
      )}

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
          <h2 className="text-xl font-bold text-[#00346f] flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined">account_balance_wallet</span>
            Préstamos Activos
          </h2>
          
          {prestamosActivos.length > 0 ? (
            <div className="grid gap-6">
              {prestamosActivos.map((p) => (
                <div key={p.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  {/* Tarjeta Visual de Resumen */}
                  <div className="bg-[#00346f] p-8 text-white relative overflow-hidden transition-colors">
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
                          <span className="px-3 py-1 bg-[#8df5e4] text-[#003d36] font-bold text-[10px] rounded-full uppercase">
                            {p.estado}
                          </span>
                        </div>
                        <div>
                          <p className="text-[#d7e2ff] text-[10px] font-bold uppercase mb-1">Préstamo de Consumo #{p.id.substring(0,8)}...</p>
                          <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-[#70d8c8]" style={{ width: `${(p.cuotas_pagadas / p.cuotas_totales) * 100}%` }}></div>
                          </div>
                          <p className="text-right text-[10px] mt-1 text-[#d7e2ff]">{p.cuotas_pagadas} de {p.cuotas_totales} cuotas liquidadas</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end relative z-10">
                      <button 
                        onClick={() => manejarSeleccionarPrestamo(p.id)}
                        className="px-5 py-2.5 bg-[#70d8c8] text-[#00346f] font-bold text-xs rounded-xl hover:bg-[#5bc2b2] transition-colors flex items-center gap-2 shadow-md"
                      >
                        <span className="material-symbols-outlined text-sm">payments</span>
                        {prestamoSeleccionado === p.id ? 'Ocultar Opciones de Pago' : 'Gestionar y Pagar Cuotas'}
                      </button>
                    </div>
                  </div>

                  {/* NUEVO PANEL DE DESARROLLO (MODO SELECTOR) */}
                  {prestamoSeleccionado === p.id && proximaCuota && (
                    <div className="p-6 bg-slate-50 border-t border-slate-200 animate-slide-down">
                      
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        {/* Tarjeta de Próximo Vencimiento */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">event</span>
                            Detalle de Próxima Cuota
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                              <span className="text-sm text-slate-600">Monto de cuota:</span>
                              <span className="font-bold text-slate-900">{formatCurrency(proximaCuota.monto)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-slate-600">Vencimiento:</span>
                              <span className="font-bold text-slate-900">{formatDate(proximaCuota.fecha_limite)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Tarjeta Selectora de Cantidad a Pagar */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                            ¿Cuántas cuotas deseas adelantar/pagar?
                          </label>
                          <select 
                            value={cantidadCuotasPagar} 
                            onChange={(e) => setCantidadCuotasPagar(Number(e.target.value))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#00346f] focus:border-[#00346f] transition-all cursor-pointer"
                          >
                            {cuotasPendientes.map((_, idx) => (
                              <option key={idx + 1} value={idx + 1}>
                                {idx + 1} {idx === 0 ? 'cuota' : 'cuotas'}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {/* Resumen final dinámico y botón de pago */}
                      <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-[#00346f]/5 border border-[#00346f]/10 rounded-xl gap-4">
                        <div>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Total Acumulado a Liquidar</span>
                          <span className="text-2xl font-extrabold text-[#00346f]">{formatCurrency(totalAPagar)}</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            ({cantidadCuotasPagar} {cantidadCuotasPagar === 1 ? 'cuota seleccionada' : 'cuotas seleccionadas'})
                          </span>
                        </div>
                        
                        <button 
                          onClick={redirigirWebpay}
                          className="w-full sm:w-auto px-6 py-3 bg-[#e41f1a] text-white font-bold text-sm rounded-lg hover:bg-[#b01410] shadow-md transition-all flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                          Pagar con Webpay Plus
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-4xl text-slate-300">task_alt</span>
              <p className="text-slate-500 font-medium">No posees préstamos vigentes con cuotas pendientes en este momento.</p>
            </div>
          )}
        </section>

        {/* SECCIÓN DE HISTORIAL DE SOLICITUDES */}
        <section>
          <h2 className="text-xl font-bold text-[#00346f] flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined">pending_actions</span>
            Estado de mis Solicitudes
          </h2>
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Plazo</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Contrato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {datos.solicitudes.length > 0 ? (
                  datos.solicitudes.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-5 font-medium text-sm text-slate-900">{formatDate(s.fecha_solicitud)}</td>
                      <td className="px-6 py-5 font-bold text-sm text-slate-900">{formatCurrency(s.monto)}</td>
                      <td className="px-6 py-5 text-sm text-slate-500">{s.plazo} meses</td>
                      <td className="px-6 py-5">{renderEstadoSolicitud(s.estado)}</td>
                      <td className="px-6 py-5">
                        {s.estado?.toUpperCase() === 'APROBADA' ? (
                          <button
                            onClick={() => descargarContrato(s)}
                            className="px-4 py-2 bg-[#00346f] text-white text-xs font-bold rounded-lg hover:bg-blue-900 flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">download</span> Descargar
                          </button>
                        ) : <span className="text-xs text-slate-400">No disponible</span>}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500 text-sm">
                      No tienes solicitudes activas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;