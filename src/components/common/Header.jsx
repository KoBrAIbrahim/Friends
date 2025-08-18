import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase"; 

export default function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login", { replace: true }); // ✅ يمنع الرجوع للخلف
    } catch (error) {
      console.error("فشل تسجيل الخروج:", error);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <header
        style={{
          backgroundColor: "#FFFFFF",
          padding: "1.5rem 2rem",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          borderBottom: "1px solid #E5E7EB",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexDirection: "row-reverse",
          position: "relative",
          zIndex: 100
        }}
      >
        {/* Menu Button */}
        <button
          onClick={() => setOpen(!open)}
          style={{
            backgroundColor: open ? "#A2AF9B" : "#F9FAFB",
            border: "1px solid #D1D5DB",
            borderRadius: "6px",
            padding: "0.75rem",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
          }}
          onMouseEnter={(e) => {
            if (!open) {
              e.target.style.backgroundColor = "#F3F4F6";
              e.target.style.borderColor = "#A2AF9B";
            }
          }}
          onMouseLeave={(e) => {
            if (!open) {
              e.target.style.backgroundColor = "#F9FAFB";
              e.target.style.borderColor = "#D1D5DB";
            }
          }}
        >
          {open ? (
            <span style={{ fontSize: "20px", color: "#FFFFFF", fontWeight: "bold" }}>✕</span>
          ) : (
            <span style={{ fontSize: "20px", color: "#374151", fontWeight: "bold" }}>☰</span>
          )}
        </button>

        {/* Logo/Title */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem"
        }}>
          {/* Coffee Icon */}
          <div style={{
            fontSize: "1.75rem"
          }}>
            ☕
          </div>
          
          {/* Cafe Name */}
          <div style={{ textAlign: "right" }}>
            <h1 style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: "#1F2937",
              margin: 0,
              letterSpacing: "0.25px"
            }}>
              Friends Cafe
            </h1>
            <p style={{
              fontSize: "0.75rem",
              color: "#6B7280",
              margin: 0,
              fontWeight: "400"
            }}>
              نظام إدارة متقدم
            </p>
          </div>
        </div>
      </header>

      {/* Dropdown Menu */}
      {open && (
        <>
          {/* Backdrop */}
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.25)",
              zIndex: 90
            }}
            onClick={() => setOpen(false)}
          />
          
          {/* Menu Container */}
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: "2rem",
              marginTop: "8px",
              backgroundColor: "#FFFFFF",
              borderRadius: "8px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              border: "1px solid #E5E7EB",
              padding: "1rem",
              width: "260px",
              zIndex: 150
            }}
          >
            {/* Menu Header */}
            <div style={{
              textAlign: "center",
              marginBottom: "1rem",
              paddingBottom: "1rem",
              borderBottom: "1px solid #E5E7EB"
            }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}></div>
              <h3 style={{
                margin: 0,
                color: "#1F2937",
                fontSize: "1rem",
                fontWeight: "600"
              }}>
                القائمة الرئيسية
              </h3>
            </div>

            {/* Menu Items */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem"
            }}>
              {[
                { to: "/home", icon: "🏠", label: "الرئيسية" },
                { to: "/billiards", icon: "🎱", label: "بلياردو" },
                { to: "/orders", icon: "🧾", label: "الطلبات" },
                { to: "/inventory", icon: "📦", label: "المستودع" },
                { to: "/tournaments", icon: "🏆", label: "البطولات" },
                { to: "/expenses", icon: "💸", label: "المصاريف" },
                { to: "/sessions", icon: "📊", label: "إدارة الجلسات" }
              ].map((item) => (
                <button 
                  key={item.to}
                  onClick={() => handleNavigation(item.to)}
                  style={{
                    color: "#374151",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    padding: "0.75rem 1rem",
                    borderRadius: "6px",
                    backgroundColor: "#F9FAFB",
                    border: "1px solid transparent",
                    width: "100%",
                    textAlign: "right"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#F3F4F6";
                    e.target.style.borderColor = "#A2AF9B";
                    e.target.style.color = "#1F2937";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#F9FAFB";
                    e.target.style.borderColor = "transparent";
                    e.target.style.color = "#374151";
                  }}
                >
                  <span style={{ 
                    fontSize: "1.1rem", 
                    marginLeft: "0.75rem"
                  }}>
                    {item.icon}
                  </span>
                  <span style={{ fontWeight: "500", fontSize: "0.875rem" }}>
                    {item.label}
                  </span>
                  <span style={{ 
                    marginRight: "auto", 
                    opacity: 0.4,
                    fontSize: "0.875rem"
                  }}>
                    ←
                  </span>
                </button>
              ))}

              {/* Separator */}
              <div style={{
                height: "1px",
                backgroundColor: "#E5E7EB",
                margin: "0.75rem 0"
              }}></div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                style={{
                  color: "#DC2626",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "0.75rem 1rem",
                  borderRadius: "6px",
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  width: "100%",
                  textAlign: "right"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#FEE2E2";
                  e.target.style.borderColor = "#FCA5A5";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#FEF2F2";
                  e.target.style.borderColor = "#FECACA";
                }}
              >
                <span style={{ 
                  fontSize: "1.1rem", 
                  marginLeft: "0.75rem"
                }}>
                  🚪
                </span>
                <span style={{ fontWeight: "500", fontSize: "0.875rem" }}>
                  تسجيل الخروج
                </span>
                <span style={{ 
                  marginRight: "auto", 
                  opacity: 0.4,
                  fontSize: "0.875rem"
                }}>
                  ←
                </span>
              </button>
            </div>

            {/* Footer */}
            <div style={{
              textAlign: "center",
              marginTop: "1rem",
              paddingTop: "1rem",
              borderTop: "1px solid #E5E7EB"
            }}>
              <p style={{
                margin: 0,
                fontSize: "0.75rem",
                color: "#6B7280"
              }}>
                Friends Cafe Management
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}