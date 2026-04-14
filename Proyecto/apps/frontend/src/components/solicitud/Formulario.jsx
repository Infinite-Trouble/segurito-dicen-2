import { useState } from 'react';

const Formulario = ({ simulacionData, setVista }) => {
  const [formData, setFormData] = useState({
    rut: '',
    nombreCompleto: '',
    correo: ''
  });

  const [errorSesion, setErrorSesion] = useState(false);

  const formatCurrency = (value) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      setErrorSesion(true);
      return;
    }
    setErrorSesion(false);

    const payload = {
      monto: simulacionData?.monto,
      plazo: simulacionData?.cuotas
    };

    try {
      const response = await fetch('http://localhost:8001/solicitud', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('¡Éxito! Su solicitud ha sido ingresada para revisión.');
        setVista('dashboard'); 
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
    <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Botón Volver */}
      <div className="mb-8">
        <button 
          onClick={() => setVista('inicio')}
          className="flex items-center gap-2 text-[#00346f] font-semibold text-sm hover:translate-x-[-4px] transition-transform"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Volver a Simulación
        </button>
      </div>

      <header className="mb-10 text-left">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#00346f] tracking-tight">Completa tu Solicitud</h1>
        <p className="text-slate-500 mt-2 max-w-2xl">Estamos a un paso de concretar tu financiamiento. Por favor, revisa tus datos y confirma el resumen de tu simulación.</p>
      </header>

      {/* BLOQUE DE ERROR DE SESIÓN */}
      {errorSesion && (
        <section className="mb-8">
          <div className="bg-[#ffdad6] p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 border border-[#ba1a1a]/20">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#ba1a1a]">error</span>
              <span className="text-[#ba1a1a] font-medium">Tu sesión ha expirado por motivos de seguridad.</span>
            </div>
            <button 
              type="button" 
              onClick={() => setVista('login')}
              className="bg-[#ba1a1a] text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-all active:scale-95 text-sm whitespace-nowrap"
            >
              Ir a Iniciar Sesión
            </button>
          </div>
        </section>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LADO IZQUIERDO: FORMULARIO DE DATOS */}
        <div className="lg:col-span-7 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-[#00346f] mb-8 flex items-center gap-2">
            <span className="material-symbols-outlined">person</span>
            Datos del Solicitante
          </h2>
          
          <div className="space-y-8">
            <div className="group relative">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="rut">RUT</label>
              <input 
                className="w-full bg-transparent border-0 border-b-2 border-slate-200 focus:ring-0 focus:border-[#00346f] transition-colors py-2 text-slate-900 font-medium placeholder:text-slate-300 outline-none" 
                id="rut" 
                name="rut" 
                value={formData.rut}
                onChange={handleChange}
                placeholder="12.345.678-K" 
                type="text"
                required
              />
            </div>
            
            <div className="group relative">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="nombreCompleto">Nombre Completo</label>
              <input 
                className="w-full bg-transparent border-0 border-b-2 border-slate-200 focus:ring-0 focus:border-[#00346f] transition-colors py-2 text-slate-900 font-medium placeholder:text-slate-300 outline-none" 
                id="nombreCompleto" 
                name="nombreCompleto" 
                value={formData.nombreCompleto}
                onChange={handleChange}
                placeholder="Ej: Juan Pérez González" 
                type="text"
                required
              />
            </div>
            
            <div className="group relative">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="correo">Correo Electrónico</label>
              <input 
                className="w-full bg-transparent border-0 border-b-2 border-slate-200 focus:ring-0 focus:border-[#00346f] transition-colors py-2 text-slate-900 font-medium placeholder:text-slate-300 outline-none" 
                id="correo" 
                name="correo" 
                value={formData.correo}
                onChange={handleChange}
                placeholder="juan.perez@ejemplo.com" 
                type="email"
                required
              />
            </div>
          </div>
        </div>

        {/* LADO DERECHO: RESUMEN DE LA SIMULACIÓN */}
        <div className="lg:col-span-5 flex flex-col gap-6 sticky top-8">
          <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00346f]/5 rounded-full blur-3xl"></div>
            
            <h2 className="text-xl font-bold text-[#00346f] mb-8 flex items-center gap-2 relative z-10">
              <span className="material-symbols-outlined">analytics</span>
              Resumen de tu Simulación
            </h2>
            
            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-end border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monto Solicitado</p>
                  <p className="text-lg font-semibold text-[#00346f] mt-1">{formatCurrency(simulacionData?.monto)}</p>
                </div>
                <span className="material-symbols-outlined text-slate-400">payments</span>
              </div>
              
              <div className="flex justify-between items-end border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plazo</p>
                  <p className="text-lg font-semibold text-[#00346f] mt-1">{simulacionData?.cuotas} Meses</p>
                </div>
                <span className="material-symbols-outlined text-slate-400">calendar_month</span>
              </div>
              
              <div className="bg-[#00346f] p-6 rounded-lg shadow-lg text-white">
                <p className="text-xs font-bold text-[#9bbdff] uppercase tracking-wider mb-1">Cuota Mensual Aprox</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold">{formatCurrency(simulacionData?.cuota_mensual)}</span>
                  <span className="text-[#9bbdff] text-sm">/mes</span>
                </div>
              </div>
              
              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#00346f] to-[#004a99] text-white py-4 rounded-xl font-bold text-lg shadow-md hover:shadow-none hover:translate-y-0.5 active:scale-95 transition-all duration-300"
                >
                  Finalizar y Enviar
                </button>
                <p className="text-center text-[10px] text-slate-400 mt-4 leading-tight px-2">
                  Al hacer clic en "Finalizar y Enviar", aceptas nuestros términos de servicio y políticas de privacidad para el tratamiento de datos financieros.
                </p>
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};

export default Formulario;