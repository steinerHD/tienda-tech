import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { clientesService, repuestosService } from "../firebase/inventoryService";
import {
  subscribeToReparaciones,
  createReparacion,
  updateReparacion,
  deleteReparacion,
} from "../firebase/reparacionesService";

const ESTADOS = [
  { value: "recibido", label: "Recibido", color: "bg-secondary" },
  { value: "diagnosticado", label: "Diagnosticado", color: "bg-info text-dark" },
  { value: "en_reparacion", label: "En reparación", color: "bg-warning text-dark" },
  { value: "esperando_repuesto", label: "Esperando repuesto", color: "bg-danger" },
  { value: "listo", label: "Listo para entrega", color: "bg-primary" },
  { value: "entregado", label: "Entregado", color: "bg-success" },
  { value: "cancelado", label: "Cancelado", color: "bg-dark" },
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

  useEffect(() => {
    const u1 = subscribeToReparaciones(setReparaciones);
    const u2 = clientesService.subscribe(setClientes);
    const u3 = repuestosService.subscribe(setRepuestos);
    return () => {
      u1(); u2(); u3();
    };
  }, []);

  const handleEquipoChange = (e) =>
    setForm({ ...form, equipo: { ...form.equipo, [e.target.name]: e.target.value } });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const agregarRepuesto = () => {
    const rep = repuestos.find((r) => r.id === repSeleccionado);
    if (!rep || cantidadRep < 1) return;
    setRepuestosUsados([
      ...repuestosUsados,
      { itemId: rep.id, nombre: rep.nombre, cantidad: Number(cantidadRep) },
    ]);
    setRepSeleccionado("");
    setCantidadRep(1);
  };

  const quitarRepuesto = (idx) => {
    setRepuestosUsados(repuestosUsados.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cliente = clientes.find((c) => c.id === form.clienteId);
    const payload = {
      ...form,
      clienteNombre: cliente?.nombre || "",
      costoEstimado: Number(form.costoEstimado) || 0,
      repuestosUsados,
    };
    if (editId) {
      await updateReparacion(editId, payload);
    } else {
      await createReparacion(payload);
    }
    setForm(emptyForm);
    setRepuestosUsados([]);
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (r) => {
    setForm({ ...emptyForm, ...r });
    setRepuestosUsados(r.repuestosUsados || []);
    setEditId(r.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("¿Eliminar esta reparación?")) {
      await deleteReparacion(id);
    }
  };

  const filtered = reparaciones.filter(
    (r) => filtroEstado === "todos" || r.estado === filtroEstado
  );

  const estadoInfo = (estado) => ESTADOS.find((e) => e.value === estado) || ESTADOS[0];

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
            setShowForm(!showForm);
          }}
        >
          {showForm ? "Cerrar" : "+ Nueva reparación"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card-dark mb-4">
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <select
                className="form-select"
                name="clienteId"
                value={form.clienteId}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona un cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} — {c.telefono}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h6 className="text-muted-custom">Datos del equipo</h6>
          <div className="row g-3 mb-3">
            <div className="col-md-2">
              <select
                className="form-select"
                name="tipo"
                value={form.equipo.tipo}
                onChange={handleEquipoChange}
              >
                <option value="celular">Celular</option>
                <option value="laptop">Laptop</option>
                <option value="tablet">Tablet</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="col-md-3">
              <input
                className="form-control"
                name="marca"
                placeholder="Marca"
                value={form.equipo.marca}
                onChange={handleEquipoChange}
              />
            </div>
            <div className="col-md-3">
              <input
                className="form-control"
                name="modelo"
                placeholder="Modelo"
                value={form.equipo.modelo}
                onChange={handleEquipoChange}
              />
            </div>
            <div className="col-md-4">
              <input
                className="form-control"
                name="numeroSerie"
                placeholder="N° serie / IMEI (opcional)"
                value={form.equipo.numeroSerie}
                onChange={handleEquipoChange}
              />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <textarea
                className="form-control"
                name="problemaReportado"
                placeholder="Problema reportado por el cliente"
                value={form.problemaReportado}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <textarea
                className="form-control"
                name="diagnostico"
                placeholder="Diagnóstico técnico (opcional)"
                value={form.diagnostico}
                onChange={handleChange}
              />
            </div>
          </div>

          <h6 className="text-muted-custom">Repuestos a usar (opcional)</h6>
          <div className="row g-3 align-items-end mb-2">
            <div className="col-md-6">
              <select
                className="form-select"
                value={repSeleccionado}
                onChange={(e) => setRepSeleccionado(e.target.value)}
              >
                <option value="">Selecciona un repuesto</option>
                {repuestos.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre} — stock: {r.stock}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <input
                className="form-control"
                type="number"
                min="1"
                value={cantidadRep}
                onChange={(e) => setCantidadRep(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <button type="button" className="btn btn-outline-light w-100" onClick={agregarRepuesto}>
                Agregar
              </button>
            </div>
          </div>

          {repuestosUsados.length > 0 && (
            <ul className="list-unstyled mb-3">
              {repuestosUsados.map((r, idx) => (
                <li key={idx} className="d-flex justify-content-between align-items-center border-bottom py-1">
                  <span>{r.nombre} × {r.cantidad}</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => quitarRepuesto(idx)}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="row g-3 mb-3">
            <div className="col-md-3">
              <input
                className="form-control"
                name="costoEstimado"
                type="number"
                placeholder="Costo estimado"
                value={form.costoEstimado}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-9">
              <input
                className="form-control"
                name="notas"
                placeholder="Notas internas (opcional)"
                value={form.notas}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="alert alert-warning py-2 mb-3">
            Recuerda descontar manualmente el stock de los repuestos usados en Inventario → Repuestos.
          </div>

          <button className="btn btn-success">
            {editId ? "Guardar cambios" : "Registrar reparación"}
          </button>
        </form>
      )}

      <select
        className="form-select mb-3"
        style={{ maxWidth: 240 }}
        value={filtroEstado}
        onChange={(e) => setFiltroEstado(e.target.value)}
      >
        <option value="todos">Todos los estados</option>
        {ESTADOS.map((e) => (
          <option key={e.value} value={e.value}>
            {e.label}
          </option>
        ))}
      </select>

      <div className="card-dark p-0">
        <table className="table table-dark table-hover mb-0">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Equipo</th>
              <th>Problema</th>
              <th>Estado</th>
              <th>Costo est.</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.clienteNombre}</td>
                <td>
                  {r.equipo?.marca} {r.equipo?.modelo}
                  <br />
                  <small className="text-muted-custom">{r.equipo?.tipo}</small>
                </td>
                <td style={{ maxWidth: 200 }}>{r.problemaReportado}</td>
                <td>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 170 }}
                    value={r.estado}
                    onChange={(e) => updateReparacion(r.id, { estado: e.target.value })}
                  >
                    {ESTADOS.map((e) => (
                      <option key={e.value} value={e.value}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>$ {Number(r.costoEstimado || 0).toLocaleString("es-CO")}</td>
                <td className="text-end">
                  <button className="btn btn-sm btn-outline-light me-2" onClick={() => handleEdit(r)}>
                    Editar
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r.id)}>
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-muted-custom py-4">
                  No hay reparaciones que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}