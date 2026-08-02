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