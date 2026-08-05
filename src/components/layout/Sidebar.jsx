import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import logo from "/favicon.svg";

const items = [
  { to: "/", icon: "bi-pie-chart", label: "Dashboard" },
  { to: "/clientes", icon: "bi-people", label: "Clientes" },
  { to: "/inventario", icon: "bi-grid", label: "Inventario" },
  { to: "/pedidos", icon: "bi-receipt", label: "Pedidos" },
  { to: "/reparaciones", icon: "bi-wrench-adjustable", label: "Reparaciones" },
  { to: "/caja", icon: "bi-cash-coin", label: "Caja" },
  { to: "/chatbot", icon: "bi-chat-dots", label: "Chatbot" },
  { to: "/ayuda", icon: "bi-question-circle", label: "Ayuda" },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`sidebar-wrapper ${expanded ? "expanded" : ""}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="sidebar d-flex flex-column align-items-start py-4">
        <div className="sidebar-logo mb-5">
          <div className="icon-circle mb-4"
              style={{ background: "var(--gradient-cta)", width: 41, height: 41 }}
          >
            <img src={logo} className="imgsidebar" alt="TechTree" style={{ width: 40, height: 40, objectFit: "contain" }} />
          </div>
        </div>

        <div className="d-flex pb-4 flex-column gap-2 flex-grow-1 w-100">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `sidebar-link d-flex align-items-center ${isActive ? "active" : ""}`
              }
            >
              <span className="icon-circle">
                <i className={`bi ${item.icon}`} />
              </span>
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          ))}
        </div>

        <button className="sidebar-link border-0 bg-transparent" onClick={logout}>
          <span className="icon-circle">
            <i className="bi bi-box-arrow-right" />
          </span>
          <span className="sidebar-label">Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}