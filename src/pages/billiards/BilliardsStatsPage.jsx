import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";

export default function BilliardsStatsPage() {
  const [sessions, setSessions] = useState([]);
  const [dateFilter, setDateFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("");
  const [availableTables, setAvailableTables] = useState([]);
  const [tableNumberToId, setTableNumberToId] = useState({});

  useEffect(() => {
    fetchSessions();
    fetchTables();
  }, []);

  const fetchSessions = async () => {
    try {
      const snapshot = await getDocs(collection(db, "sessions"));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSessions(data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const fetchTables = async () => {
    try {
      const snapshot = await getDocs(collection(db, "peli_tables"));
      const tableMap = {};
      const tableNumbers = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        tableMap[data.table_number] = doc.id;
        tableNumbers.push(data.table_number);
      });
      
      setTableNumberToId(tableMap);
      setAvailableTables(tableNumbers.sort((a, b) => a - b));
    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  };

  const isInDateRange = (sessionDate) => {
    if (dateFilter === "all") return true;
    
    const now = new Date();
    const sessionDateObj = sessionDate.toDate ? sessionDate.toDate() : new Date(sessionDate);
    
    switch (dateFilter) {
      case "today":
        { const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return sessionDateObj >= today; }
      case "week":
        { const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return sessionDateObj >= weekAgo; }
      case "month":
        { const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return sessionDateObj >= monthAgo; }
      default:
        return true;
    }
  };

  const selectedTableId = tableFilter ? tableNumberToId[tableFilter] : "";

  const paidSessions = sessions.filter(s => {
    if (!s.pay_status || !s.end_time || !s.start_time) return false;
    const endDateValid = isInDateRange(s.end_time);
    const matchTable = selectedTableId ? s.table_id === selectedTableId : true;
    return endDateValid && matchTable;
  });

  const totalRevenue = paidSessions.reduce((sum, s) => sum + parseFloat(s.total_price || 0), 0);
  const totalMinutes = paidSessions.reduce((sum, s) => sum + parseFloat(s.total_time || 0), 0);

  const revenueByTable = {};
  paidSessions.forEach(s => {
    const tid = s.table_id;
    const price = parseFloat(s.total_price || 0);
    revenueByTable[tid] = (revenueByTable[tid] || 0) + price;
  });

  const bestTable = Object.entries(revenueByTable).sort((a, b) => b[1] - a[1])[0];
  const bestTableNumber = bestTable ? Object.entries(tableNumberToId).find(([, id]) => id === bestTable[0])?.[0] : null;

  const containerStyle = {
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "'Inter', 'Cairo', system-ui, sans-serif",
    direction: 'rtl'
  };

  const headerStyle = {
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    paddingBottom: "24px"
  };

  const headerContentStyle = {
    padding: "32px 24px 16px",
    textAlign: "center"
  };

  const titleSectionStyle = {
    marginBottom: "24px"
  };

  const titleStyle = {
    fontSize: "32px",
    fontWeight: "700",
    margin: "0 0 8px 0",
    color: "#A2AF9B",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px"
  };

  const subtitleStyle = {
    fontSize: "16px",
    color: "#64748b",
    margin: 0,
    fontWeight: "500"
  };

  const filtersContainerStyle = {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    marginTop: "16px"
  };

  const filtersHeaderStyle = {
    margin: "0 0 16px 0",
    color: "#374151",
    fontSize: "18px",
    fontWeight: "600",
    textAlign: "center"
  };

  const filtersGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "24px",
    alignItems: "end"
  };

  const filterGroupStyle = {
    display: "flex",
    flexDirection: "column"
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    color: "#374151",
    fontWeight: "600",
    fontSize: "14px"
  };

  const selectStyle = (hasValue) => ({
    padding: "12px 16px",
    borderRadius: "6px",
    border: `1px solid ${hasValue ? "#A2AF9B" : "#d1d5db"}`,
    width: "100%",
    fontSize: "14px",
    backgroundColor: "white",
    outline: "none",
    fontFamily: "inherit",
    cursor: "pointer",
    fontWeight: "600"
  });

  const statsContainerStyle = {
    padding: "32px 24px"
  };

  const statsGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "24px"
  };

  const cardStyle = {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "32px",
    border: "1px solid #e2e8f0",
    textAlign: "center"
  };

  const cardIconStyle = {
    fontSize: "32px",
    marginBottom: "16px"
  };

  const cardTitleStyle = {
    fontSize: "16px",
    color: "#374151",
    marginBottom: "16px",
    fontWeight: "600"
  };

  const cardValueStyle = {
    fontSize: "28px",
    fontWeight: "700",
    margin: 0,
    color: "#A2AF9B"
  };

  const bestTableCardStyle = {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "32px",
    border: "2px solid #A2AF9B",
    textAlign: "center"
  };

  const summaryContainerStyle = {
    marginTop: "32px",
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "32px",
    border: "1px solid #e2e8f0"
  };

  const summaryHeaderStyle = {
    textAlign: "center",
    color: "#A2AF9B",
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "24px"
  };

  const summaryGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    textAlign: "center"
  };

  const summaryItemLabelStyle = {
    color: "#64748b",
    fontSize: "14px",
    marginBottom: "8px"
  };

  const summaryItemValueStyle = {
    color: "#A2AF9B",
    fontSize: "18px",
    fontWeight: "700"
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={headerContentStyle}>
          {/* Title Section */}
          <div style={titleSectionStyle}>
            <h1 style={titleStyle}>
              <span>🎱</span>
              إحصائيات البلياردو
              <span>🏆</span>
            </h1>
            <p style={subtitleStyle}>
              تتبع الأداء والإيرادات بذكاء
            </p>
          </div>

          {/* Filters Section */}
          <div style={filtersContainerStyle}>
            <h3 style={filtersHeaderStyle}>
              فلترة البيانات
            </h3>
            
            <div style={filtersGridStyle}>
              {/* Date Filter */}
              <div style={filterGroupStyle}>
                <label style={labelStyle}>
                  الفترة الزمنية:
                </label>
                <select 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)} 
                  style={selectStyle(dateFilter !== "all")}
                >
                  <option value="all">جميع الأيام</option>
                  <option value="today">اليوم</option>
                  <option value="week">الأسبوع الماضي</option>
                  <option value="month">الشهر الماضي</option>
                </select>
              </div>
              
              {/* Table Filter */}
              <div style={filterGroupStyle}>
                <label style={labelStyle}>
                  رقم الطاولة:
                </label>
                <select 
                  value={tableFilter} 
                  onChange={(e) => setTableFilter(e.target.value)} 
                  style={selectStyle(tableFilter !== "")}
                >
                  <option value="">الكل</option>
                  {availableTables.map((tableNum) => (
                    <option key={tableNum} value={tableNum}>الطاولة {tableNum}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={statsContainerStyle}>
        <div style={statsGridStyle}>
          <div style={cardStyle}>
            <div style={cardIconStyle}>💰</div>
            <h2 style={cardTitleStyle}>إجمالي الإيرادات</h2>
            <p style={cardValueStyle}>
              {totalRevenue.toFixed(2)} شيقل
            </p>
          </div>

          <div style={cardStyle}>
            <div style={cardIconStyle}>🧾</div>
            <h2 style={cardTitleStyle}>عدد الجلسات المدفوعة</h2>
            <p style={cardValueStyle}>
              {paidSessions.length}
            </p>
          </div>

          <div style={cardStyle}>
            <div style={cardIconStyle}>⏱️</div>
            <h2 style={cardTitleStyle}>إجمالي الوقت</h2>
            <p style={cardValueStyle}>
              {totalMinutes} دقيقة
            </p>
          </div>

          {bestTableNumber && (
            <div style={bestTableCardStyle}>
              <div style={cardIconStyle}>🏆</div>
              <h2 style={cardTitleStyle}>الطاولة الأفضل</h2>
              <p style={cardValueStyle}>
                رقم {bestTableNumber} — {bestTable[1].toFixed(2)} شيقل
              </p>
            </div>
          )}
        </div>

        {/* Summary Section */}
        {paidSessions.length > 0 && (
          <div style={summaryContainerStyle}>
            <h3 style={summaryHeaderStyle}>
              ملخص النتائج
            </h3>
            <div style={summaryGridStyle}>
              <div>
                <div style={summaryItemLabelStyle}>متوسط سعر الجلسة</div>
                <div style={summaryItemValueStyle}>
                  {paidSessions.length > 0 ? (totalRevenue / paidSessions.length).toFixed(2) : 0} شيقل
                </div>
              </div>
              <div>
                <div style={summaryItemLabelStyle}>متوسط مدة الجلسة</div>
                <div style={summaryItemValueStyle}>
                  {paidSessions.length > 0 ? Math.round(totalMinutes / paidSessions.length) : 0} دقيقة
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}