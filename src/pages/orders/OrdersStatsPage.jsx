/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useNavigate } from "react-router-dom";

export default function OrdersStatsPage() {
  const [sessions, setSessions] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [filter, setFilter] = useState("today");
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const navigate = useNavigate();

  const goToDetails = (sessionId) => {
    navigate(`/orders/session/${sessionId}`);
  };

  const showNotification = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type };
    
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const styles = {
    container: {
      padding: "24px",
      backgroundColor: "#f8fafc",
      minHeight: "100vh",
      fontFamily: "'Inter', 'Cairo', system-ui, sans-serif",
      direction: 'rtl'
    },
    header: {
      backgroundColor: "white",
      padding: "32px",
      borderRadius: "8px",
      marginBottom: "24px",
      border: "1px solid #e2e8f0",
      textAlign: "center"
    },
    headerTitle: {
      fontSize: "32px",
      fontWeight: "700",
      color: "#A2AF9B",
      margin: 0
    },
    filterSection: {
      backgroundColor: "white",
      padding: "24px",
      borderRadius: "8px",
      marginBottom: "24px",
      border: "1px solid #e2e8f0"
    },
    filterTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#374151",
      marginBottom: "16px"
    },
    filterControls: {
      display: "flex",
      gap: "16px",
      alignItems: "center",
      flexWrap: "wrap"
    },
    select: {
      padding: "12px",
      borderRadius: "6px",
      border: "1px solid #d1d5db",
      backgroundColor: "white",
      color: "#374151",
      fontSize: "14px",
      outline: "none",
      cursor: "pointer",
      fontWeight: "600"
    },
    dateInput: {
      padding: "12px",
      borderRadius: "6px",
      border: "1px solid #d1d5db",
      backgroundColor: "white",
      color: "#374151",
      fontSize: "14px",
      outline: "none",
      fontWeight: "600"
    },
    statsCard: {
      backgroundColor: "#A2AF9B",
      color: "white",
      padding: "32px",
      borderRadius: "8px",
      marginBottom: "24px",
      textAlign: "center",
      border: "1px solid #8A9A85"
    },
    statsTitle: {
      fontSize: "20px",
      fontWeight: "600",
      marginBottom: "8px"
    },
    statsValue: {
      fontSize: "36px",
      fontWeight: "700",
      marginBottom: "8px"
    },
    statsSubtitle: {
      fontSize: "16px",
      opacity: 0.9
    },
    tableContainer: {
      backgroundColor: "white",
      borderRadius: "8px",
      overflow: "hidden",
      border: "1px solid #e2e8f0"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse"
    },
    tableHeader: {
      backgroundColor: "#A2AF9B",
      color: "white"
    },
    th: {
      padding: "16px 12px",
      textAlign: "center",
      fontWeight: "700",
      fontSize: "14px",
      borderRight: "1px solid rgba(255, 255, 255, 0.2)"
    },
    tr: {
      borderBottom: "1px solid #e2e8f0"
    },
    trPaid: {
      backgroundColor: "white"
    },
    trUnpaid: {
      backgroundColor: "#fef2f2"
    },
    td: {
      padding: "16px 12px",
      textAlign: "center",
      borderRight: "1px solid #e2e8f0",
      fontSize: "14px",
      color: "#374151"
    },
    viewButton: {
      padding: "8px 16px",
      borderRadius: "6px",
      backgroundColor: "#A2AF9B",
      color: "white",
      border: "none",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "600"
    },
    noData: {
      textAlign: "center",
      padding: "48px",
      color: "#64748b",
      fontSize: "16px",
      backgroundColor: "white",
      borderRadius: "8px",
      border: "1px solid #e2e8f0"
    },
    loadingSpinner: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "200px",
      fontSize: "16px",
      color: "#64748b",
      backgroundColor: "white",
      borderRadius: "8px",
      border: "1px solid #e2e8f0"
    },
    summaryGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "16px",
      marginBottom: "24px"
    },
    summaryCard: {
      backgroundColor: "white",
      padding: "24px",
      borderRadius: "8px",
      textAlign: "center",
      border: "1px solid #e2e8f0"
    },
    summaryCardTitle: {
      fontSize: "14px",
      color: "#64748b",
      marginBottom: "8px",
      fontWeight: "600"
    },
    summaryCardValue: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#A2AF9B"
    },
    paidBadge: {
      display: "inline-block",
      padding: "4px 12px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "600",
      backgroundColor: "#dcfce7",
      color: "#166534"
    },
    unpaidBadge: {
      display: "inline-block",
      padding: "4px 12px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "600",
      backgroundColor: "#fef2f2",
      color: "#dc2626"
    },
    notificationContainer: {
      position: "fixed",
      top: "32px",
      right: "32px",
      zIndex: 2000,
      display: "flex",
      flexDirection: "column",
      gap: "8px"
    },
    notification: {
      padding: "16px 24px",
      borderRadius: "8px",
      minWidth: "300px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      border: "1px solid"
    },
    notificationSuccess: {
      backgroundColor: "#dcfce7",
      color: "#166534",
      borderColor: "#bbf7d0"
    },
    notificationError: {
      backgroundColor: "#fef2f2",
      color: "#dc2626",
      borderColor: "#fecaca"
    },
    notificationWarning: {
      backgroundColor: "#fef3c7",
      color: "#d97706",
      borderColor: "#fde68a"
    },
    notificationInfo: {
      backgroundColor: "#f0f9ff",
      color: "#0369a1",
      borderColor: "#bae6fd"
    },
    notificationMessage: {
      flex: 1,
      fontSize: "14px",
      fontWeight: "600"
    },
    notificationClose: {
      background: "none",
      border: "none",
      color: "inherit",
      fontSize: "18px",
      cursor: "pointer",
      padding: "4px",
      borderRadius: "4px",
      marginLeft: "16px"
    },
    paginationContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "12px",
      marginTop: "24px",
      padding: "16px",
      backgroundColor: "white",
      borderRadius: "8px",
      border: "1px solid #e2e8f0"
    },
    paginationButton: (isActive = false, disabled = false) => ({
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
    }),
    paginationInfo: {
      marginRight: "16px",
      color: "#64748b",
      fontSize: "14px",
      fontWeight: "500"
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sessionSnap = await getDocs(collection(db, "order_sessions"));
      const sessionsData = sessionSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const itemsSnap = await getDocs(collection(db, "order_items"));
      const itemsData = itemsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSessions(sessionsData);
      setOrderItems(itemsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const isInFilter = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return false;
    const date = timestamp.toDate();
    const today = new Date();

    switch (filter) {
      case "today":
        return date.toDateString() === today.toDateString();
      case "last_week": {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        return date >= oneWeekAgo && date <= today;
      }
      case "last_month": {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        return date >= oneMonthAgo && date <= today;
      }
      case "specific": {
        if (!selectedDate) return false;
        const selected = new Date(selectedDate);
        return date.toDateString() === selected.toDateString();
      }
      default:
        return true;
    }
  };

  const filteredSessions = sessions
    .filter((s) => s.created_at && isInFilter(s.created_at))
    .sort((a, b) => b.created_at.toDate() - a.created_at.toDate())
    .map((s) => {
      const items = orderItems.filter((i) => i.session_id === s.id);
      const totalSell = items.reduce(
        (sum, item) => sum + (parseFloat(item.sell_price || 0) * parseInt(item.quantity || 1)),
        0
      );
      const allPaid = items.length > 0 && items.every((item) => item.paid === true);

      return {
        id: s.id,
        name: s.name || "بدون اسم",
        date: s.created_at.toDate(),
        itemCount: items.length,
        totalQuantity: items.reduce((sum, item) => sum + parseInt(item.quantity || 1), 0),
        totalSell,
        allPaid,
        isPaid: allPaid && items.length > 0
      };
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSessions = filteredSessions.slice(startIndex, endIndex);

  const totalSellAll = filteredSessions.reduce((sum, s) => sum + s.totalSell, 0);
  const totalOrders = filteredSessions.reduce((sum, s) => sum + s.itemCount, 0);
  const totalQuantity = filteredSessions.reduce((sum, s) => sum + s.totalQuantity, 0);
  const paidSessions = filteredSessions.filter(s => s.isPaid).length;

  const getFilterLabel = () => {
    switch (filter) {
      case "today": return "اليوم";
      case "last_week": return "آخر أسبوع";
      case "last_month": return "آخر شهر";
      case "specific": return selectedDate ? `يوم ${new Date(selectedDate).toLocaleDateString('ar')}` : "يوم محدد";
      default: return "";
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingSpinner}>
          جاري تحميل الإحصائيات...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>إحصائيات الطلبات</h1>
      </div>

      {/* Filter Section */}
      <div style={styles.filterSection}>
        <h3 style={styles.filterTitle}>تصفية البيانات</h3>
        <div style={styles.filterControls}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={styles.select}
          >
            <option value="today">اليوم</option>
            <option value="last_week">آخر أسبوع</option>
            <option value="last_month">آخر شهر</option>
            <option value="specific">يوم محدد</option>
          </select>

          {filter === "specific" && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={styles.dateInput}
            />
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryCardTitle}>إجمالي المبيعات</div>
          <div style={styles.summaryCardValue}>{totalSellAll.toFixed(2)} ₪</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryCardTitle}>عدد الجلسات</div>
          <div style={styles.summaryCardValue}>{filteredSessions.length}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryCardTitle}>إجمالي الطلبات</div>
          <div style={styles.summaryCardValue}>{totalOrders}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryCardTitle}>الكمية الإجمالية</div>
          <div style={styles.summaryCardValue}>{totalQuantity}</div>
        </div>
      </div>

      {/* Main Stats Card */}
      <div style={styles.statsCard}>
        <div style={styles.statsTitle}>إحصائيات {getFilterLabel()}</div>
        <div style={styles.statsValue}>{totalSellAll.toFixed(2)} شيكل</div>
        <div style={styles.statsSubtitle}>
          {filteredSessions.length} جلسة • {paidSessions} مدفوعة • {filteredSessions.length - paidSessions} غير مدفوعة
        </div>
      </div>

      {/* Sessions Table */}
      {filteredSessions.length > 0 ? (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.th}>اسم الجلسة</th>
                <th style={styles.th}>التاريخ</th>
                <th style={styles.th}>عدد الطلبات</th>
                <th style={styles.th}>الكمية الإجمالية</th>
                <th style={styles.th}>المبلغ الإجمالي</th>
                <th style={styles.th}>حالة الدفع</th>
                <th style={styles.th}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {currentSessions.map((session) => (
                <tr 
                  key={session.id} 
                  style={{
                    ...styles.tr,
                    ...(session.isPaid ? styles.trPaid : styles.trUnpaid)
                  }}
                >
                  <td style={styles.td}>
                    <strong>{session.name}</strong>
                  </td>
                  <td style={styles.td}>
                    {session.date.toLocaleDateString("ar", {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </td>
                  <td style={styles.td}>{session.itemCount}</td>
                  <td style={styles.td}>{session.totalQuantity}</td>
                  <td style={styles.td}>
                    <strong>{session.totalSell.toFixed(2)} ₪</strong>
                  </td>
                  <td style={styles.td}>
                    {session.itemCount === 0 ? (
                      <span style={styles.unpaidBadge}>لا توجد طلبات</span>
                    ) : session.isPaid ? (
                      <span style={styles.paidBadge}>مدفوع بالكامل</span>
                    ) : (
                      <span style={styles.unpaidBadge}>غير مكتمل</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => goToDetails(session.id)}
                      style={styles.viewButton}
                    >
                      عرض التفاصيل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.paginationContainer}>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                style={styles.paginationButton(false, currentPage === 1)}
              >
                السابق
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={styles.paginationButton(currentPage === page)}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={styles.paginationButton(false, currentPage === totalPages)}
              >
                التالي
              </button>

              <div style={styles.paginationInfo}>
                صفحة {currentPage} من {totalPages} - ({filteredSessions.length} جلسة)
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.noData}>
          <p>لا توجد بيانات للفترة المحددة</p>
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div style={styles.notificationContainer}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                ...styles.notification,
                ...styles[`notification${notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}`]
              }}
            >
              <div style={styles.notificationMessage}>
                {notification.message}
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                style={styles.notificationClose}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}