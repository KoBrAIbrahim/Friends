/* eslint-disable no-unused-vars */
import { Link, useLocation } from "react-router-dom";
import { Package, Plus, BarChart3, Sparkles } from "lucide-react";

export default function InventoryHeader() {
  const { pathname } = useLocation();

  const navItems = [
    { to: "/inventory", label: "قائمة المنتجات", icon: Package },
    { to: "/inventory/add", label: "إضافة منتج", icon: Plus },
    { to: "/inventory/stats", label: "إحصائيات", icon: BarChart3 }
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
          cursor: "pointer",
          letterSpacing: "0.15px"
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
        <IconComponent 
          style={{ 
            width: 16, 
            height: 16
          }} 
        />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div style={{
      backgroundColor: "#FFFFFF",
      borderBottom: "1px solid #E5E7EB",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
    }}>
      <div style={{ 
        padding: "1.5rem 2rem"
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          {/* Title section */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 1rem",
              backgroundColor: "#F9FAFB",
              borderRadius: "8px",
              border: "1px solid #E5E7EB",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                backgroundColor: "#A2AF9B",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Package style={{ 
                  color: "#ffffff", 
                  width: 20, 
                  height: 20
                }} />
              </div>
              
              <div>
                <h1 style={{ 
                  fontSize: "1.25rem", 
                  fontWeight: "600", 
                  margin: 0,
                  color: "#1F2937",
                  letterSpacing: "0.25px"
                }}>
                  إدارة المستودع
                </h1>
                <p style={{
                  fontSize: "0.875rem",
                  color: "#6B7280",
                  margin: 0,
                  fontWeight: "400"
                }}>
                  نظام متكامل لإدارة المخزون
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem",
            backgroundColor: "#F9FAFB",
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
          }}>
            {navItems.map(({ to, label, icon }) => navItem(to, label, icon))}
          </div>
        </div>
      </div>
    </div>
  );
}