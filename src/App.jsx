import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// هيدر وواجهة رئيسية
import LoginPage from "./pages/auth/LoginPage.jsx";
import MainPage from "./pages/MainPage.jsx";
import AppLayout from "./layouts/AppLayout";

// صفحات البلياردو
import BilliardsMainPage from "./pages/billiards/BilliardsMainPage.jsx";
import EditOrdersPage from "./pages/billiards/EditOrdersPage.jsx";
import EditTablePage from "./pages/billiards/EditTablePage.jsx";
import BilliardsStatsPage from "./pages/billiards/BilliardsStatsPage.jsx";

// صفحات الطلبات
import OrdersPage from "./pages/orders/OrdersMainPage.jsx";
import OrdersStatsPage from "./pages/orders/OrdersStatsPage.jsx"; // يمكنك إنشاؤها لاحقاً
import OrderSessionDetailsPage from "./pages/orders/OrderSessionDetailsPage.jsx";

// صفحات المستودع
import InventoryMainPage from "./pages/inventory/InventoryMainPage.jsx";
import AddProductPage from "./pages/inventory/AddProductPage.jsx";
import InventoryStatsPage from "./pages/inventory/InventoryStatsPage.jsx";

// صفحات البطولات
import TournamentsMainPage from "./pages/tournaments/TournamentsMainPage.jsx";
import BracketPage from "./pages/tournaments/BracketPage.jsx";
import DrawPage from "./pages/tournaments/DrawPage.jsx";
import TournamentDetailsPage from "./pages/tournaments/TournamentDetailsPage.jsx";

import ExpensesMainPage from "./pages/expenses/ExpensesMainPage.jsx"; // استيراد صفحة المصاريف
function App() {
  return (
    <Router>
      <Routes>
        {/* صفحة الدخول (خارج AppLayout) */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* صفحات داخل AppLayout مع الهيدرات المناسبة */}
        <Route path="/home" element={<AppLayout><MainPage /></AppLayout>} />

        {/* بلياردو */}
        <Route path="/billiards" element={<AppLayout><BilliardsMainPage /></AppLayout>} />
        <Route path="/billiards/edit-orders" element={<AppLayout><EditOrdersPage /></AppLayout>} />
        <Route path="/billiards/edit-table" element={<AppLayout><EditTablePage /></AppLayout>} />
        <Route path="/billiards/stats" element={<AppLayout><BilliardsStatsPage /></AppLayout>} />

        {/* الطلبات */}
        <Route path="/orders" element={<AppLayout><OrdersPage /></AppLayout>} />
        <Route path="/orders/stats" element={<AppLayout><OrdersStatsPage /></AppLayout>} />
        <Route path="/orders/session/:sessionId" element={<AppLayout><OrderSessionDetailsPage /></AppLayout>} />

        {/* المستودع */}
        <Route path="/inventory" element={<AppLayout><InventoryMainPage /></AppLayout>} />
        <Route path="/inventory/add" element={<AppLayout><AddProductPage /></AppLayout>} />
        <Route path="/inventory/stats" element={<AppLayout><InventoryStatsPage /></AppLayout>} />

        {/* البطولات */}
        <Route path="/tournaments" element={<AppLayout><TournamentsMainPage /></AppLayout>} />
        <Route path="/tournaments/bracket" element={<AppLayout><BracketPage /></AppLayout>} />
        <Route path="/tournaments/draw" element={<AppLayout><DrawPage /></AppLayout>} /> 
        <Route path="/tournaments/:id" element={<AppLayout><TournamentDetailsPage /></AppLayout>} />

        {/* صفحة المصاريف */}
        <Route path="/expenses" element={<AppLayout><ExpensesMainPage /></AppLayout>} />
      </Routes>
    </Router>
  );
}

export default App;
