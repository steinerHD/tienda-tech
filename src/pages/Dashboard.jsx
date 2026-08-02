import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { productosService, repuestosService } from "../firebase/inventoryService";

export default function Dashboard() {
  const [productos, setProductos] = useState([]);
  const [repuestos, setRepuestos] = useState([]);

  useEffect(() => {
    const unsub1 = productosService.subscribe(setProductos);
    const unsub2 = repuestosService.subscribe(setRepuestos);
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const todosLosItems = [...productos, ...repuestos];

  const valorInventario = todosLosItems.reduce(
    (acc, it) => acc + (Number(it.costo) || 0) * (Number(it.stock) || 0),
    0
  );

  const stockBajo = todosLosItems.filter(
    (it) => Number(it.stock) <= Number(it.stockMinimo)
  );

  const kpis = [
    { label: "Productos registrados", value: productos.length, icon: "bi-box-seam" },
    { label: "Repuestos registrados", value: repuestos.length, icon: "bi-tools" },
    {
      label: "Valor de inventario",
      value: `$ ${valorInventario.toLocaleString("es-CO")}`,
      icon: "bi-cash-stack",
    },
    {
      label: "Ítems con stock bajo",
      value: stockBajo.length,
      icon: "bi-exclamation-triangle",
      alert: stockBajo.length > 0,
    },
  ];

  return (
    <DashboardLayout>
      <h3>Hola, bienvenido 👋</h3>
      <p className="text-muted-custom">Esto es lo que pasa en tu inventario ahora mismo.</p>

      <div className="row g-3 mt-2">
        {kpis.map((k) => (
          <div className="col-6 col-lg-3" key={k.label}>
            <div className={`card-dark h-100 ${k.alert ? "border border-danger" : ""}`}>
              <div className="d-flex justify-content-between align-items-start">
                <span className="text-muted-custom">{k.label}</span>
                <i className={`bi ${k.icon} fs-4 ${k.alert ? "text-danger" : ""}`} />
              </div>
              <h3 className="mt-3">{k.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {stockBajo.length > 0 && (
        <div className="card-dark mt-4">
          <h5 className="mb-3">
            <i className="bi bi-exclamation-triangle text-danger me-2" />
            Ítems con stock bajo ({stockBajo.length})
          </h5>
          <table className="table table-dark table-hover mb-0">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Stock actual</th>
                <th>Stock mínimo</th>
              </tr>
            </thead>
            <tbody>
              {stockBajo.map((it) => (
                <tr key={it.id}>
                  <td>{it.nombre}</td>
                  <td>
                    <span
                      className={`badge-pill ${
                        repuestos.some((r) => r.id === it.id)
                          ? "bg-warning text-dark"
                          : "bg-info text-dark"
                      }`}
                    >
                      {repuestos.some((r) => r.id === it.id) ? "repuesto" : "producto"}
                    </span>
                  </td>
                  <td className="text-danger fw-bold">{it.stock}</td>
                  <td>{it.stockMinimo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}