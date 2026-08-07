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
  runTransaction,
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

// Marca el pedido como entregado y descuenta el stock de cada ítem, todo en
// una sola transacción atómica para evitar doble descuento por carreras.
export async function confirmarEntregaPedido(pedido) {
  await runTransaction(db, async (transaction) => {
    const itemRefs = pedido.items.map((it) =>
      doc(db, it.tipo === "producto" ? "productos" : "repuestos", it.itemId)
    );

    const itemSnaps = [];
    for (const ref of itemRefs) {
      itemSnaps.push(await transaction.get(ref));
    }

    itemSnaps.forEach((snap, idx) => {
      if (snap.exists()) {
        const cantidad = pedido.items[idx].cantidad;
        const stockActual = snap.data().stock || 0;
        const nuevoStock = Math.max(0, stockActual - cantidad);
        transaction.update(itemRefs[idx], {
          stock: nuevoStock,
          actualizadoEn: serverTimestamp(),
        });
      }
      // Si el ítem ya no existe en inventario (fue borrado), se omite sin fallar
      // toda la transacción — el pedido igual se marca como entregado.
    });

    transaction.update(doc(db, "pedidos", pedido.id), {
      estado: "entregado",
      actualizadoEn: serverTimestamp(),
    });
  });
}