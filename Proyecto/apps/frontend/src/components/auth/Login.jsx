
/**
 * Componente de Formulario de Inicio de Sesión.
 * @param {Object} props - Funciones heredadas del padre (App.jsx).
 */
const Login = ({ handleChange, handleSubmit, setVista, formData }) => {
  return (
    <div style={{ maxWidth: '300px', margin: '50px auto' }}>
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
          <input name="password" type="password" placeholder="Contraseña" onChange={handleChange} required />
          
          <label style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              name="recordarme" 
              onChange={handleChange} 
              checked={formData.recordarme || false}
            /> Recordarme en este equipo
          </label>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit">Entrar</button>
            <button type="button" onClick={() => setVista('inicio')}>Cancelar</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Login;