import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

const cajasRef = collection(db, "cajas");
const movimientosRef = collection(db, "movimientosCaja");

export function subscribeToCajaAbierta(callback) {
  const q = query(cajasRef, where("estado", "==", "abierta"), limit(1));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback(null);
      } else {
        const d = snapshot.docs[0];
        callback({ id: d.id, ...d.data() });
      }
    },
    (error) => {
      console.error("Error escuchando caja abierta:", error);
    }
  );
}

export async function abrirCaja({ montoInicial, abiertoPor }) {
  const existentes = await getDocs(query(cajasRef, where("estado", "==", "abierta"), limit(1)));
  if (!existentes.empty) {
    throw new Error("Ya hay una caja abierta. Ciérrala antes de abrir otra.");
  }
  return addDoc(cajasRef, {
    montoInicial: Number(montoInicial) || 0,
    estado: "abierta",
    abiertoPor,
    fechaApertura: serverTimestamp(),
  });
}

export function subscribeToMovimientos(cajaId, callback) {
  const q = query(movimientosRef, where("cajaId", "==", cajaId), orderBy("creadoEn", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (error) => {
      console.error("Error escuchando movimientos de caja:", error);
      console.error("Si el error dice 'requires an index', haz clic en el link que trae el error para crearlo en Firebase.");
    }
  );
}

export async function registrarMovimiento({ cajaId, tipo, concepto, monto, metodoPago, registradoPor }) {
  return addDoc(movimientosRef, {
    cajaId,
    tipo,
    concepto,
    monto: Number(monto) || 0,
    metodoPago,
    registradoPor,
    creadoEn: serverTimestamp(),
  });
}

export async function cerrarCaja({ cajaId, montoInicial, movimientos, montoFinalContado, cerradoPor, notasCierre }) {
  const totalIngresos = movimientos
    .filter((m) => m.tipo === "ingreso")
    .reduce((acc, m) => acc + m.monto, 0);
  const totalEgresos = movimientos
    .filter((m) => m.tipo === "egreso")
    .reduce((acc, m) => acc + m.monto, 0);

  const montoFinalCalculado = montoInicial + totalIngresos - totalEgresos;
  const diferencia = Number(montoFinalContado) - montoFinalCalculado;

  return updateDoc(doc(db, "cajas", cajaId), {
    estado: "cerrada",
    montoFinalContado: Number(montoFinalContado) || 0,
    montoFinalCalculado,
    diferencia,
    cerradoPor,
    notasCierre: notasCierre || "",
    fechaCierre: serverTimestamp(),
  });
}

export function subscribeToHistorialCajas(callback) {
  const q = query(cajasRef, where("estado", "==", "cerrada"), orderBy("fechaCierre", "desc"), limit(30));
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (error) => {
      console.error("Error escuchando historial de cajas:", error);
    }
  );
}