import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Modal from "../components/common/Modal";
import { clientesService } from "../firebase/inventoryService";
import { useToast } from "../context/ToastContext";

const emptyForm = { nombre: "", telefono: "", email: "", direccion: "", notas: "" };

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const unsub = clientesService.subscribe(setClientes);
    return unsub;
  }, []);

  const toast = useToast();

  const filtered = clientes.filter((c) =>
    [c.nombre, c.telefono, c.email]
      .filter(Boolean)
      .some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

  const telefonoDuplicado =
    form.telefono &&
    clientes.some((c) => c.telefono === form.telefono && c.id !== editId);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await clientesService.update(editId, form);
        toast.success("Actualizado", `${form.nombre} se guardó correctamente.`);
      } else {
        await clientesService.create(form);
        toast.success("Cliente creado", `${form.nombre} se agregó a la lista.`);
      }
      setForm(emptyForm);
      setEditId(null);
      setShowForm(false);
    } catch (err) {
      toast.error("Error", "No se pudo guardar el cliente.");
    }
  };

  const handleEdit = (c) => {
    setForm({ ...emptyForm, ...c });
    setEditId(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("¿Eliminar este cliente?")) {
      try {
        await clientesService.remove(id);
        toast.info("Eliminado", "El cliente fue eliminado.");
      } catch (err) {
        toast.error("Error", "No se pudo eliminar el cliente.");
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Clientes</h3>
        <button
          className="btn btn-primary"
          onClick={() => {
            setForm(emptyForm);
            setEditId(null);
            setShowForm(true);
          }}
        >
          + Agregar cliente
        </button>
      </div>

      <Modal
        show={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? "Editar cliente" : "Agregar cliente"}
      >
        <form onSubmit={handleSubmit}>
          {telefonoDuplicado && (
            <div className="alert alert-warning py-2">
              Ya existe un cliente con este teléfono. Revisa si es la misma persona antes de guardar.
            </div>
          )}
          <div className="row g-3">
            <div className="col-md-6">
              <input className="form-control" name="nombre" placeholder="Nombre completo" value={form.nombre} onChange={handleChange} required />
            </div>
            <div className="col-md-6">
              <input className="form-control" name="telefono" placeholder="Teléfono" value={form.telefono} onChange={handleChange} required />
            </div>
            <div className="col-md-6">
              <input className="form-control" name="email" type="email" placeholder="Correo (opcional)" value={form.email} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <input className="form-control" name="direccion" placeholder="Dirección (opcional)" value={form.direccion} onChange={handleChange} />
            </div>
            <div className="col-12">
              <input className="form-control" name="notas" placeholder="Notas (opcional)" value={form.notas} onChange={handleChange} />
            </div>
          </div>
          <button className="btn btn-success w-100 mt-4">{editId ? "Guardar cambios" : "Crear cliente"}</button>
        </form>
      </Modal>

      <input
        className="form-control mb-3"
        style={{ maxWidth: 320 }}
        placeholder="Buscar por nombre, teléfono o correo..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="card-dark p-0">
        <table className="table table-dark table-hover mb-0">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Dirección</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                <td>{c.telefono}</td>
                <td>{c.email || "-"}</td>
                <td>{c.direccion || "-"}</td>
                <td className="text-end">
                  <button className="btn btn-sm btn-outline-light me-2" onClick={() => handleEdit(c)}>
                    Editar
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c.id)}>
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted-custom py-4">
                  No hay clientes que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}