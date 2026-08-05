import DashboardLayout from "../components/layout/DashboardLayout";

const PASOS = [
  {
    icon: "bi-people",
    titulo: "1. Clientes",
    descripcion:
      "Registra aquí a las personas que compran productos o traen equipos a reparar. Todo pedido o reparación necesita un cliente ya existente, así que este es normalmente el primer paso.",
  },
  {
    icon: "bi-grid",
    titulo: "2. Inventario",
    descripcion:
      "Carga tus productos (para vender) y repuestos (para usar en reparaciones) por separado. Sin ítems cargados aquí, no vas a poder seleccionarlos al crear un pedido o una reparación.",
  },
  {
    icon: "bi-receipt",
    titulo: "3. Pedidos",
    descripcion:
      "Cuando un cliente compra uno o varios productos/repuestos, créalo aquí. Descuenta el stock manualmente en Inventario una vez confirmes la entrega — el sistema no lo hace automático.",
  },
  {
    icon: "bi-wrench-adjustable",
    titulo: "4. Reparaciones",
    descripcion:
      "Cuando un cliente trae un equipo a reparar, regístralo aquí con los datos del equipo y el problema reportado. Puedes asociar repuestos usados. Es un camino paralelo a Pedidos, no depende de él.",
  },
  {
    icon: "bi-cash-coin",
    titulo: "5. Caja",
    descripcion:
      "Abre la caja al iniciar el turno con el efectivo inicial. Registra cada ingreso (ventas, cobros) y egreso (compras, gastos) a medida que ocurren. Cierra la caja al final contando el efectivo físico — el sistema te dice si cuadra.",
  },
  {
    icon: "bi-chat-dots",
    titulo: "Chatbot (uso libre)",
    descripcion:
      "En cualquier momento puedes preguntarle por un producto o repuesto específico (ej: 'pantalla iPhone 12') y te dice si existe y cuánto stock tiene. No es parte del flujo, es una herramienta de consulta rápida.",
  },
];

export default function Ayuda() {
  return (
    <DashboardLayout>
      <h3 className="mb-1">Cómo funciona el sistema</h3>
      <p className="text-muted-custom mb-4">
        Guía rápida del orden recomendado para usar cada módulo.
      </p>

      <div className="d-flex flex-column gap-3">
        {PASOS.map((p) => (
          <div key={p.titulo} className="card-dark d-flex flex-row align-items-start gap-3">
            <span className="icon-circle" style={{ background: "var(--gradient-cta)", width: 44, height: 44 }}>
              <i className={`bi ${p.icon} fs-5 text-white`} />
            </span>
            <div>
              <h6 className="mb-1">{p.titulo}</h6>
              <p className="text-muted-custom mb-0">{p.descripcion}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card-dark mt-4">
        <h6 className="mb-2">
          <i className="bi bi-info-circle me-2" />
          Nota importante
        </h6>
        <p className="text-muted-custom mb-0">
          El sistema no descuenta stock automáticamente al crear un pedido o usar un repuesto
          en una reparación — esa actualización se hace manual en Inventario, a propósito, para
          mantener control humano sobre cada movimiento físico.
        </p>
      </div>
    </DashboardLayout>
  );
}