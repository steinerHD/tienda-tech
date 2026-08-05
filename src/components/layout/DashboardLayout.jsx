import Sidebar from "./Sidebar";
import DecorativeBackground from "./DecorativeBackground";

export default function DashboardLayout({ children }) {
  return (
    <div className="position-relative" style={{ background: "var(--bg-app)", minHeight: "100vh" }}>
      <DecorativeBackground />
      <div className="d-flex position-relative" style={{ zIndex: 1 }}>
        <Sidebar />
        <div className="flex-grow-1 p-4">{children}</div>
      </div>
    </div>
  );
}