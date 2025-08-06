/* eslint-disable no-unused-vars */
import { Link, useLocation } from "react-router-dom";
import { ListOrdered, BarChart3, Users } from "lucide-react";

export default function OrdersHeader() {
  const { pathname } = useLocation();

  const navItems = [
    { to: "/orders", label: "الطلبات", icon: ListOrdered },
    { to: "/orders/stats", label: "إحصائيات", icon: BarChart3 }
  ];

  const navItem = (to, label, IconComponent) => {
    const isActive = pathname === to;

    return (
      <Link
        key={to}
        to={to}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginLeft: "0.75rem",
          padding: "0.75rem 1rem",
          borderRadius: "6px",
          backgroundColor: isActive ? "#A2AF9B" : "#F9FAFB",
          color: isActive ? "#ffffff" : "#374151",
          textDecoration: "none",
          fontWeight: isActive ? "600" : "500",
          fontSize: "0.875rem",
          border: `1px solid ${isActive ? '#A2AF9B' : '#E5E7EB'}`,
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          transition: "all 0.2s ease",
          cursor: "pointer"
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.target.style.backgroundColor = "#F3F4F6";
            e.target.style.borderColor = "#A2AF9B";
            e.target.style.color = "#1F2937";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.target.style.backgroundColor = "#F9FAFB";
            e.target.style.borderColor = "#E5E7EB";
            e.target.style.color = "#374151";
          }
        }}
      >
        <IconComponent style={{ width: 16, height: 16 }} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div style={{
      backgroundColor: "#FFFFFF",
      borderBottom: "1px solid #E5E7EB",
      padding: "1.5rem 2rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{
          width: 40,
          height: 40,
          backgroundColor: "#A2AF9B",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Users style={{ color: "white", width: 20, height: 20 }} />
        </div>
        <div>
          <h1 style={{ 
            fontSize: "1.25rem", 
            fontWeight: "600", 
            margin: 0,
            color: "#1F2937"
          }}>
            إدارة الطلبات
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: "0.875rem", 
            color: "#6B7280",
            fontWeight: "400"
          }}>
            سجل الطلبات مع الفئات أو الأفراد
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        {navItems.map(({ to, label, icon }) => navItem(to, label, icon))}
      </div>
    </div>
  );
}