import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useDateRange } from "../../contexts/DateRangeContext";
import { useNavigate } from "react-router-dom";

export default function SessionBrowser() {
  const { setPresetFilter, setStartDate, setEndDate } = useDateRange();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showBrowser, setShowBrowser] = useState(false);

  useEffect(() => {
    if (showBrowser) {
      fetchSessions();
    }
  }, [showBrowser]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      // Get billiards sessions
      const billiardsQuery = query(collection(db, "sessions"), orderBy("start_time", "desc"));
      const billiardsSnap = await getDocs(billiardsQuery);
      
      // Get order sessions
      const ordersQuery = query(collection(db, "order_sessions"), orderBy("created_at", "desc"));
      const ordersSnap = await getDocs(ordersQuery);

      // Get order items for revenue calculation
      const orderItemsQuery = query(collection(db, "order_items"));
      const orderItemsSnap = await getDocs(orderItemsQuery);

      // Build order totals by session
      const orderTotals = {};
      orderItemsSnap.forEach((doc) => {
        const data = doc.data();
        const sessionId = data.session_id;
        const quantity = parseInt(data.quantity || 1);
        const sellPrice = parseFloat(data.sell_price || 0);
        const itemTotal = sellPrice * quantity;
        
        if (!orderTotals[sessionId]) orderTotals[sessionId] = 0;
        orderTotals[sessionId] += itemTotal;
      });

      // Process sessions
      const allSessions = [];

      // Add billiards sessions
      billiardsSnap.forEach((doc) => {
        const data = doc.data();
        const startTime = data.start_time?.toDate?.() || new Date(data.start_time);
        const endTime = data.end_time?.toDate?.() || new Date(data.end_time);
        
        allSessions.push({
          id: doc.id,
          type: 'billiards',
          startTime,
          endTime,
          revenue: parseFloat(data.total_price || 0),
          duration: endTime && startTime ? Math.round((endTime - startTime) / (1000 * 60)) : 0,
          tableNumber: data.table_number || 'غير محدد',
          isPaid: data.pay_status || false,
          title: `جلسة بلياردو - طاولة ${data.table_number || '؟'}`
        });
      });

      // Add order sessions
      ordersSnap.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.created_at?.toDate?.() || new Date(data.created_at);
        
        allSessions.push({
          id: doc.id,
          type: 'orders',
          startTime: createdAt,
          endTime: null, // Orders don't have explicit end times
          revenue: orderTotals[doc.id] || 0,
          duration: 0,
          customerName: data.name || 'بدون اسم',
          isClosed: data.is_closed || false,
          title: `جلسة طلبات - ${data.name || 'عميل'}`
        });
      });

      // Group sessions by day (using local date to avoid timezone issues)
      const sessionsByDay = {};
      allSessions.forEach(session => {
        // Create a consistent day key using the local date
        const localDate = new Date(session.startTime);
        const dayKey = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
        
        if (!sessionsByDay[dayKey]) {
          sessionsByDay[dayKey] = {
            date: new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()),
            dayKey,
            sessions: [],
            totalRevenue: 0,
            billiardsCount: 0,
            ordersCount: 0
          };
        }
        sessionsByDay[dayKey].sessions.push(session);
        sessionsByDay[dayKey].totalRevenue += session.revenue;
        
        if (session.type === 'billiards') {
          sessionsByDay[dayKey].billiardsCount++;
        } else {
          sessionsByDay[dayKey].ordersCount++;
        }
      });

      // Convert to array and sort by date (newest first)
      const groupedSessions = Object.values(sessionsByDay).sort((a, b) => b.date - a.date);
      
      setSessions(groupedSessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
    setLoading(false);
  };

  const selectSession = (session) => {
    setSelectedSession(session);
    
    // Set the date range to cover this specific session
    const startDate = session.startTime.toISOString().split('T')[0];
    let endDate = startDate;
    
    if (session.endTime) {
      endDate = session.endTime.toISOString().split('T')[0];
    }
    
    setPresetFilter("custom");
    setStartDate(startDate);
    setEndDate(endDate);
    setShowBrowser(false);
  };

  const selectDayGroup = (dayGroup) => {
    // Select entire day's sessions
    const startDate = dayGroup.date.toISOString().split('T')[0];
    
    setPresetFilter("custom");
    setStartDate(startDate);
    setEndDate(startDate);
    setShowBrowser(false);
  };

  const containerStyle = {
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px'
  };

  const toggleButtonStyle = {
    padding: '12px 24px',
    backgroundColor: '#A2AF9B',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const modalContentStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '800px',
    width: '95%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
  };

  const dayGroupStyle = {
    marginBottom: '24px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    overflow: 'hidden'
  };

  const dayHeaderStyle = {
    backgroundColor: '#f8fafc',
    padding: '16px',
    borderBottom: '1px solid #e2e8f0',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const sessionItemStyle = {
    padding: '12px 16px',
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background-color 0.2s'
  };

  const sessionTypeStyle = (type) => ({
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: type === 'billiards' ? '#dbeafe' : '#f0fdf4',
    color: type === 'billiards' ? '#1e40af' : '#166534'
  });

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => setShowBrowser(true)}
          style={toggleButtonStyle}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#8FA288'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#A2AF9B'}
        >
          <span>📋</span>
          تصفح الجلسات المحفوظة
        </button>
        
        <button
          onClick={() => navigate('/sessions')}
          style={{
            ...toggleButtonStyle,
            backgroundColor: '#6366f1',
            fontSize: '12px',
            padding: '8px 16px'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#4f46e5'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#6366f1'}
        >
          <span>⚙️</span>
          إدارة متقدمة
        </button>
      </div>

      {showBrowser && (
        <div style={modalStyle} onClick={() => setShowBrowser(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1e293b',
                margin: 0
              }}>
                📊 جلسات العمل المحفوظة
              </h2>
              <button
                onClick={() => setShowBrowser(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                ×
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div>جاري تحميل الجلسات...</div>
              </div>
            ) : (
              <div>
                {sessions.map((dayGroup, dayIndex) => (
                  <div key={dayIndex} style={dayGroupStyle}>
                    <div 
                      style={dayHeaderStyle}
                      onClick={() => selectDayGroup(dayGroup)}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#f8fafc'}
                    >
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                          📅 {dayGroup.date.toLocaleDateString('ar-EG', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {dayGroup.billiardsCount} بلياردو • {dayGroup.ordersCount} طلبات - إجمالي: {dayGroup.totalRevenue.toFixed(2)} ₪
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#A2AF9B' }}>
                        اضغط لتحديد اليوم كاملاً
                      </div>
                    </div>

                    {dayGroup.sessions.map((session, sessionIndex) => (
                      <div
                        key={sessionIndex}
                        style={sessionItemStyle}
                        onClick={() => selectSession(session)}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={sessionTypeStyle(session.type)}>
                              {session.type === 'billiards' ? '🎱 بلياردو' : '🛒 طلبات'}
                            </span>
                            <span style={{ fontWeight: '600', color: '#1e293b' }}>
                              {session.title}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {session.startTime.toLocaleTimeString('ar-EG')}
                            {session.endTime && ` - ${session.endTime.toLocaleTimeString('ar-EG')}`}
                            {session.duration > 0 && ` (${session.duration} دقيقة)`}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '700', color: '#A2AF9B' }}>
                            {session.revenue.toFixed(2)} ₪
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {session.type === 'billiards' ? 
                              (session.isPaid ? '✅ مدفوع' : '❌ غير مدفوع') :
                              (session.isClosed ? '✅ مغلق' : '🔄 نشط')
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                {sessions.length === 0 && !loading && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    لا توجد جلسات محفوظة
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
