/**
 * Componente de Formulario de Inicio de Sesión.
 * @param {Object} props - Funciones heredadas del padre (App.jsx).
 */
const Login = ({ handleChange, handleSubmit, setVista, formData }) => {
  return (
    <div className="w-full flex items-center justify-center py-12 relative overflow-hidden">
      
      {/* Elementos decorativos de fondo (Estilo Editorial) */}
      <div className="absolute bottom-0 right-0 w-64 h-64 -mb-32 -mr-32 bg-[#00564d]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-48 h-48 -mt-24 -ml-24 bg-[#00346f]/5 rounded-full blur-3xl pointer-events-none"></div>

      <main className="w-full max-w-[320px] flex flex-col items-center gap-8 relative z-10">
        
        {/* Anclaje de Marca */}
        <div className="text-center">
          <span className="font-extrabold text-2xl tracking-tighter text-[#00346f]">Préstamos de Consumo</span>
          <div className="h-1 w-8 bg-[#004a99] mx-auto mt-1 rounded-full"></div>
        </div>

        {/* Tarjeta de Autenticación */}
        <div className="w-full bg-white rounded-xl shadow-[0_20px_50px_rgba(0,52,111,0.05)] overflow-hidden border border-slate-100">
          <div className="p-6">
            <h1 className="font-bold text-xl text-[#00346f] mb-6 tracking-tight">Iniciar Sesión</h1>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Campo Email */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="usuario@credence.com"
                    onChange={handleChange}
                    required
                    className="w-full bg-transparent border-0 border-b border-slate-300 py-2 px-0 focus:ring-0 focus:border-[#00346f] focus:border-b-2 transition-all duration-300 text-sm text-slate-900 placeholder:text-slate-400 outline-none" 
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold" htmlFor="password">
                  Contraseña
                </label>
                <div className="relative">
                  <input 
                    id="password" 
                    name="password" 
                    type="password" 
                    placeholder="••••••••" 
                    onChange={handleChange}
                    required
                    className="w-full bg-transparent border-0 border-b border-slate-300 py-2 px-0 focus:ring-0 focus:border-[#00346f] focus:border-b-2 transition-all duration-300 text-sm text-slate-900 placeholder:text-slate-400 outline-none" 
                  />
                </div>
              </div>

              {/* Casilla Recordarme */}
              <div className="flex items-center gap-2 pt-2">
                <div className="relative flex items-center">
                  <input 
                    id="recordarme" 
                    name="recordarme"
                    type="checkbox" 
                    onChange={handleChange}
                    checked={formData?.recordarme || false}
                    className="h-4 w-4 rounded border-slate-300 text-[#00346f] focus:ring-[#004a99] transition-colors cursor-pointer" 
                  />
                </div>
                <label htmlFor="recordarme" className="text-xs text-slate-600 cursor-pointer select-none font-medium">
                  Recordarme en este equipo
                </label>
              </div>

              {/* Acciones */}
              <div className="space-y-3 pt-6">
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#00346f] to-[#004a99] text-white font-bold py-3 rounded-md active:scale-95 transition-all shadow-md hover:shadow-lg duration-300 text-sm"
                >
                  Entrar
                </button>
                <button 
                  type="button" 
                  onClick={() => setVista('inicio')}
                  className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-md hover:bg-slate-200 active:scale-95 transition-all duration-300 text-sm"
                >
                  Cancelar
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;