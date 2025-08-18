import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../services/firebase";

export default function AllSessionsPage() {
  const [workDays, setWorkDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkDay, setSelectedWorkDay] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // asc, desc
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchAllSessions = useCallback(async () => {
    setLoading(true);
    try {
      // Get all data concurrently
      const [billiardsSnap, orderSessionsSnap, orderItemsSnap, inventorySnap, tournamentsSnap, expensesSnap] = await Promise.all([
        getDocs(query(collection(db, "sessions"), orderBy("start_time", "desc"))),
        getDocs(query(collection(db, "order_sessions"), orderBy("created_at", "desc"))),
        getDocs(query(collection(db, "order_items"))),
        getDocs(query(collection(db, "inventory"))),
        getDocs(query(collection(db, "tournaments"), orderBy("created_at", "desc"))),
        getDocs(query(collection(db, "expenses"), orderBy("date", "desc")))
      ]);

      // Build inventory lookup
      const inventory = {};
      inventorySnap.forEach((doc) => {
        inventory[doc.id] = doc.data();
      });

      // Build order totals and items by session
      const orderTotals = {};
      const orderItemsGrouped = {};
      const orderProfits = {};
      
      orderItemsSnap.forEach((doc) => {
        const data = doc.data();
        const sessionId = data.session_id;
        const quantity = parseInt(data.quantity || 1);
        const sellPrice = parseFloat(data.sell_price || 0);
        const costPrice = parseFloat(inventory[data.product_id]?.price || 0);
        const itemTotal = sellPrice * quantity;
        const itemProfit = (sellPrice - costPrice) * quantity;
        
        if (!orderTotals[sessionId]) orderTotals[sessionId] = 0;
        if (!orderProfits[sessionId]) orderProfits[sessionId] = 0;
        orderTotals[sessionId] += itemTotal;
        orderProfits[sessionId] += itemProfit;
        
        if (!orderItemsGrouped[sessionId]) orderItemsGrouped[sessionId] = [];
        orderItemsGrouped[sessionId].push({
          ...data,
          productName: inventory[data.product_id]?.name || 'منتج غير معروف',
          total: itemTotal,
          profit: itemProfit
        });
      });

      // Group all activities by work day (using consistent date grouping to avoid duplicates)
      const workDayGroups = {};

      // Helper function to determine work session date
      // If activity happens before 6 AM, it belongs to the previous work day
      const getWorkSessionDate = (date) => {
        const d = new Date(date);
        const hour = d.getHours();
        
        // If it's before 6 AM, consider it part of the previous day's work session
        if (hour < 6) {
          const workDate = new Date(d);
          workDate.setDate(workDate.getDate() - 1);
          return workDate;
        }
        
        return d;
      };

      // Helper function to create consistent work day key based on work session
      const getWorkDayKey = (date) => {
        const workDate = getWorkSessionDate(date);
        return `${workDate.getFullYear()}-${String(workDate.getMonth() + 1).padStart(2, '0')}-${String(workDate.getDate()).padStart(2, '0')}`;
      };

      // Helper function to initialize work day group
      const initializeWorkDay = (date) => {
        const workDate = getWorkSessionDate(date);
        return {
          date: new Date(workDate.getFullYear(), workDate.getMonth(), workDate.getDate()),
          dateKey: getWorkDayKey(date),
          billiardsSessions: [],
          orderSessions: [],
          tournaments: [],
          expenses: [],
          totalRevenue: 0,
          totalProfit: 0,
          billiardsRevenue: 0,
          billiardsProfit: 0, // Billiards is pure profit
          ordersRevenue: 0,
          ordersProfit: 0,
          tournamentsRevenue: 0,
          tournamentsProfit: 0,
          totalExpenses: 0,
          unpaidBilliards: 0,
          activeOrders: 0
        };
      };

      // Process billiards sessions
      billiardsSnap.forEach((doc) => {
        const data = doc.data();
        const startTime = data.start_time?.toDate?.() || new Date(data.start_time);
        const endTime = data.end_time?.toDate?.() || new Date(data.end_time);
        
        const workDayKey = getWorkDayKey(startTime);
        
        if (!workDayGroups[workDayKey]) {
          workDayGroups[workDayKey] = initializeWorkDay(startTime);
        }

        const billiardsRevenue = parseFloat(data.total_price || 0);
        const billiardsProfit = billiardsRevenue; // Billiards is pure profit (no cost)
        
        workDayGroups[workDayKey].billiardsSessions.push({
          id: doc.id,
          startTime,
          endTime,
          revenue: billiardsRevenue,
          profit: billiardsProfit,
          duration: endTime && startTime ? Math.round((endTime - startTime) / (1000 * 60)) : 0,
          tableNumber: data.table_number || 'غير محدد',
          isPaid: data.pay_status || false,
          customerName: `طاولة ${data.table_number || '؟'}`,
          docRef: doc.ref
        });

        workDayGroups[workDayKey].billiardsRevenue += billiardsRevenue;
        workDayGroups[workDayKey].billiardsProfit += billiardsProfit;
        workDayGroups[workDayKey].totalRevenue += billiardsRevenue;
        
        if (!data.pay_status) {
          workDayGroups[workDayKey].unpaidBilliards++;
        }
      });

      // Process order sessions
      orderSessionsSnap.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.created_at?.toDate?.() || new Date(data.created_at);
        
        const workDayKey = getWorkDayKey(createdAt);
        
        if (!workDayGroups[workDayKey]) {
          workDayGroups[workDayKey] = initializeWorkDay(createdAt);
        }

        const orderRevenue = orderTotals[doc.id] || 0;
        const orderProfit = orderProfits[doc.id] || 0;
        
        workDayGroups[workDayKey].orderSessions.push({
          id: doc.id,
          createdAt,
          revenue: orderRevenue,
          profit: orderProfit,
          isClosed: data.is_closed || false,
          customerName: data.name || 'عميل بدون اسم',
          items: orderItemsGrouped[doc.id] || [],
          docRef: doc.ref
        });

        workDayGroups[workDayKey].ordersRevenue += orderRevenue;
        workDayGroups[workDayKey].ordersProfit += orderProfit;
        workDayGroups[workDayKey].totalRevenue += orderRevenue;
        
        if (!data.is_closed) {
          workDayGroups[workDayKey].activeOrders++;
        }
      });

      // Process tournaments
      tournamentsSnap.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.created_at?.toDate?.() || new Date(data.created_at);
        
        const workDayKey = getWorkDayKey(createdAt);
        
        if (!workDayGroups[workDayKey]) {
          workDayGroups[workDayKey] = initializeWorkDay(createdAt);
        }

        const subscriptionFee = parseFloat(data.subscriptionFee || 0);
        const participants = data.participants || [];
        const paidParticipants = participants.filter(p => p.paid).length;
        const prizes = data.prizes || [];
        const totalPrizes = prizes.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const tournamentRevenue = paidParticipants * subscriptionFee;
        const tournamentProfit = tournamentRevenue - totalPrizes;

        workDayGroups[workDayKey].tournaments.push({
          id: doc.id,
          name: data.name || 'بطولة بدون اسم',
          createdAt,
          revenue: tournamentRevenue,
          profit: tournamentProfit,
          participants: paidParticipants,
          totalPrizes
        });

        workDayGroups[workDayKey].tournamentsRevenue += tournamentRevenue;
        workDayGroups[workDayKey].tournamentsProfit += tournamentProfit;
        workDayGroups[workDayKey].totalRevenue += tournamentRevenue;
      });

      // Process expenses
      expensesSnap.forEach((doc) => {
        const data = doc.data();
        const expenseDate = data.date?.toDate?.() || new Date(data.date);
        
        const workDayKey = getWorkDayKey(expenseDate);
        
        if (!workDayGroups[workDayKey]) {
          workDayGroups[workDayKey] = initializeWorkDay(expenseDate);
        }

        const expenseAmount = parseFloat(data.amount || 0);
        
        workDayGroups[workDayKey].expenses.push({
          id: doc.id,
          description: data.description || 'مصروف',
          amount: expenseAmount,
          date: expenseDate,
          category: data.category || 'عام'
        });

        workDayGroups[workDayKey].totalExpenses += expenseAmount;
      });

      // Calculate total profit for each work day (Revenue - Expenses)
      Object.values(workDayGroups).forEach(workDay => {
        workDay.totalProfit = workDay.billiardsProfit + workDay.ordersProfit + workDay.tournamentsProfit - workDay.totalExpenses;
        
        // Check if this work day has activities that span across calendar days
        workDay.hasSpanningActivities = false;
        
        // Check billiards sessions
        workDay.billiardsSessions.forEach(session => {
          if (session.startTime && session.endTime) {
            const startDate = session.startTime.toDateString();
            const endDate = session.endTime.toDateString();
            if (startDate !== endDate) {
              workDay.hasSpanningActivities = true;
            }
          }
        });
        
        // Check if any late-night activities (before 6 AM) exist
        const allActivities = [
          ...workDay.billiardsSessions.map(s => s.startTime),
          ...workDay.orderSessions.map(s => s.createdAt),
          ...workDay.tournaments.map(t => t.createdAt),
          ...workDay.expenses.map(e => e.date)
        ];
        
        allActivities.forEach(activityDate => {
          if (activityDate && activityDate.getHours() < 6) {
            workDay.hasSpanningActivities = true;
          }
        });
      });

      // Convert to array and sort
      const workDaysArray = Object.values(workDayGroups).sort((a, b) => 
        sortOrder === "desc" ? b.date - a.date : a.date - b.date
      );

      setWorkDays(workDaysArray);
    } catch (error) {
      console.error("Error fetching work days:", error);
    }
    setLoading(false);
  }, [sortOrder]);

  useEffect(() => {
    fetchAllSessions();
  }, [fetchAllSessions]);

  useEffect(() => {
    fetchAllSessions();
  }, [sortOrder, fetchAllSessions]);

  const getFilteredWorkDays = () => {
    let filtered = workDays;

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(workDay =>
        workDay.dateKey.includes(searchTerm) ||
        workDay.date.toLocaleDateString('ar-EG').includes(searchTerm)
      );
    }

    return filtered;
  };

  const viewWorkDayDetails = (workDay) => {
    setSelectedWorkDay(workDay);
    setShowDetailsModal(true);
  };

  const updateSessionPayment = async (sessionId, isPaid) => {
    try {
      const sessionRef = doc(db, "sessions", sessionId);
      await updateDoc(sessionRef, { pay_status: isPaid });
      
      // Refresh data to get updated state
      fetchAllSessions();
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };

  const deleteSession = async (sessionId, type) => {
    if (!confirm("هل أنت متأكد من حذف هذه الجلسة؟")) return;

    try {
      const collection_name = type === "billiards" ? "sessions" : "order_sessions";
      await deleteDoc(doc(db, collection_name, sessionId));
      
      // If it's an order session, also delete related order items
      if (type === "orders") {
        const orderItemsSnap = await getDocs(query(collection(db, "order_items")));
        const deletePromises = [];
        orderItemsSnap.forEach((doc) => {
          if (doc.data().session_id === sessionId) {
            deletePromises.push(deleteDoc(doc.ref));
          }
        });
        await Promise.all(deletePromises);
      }
      
      // Refresh data
      fetchAllSessions();
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  const filteredWorkDays = getFilteredWorkDays();

  return (
    <div style={{ padding: "20px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{
        backgroundColor: "white",
        padding: "24px",
        marginBottom: "20px",
        borderLeft: "4px solid #A2AF9B"
      }}>
        <h1 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "28px", fontWeight: "700" }}>
          📊 إدارة أيام العمل
        </h1>
        <p style={{ margin: 0, color: "#64748b", fontSize: "16px" }}>
          عرض وإدارة جميع أيام العمل مع إحصائيات شاملة للأرباح والمصاريف
        </p>
        <div style={{
          marginTop: "12px",
          padding: "8px 16px",
          backgroundColor: "#f0f4f0",
          borderRadius: "6px",
          fontSize: "12px",
          color: "#64748b"
        }}>
          💡 <strong>ملاحظة:</strong> الأنشطة قبل الساعة 6 صباحاً تُحسب ضمن يوم العمل السابق
        </div>
      </div>

      {/* Controls */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "24px",
        border: "1px solid #e2e8f0",
        display: "flex",
        gap: "16px",
        alignItems: "end",
        flexWrap: "wrap"
      }}>
        <div style={{ flex: "1", minWidth: "200px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
            البحث بالتاريخ
          </label>
          <input
            type="text"
            placeholder="ابحث بالتاريخ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
            ترتيب التواريخ
          </label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{ padding: "12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
          >
            <option value="desc">الأحدث أولاً</option>
            <option value="asc">الأقدم أولاً</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "24px",
        border: "1px solid #e2e8f0",
        textAlign: "center"
      }}>
        <strong>{filteredWorkDays.length}</strong> يوم عمل • 
        إجمالي الإيرادات: <strong>
          {filteredWorkDays.reduce((sum, day) => sum + day.totalRevenue, 0).toFixed(2)} ₪
        </strong> • 
        إجمالي الأرباح: <strong>
          {filteredWorkDays.reduce((sum, day) => sum + day.totalProfit, 0).toFixed(2)} ₪
        </strong>
      </div>

      {/* Work Days Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px" }}>
          <div style={{ fontSize: "18px", color: "#64748b" }}>جاري تحميل أيام العمل...</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "24px" }}>
          {filteredWorkDays.map((workDay) => (
            <div key={workDay.dateKey} style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "28px",
              border: "1px solid #e2e8f0",
              transition: "all 0.3s ease",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              position: "relative",
              overflow: "hidden"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.12)";
              e.currentTarget.style.borderColor = "#A2AF9B";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.05)";
              e.currentTarget.style.borderColor = "#e2e8f0";
            }}>
              {/* Work Day Header */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                paddingBottom: "16px",
                borderBottom: "1px solid #f1f5f9"
              }}>
                <div>
                  <h2 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "24px" }}>
                    📅 {workDay.date.toLocaleDateString('ar-EG', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                    {workDay.hasSpanningActivities && (
                      <span style={{
                        marginRight: "8px",
                        padding: "4px 8px",
                        backgroundColor: "#fef3c7",
                        color: "#d97706",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "600"
                      }}>
                        🌙 جلسة ممتدة
                      </span>
                    )}
                  </h2>
                  <div style={{ display: "flex", gap: "12px", fontSize: "13px", color: "#64748b", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ 
                      padding: "6px 12px",
                      backgroundColor: "#f1f5f9",
                      borderRadius: "8px",
                      fontWeight: "500",
                      border: "1px solid #e2e8f0"
                    }}>
                      🎱 {workDay.billiardsSessions.length} بلياردو
                    </span>
                    <span style={{ 
                      padding: "6px 12px",
                      backgroundColor: "#f1f5f9",
                      borderRadius: "8px",
                      fontWeight: "500",
                      border: "1px solid #e2e8f0"
                    }}>
                      🛒 {workDay.orderSessions.length} طلبات
                    </span>
                    {workDay.tournaments.length > 0 && (
                      <span style={{ 
                        padding: "6px 12px",
                        backgroundColor: "#f1f5f9",
                        borderRadius: "8px",
                        fontWeight: "500",
                        border: "1px solid #e2e8f0"
                      }}>
                        🏆 {workDay.tournaments.length} بطولات
                      </span>
                    )}
                    {workDay.expenses.length > 0 && (
                      <span style={{ 
                        padding: "6px 12px",
                        backgroundColor: "#f1f5f9",
                        borderRadius: "8px",
                        fontWeight: "500",
                        border: "1px solid #e2e8f0"
                      }}>
                        💸 {workDay.expenses.length} مصاريف
                      </span>
                    )}
                    {workDay.unpaidBilliards > 0 && (
                      <span style={{ 
                        padding: "6px 12px",
                        backgroundColor: "#fef2f2",
                        color: "#dc2626",
                        borderRadius: "8px",
                        fontWeight: "600",
                        border: "1px solid rgba(220, 38, 38, 0.2)"
                      }}>
                        ❌ {workDay.unpaidBilliards} غير مدفوع
                      </span>
                    )}
                    {workDay.activeOrders > 0 && (
                      <span style={{ 
                        padding: "6px 12px",
                        backgroundColor: "#f0fdf4",
                        color: "#059669",
                        borderRadius: "8px",
                        fontWeight: "600",
                        border: "1px solid rgba(5, 150, 105, 0.2)"
                      }}>
                        🔄 {workDay.activeOrders} نشط
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ 
                  textAlign: "right",
                  padding: "20px",
                  background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
                }}>
                  <div style={{ fontSize: "32px", fontWeight: "700", color: "#A2AF9B", marginBottom: "8px" }}>
                    {workDay.totalRevenue.toFixed(0)} ₪
                  </div>
                  <div style={{ fontSize: "14px", color: "#64748b", fontWeight: "600", marginBottom: "8px" }}>
                    إجمالي الإيرادات
                  </div>
                  {workDay.totalProfit > 0 && (
                    <div style={{ 
                      fontSize: "16px", 
                      color: "#059669", 
                      fontWeight: "600",
                      padding: "8px 12px",
                      backgroundColor: "#f0fdf4",
                      borderRadius: "8px",
                      border: "1px solid rgba(34, 197, 94, 0.1)"
                    }}>
                      صافي ربح: {workDay.totalProfit.toFixed(0)} ₪
                    </div>
                  )}
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "16px",
                marginBottom: "24px"
              }}>
                <div style={{
                  background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                  padding: "16px",
                  borderRadius: "12px",
                  textAlign: "center",
                  boxShadow: "0 3px 10px rgba(59, 130, 246, 0.15)",
                  border: "1px solid rgba(59, 130, 246, 0.1)"
                }}>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "#1e40af", marginBottom: "4px" }}>
                    {workDay.billiardsRevenue.toFixed(0)} ₪
                  </div>
                  <div style={{ fontSize: "12px", color: "#1e40af", fontWeight: "600" }}>🎱 بلياردو</div>
                </div>
                
                <div style={{
                  background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                  padding: "16px",
                  borderRadius: "12px",
                  textAlign: "center",
                  boxShadow: "0 3px 10px rgba(34, 197, 94, 0.15)",
                  border: "1px solid rgba(34, 197, 94, 0.1)"
                }}>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "#166534", marginBottom: "4px" }}>
                    {workDay.ordersRevenue.toFixed(0)} ₪
                  </div>
                  <div style={{ fontSize: "12px", color: "#166534", fontWeight: "600" }}>🛒 طلبات</div>
                </div>

                {workDay.tournamentsRevenue > 0 && (
                  <div style={{
                    background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                    padding: "16px",
                    borderRadius: "12px",
                    textAlign: "center",
                    boxShadow: "0 3px 10px rgba(217, 119, 6, 0.15)",
                    border: "1px solid rgba(217, 119, 6, 0.1)"
                  }}>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: "#d97706", marginBottom: "4px" }}>
                      {workDay.tournamentsRevenue.toFixed(0)} ₪
                    </div>
                    <div style={{ fontSize: "12px", color: "#d97706", fontWeight: "600" }}>🏆 بطولات</div>
                  </div>
                )}

                {workDay.totalExpenses > 0 && (
                  <div style={{
                    background: "linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)",
                    padding: "16px",
                    borderRadius: "12px",
                    textAlign: "center",
                    boxShadow: "0 3px 10px rgba(220, 38, 38, 0.15)",
                    border: "1px solid rgba(220, 38, 38, 0.1)"
                  }}>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: "#dc2626", marginBottom: "4px" }}>
                      -{workDay.totalExpenses.toFixed(0)} ₪
                    </div>
                    <div style={{ fontSize: "12px", color: "#dc2626", fontWeight: "600" }}>💸 مصاريف</div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => viewWorkDayDetails(workDay)}
                  style={{
                    background: "linear-gradient(135deg, #A2AF9B 0%, #8FA288 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    padding: "14px 28px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 12px rgba(162, 175, 155, 0.25)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 20px rgba(162, 175, 155, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 12px rgba(162, 175, 155, 0.25)";
                  }}
                >
                  🔍 عرض التفاصيل والإحصائيات
                </button>
              </div>
            </div>
          ))}

          {filteredWorkDays.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
              <div style={{ fontSize: "18px", marginBottom: "8px" }}>لا توجد أيام عمل</div>
              <div>ابدأ جلسة عمل جديدة لرؤية البيانات هنا</div>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedWorkDay && (
        <WorkDayDetailsModal
          workDay={selectedWorkDay}
          onClose={() => setShowDetailsModal(false)}
          onUpdatePayment={updateSessionPayment}
          onDeleteSession={deleteSession}
        />
      )}
    </div>
  );
}

