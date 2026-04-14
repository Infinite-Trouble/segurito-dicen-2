import { useState } from 'react';

/**
 * Componente de Formulario de Registro de Usuario.
 */
const Registro = ({ handleChange, handleSubmit, setVista }) => {
  // Estado local para mostrar/ocultar la contraseña visualmente
  const [mostrarPassword, setMostrarPassword] = useState(false);

  return (
    <div className="w-full flex items-center justify-center p-6">
      <main className="w-full max-w-md bg-white rounded-xl shadow-[0_20px_50px_rgba(0,52,111,0.05)] overflow-hidden">
        
        {/* Visual Accent Header */}
        <div className="h-2 w-full bg-gradient-to-r from-[#00346f] to-[#004a99]"></div>
        
        <div className="p-8 md:p-12">
          {/* Brand & Heading */}
          <div className="mb-10 text-center md:text-left">
            <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
              <span className="material-symbols-outlined text-[#00346f]" style={{ fontVariationSettings: "'FILL' 1" }}>
                account_balance
              </span>
              <span className="font-extrabold text-[#00346f] tracking-tighter text-lg">
                Préstamos de Consumo
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Crear Cuenta Nueva</h1>
            <p className="text-slate-500 mt-2 text-sm">Comience su camino hacia la excelencia financiera con nosotros.</p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">RUT</label>
              <input 
                name="rut" 
                onChange={handleChange} 
                required 
                placeholder="12.345.678-9" 
                type="text"
                className="w-full bg-transparent border-0 border-b border-slate-300 focus:ring-0 focus:border-[#00346f] focus:border-b-2 transition-colors py-2 text-slate-900 font-medium placeholder:text-slate-400 outline-none px-0"
              />
            </div>

            {/* Grid para Nombre y Apellido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Nombre</label>
                <input 
                  name="nombre" 
                  onChange={handleChange} 
                  required 
                  placeholder="Nombre" 
                  type="text"
                  className="w-full bg-transparent border-0 border-b border-slate-300 focus:ring-0 focus:border-[#00346f] focus:border-b-2 transition-colors py-2 text-slate-900 font-medium placeholder:text-slate-400 outline-none px-0"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Apellido</label>
                <input 
                  name="apellido" 
                  onChange={handleChange} 
                  required 
                  placeholder="Apellido" 
                  type="text"
                  className="w-full bg-transparent border-0 border-b border-slate-300 focus:ring-0 focus:border-[#00346f] focus:border-b-2 transition-colors py-2 text-slate-900 font-medium placeholder:text-slate-400 outline-none px-0"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Correo electrónico</label>
              <input 
                name="email" 
                onChange={handleChange} 
                required 
                placeholder="ejemplo@financial.cl" 
                type="email"
                className="w-full bg-transparent border-0 border-b border-slate-300 focus:ring-0 focus:border-[#00346f] focus:border-b-2 transition-colors py-2 text-slate-900 font-medium placeholder:text-slate-400 outline-none px-0"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Teléfono (Opcional)</label>
              <div className="flex items-center gap-2 border-b border-slate-300 focus-within:border-[#00346f] focus-within:border-b-2 transition-colors">
                <span className="text-slate-500 text-sm font-medium pb-1">+56</span>
                <input 
                  name="telefono" 
                  onChange={handleChange} 
                  placeholder="9 1234 5678" 
                  type="text"
                  className="flex-1 bg-transparent border-0 focus:ring-0 py-2 text-slate-900 font-medium placeholder:text-slate-400 outline-none px-0"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Contraseña</label>
              <div className="relative border-b border-slate-300 focus-within:border-[#00346f] focus-within:border-b-2 transition-colors">
                <input 
                  name="password" 
                  onChange={handleChange} 
                  required 
                  placeholder="••••••••" 
                  type={mostrarPassword ? "text" : "password"}
                  className="w-full bg-transparent border-0 focus:ring-0 py-2 text-slate-900 font-medium placeholder:text-slate-400 outline-none px-0 pr-8"
                />
                <span 
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-[#00346f] transition-colors pb-1"
                  title={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {mostrarPassword ? "visibility_off" : "visibility"}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-8 flex flex-col space-y-4">
              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-[#00346f] to-[#004a99] text-white font-bold py-4 rounded-md transition-all active:scale-95 shadow-md hover:shadow-lg"
              >
                Registrarme
              </button>
              <button 
                type="button" 
                onClick={() => setVista('login')}
                className="w-full bg-slate-100 text-slate-700 font-semibold py-4 rounded-md transition-all hover:bg-slate-200 active:scale-95"
              >
                Ya tengo cuenta (Iniciar Sesión)
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Registro;