export default function Login({ onLogin }) {
  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Pastores</h1>
        <p className="login-subtitle">Iniciar sesión</p>

        <button className="btn-google" onClick={onLogin}>
          Iniciar con Google
        </button>

        <div className="login-separator">o</div>

        <label className="field-label">
          Correo electrónico
          <input className="field-input" type="email" />
        </label>

        <label className="field-label">
          Contraseña
          <input className="field-input" type="password" />
        </label>

        <button className="btn-primary" onClick={onLogin}>
          Iniciar sesión
        </button>
      </div>
    </div>
  );
}
