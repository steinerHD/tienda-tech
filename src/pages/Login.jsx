import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DecorativeBackground from "../components/layout/DecorativeBackground";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError("Correo o contraseña incorrectos.");
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center position-relative"
      style={{ minHeight: "100vh", background: "var(--bg-app)", padding: "40px 20px" }}
    >
      <DecorativeBackground />

      <div className="login-frame position-relative" style={{ zIndex: 1 }}>
        <div className="row w-100 align-items-center g-0">
          <div className="col-md-6 p-5">
            <div
              className="icon-circle mb-4"
              style={{ background: "var(--gradient-cta)", width: 73, height: 73 }}
            >
              <img className="img-login" src="/favicon.svg" alt="Logo" style={{ width: 72, height: 72 }} />
            </div>
            <h1 className="display-4 mb-3">Bienvenido</h1>
            <div style={{ width: 60, height: 3, background: "var(--gradient-cta)" }} className="mb-4" />
            <p className="text-muted-custom" style={{ maxWidth: 380 }}>
              Gestiona productos, repuestos, pedidos y reparaciones de tu tienda en un solo lugar.
            </p>
          </div>

          <div className="col-md-6 d-flex justify-content-center p-4">
            <form onSubmit={handleSubmit} className="login-inner-card" style={{ width: 360 }}>
              <h3 className="mb-4">
                Iniciar <span className="accent-underline">sesión</span>
              </h3>

              {error && <div className="alert alert-danger py-2">{error}</div>}

              <label className="text-muted-custom mb-1 d-block">Correo</label>
              <input
                type="email"
                className="form-control mb-3"
                placeholder="tucorreo@tienda.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label className="text-muted-custom mb-1 d-block">Contraseña</label>
              <input
                type="password"
                className="form-control mb-4"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button className="btn btn-primary w-100">Entrar</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}