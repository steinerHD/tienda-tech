import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Modal from "../components/common/Modal";
import { useAuth } from "../context/AuthContext";
import CustomSelect from "../components/common/CustomSelect";
import {
  subscribeToCajaAbierta,
  abrirCaja,
  subscribeToMovimientos,
  registrarMovimiento,
  cerrarCaja,
  subscribeToHistorialCajas,
} from "../firebase/cajaService";

export default function Caja() {
  const { user } = useAuth();
  const [cajaAbierta, setCajaAbierta] = useState(undefined); // undefined = cargando
  const [movimientos, setMovimientos] = useState([]);
  const [historial, setHistorial] = useState([]);

  const [montoInicial, setMontoInicial] = useState("");
  const [errorApertura, setErrorApertura] = useState("");

  const [tipoMov, setTipoMov] = useState("ingreso");
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");

  const [showCierre, setShowCierre] = useState(false);
  const [montoContado, setMontoContado] = useState("");
  const [notasCierre, setNotasCierre] = useState("");

  useEffect(() => {
    const unsub = subscribeToCajaAbierta(setCajaAbierta);
    const unsubHist = subscribeToHistorialCajas(setHistorial);
    return () => {
      unsub();
      unsubHist();
    };
  }, []);

  useEffect(() => {
    if (!cajaAbierta) {
      setMovimientos([]);
      return;
    }
    const unsub = subscribeToMovimientos(cajaAbierta.id, setMovimientos);
    return unsub;
  }, [cajaAbierta?.id]);

  const handleAbrir = async (e) => {
    e.preventDefault();
    setErrorApertura("");
    try {
      await abrirCaja({ montoInicial, abiertoPor: user.email });
      setMontoInicial("");
    } catch (err) {
      setErrorApertura(err.message);
    }
  };

  const handleAgregarMovimiento = async (e) => {
    e.preventDefault();
    if (!concepto || !monto) return;
    await registrarMovimiento({
      cajaId: cajaAbierta.id,
      tipo: tipoMov,
      concepto,
      monto,
      metodoPago,
      registradoPor: user.email,
    });
    setConcepto("");
    setMonto("");
  };

  const totalIngresos = movimientos.filter((m) => m.tipo === "ingreso").reduce((a, m) => a + m.monto, 0);
  const totalEgresos = movimientos.filter((m) => m.tipo === "egreso").reduce((a, m) => a + m.monto, 0);
  const saldoEsperado = (cajaAbierta?.montoInicial || 0) + totalIngresos - totalEgresos;

  const handleCerrar = async (e) => {
    e.preventDefault();
    await cerrarCaja({
      cajaId: cajaAbierta.id,
      montoInicial: cajaAbierta.montoInicial,
      movimientos,
      montoFinalContado: montoContado,
      cerradoPor: user.email,
      notasCierre,
    });
    setShowCierre(false);
    setMontoContado("");
    setNotasCierre("");
  };

  if (cajaAbierta === undefined) {
    return (
      <DashboardLayout>
        <p className="text-muted-custom">Cargando...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <h3 className="mb-4">Caja registradora</h3>

      {!cajaAbierta && (
        <div className="card-dark" style={{ maxWidth: 420 }}>
          <h5 className="mb-3">Abrir caja</h5>
          {errorApertura && <div className="alert alert-danger py-2">{errorApertura}</div>}
          <form onSubmit={handleAbrir}>
            <label className="text-muted-custom mb-1 d-block">Monto inicial en efectivo</label>
            <input
              className="form-control mb-3"
              type="number"
              placeholder="Ej: 50000"
              value={montoInicial}
              onChange={(e) => setMontoInicial(e.target.value)}
              required
            />
            <button className="btn btn-primary w-100">Abrir caja</button>
          </form>
        </div>
      )}

      {cajaAbierta && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-6 col-lg-3">
              <div className="card-dark h-100">
                <span className="text-muted-custom">Monto inicial</span>
                <h4 className="mt-2">$ {cajaAbierta.montoInicial.toLocaleString("es-CO")}</h4>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="card-dark h-100">
                <span className="text-muted-custom">Ingresos</span>
                <h4 className="mt-2 text-success">$ {totalIngresos.toLocaleString("es-CO")}</h4>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="card-dark h-100">
                <span className="text-muted-custom">Egresos</span>
                <h4 className="mt-2 text-danger">$ {totalEgresos.toLocaleString("es-CO")}</h4>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="card-dark h-100">
                <span className="text-muted-custom">Saldo esperado</span>
                <h4 className="mt-2">$ {saldoEsperado.toLocaleString("es-CO")}</h4>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-muted-custom">Caja abierta por {cajaAbierta.abiertoPor}</span>
            <button className="btn btn-outline-danger" onClick={() => setShowCierre(true)}>
              Cerrar caja
            </button>
          </div>

          <Modal show={showCierre} onClose={() => setShowCierre(false)} title="Cerrar caja">
            <form onSubmit={handleCerrar}>
              <p className="text-muted-custom">
                Cuenta el efectivo físico y anota el total. El sistema calculará si hay diferencia contra
                lo esperado ($ {saldoEsperado.toLocaleString("es-CO")}).
              </p>
              <label className="text-muted-custom mb-1 d-block">Monto contado físicamente</label>
              <input
                className="form-control mb-3"
                type="number"
                value={montoContado}
                onChange={(e) => setMontoContado(e.target.value)}
                required
              />
              <label className="text-muted-custom mb-1 d-block">Notas (opcional)</label>
              <textarea
                className="form-control mb-3"
                value={notasCierre}
                onChange={(e) => setNotasCierre(e.target.value)}
                placeholder="Ej: faltaron $2000, posiblemente vuelto mal dado"
              />
              <button className="btn btn-primary w-100">Confirmar cierre</button>
            </form>
          </Modal>

          <div className="card-dark mb-4">
            <h5 className="mb-3">Registrar movimiento</h5>
            <form onSubmit={handleAgregarMovimiento} className="row g-3 align-items-end">
              <div className="col-md-2">
                <CustomSelect
                  value={tipoMov}
                  onChange={setTipoMov}
                  options={[
                    { value: "ingreso", label: "Ingreso" },
                    { value: "egreso", label: "Egreso" },
                  ]}
                />
              </div>
              <div className="col-md-4">
                <input
                  className="form-control"
                  placeholder="Concepto (ej: venta pantalla, compra insumos)"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-2">
                <input
                  className="form-control"
                  type="number"
                  placeholder="Monto"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-2">
                <CustomSelect
                  value={metodoPago}
                  onChange={setMetodoPago}
                  options={[
                    { value: "efectivo", label: "Efectivo" },
                    { value: "tarjeta", label: "Tarjeta" },
                    { value: "transferencia", label: "Transferencia" },
                  ]}
                />
              </div>
              <div className="col-md-2">
                <button className="btn btn-primary w-100">Agregar</button>
              </div>
            </form>
          </div>

          <div className="card-dark p-0">
            <table className="table table-dark table-hover mb-0">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Tipo</th>
                  <th>Método</th>
                  <th>Monto</th>
                  <th>Registrado por</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.id}>
                    <td>{m.concepto}</td>
                    <td>
                      <span className={`badge-pill ${m.tipo === "ingreso" ? "bg-success" : "bg-danger"}`}>
                        {m.tipo}
                      </span>
                    </td>
                    <td>{m.metodoPago}</td>
                    <td className={m.tipo === "ingreso" ? "text-success" : "text-danger"}>
                      {m.tipo === "ingreso" ? "+" : "-"}$ {m.monto.toLocaleString("es-CO")}
                    </td>
                    <td>{m.registradoPor}</td>
                  </tr>
                ))}
                {movimientos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted-custom py-4">
                      Sin movimientos todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {historial.length > 0 && (
        <div className="card-dark p-0 mt-4">
          <div className="p-3">
            <h5 className="mb-0">Historial de cajas cerradas</h5>
          </div>
          <table className="table table-dark table-hover mb-0">
            <thead>
              <tr>
                <th>Fecha cierre</th>
                <th>Monto inicial</th>
                <th>Calculado</th>
                <th>Contado</th>
                <th>Diferencia</th>
                <th>Cerrado por</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((c) => (
                <tr key={c.id}>
                  <td>{c.fechaCierre?.toDate?.().toLocaleString("es-CO") || "-"}</td>
                  <td>$ {c.montoInicial?.toLocaleString("es-CO")}</td>
                  <td>$ {c.montoFinalCalculado?.toLocaleString("es-CO")}</td>
                  <td>$ {c.montoFinalContado?.toLocaleString("es-CO")}</td>
                  <td className={c.diferencia === 0 ? "text-success" : c.diferencia > 0 ? "text-info" : "text-danger"}>
                    {c.diferencia > 0 ? "+" : ""}$ {c.diferencia?.toLocaleString("es-CO")}
                  </td>
                  <td>{c.cerradoPor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}