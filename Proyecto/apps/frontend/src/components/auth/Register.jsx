
/**
 * Componente de Formulario de Registro de Usuario.
 */
const Registro = ({ handleChange, handleSubmit, setVista }) => {
  return (
    <div style={{ maxWidth: '300px', margin: '50px auto' }}>
      <h2>Crear Cuenta Nueva</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input name="rut" placeholder="RUT (ej: 12345678-9)" onChange={handleChange} required />
          <input name="nombre" placeholder="Nombre" onChange={handleChange} required />
          <input name="apellido" placeholder="Apellido" onChange={handleChange} required />
          <input name="email" type="email" placeholder="Correo electrónico" onChange={handleChange} required />
          <input name="password" type="password" placeholder="Contraseña" onChange={handleChange} required />
          <input name="telefono" placeholder="Teléfono" onChange={handleChange} />
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="submit">Registrarme</button>
            <button type="button" onClick={() => setVista('inicio')}>Volver</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Registro;