/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
} from "firebase/firestore";
import { db } from "../services/firebase";

export default function MainPage() {
  const [filter, setFilter] = useState("today");
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersProfitTotal, setOrdersProfitTotal] = useState(0);
  const [billiardsTotal, setBilliardsTotal] = useState(0);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionOrderTotals, setSessionOrderTotals] = useState({});
  const [sessionOrderProfits, setSessionOrderProfits] = useState({});
  const [tournamentTotal, setTournamentTotal] = useState(0);
  const [expensesTotal, setExpensesTotal] = useState(0);

  const now = new Date();
  let from = new Date();
  let to = new Date();

  if (filter === "today") {
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
  } else if (filter === "week") {
    const firstDay = new Date();
    firstDay.setDate(now.getDate() - 6);
    from = new Date(firstDay.setHours(0, 0, 0, 0));
    to.setHours(23, 59, 59, 999);
  } else if (filter === "month") {
    const firstDay = new Date();
    firstDay.setDate(now.getDate() - 29);
    from = new Date(firstDay.setHours(0, 0, 0, 0));
    to.setHours(23, 59, 59, 999);
  } else if (filter === "custom" && customFrom) {
    from = new Date(customFrom);
    from.setHours(0, 0, 0, 0);
    if (customTo) {
      to = new Date(customTo);
      to.setHours(23, 59, 59, 999);
    } else {
      to = new Date(customFrom);
      to.setHours(23, 59, 59, 999);
    }
  }

  useEffect(() => {
    fetchData();
  }, [filter, customFrom, customTo]);

  useEffect(() => {
    fetchOrderItemsTotal();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
   await Promise.all([fetchOrdersTotal(), fetchBilliardsTotal(), fetchTournamentsFinancials(),fetchExpensesTotal(),]);

    setIsLoading(false);
  };

  const fetchExpensesTotal = async () => {
  try {
    const q = query(collection(db, "expenses"));
    const snap = await getDocs(q);
    let total = 0;

    snap.forEach((doc) => {
      const data = doc.data();
      // نستخدم حقل "date" من صفحة المصاريف (Timestamp)
      const d = data.date?.toDate?.() || new Date(data.date);
      if (d >= from && d <= to) {
        total += Number(data.amount || 0);
      }
    });

    setExpensesTotal(total);
  } catch (e) {
    console.error("Error fetching expenses:", e);
  }
};


  const fetchOrdersTotal = async () => {
    try {
      const q = query(collection(db, "order_sessions"));
      const snapshot = await getDocs(q);
      let total = 0;
      let profit = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.created_at?.toDate?.() || new Date(data.created_at);
        if (createdAt >= from && createdAt <= to && data.is_closed) {
          const sessionId = doc.id;
          total += sessionOrderTotals[sessionId] || 0;
          profit += sessionOrderProfits[sessionId] || 0;
        }
      });

      setOrdersTotal(total);
      setOrdersProfitTotal(profit);
    } catch (error) {
      console.error("Error fetching order sessions:", error);
    }
  };

  const fetchOrderItemsTotal = async () => {
    try {
      // First, get all inventory items to have price lookup
      const inventoryQuery = query(collection(db, "inventory"));
      const inventorySnap = await getDocs(inventoryQuery);
      const inventoryPrices = {};
      
      inventorySnap.forEach((doc) => {
        const data = doc.data();
        inventoryPrices[doc.id] = {
          price: parseFloat(data.price || 0),
          sell_price: parseFloat(data.sell_price || 0)
        };
      });

      // Then get order items
      const orderItemsQuery = query(collection(db, "order_items"));
      const orderItemsSnap = await getDocs(orderItemsQuery);
      const totals = {};
      const profits = {};
      
      orderItemsSnap.forEach((doc) => {
        const data = doc.data();
        const sessionId = data.session_id;
        const productId = data.product_id;
        const quantity = parseInt(data.quantity || 1);
        
        // Get sell_price from order_items (actual selling price)
        const sellPrice = parseFloat(data.sell_price || 0);
        
        // Get original price from inventory
        const originalPrice = inventoryPrices[productId]?.price || 0;
        
        const itemTotal = sellPrice * quantity;
        const itemProfit = (sellPrice - originalPrice) * quantity;
        
        if (!totals[sessionId]) totals[sessionId] = 0;
        if (!profits[sessionId]) profits[sessionId] = 0;
        
        totals[sessionId] += itemTotal;
        profits[sessionId] += itemProfit;
      });
      
      setSessionOrderTotals(totals);
      setSessionOrderProfits(profits);
    } catch (error) {
      console.error("Error fetching order items total:", error);
    }
  };

  const fetchBilliardsTotal = async () => {
    try {
      const q = query(collection(db, "sessions"));
      const snap = await getDocs(q);
      let total = 0;
      snap.forEach((doc) => {
        const data = doc.data();
        const start = data.start_time?.toDate?.() || new Date(data.start_time);
        if (start >= from && start <= to && data.pay_status) {
          total += parseFloat(data.total_price || 0);
        }
      });
      setBilliardsTotal(total);
    } catch (e) {
      console.error("Error fetching billiards sessions:", e);
    }
  };

  const fetchTournamentsFinancials = async () => {
  try {
    const snap = await getDocs(collection(db, "tournaments"));
    let total = 0;

    snap.forEach(doc => {
      const data = doc.data();
      const createdAt = data.created_at?.toDate?.() || new Date(data.created_at);
      if (createdAt >= from && createdAt <= to) {
        const subscriptionFee = Number(data.subscriptionFee || 0);
        const participants = data.participants || [];
        const paidParticipants = participants.filter(p => p.paid).length;
        const prizes = data.prizes || [];
        const totalPrizes = prizes.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const income = paidParticipants * subscriptionFee;
        const profit = income - totalPrizes;
        total += profit;
      }
    });

    setTournamentTotal(total);
  } catch (error) {
    console.error("Error fetching tournaments financials:", error);
  }
};


  const getFilterDisplayName = () => {
    switch (filter) {
      case "today": return "اليوم";
      case "week": return "آخر أسبوع";
      case "month": return "آخر شهر";
      case "custom": return customFrom && customTo ? `${customFrom} - ${customTo}` : "مخصص";
      default: return "اليوم";
    }
  };

  const totalRevenue = ordersTotal + billiardsTotal + tournamentTotal;
  const totalProfit = ordersProfitTotal + billiardsTotal + tournamentTotal; // البلياردو والبطولات نعتبرهم ربح صافي
  const ordersPercentage = totalRevenue > 0 ? (ordersTotal / totalRevenue) * 100 : 0;
  const billiardsPercentage = totalRevenue > 0 ? (billiardsTotal / totalRevenue) * 100 : 0;
  const netProfit = totalProfit - expensesTotal; // ✅ صافي الربح بعد خصم المصاريف


  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: "'Inter', 'Cairo', system-ui, sans-serif",
    direction: 'rtl'
  };

  const headerStyle = {
    backgroundColor: 'white',
    borderBottom: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  };

  const headerContentStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  const logoSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  };

  const logoStyle = {
    width: '48px',
    height: '48px',
    backgroundColor: '#A2AF9B',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  };

  const titleSectionStyle = {
    display: 'flex',
    flexDirection: 'column'
  };

  const mainTitleStyle = {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0
  };

  const subtitleStyle = {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
    marginTop: '2px'
  };

  const headerActionsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  };

  const statusBadgeStyle = {
    padding: '6px 12px',
    backgroundColor: '#dcfce7',
    color: '#166534',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '6px',
    border: '1px solid #bbf7d0'
  };

  const loadingStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#64748b',
    fontSize: '14px'
  };

  const spinnerStyle = {
    width: '16px',
    height: '16px',
    border: '2px solid #e2e8f0',
    borderTop: '2px solid #A2AF9B',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  const mainContentStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px'
  };

  const sectionStyle = {
    marginBottom: '32px'
  };

  const sectionTitleStyle = {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '16px',
    padding: '0 4px'
  };

  const filterSectionStyle = {
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '24px'
  };

  const filterGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    marginBottom: '24px'
  };

  const getFilterButtonStyle = (isActive) => ({
    padding: '16px',
    border: `2px solid ${isActive ? '#A2AF9B' : '#e2e8f0'}`,
    backgroundColor: isActive ? '#f0f4f0' : 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center'
  });

  const filterButtonTextStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 4px 0'
  };

  const filterButtonDescStyle = {
    fontSize: '12px',
    color: '#64748b',
    margin: 0
  };

  const customDateStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    padding: '20px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px'
  };

  const dateInputGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  };

  const dateInputLabelStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151'
  };

  const dateInputStyle = {
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white'
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px'
  };

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '24px',
    transition: 'box-shadow 0.2s ease'
  };

  const cardHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px'
  };

  const cardIconSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const cardIconStyle = {
    width: '40px',
    height: '40px',
    backgroundColor: '#A2AF9B',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  };

  const cardTitleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 4px 0'
  };

  const cardSubtitleStyle = {
    fontSize: '14px',
    color: '#64748b',
    margin: 0
  };

  const percentageStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#A2AF9B',
    textAlign: 'right'
  };

  const amountStyle = {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '16px'
  };

  const currencyStyle = {
    fontSize: '20px',
    color: '#64748b',
    marginRight: '8px'
  };

  const cardFooterStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9'
  };

  const footerItemStyle = {
    textAlign: 'center'
  };

  const footerLabelStyle = {
    fontSize: '12px',
    color: '#64748b',
    margin: '0 0 4px 0'
  };

  const footerValueStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0
  };

  const totalCardStyle = {
    backgroundColor: '#A2AF9B',
    color: 'white',
    border: '1px solid #8A9A85',
    borderRadius: '8px',
    padding: '24px'
  };

  const totalCardTitleStyle = {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '20px',
    textAlign: 'center'
  };

  const totalAmountStyle = {
    fontSize: '42px',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '20px'
  };

  const totalStatsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px'
  };

  const totalStatItemStyle = {
    textAlign: 'center',
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '6px'
  };

  const totalStatValueStyle = {
    fontSize: '18px',
    fontWeight: '700',
    margin: '0 0 4px 0'
  };

  const totalStatLabelStyle = {
    fontSize: '12px',
    opacity: 0.9,
    margin: 0
  };

  const profitCardStyle = {
    backgroundColor: '#10b981',
    color: 'white',
    border: '1px solid #059669',
    borderRadius: '8px',
    padding: '24px'
  };

  const analyticsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px'
  };

  const metricCardStyle = {
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '20px'
  };

  const metricHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  };

  const metricIconStyle = {
    width: '32px',
    height: '32px',
    backgroundColor: '#A2AF9B',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  };

  const metricBadgeStyle = {
    fontSize: '10px',
    fontWeight: '600',
    padding: '4px 8px',
    backgroundColor: '#dcfce7',
    color: '#166534',
    borderRadius: '4px'
  };

  const metricValueStyle = {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '8px'
  };

  const metricLabelStyle = {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '8px'
  };

  const metricTrendStyle = {
    fontSize: '12px',
    fontWeight: '600',
    color: '#10b981'
  };

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .card-hover:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          .filter-hover:hover {
            border-color: #A2AF9B;
            background-color: #f9fafb;
          }
        `}
      </style>

      {/* Header */}
      <header style={headerStyle}>
        <div style={headerContentStyle}>
          <div style={logoSectionStyle}>
            <div style={logoStyle}>
              <svg style={{width: '24px', height: '24px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12l2-2 4 4 6-6 6 6"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7"/>
              </svg>
            </div>
            <div style={titleSectionStyle}>
              <h1 style={mainTitleStyle}>لوحة تحكم المبيعات</h1>
              <p style={subtitleStyle}>نظام إدارة وتحليل المبيعات - {getFilterDisplayName()}</p>
            </div>
          </div>
          
          <div style={headerActionsStyle}>
            <div style={statusBadgeStyle}>متصل</div>
            {isLoading && (
              <div style={loadingStyle}>
                <div style={spinnerStyle}></div>
                <span>جاري التحديث...</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={mainContentStyle}>
        
        {/* Filter Section */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>فلترة البيانات</h2>
          <div style={filterSectionStyle}>
            <div style={filterGridStyle}>
              {[
                { key: "today", label: "اليوم", desc: "مبيعات اليوم الحالي" },
                { key: "week", label: "الأسبوع", desc: "آخر 7 أيام" },
                { key: "month", label: "الشهر", desc: "آخر 30 يوم" },
                { key: "custom", label: "مخصص", desc: "فترة محددة" }
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key)}
                  style={getFilterButtonStyle(filter === filterOption.key)}
                  className="filter-hover"
                >
                  <h3 style={filterButtonTextStyle}>{filterOption.label}</h3>
                  <p style={filterButtonDescStyle}>{filterOption.desc}</p>
                </button>
              ))}
            </div>

            {filter === "custom" && (
              <div style={customDateStyle}>
                <div style={dateInputGroupStyle}>
                  <label style={dateInputLabelStyle}>تاريخ البداية</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    style={dateInputStyle}
                  />
                </div>
                <div style={dateInputGroupStyle}>
                  <label style={dateInputLabelStyle}>تاريخ النهاية</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    style={dateInputStyle}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Stats Section */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>إحصائيات المبيعات</h2>
          <div style={statsGridStyle}>
            {/* Orders Card */}
            <div style={cardStyle} className="card-hover">
              <div style={cardHeaderStyle}>
                <div style={cardIconSectionStyle}>
                  <div style={cardIconStyle}>
                    <svg style={{width: '20px', height: '20px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 7l-3 3-3-3-3 3-3-3-4 4v6a2 2 0 002 2h16a2 2 0 002-2v-6l-4-4z"/>
                      <path d="M9 22V12h6v10"/>
                    </svg>
                  </div>
                  <div>
                    <h3 style={cardTitleStyle}>مبيعات الطلبات</h3>
                    <p style={cardSubtitleStyle}>الطلبات المكتملة والمدفوعة</p>
                  </div>
                </div>
                <div style={percentageStyle}>
                  {ordersPercentage.toFixed(1)}%
                </div>
              </div>
              
              <div style={amountStyle}>
                {ordersTotal.toFixed(2)}
                <span style={currencyStyle}>₪</span>
              </div>
              
              <div style={cardFooterStyle}>
                <div style={footerItemStyle}>
                  <p style={footerLabelStyle}>عدد الطلبات</p>
                  <p style={footerValueStyle}>{Object.keys(sessionOrderTotals).length}</p>
                </div>
                <div style={footerItemStyle}>
                  <p style={footerLabelStyle}>متوسط الطلب</p>
                  <p style={footerValueStyle}>
                    {ordersTotal > 0 ? (ordersTotal / Math.max(Object.keys(sessionOrderTotals).length, 1)).toFixed(0) : '0'} ₪
                  </p>
                </div>
              </div>
            </div>

            {/* Billiards Card */}
            <div style={cardStyle} className="card-hover">
              <div style={cardHeaderStyle}>
                <div style={cardIconSectionStyle}>
                  <div style={cardIconStyle}>
                    <svg style={{width: '20px', height: '20px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="6"/>
                      <circle cx="12" cy="12" r="2" fill="currentColor"/>
                    </svg>
                  </div>
                  <div>
                    <h3 style={cardTitleStyle}>مبيعات البلياردو</h3>
                    <p style={cardSubtitleStyle}>الجلسات المدفوعة والمكتملة</p>
                  </div>
                </div>
                <div style={percentageStyle}>
                  {billiardsPercentage.toFixed(1)}%
                </div>
              </div>
              
              <div style={amountStyle}>
                {billiardsTotal.toFixed(2)}
                <span style={currencyStyle}>₪</span>
              </div>
              
              <div style={cardFooterStyle}>
                <div style={footerItemStyle}>
                  <p style={footerLabelStyle}>عدد الجلسات</p>
                  <p style={footerValueStyle}>-</p>
                </div>
                <div style={footerItemStyle}>
                  <p style={footerLabelStyle}>متوسط الجلسة</p>
                  <p style={footerValueStyle}>
                    {billiardsTotal > 0 ? (billiardsTotal / Math.max(1, 1)).toFixed(0) : '0'} ₪
                  </p>
                </div>
              </div>
            </div>

            {/* Tournaments Card */}
            <div style={cardStyle} className="card-hover">
              <div style={cardHeaderStyle}>
                <div style={cardIconSectionStyle}>
                  <div style={cardIconStyle}>
                    <svg style={{width: '20px', height: '20px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3h18v4H3z"/>
                      <path d="M3 17h18v4H3z"/>
                      <path d="M3 10h18v4H3z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 style={cardTitleStyle}>أرباح البطولات</h3>
                    <p style={cardSubtitleStyle}>صافي الاشتراكات ناقص الجوائز</p>
                  </div>
                </div>
                <div style={percentageStyle}>
                  {(totalRevenue > 0 ? (tournamentTotal / totalRevenue) * 100 : 0).toFixed(1)}%
                </div>
              </div>
              
              <div style={amountStyle}>
                {tournamentTotal.toFixed(2)}
                <span style={currencyStyle}>₪</span>
              </div>
              
              <div style={cardFooterStyle}>
                <div style={footerItemStyle}>
                  <p style={footerLabelStyle}>عدد البطولات</p>
                  <p style={footerValueStyle}>-</p>
                </div>
                <div style={footerItemStyle}>
                  <p style={footerLabelStyle}>الربح الصافي</p>
                  <p style={footerValueStyle}>{tournamentTotal.toFixed(0)} ₪</p>
                </div>
              </div>
            </div>

            {/* Sales Profit Card */}
            <div style={cardStyle} className="card-hover">
              <div style={cardHeaderStyle}>
                <div style={cardIconSectionStyle}>
                  <div style={cardIconStyle}>
                    <svg style={{width: '20px', height: '20px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22,6 13,15 8,10 2,16"/>
                      <polyline points="16,6 22,6 22,12"/>
                    </svg>
                  </div>
                  <div>
                    <h3 style={cardTitleStyle}>الربح من المبيعات</h3>
                    <p style={cardSubtitleStyle}>الفرق بين سعر البيع والشراء</p>
                  </div>
                </div>
                <div style={percentageStyle}>
                  {totalRevenue > 0 ? ((ordersProfitTotal / totalRevenue) * 100).toFixed(1) : '0'}%
                </div>
              </div>
              
              <div style={amountStyle}>
                {ordersProfitTotal.toFixed(2)}
                <span style={currencyStyle}>₪</span>
              </div>
              
              <div style={cardFooterStyle}>
                <div style={footerItemStyle}>
                  <p style={footerLabelStyle}>هامش الربح</p>
                  <p style={footerValueStyle}>
                    {ordersTotal > 0 ? ((ordersProfitTotal / ordersTotal) * 100).toFixed(1) : '0'}%
                  </p>
                </div>
                <div style={footerItemStyle}>
                  <p style={footerLabelStyle}>متوسط ربح الطلب</p>
                  <p style={footerValueStyle}>
                    {ordersProfitTotal > 0 ? (ordersProfitTotal / Math.max(Object.keys(sessionOrderProfits).length, 1)).toFixed(0) : '0'} ₪
                  </p>
                </div>
              </div>
            </div>

            {/* Grand Total Revenue Card */}
            <div style={cardStyle} className="card-hover">
              <div style={cardHeaderStyle}>
                <div style={cardIconSectionStyle}>
                  <div style={cardIconStyle}>
                    <svg style={{width: '20px', height: '20px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="20" height="14" x="2" y="5" rx="2"/>
                      <path d="M2 10h20"/>
                    </svg>
                  </div>
                  <div>
                    <h3 style={cardTitleStyle}>المجموع العام</h3>
                    <p style={cardSubtitleStyle}>مبيعات + بلياردو + بطولات</p>
                  </div>
                </div>
                <div style={percentageStyle}>
                  100%
                </div>
              </div>
              
              <div style={amountStyle}>
                {totalRevenue.toFixed(2)}
                <span style={currencyStyle}>₪</span>
              </div>
              
              <div style={cardFooterStyle}>
                <div style={footerItemStyle}>
                  <p style={footerLabelStyle}>المبيعات</p>
                  <p style={footerValueStyle}>{ordersTotal.toFixed(0)} ₪</p>
                </div>
                <div style={footerItemStyle}>
                  <p style={footerLabelStyle}>بلياردو + بطولات</p>
                  <p style={footerValueStyle}>
                    {(billiardsTotal + tournamentTotal).toFixed(0)} ₪
                  </p>
                </div>
              </div>
            </div>

            {/* Total Profit Card */}
            <div style={cardStyle} className="card-hover">
              <div style={cardHeaderStyle}>
                <div style={cardIconSectionStyle}>
                  <div style={cardIconStyle}>
                    <svg style={{width: '20px', height: '20px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="m22 2-5 10-5-4Z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 style={cardTitleStyle}>مجموع الربح</h3>
                    <p style={cardSubtitleStyle}>الربح الكامل من كل المصادر</p>
                  </div>
                </div>
                <div style={percentageStyle}>
                  {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0'}%
                </div>
              </div>
              
              <div style={amountStyle}>
                {totalProfit.toFixed(2)}
                <span style={currencyStyle}>₪</span>
              </div>
              
              <div style={cardFooterStyle}>
                <div style={footerItemStyle}>
                  <p style={footerLabelStyle}>هامش الربح العام</p>
                  <p style={footerValueStyle}>
                    {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0'}%
                  </p>
                </div>
                <div style={footerItemStyle}>
                  <p style={footerLabelStyle}>ربح المبيعات</p>
                  <p style={footerValueStyle}>
                    {ordersProfitTotal.toFixed(0)} ₪
                  </p>
                </div>
              </div>
            </div>
            {/* Expenses Card */}
<div style={cardStyle} className="card-hover">
  <div style={cardHeaderStyle}>
    <div style={cardIconSectionStyle}>
      <div style={{ ...cardIconStyle, backgroundColor: '#EF4444' }}>
        <svg style={{width: '20px', height: '20px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3h18v4H3z"/><path d="M3 10h18v11H3z"/><path d="M8 14h8"/>
        </svg>
      </div>
      <div>
        <h3 style={cardTitleStyle}>المصاريف</h3>
        <p style={cardSubtitleStyle}>إجمالي المصاريف ضمن الفلتر المختار</p>
      </div>
    </div>
    <div style={percentageStyle}>
      {/* نسبة المصاريف من إجمالي الإيراد إن أحببت */}
      {totalRevenue > 0 ? ((expensesTotal / totalRevenue) * 100).toFixed(1) : '0'}%
    </div>
  </div>

  <div style={amountStyle}>
    {expensesTotal.toFixed(2)}
    <span style={currencyStyle}>₪</span>
  </div>

  <div style={cardFooterStyle}>
    <div style={footerItemStyle}>
      <p style={footerLabelStyle}>الفترة</p>
      <p style={footerValueStyle}>
        {filter === "custom" && customFrom && customTo ? `${customFrom} → ${customTo}` : getFilterDisplayName()}
      </p>
    </div>
    <div style={footerItemStyle}>
      <p style={footerLabelStyle}>مقارنة بالإيراد</p>
      <p style={footerValueStyle}>
        {totalRevenue > 0 ? ((expensesTotal / totalRevenue) * 100).toFixed(1) : '0'}%
      </p>
    </div>
  </div>
</div>

{/* Net Profit Card */}
<div style={{ ...cardStyle, backgroundColor: '#0ea5e9', border: '1px solid #0284c7', color: 'white' }} className="card-hover">
  <div style={cardHeaderStyle}>
    <div style={cardIconSectionStyle}>
      <div style={{ ...cardIconStyle, backgroundColor: 'rgba(255,255,255,0.2)' }}>
        <svg style={{width: '20px', height: '20px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      </div>
      <div>
        <h3 style={{ ...cardTitleStyle, color: 'white' }}>صافي الربح</h3>
        <p style={{ ...cardSubtitleStyle, color: 'rgba(255,255,255,.9)' }}>
          الربح الكلي بعد خصم المصاريف
        </p>
      </div>
    </div>
    <div style={{ ...percentageStyle, color: 'white' }}>
      {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0'}%
    </div>
  </div>

  <div style={{ ...amountStyle, color: 'white' }}>
    {netProfit.toFixed(2)}
    <span style={{ ...currencyStyle, color: 'rgba(255,255,255,.9)' }}>₪</span>
  </div>

  <div style={{ ...cardFooterStyle, borderTopColor: 'rgba(255,255,255,.25)' }}>
    <div style={footerItemStyle}>
      <p style={{ ...footerLabelStyle, color: 'rgba(255,255,255,.9)' }}>الربح قبل الخصم</p>
      <p style={{ ...footerValueStyle, color: 'white' }}>{totalProfit.toFixed(0)} ₪</p>
    </div>
    <div style={footerItemStyle}>
      <p style={{ ...footerLabelStyle, color: 'rgba(255,255,255,.9)' }}>المصاريف المخصومة</p>
      <p style={{ ...footerValueStyle, color: 'white' }}>{expensesTotal.toFixed(0)} ₪</p>
    </div>
  </div>
</div>

          </div>
        </section>



        {/* Analytics Section */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>التحليل التفصيلي</h2>
          <div style={analyticsGridStyle}>
            {[
              {
                title: "متوسط قيمة الطلب",
                value: ordersTotal > 0 ? (ordersTotal / Math.max(Object.keys(sessionOrderTotals).length, 1)).toFixed(2) : '0.00',
                unit: "₪",
                trend: "+12.5%"
              },
              {
                title: "متوسط ربح الطلب",
                value: ordersProfitTotal > 0 ? (ordersProfitTotal / Math.max(Object.keys(sessionOrderProfits).length, 1)).toFixed(2) : '0.00',
                unit: "₪",
                trend: "+15.3%"
              },
              {
                title: "متوسط جلسة البلياردو",
                value: billiardsTotal > 0 ? (billiardsTotal / Math.max(1, 1)).toFixed(2) : '0.00',
                unit: "₪",
                trend: "+8.3%"
              },
              {
                title: "نسبة مساهمة الطلبات",
                value: ordersPercentage.toFixed(1),
                unit: "%",
                trend: ordersPercentage > 50 ? "مرتفع" : "منخفض"
              },
              {
                title: "نسبة مساهمة البلياردو",
                value: billiardsPercentage.toFixed(1),
                unit: "%",
                trend: billiardsPercentage > 50 ? "مرتفع" : "منخفض"
              },
              {
                title: "هامش الربح الإجمالي",
                value: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0',
                unit: "%",
                trend: "ممتاز"
              }
            ].map((metric, index) => (
              <div key={index} style={metricCardStyle}>
                <div style={metricHeaderStyle}>
                  <div style={metricIconStyle}>
                    <svg style={{width: '16px', height: '16px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22,6 13,15 8,10 2,16"/>
                      <polyline points="16,6 22,6 22,12"/>
                    </svg>
                  </div>
                  <div style={metricBadgeStyle}>مباشر</div>
                </div>
                
                <p style={metricLabelStyle}>{metric.title}</p>
                <div style={metricValueStyle}>
                  {metric.value} {metric.unit}
                </div>
                <div style={metricTrendStyle}>
                  {metric.trend}
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}