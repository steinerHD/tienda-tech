import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { productosService, repuestosService, clientesService } from "../firebase/inventoryService";
import { subscribeToPedidos } from "../firebase/pedidosService";
import { subscribeToReparaciones } from "../firebase/reparacionesService";
import { subscribeToCajaAbierta, subscribeToMovimientos } from "../firebase/cajaService";

const ESTADO_PEDIDO_LABEL = {
  nuevo: "Nuevo",
  en_espera: "En espera",
  en_camino: "En camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const ESTADO_REPARACION_LABEL = {
  recibido: "Recibido",
  diagnosticado: "Diagnosticado",
  en_reparacion: "En reparación",
  esperando_repuesto: "Esperando repuesto",
  listo: "Listo",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export default function Dashboard() {
  const [productos, setProductos] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [reparaciones, setReparaciones] = useState([]);
  const [cajaAbierta, setCajaAbierta] = useState(undefined);
  const [movimientos, setMovimientos] = useState([]);

  useEffect(() => {
    const u1 = productosService.subscribe(setProductos);
    const u2 = repuestosService.subscribe(setRepuestos);
    const u3 = clientesService.subscribe(setClientes);
    const u4 = subscribeToPedidos(setPedidos);
    const u5 = subscribeToReparaciones(setReparaciones);
    const u6 = subscribeToCajaAbierta(setCajaAbierta);
    return () => { u1(); u2(); u3(); u4(); u5(); u6(); };
  }, []);

  useEffect(() => {
    if (!cajaAbierta) {
      setMovimientos([]);
      return;
    }
    const unsub = subscribeToMovimientos(cajaAbierta.id, setMovimientos);
    return unsub;
  }, [cajaAbierta?.id]);

  const todosLosItems = [...productos, ...repuestos];

  const valorInventario = todosLosItems.reduce(
    (acc, it) => acc + (Number(it.costo) || 0) * (Number(it.stock) || 0),
    0
  );

  const stockBajo = todosLosItems.filter(
    (it) => Number(it.stock) <= Number(it.stockMinimo)
  );

  const ingresosCaja = movimientos
    .filter((m) => m.tipo === "ingreso")
    .reduce((acc, m) => acc + m.monto, 0);

  const pedidosPendientes = pedidos.filter((p) =>
    ["nuevo", "en_espera", "en_camino"].includes(p.estado)
  );

  const reparacionesActivas = reparaciones.filter(
    (r) => !["entregado", "cancelado"].includes(r.estado)
  );

  // Actividad reciente: combina pedidos y reparaciones, ordenados por fecha de creación
  const actividad = [
    ...pedidos.slice(0, 5).map((p) => ({
      tipo: "pedido",
      icon: "bi-receipt",
      titulo: `Pedido de ${p.clienteNombre}`,
      detalle: `${ESTADO_PEDIDO_LABEL[p.estado] || p.estado} · $ ${p.total?.toLocaleString("es-CO")}`,
      fecha: p.creadoEn,
    })),
    ...reparaciones.slice(0, 5).map((r) => ({
      tipo: "reparacion",
      icon: "bi-wrench-adjustable",
      titulo: `Reparación de ${r.clienteNombre}`,
      detalle: `${ESTADO_REPARACION_LABEL[r.estado] || r.estado} · ${r.equipo?.marca || ""} ${r.equipo?.modelo || ""}`,
      fecha: r.creadoEn,
    })),
  ]
    .filter((a) => a.fecha) // descarta los que aún no tienen timestamp confirmado por el servidor
    .sort((a, b) => b.fecha.toMillis() - a.fecha.toMillis())
    .slice(0, 6);

  const kpisPrincipales = [
    {
      label: "Ingresos caja actual",
      value: cajaAbierta ? `$ ${ingresosCaja.toLocaleString("es-CO")}` : "Sin caja abierta",
      icon: "bi-cash-coin",
    },
    { label: "Pedidos pendientes", value: pedidosPendientes.length, icon: "bi-receipt" },
    { label: "Reparaciones activas", value: reparacionesActivas.length, icon: "bi-wrench-adjustable" },
    { label: "Clientes registrados", value: clientes.length, icon: "bi-people" },
  ];

  const kpisSecundarios = [
    { label: "Productos registrados", value: productos.length, icon: "bi-box-seam" },
    { label: "Repuestos registrados", value: repuestos.length, icon: "bi-tools" },
    {
      label: "Valor de inventario",
      value: `$ ${valorInventario.toLocaleString("es-CO")}`,
      icon: "bi-graph-up",
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
      <p className="text-muted-custom">Esto es lo que pasa en tu negocio ahora mismo.</p>

      <div className="row g-3 mt-2">
        {kpisPrincipales.map((k) => (
          <div className="col-6 col-lg-3" key={k.label}>
            <div className="card-dark h-100">
              <div className="d-flex justify-content-between align-items-start">
                <span className="text-muted-custom">{k.label}</span>
                <i className={`bi ${k.icon} fs-4`} />
              </div>
              <h4 className="mt-3 mb-0">{k.value}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3 mt-1">
        {kpisSecundarios.map((k) => (
          <div className="col-6 col-lg-3" key={k.label}>
            <div className={`card-dark h-100 ${k.alert ? "border border-danger" : ""}`}>
              <div className="d-flex justify-content-between align-items-start">
                <span className="text-muted-custom">{k.label}</span>
                <i className={`bi ${k.icon} fs-5 ${k.alert ? "text-danger" : ""}`} />
              </div>
              <h5 className="mt-3 mb-0">{k.value}</h5>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3 mt-1">
        <div className="col-lg-7">
          <div className="card-dark h-100">
            <h5 className="mb-3">Actividad reciente</h5>
            {actividad.length === 0 ? (
              <p className="text-muted-custom mb-0">Aún no hay actividad registrada.</p>
            ) : (
              <ul className="list-unstyled mb-0">
                {actividad.map((a, idx) => (
                  <li
                    key={idx}
                    className="d-flex align-items-center gap-3 py-2"
                    style={{ borderBottom: idx < actividad.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
                  >
                    <span className="icon-circle" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <i className={`bi ${a.icon}`} />
                    </span>
                    <div>
                      <div>{a.titulo}</div>
                      <small className="text-muted-custom">{a.detalle}</small>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card-dark h-100">
            <h5 className="mb-3">
              <i className="bi bi-exclamation-triangle text-danger me-2" />
              Stock bajo ({stockBajo.length})
            </h5>
            {stockBajo.length === 0 ? (
              <p className="text-muted-custom mb-0">Todo el inventario está en niveles saludables.</p>
            ) : (
              <ul className="list-unstyled mb-0">
                {stockBajo.slice(0, 6).map((it) => (
                  <li
                    key={it.id}
                    className="d-flex justify-content-between py-2"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <span>{it.nombre}</span>
                    <span className="text-danger fw-bold">{it.stock} / {it.stockMinimo}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}