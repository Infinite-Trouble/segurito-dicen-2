import { useState } from 'react';

const Formulario = ({ simulacionData, setVista }) => {
  // Datos personales (se pueden auto-completar con el carnet)
  const [formData, setFormData] = useState({
    rut: '',
    nombreCompleto: '',
    correo: ''
  });

  // Estados para los documentos y sus datos extraídos
  const [datosCarnet, setDatosCarnet] = useState(null);
  const [datosLiquidacion, setDatosLiquidacion] = useState(null);
  const [datosCotizaciones, setDatosCotizaciones] = useState(null);
  const [datosDeudas, setDatosDeudas] = useState(null);

  // Estados de carga para cada documento
  const [cargando, setCargando] = useState({
    carnet: false,
    liquidacion: false,
    cotizaciones: false,
    mora90: false
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

  // FUNCIÓN PARA CARGAR Y ANALIZAR DOCUMENTOS
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
        
        if (tipo === 'carnet') {
          setDatosCarnet(data);
          // Auto-completar datos personales si el OCR tuvo éxito
          setFormData(prev => ({
            ...prev,
            rut: data.rut || prev.rut,
            nombreCompleto: data.nombre || prev.nombreCompleto
          }));
        }
        if (tipo === 'liquidacion') setDatosLiquidacion(data);
        if (tipo === 'cotizaciones') setDatosCotizaciones(data);
        if (tipo === 'deuda') setDatosDeudas(data);
      } else {
        alert('Error al analizar el documento. Intente subir una imagen más clara.');
      }
    } catch (error) {
      console.error('Error OCR:', error);
      alert('Error de conexión con el servicio de escaneo (OCR)');
    } finally {
      setCargando(prev => ({ ...prev, [tipo === 'deuda' ? 'mora90' : tipo]: false }));
    }
  };

  const handleConfirmar = (tipo) => {
    if (tipo === 'carnet') setDatosCarnet({ ...datosCarnet, confirmado: true });
    if (tipo === 'liquidacion') setDatosLiquidacion({ ...datosLiquidacion, confirmado: true });
    if (tipo === 'cotizaciones') setDatosCotizaciones({ ...datosCotizaciones, confirmado: true });
    if (tipo === 'deuda') setDatosDeudas({ ...datosDeudas, confirmado: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!datosCarnet?.confirmado || !datosLiquidacion?.confirmado || !datosCotizaciones?.confirmado || !datosDeudas?.confirmado) {
      alert('Por favor, cargue y confirme los 4 documentos requeridos antes de finalizar.');
      return;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      setErrorSesion(true);
      return;
    }

    const payload = {
      monto: simulacionData?.monto,
      plazo: simulacionData?.cuotas,
      carnet: {
        nombre: datosCarnet.nombre,
        rut: datosCarnet.rut,
        numero_cedula: datosCarnet.numero_cedula,
        vigencia: datosCarnet.vigencia,
        archivo_url: datosCarnet.archivo_url
      },
      liquidacion: {
        total_haberes: datosLiquidacion.total_haberes,
        total_descuento: datosLiquidacion.total_descuento,
        sueldo_liquido: datosLiquidacion.sueldo_liquido,
        archivo_url: datosLiquidacion.archivo_url
      },
      cotizaciones: {
        meses_cotizados_consecutivos: datosCotizaciones.meses_cotizados_consecutivos,
        rut_empleador: datosCotizaciones.rut_empleador,
        archivo_url: datosCotizaciones.archivo_url
      },
      deudas: {
        deudas_totales: datosDeudas.deudas_totales,
        mora_90_dias: datosDeudas.mora_90_dias,
        archivo_url: datosDeudas.archivo_url
      }
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
        alert('¡Éxito! Su solicitud y documentos han sido ingresados para revisión.');
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

  // Componente para cada sección de documento
  const SeccionDocumento = ({ titulo, tipo, datos, cargando, labelArchivo }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-[#00346f] flex items-center gap-2">
          <span className="material-symbols-outlined">description</span>
          {titulo}
        </h3>
        {datos?.confirmado && (
          <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">check_circle</span> Confirmado
          </span>
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
                <input 
                  type="file" 
                  onChange={(e) => cargaDocumentos(e, tipo)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="image/*,application/pdf"
                />
                <span className="material-symbols-outlined text-3xl text-slate-400">cloud_upload</span>
                <p className="text-sm text-slate-600 mt-2 font-medium">Click o arrastra para subir</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
            {Object.entries(datos).map(([key, value]) => {
              if (key === 'confirmado' || key === 'archivo_url') return null;
              return (
                <div key={key}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{key.replace(/_/g, ' ')}</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : 
                     (key.includes('monto') || key.includes('total') || key.includes('sueldo') || key.includes('deuda') || key.includes('mora')) ? formatCurrency(value) : value}
                  </p>
                </div>
              );
            })}
          </div>
          {!datos.confirmado && (
            <button 
              type="button"
              onClick={() => handleConfirmar(tipo)}
              className="w-full bg-[#00346f] text-white py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-all active:scale-95"
            >
              Confirmar Datos
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      
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
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#00346f] tracking-tight">Carga de Documentos y Solicitud</h1>
        <p className="text-slate-500 mt-2 max-w-2xl">Para procesar tu solicitud, requerimos que escanees 4 documentos obligatorios. Nuestro sistema de OCR extraerá la información automáticamente.</p>
      </header>

      {errorSesion && (
        <section className="mb-8">
          <div className="bg-[#ffdad6] p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 border border-[#ba1a1a]/20">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#ba1a1a]">error</span>
              <span className="text-[#ba1a1a] font-medium">Tu sesión ha expirado por motivos de seguridad.</span>
            </div>
            <button type="button" onClick={() => setVista('login')} className="bg-[#ba1a1a] text-white px-6 py-2 rounded-lg font-semibold text-sm">Ir a Iniciar Sesión</button>
          </div>
        </section>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LADO IZQUIERDO: CARGA DE DOCUMENTOS */}
        <div className="lg:col-span-7">
          <SeccionDocumento 
            titulo="1. Cédula de Identidad" 
            tipo="carnet" 
            datos={datosCarnet} 
            cargando={cargando.carnet} 
            labelArchivo="Suba una foto legible de su carnet por ambos lados (o solo frontal)."
          />
          <SeccionDocumento 
            titulo="2. Última Liquidación de Sueldo" 
            tipo="liquidacion" 
            datos={datosLiquidacion} 
            cargando={cargando.liquidacion} 
            labelArchivo="Suba su certificado de liquidación de sueldo más reciente."
          />
          <SeccionDocumento 
            titulo="3. Certificado de Cotizaciones" 
            tipo="cotizaciones" 
            datos={datosCotizaciones} 
            cargando={cargando.cotizaciones} 
            labelArchivo="Suba su certificado de cotizaciones AFP de los últimos 12 meses."
          />
          <SeccionDocumento 
            titulo="4. Certificado de Deudas" 
            tipo="deuda" 
            datos={datosDeudas} 
            cargando={cargando.mora90} 
            labelArchivo="Suba su informe de deudas CMF o similar."
          />

          {/* DATOS PERSONALES (Sincronizados con Carnet) */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 mt-8">
            <h2 className="text-xl font-bold text-[#00346f] mb-8 flex items-center gap-2">
              <span className="material-symbols-outlined">person</span>
              Datos Finales del Solicitante
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
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Correo Electrónico</label>
                <input className="w-full border-b-2 border-slate-200 py-2 outline-none focus:border-[#00346f]" type="email" name="correo" value={formData.correo} onChange={handleChange} required />
              </div>
            </div>
          </div>
        </div>

        {/* LADO DERECHO: RESUMEN Y ENVÍO */}
        <div className="lg:col-span-5 flex flex-col gap-6 sticky top-8">
          <div className="bg-slate-50 p-8 rounded-xl border border-slate-200">
            <h2 className="text-xl font-bold text-[#00346f] mb-8 flex items-center gap-2">
              <span className="material-symbols-outlined">analytics</span>
              Resumen de tu Simulación
            </h2>
            
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b pb-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Monto Solicitado</p>
                  <p className="text-lg font-semibold text-[#00346f]">{formatCurrency(simulacionData?.monto)}</p>
                </div>
              </div>
              <div className="flex justify-between items-end border-b pb-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Plazo</p>
                  <p className="text-lg font-semibold text-[#00346f]">{simulacionData?.cuotas} Meses</p>
                </div>
              </div>
              <div className="bg-[#00346f] p-6 rounded-lg text-white">
                <p className="text-xs font-bold text-[#9bbdff] uppercase mb-1">Cuota Mensual Aprox</p>
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
              <p className="text-center text-[10px] text-slate-400 mt-4">
                Todos los documentos deben estar confirmados para habilitar el envío.
              </p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};

export default Formulario;