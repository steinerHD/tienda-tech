import DashboardLayout from "../components/layout/DashboardLayout";
import InventoryTable from "../components/inventory/InventoryTable";
import { productosService } from "../firebase/inventoryService";

export default function Productos() {
  return (
    <DashboardLayout>
      <h3 className="mb-4">Productos</h3>
      <InventoryTable
        service={productosService}
        tipo="producto"
        extraFields={[{ name: "modelo", label: "Modelo" }]}
      />
    </DashboardLayout>
  );
}