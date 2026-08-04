import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Modal from "../components/common/Modal";
import CustomSelect from "../components/common/CustomSelect";
import { clientesService, productosService, repuestosService } from "../firebase/inventoryService";
import { subscribeToPedidos, createPedido, updatePedidoEstado, deletePedido } from "../firebase/pedidosService";

const ESTADOS = [
  { value: "nuevo", label: "Nuevo" },
  { value: "en_espera", label: "En espera" },
  { value: "en_camino", label: "En camino" },
  { value: "entregado", label: "Entregado" },
  { value: "cancelado", label: "Cancelado" },
];

export default function Pedidos() {
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
  const opcionesEstadoFiltro = [{ value: "todos", label: "Todos los estados" }, ...ESTADOS];

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
    await createPedido({ clienteId, clienteNombre: cliente.nombre, items: carrito });
    setClienteId("");
    setCarrito([]);
    setShowForm(false);
  };

  const filtered = pedidos.filter((p) => filtroEstado === "todos" || p.estado === filtroEstado);

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
              <CustomSelect
                label="Cliente"
                value={clienteId}
                onChange={setClienteId}
                options={opcionesClientes}
                placeholder="Selecciona un cliente"
              />
            </div>
          </div>

          <div className="row g-3 align-items-end mb-3">
            <div className="col-md-6">
              <CustomSelect
                label="Producto o repuesto"
                value={itemSeleccionado}
                onChange={setItemSeleccionado}
                options={opcionesItems}
                placeholder="Selecciona un ítem"
              />
            </div>
            <div className="col-md-3">
              <input className="form-control" type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
            </div>
            <div className="col-md-3">
              <button type="button" className="btn btn-outline-light w-100" onClick={agregarAlCarrito}>
                Agregar
              </button>
            </div>
          </div>

          {carrito.length > 0 && (
            <table className="table table-dark table-sm mb-3">
              <thead>
                <tr>
                  <th>Ítem</th><th>Tipo</th><th>Cant.</th><th>Precio unit.</th><th>Subtotal</th><th></th>
                </tr>
              </thead>
              <tbody>
                {carrito.map((it, idx) => (
                  <tr key={idx}>
                    <td>{it.nombre}</td>
                    <td>{it.tipo}</td>
                    <td>{it.cantidad}</td>
                    <td>$ {it.precioUnitario}</td>
                    <td>$ {it.precioUnitario * it.cantidad}</td>
                    <td>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => quitarDelCarrito(idx)}>
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Total: $ {totalCarrito.toLocaleString("es-CO")}</h5>
          </div>

          {carrito.length > 0 && (
            <div className="alert alert-warning py-2">
              Recuerda actualizar el stock manualmente en Inventario después de confirmar la entrega.
            </div>
          )}

          <button className="btn btn-success w-100" disabled={carrito.length === 0 || !clienteId}>
            Crear pedido
          </button>
        </form>
      </Modal>

      <div style={{ maxWidth: 240 }} className="mb-3">
        <CustomSelect value={filtroEstado} onChange={setFiltroEstado} options={opcionesEstadoFiltro} />
      </div>

      <div className="card-dark p-0">
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
                <td style={{ maxWidth: 180 }}>
                  <CustomSelect
                    value={p.estado}
                    onChange={(val) => updatePedidoEstado(p.id, val)}
                    options={ESTADOS}
                  />
                </td>
                <td className="text-end">
                  <button className="btn btn-sm btn-outline-danger" onClick={() => confirm("¿Eliminar este pedido?") && deletePedido(p.id)}>
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center text-muted-custom py-4">No hay pedidos que coincidan.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}