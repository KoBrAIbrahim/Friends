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
    //setSelectedSession(null);
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

  fetchSessions(); // اختياري
  setShowToast(true); // عرض الإشعار

  setTimeout(() => {
    setShowToast(false); // إخفاء بعد 3 ثواني
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

  const containerStyle = {
    padding: "24px",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "'Inter', 'Cairo', system-ui, sans-serif",
    direction: 'rtl'
  };

  const headerStyle = {
    backgroundColor: "white",
    padding: "32px",
    borderRadius: "8px",
    marginBottom: "24px",
    border: "1px solid #e2e8f0",
    textAlign: "center"
  };

  const headerTitleStyle = {
    fontSize: "32px",
    fontWeight: "700",
    color: "#A2AF9B",
    margin: "0 0 8px 0"
  };

  const headerSubtitleStyle = {
    color: "#64748b",
    fontSize: "16px",
    margin: 0
  };

  const statsGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "24px"
  };

  const statCardStyle = {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "8px",
    textAlign: "center",
    border: "1px solid #e2e8f0"
  };

  const statIconStyle = {
    fontSize: "24px",
    marginBottom: "12px"
  };

  const statValueStyle = {
    fontSize: "32px",
    fontWeight: "700",
    marginBottom: "8px"
  };

  const statLabelStyle = {
    color: "#64748b",
    fontSize: "14px",
    margin: 0
  };

  const filterSectionStyle = {
    marginBottom: "24px",
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
    alignItems: "flex-start"
  };

  const filterGroupStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  };

  const filterLabelStyle = {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "4px"
  };

  const dropdownButtonStyle = (isActive) => ({
    padding: "12px 16px",
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
    minWidth: "180px"
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
    padding: "12px 16px",
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
    padding: "12px 16px",
    borderRadius: "6px",
    border: `1px solid ${isActive ? "#A2AF9B" : "#d1d5db"}`,
    backgroundColor: isActive ? "#A2AF9B" : "white",
    color: isActive ? "white" : "#374151",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  });

  const tableContainerStyle = {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "24px",
    border: "1px solid #e2e8f0"
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px"
  };

  const tableHeaderStyle = {
    backgroundColor: "#A2AF9B",
    color: "white"
  };

  const tableHeaderCellStyle = {
    padding: "16px 12px",
    textAlign: "center",
    fontWeight: "700",
    fontSize: "14px",
    borderBottom: "1px solid #e2e8f0"
  };

  const tableRowStyle = (index) => ({
    backgroundColor: index % 2 === 0 ? "white" : "#f8fafc",
    borderBottom: "1px solid #e2e8f0"
  });

  const tableCellStyle = {
    padding: "16px 12px",
    textAlign: "center",
    borderBottom: "1px solid #e2e8f0"
  };

  const statusBadgeStyle = (isPaid) => ({
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: isPaid ? "#dcfce7" : "#fef2f2",
    color: isPaid ? "#166534" : "#dc2626"
  });

  const sessionTypeBadgeStyle = (sessionType) => ({
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: sessionType === "open" ? "#f0f4f0" : "#fef2f2",
    color: sessionType === "open" ? "#A2AF9B" : "#dc2626"
  });

  const editButtonStyle = {
    backgroundColor: "#A2AF9B",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600"
  };

  const paginationStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    marginTop: "24px",
    padding: "16px"
  };

  const paginationButtonStyle = (isActive = false, disabled = false) => ({
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    backgroundColor: isActive ? "#A2AF9B" : disabled ? "#f3f4f6" : "white",
    color: isActive ? "white" : disabled ? "#9ca3af" : "#374151",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "14px",
    fontWeight: "600",
    minWidth: "40px",
    textAlign: "center"
  });

  const modalOverlayStyle = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  };

  const modalContentStyle = {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "32px",
    width: "90%",
    maxWidth: "500px",
    border: "1px solid #e2e8f0"
  };

  const modalHeaderStyle = {
    textAlign: "center",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "1px solid #e2e8f0"
  };

  const modalTitleStyle = {
    fontSize: "24px",
    fontWeight: "700",
    color: "#A2AF9B",
    margin: "0 0 8px 0"
  };

  const modalSubtitleStyle = {
    color: "#64748b",
    fontSize: "16px",
    margin: 0
  };

  const inputGroupStyle = {
    marginBottom: "24px"
  };

  const labelStyle = {
    display: "block",
    color: "#374151",
    fontWeight: "600",
    marginBottom: "8px"
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px"
  };



  const modalActionsStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    flexWrap: "wrap"
  };

  const buttonStyle = (variant) => {
    const styles = {
      cancel: {
        padding: "12px 24px",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        backgroundColor: "white",
        color: "#374151",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer"
      },
      delete: {
        padding: "12px 24px",
        backgroundColor: "#ef4444",
        color: "white",
        border: "none",
        borderRadius: "6px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer"
      },
      save: {
        padding: "12px 24px",
        backgroundColor: "#f59e0b",
        color: "white",
        border: "none",
        borderRadius: "6px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer"
      },
      pay: {
        padding: "12px 24px",
        backgroundColor: "#22c55e",
        color: "white",
        border: "none",
        borderRadius: "6px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer"
      }
    };
    return styles[variant] || styles.cancel;
  };

  const emptyStateStyle = {
    textAlign: "center",
    padding: "48px",
    color: "#64748b",
    fontSize: "16px"
  };

  const pricePerPlayerDisplayStyle = {
    padding: "12px",
    border: "1px solid #A2AF9B",
    borderRadius: "6px",
    backgroundColor: "#f0f4f0",
    color: "#A2AF9B",
    fontSize: "16px",
    fontWeight: "600",
    textAlign: "center"
  };

  return (
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
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
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
        <div style={{ overflowX: "auto" }}>
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
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
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
                  <td style={{...tableCellStyle, maxWidth: "150px"}}>
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
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
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

            <div style={{ marginRight: "16px", color: "#64748b", fontSize: "14px" }}>
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
    padding: "12px",
    border: "1px solid #A2AF9B",
    borderRadius: "6px",
    backgroundColor: "#f8fafc",
    color: "#374151",
    fontSize: "14px",
    minHeight: "80px",
    resize: "vertical",
    outline: "none",
    width: "100%",
    boxSizing: "border-box"
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
          <div style={{...modalContentStyle, maxWidth: "400px"}}>
            <div style={modalHeaderStyle}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
              <h2 style={modalTitleStyle}>
                تأكيد الحذف
              </h2>
              <p style={modalSubtitleStyle}>
                هل أنت متأكد من حذف هذه الجلسة؟
              </p>
            </div>

            <div style={{
              textAlign: "center",
              marginBottom: "24px",
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
      {showToast && (
  <div style={{
    position: "fixed",
    top: "24px",
    right: "24px",
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: "16px 24px",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    fontWeight: "600",
    fontSize: "14px",
    zIndex: 9999,
    transition: "opacity 0.3s ease-in-out"
  }}>
    ✅ تم حفظ التعديلات بنجاح
  </div>
)}

    </div>
  );
}