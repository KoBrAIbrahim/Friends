import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../services/firebase";

export default function EditOrdersPage() {
  const [sessions, setSessions] = useState([]);
  const [tablesMap, setTablesMap] = useState({});
  const [timeFilter, setTimeFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedSession, setSelectedSession] = useState(null);
  const [newPrice, setNewPrice] = useState("");
  const [timeFilterDropdown, setTimeFilterDropdown] = useState(false);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Player count and confirmation states
  const [playerCount, setPlayerCount] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [showToast, setShowToast] = useState(false);

  // Media query hook for responsive design
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth > 768 && window.innerWidth <= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // دالة للتمرير إلى أعلى الصفحة
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    fetchTables();
    fetchSessions();
  }, []);

  const fetchTables = async () => {
    const snap = await getDocs(collection(db, "peli_tables"));
    const map = {};
    snap.docs.forEach((doc) => {
      const data = doc.data();
      map[doc.id] = data.table_number;
    });
    setTablesMap(map);
  };

  const handleDeleteSession = async () => {
    if (!selectedSession) return;
    await deleteDoc(doc(db, "sessions", selectedSession.id));
    setShowDeleteConfirm(false);
    fetchSessions();
  };

  const fetchSessions = async () => {
    const snap = await getDocs(collection(db, "sessions"));
    const data = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .sort((a, b) => {
      const timeA = a.start_time?.seconds || 0;
      const timeB = b.start_time?.seconds || 0;
      return timeB - timeA;
    });
    setSessions(data);
  };

const handlePay = async () => {
  if (!selectedSession) return;

  const perPlayerPrice = Math.floor(parseFloat(newPrice) / playerCount);
  const finalTotal = perPlayerPrice * playerCount;

  await updateDoc(doc(db, "sessions", selectedSession.id), {
    total_price: finalTotal,
    note: selectedSession.note || "",
    pay_status: true
  });

  setSelectedSession(null);
  fetchSessions();
};

