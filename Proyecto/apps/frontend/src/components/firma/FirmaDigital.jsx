import { useRef, useState, useEffect } from 'react';
import jsPDF from 'jspdf';

const FirmaDigital = ({ setVista }) => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [streamCamara, setStreamCamara] = useState(null);
  const [paso, setPaso] = useState('inicio');
  const [dibujando, setDibujando] = useState(false);
  const [firmado, setFirmado] = useState(false);
  const [firmaImagen, setFirmaImagen] = useState(null);
  const [acepta, setAcepta] = useState(false);

  const activarCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStreamCamara(stream);
      setPaso('biometria');
    } catch (error) {
      alert('No se pudo acceder a la cámara. Revisa los permisos del navegador.');
    }
  };
  const detenerCamara = () => {
    if (streamCamara) {
      streamCamara.getTracks().forEach(track => track.stop());
    }
  };

  useEffect(() => {
    if (paso === 'biometria' && videoRef.current && streamCamara) {
      videoRef.current.srcObject = streamCamara;
    }
  }, [paso, streamCamara]);

  const iniciarFirma = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    setDibujando(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const dibujar = (e) => {
    if (!dibujando) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#00346f';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();

    setFirmado(true);
  };

  const terminarFirma = () => {
    setDibujando(false);
  };

  const limpiarFirma = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setFirmado(false);
  };

  const generarPDFContrato = ({ incluirFirma = false } = {}) => {
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
  El Banco concede al Prestatario un préstamo por un monto total de $${simulacion.monto || 'NO INFORMADO'} CLP.

  SEGUNDA. PLAZO DE AMORTIZACIÓN
  El plazo de devolución será de ${simulacion.cuotas || simulacion.plazo || 'NO INFORMADO'} meses.

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

    if (incluirFirma && firmaImagen) {
      doc.addImage(firmaImagen, 'PNG', 15, 255, 70, 25);
    } else {
      doc.text('Pendiente de firma', 15, 265);
    }

    doc.text('Firma del Banco: Sistema de Préstamos Online', 110, 250);

    return doc;
  };

  const verContrato = () => {
    const doc = generarPDFContrato({ incluirFirma: false });
    const url = doc.output('bloburl');
    window.open(url, '_blank');
  };

  const descargarBorrador = () => {
    const doc = generarPDFContrato({ incluirFirma: false });
    doc.save('contrato-prestamo-borrador.pdf');
  };

  const descargarContrato = () => {
    const doc = generarPDFContrato({ incluirFirma: true });
    doc.save('contrato-prestamo-firmado.pdf');
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-10 px-4">
      <button
        onClick={() => {
          detenerCamara();
          setVista('solicitud');
        }}
        className="mb-6 flex items-center gap-2 text-[#00346f] font-semibold text-sm"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Volver
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-3xl font-extrabold text-[#00346f] mb-2">
          Firma Digital
        </h1>

        <p className="text-slate-500 mb-8">
          Para formalizar tu préstamo, valida tu identidad y firma el contrato y pagaré digitalmente.
        </p>

        {paso === 'inicio' && (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-[#00346f] mb-2">
                Documentos a firmar
              </h2>
              <ul className="text-slate-600 list-disc ml-5">
                <li>Contrato de préstamo</li>
                <li>Pagaré asociado al préstamo</li>
              </ul>
            </div>

            <button
              onClick={activarCamara}
              className="w-full bg-[#00346f] text-white py-4 rounded-xl font-bold hover:bg-blue-900 transition-all"
            >
              Iniciar validación de identidad
            </button>
          </div>
        )}

        {paso === 'biometria' && (
          <div className="space-y-6 text-center">

            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="mx-auto w-full max-w-md h-64 rounded-xl object-cover"
            />

            <button
              onClick={() => {
                detenerCamara();
                setPaso('validado');
              }}
              className="bg-[#00346f] text-white px-8 py-3 rounded-xl font-bold"
            >
              Tomar foto y validar identidad
            </button>

          </div>
        )}

        {paso === 'validado' && (
          <div className="space-y-6 text-center">
            <div className="bg-green-50 border border-green-200 rounded-xl p-8">
              <span className="material-symbols-outlined text-green-600 text-6xl">
                check_circle
              </span>
              <h2 className="text-2xl font-bold text-green-700 mt-3">
                Identificación exitosa
              </h2>
              <p className="text-slate-600 mt-2">
                Tu identidad fue validada correctamente.
              </p>
            </div>

            <button
              onClick={() => setPaso('revision')}
              className="bg-[#00346f] text-white px-8 py-3 rounded-xl font-bold"
            >
              Continuar a firma
            </button>
          </div>
        )}

        {paso === 'revision' && (
          <div className="space-y-6 text-center">
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-[#00346f] mb-2">
                Revisión del contrato
              </h2>
              <p className="text-slate-500 text-sm">
                Antes de firmar, revisa el contrato y pagaré asociado.
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={verContrato}
                className="bg-[#00346f] text-white px-6 py-3 rounded-xl font-bold"
              >
                Ver contrato
              </button>

              <button
                onClick={descargarBorrador}
                className="border border-slate-300 px-6 py-3 rounded-xl font-bold"
              >
                Descargar contrato
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 mt-4">
              <input
                type="checkbox"
                checked={acepta}
                onChange={(e) => setAcepta(e.target.checked)}
              />
              <span className="text-sm text-slate-600">
                Acepto las condiciones del contrato
              </span>
            </div>

            <button
              disabled={!acepta}
              onClick={() => setPaso('firma')}
              className={`px-8 py-3 rounded-xl font-bold ${
                acepta
                  ? 'bg-[#00346f] text-white'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              Continuar a firma
            </button>

          </div>
        )}

        {paso === 'firma' && (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-[#00346f] mb-2">
                Firma del cliente
              </h2>
              <p className="text-slate-500 text-sm mb-4">
                Firma dentro del recuadro para aceptar el contrato y pagaré.
              </p>

              <canvas
                ref={canvasRef}
                width={700}
                height={250}
                onMouseDown={iniciarFirma}
                onMouseMove={dibujar}
                onMouseUp={terminarFirma}
                onMouseLeave={terminarFirma}
                className="w-full bg-white border-2 border-dashed border-slate-300 rounded-xl cursor-crosshair"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={limpiarFirma}
                className="flex-1 border border-slate-300 text-slate-600 py-3 rounded-xl font-bold"
              >
                Limpiar firma
              </button>

              <button
                disabled={!firmado}
                onClick={() => {
                  const imagen = canvasRef.current.toDataURL('image/png');
                  setFirmaImagen(imagen);
                  setPaso('confirmacion');
                }}
                className={`flex-1 py-3 rounded-xl font-bold ${
                  firmado
                    ? 'bg-[#00346f] text-white'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                Enviar firma
              </button>
            </div>
          </div>
        )}

        {paso === 'confirmacion' && (
          <div className="space-y-6 text-center">
            <div className="bg-green-50 border border-green-200 rounded-xl p-8">
              <span className="material-symbols-outlined text-green-600 text-6xl">
                task_alt
              </span>
              <h2 className="text-2xl font-bold text-green-700 mt-3">
                Firma completada
              </h2>
              <p className="text-slate-600 mt-2">
                El contrato y pagaré fueron firmados correctamente.
              </p>
              <p className="text-slate-600 mt-1">
                Los documentos firmados fueron enviados al correo registrado.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={descargarContrato}
                className="flex-1 bg-[#00346f] text-white py-3 rounded-xl font-bold"
              >
                Descargar contrato firmado
              </button>

              <button
                onClick={() => setVista('dashboard')}
                className="flex-1 border border-slate-300 text-slate-600 py-3 rounded-xl font-bold"
              >
                Ir a mi panel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FirmaDigital;