import { useState, useRef } from "react";

export default function ImageDropzone({ onFileSelected, preview, onRemove, processing }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
  };

  if (preview && !processing) {
    return (
      <div className="dropzone-preview">
        <img src={preview} alt="preview" />
        <div className="dropzone-preview-actions">
          <button type="button" className="btn btn-sm btn-outline-light" onClick={() => inputRef.current.click()}>
            Cambiar
          </button>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRemove}>
            Quitar
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleInputChange}
        />
      </div>
    );
  }

  return (
    <div
      className={`dropzone ${dragOver ? "dropzone-active" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !processing && inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleInputChange}
      />

      {processing ? (
        <span className="text-muted-custom">Procesando imagen...</span>
      ) : (
        <>
          <i className="bi bi-cloud-arrow-up dropzone-icon" />
          <p className="mb-1">
            Arrastra tu imagen o <span className="dropzone-browse">Buscar</span>
          </p>
          <small className="text-muted-custom">Formatos: JPG, PNG · Máximo 10MB</small>
        </>
      )}
    </div>
  );
}