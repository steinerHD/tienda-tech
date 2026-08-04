export default function DecorativeBackground() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="blob1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4f7cff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#4f7cff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="blob2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="88%" cy="12%" r="320" fill="url(#blob1)" />
        <circle cx="10%" cy="85%" r="380" fill="url(#blob2)" />
        <circle cx="55%" cy="50%" r="260" fill="url(#blob1)" opacity="0.5" />

        <g stroke="rgba(255,255,255,0.12)" strokeWidth="2" fill="none">
          <line x1="18%" y1="0" x2="18%" y2="22%" />
          <line x1="23%" y1="0" x2="23%" y2="15%" />
          <circle cx="85%" cy="80%" r="110" />
        </g>
      </svg>
    </div>
  );
}