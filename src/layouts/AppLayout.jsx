import { useLocation } from "react-router-dom";
import Header from "../components/common/Header";
import BilliardsHeader from "../components/common/BilliardsHeader";
import InventoryHeader from "../components/common/InventoryHeader";
import OrdersHeader from "../components/common/OrdersHeader";

export default function AppLayout({ children }) {
  const { pathname } = useLocation();

  const showBilliardsHeader = pathname.startsWith("/billiards");
  const showInventoryHeader = pathname.startsWith("/inventory");
  const showOrdersHeader = pathname.startsWith("/orders");

  return (
    <div>
      {/* الهيدر العام */}
      <Header />

      {/* هيدرات خاصة حسب القسم */}
      {showBilliardsHeader && <BilliardsHeader />}
      {showInventoryHeader && <InventoryHeader />}
      {showOrdersHeader && <OrdersHeader />}

      {/* محتوى الصفحة */}
      <main style={{ padding: "2rem" }}>{children}</main>
    </div>
  );
}