// Details Modal Component
function WorkDayDetailsModal({ workDay, onClose, onUpdatePayment, onDeleteSession }) {
  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  };

  const modalContentStyle = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '900px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
  };

  const sectionStyle = {
    marginBottom: '32px'
  };

  const sessionItemStyle = {
    padding: '16px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    marginBottom: '12px',
    backgroundColor: '#fafafa'
  };

  const buttonStyle = {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
    backgroundColor: 'white',
    marginLeft: '8px'
  };

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          paddingBottom: '16px',
          borderBottom: '2px solid #e2e8f0'
        }}>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '28px' }}>
            📊 تفاصيل يوم العمل
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '32px',
              cursor: 'pointer',
              padding: '8px',
              color: '#64748b'
            }}
          >
            ×
          </button>
        </div>

        {/* Work Day Info */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '24px' }}>
            📅 {workDay.date.toLocaleDateString('ar-EG', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            marginTop: '20px'
          }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#A2AF9B' }}>
                {workDay.totalRevenue.toFixed(2)} ₪
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>إجمالي الإيرادات</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669' }}>
                {workDay.totalProfit.toFixed(2)} ₪
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>صافي الأرباح</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e40af' }}>
                {workDay.billiardsSessions.length}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>جلسات بلياردو</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#166534' }}>
                {workDay.orderSessions.length}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>جلسات طلبات</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#d97706' }}>
                {workDay.tournaments.length}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>بطولات</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>
                {workDay.expenses.length}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>مصاريف</div>
            </div>
          </div>
        </div>

        {/* Billiards Sessions */}
        {workDay.billiardsSessions.length > 0 && (
          <div style={sectionStyle}>
            <h4 style={{ color: '#1e293b', fontSize: '20px', marginBottom: '16px' }}>
              🎱 جلسات البلياردو ({workDay.billiardsSessions.length})
            </h4>
            {workDay.billiardsSessions.map((session, ) => (
              <div key={session.id} style={sessionItemStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{session.customerName}</strong>
                    <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                      {session.startTime.toLocaleString('ar-EG')}
                      {session.endTime && ` - ${session.endTime.toLocaleString('ar-EG')}`}
                      {session.startTime && session.endTime && 
                       session.startTime.toDateString() !== session.endTime.toDateString() && (
                        <span style={{
                          marginRight: "8px",
                          padding: "2px 6px",
                          backgroundColor: "#fef3c7",
                          color: "#d97706",
                          borderRadius: "3px",
                          fontSize: "10px",
                          fontWeight: "600"
                        }}>
                          عبر يومين
                        </span>
                      )}
                    </div>
                    {session.duration > 0 && (
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        المدة: {session.duration} دقيقة
                      </div>
                    )}
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#A2AF9B' }}>
                      {session.revenue.toFixed(2)} ₪
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: session.isPaid ? '#059669' : '#dc2626',
                      marginBottom: '8px'
                    }}>
                      {session.isPaid ? '✅ مدفوع' : '❌ غير مدفوع'}
                    </div>
                    
                    <div>
                      <button
                        onClick={() => onUpdatePayment(session.id, !session.isPaid)}
                        style={{
                          ...buttonStyle,
                          backgroundColor: session.isPaid ? '#fef2f2' : '#f0fdf4',
                          color: session.isPaid ? '#dc2626' : '#166534',
                          borderColor: session.isPaid ? '#fecaca' : '#bbf7d0'
                        }}
                      >
                        {session.isPaid ? '❌ إلغاء الدفع' : '✅ تأكيد الدفع'}
                      </button>
                      
                      <button
                        onClick={() => onDeleteSession(session.id, 'billiards')}
                        style={{
                          ...buttonStyle,
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          borderColor: '#fecaca'
                        }}
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Sessions */}
        {workDay.orderSessions.length > 0 && (
          <div style={sectionStyle}>
            <h4 style={{ color: '#1e293b', fontSize: '20px', marginBottom: '16px' }}>
              🛒 جلسات الطلبات ({workDay.orderSessions.length})
            </h4>
            {workDay.orderSessions.map((session, ) => (
              <div key={session.id} style={sessionItemStyle}>
                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{session.customerName}</strong>
                    <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                      {session.createdAt.toLocaleString('ar-EG')}
                      {session.createdAt.getHours() < 6 && (
                        <span style={{
                          marginRight: "8px",
                          padding: "2px 6px",
                          backgroundColor: "#e0e7ff",
                          color: "#3730a3",
                          borderRadius: "3px",
                          fontSize: "10px",
                          fontWeight: "600"
                        }}>
                          🌙 متأخر
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#A2AF9B' }}>
                      {session.revenue.toFixed(2)} ₪
                    </div>
                    <div style={{ fontSize: '14px', color: '#059669' }}>
                      ربح: {session.profit.toFixed(2)} ₪
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: session.isClosed ? '#059669' : '#dc2626',
                      marginBottom: '8px'
                    }}>
                      {session.isClosed ? '✅ مغلق' : '🔄 نشط'}
                    </div>
                    
                    <button
                      onClick={() => onDeleteSession(session.id, 'orders')}
                      style={{
                        ...buttonStyle,
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        borderColor: '#fecaca'
                      }}
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>
                
                {session.items.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                      المنتجات ({session.items.length}):
                    </div>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {session.items.map((item, itemIndex) => (
                        <div key={itemIndex} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          backgroundColor: 'white',
                          borderRadius: '4px',
                          marginBottom: '4px',
                          fontSize: '14px'
                        }}>
                          <span>{item.productName} × {item.quantity}</span>
                          <span style={{ color: '#A2AF9B', fontWeight: '600' }}>
                            {item.total.toFixed(2)} ₪
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tournaments */}
        {workDay.tournaments.length > 0 && (
          <div style={sectionStyle}>
            <h4 style={{ color: '#1e293b', fontSize: '20px', marginBottom: '16px' }}>
              🏆 البطولات ({workDay.tournaments.length})
            </h4>
            {workDay.tournaments.map((tournament, ) => (
              <div key={tournament.id} style={sessionItemStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{tournament.name}</strong>
                    <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                      {tournament.createdAt.toLocaleString('ar-EG')}
                      {tournament.createdAt.getHours() < 6 && (
                        <span style={{
                          marginRight: "8px",
                          padding: "2px 6px",
                          backgroundColor: "#e0e7ff",
                          color: "#3730a3",
                          borderRadius: "3px",
                          fontSize: "10px",
                          fontWeight: "600"
                        }}>
                          🌙 متأخر
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      المشاركين المدفوعين: {tournament.participants}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#A2AF9B' }}>
                      {tournament.revenue.toFixed(2)} ₪
                    </div>
                    <div style={{ fontSize: '14px', color: '#059669' }}>
                      ربح: {tournament.profit.toFixed(2)} ₪
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      جوائز: {tournament.totalPrizes.toFixed(2)} ₪
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Expenses */}
        {workDay.expenses.length > 0 && (
          <div style={sectionStyle}>
            <h4 style={{ color: '#1e293b', fontSize: '20px', marginBottom: '16px' }}>
              💸 المصاريف ({workDay.expenses.length})
            </h4>
            {workDay.expenses.map((expense, ) => (
              <div key={expense.id} style={sessionItemStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{expense.description}</strong>
                    <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                      {expense.date.toLocaleString('ar-EG')}
                      {expense.date.getHours() < 6 && (
                        <span style={{
                          marginRight: "8px",
                          padding: "2px 6px",
                          backgroundColor: "#e0e7ff",
                          color: "#3730a3",
                          borderRadius: "3px",
                          fontSize: "10px",
                          fontWeight: "600"
                        }}>
                          🌙 متأخر
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      الفئة: {expense.category}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#dc2626' }}>
                      -{expense.amount.toFixed(2)} ₪
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Close Button */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#A2AF9B',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
