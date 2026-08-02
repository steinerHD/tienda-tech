import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";

export default function Inventario() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <h3 className="mb-1">Inventario</h3>
      <p className="text-muted-custom mb-4">Elige qué inventario quieres gestionar.</p>

      <div className="row g-4">
        <div className="col-md-6">
          <div
            className="card-dark p-4"
            style={{ cursor: "pointer", minHeight: 180 }}
            onClick={() => navigate("/inventario/productos")}
          >
            <i className="bi bi-box-seam fs-1 mb-3" />
            <h4>Productos</h4>
            <p className="text-muted-custom mb-0">
              Artículos listos para la venta al público.
            </p>
          </div>
        </div>
        <div className="col-md-6">
          <div
            className="card-dark p-4"
            style={{ cursor: "pointer", minHeight: 180 }}
            onClick={() => navigate("/inventario/repuestos")}
          >
            <i className="bi bi-tools fs-1 mb-3" />
            <h4>Repuestos</h4>
            <p className="text-muted-custom mb-0">
              Piezas para reparación de equipos de clientes.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}