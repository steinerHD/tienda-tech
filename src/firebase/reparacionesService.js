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

const reparacionesRef = collection(db, "reparaciones");

export function subscribeToReparaciones(callback) {
  const q = query(reparacionesRef, orderBy("creadoEn", "desc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function createReparacion(data) {
  return addDoc(reparacionesRef, {
    ...data,
    estado: "recibido",
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });
}

export async function updateReparacion(id, data) {
  return updateDoc(doc(db, "reparaciones", id), {
    ...data,
    actualizadoEn: serverTimestamp(),
  });
}

export async function deleteReparacion(id) {
  return deleteDoc(doc(db, "reparaciones", id));
}

// Marca la reparación como entregada y descuenta el stock de los repuestos
// usados, en una sola transacción atómica.
export async function confirmarEntregaReparacion(reparacion) {
  const repuestosUsados = reparacion.repuestosUsados || [];

  await runTransaction(db, async (transaction) => {
    const itemRefs = repuestosUsados.map((r) => doc(db, "repuestos", r.itemId));

    const itemSnaps = [];
    for (const ref of itemRefs) {
      itemSnaps.push(await transaction.get(ref));
    }

    itemSnaps.forEach((snap, idx) => {
      if (snap.exists()) {
        const cantidad = repuestosUsados[idx].cantidad;
        const stockActual = snap.data().stock || 0;
        const nuevoStock = Math.max(0, stockActual - cantidad);
        transaction.update(itemRefs[idx], {
          stock: nuevoStock,
          actualizadoEn: serverTimestamp(),
        });
      }
    });

    transaction.update(doc(db, "reparaciones", reparacion.id), {
      estado: "entregado",
      actualizadoEn: serverTimestamp(),
    });
  });
}