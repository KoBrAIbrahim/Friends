/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  Timestamp,
  getDoc,
  deleteDoc
} from "firebase/firestore";
import { db } from "../../services/firebase";

export default function OrdersMainPage() {
  const [sessions, setSessions] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [products, setProducts] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [sessionOrders, setSessionOrders] = useState([]);
  const [addMode, setAddMode] = useState("inventory");
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customQuantity, setCustomQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [inventoryQuantities, setInventoryQuantities] = useState({});
  const [editingOrder, setEditingOrder] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [editedPrice, setEditedPrice] = useState("");
  const [editedQty, setEditedQty] = useState(1);

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
    topControls: {
      display: "flex",
      gap: "16px",
      marginBottom: "24px",
      alignItems: "center",
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "8px",
      border: "1px solid #e2e8f0"
    },
    input: {
      flex: 1,
      padding: "12px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      fontSize: "14px",
      backgroundColor: "white",
      outline: "none"
    },
    primaryButton: {
      padding: "12px 20px",
      backgroundColor: "#A2AF9B",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      whiteSpace: "nowrap",
      transition: "all 0.2s ease"
    },
    dangerButton: {
      padding: "12px 20px",
      backgroundColor: "#dc2626",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      whiteSpace: "nowrap",
      transition: "all 0.2s ease"
    },
    sessionsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: "16px"
    },
    sessionCard: {
      padding: "20px",
      borderRadius: "8px",
      cursor: "pointer",
      border: "2px solid",
      backgroundColor: "white",
      transition: "all 0.2s ease"
    },
    sessionCardPaid: {
      borderColor: "#A2AF9B"
    },
    sessionCardUnpaid: {
      borderColor: "#dc2626"
    },
    sessionTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#374151",
      marginBottom: "8px"
    },
    sessionTime: {
      fontSize: "14px",
      color: "#64748b",
      marginBottom: "16px"
    },
    sessionStatus: {
      padding: "8px",
      borderRadius: "6px",
      color: "white",
      textAlign: "center",
      fontSize: "14px",
      fontWeight: "600"
    },
    sessionStatusPaid: {
      backgroundColor: "#A2AF9B"
    },
    sessionStatusUnpaid: {
      backgroundColor: "#dc2626"
    },
    modal: {
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
      padding: "16px"
    },
    editModal: {
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1200,
      padding: "16px"
    },
    deleteModal: {
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1300,
      padding: "16px"
    },
    modalContent: {
      backgroundColor: "white",
      padding: "32px",
      borderRadius: "12px",
      width: "100%",
      maxWidth: "1000px",
      maxHeight: "90vh",
      overflowY: "auto",
      position: "relative",
      border: "1px solid #e2e8f0",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
    },
    editModalContent: {
      backgroundColor: "white",
      padding: "32px",
      borderRadius: "12px",
      width: "100%",
      maxWidth: "500px",
      position: "relative",
      border: "1px solid #e2e8f0",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
    },
    deleteModalContent: {
      backgroundColor: "white",
      padding: "32px",
      borderRadius: "12px",
      width: "100%",
      maxWidth: "400px",
      position: "relative",
      border: "1px solid #e2e8f0",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      textAlign: "center"
    },
    closeButton: {
      position: "absolute",
      top: "16px",
      right: "16px",
      background: "none",
      border: "none",
      fontSize: "24px",
      cursor: "pointer",
      color: "#64748b",
      padding: "8px",
      borderRadius: "4px",
      transition: "all 0.2s ease"
    },
    modalTitle: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#A2AF9B",
      marginBottom: "24px",
      paddingRight: "48px"
    },
    deleteModalTitle: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#dc2626",
      marginBottom: "16px"
    },
    deleteWarningIcon: {
      fontSize: "64px",
      marginBottom: "16px",
      color: "#dc2626"
    },
    deleteWarningText: {
      fontSize: "16px",
      color: "#64748b",
      marginBottom: "24px",
      lineHeight: "1.5"
    },
    divider: {
      border: "none",
      height: "1px",
      backgroundColor: "#e2e8f0",
      margin: "24px 0"
    },
    ordersList: {
      listStyle: "none",
      padding: 0,
      margin: 0
    },
    orderItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px",
      marginBottom: "8px",
      backgroundColor: "#f8fafc",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
      transition: "all 0.2s ease"
    },
    orderInfo: {
      flex: 1
    },
    orderName: {
      fontWeight: "600",
      color: "#374151",
      fontSize: "16px",
      marginBottom: "4px"
    },
    orderDetails: {
      color: "#64748b",
      fontSize: "14px"
    },
    orderActions: {
      display: "flex",
      gap: "8px",
      alignItems: "center"
    },
    statusPaid: {
      color: "#059669",
      fontWeight: "600",
      fontSize: "14px",
      padding: "4px 12px",
      backgroundColor: "#dcfce7",
      borderRadius: "6px"
    },
    statusUnpaid: {
      color: "#dc2626",
      fontWeight: "600",
      fontSize: "14px"
    },
    actionButton: {
      padding: "8px 12px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "600",
      transition: "all 0.2s ease"
    },
    payButton: {
      backgroundColor: "#dc2626",
      color: "white"
    },
    editButton: {
      backgroundColor: "#A2AF9B",
      color: "white"
    },
    deleteButton: {
      backgroundColor: "#6b7280",
      color: "white"
    },
    addOrderSection: {
      backgroundColor: "#f8fafc",
      padding: "24px",
      borderRadius: "12px",
      border: "2px dashed #A2AF9B",
      marginBottom: "24px"
    },
    addOrderHeader: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "20px"
    },
    addOrderTitle: {
      fontSize: "20px",
      fontWeight: "600",
      color: "#A2AF9B",
      margin: 0
    },
    addOrderIcon: {
      fontSize: "24px"
    },
    modeSelector: {
      display: "flex",
      gap: "8px",
      marginBottom: "24px",
      backgroundColor: "#f1f5f9",
      padding: "8px",
      borderRadius: "8px"
    },
    modeButton: {
      flex: 1,
      padding: "12px 16px",
      border: "none",
      borderRadius: "6px",
      backgroundColor: "white",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "600",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px"
    },
    modeButtonActive: {
      backgroundColor: "#A2AF9B",
      color: "white",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 8px rgba(162, 175, 155, 0.3)"
    },
    inventorySection: {
      backgroundColor: "white",
      borderRadius: "8px",
      padding: "20px",
      border: "1px solid #e2e8f0"
    },
    searchContainer: {
      position: "relative",
      marginBottom: "16px"
    },
    searchInput: {
      width: "95%",
      padding: "12px 16px 12px 40px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "14px",
      backgroundColor: "#f9fafb",
      outline: "none",
      transition: "all 0.2s ease"
    },
    searchIcon: {
      position: "absolute",
      left: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      fontSize: "16px",
      color: "#64748b"
    },
    inventoryGrid: {
      maxHeight: "300px",
      overflowY: "auto",
      paddingRight: "4px"
    },
    inventoryItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px",
      marginBottom: "8px",
      backgroundColor: "#f8fafc",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
      transition: "all 0.2s ease"
    },
    inventoryItemHover: {
      backgroundColor: "#f1f5f9",
      borderColor: "#A2AF9B",
      transform: "translateY(-1px)"
    },
    quantityControls: {
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    quantityInput: {
      width: "60px",
      padding: "6px 8px",
      border: "1px solid #d1d5db",
      borderRadius: "4px",
      textAlign: "center",
      fontSize: "14px",
      fontWeight: "600"
    },
    stockBadge: {
      padding: "2px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "600",
      backgroundColor: "#dcfce7",
      color: "#166534"
    },
    customSection: {
      backgroundColor: "white",
      borderRadius: "8px",
      padding: "20px",
      border: "1px solid #e2e8f0"
    },
    customForm: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr auto",
      gap: "12px",
      alignItems: "end"
    },
    customInput: {
      padding: "12px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      backgroundColor: "white",
      outline: "none",
      fontSize: "14px",
      transition: "all 0.2s ease"
    },
    orderSummary: {
      backgroundColor: "#f0f4f0",
      padding: "20px",
      borderRadius: "12px",
      marginTop: "24px",
      border: "2px solid #A2AF9B"
    },
    summaryHeader: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "16px"
    },
    summaryTitle: {
      fontWeight: "600",
      color: "#A2AF9B",
      fontSize: "18px",
      margin: 0
    },
    summaryIcon: {
      fontSize: "20px"
    },
    formGroup: {
      display: "flex",
      flexDirection: "column"
    },
    label: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "600",
      color: "#374151",
      fontSize: "14px"
    },
    buttonGroup: {
      display: "flex",
      gap: "12px",
      marginTop: "16px"
    },
    flexButton: {
      flex: 1
    },
    totalPrice: {
      fontSize: "16px",
      fontWeight: "700",
      color: "#A2AF9B",
      textAlign: "center",
      padding: "12px",
      backgroundColor: "white",
      borderRadius: "6px",
      marginBottom: "16px"
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (showAddOrderModal) fetchInventory();
  }, [showAddOrderModal]);

  useEffect(() => {
    if (selectedSession && showSessionModal) {
      fetchSessionOrders(selectedSession.id);
    }
  }, [selectedSession, showSessionModal]);

  const fetchSessions = async () => {
    const q = query(collection(db, "order_sessions"), where("is_closed", "==", false));
    const snap = await getDocs(q);
    const sessionsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const sessionsWithStatus = await Promise.all(
      sessionsData.map(async (session) => {
        const ordersSnap = await getDocs(
          query(collection(db, "order_items"), where("session_id", "==", session.id))
        );
        const orders = ordersSnap.docs.map(doc => doc.data());
        const allPaid = orders.length > 0 && orders.every(order => order.paid);
        return { ...session, allPaid };
      })
    );

    setSessions(sessionsWithStatus);
  };

  const fetchSessionOrders = async (sessionId) => {
    const q = query(collection(db, "order_items"), where("session_id", "==", sessionId));
    const snap = await getDocs(q);
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setSessionOrders(data);
  };

  const fetchInventory = async () => {
    const snap = await getDocs(collection(db, "inventory"));
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const mapQty = {};
    data.forEach(p => (mapQty[p.id] = 1));
    setProducts(data);
    setInventoryQuantities(mapQty);
  };

  const addNewSession = async () => {
    if (!newGroupName.trim()) return;
    await addDoc(collection(db, "order_sessions"), {
      name: newGroupName,
      created_at: Timestamp.now(),
      is_closed: false
    });
    setNewGroupName("");
    fetchSessions();
  };

  const closeAllSessions = async () => {
    setLoading(true);
    const q = query(collection(db, "order_sessions"), where("is_closed", "==", false));
    const snap = await getDocs(q);
    const updates = snap.docs.map((docSnap) =>
      updateDoc(doc(db, "order_sessions", docSnap.id), { is_closed: true })
    );
    await Promise.all(updates);
    fetchSessions();
    setLoading(false);
  };

  const addFromInventory = (product) => {
    const quantity = inventoryQuantities[product.id] || 1;
    const existingIndex = orderItems.findIndex(item => item.product_id === product.id);
    if (existingIndex !== -1) {
      const updatedItems = [...orderItems];
      updatedItems[existingIndex].quantity += Number(quantity);
      setOrderItems(updatedItems);
    } else {
      setOrderItems([...orderItems, {
        product_id: product.id,
        name: product.name,
        quantity: Number(quantity),
        sell_price: product.sell_price,
        source: "inventory",
        paid: false
      }]);
    }
  };

  const updateOrderPaid = async (orderId) => {
    await updateDoc(doc(db, "order_items", orderId), { paid: true });
    const updatedOrders = sessionOrders.map(order =>
      order.id === orderId ? { ...order, paid: true } : order
    );
    setSessionOrders(updatedOrders);
    const allPaid = updatedOrders.length > 0 && updatedOrders.every(order => order.paid);
    setSessions(prev =>
      prev.map(session =>
        session.id === selectedSession.id ? { ...session, allPaid } : session
      )
    );
  };

  const initiateDelete = (orderId, order) => {
    setOrderToDelete({ id: orderId, order });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;

    try {
      await deleteDoc(doc(db, "order_items", orderToDelete.id));
      
      if (orderToDelete.order.source === "inventory" && orderToDelete.order.product_id) {
        const itemRef = doc(db, "inventory", orderToDelete.order.product_id);
        const itemSnap = await getDoc(itemRef);
        if (itemSnap.exists()) {
          const currentQty = itemSnap.data().quantity;
          await updateDoc(itemRef, {
            quantity: currentQty + orderToDelete.order.quantity
          });
        }
      }
      
      await fetchSessionOrders(selectedSession.id);
      
      const updatedOrders = sessionOrders.filter(item => item.id !== orderToDelete.id);
      const allPaid = updatedOrders.length > 0 && updatedOrders.every(order => order.paid);
      setSessions(prev =>
        prev.map(session =>
          session.id === selectedSession.id ? { ...session, allPaid } : session
        )
      );
      
      setShowDeleteConfirm(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error("خطأ في حذف الطلب:", error);
      alert("حدث خطأ أثناء حذف الطلب");
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setOrderToDelete(null);
  };

  const startEditOrder = (order) => {
    setEditingOrder(order);
    setEditedName(order.name);
    setEditedPrice(order.sell_price.toString());
    setEditedQty(order.quantity);
    setShowEditModal(true);
  };

  const cancelEdit = () => {
    setEditingOrder(null);
    setEditedName("");
    setEditedPrice("");
    setEditedQty(1);
    setShowEditModal(false);
  };

  const saveOrderEdit = async () => {
    if (!editedName.trim() || !editedPrice || editedQty <= 0) {
      alert("يرجى ملء جميع الحقول بشكل صحيح");
      return;
    }

    try {
      const updatedData = {
        name: editedName.trim(),
        quantity: parseInt(editedQty),
        sell_price: parseFloat(editedPrice)
      };

      await updateDoc(doc(db, "order_items", editingOrder.id), updatedData);
      
      if (editingOrder.source === "inventory" && editingOrder.product_id) {
        const quantityDiff = editingOrder.quantity - parseInt(editedQty);
        if (quantityDiff !== 0) {
          const itemRef = doc(db, "inventory", editingOrder.product_id);
          const itemSnap = await getDoc(itemRef);
          if (itemSnap.exists()) {
            const currentQty = itemSnap.data().quantity;
            await updateDoc(itemRef, {
              quantity: currentQty + quantityDiff
            });
          }
        }
      }
      
      await fetchSessionOrders(selectedSession.id);
      cancelEdit();
    } catch (error) {
      console.error("خطأ في تحديث الطلب:", error);
      alert("حدث خطأ أثناء تحديث الطلب");
    }
  };

  const addCustomProduct = () => {
    if (!customName || !customPrice || customQuantity <= 0) return;
    setOrderItems([...orderItems, {
      product_id: null,
      name: customName,
      quantity: customQuantity,
      sell_price: parseFloat(customPrice),
      source: "custom",
      paid: false
    }]);
    setCustomName("");
    setCustomPrice("");
    setCustomQuantity(1);
  };

  const removeOrderItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const submitOrders = async () => {
    const batch = orderItems.map(async (item) => {
      await addDoc(collection(db, "order_items"), {
        session_id: selectedSession.id,
        ...item
      });
      if (item.source === "inventory") {
        const itemRef = doc(db, "inventory", item.product_id);
        const itemSnap = await getDoc(itemRef);
        const currentQty = itemSnap.data().quantity;
        await updateDoc(itemRef, {
          quantity: currentQty - item.quantity
        });
      }
    });
    await Promise.all(batch);

    const updatedOrders = [...sessionOrders, ...orderItems];
    setSessionOrders(updatedOrders);
    const allPaid = updatedOrders.length > 0 && updatedOrders.every(order => order.paid);
    setSessions(prev =>
      prev.map(session =>
        session.id === selectedSession.id ? { ...session, allPaid } : session
      )
    );

    setOrderItems([]);
    setShowAddOrderModal(false);
    fetchSessionOrders(selectedSession.id);
  };

  const totalOrderValue = orderItems.reduce((sum, item) => sum + (item.sell_price * item.quantity), 0);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>الطلبات اليومية</h1>
      </div>
      
      {/* Top Controls */}
      <div style={styles.topControls}>
        <input
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="اسم المجموعة أو الفرد"
          style={styles.input}
        />
        <button 
          onClick={addNewSession}
          style={styles.primaryButton}
        >
          إضافة مجموعة
        </button>
        <button 
          onClick={closeAllSessions} 
          disabled={loading}
          style={styles.dangerButton}
        >
          {loading ? "جاري الإنهاء..." : "إنهاء اليوم"}
        </button>
      </div>

      {/* Sessions Grid */}
      <div style={styles.sessionsGrid}>
        {sessions.map(session => (
          <div
            key={session.id}
            onClick={() => { setSelectedSession(session); setShowSessionModal(true); }}
            style={{
              ...styles.sessionCard,
              ...(session.allPaid ? styles.sessionCardPaid : styles.sessionCardUnpaid)
            }}
          >
            <h3 style={styles.sessionTitle}>{session.name}</h3>
            <p style={styles.sessionTime}>
              {new Date(session.created_at.seconds * 1000).toLocaleTimeString('ar')}
            </p>
            <div style={{
              ...styles.sessionStatus,
              ...(session.allPaid ? styles.sessionStatusPaid : styles.sessionStatusUnpaid)
            }}>
              {session.allPaid ? "مدفوع بالكامل" : "غير مكتمل الدفع"}
            </div>
          </div>
        ))}
      </div>

      {/* Session Orders Modal */}
      {showSessionModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <button 
              onClick={() => setShowSessionModal(false)} 
              style={styles.closeButton}
            >
              ×
            </button>
            <h2 style={styles.modalTitle}>الطلبات - {selectedSession?.name}</h2>
            
            <button 
              onClick={() => setShowAddOrderModal(true)} 
              style={styles.primaryButton}
            >
              ➕ إضافة طلب جديد
            </button>
            
            <hr style={styles.divider} />
            
            <h3 style={styles.summaryTitle}>الطلبات الحالية</h3>
            <ul style={styles.ordersList}>
              {sessionOrders.map((order) => (
                <li key={order.id} style={styles.orderItem}>
                  <div style={styles.orderInfo}>
                    <div style={styles.orderName}>{order.name}</div>
                    <div style={styles.orderDetails}>
                      الكمية: {order.quantity} • السعر: {order.sell_price} شيكل
                    </div>
                  </div>
                  <div style={styles.orderActions}>
                    {order.paid ? (
                      <span style={styles.statusPaid}>✅ مدفوع</span>
                    ) : (
                      <button
                        onClick={() => updateOrderPaid(order.id)}
                        style={{...styles.actionButton, ...styles.payButton}}
                      >
                        💰 تسديد
                      </button>
                    )}
                    <button 
                      onClick={() => startEditOrder(order)}
                      style={{...styles.actionButton, ...styles.editButton}}
                    >
                      ✏️ تعديل
                    </button>
                    <button 
                      onClick={() => initiateDelete(order.id, order)}
                      style={{...styles.actionButton, ...styles.deleteButton}}
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Add Order Modal - محسن */}
      {showAddOrderModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <button 
              onClick={() => setShowAddOrderModal(false)} 
              style={styles.closeButton}
            >
              ×
            </button>
            
            <div style={styles.addOrderSection}>
              <div style={styles.addOrderHeader}>
                <span style={styles.addOrderIcon}>🛒</span>
                <h2 style={styles.addOrderTitle}>إضافة طلبات جديدة</h2>
              </div>
              
              <div style={styles.modeSelector}>
                <button 
                  onClick={() => setAddMode("inventory")} 
                  style={{
                    ...styles.modeButton,
                    ...(addMode === "inventory" ? styles.modeButtonActive : {})
                  }}
                >
                  <span>📦</span>
                  من المخزن
                </button>
                <button 
                  onClick={() => setAddMode("custom")} 
                  style={{
                    ...styles.modeButton,
                    ...(addMode === "custom" ? styles.modeButtonActive : {})
                  }}
                >
                  <span>✨</span>
                  منتج مخصص
                </button>
              </div>
            </div>

            {addMode === "inventory" ? (
              <div style={styles.inventorySection}>
                <div style={styles.searchContainer}>
                  <input
                    type="text"
                    placeholder="🔍 البحث عن منتج..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                  />
                  <span style={styles.searchIcon}>🔍</span>
                </div>

                <div style={styles.inventoryGrid}>
                  {filteredProducts.map(p => (
                    <div 
                      key={p.id} 
                      style={styles.inventoryItem}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f1f5f9";
                        e.currentTarget.style.borderColor = "#A2AF9B";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#f8fafc";
                        e.currentTarget.style.borderColor = "#e2e8f0";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div>
                        <div style={styles.orderName}>{p.name}</div>
                        <div style={styles.orderDetails}>
                          💰 السعر: {p.sell_price} شيكل • 
                          <span style={styles.stockBadge}> 📦 متوفر: {p.quantity}</span>
                        </div>
                      </div>
                      <div style={styles.quantityControls}>
                        <input 
                          type="number" 
                          value={inventoryQuantities[p.id] || 1} 
                          min={1} 
                          max={p.quantity} 
                          onChange={(e) => setInventoryQuantities(prev => ({ 
                            ...prev, 
                            [p.id]: parseInt(e.target.value) 
                          }))} 
                          style={styles.quantityInput}
                        />
                        <button 
                          onClick={() => addFromInventory(p)}
                          style={styles.primaryButton}
                        >
                          ➕ إضافة
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={styles.customSection}>
                <div style={styles.customForm}>
                  <input 
                    placeholder="🏷️ اسم المنتج" 
                    value={customName} 
                    onChange={e => setCustomName(e.target.value)} 
                    style={styles.customInput}
                  />
                  <input 
                    type="number" 
                    placeholder="💰 السعر" 
                    value={customPrice} 
                    onChange={e => setCustomPrice(e.target.value)} 
                    style={styles.customInput}
                    step="0.01"
                    min="0"
                  />
                  <input 
                    type="number" 
                    placeholder="📊 الكمية" 
                    value={customQuantity} 
                    onChange={e => setCustomQuantity(Number(e.target.value))} 
                    style={styles.customInput}
                    min="1"
                  />
                  <button 
                    onClick={addCustomProduct}
                    style={styles.primaryButton}
                  >
                    ➕ إضافة
                  </button>
                </div>
              </div>
            )}

            {orderItems.length > 0 && (
              <div style={styles.orderSummary}>
                <div style={styles.summaryHeader}>
                  <span style={styles.summaryIcon}>🛍️</span>
                  <h3 style={styles.summaryTitle}>الطلبات المضافة ({orderItems.length})</h3>
                </div>
                
                <div style={styles.totalPrice}>
                  💰 إجمالي المبلغ: {totalOrderValue.toFixed(2)} شيكل
                </div>
                
                <ul style={styles.ordersList}>
                  {orderItems.map((item, idx) => (
                    <li key={idx} style={styles.orderItem}>
                      <div style={styles.orderInfo}>
                        <div style={styles.orderName}>{item.name}</div>
                        <div style={styles.orderDetails}>
                          📊 الكمية: {item.quantity} • 💰 السعر: {item.sell_price} شيكل
                        </div>
                      </div>
                      <button 
                        onClick={() => removeOrderItem(idx)} 
                        style={{...styles.actionButton, ...styles.deleteButton}}
                      >
                        🗑️ حذف
                      </button>
                    </li>
                  ))}
                </ul>
                
                <button 
                  onClick={submitOrders} 
                  style={{...styles.primaryButton, marginTop: "16px", width: "100%", fontSize: "16px", padding: "16px"}}
                >
                  ✅ إضافة جميع الطلبات ({orderItems.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && editingOrder && (
        <div style={styles.editModal}>
          <div style={styles.editModalContent}>
            <button 
              onClick={cancelEdit} 
              style={styles.closeButton}
            >
              ×
            </button>
            <h2 style={styles.modalTitle}>✏️ تعديل الطلب</h2>

            <div style={styles.editForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  🏷️ اسم المنتج:
                </label>
                <input 
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  style={{...styles.customInput, width: "100%"}}
                  placeholder="اسم المنتج"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  💰 السعر (شيكل):
                </label>
                <input 
                  type="number"
                  value={editedPrice}
                  onChange={(e) => setEditedPrice(e.target.value)}
                  style={{...styles.customInput, width: "100%"}}
                  placeholder="السعر"
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  📊 الكمية:
                </label>
                <input 
                  type="number"
                  value={editedQty}
                  onChange={(e) => setEditedQty(Number(e.target.value))}
                  style={{...styles.customInput, width: "100%"}}
                  placeholder="الكمية"
                  min="1"
                />
              </div>
              
              <div style={styles.buttonGroup}>
                <button 
                  onClick={saveOrderEdit}
                  style={{...styles.primaryButton, ...styles.flexButton}}
                >
                  ✅ حفظ التعديل
                </button>
                <button 
                  onClick={cancelEdit}
                  style={{...styles.dangerButton, ...styles.flexButton}}
                >
                  ❌ إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && orderToDelete && (
        <div style={styles.deleteModal}>
          <div style={styles.deleteModalContent}>
            <div style={styles.deleteWarningIcon}>⚠️</div>
            <h2 style={styles.deleteModalTitle}>تأكيد الحذف</h2>
            <div style={styles.deleteWarningText}>
              هل أنت متأكد من حذف طلب "<strong>{orderToDelete.order.name}</strong>"؟
              <br />
              <span style={{ color: "#dc2626", fontWeight: "600" }}>
                لا يمكن التراجع عن هذا الإجراء
              </span>
            </div>
            
            <div style={styles.buttonGroup}>
              <button 
                onClick={cancelDelete}
                style={{...styles.primaryButton, ...styles.flexButton}}
              >
                ❌ إلغاء
              </button>
              <button 
                onClick={confirmDelete}
                style={{...styles.dangerButton, ...styles.flexButton}}
              >
                🗑️ تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}