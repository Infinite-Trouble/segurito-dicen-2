import { useState, useEffect } from 'react';

const Simulador = () => {
  const [inputs, setInputs] = useState({ monto: '', cuotas: '' });
  const [resultados, setResultados] = useState(null);

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

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      
      {/* --- NUEVO ENCABEZADO AÑADIDO AQUÍ --- */}
      <header className="mb-10 max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-900 tracking-tight mb-4">
          Simulador de Crédito de Consumo
        </h1>
        <p className="text-gray-600 text-lg leading-relaxed">
          Diseñamos soluciones financieras transparentes. Calcula tu cuota mensual en segundos y descubre la tasa que mejor se adapta a tus metas personales.
        </p>
      </header>
      {/* ------------------------------------- */}

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
                  </div>
                </>
              ) : (
                <div className="mb-10 flex flex-col items-center justify-center py-12 opacity-70">
                  <p className="text-lg font-semibold animate-pulse">Calculando condiciones...</p>
                </div>
              )}

              <div className="mt-12 space-y-4">
                <button 
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