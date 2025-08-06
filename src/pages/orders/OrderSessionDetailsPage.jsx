import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { useParams } from "react-router-dom";

export default function OrderSessionDetailsPage() {
  const { sessionId } = useParams();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [notifications, setNotifications] = useState([]);

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
    sessionInfo: {
      backgroundColor: "white",
      padding: "24px",
      borderRadius: "8px",
      marginBottom: "24px",
      border: "1px solid #e2e8f0"
    },
    sessionTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#374151",
      marginBottom: "8px"
    },
    sessionId: {
      fontSize: "14px",
      color: "#64748b",
      fontFamily: "monospace",
      backgroundColor: "#f1f5f9",
      padding: "4px 8px",
      borderRadius: "4px",
      display: "inline-block",
      border: "1px solid #e2e8f0"
    },
    summaryCards: {
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
    statusBadge: {
      padding: "6px 12px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "600"
    },
    statusPaid: {
      backgroundColor: "#dcfce7",
      color: "#166534"
    },
    statusUnpaid: {
      backgroundColor: "#fef2f2",
      color: "#dc2626"
    },
    sourceBadge: {
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "600"
    },
    sourceBadgeInventory: {
      backgroundColor: "#f1f5f9",
      color: "#374151"
    },
    sourceBadgeCustom: {
      backgroundColor: "#f0f4f0",
      color: "#A2AF9B"
    },
    actionButton: {
      padding: "8px 16px",
      borderRadius: "6px",
      border: "none",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "600",
      minWidth: "120px"
    },
    toggleToPaid: {
      backgroundColor: "#A2AF9B",
      color: "white"
    },
    toggleToUnpaid: {
      backgroundColor: "#dc2626",
      color: "white"
    },
    toggleDisabled: {
      backgroundColor: "#9ca3af",
      color: "white",
      cursor: "not-allowed"
    },
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "300px",
      backgroundColor: "white",
      borderRadius: "8px",
      border: "1px solid #e2e8f0"
    },
    loadingText: {
      fontSize: "16px",
      color: "#64748b",
      fontWeight: "600"
    },
    noData: {
      textAlign: "center",
      padding: "48px",
      backgroundColor: "white",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
      color: "#64748b",
      fontSize: "16px"
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
    }
  };

  const showNotification = (message, type = 'success', duration = 4000) => {
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

  useEffect(() => {
    fetchOrderItems();
  }, [sessionId]);

  const fetchOrderItems = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "order_items"),
        where("session_id", "==", sessionId)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setItems(data);
      
      if (data.length > 0) {
        showNotification(`تم تحميل ${data.length} طلب بنجاح`, "success");
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      showNotification("حدث خطأ أثناء تحميل البيانات", "error");
    }
    setLoading(false);
  };

  const togglePaidStatus = async (item) => {
    setUpdating(item.id);
    try {
      const itemRef = doc(db, "order_items", item.id);
      await updateDoc(itemRef, { paid: !item.paid });
      await fetchOrderItems();
      showNotification(
        item.paid ? "تم تغيير الحالة إلى غير مدفوع" : "تم تغيير الحالة إلى مدفوع",
        "success"
      );
    } catch (error) {
      console.error("Error updating payment status:", error);
      showNotification("حدث خطأ أثناء تحديث حالة الدفع", "error");
    }
    setUpdating(null);
  };

  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + parseInt(item.quantity || 1), 0);
  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.sell_price || 0) * parseInt(item.quantity || 1)), 0);
  const paidItems = items.filter(item => item.paid).length;
  const unpaidItems = totalItems - paidItems;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingText}>جارٍ التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>تفاصيل الجلسة</h1>
      </div>



      {/* Summary Cards */}
      <div style={styles.summaryCards}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryCardTitle}>إجمالي الطلبات</div>
          <div style={styles.summaryCardValue}>{totalItems}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryCardTitle}>الكمية الإجمالية</div>
          <div style={styles.summaryCardValue}>{totalQuantity}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryCardTitle}>المبلغ الإجمالي</div>
          <div style={styles.summaryCardValue}>{totalAmount.toFixed(2)} ₪</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryCardTitle}>مدفوع / غير مدفوع</div>
          <div style={styles.summaryCardValue}>{paidItems} / {unpaidItems}</div>
        </div>
      </div>

      {/* Table */}
      {items.length > 0 ? (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.th}>المنتج</th>
                <th style={styles.th}>الكمية</th>
                <th style={styles.th}>سعر الوحدة</th>
                <th style={styles.th}>المبلغ الإجمالي</th>
                <th style={styles.th}>المصدر</th>
                <th style={styles.th}>حالة الدفع</th>
                <th style={styles.th}>تعديل</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr 
                  key={item.id} 
                  style={{
                    ...styles.tr,
                    ...(item.paid ? styles.trPaid : styles.trUnpaid)
                  }}
                >
                  <td style={styles.td}>
                    <strong>{item.name}</strong>
                  </td>
                  <td style={styles.td}>{item.quantity}</td>
                  <td style={styles.td}>{parseFloat(item.sell_price || 0).toFixed(2)} شيكل</td>
                  <td style={styles.td}>
                    <strong>
                      {(parseFloat(item.sell_price || 0) * parseInt(item.quantity || 1)).toFixed(2)} شيكل
                    </strong>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.sourceBadge,
                      ...(item.source === "inventory" ? styles.sourceBadgeInventory : styles.sourceBadgeCustom)
                    }}>
                      {item.source === "inventory" ? "من المخزن" : "مخصص"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      ...(item.paid ? styles.statusPaid : styles.statusUnpaid)
                    }}>
                      {item.paid ? "مدفوع" : "غير مدفوع"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => togglePaidStatus(item)}
                      style={{
                        ...styles.actionButton,
                        ...(updating === item.id ? styles.toggleDisabled :
                            item.paid ? styles.toggleToUnpaid : styles.toggleToPaid)
                      }}
                      disabled={updating === item.id}
                    >
                      {updating === item.id ? "جاري التحديث..." : "تغيير الحالة"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={styles.noData}>
          <p>لا توجد طلبات في هذه الجلسة</p>
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