const handleUpdatePrice = async () => {
  if (!selectedSession) return;
  await updateDoc(doc(db, "sessions", selectedSession.id), {
    total_price: parseFloat(newPrice),
    note: selectedSession.note || "",
  });

  fetchSessions();
  setShowToast(true);

  setTimeout(() => {
    setShowToast(false);
  }, 3000);
};

  const filtered = sessions.filter((s) => {
    let passesTimeFilter = true;
    if (timeFilter !== "all") {
      if (!s.start_time) return false;
      
      const sessionDate = s.start_time.toDate();
      const now = new Date();
      
      if (timeFilter === "today") {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        passesTimeFilter = sessionDate >= today;
      } else if (timeFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        passesTimeFilter = sessionDate >= weekAgo;
      } else if (timeFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        passesTimeFilter = sessionDate >= monthAgo;
      }
    }

    let passesPaymentFilter = true;
    if (paymentFilter === "paid") {
      passesPaymentFilter = s.pay_status;
    } else if (paymentFilter === "unpaid") {
      passesPaymentFilter = !s.pay_status;
    }

    return passesTimeFilter && passesPaymentFilter;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSessions = filtered.slice(startIndex, endIndex);

  const totalRevenue = filtered.reduce((sum, s) => sum + (parseFloat(s.total_price) || 0), 0);
  const paidSessions = sessions.filter(s => s.pay_status).length;
  const unpaidSessions = sessions.filter(s => !s.pay_status).length;

  // Calculate price per player (without decimals) from original price
  const pricePerPlayer = playerCount > 0 ? Math.floor(originalPrice / playerCount) : 0;

  // Update total price when player count changes based on original price
  useEffect(() => {
    if (originalPrice > 0 && playerCount > 0) {
      const calculatedPerPlayer = Math.floor(originalPrice / playerCount);
      const updatedTotalPrice = calculatedPerPlayer * playerCount;
      setNewPrice(updatedTotalPrice.toString());
    }
  }, [playerCount, originalPrice]);

  // Responsive Styles
  const containerStyle = {
    padding: isMobile ? "16px" : isTablet ? "20px" : "24px",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "'Inter', 'Cairo', system-ui, sans-serif",
    direction: 'rtl',
    // إضافة scroll سلس للصفحة كاملة
    overflowY: 'auto',
    scrollBehavior: 'smooth'
  };

  const headerStyle = {
    backgroundColor: "white",
    padding: isMobile ? "20px 16px" : isTablet ? "28px 20px" : "32px",
    borderRadius: "8px",
    marginBottom: isMobile ? "16px" : "24px",
    border: "1px solid #e2e8f0",
    textAlign: "center"
  };

  const headerTitleStyle = {
    fontSize: isMobile ? "24px" : isTablet ? "28px" : "32px",
    fontWeight: "700",
    color: "#A2AF9B",
    margin: "0 0 8px 0"
  };

  const headerSubtitleStyle = {
    color: "#64748b",
    fontSize: isMobile ? "14px" : "16px",
    margin: 0
  };

  const statsGridStyle = {
    display: "grid",
    gridTemplateColumns: isMobile 
      ? "1fr 1fr" 
      : isTablet 
        ? "repeat(2, 1fr)" 
        : "repeat(auto-fit, minmax(220px, 1fr))",
    gap: isMobile ? "12px" : "16px",
    marginBottom: isMobile ? "16px" : "24px"
  };

  const statCardStyle = {
    backgroundColor: "white",
    padding: isMobile ? "16px" : isTablet ? "20px" : "24px",
    borderRadius: "8px",
    textAlign: "center",
    border: "1px solid #e2e8f0"
  };

  const statIconStyle = {
    fontSize: isMobile ? "20px" : "24px",
    marginBottom: isMobile ? "8px" : "12px"
  };

  const statValueStyle = {
    fontSize: isMobile ? "24px" : isTablet ? "28px" : "32px",
    fontWeight: "700",
    marginBottom: isMobile ? "4px" : "8px"
  };

  const statLabelStyle = {
    color: "#64748b",
    fontSize: isMobile ? "12px" : "14px",
    margin: 0
  };

  const filterSectionStyle = {
    marginBottom: isMobile ? "16px" : "24px",
    display: "flex",
    gap: isMobile ? "12px" : "24px",
    flexDirection: isMobile ? "column" : "row",
    flexWrap: "wrap",
    alignItems: isMobile ? "stretch" : "flex-start"
  };

  const filterGroupStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    flex: isMobile ? "1" : "none"
  };

  const filterLabelStyle = {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "4px"
  };

  const dropdownButtonStyle = (isActive) => ({
    padding: isMobile ? "10px 12px" : "12px 16px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    backgroundColor: isActive ? "#A2AF9B" : "white",
    color: isActive ? "white" : "#374151",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: isMobile ? "100%" : "180px",
    width: isMobile ? "100%" : "auto"
  });

  const dropdownMenuStyle = {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: "4px",
    backgroundColor: "white",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    zIndex: 100,
    overflow: "hidden"
  };

  const dropdownItemStyle = (isSelected) => ({
    width: "100%",
    padding: isMobile ? "10px 12px" : "12px 16px",
    border: "none",
    backgroundColor: isSelected ? "#f3f4f6" : "white",
    color: isSelected ? "#A2AF9B" : "#374151",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: isSelected ? "600" : "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    textAlign: "right"
  });

  const filterButtonStyle = (isActive) => ({
    padding: isMobile ? "10px 12px" : "12px 16px",
    borderRadius: "6px",
    border: `1px solid ${isActive ? "#A2AF9B" : "#d1d5db"}`,
    backgroundColor: isActive ? "#A2AF9B" : "white",
    color: isActive ? "white" : "#374151",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    flex: isMobile ? "1" : "none"
  });

  const tableContainerStyle = {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: isMobile ? "16px" : "24px",
    border: "1px solid #e2e8f0"
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: isMobile ? "12px" : "14px"
  };

  const tableHeaderStyle = {
    backgroundColor: "#A2AF9B",
    color: "white"
  };

  const tableHeaderCellStyle = {
    padding: isMobile ? "12px 8px" : "16px 12px",
    textAlign: "center",
    fontWeight: "700",
    fontSize: isMobile ? "12px" : "14px",
    borderBottom: "1px solid #e2e8f0"
  };

  const tableRowStyle = (index) => ({
    backgroundColor: index % 2 === 0 ? "white" : "#f8fafc",
    borderBottom: "1px solid #e2e8f0"
  });

  const tableCellStyle = {
    padding: isMobile ? "12px 8px" : "16px 12px",
    textAlign: "center",
    borderBottom: "1px solid #e2e8f0"
  };

  const statusBadgeStyle = (isPaid) => ({
    padding: isMobile ? "3px 6px" : "4px 8px",
    borderRadius: "4px",
    fontSize: isMobile ? "10px" : "12px",
    fontWeight: "600",
    backgroundColor: isPaid ? "#dcfce7" : "#fef2f2",
    color: isPaid ? "#166534" : "#dc2626"
  });

  const sessionTypeBadgeStyle = (sessionType) => ({
    padding: isMobile ? "3px 8px" : "4px 12px",
    borderRadius: "12px",
    fontSize: isMobile ? "10px" : "12px",
    fontWeight: "600",
    backgroundColor: sessionType === "open" ? "#f0f4f0" : "#fef2f2",
    color: sessionType === "open" ? "#A2AF9B" : "#dc2626"
  });

  const editButtonStyle = {
    backgroundColor: "#A2AF9B",
    color: "white",
    border: "none",
    padding: isMobile ? "6px 12px" : "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: isMobile ? "11px" : "12px",
    fontWeight: "600"
  };

  const paginationStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: isMobile ? "8px" : "12px",
    marginTop: isMobile ? "16px" : "24px",
    padding: isMobile ? "12px" : "16px",
    flexWrap: "wrap"
  };

  const paginationButtonStyle = (isActive = false, disabled = false) => ({
    padding: isMobile ? "6px 10px" : "8px 12px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    backgroundColor: isActive ? "#A2AF9B" : disabled ? "#f3f4f6" : "white",
    color: isActive ? "white" : disabled ? "#9ca3af" : "#374151",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: isMobile ? "12px" : "14px",
    fontWeight: "600",
    minWidth: isMobile ? "32px" : "40px",
    textAlign: "center"
  });

  const modalOverlayStyle = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: isMobile ? "16px" : "24px"
  };

  const modalContentStyle = {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: isMobile ? "20px" : "32px",
    width: "100%",
    maxWidth: isMobile ? "100%" : "500px",
    maxHeight: isMobile ? "90vh" : "85vh",
    overflowY: "auto",
    overflowX: "hidden",
    border: "1px solid #e2e8f0",
    // تحسين scroll للنوافذ المنبثقة
    scrollbarWidth: "thin",
    scrollbarColor: "#A2AF9B #f1f1f1",
    WebkitOverflowScrolling: "touch",
    // إضافة shadow للإشارة للمحتوى القابل للتمرير
    boxShadow: isMobile 
      ? "0 10px 25px rgba(0,0,0,0.1)" 
      : "0 20px 40px rgba(0,0,0,0.1)"
  };

  const modalHeaderStyle = {
    textAlign: "center",
    marginBottom: isMobile ? "16px" : "24px",
    paddingBottom: isMobile ? "12px" : "16px",
    borderBottom: "1px solid #e2e8f0"
  };

  const modalTitleStyle = {
    fontSize: isMobile ? "20px" : "24px",
    fontWeight: "700",
    color: "#A2AF9B",
    margin: "0 0 8px 0"
  };

  const modalSubtitleStyle = {
    color: "#64748b",
    fontSize: isMobile ? "14px" : "16px",
    margin: 0
  };

  const inputGroupStyle = {
    marginBottom: isMobile ? "16px" : "24px"
  };

  const labelStyle = {
    display: "block",
    color: "#374151",
    fontWeight: "600",
    marginBottom: "8px",
    fontSize: isMobile ? "14px" : "16px"
  };

  const inputStyle = {
    width: "100%",
    padding: isMobile ? "10px" : "12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box"
  };

  const modalActionsStyle = {
    display: "flex",
    justifyContent: isMobile ? "stretch" : "flex-end",
    gap: isMobile ? "8px" : "12px",
    flexDirection: isMobile ? "column" : "row",
    flexWrap: "wrap"
  };

  const buttonStyle = (variant) => {
    const baseStyle = {
      padding: isMobile ? "12px 16px" : "12px 24px",
      border: variant === "cancel" ? "1px solid #d1d5db" : "none",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      flex: isMobile ? "1" : "none"
    };

    const styles = {
      cancel: {
        ...baseStyle,
        backgroundColor: "white",
        color: "#374151"
      },
      delete: {
        ...baseStyle,
        backgroundColor: "#ef4444",
        color: "white"
      },
      save: {
        ...baseStyle,
        backgroundColor: "#f59e0b",
        color: "white"
      },
      pay: {
        ...baseStyle,
        backgroundColor: "#22c55e",
        color: "white"
      }
    };
    return styles[variant] || styles.cancel;
  };

  const emptyStateStyle = {
    textAlign: "center",
    padding: isMobile ? "32px 16px" : "48px",
    color: "#64748b",
    fontSize: isMobile ? "14px" : "16px"
  };

  const pricePerPlayerDisplayStyle = {
    padding: isMobile ? "10px" : "12px",
    border: "1px solid #A2AF9B",
    borderRadius: "6px",
    backgroundColor: "#f0f4f0",
    color: "#A2AF9B",
    fontSize: isMobile ? "14px" : "16px",
    fontWeight: "600",
    textAlign: "center"
  };

  const toastStyle = {
    position: "fixed",
    top: isMobile ? "16px" : "24px",
    right: isMobile ? "16px" : "24px",
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: isMobile ? "12px 16px" : "16px 24px",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    fontWeight: "600",
    fontSize: isMobile ? "12px" : "14px",
    zIndex: 9999,
    transition: "opacity 0.3s ease-in-out",
    maxWidth: isMobile ? "calc(100% - 32px)" : "auto"
  };

  return (
    <>
      {/* إضافة CSS للـ scroll bars */}
      <style jsx global>{`
        /* تحسين مظهر scroll bar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #A2AF9B;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #8a9985;
        }
        
        /* للفايرفوكس */
        * {
          scrollbar-width: thin;
          scrollbar-color: #A2AF9B #f1f1f1;
        }
        
        /* scroll سلس للصفحة */
        html {
          scroll-behavior: smooth;
        }
        
        /* تحسين scroll على الموبايل */
        @media (max-width: 768px) {
          body {
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
      
      <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={headerTitleStyle}>
          إدارة طلبات البلياردو
        </h1>
        <p style={headerSubtitleStyle}>
          تعديل ومتابعة جميع الجلسات والمدفوعات
        </p>
      </div>

      {/* Statistics Cards */}
      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <div style={statIconStyle}>💰</div>
          <div style={{...statValueStyle, color: "#A2AF9B"}}>
            {totalRevenue.toFixed(2)}
          </div>
          <p style={statLabelStyle}>إجمالي الإيرادات</p>
        </div>
        
        <div style={statCardStyle}>
          <div style={statIconStyle}>✅</div>
          <div style={{...statValueStyle, color: "#22c55e"}}>
            {paidSessions}
          </div>
          <p style={statLabelStyle}>جلسات مدفوعة</p>
        </div>
        
        <div style={statCardStyle}>
          <div style={statIconStyle}>⏳</div>
          <div style={{...statValueStyle, color: "#ef4444"}}>
            {unpaidSessions}
          </div>
          <p style={statLabelStyle}>جلسات غير مدفوعة</p>
        </div>

        <div style={statCardStyle}>
          <div style={statIconStyle}>📊</div>
          <div style={{...statValueStyle, color: "#A2AF9B"}}>
            {filtered.length}
          </div>
          <p style={statLabelStyle}>إجمالي الجلسات</p>
        </div>
      </div>

      {/* Filter Section */}
      <div style={filterSectionStyle}>
        {/* Time Filter */}
        <div style={filterGroupStyle}>
          <label style={filterLabelStyle}>
            تصفية حسب الوقت
          </label>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setTimeFilterDropdown(!timeFilterDropdown)}
              style={dropdownButtonStyle(timeFilter !== "all")}
            >
              <span>
                {timeFilter === "today" ? "اليوم" : 
                 timeFilter === "week" ? "الأسبوع الماضي" : 
                 timeFilter === "month" ? "الشهر الماضي" : "جميع الأيام"}
              </span>
              <span>▼</span>
            </button>
            
            {timeFilterDropdown && (
              <div style={dropdownMenuStyle}>
                {[
                  { key: "all", label: "جميع الأيام" },
                  { key: "today", label: "اليوم" },
                  { key: "week", label: "الأسبوع الماضي" },
                  { key: "month", label: "الشهر الماضي" }
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => {
                      setTimeFilter(option.key);
                      setTimeFilterDropdown(false);
                    }}
                    style={dropdownItemStyle(timeFilter === option.key)}
                  >
                    {option.label}
                    {timeFilter === option.key && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payment Filter */}
        <div style={filterGroupStyle}>
          <label style={filterLabelStyle}>
            تصفية حسب الدفع
          </label>
          <div style={{ display: "flex", gap: isMobile ? "8px" : "12px", flexWrap: "wrap" }}>
            {[
              { key: "all", label: "الكل" },
              { key: "paid", label: "المدفوعة" },
              { key: "unpaid", label: "الغير مدفوعة" }
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setPaymentFilter(filterOption.key)}
                style={filterButtonStyle(paymentFilter === filterOption.key)}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div style={tableContainerStyle}>
        <div style={{ 
          overflowX: "auto",
          overflowY: "hidden", 
          // تحسين scroll للجدول
          scrollbarWidth: "thin",
          scrollbarColor: "#A2AF9B #f1f1f1",
          // للمتصفحات webkit
          WebkitOverflowScrolling: "touch"
        }}>
          <table style={tableStyle}>
            <thead style={tableHeaderStyle}>
              <tr>
                {[
                  "رقم الطاولة",
                  "تاريخ الجلسة", 
                  "نوع الجلسة",
                  "ملاحظات",
                  "السعر",
                  "الحالة",
                  "الإجراءات"
                ].map((header, index) => (
                  <th key={index} style={tableHeaderCellStyle}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentSessions.map((s, index) => (
                <tr key={s.id} style={tableRowStyle(index)}>
                  <td style={{...tableCellStyle, fontWeight: "600", color: "#A2AF9B"}}>
                    طاولة {tablesMap[s.table_id] || s.table_id}
                  </td>
                  <td style={tableCellStyle}>
                    {s.start_time ? (
                      <div>
                        <div>{s.start_time.toDate().toLocaleDateString('en-GB')}</div>
                        <div style={{ fontSize: isMobile ? "10px" : "12px", color: "#64748b" }}>
                          {s.start_time.toDate().toLocaleTimeString('ar-SA', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={tableCellStyle}>
                    <span style={sessionTypeBadgeStyle(s.session_type)}>
                      {s.session_type === "open" ? "مفتوح" : "محدد"}
                    </span>
                  </td>
                  <td style={{...tableCellStyle, maxWidth: isMobile ? "100px" : "150px"}}>
                    <div style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {s.note || "—"}
                    </div>
                  </td>
                  <td style={{...tableCellStyle, fontWeight: "700", color: "#A2AF9B"}}>
                    {parseFloat(s.total_price || 0).toFixed(2)} شيقل
                  </td>
                  <td style={tableCellStyle}>
                    <span style={statusBadgeStyle(s.pay_status)}>
                      {s.pay_status ? "مدفوع" : "غير مدفوع"}
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    <button
                      onClick={() => {
                        setSelectedSession(s);
                        const price = parseFloat(s.total_price || 0);
                        setOriginalPrice(price);
                        setNewPrice(price.toFixed(2));
                        setPlayerCount(1);
                      }}
                      style={editButtonStyle}
                    >
                      تعديل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filtered.length === 0 && (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: isMobile ? "32px" : "48px", marginBottom: "16px" }}>📋</div>
              لا توجد جلسات متاحة حالياً
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={paginationStyle}>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={paginationButtonStyle(false, currentPage === 1)}
            >
              السابق
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={paginationButtonStyle(currentPage === page)}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={paginationButtonStyle(false, currentPage === totalPages)}
            >
              التالي
            </button>

            <div style={{ 
              marginTop: isMobile ? "8px" : "0",
              marginRight: isMobile ? "0" : "16px", 
              color: "#64748b", 
              fontSize: isMobile ? "12px" : "14px",
              width: isMobile ? "100%" : "auto",
              textAlign: "center"
            }}>
              صفحة {currentPage} من {totalPages} - ({filtered.length} جلسة)
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {selectedSession && !showDeleteConfirm && (
        <div 
          style={modalOverlayStyle}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedSession(null);
              setTimeFilterDropdown(false);
            }
          }}
        >
          <div style={modalContentStyle}>
            {/* Modal Header */}
            <div style={modalHeaderStyle}>
              <h2 style={modalTitleStyle}>
                تعديل الجلسة
              </h2>
              <p style={modalSubtitleStyle}>
                طاولة رقم {tablesMap[selectedSession.table_id]}
              </p>
            </div>

            {/* Session Details */}
            <div style={inputGroupStyle}>
              <label style={labelStyle}>
                الملاحظات
              </label>
              <textarea
                value={selectedSession.note || ""}
                onChange={(e) =>
                  setSelectedSession({
                    ...selectedSession,
                    note: e.target.value,
                  })
                }
                placeholder="اكتب الملاحظات هنا..."
                style={{
                  ...inputStyle,
                  minHeight: isMobile ? "60px" : "80px",
                  resize: "vertical",
                  outline: "none"
                }}
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>
                السعر الأصلي المحفوظ
              </label>
              <div style={{
                ...pricePerPlayerDisplayStyle,
                backgroundColor: "#f0f9ff",
                borderColor: "#0ea5e9",
                color: "#0ea5e9"
              }}>
                {originalPrice.toFixed(2)} شيقل (محفوظ)
              </div>
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>
                السعر الإجمالي المعدل (شيقل)
              </label>
              <input
                type="number"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>
                عدد اللاعبين
              </label>
              <input
                type="number"
                min="1"
                value={playerCount}
                onChange={(e) => setPlayerCount(parseInt(e.target.value) || 1)}
                style={inputStyle}
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>
                السعر لكل لاعب (بدون فواصل)
              </label>
              <div style={pricePerPlayerDisplayStyle}>
                {pricePerPlayer} شيقل لكل لاعب
              </div>
            </div>

            <div style={inputGroupStyle}>
              <button
                onClick={() => {
                  setPlayerCount(1);
                  setNewPrice(originalPrice.toFixed(2));
                }}
                style={{
                  ...buttonStyle("cancel"),
                  width: "100%",
                  backgroundColor: "#f0f9ff",
                  borderColor: "#0ea5e9",
                  color: "#0ea5e9"
                }}
              >
                🔄 إعادة تعيين للسعر الأصلي
              </button>
            </div>

            {/* Action Buttons */}
            <div style={modalActionsStyle}>
              <button
                onClick={() => setSelectedSession(null)}
                style={buttonStyle("cancel")}
              >
                إلغاء
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={buttonStyle("delete")}
              >
                حذف
              </button>

              <button
                onClick={handleUpdatePrice}
                style={buttonStyle("save")}
              >
                حفظ
              </button>

              {!selectedSession.pay_status && (
                <button
                  onClick={handlePay}
                  style={buttonStyle("pay")}
                >
                  تم الدفع
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedSession && (
        <div style={modalOverlayStyle}>
          <div style={{...modalContentStyle, maxWidth: isMobile ? "100%" : "400px"}}>
            <div style={modalHeaderStyle}>
              <div style={{ fontSize: isMobile ? "32px" : "48px", marginBottom: "16px" }}>⚠️</div>
              <h2 style={modalTitleStyle}>
                تأكيد الحذف
              </h2>
              <p style={modalSubtitleStyle}>
                هل أنت متأكد من حذف هذه الجلسة؟
              </p>
            </div>

            <div style={{
              textAlign: "center",
              marginBottom: isMobile ? "16px" : "24px",
              padding: "16px",
              backgroundColor: "#fef2f2",
              borderRadius: "6px",
              border: "1px solid #fecaca"
            }}>
              <p style={{ margin: 0, color: "#dc2626", fontSize: "14px" }}>
                لا يمكن التراجع عن هذا الإجراء
              </p>
            </div>

            <div style={modalActionsStyle}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={buttonStyle("cancel")}
              >
                إلغاء
              </button>

              <button
                onClick={handleDeleteSession}
                style={buttonStyle("delete")}
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div style={toastStyle}>
          ✅ تم حفظ التعديلات بنجاح
        </div>
      )}

      {/* زر العودة إلى أعلى الصفحة */}
      <button
        onClick={scrollToTop}
        style={{
          position: "fixed",
          bottom: isMobile ? "20px" : "30px",
          left: isMobile ? "20px" : "30px",
          width: isMobile ? "45px" : "50px",
          height: isMobile ? "45px" : "50px",
          borderRadius: "50%",
          backgroundColor: "#A2AF9B",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontSize: isMobile ? "16px" : "18px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s ease"
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = "#8a9985";
          e.target.style.transform = "scale(1.1)";
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = "#A2AF9B";
          e.target.style.transform = "scale(1)";
        }}
        title="العودة إلى أعلى الصفحة"
      >
        ↑
      </button>
    </div>
    </>
  );
}