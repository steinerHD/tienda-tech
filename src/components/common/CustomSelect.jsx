import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export default function CustomSelect({ label, value, onChange, options, placeholder = "Selecciona..." }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  const updateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  };

  const handleToggle = () => {
    if (!open) updateCoords();
    setOpen(!open);
  };

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        panelRef.current &&
        !panelRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleScrollOrResize = () => updateCoords();

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open]);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div className="custom-select">
      {label && <label className="custom-select-label">{label}</label>}
      <button
        type="button"
        ref={triggerRef}
        className={`custom-select-trigger ${open ? "open" : ""}`}
        onClick={handleToggle}
      >
        <span className={selected ? "" : "text-muted-custom"}>
          {selected ? selected.label : placeholder}
        </span>
        <i className={`bi bi-chevron-down custom-select-chevron ${open ? "rotated" : ""}`} />
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            className="custom-select-panel"
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
              minWidth: coords.width,
            }}
          >
            {options.map((opt) => (
              <div
                key={opt.value}
                className={`custom-select-option ${opt.value === value ? "selected" : ""}`}
                onClick={() => handleSelect(opt.value)}
              >
                <span>{opt.label}</span>
                {opt.value === value && <i className="bi bi-check-lg" />}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}