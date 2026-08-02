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

export function createInventoryService(collectionName) {
  const ref = collection(db, collectionName);

  return {
    subscribe(callback) {
      const q = query(ref, orderBy("creadoEn", "desc"));
      return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
    },
    async create(data) {
      return addDoc(ref, {
        ...data,
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp(),
      });
    },
    async update(id, data) {
      return updateDoc(doc(db, collectionName, id), {
        ...data,
        actualizadoEn: serverTimestamp(),
      });
    },
    async remove(id) {
      return deleteDoc(doc(db, collectionName, id));
    },
  };
}

export const productosService = createInventoryService("productos");
export const repuestosService = createInventoryService("repuestos");
export const clientesService = createInventoryService("clientes");