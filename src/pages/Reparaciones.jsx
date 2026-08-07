import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Modal from "../components/common/Modal";
import CustomSelect from "../components/common/CustomSelect";
import { clientesService, repuestosService } from "../firebase/inventoryService";
import {
  subscribeToReparaciones,
  createReparacion,
  updateReparacion,
  deleteReparacion,
  confirmarEntregaReparacion,
} from "../firebase/reparacionesService";
import { useToast } from "../context/ToastContext";

const ESTADOS = [
  { value: "recibido", label: "Recibido" },
  { value: "diagnosticado", label: "Diagnosticado" },
  { value: "en_reparacion", label: "En reparación" },
  { value: "esperando_repuesto", label: "Esperando repuesto" },
  { value: "listo", label: "Listo para entrega" },
  { value: "cancelado", label: "Cancelado" },
];

const ESTADO_LABEL = {
  recibido: "Recibido",
  diagnosticado: "Diagnosticado",
  en_reparacion: "En reparación",
  esperando_repuesto: "Esperando repuesto",
  listo: "Listo para entrega",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const TIPOS_EQUIPO = [
  { value: "celular", label: "Celular" },
  { value: "laptop", label: "Laptop" },
  { value: "tablet", label: "Tablet" },
  { value: "otro", label: "Otro" },
];

const emptyForm = {
  clienteId: "",
  equipo: { tipo: "celular", marca: "", modelo: "", numeroSerie: "" },
  problemaReportado: "",
  diagnostico: "",
  costoEstimado: "",
  notas: "",
};

export default function Reparaciones() {
  const toast = useToast();
  const [reparaciones, setReparaciones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [repuestosUsados, setRepuestosUsados] = useState([]);
  const [repSeleccionado, setRepSeleccionado] = useState("");
  const [cantidadRep, setCantidadRep] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [editId, setEditId] = useState(null);
  const [confirmarId, setConfirmarId] = useState(null);
  const [entregando, setEntregando] = useState(false);
  const [verDetalle, setVerDetalle] = useState(null);

  useEffect(() => {
    const u1 = subscribeToReparaciones(setReparaciones);
    const u2 = clientesService.subscribe(setClientes);
    const u3 = repuestosService.subscribe(setRepuestos);
    return () => { u1(); u2(); u3(); };
  }, []);

  const opcionesClientes = clientes.map((c) => ({ value: c.id, label: `${c.nombre} — ${c.telefono}` }));
  const opcionesRepuestos = repuestos.map((r) => ({ value: r.id, label: `${r.nombre} — stock: ${r.stock}` }));
  const opcionesEstadoFiltro = [{ value: "todos", label: "Todos" }, ...ESTADOS];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const agregarRepuesto = () => {
    const rep = repuestos.find((r) => r.id === repSeleccionado);
    if (!rep || cantidadRep < 1) return;
    setRepuestosUsados([...repuestosUsados, { itemId: rep.id, nombre: rep.nombre, cantidad: Number(cantidadRep) }]);
    setRepSeleccionado("");
    setCantidadRep(1);
  };

  const quitarRepuesto = (idx) => setRepuestosUsados(repuestosUsados.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cliente = clientes.find((c) => c.id === form.clienteId);
    const payload = {
      ...form,
      clienteNombre: cliente?.nombre || "",
      costoEstimado: Number(form.costoEstimado) || 0,
      repuestosUsados,
    };
    try {
      if (editId) {
        await updateReparacion(editId, payload);
        toast.success("Actualizada", "La reparación se guardó correctamente.");
      } else {
        await createReparacion(payload);
        toast.success("Registrada", "La reparación se creó correctamente.");
      }
      setForm(emptyForm);
      setRepuestosUsados([]);
      setEditId(null);
      setShowForm(false);
    } catch (err) {
      toast.error("Error", "No se pudo guardar la reparación.");
    }
  };

  const handleEdit = (r) => {
    setForm({ ...emptyForm, ...r });
    setRepuestosUsados(r.repuestosUsados || []);
    setEditId(r.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("¿Eliminar esta reparación?")) {
      try {
        await deleteReparacion(id);
        toast.info("Eliminada", "La reparación fue eliminada.");
      } catch (err) {
        toast.error("Error", "No se pudo eliminar.");
      }
    }
  };

  const handleConfirmarEntrega = async () => {
    const rep = reparaciones.find((r) => r.id === confirmarId);
    if (!rep) return;
    setEntregando(true);
    try {
      await confirmarEntregaReparacion(rep);
      toast.success("Reparación entregada", "Se descontó el stock de los repuestos usados.");
      setConfirmarId(null);
    } catch (err) {
      toast.error("Error", "No se pudo confirmar la entrega. Intenta de nuevo.");
    } finally {
      setEntregando(false);
    }
  };

  const activas = reparaciones.filter((r) => r.estado !== "entregado");
  const entregadas = reparaciones.filter((r) => r.estado === "entregado");
  const filtered = activas.filter((r) => filtroEstado === "todos" || r.estado === filtroEstado);

  return (
    <DashboardLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Reparaciones</h3>
        <button
          className="btn btn-primary"
          onClick={() => {
            setForm(emptyForm);
            setRepuestosUsados([]);
            setEditId(null);
            setShowForm(true);
          }}
        >
          + Nueva reparación
        </button>
      </div>

      <Modal show={showForm} onClose={() => setShowForm(false)} title={editId ? "Editar reparación" : "Nueva reparación"} maxWidth={720}>
        <form onSubmit={handleSubmit}>
          <div className="row g-3 mb-3">
            <div className="col-12">
              <CustomSelect label="Cliente" value={form.clienteId} onChange={(val) => setForm({ ...form, clienteId: val })} options={opcionesClientes} placeholder="Selecciona un cliente" />
            </div>
          </div>

          <h6 className="text-muted-custom">Datos del equipo</h6>
          <div className="row g-3 mb-3">
            <div className="col-md-3">
              <CustomSelect value={form.equipo.tipo} onChange={(val) => setForm({ ...form, equipo: { ...form.equipo, tipo: val } })} options={TIPOS_EQUIPO} />
            </div>
            <div className="col-md-3">
              <input className="form-control" placeholder="Marca" value={form.equipo.marca} onChange={(e) => setForm({ ...form, equipo: { ...form.equipo, marca: e.target.value } })} />
            </div>
            <div className="col-md-3">
              <input className="form-control" placeholder="Modelo" value={form.equipo.modelo} onChange={(e) => setForm({ ...form, equipo: { ...form.equipo, modelo: e.target.value } })} />
            </div>
            <div className="col-md-3">
              <input className="form-control" placeholder="N° serie / IMEI" value={form.equipo.numeroSerie} onChange={(e) => setForm({ ...form, equipo: { ...form.equipo, numeroSerie: e.target.value } })} />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <textarea className="form-control" name="problemaReportado" placeholder="Problema reportado" value={form.problemaReportado} onChange={handleChange} required />
            </div>
            <div className="col-md-6">
              <textarea className="form-control" name="diagnostico" placeholder="Diagnóstico técnico (opcional)" value={form.diagnostico} onChange={handleChange} />
            </div>
          </div>

          <h6 className="text-muted-custom">Repuestos a usar (opcional)</h6>
          <div className="row g-3 align-items-end mb-2">
            <div className="col-md-6">
              <CustomSelect value={repSeleccionado} onChange={setRepSeleccionado} options={opcionesRepuestos} placeholder="Selecciona un repuesto" />
            </div>
            <div className="col-md-3">
              <input className="form-control" type="number" min="1" value={cantidadRep} onChange={(e) => setCantidadRep(e.target.value)} />
            </div>
            <div className="col-md-3">
              <button type="button" className="btn btn-outline-light w-100" onClick={agregarRepuesto}>Agregar</button>
            </div>
          </div>

          {repuestosUsados.length > 0 && (
            <ul className="list-unstyled mb-3">
              {repuestosUsados.map((r, idx) => (
                <li key={idx} className="d-flex justify-content-between align-items-center border-bottom py-1">
                  <span>{r.nombre} × {r.cantidad}</span>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => quitarRepuesto(idx)}>Quitar</button>
                </li>
              ))}
            </ul>
          )}

          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <input className="form-control" name="costoEstimado" type="number" placeholder="Costo estimado" value={form.costoEstimado} onChange={handleChange} />
            </div>
            <div className="col-md-8">
              <input className="form-control" name="notas" placeholder="Notas internas (opcional)" value={form.notas} onChange={handleChange} />
            </div>
          </div>

          <button className="btn btn-success w-100">{editId ? "Guardar cambios" : "Registrar reparación"}</button>
        </form>
      </Modal>

      <Modal show={!!confirmarId} onClose={() => setConfirmarId(null)} title="Confirmar entrega">
        <p className="text-muted-custom">
          Al confirmar, esta reparación se marcará como <strong>entregada</strong>, se descontará
          automáticamente el stock de los repuestos usados, y pasará a la lista de completadas sin
          posibilidad de editarla. Esta acción no se puede deshacer.
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

      <Modal show={!!verDetalle} onClose={() => setVerDetalle(null)} title="Detalle de la reparación" maxWidth={600}>
        {verDetalle && (
          <div>
            <p><strong>Cliente:</strong> {verDetalle.clienteNombre}</p>
            <p><strong>Equipo:</strong> {verDetalle.equipo?.marca} {verDetalle.equipo?.modelo} ({verDetalle.equipo?.tipo})</p>
            <p><strong>Problema:</strong> {verDetalle.problemaReportado}</p>
            {verDetalle.diagnostico && <p><strong>Diagnóstico:</strong> {verDetalle.diagnostico}</p>}
            {verDetalle.repuestosUsados?.length > 0 && (
              <>
                <p className="mb-1"><strong>Repuestos usados:</strong></p>
                <ul>
                  {verDetalle.repuestosUsados.map((r, idx) => (
                    <li key={idx}>{r.nombre} × {r.cantidad}</li>
                  ))}
                </ul>
              </>
            )}
            <p className="mb-0"><strong>Costo estimado:</strong> $ {Number(verDetalle.costoEstimado || 0).toLocaleString("es-CO")}</p>
          </div>
        )}
      </Modal>

      <div style={{ maxWidth: 220 }} className="mb-3">
        <CustomSelect value={filtroEstado} onChange={setFiltroEstado} options={opcionesEstadoFiltro} />
      </div>

      <div className="card-dark p-0 mb-4">
        <div className="p-3"><h5 className="mb-0">Reparaciones activas</h5></div>
        <table className="table table-dark table-hover mb-0">
          <thead>
            <tr><th>Cliente</th><th>Equipo</th><th>Problema</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.clienteNombre}</td>
                <td>{r.equipo?.marca} {r.equipo?.modelo}<br /><small className="text-muted-custom">{r.equipo?.tipo}</small></td>
                <td style={{ maxWidth: 200 }}>{r.problemaReportado}</td>
                <td style={{ maxWidth: 170 }}>
                  <CustomSelect value={r.estado} onChange={(val) => updateReparacion(r.id, { estado: val })} options={ESTADOS} />
                </td>
                <td className="text-end">
                  <button className="btn btn-sm btn-success me-2" onClick={() => setConfirmarId(r.id)}>Entregar</button>
                  <button className="btn btn-sm btn-outline-light me-2" onClick={() => handleEdit(r)}>Editar</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r.id)}>Borrar</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center text-muted-custom py-4">No hay reparaciones activas que coincidan.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card-dark p-0">
        <div className="p-3"><h5 className="mb-0">Reparaciones entregadas ({entregadas.length})</h5></div>
        <table className="table table-dark table-hover mb-0">
          <thead>
            <tr><th>Cliente</th><th>Equipo</th><th></th></tr>
          </thead>
          <tbody>
            {entregadas.map((r) => (
              <tr key={r.id}>
                <td>{r.clienteNombre}</td>
                <td>{r.equipo?.marca} {r.equipo?.modelo}</td>
                <td className="text-end">
                  <button className="btn btn-sm btn-outline-light" onClick={() => setVerDetalle(r)}>Ver detalle</button>
                </td>
              </tr>
            ))}
            {entregadas.length === 0 && (
              <tr><td colSpan={3} className="text-center text-muted-custom py-4">Aún no hay reparaciones entregadas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}