import { useState, useEffect } from 'react'
import Simulador from './components/simulador/Simulador';
import Login from './components/auth/Login';
import Registro from './components/auth/Register';
import Dashboard from './components/user/Dashboard';
import Perfil from './components/user/Perfil';
import Formulario from './components/solicitud/Formulario';
import FirmaDigital from './components/firma/FirmaDigital';

function App() {
  const [vista, setVista] = useState('inicio');
  const [token, setToken] = useState(localStorage.getItem('token') || sessionStorage.getItem('token'));
  const [datosSimulacion, setDatosSimulacion] = useState(null);

  const [usuarioData, setUsuarioData] = useState(() => {
    const saved = localStorage.getItem('user_info') || sessionStorage.getItem('user_info');
    return saved ? JSON.parse(saved) : null;
  });

  const [formData, setFormData] = useState({
    rut: '', nombre: '', apellido: '', email: '', password: '', 
    telefono: '', recordarme: false 
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = vista === 'login' ? '/login' : '/register';
    
    try {
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (vista === 'login') {
          const storage = formData.recordarme ? localStorage : sessionStorage;
          
          storage.setItem('token', data.access_token);
          
          if (data.user) {
            storage.setItem('user_info', JSON.stringify(data.user));
          }
          
          setUsuarioData(data.user);
          setToken(data.access_token);
          setVista('dashboard');
        } else {
          alert("Registro exitoso");
          setVista('login');
        }
      } else {
        // Manejo mejorado de errores del backend (FastAPI/Pydantic)
        let errorMsg = "Error en la operación";
        if (Array.isArray(data.detail)) {
          errorMsg = data.detail.map(err => err.msg).join(", ");
        } else if (typeof data.detail === 'string') {
          errorMsg = data.detail;
        }
        alert(errorMsg);
      }
    } catch (error) {
      alert("Error de conexión con el servidor");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_info');
    sessionStorage.removeItem('token');
    setToken(null);
    setUsuarioData(null);
    setVista('inicio');
  };

return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-800 flex flex-col font-sans">
      
      {/* HEADER DINÁMICO */}
      <header className="bg-white/80 backdrop-blur-xl shadow-sm sticky top-0 z-50 transition-all duration-300 border-b border-gray-200">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
          
          {/* Logo y Marca */}
          <button onClick={() => setVista('inicio')} className="flex items-center gap-3 text-left group">
            <div className="bg-[#00346f] p-2 rounded-xl group-hover:scale-105 transition-transform flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-[#00346f] leading-none">
                Sistema de Préstamos
              </span>
            </div>
          </button>

          {/* Acciones de Navegación */}
          <div className="flex items-center gap-4">
            {token ? (
              // USUARIO LOGUEADO
              <>
                <div className="hidden md:flex flex-col items-end mr-2">
                  <span className="text-sm font-semibold text-slate-600">
                    Hola, {usuarioData?.nombre || 'Usuario'}!
                  </span>
                </div>
                
                {vista === 'inicio' && (
                  <button 
                    onClick={() => setVista('dashboard')} 
                    className="bg-[#8df5e4] text-[#00201c] px-4 sm:px-5 py-2 rounded-xl font-bold text-sm hover:brightness-105 transition-all shadow-sm flex items-center gap-2 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-lg">dashboard</span>
                    Mi Panel
                  </button>
                )}
                
                <button 
                  onClick={handleLogout} 
                  className="text-slate-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50 flex items-center justify-center"
                  title="Cerrar Sesión"
                >
                  <span className="material-symbols-outlined text-xl">logout</span>
                </button>
              </>
            ) : (
              // USUARIO INVITADO
              <>
                {vista !== 'login' && (
                  <button 
                    onClick={() => setVista('login')} 
                    className="text-[#00346f] font-bold px-4 py-2 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                  >
                    Iniciar Sesión
                  </button>
                )}
                {vista !== 'registro' && (
                  <button 
                    onClick={() => setVista('registro')} 
                    className="bg-[#00346f] text-white px-4 sm:px-5 py-2 rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors shadow-sm"
                  >
                    Crear Cuenta
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-grow w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-10">
        {vista === 'inicio' && <Simulador setVista={setVista} setDatosSimulacion={setDatosSimulacion} />}
        {vista === 'login' && <Login handleChange={handleChange} handleSubmit={handleSubmit} setVista={setVista} formData={formData} />}
        {vista === 'registro' && <Registro handleChange={handleChange} handleSubmit={handleSubmit} setVista={setVista} formData={formData} />}
        {vista === 'dashboard' && token && <Dashboard token={token} setVista={setVista} />}
        {vista === 'solicitud' && <Formulario simulacionData={datosSimulacion} setVista={setVista} />}
        {vista === 'perfil' && token && <Perfil token={token} setVista={setVista} usuarioActual={usuarioData} />}
        {vista === 'firma-digital' && <FirmaDigital setVista={setVista} />}
      </main>

    </div>
  );
}

export default App;
