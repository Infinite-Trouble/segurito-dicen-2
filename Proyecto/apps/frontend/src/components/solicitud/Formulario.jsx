import { useState } from 'react';

// FUNCIONES DE UTILIDAD FUERA DEL COMPONENTE
const formatCurrency = (value) => {
  if (!value && value !== 0) return '$0';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(value);
};

// COMPONENTE DE SECCIÓN EXTRAÍDO PARA EVITAR RE-CREACIÓN Y PÉRDIDA DE FOCO
const SeccionDocumento = ({ titulo, tipo, datos, cargando, labelArchivo, onCarga, onEdita, onConfirmar, onReset }) => (
  <div className={`bg-white p-6 rounded-xl shadow-sm border transition-all duration-300 mb-6 ${datos?.confirmado ? 'border-green-200 bg-green-50/10' : 'border-slate-200'}`}>
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-bold text-[#00346f] flex items-center gap-2">
        <span className="material-symbols-outlined">{datos?.confirmado ? 'check_circle' : 'description'}</span>
        {titulo}
      </h3>
      {datos?.confirmado && (
        <button 
          type="button" 
          onClick={() => onReset(tipo)}
          className="text-xs font-bold text-slate-400 hover:text-[#ba1a1a] transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">restart_alt</span> Cambiar
        </button>
      )}
    </div>

    {!datos ? (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">{labelArchivo}</p>
        <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-[#00346f] transition-colors text-center">
          {cargando ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-[#00346f] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-[#00346f]">Analizando con OCR...</p>
            </div>
          ) : (
            <>
              <input type="file" onChange={(e) => onCarga(e, tipo)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,application/pdf" />
              <span className="material-symbols-outlined text-3xl text-slate-400">cloud_upload</span>
              <p className="text-sm text-slate-600 mt-2 font-medium">Click o arrastra para subir</p>
            </>
          )}
        </div>
      </div>
    ) : (
      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
          {Object.entries(datos).map(([key, value]) => {
            if (key === 'confirmado' || key === 'archivo_url') return null;
            
            // La vigencia NUNCA es editable, ni siquiera antes de confirmar
            const esEditable = !datos.confirmado && key !== 'vigencia';

            return (
              <div key={key} className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</label>
                {!esEditable ? (
                  <p className="text-sm font-semibold text-slate-700">
                    {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : 
                     (key.includes('monto') || key.includes('total') || key.includes('sueldo') || key.includes('deuda') || key.includes('mora')) ? formatCurrency(value) : value}
                  </p>
                ) : (
                  <input 
                    type={typeof value === 'number' ? 'number' : 'text'}
                    value={value}
                    onChange={(e) => onEdita(tipo, key, typeof value === 'number' ? (e.target.value === '' ? 0 : Number(e.target.value)) : e.target.value)}
                    className="bg-white border border-slate-200 rounded px-2 py-1 text-sm font-medium focus:border-[#00346f] outline-none transition-colors"
                  />
                )}
              </div>
            );
          })}
        </div>
        {!datos.confirmado && (
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={() => onConfirmar(tipo)}
              className="flex-1 bg-[#00346f] text-white py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-all active:scale-95"
            >
              Confirmar Datos
            </button>
            <button 
              type="button"
              onClick={() => onReset(tipo)}
              className="px-4 border border-slate-200 text-slate-500 rounded-lg font-bold text-sm hover:bg-slate-50 transition-all"
            >
              Subir otro
            </button>
          </div>
        )}
      </div>
    )}
  </div>
);

const Formulario = ({ simulacionData, setVista }) => {
  const [formData, setFormData] = useState({
    rut: '',
    nombreCompleto: '',
    correo: ''
  });

  const [datosCarnet, setDatosCarnet] = useState(null);
  const [datosLiquidacion, setDatosLiquidacion] = useState(null);
  const [datosCotizaciones, setDatosCotizaciones] = useState(null);
  const [datosDeudas, setDatosDeudas] = useState(null);

  const [cargando, setCargando] = useState({
    carnet: false,
    liquidacion: false,
    cotizaciones: false,
    mora90: false
  });

  const [errorSesion, setErrorSesion] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const cargaDocumentos = async (e, tipo) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    setCargando(prev => ({ ...prev, [tipo === 'deuda' ? 'mora90' : tipo]: true }));

    const formDataScan = new FormData();
    formDataScan.append('file', archivo);
    formDataScan.append('document_type', tipo);

    try {
      const response = await fetch('http://localhost:8002/analyze', {
        method: 'POST',
        body: formDataScan
      });

      if (response.ok) {
        const resultado = await response.json();
        const data = { ...resultado.data, archivo_url: resultado.archivo_url, confirmado: false };
        if (tipo === 'carnet') setDatosCarnet(data);
        if (tipo === 'liquidacion') setDatosLiquidacion(data);
        if (tipo === 'cotizaciones') setDatosCotizaciones(data);
        if (tipo === 'deuda') setDatosDeudas(data);
      } else {
        alert('Error al analizar el documento.');
      }
    } catch (error) {
      alert('Error de conexión con el servicio de escaneo.');
    } finally {
      setCargando(prev => ({ ...prev, [tipo === 'deuda' ? 'mora90' : tipo]: false }));
    }
  };

  const editaDatosDocumento = (tipo, campo, valor) => {
    const setFunc = {
      carnet: setDatosCarnet,
      liquidacion: setDatosLiquidacion,
      cotizaciones: setDatosCotizaciones,
      deuda: setDatosDeudas
    }[tipo];
    setFunc(prev => ({ ...prev, [campo]: valor }));
  };

  const handleConfirmar = (tipo) => {
    if (tipo === 'carnet') {
      setDatosCarnet({ ...datosCarnet, confirmado: true });
      setFormData(prev => ({
        ...prev,
        rut: datosCarnet.rut || prev.rut,
        nombreCompleto: datosCarnet.nombre || prev.nombreCompleto
      }));
    }
    if (tipo === 'liquidacion') setDatosLiquidacion({ ...datosLiquidacion, confirmado: true });
    if (tipo === 'cotizaciones') setDatosCotizaciones({ ...datosCotizaciones, confirmado: true });
    if (tipo === 'deuda') setDatosDeudas({ ...datosDeudas, confirmado: true });
  };

  const handleReset = (tipo) => {
    if (tipo === 'carnet') setDatosCarnet(null);
    if (tipo === 'liquidacion') setDatosLiquidacion(null);
    if (tipo === 'cotizaciones') setDatosCotizaciones(null);
    if (tipo === 'deuda') setDatosDeudas(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!datosCarnet?.confirmado || !datosLiquidacion?.confirmado || !datosCotizaciones?.confirmado || !datosDeudas?.confirmado) {
      alert('Faltan documentos por confirmar.');
      return;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) { setErrorSesion(true); return; }

    const payload = {
      monto: simulacionData?.monto,
      plazo: simulacionData?.cuotas,
      carnet: { ...datosCarnet },
      liquidacion: { ...datosLiquidacion },
      cotizaciones: { ...datosCotizaciones },
      deudas: { ...datosDeudas }
    };

    try {
      const response = await fetch('http://localhost:8001/solicitud', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        alert('¡Éxito!');
        setVista('dashboard'); 
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Error al enviar');
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <button onClick={() => setVista('inicio')} className="flex items-center gap-2 text-[#00346f] font-semibold text-sm hover:translate-x-[-4px] transition-transform">
          <span className="material-symbols-outlined text-sm">arrow_back</span> Volver
        </button>
      </div>

      <header className="mb-10 text-left">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#00346f] tracking-tight">Validación de Documentos</h1>
        <p className="text-slate-500 mt-2 max-w-2xl">Revisa y confirma la información. Puedes editar directamente si hay errores.</p>
      </header>

      {errorSesion && (
        <section className="mb-8">
          <div className="bg-[#ffdad6] p-4 rounded-xl flex items-center justify-between gap-4 border border-[#ba1a1a]/20">
            <span className="text-[#ba1a1a] font-medium">Sesión expirada.</span>
            <button type="button" onClick={() => setVista('login')} className="bg-[#ba1a1a] text-white px-6 py-2 rounded-lg font-semibold text-sm">Login</button>
          </div>
        </section>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7">
          <SeccionDocumento titulo="1. Cédula de Identidad" tipo="carnet" datos={datosCarnet} cargando={cargando.carnet} labelArchivo="Foto frontal." onCarga={cargaDocumentos} onEdita={editaDatosDocumento} onConfirmar={handleConfirmar} onReset={handleReset} />
          <SeccionDocumento titulo="2. Última Liquidación" tipo="liquidacion" datos={datosLiquidacion} cargando={cargando.liquidacion} labelArchivo="Liquidación reciente." onCarga={cargaDocumentos} onEdita={editaDatosDocumento} onConfirmar={handleConfirmar} onReset={handleReset} />
          <SeccionDocumento titulo="3. Certificado Cotizaciones" tipo="cotizaciones" datos={datosCotizaciones} cargando={cargando.cotizaciones} labelArchivo="AFP últimos 12 meses." onCarga={cargaDocumentos} onEdita={editaDatosDocumento} onConfirmar={handleConfirmar} onReset={handleReset} />
          <SeccionDocumento titulo="4. Certificado de Deudas" tipo="deuda" datos={datosDeudas} cargando={cargando.mora90} labelArchivo="Informe CMF." onCarga={cargaDocumentos} onEdita={editaDatosDocumento} onConfirmar={handleConfirmar} onReset={handleReset} />

          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 mt-8">
            <h2 className="text-xl font-bold text-[#00346f] mb-8 flex items-center gap-2">
              <span className="material-symbols-outlined">person</span> Datos Finales
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">RUT</label>
                  <input className="w-full border-b-2 border-slate-200 py-2 outline-none focus:border-[#00346f]" name="rut" value={formData.rut} onChange={handleChange} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre Completo</label>
                  <input className="w-full border-b-2 border-slate-200 py-2 outline-none focus:border-[#00346f]" name="nombreCompleto" value={formData.nombreCompleto} onChange={handleChange} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Correo</label>
                <input className="w-full border-b-2 border-slate-200 py-2 outline-none focus:border-[#00346f]" type="email" name="correo" value={formData.correo} onChange={handleChange} required />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6 sticky top-8">
          <div className="bg-slate-50 p-8 rounded-xl border border-slate-200">
            <h2 className="text-xl font-bold text-[#00346f] mb-8 flex items-center gap-2">
              <span className="material-symbols-outlined">analytics</span> Resumen
            </h2>
            <div className="space-y-6">
              <div className="flex justify-between border-b pb-4">
                <span className="text-xs font-bold text-slate-500 uppercase">Monto</span>
                <span className="font-semibold text-[#00346f]">{formatCurrency(simulacionData?.monto)}</span>
              </div>
              <div className="flex justify-between border-b pb-4">
                <span className="text-xs font-bold text-slate-500 uppercase">Plazo</span>
                <span className="font-semibold text-[#00346f]">{simulacionData?.cuotas} Meses</span>
              </div>
              <div className="bg-[#00346f] p-6 rounded-lg text-white">
                <p className="text-xs font-bold text-[#9bbdff] uppercase mb-1">Cuota Mensual</p>
                <p className="text-3xl font-extrabold">{formatCurrency(simulacionData?.cuota_mensual)}</p>
              </div>
              <button 
                type="submit"
                disabled={!datosCarnet?.confirmado || !datosLiquidacion?.confirmado || !datosCotizaciones?.confirmado || !datosDeudas?.confirmado}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  (!datosCarnet?.confirmado || !datosLiquidacion?.confirmado || !datosCotizaciones?.confirmado || !datosDeudas?.confirmado)
                  ? 'bg-slate-300 cursor-not-allowed text-slate-500' 
                  : 'bg-gradient-to-r from-[#00346f] to-[#004a99] text-white shadow-md hover:scale-[1.02] active:scale-95'
                }`}
              >
                Finalizar y Enviar
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Formulario;