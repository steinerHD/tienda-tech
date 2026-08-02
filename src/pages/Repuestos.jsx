import DashboardLayout from "../components/layout/DashboardLayout";
import InventoryTable from "../components/inventory/InventoryTable";
import { repuestosService } from "../firebase/inventoryService";

export default function Repuestos() {
  return (
    <DashboardLayout>
      <h3 className="mb-4">Repuestos</h3>
      <InventoryTable
        service={repuestosService}
        tipo="repuesto"
        extraFields={[
          { name: "modeloCompatible", label: "Modelo compatible" },
          { name: "ubicacion", label: "Ubicación" },
        ]}
      />
    </DashboardLayout>
  );
}