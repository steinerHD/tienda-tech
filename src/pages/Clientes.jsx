import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { clientesService } from "../firebase/inventoryService";

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
    if (editId) {
      await clientesService.update(editId, form);
    } else {
      await clientesService.create(form);
    }
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (c) => {
    setForm({ ...emptyForm, ...c });
    setEditId(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("¿Eliminar este cliente?")) {
      await clientesService.remove(id);
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
            setShowForm(!showForm);
          }}
        >
          {showForm ? "Cerrar" : "+ Agregar cliente"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card-dark mb-4">
          {telefonoDuplicado && (
            <div className="alert alert-warning py-2">
              Ya existe un cliente con este teléfono. Revisa si es la misma persona antes de guardar.
            </div>
          )}
          <div className="row g-3">
            <div className="col-md-4">
              <input
                className="form-control"
                name="nombre"
                placeholder="Nombre completo"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-4">
              <input
                className="form-control"
                name="telefono"
                placeholder="Teléfono"
                value={form.telefono}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-4">
              <input
                className="form-control"
                name="email"
                type="email"
                placeholder="Correo (opcional)"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6">
              <input
                className="form-control"
                name="direccion"
                placeholder="Dirección (opcional)"
                value={form.direccion}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6">
              <input
                className="form-control"
                name="notas"
                placeholder="Notas (opcional)"
                value={form.notas}
                onChange={handleChange}
              />
            </div>
          </div>
          <button className="btn btn-success mt-3">
            {editId ? "Guardar cambios" : "Crear cliente"}
          </button>
        </form>
      )}

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