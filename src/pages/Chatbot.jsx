import { useEffect, useRef, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { productosService, repuestosService } from "../firebase/inventoryService";
import { extractKeywords, searchItems } from "../utils/chatSearch";

export default function Chatbot() {
  const [productos, setProductos] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hola, pregúntame por un producto o repuesto (ej: 'pantalla iPhone 12', 'batería Samsung'). Busco por nombre, categoría, marca o modelo.",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    const unsub1 = productosService.subscribe(setProductos);
    const unsub2 = repuestosService.subscribe(setRepuestos);
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { from: "user", text: input };
    const keywords = extractKeywords(input);

    const resultadosProductos = searchItems(keywords, productos).map((it) => ({
      ...it,
      tipo: "producto",
    }));
    const resultadosRepuestos = searchItems(keywords, repuestos).map((it) => ({
      ...it,
      tipo: "repuesto",
    }));
    const resultados = [...resultadosProductos, ...resultadosRepuestos];

    let botMsg;
    if (keywords.length === 0) {
      botMsg = {
        from: "bot",
        text: "Dame más detalle: por ejemplo el nombre, categoría o modelo de lo que buscas.",
      };
    } else if (resultados.length === 0) {
      botMsg = {
        from: "bot",
        text: `No encontré nada relacionado con "${keywords.join(", ")}" en productos ni repuestos.`,
      };
    } else {
      botMsg = { from: "bot", results: resultados };
    }

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  };

  return (
    <DashboardLayout>
      <h3 className="mb-4">Consultar inventario</h3>

      <div className="card-dark d-flex flex-column" style={{ height: "60vh" }}>
        <div className="flex-grow-1 overflow-auto d-flex flex-column gap-3 pe-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`d-flex ${m.from === "user" ? "justify-content-end" : "justify-content-start"}`}
            >
              <div
                style={{ maxWidth: "75%" }}
                className={`p-3 rounded-4 ${
                  m.from === "user" ? "bg-primary text-white" : "bg-body-secondary text-dark"
                }`}
              >
                {m.text && <p className="mb-0">{m.text}</p>}
                {m.results && (
                  <div className="d-flex flex-column gap-2">
                    <p className="mb-1 fw-bold">
                      Encontré {m.results.length} resultado(s):
                    </p>
                    {m.results.map((it) => (
                      <div key={it.id} className="border rounded-3 p-2">
                        <div className="d-flex justify-content-between">
                          <strong>{it.nombre}</strong>
                          <span
                            className={`badge-pill ${
                              it.tipo === "repuesto" ? "bg-warning text-dark" : "bg-info text-dark"
                            }`}
                          >
                            {it.tipo}
                          </span>
                        </div>
                        <small className="d-block">
                          Categoría: {it.categoria || "-"} · Marca: {it.marca || "-"}
                        </small>
                        {(it.modeloCompatible || it.modelo) && (
                          <small className="d-block">
                            Modelo: {it.modeloCompatible || it.modelo}
                          </small>
                        )}
                        <small
                          className={`d-block fw-bold ${
                            it.stock <= it.stockMinimo ? "text-danger" : "text-success"
                          }`}
                        >
                          Stock: {it.stock}
                        </small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        <form onSubmit={handleSend} className="d-flex gap-2 mt-3">
          <input
            className="form-control"
            placeholder="Ej: pantalla iPhone 12"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="btn btn-primary">Enviar</button>
        </form>
      </div>
    </DashboardLayout>
  );
}