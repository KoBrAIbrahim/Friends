import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom"

/**
 * رأس صفحة البلياردو
 * تم إصلاح مشكلة JSX attribute
 */

const tabs = [
  { label: "الرئيسية", path: "/billiards", icon: "🎱", shortLabel: "الرئيسية" },
  { label: "تعديل الطلبات", path: "/billiards/edit-orders", icon: "🧾", shortLabel: "الطلبات" },
  { label: "الطاولات", path: "/billiards/edit-table", icon: "🎵", shortLabel: "الطاولات" },
  { label: "الإحصائيات", path: "/billiards/stats", icon: "📊", shortLabel: "الإحصائيات" },
];

export default function BilliardsSubHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname;
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Check if mobile and handle scroll effect
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleTabClick = (path) => {
    navigate(path); // ✅ هنا التوجيه الحقيقي
  };

  return (
    <>
      {/* Desktop/Tablet Navigation */}
      <div style={{
        backgroundColor: isScrolled ? "rgba(255, 255, 255, 0.95)" : "#FFFFFF",
        backdropFilter: isScrolled ? "blur(8px)" : "none",
        borderBottom: `1px solid ${isScrolled ? '#A2AF9B' : '#E5E7EB'}`,
        padding: isMobile ? "0.75rem 1rem" : "1rem 2rem",
        display: "flex",
        gap: isMobile ? "0.5rem" : "1rem",
        justifyContent: "center",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 100,
        transition: "all 0.2s ease",
        boxShadow: isScrolled ? "0 2px 8px rgba(0,0,0,0.1)" : "0 1px 3px rgba(0,0,0,0.05)",
        overflow: isMobile ? "auto" : "visible",
        scrollbarWidth: "none",
        msOverflowStyle: "none"
      }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.path;

          return (
            <button
              key={tab.path}
              onClick={() => handleTabClick(tab.path)}
              style={{
                padding: isMobile ? "0.6rem 0.8rem" : "0.75rem 1.25rem",
                borderRadius: "6px",
                backgroundColor: isActive ? "#A2AF9B" : "#F9FAFB",
                border: `1px solid ${isActive ? '#A2AF9B' : '#E5E7EB'}`,
                fontWeight: isActive ? "600" : "500",
                fontSize: isMobile ? "0.8rem" : "0.875rem",
                color: isActive ? "#FFFFFF" : "#374151",
                textDecoration: "none",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: "center",
                justifyContent: "center",
                gap: isMobile ? "0.25rem" : "0.5rem",
                minWidth: isMobile ? "70px" : "auto",
                whiteSpace: "nowrap",
                cursor: "pointer",
                outline: "none",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
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
              <span style={{
                fontSize: isMobile ? "1.1rem" : "1.2rem"
              }}>
                {tab.icon}
              </span>
              
              <span style={{
                fontSize: isMobile ? "0.7rem" : "0.875rem",
                fontWeight: isActive ? "600" : "500"
              }}>
                {isMobile ? tab.shortLabel : tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#FFFFFF",
          borderTop: "1px solid #E5E7EB",
          padding: "0.75rem 1rem 1rem",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          zIndex: 1000,
          boxShadow: "0 -2px 8px rgba(0,0,0,0.1)"
        }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.path;
            
            return (
              <button
                key={`bottom-${tab.path}`}
                onClick={() => handleTabClick(tab.path)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.25rem",
                  padding: "0.5rem",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  opacity: isActive ? 1 : 0.6
                }}
              >
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "6px",
                  backgroundColor: isActive ? "#A2AF9B" : "#F3F4F6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.1rem",
                  transition: "all 0.2s ease",
                  border: `1px solid ${isActive ? '#A2AF9B' : '#E5E7EB'}`
                }}>
                  <span style={{ color: isActive ? "#FFFFFF" : "#6B7280" }}>
                    {tab.icon}
                  </span>
                </div>
                <span style={{
                  fontSize: "0.7rem",
                  fontWeight: isActive ? "600" : "500",
                  color: isActive ? "#A2AF9B" : "#6B7280"
                }}>
                  {tab.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Simple CSS for scrollbar hiding */}
      <style>{`
        /* Hide scrollbar for mobile horizontal scroll */
        div::-webkit-scrollbar {
          display: none;
        }
        
        /* Smooth scrolling for mobile navigation */
        @media (max-width: 767px) {
          div {
            scroll-behavior: smooth;
          }
        }
        
        /* Responsive adjustments */
        @media (max-width: 480px) {
          button {
            min-width: 60px !important;
            padding: 0.5rem 0.6rem !important;
          }
        }
      `}</style>
    </>
  );
}