import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventario from "./pages/Inventario";
import Productos from "./pages/Productos";
import Repuestos from "./pages/Repuestos";
import Chatbot from "./pages/Chatbot";
import Clientes from "./pages/Clientes";
import Pedidos from "./pages/Pedidos";
import Reparaciones from "./pages/Reparaciones";
import Caja from "./pages/Caja";
import Ayuda from "./pages/Ayuda";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-white p-4">Cargando...</div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/clientes" element={<PrivateRoute><Clientes /></PrivateRoute>} />
            <Route path="/inventario" element={<PrivateRoute><Inventario /></PrivateRoute>} />
            <Route path="/inventario/productos" element={<PrivateRoute><Productos /></PrivateRoute>} />
            <Route path="/inventario/repuestos" element={<PrivateRoute><Repuestos /></PrivateRoute>} />
            <Route path="/pedidos" element={<PrivateRoute><Pedidos /></PrivateRoute>} />
            <Route path="/reparaciones" element={<PrivateRoute><Reparaciones /></PrivateRoute>} />
            <Route path="/caja" element={<PrivateRoute><Caja /></PrivateRoute>} />
            <Route path="/chatbot" element={<PrivateRoute><Chatbot /></PrivateRoute>} />
            <Route path="/ayuda" element={<PrivateRoute><Ayuda /></PrivateRoute>} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}