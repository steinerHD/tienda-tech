import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

const pedidosRef = collection(db, "pedidos");

export function subscribeToPedidos(callback) {
  const q = query(pedidosRef, orderBy("creadoEn", "desc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function createPedido({ clienteId, clienteNombre, items }) {
  const total = items.reduce((acc, it) => acc + it.precioUnitario * it.cantidad, 0);
  return addDoc(pedidosRef, {
    clienteId,
    clienteNombre,
    items,
    total,
    estado: "nuevo",
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });
}

export async function updatePedidoEstado(id, estado) {
  return updateDoc(doc(db, "pedidos", id), {
    estado,
    actualizadoEn: serverTimestamp(),
  });
}

export async function deletePedido(id) {
  return deleteDoc(doc(db, "pedidos", id));
}