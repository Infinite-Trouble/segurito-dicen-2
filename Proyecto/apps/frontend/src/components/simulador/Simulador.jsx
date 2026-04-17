import { useState, useEffect } from 'react';

const Simulador = ({ setVista, setDatosSimulacion }) => {
  const [inputs, setInputs] = useState({ monto: '', cuotas: '' });
  const [resultados, setResultados] = useState(null);
  const [errorSesion, setErrorSesion] = useState(false);
  const [socioeconomico, setSocioeconomico] = useState({
    ingreso: '',
    deuda: '',
    contrato: '1.0'
  });
  const [opcionesSugeridas, setOpcionesSugeridas] = useState([]);
  const [cargandoSugerencias, setCargandoSugerencias] = useState(false);
  const [busquedaTerminada, setBusquedaTerminada] = useState(false);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(value);
  };

  useEffect(() => {
    const realizarSimulacion = async () => {
      if (inputs.monto >= 100000 && inputs.cuotas >= 1) {
        try {
          const response = await fetch('http://localhost:8001/simular', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              monto: parseFloat(inputs.monto),
              cuotas: parseInt(inputs.cuotas)
            })
          });
          const data = await response.json();
          if (response.ok) setResultados(data);
        } catch (error) {
          console.error("Error en loan-service");
        }
      } else {
        setResultados(null);
      }
    };
    realizarSimulacion();
  }, [inputs]);

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const handleSocioeconomicoChange = (e) => {
    setSocioeconomico({ ...socioeconomico, [e.target.name]: e.target.value });
  };

  const generarSugerencias = async () => {
    setCargandoSugerencias(true);
    setBusquedaTerminada(false);
    setOpcionesSugeridas([]); // Limpiamos búsquedas anteriores

    const ingreso = parseFloat(socioeconomico.ingreso);
    const deuda = parseFloat(socioeconomico.deuda) || 0;
    const factor = parseFloat(socioeconomico.contrato);

    // Validamos que se haya puesto un ingreso válido
    if (isNaN(ingreso) || ingreso <= 0) {
      setCargandoSugerencias(false);
      return;
    }

    // El sistema define 5 distintos escenarios a probar en el backend (entre 5 y 20 mill.)
    const escenariosAProbar = [
      { monto: 5000000, cuotas: 24 },
      { monto: 8000000, cuotas: 36 },
      { monto: 12000000, cuotas: 48 },
      { monto: 15000000, cuotas: 60 },
      { monto: 20000000, cuotas: 60 }
    ];

    const opcionesAprobables = [];

    // Hacemos las peticiones al backend de forma paulatina para que nos dé las cuotas calculadas
    for (const escenario of escenariosAProbar) {
      try {
        const response = await fetch('http://localhost:8001/simular', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            monto: escenario.monto,
            cuotas: escenario.cuotas
          })
        });

        if (response.ok) {
          const data = await response.json();

          // FÓRMULA DE FACTOR DE RIESGO
          const cargaFinanciera = (deuda + data.cuota_mensual) / (ingreso * factor);

          // SOLO si es MENOR a 45% (que significa +50% probabilidad de aprobación) lo consideramos
          if (cargaFinanciera <= 0.45) {
            let probabilidad = '';
            let tipoProbabilidad = '';

            // Definimos rangos según tu regla de oro
            if (cargaFinanciera <= 0.3) {
              probabilidad = 'Alta (90% - 95%)';
              tipoProbabilidad = 'alta';
            } else {
              probabilidad = 'Media (50% - 70%)';
              tipoProbabilidad = 'media';
            }

            opcionesAprobables.push({
              monto: escenario.monto,
              cuotas: escenario.cuotas,
              cuotaSimulada: data.cuota_mensual,
              tasaAplicada: data.tasa_aplicada,
              cae: data.cae,
              totalPagar: data.total_pagar,
              cargaFinanciera: cargaFinanciera,
              probabilidad: probabilidad,
              tipoProbabilidad: tipoProbabilidad
            });
          }
        }
      } catch (error) {
        console.error("Error contactando al servidor en simulador inteligente", error);
      }
    }


    // Ordenamos tomando los que tengan mejor probabilidad (menor carga financiera)
    opcionesAprobables.sort((a, b) => a.cargaFinanciera - b.cargaFinanciera);

    // Guardamos en el estado el TOP 3 de los mejores perfiles 
    setOpcionesSugeridas(opcionesAprobables.slice(0, 3));
    setCargandoSugerencias(false);
    setBusquedaTerminada(true);
  };

  const handleSeleccionarSugerencia = (sugerencia) => {
    // Al hacer clic, actualizamos los sliders originales con nuestros montos "mágicos"
    // Esto hará que el panel azul de la derecha se calcule automáticamente de nuevo
    setInputs({ monto: sugerencia.monto, cuotas: sugerencia.cuotas });

    // Hacemos scroll suave hacia arriba para que el usuario pueda ver el panel azul y darle "Solicitar"
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const calcularProbabilidadEnVivo = (cuota) => {
    const ingreso = parseFloat(socioeconomico.ingreso);
    if (isNaN(ingreso) || ingreso <= 0) return null;

    const deuda = parseFloat(socioeconomico.deuda) || 0;
    const factor = parseFloat(socioeconomico.contrato);
    const cargaFinanciera = (deuda + cuota) / (ingreso * factor);

    if (cargaFinanciera <= 0.3) return { texto: 'Alta', color: 'text-green-300' };
    if (cargaFinanciera <= 0.45) return { texto: 'Media', color: 'text-yellow-300' };
    return { texto: 'Baja', color: 'text-[#ffb4ab]' }; // Rojo salmón por el dark theme
  };

  const probabilidadActual = resultados ? calcularProbabilidadEnVivo(resultados.cuota_mensual) : null;


  const handleSolicitar = () => {
    // Verificamos si existe un token en la sesión actual
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (!token) {
      setErrorSesion(true); // Mostramos la alerta
      return; // Detenemos la ejecución para que no avance
    }

    // Si pasa la validación, limpiamos errores y avanzamos
    setErrorSesion(false);
    setDatosSimulacion({
      monto: inputs.monto,
      cuotas: inputs.cuotas,
      cuota_mensual: resultados.cuota_mensual
    });
    setVista('solicitud');
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

      <header className="mb-10 max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-900 tracking-tight mb-4">
          Simulador de Crédito de Consumo
        </h1>
        <p className="text-gray-600 text-lg leading-relaxed">
          Diseñamos soluciones financieras transparentes. Calcula tu cuota mensual en segundos y descubre la tasa que mejor se adapta a tus metas personales.
        </p>
      </header>

      {/* CONTENEDOR DE LAS DOS COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

        {/* LADO IZQUIERDO: FORMULARIO */}
        <section className="lg:col-span-7 space-y-10">
          <div className="bg-white p-10 rounded-xl shadow-lg border-b-4 border-blue-900">

            {/* Input Monto */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-blue-900 uppercase tracking-widest mb-6">
                Monto del Préstamo
              </label>
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-4xl font-extrabold text-gray-900">
                  {formatCurrency(inputs.monto)}
                </span>
                <span className="text-gray-500 text-sm">Máx. $50.000.000</span>
              </div>
              <input
                type="range"
                name="monto"
                min="1000000"
                max="50000000"
                step="500000"
                value={inputs.monto}
                onChange={handleChange}
                className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer mb-2 range-slider"
              />
              <div className="flex justify-between text-xs text-gray-400 font-medium">
                <span>$1.000.000</span>
                <span>$50.000.000</span>
              </div>
            </div>

            {/* Input Cuotas */}
            <div className="mb-10">
              <label className="block text-sm font-semibold text-blue-900 uppercase tracking-widest mb-6">
                Número de Cuotas
              </label>
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-4xl font-extrabold text-gray-900">
                  {inputs.cuotas} <span className="text-xl font-normal text-gray-500">Meses</span>
                </span>
                <span className="text-gray-500 text-sm">Hasta 60 meses</span>
              </div>
              <input
                type="range"
                name="cuotas"
                min="6"
                max="60"
                step="6"
                value={inputs.cuotas}
                onChange={handleChange}
                className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer mb-2 range-slider"
              />
              <div className="flex justify-between text-xs text-gray-400 font-medium">
                <span>6 meses</span>
                <span>60 meses</span>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                ¿Qué préstamos puedo simular?
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Nuestra herramienta permite simular Créditos de Consumo de Libre Disponibilidad, ideales para consolidación de deudas, remodelaciones del hogar o financiamiento de proyectos personales. Sujeto a evaluación comercial.
              </p>
            </div>
          </div>
          {/* NUEVA TARJETA: SUGERENCIAS INTELIGENTES */}
          <div className="bg-white p-10 rounded-xl shadow-lg border-b-4 border-teal-500">
            <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-2">
              Buscador Inteligente de Préstamos
            </h2>
            <p className="text-gray-600 mb-8">Ingresa tus datos para calcular tu capacidad de pago y el sistema generará automáticamente hasta 3 opciones con alta probabilidad de aprobación para ti.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Ingreso Líquido */}
              <div>
                <label className="block text-sm font-semibold text-blue-900 uppercase tracking-widest mb-2">
                  Ingreso Líquido Mensual
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-gray-500 font-bold">$</span>
                  <input
                    type="number"
                    name="ingreso"
                    value={socioeconomico.ingreso}
                    onChange={handleSocioeconomicoChange}
                    placeholder="Ej: 1000000"
                    min="0"
                    className="w-full p-4 pl-8 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Deuda Mensual */}
              <div>
                <label className="block text-sm font-semibold text-blue-900 uppercase tracking-widest mb-2">
                  Deuda Mensual Actual
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-gray-500 font-bold">$</span>
                  <input
                    type="number"
                    name="deuda"
                    value={socioeconomico.deuda}
                    onChange={handleSocioeconomicoChange}
                    placeholder="Ej: 150000"
                    min="0"
                    className="w-full p-4 pl-8 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Tipo de Contrato */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-blue-900 uppercase tracking-widest mb-2">
                Tipo de Contrato
              </label>
              <select
                name="contrato"
                value={socioeconomico.contrato}
                onChange={handleSocioeconomicoChange}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="1.0">Contrato Indefinido</option>
                <option value="0.9">Jubilado / Pensionado</option>
                <option value="0.8">Contrato a Plazo Fijo</option>
                <option value="0.7">Independiente / Boletas de Honorarios</option>
              </select>
            </div>

            <button
              onClick={generarSugerencias}

              disabled={cargandoSugerencias || !socioeconomico.ingreso}
              className="w-full bg-teal-500 text-white font-bold py-4 rounded-md hover:bg-teal-600 transition-all disabled:opacity-50"
            >
              {cargandoSugerencias ? 'Calculando opciones...' : 'Ver sugerencias aprobables'}
            </button>

            {/* NUEVO MENSAJE DE ADVERTENCIA */}
            {busquedaTerminada && opcionesSugeridas.length === 0 && (
              <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-md animate-fade-in-up">
                <div className="flex items-start">
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 font-semibold leading-relaxed">
                      No hay sugerencias de préstamos debido a su carga financiera. Intente probar con montos menores en el simulador o bajar sus deudas actuales.
                    </p>
                  </div>
                </div>
              </div>
            )}


            {/* OPCIONES SUGERIDAS (Pasos 4 y 5) */}
            {opcionesSugeridas.length > 0 && (
              <div className="mt-8 pt-6 border-t border-teal-100 animate-fade-in-up">
                <h3 className="font-bold text-gray-900 mb-4">
                  Tus opciones pre-aprobadas:
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {opcionesSugeridas.map((opcion, index) => (
                    <div key={index} className="p-5 border-2 border-teal-100 bg-teal-50 rounded-xl hover:border-teal-400 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xl font-extrabold text-blue-900 block">{formatCurrency(opcion.monto)}</span>
                          <span className="text-sm font-medium text-gray-500">{opcion.cuotas} Meses</span>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${opcion.tipoProbabilidad === 'alta' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                            {opcion.probabilidad}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm mb-4 border-t border-teal-100 pt-3 mt-3">
                        <span className="text-gray-600 font-medium">Cuota Mensual:</span>
                        <span className="font-extrabold text-gray-900 text-lg">{formatCurrency(opcion.cuotaSimulada)}</span>
                      </div>

                      <button
                        onClick={() => handleSeleccionarSugerencia(opcion)}
                        className="w-full bg-white border-2 border-teal-500 text-teal-600 font-bold py-2.5 rounded-md hover:bg-teal-500 hover:text-white transition-all text-sm"
                      >
                        Elegir y simular este préstamo
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* LADO DERECHO: RESULTADOS */}
        <aside className="lg:col-span-5 sticky top-8">
          <div className="bg-gradient-to-br from-[#00346f] to-[#004a99] text-white p-10 rounded-xl shadow-2xl overflow-hidden relative">

            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              {resultados ? (
                <>
                  <div className="mb-10">
                    <p className="text-white/70 text-sm font-semibold uppercase tracking-widest mb-2">Cuota Mensual Estimada</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-extrabold tracking-tighter">
                        {formatCurrency(resultados.cuota_mensual)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6 pt-8 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-white/80 font-medium">Tasa de Interés Mensual</span>
                      <span className="text-xl font-bold">{resultados.tasa_aplicada}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80 font-medium">CAE</span>
                      <span className="text-xl font-bold">{resultados.cae}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80 font-medium">Total a Pagar</span>
                      <span className="text-xl font-bold">{formatCurrency(resultados.total_pagar)}</span>
                    </div>
                    {/* INDICADOR DE PROBABILIDAD EN VIVO */}
                    {probabilidadActual && (
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/20">
                        <span className="text-white/80 font-medium">Probabilidad Aprobación</span>
                        <span className={`text-lg font-bold ${probabilidadActual.color} bg-white/10 px-3 py-1 rounded-full`}>
                          {probabilidadActual.texto}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="mb-10 flex flex-col items-center justify-center py-12 opacity-70">
                  <p className="text-lg font-semibold animate-pulse">Calculando condiciones...</p>
                </div>
              )}

              <div className="mt-12 space-y-4">
                {errorSesion && (
                  <div className="bg-[#ffdad6] border border-[#ba1a1a] text-[#ba1a1a] px-4 py-3 rounded-md text-sm text-center">
                    Debes <button onClick={() => setVista('login')} className="font-bold underline hover:brightness-75">iniciar sesión</button> para solicitar un préstamo.
                  </div>
                )}

                <button
                  onClick={handleSolicitar}
                  disabled={!resultados}
                  className="w-full bg-[#8df5e4] text-[#00201c] font-bold py-5 rounded-md hover:brightness-110 transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Solicitar este Préstamo
                </button>
              </div>

              <p className="text-[10px] text-white/50 mt-8 italic text-center">
                * Simulación no constituye oferta de crédito. Valores sujetos a validación de antecedentes.
              </p>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default Simulador;