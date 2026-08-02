import { useEffect, useState } from "react";

export default function InventoryTable({
  service,
  tipo, // "producto" | "repuesto"
  extraFields, // array de { name, label, type }
}) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const baseForm = {
    nombre: "",
    categoria: "",
    marca: "",
    costo: "",
    precioVenta: "",
    stock: "",
    stockMinimo: "",
    descripcion: "",
    proveedor: "",
    ...Object.fromEntries(extraFields.map((f) => [f.name, ""])),
  };
  const [form, setForm] = useState(baseForm);

  useEffect(() => {
    const unsub = service.subscribe(setItems);
    return unsub;
  }, [service]);

  const filtered = items.filter((it) =>
    [it.nombre, it.categoria, it.marca, ...extraFields.map((f) => it[f.name])]
      .filter(Boolean)
      .some((v) => v.toString().toLowerCase().includes(search.toLowerCase()))
  );

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      costo: Number(form.costo) || 0,
      precioVenta: Number(form.precioVenta) || 0,
      stock: Number(form.stock) || 0,
      stockMinimo: Number(form.stockMinimo) || 0,
    };
    if (editId) {
      await service.update(editId, payload);
    } else {
      await service.create(payload);
    }
    setForm(baseForm);
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (item) => {
    setForm({ ...baseForm, ...item });
    setEditId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm(`¿Eliminar este ${tipo}?`)) {
      await service.remove(id);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <input
          className="form-control"
          style={{ maxWidth: 320 }}
          placeholder={`Buscar ${tipo}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="btn btn-primary"
          onClick={() => {
            setForm(baseForm);
            setEditId(null);
            setShowForm(!showForm);
          }}
        >
          {showForm ? "Cerrar" : `+ Agregar ${tipo}`}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card-dark mb-4">
          <div className="row g-3">
            <div className="col-md-4">
              <input className="form-control" name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required />
            </div>
            <div className="col-md-4">
              <input className="form-control" name="categoria" placeholder="Categoría" value={form.categoria} onChange={handleChange} required />
            </div>
            <div className="col-md-4">
              <input className="form-control" name="marca" placeholder="Marca" value={form.marca} onChange={handleChange} />
            </div>
            {extraFields.map((f) => (
              <div className="col-md-4" key={f.name}>
                <input
                  className="form-control"
                  name={f.name}
                  placeholder={f.label}
                  value={form[f.name] || ""}
                  onChange={handleChange}
                />
              </div>
            ))}
            <div className="col-md-2">
              <input className="form-control" name="costo" type="number" placeholder="Costo" value={form.costo} onChange={handleChange} />
            </div>
            <div className="col-md-2">
              <input className="form-control" name="precioVenta" type="number" placeholder="Precio venta (opcional)" value={form.precioVenta} onChange={handleChange} />
            </div>
            <div className="col-md-2">
              <input className="form-control" name="stock" type="number" placeholder="Stock" value={form.stock} onChange={handleChange} required />
            </div>
            <div className="col-md-2">
              <input className="form-control" name="stockMinimo" type="number" placeholder="Stock mínimo" value={form.stockMinimo} onChange={handleChange} />
            </div>
            <div className="col-12">
              <textarea className="form-control" name="descripcion" placeholder="Descripción" value={form.descripcion} onChange={handleChange} />
            </div>
          </div>
          <button className="btn btn-success mt-3">{editId ? "Guardar cambios" : "Crear"}</button>
        </form>
      )}

      <div className="card-dark p-0">
        <table className="table table-dark table-hover mb-0">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Marca</th>
              {extraFields.map((f) => (
                <th key={f.name}>{f.label}</th>
              ))}
              <th>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((it) => (
              <tr key={it.id}>
                <td>{it.nombre}</td>
                <td>{it.categoria}</td>
                <td>{it.marca}</td>
                {extraFields.map((f) => (
                  <td key={f.name}>{it[f.name]}</td>
                ))}
                <td>
                  {it.stock <= it.stockMinimo ? (
                    <span className="text-danger fw-bold">{it.stock}</span>
                  ) : (
                    it.stock
                  )}
                </td>
                <td className="text-end">
                  <button className="btn btn-sm btn-outline-light me-2" onClick={() => handleEdit(it)}>
                    Editar
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(it.id)}>
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5 + extraFields.length} className="text-center text-muted-custom py-4">
                  No hay resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}