import Modal from "./Modal";

export default function ImageModal({ show, onClose, imageUrl, nombre }) {
  return (
    <Modal show={show} onClose={onClose} title={nombre} maxWidth={480}>
      <img
        src={imageUrl}
        alt={nombre}
        style={{ width: "100%", borderRadius: "var(--radius-md)", display: "block" }}
      />
    </Modal>
  );
}