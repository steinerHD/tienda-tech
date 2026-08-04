import { useEffect, useState } from "react";
import Modal from "../common/Modal";
import ImageModal from "../common/ImageModal";
import { compressImage } from "../../utils/imageCompress";
import ImageDropzone from "../common/ImageDropzone";
import { useToast } from "../../context/ToastContext";

export default function InventoryTable({ service, tipo, extraFields }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [comprimiendo, setComprimiendo] = useState(false);
  const [verImagen, setVerImagen] = useState(null); // { url, nombre }

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
    imagenUrl: "",
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

  const handleImagenChange = async (file) => {
    setComprimiendo(true);
    try {
      const base64 = await compressImage(file);
      setForm((f) => ({ ...f, imagenUrl: base64 }));
      setImagenPreview(base64);
    } catch (err) {
      alert("No se pudo procesar la imagen. Intenta con otro archivo.");
    } finally {
      setComprimiendo(false);
    }
  };

  const toast = useToast();

  const quitarImagen = () => {
    setForm((f) => ({ ...f, imagenUrl: "" }));
    setImagenPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      costo: Number(form.costo) || 0,
      precioVenta: Number(form.precioVenta) || 0,
      stock: Number(form.stock) || 0,
      stockMinimo: Number(form.stockMinimo) || 0,
    };
    try {
      if (editId) {
        await service.update(editId, payload);
        toast.success("Actualizado", `${form.nombre} se guardó correctamente.`);
      } else {
        await service.create(payload);
        toast.success("Creado", `${form.nombre} se agregó al inventario.`);
      }
      setForm(baseForm);
      setImagenPreview(null);
      setEditId(null);
      setShowForm(false);
    } catch (err) {
      toast.error("Error", "No se pudo guardar. Intenta de nuevo.");
    }
  };

  const handleEdit = (item) => {
    setForm({ ...baseForm, ...item });
    setImagenPreview(item.imagenUrl || null);
    setEditId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm(`¿Eliminar este ${tipo}?`)) {
      try {
        await service.remove(id);
        toast.info("Eliminado", `El ${tipo} fue eliminado.`);
      } catch (err) {
        toast.error("Error", "No se pudo eliminar.");
      }
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
            setImagenPreview(null);
            setEditId(null);
            setShowForm(true);
          }}
        >
          + Agregar {tipo}
        </button>
      </div>

      <Modal
        show={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? `Editar ${tipo}` : `Agregar ${tipo}`}
        maxWidth={640}
      >
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <input className="form-control" name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required />
            </div>
            <div className="col-md-6">
              <input className="form-control" name="categoria" placeholder="Categoría" value={form.categoria} onChange={handleChange} required />
            </div>
            <div className="col-md-6">
              <input className="form-control" name="marca" placeholder="Marca" value={form.marca} onChange={handleChange} />
            </div>
            {extraFields.map((f) => (
              <div className="col-md-6" key={f.name}>
                <input
                  className="form-control"
                  name={f.name}
                  placeholder={f.label}
                  value={form[f.name] || ""}
                  onChange={handleChange}
                />
              </div>
            ))}
            <div className="col-md-3">
              <input className="form-control" name="costo" type="number" placeholder="Costo" value={form.costo} onChange={handleChange} />
            </div>
            <div className="col-md-3">
              <input className="form-control" name="precioVenta" type="number" placeholder="Precio venta" value={form.precioVenta} onChange={handleChange} />
            </div>
            <div className="col-md-3">
              <input className="form-control" name="stock" type="number" placeholder="Stock" value={form.stock} onChange={handleChange} required />
            </div>
            <div className="col-md-3">
              <input className="form-control" name="stockMinimo" type="number" placeholder="Stock mínimo" value={form.stockMinimo} onChange={handleChange} />
            </div>
            <div className="col-12">
              <textarea className="form-control" name="descripcion" placeholder="Descripción" value={form.descripcion} onChange={handleChange} />
            </div>

            <div className="col-12">
              <label className="text-muted-custom mb-1 d-block">Imagen (opcional)</label>
              <ImageDropzone
                onFileSelected={handleImagenChange}
                preview={imagenPreview}
                onRemove={quitarImagen}
                processing={comprimiendo}
              />
            </div>
          </div>
          <button className="btn btn-success w-100 mt-4">{editId ? "Guardar cambios" : "Crear"}</button>
        </form>
      </Modal>

      <ImageModal
        show={!!verImagen}
        onClose={() => setVerImagen(null)}
        imageUrl={verImagen?.url}
        nombre={verImagen?.nombre}
      />

      <div className="card-dark p-0">
        <table className="table table-dark table-hover mb-0">
          <thead>
            <tr>
              <th></th>
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
                <td>
                  {it.imagenUrl ? (
                    <img
                      src={it.imagenUrl}
                      alt={it.nombre}
                      style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.05)",
                      }}
                    />
                  )}
                </td>
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
                  {it.imagenUrl && (
                    <button
                      className="btn btn-sm btn-outline-info me-2"
                      onClick={() => setVerImagen({ url: it.imagenUrl, nombre: it.nombre })}
                    >
                      Ver estado
                    </button>
                  )}
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
                <td colSpan={6 + extraFields.length} className="text-center text-muted-custom py-4">
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