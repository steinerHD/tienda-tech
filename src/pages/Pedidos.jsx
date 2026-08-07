import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Modal from "../components/common/Modal";
import CustomSelect from "../components/common/CustomSelect";
import { clientesService, productosService, repuestosService } from "../firebase/inventoryService";
import {
  subscribeToPedidos,
  createPedido,
  updatePedidoEstado,
  deletePedido,
  confirmarEntregaPedido,
} from "../firebase/pedidosService";
import { useToast } from "../context/ToastContext";

const ESTADOS = [
  { value: "nuevo", label: "Nuevo" },
  { value: "en_espera", label: "En espera" },
  { value: "en_camino", label: "En camino" },
  { value: "cancelado", label: "Cancelado" },
];

const ESTADO_LABEL = {
  nuevo: "Nuevo",
  en_espera: "En espera",
  en_camino: "En camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export default function Pedidos() {
  const toast = useToast();
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [itemSeleccionado, setItemSeleccionado] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [confirmarId, setConfirmarId] = useState(null);
  const [entregando, setEntregando] = useState(false);
  const [verDetalle, setVerDetalle] = useState(null);

  useEffect(() => {
    const u1 = subscribeToPedidos(setPedidos);
    const u2 = clientesService.subscribe(setClientes);
    const u3 = productosService.subscribe(setProductos);
    const u4 = repuestosService.subscribe(setRepuestos);
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  const todosLosItems = [
    ...productos.map((p) => ({ ...p, tipo: "producto" })),
    ...repuestos.map((r) => ({ ...r, tipo: "repuesto" })),
  ];

  const opcionesClientes = clientes.map((c) => ({ value: c.id, label: `${c.nombre} — ${c.telefono}` }));
  const opcionesItems = todosLosItems.map((it) => ({
    value: it.id,
    label: `[${it.tipo}] ${it.nombre} — stock: ${it.stock} — $ ${it.precioVenta || 0}`,
  }));
  const opcionesEstadoFiltro = [{ value: "todos", label: "Todos" }, ...ESTADOS];

  const agregarAlCarrito = () => {
    const item = todosLosItems.find((it) => it.id === itemSeleccionado);
    if (!item || cantidad < 1) return;
    setCarrito([
      ...carrito,
      {
        itemId: item.id,
        tipo: item.tipo,
        nombre: item.nombre,
        cantidad: Number(cantidad),
        precioUnitario: Number(item.precioVenta) || 0,
      },
    ]);
    setItemSeleccionado("");
    setCantidad(1);
  };

  const quitarDelCarrito = (idx) => setCarrito(carrito.filter((_, i) => i !== idx));
  const totalCarrito = carrito.reduce((acc, it) => acc + it.precioUnitario * it.cantidad, 0);

  const handleCrearPedido = async (e) => {
    e.preventDefault();
    const cliente = clientes.find((c) => c.id === clienteId);
    if (!cliente || carrito.length === 0) return;
    try {
      await createPedido({ clienteId, clienteNombre: cliente.nombre, items: carrito });
      toast.success("Pedido creado", "El pedido se registró correctamente.");
      setClienteId("");
      setCarrito([]);
      setShowForm(false);
    } catch (err) {
      toast.error("Error", "No se pudo crear el pedido.");
    }
  };

  const handleConfirmarEntrega = async () => {
    const pedido = pedidos.find((p) => p.id === confirmarId);
    if (!pedido) return;
    setEntregando(true);
    try {
      await confirmarEntregaPedido(pedido);
      toast.success("Pedido entregado", "Se descontó el stock correspondiente.");
      setConfirmarId(null);
    } catch (err) {
      toast.error("Error", "No se pudo confirmar la entrega. Intenta de nuevo.");
    } finally {
      setEntregando(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Eliminar este pedido?")) {
      try {
        await deletePedido(id);
        toast.info("Eliminado", "El pedido fue eliminado.");
      } catch (err) {
        toast.error("Error", "No se pudo eliminar.");
      }
    }
  };

  const activos = pedidos.filter((p) => p.estado !== "entregado");
  const entregados = pedidos.filter((p) => p.estado === "entregado");
  const filtered = activos.filter((p) => filtroEstado === "todos" || p.estado === filtroEstado);

  return (
    <DashboardLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Pedidos</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Nuevo pedido
        </button>
      </div>

      <Modal show={showForm} onClose={() => setShowForm(false)} title="Nuevo pedido" maxWidth={700}>
        <form onSubmit={handleCrearPedido}>
          <div className="row g-3 mb-3">
            <div className="col-12">
              <CustomSelect label="Cliente" value={clienteId} onChange={setClienteId} options={opcionesClientes} placeholder="Selecciona un cliente" />
            </div>
          </div>
          <div className="row g-3 align-items-end mb-3">
            <div className="col-md-6">
              <CustomSelect label="Producto o repuesto" value={itemSeleccionado} onChange={setItemSeleccionado} options={opcionesItems} placeholder="Selecciona un ítem" />
            </div>
            <div className="col-md-3">
              <input className="form-control" type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
            </div>
            <div className="col-md-3">
              <button type="button" className="btn btn-outline-light w-100" onClick={agregarAlCarrito}>Agregar</button>
            </div>
          </div>

          {carrito.length > 0 && (
            <table className="table table-dark table-sm mb-3">
              <thead>
                <tr><th>Ítem</th><th>Tipo</th><th>Cant.</th><th>Precio unit.</th><th>Subtotal</th><th></th></tr>
              </thead>
              <tbody>
                {carrito.map((it, idx) => (
                  <tr key={idx}>
                    <td>{it.nombre}</td><td>{it.tipo}</td><td>{it.cantidad}</td>
                    <td>$ {it.precioUnitario}</td><td>$ {it.precioUnitario * it.cantidad}</td>
                    <td>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => quitarDelCarrito(idx)}>Quitar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h5 className="mb-3">Total: $ {totalCarrito.toLocaleString("es-CO")}</h5>
          <button className="btn btn-success w-100" disabled={carrito.length === 0 || !clienteId}>Crear pedido</button>
        </form>
      </Modal>

      {/* Confirmación de entrega */}
      <Modal show={!!confirmarId} onClose={() => setConfirmarId(null)} title="Confirmar entrega">
        <p className="text-muted-custom">
          Al confirmar, este pedido se marcará como <strong>entregado</strong>, se descontará
          automáticamente el stock de los ítems vendidos, y el pedido pasará a la lista de
          completados sin posibilidad de editarlo. Esta acción no se puede deshacer.
        </p>
        <div className="d-flex gap-2 mt-3">
          <button className="btn btn-outline-light w-100" onClick={() => setConfirmarId(null)} disabled={entregando}>
            Cancelar
          </button>
          <button className="btn btn-success w-100" onClick={handleConfirmarEntrega} disabled={entregando}>
            {entregando ? "Confirmando..." : "Confirmar entrega"}
          </button>
        </div>
      </Modal>

      {/* Detalle de solo lectura */}
      <Modal show={!!verDetalle} onClose={() => setVerDetalle(null)} title="Detalle del pedido" maxWidth={600}>
        {verDetalle && (
          <div>
            <p><strong>Cliente:</strong> {verDetalle.clienteNombre}</p>
            <p><strong>Estado:</strong> {ESTADO_LABEL[verDetalle.estado]}</p>
            <table className="table table-dark table-sm mb-3">
              <thead><tr><th>Ítem</th><th>Tipo</th><th>Cant.</th><th>Precio unit.</th><th>Subtotal</th></tr></thead>
              <tbody>
                {verDetalle.items?.map((it, idx) => (
                  <tr key={idx}>
                    <td>{it.nombre}</td><td>{it.tipo}</td><td>{it.cantidad}</td>
                    <td>$ {it.precioUnitario}</td><td>$ {it.precioUnitario * it.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h5 className="mb-0">Total: $ {verDetalle.total?.toLocaleString("es-CO")}</h5>
          </div>
        )}
      </Modal>

      <div style={{ maxWidth: 220 }} className="mb-3">
        <CustomSelect value={filtroEstado} onChange={setFiltroEstado} options={opcionesEstadoFiltro} />
      </div>

      <div className="card-dark p-0 mb-4">
        <div className="p-3"><h5 className="mb-0">Pedidos activos</h5></div>
        <table className="table table-dark table-hover mb-0">
          <thead>
            <tr><th>Cliente</th><th>Ítems</th><th>Total</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>{p.clienteNombre}</td>
                <td>{p.items?.length || 0} ítem(s)</td>
                <td>$ {p.total?.toLocaleString("es-CO")}</td>
                <td style={{ maxWidth: 160 }}>
                  <CustomSelect value={p.estado} onChange={(val) => updatePedidoEstado(p.id, val)} options={ESTADOS} />
                </td>
                <td className="text-end">
                  <button className="btn btn-sm btn-success me-2" onClick={() => setConfirmarId(p.id)}>
                    Entregar
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.id)}>
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center text-muted-custom py-4">No hay pedidos activos que coincidan.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card-dark p-0">
        <div className="p-3"><h5 className="mb-0">Pedidos entregados ({entregados.length})</h5></div>
        <table className="table table-dark table-hover mb-0">
          <thead>
            <tr><th>Cliente</th><th>Ítems</th><th>Total</th><th></th></tr>
          </thead>
          <tbody>
            {entregados.map((p) => (
              <tr key={p.id}>
                <td>{p.clienteNombre}</td>
                <td>{p.items?.length || 0} ítem(s)</td>
                <td>$ {p.total?.toLocaleString("es-CO")}</td>
                <td className="text-end">
                  <button className="btn btn-sm btn-outline-light" onClick={() => setVerDetalle(p)}>
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
            {entregados.length === 0 && (
              <tr><td colSpan={4} className="text-center text-muted-custom py-4">Aún no hay pedidos entregados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}