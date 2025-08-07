import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import tableImage from "../../assets/table.png";

export default function BilliardsMainPage() {
  const [tables, setTables] = useState([]);
  const [note, setNote] = useState("");
  const [sessionType, setSessionType] = useState("open");
  const [duration, setDuration] = useState(60);
  const [startingTable, setStartingTable] = useState(null);
  const [timers, setTimers] = useState({});
  const [alertMessage, setAlertMessage] = useState(null);

  const showCustomAlert = (message) => {
    setAlertMessage(message);
    setTimeout(() => {
      setAlertMessage(null);
    }, 4000);
  };

  useEffect(() => {
    fetchTables();
    loadTimersFromFirestore();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => {
        const newTimers = { ...prev };
        let hasChanges = false;

        Object.entries(prev).forEach(([tableId, timer]) => {
          if (timer.paused) return;

          newTimers[tableId] = {
            ...timer,
            lastTick: Date.now(),
          };
          hasChanges = true;

          if (timer.type === "fixed") {
            const elapsed = calculateElapsedTime(timer);
            if (elapsed >= timer.duration * 60000 && !timer.alerted) {
              showCustomAlert(`انتهى الوقت المحدد للطاولة رقم ${timer.table_number}`);
              newTimers[tableId].alerted = true;
            }
          }
        });

        return hasChanges ? newTimers : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // دالة لحساب الوقت المنقضي
  const calculateElapsedTime = (timer) => {
    if (!timer.startedAt) return 0;
    
    const now = Date.now();
    const totalTime = now - timer.startedAt;
    
    // احسب مجموع الوقت المتوقف
    let totalPausedTime = 0;
    if (timer.pauseHistory && timer.pauseHistory.length > 0) {
      timer.pauseHistory.forEach(pause => {
        if (pause.endTime) {
          // فترة إيقاف مكتملة
          totalPausedTime += pause.endTime - pause.startTime;
        } else if (timer.paused) {
          // فترة إيقاف حالية
          totalPausedTime += now - pause.startTime;
        }
      });
    }
    
    return Math.max(totalTime - totalPausedTime, 0);
  };

  const fetchTables = async () => {
    const q = query(collection(db, "peli_tables"), orderBy("table_number"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setTables(data);
  };

  const togglePause = async (tableId) => {
    const timer = timers[tableId];
    if (!timer) return;

    // احصل على أحدث جلسة للطاولة
    const snapshot = await getDocs(collection(db, "sessions"));
    const sessions = snapshot.docs
      .filter(doc => doc.data().table_id === tableId && !doc.data().end_time)
      .sort((a, b) => b.data().start_time?.seconds - a.data().start_time?.seconds);

    const latestSession = sessions[0];
    if (!latestSession) return;

    const sessionRef = doc(db, "sessions", latestSession.id);
    const now = Date.now();

    setTimers(prev => {
      const current = prev[tableId];
      if (!current) return prev;

      let newPauseHistory = [...(current.pauseHistory || [])];

      if (current.paused) {
        // استئناف - أغلق آخر فترة إيقاف
        if (newPauseHistory.length > 0) {
          const lastPause = newPauseHistory[newPauseHistory.length - 1];
          if (!lastPause.endTime) {
            lastPause.endTime = now;
          }
        }

        const updated = {
          ...current,
          paused: false,
          pauseHistory: newPauseHistory
        };

        // تحديث في Firebase
        updateDoc(sessionRef, {
          paused: false,
          pauseHistory: newPauseHistory,
        });

        return {
          ...prev,
          [tableId]: updated
        };
      } else {
        // إيقاف مؤقت - ابدأ فترة إيقاف جديدة
        newPauseHistory.push({
          startTime: now,
          endTime: null
        });

        const updated = {
          ...current,
          paused: true,
          pauseHistory: newPauseHistory
        };

        // تحديث في Firebase
        updateDoc(sessionRef, {
          paused: true,
          pauseHistory: newPauseHistory,
        });

        return {
          ...prev,
          [tableId]: updated
        };
      }
    });
  };

  const loadTimersFromFirestore = async () => {
    const snapshot = await getDocs(collection(db, "sessions"));
    const activeSessions = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(session => !session.end_time);

    const loadedTimers = {};
    
    activeSessions.forEach(session => {
      const tableId = session.table_id;
      if (!session.start_time) return;

      loadedTimers[tableId] = {
        startedAt: session.start_time.toDate().getTime(),
        type: session.session_type,
        duration: session.duration,
        table_number: null,
        paused: session.paused || false,
        pauseHistory: session.pauseHistory || [],
        lastTick: Date.now(),
      };
    });

    const tableSnapshot = await getDocs(collection(db, "peli_tables"));
    tableSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (loadedTimers[doc.id]) {
        loadedTimers[doc.id].table_number = data.table_number;
      }
    });

    setTimers(loadedTimers);
  };

  const startSession = async (table) => {
    const now = Date.now();

    const newSession = {
      table_id: table.id,
      note,
      start_time: serverTimestamp(),
      pay_status: false,
      session_type: sessionType,
      duration: sessionType === "fixed" ? Number(duration) : null,
      paused: false,
      pauseHistory: [],
    };

    await addDoc(collection(db, "sessions"), newSession);
    await updateDoc(doc(db, "peli_tables", table.id), { status: "active" });

    fetchTables();
    setStartingTable(null);
    setTimers(prev => ({
      ...prev,
      [table.id]: {
        startedAt: now,
        type: sessionType,
        duration: sessionType === "fixed" ? Number(duration) : null,
        table_number: table.table_number,
        paused: false,
        pauseHistory: [],
        lastTick: now,
      }
    }));

    setNote("");
    setSessionType("open");
    setDuration(60);
  };

  const endSession = async (table) => {
    const snapshot = await getDocs(collection(db, "sessions"));
    const sessions = snapshot.docs
      .filter(d => d.data().table_id === table.id)
      .sort((a, b) => b.data().start_time?.seconds - a.data().start_time?.seconds);

    const latestSession = sessions[0];
    if (!latestSession) return;

    const startTime = latestSession.data().start_time?.toDate();
    if (!startTime) {
      showCustomAlert("لا يمكن حساب الوقت: الوقت غير موجود بعد من الخادم.");
      return;
    }

    const now = new Date();
    const timer = timers[table.id];
    const elapsedMs = calculateElapsedTime(timer);
    const totalTime = Math.floor(elapsedMs / 60000);

    const price = parseFloat(table.price_per_hour || 0);
    const totalPrice = ((price / 60) * totalTime).toFixed(2);

    await updateDoc(doc(db, "sessions", latestSession.id), {
      end_time: now,
      total_time: totalTime,
      total_price: totalPrice,
    });

    await updateDoc(doc(db, "peli_tables", table.id), { status: "deactive" });
    fetchTables();
    setTimers(prev => {
      const newTimers = { ...prev };
      delete newTimers[table.id];
      return newTimers;
    });
  };

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
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "32px"
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

  const tablesGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "24px"
  };

  const getTableCardStyle = (isActive) => ({
    backgroundColor: "white",
    border: `2px solid ${isActive ? '#ef4444' : '#22c55e'}`,
    borderRadius: "8px",
    padding: "24px",
    position: "relative"
  });

  const statusIndicatorStyle = (isActive) => ({
    position: "absolute",
    top: "16px",
    right: "16px",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: isActive ? '#ef4444' : '#22c55e'
  });

  const tableImageContainerStyle = {
    backgroundColor: "#A2AF9B",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px"
  };

  const tableImageStyle = {
    width: "100%",
    height: "120px",
    objectFit: "contain"
  };

  const tableNumberStyle = {
    fontSize: "20px",
    fontWeight: "700",
    textAlign: "center",
    color: "#A2AF9B",
    margin: "0 0 16px 0"
  };

  const timerDisplayStyle = {
    textAlign: "center",
    fontSize: "16px",
    color: "#dc2626",
    marginBottom: "16px",
    backgroundColor: "#fef2f2",
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #fecaca",
    fontWeight: "600"
  };

  const buttonContainerStyle = {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginTop: "16px"
  };

  const getButtonStyle = (variant, disabled) => {
    if (variant === "pause") {
      return {
        backgroundColor: "#f59e0b",
        color: "white",
        padding: "12px 16px",
        borderRadius: "6px",
        border: "none",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        flex: 1
      };
    }

    if (disabled) {
      return {
        backgroundColor: "#e5e7eb",
        color: "#9ca3af",
        padding: "12px 16px",
        borderRadius: "6px",
        border: "none",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "not-allowed",
        flex: 1
      };
    }

    if (variant === "start") {
      return {
        backgroundColor: "#A2AF9B",
        color: "white",
        padding: "12px 16px",
        borderRadius: "6px",
        border: "none",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        flex: 1
      };
    }

    if (variant === "end") {
      return {
        backgroundColor: "#ef4444",
        color: "white",
        padding: "12px 16px",
        borderRadius: "6px",
        border: "none",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        flex: 1
      };
    }
  };

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
    padding: "32px",
    borderRadius: "8px",
    maxWidth: "450px",
    width: "90%",
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

  const textareaStyle = {
    width: "100%",
    minHeight: "80px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    padding: "12px",
    fontSize: "14px",
    resize: "vertical",
    fontFamily: "inherit"
  };

  const radioGroupStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  };

  const getRadioOptionStyle = (isSelected) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    backgroundColor: isSelected ? "#f0f4f0" : "transparent",
    borderRadius: "6px",
    border: `1px solid ${isSelected ? "#A2AF9B" : "#d1d5db"}`,
    cursor: "pointer"
  });

  const radioLabelStyle = {
    fontWeight: "600",
    color: "#374151"
  };

  const radioDescStyle = {
    fontSize: "14px",
    color: "#64748b"
  };

  const durationInputStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "12px"
  };

  const numberInputStyle = {
    border: "1px solid #d1d5db",
    padding: "8px 12px",
    width: "80px",
    textAlign: "center",
    borderRadius: "6px",
    fontSize: "14px"
  };

  const modalActionsStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "24px"
  };

  const cancelButtonStyle = {
    padding: "12px 24px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    backgroundColor: "white",
    color: "#374151",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer"
  };

  const confirmButtonStyle = {
    padding: "12px 24px",
    backgroundColor: "#A2AF9B",
    color: "white",
    borderRadius: "6px",
    border: "none",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer"
  };

  const alertModalStyle = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000
  };

  const alertContentStyle = {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "32px",
    maxWidth: "400px",
    width: "90%",
    textAlign: "center",
    border: "2px solid #A2AF9B"
  };

  const alertMessageStyle = {
    fontSize: "18px",
    fontWeight: "600",
    color: "#A2AF9B",
    marginBottom: "24px"
  };

  const alertButtonStyle = {
    backgroundColor: "#A2AF9B",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "6px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer"
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={headerTitleStyle}>
          إدارة طاولات البلياردو
        </h1>
        <p style={headerSubtitleStyle}>
          نظام إدارة الجلسات والمتابعة الفورية
        </p>
      </div>

      {/* Statistics Cards */}
      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <div style={statIconStyle}>📊</div>
          <div style={{...statValueStyle, color: "#A2AF9B"}}>
            {tables.length}
          </div>
          <p style={statLabelStyle}>إجمالي الطاولات</p>
        </div>
        
        <div style={statCardStyle}>
          <div style={statIconStyle}>🟢</div>
          <div style={{...statValueStyle, color: "#22c55e"}}>
            {tables.filter(t => t.status === "active").length}
          </div>
          <p style={statLabelStyle}>طاولات نشطة</p>
        </div>
        
        <div style={statCardStyle}>
          <div style={statIconStyle}>⭕</div>
          <div style={{...statValueStyle, color: "#ef4444"}}>
            {tables.filter(t => t.status !== "active").length}
          </div>
          <p style={statLabelStyle}>طاولات متاحة</p>
        </div>
      </div>

      {/* Tables Grid */}
      <div style={tablesGridStyle}>
        {tables.map(table => {
          const isActive = table.status === "active";
          const timer = timers[table.id];
          let timeDisplay = "";

          if (isActive && timer) {
            const elapsedMs = calculateElapsedTime(timer);
            const minutes = Math.floor(elapsedMs / 60000);
            const seconds = Math.floor((elapsedMs % 60000) / 1000);

            if (timer.type === "open") {
              timeDisplay = `الوقت: ${minutes} دقيقة : ${seconds} ثانية`;
            } else {
              const remaining = timer.duration * 60 * 1000 - elapsedMs;
              const remainingMin = Math.max(Math.floor(remaining / 60000), 0);
              const remainingSec = Math.max(Math.floor((remaining % 60000) / 1000), 0);
              timeDisplay = `تبقى: ${remainingMin} دقيقة : ${remainingSec} ثانية`;
            }
          }

          return (
            <div key={table.id} style={getTableCardStyle(isActive)}>
              {/* Status Indicator */}
              <div style={statusIndicatorStyle(isActive)}></div>

              {/* Table Image */}
              <div style={tableImageContainerStyle}>
                <img 
                  src={tableImage} 
                  alt="Table" 
                  style={tableImageStyle}
                />
              </div>

              {/* Table Number */}
              <h2 style={tableNumberStyle}>
                طاولة رقم {table.table_number}
              </h2>

              {/* Timer Display */}
              {isActive && (
                <>
                  <div style={timerDisplayStyle}>
                    {timeDisplay}
                  </div>

                  {timer?.paused && (
                    <div style={{ textAlign: "center", color: "#f59e0b", fontWeight: "600" }}>
                      (موقوف مؤقتاً)
                    </div>
                  )}
                </>
              )}

              {/* Action Buttons */}
              <div style={buttonContainerStyle}>
                <button 
                  onClick={() => setStartingTable(table)} 
                  disabled={isActive} 
                  style={getButtonStyle("start", isActive)}
                >
                  ابدأ
                </button>
                <button 
                  onClick={() => endSession(table)} 
                  disabled={!isActive} 
                  style={getButtonStyle("end", !isActive)}
                >
                  أغلق
                </button>

                <button
                  onClick={() => togglePause(table.id)}
                  disabled={!isActive}
                  style={getButtonStyle("pause", !isActive)}>
                  {timers[table.id]?.paused ? "استئناف" : "إيقاف مؤقت"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Start Session Modal */}
      {startingTable && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            {/* Modal Header */}
            <div style={modalHeaderStyle}>
              <h2 style={modalTitleStyle}>
                بدء جلسة جديدة
              </h2>
              <p style={modalSubtitleStyle}>
                طاولة رقم {startingTable.table_number}
              </p>
            </div>

            {/* Notes Section */}
            <div style={inputGroupStyle}>
              <label style={labelStyle}>
                ملاحظات
              </label>
              <textarea 
                value={note} 
                onChange={(e) => setNote(e.target.value)} 
                placeholder="أضف ملاحظات إضافية..."
                style={textareaStyle}
              />
            </div>

            {/* Session Type Selection */}
            <div style={inputGroupStyle}>
              <label style={labelStyle}>
                نوع الجلسة
              </label>
              <div style={radioGroupStyle}>
                <label 
                  style={getRadioOptionStyle(sessionType === "open")}
                  onClick={() => setSessionType("open")}
                >
                  <input 
                    type="radio" 
                    value="open" 
                    checked={sessionType === "open"} 
                    onChange={() => setSessionType("open")}
                    style={{ accentColor: "#A2AF9B" }}
                  />
                  <div>
                    <div style={radioLabelStyle}>وقت مفتوح</div>
                    <div style={radioDescStyle}>جلسة بدون حد زمني محدد</div>
                  </div>
                </label>
                <label 
                  style={getRadioOptionStyle(sessionType === "fixed")}
                  onClick={() => setSessionType("fixed")}
                >
                  <input 
                    type="radio" 
                    value="fixed" 
                    checked={sessionType === "fixed"} 
                    onChange={() => setSessionType("fixed")}
                    style={{ accentColor: "#A2AF9B" }}
                  />
                  <div>
                    <div style={radioLabelStyle}>وقت محدد</div>
                    <div style={radioDescStyle}>جلسة بوقت محدد مسبقاً</div>
                  </div>
                </label>
              </div>
              
              {sessionType === "fixed" && (
                <div style={durationInputStyle}>
                  <input 
                    type="number" 
                    value={duration} 
                    onChange={(e) => setDuration(e.target.value)} 
                    style={numberInputStyle}
                    placeholder="60"
                    min="1"
                  />
                  <span style={{ color: "#A2AF9B", fontWeight: "600" }}>دقيقة</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={modalActionsStyle}>
              <button 
                onClick={() => setStartingTable(null)} 
                style={cancelButtonStyle}
              >
                إلغاء
              </button>
              <button 
                onClick={() => startSession(startingTable)} 
                style={confirmButtonStyle}
              >
                ابدأ الجلسة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {alertMessage && (
        <div style={alertModalStyle}>
          <div style={alertContentStyle}>
            <div style={alertMessageStyle}>
              {alertMessage}
            </div>
            <button
              onClick={() => setAlertMessage(null)}
              style={alertButtonStyle}
            >
              تم الفهم
            </button>
          </div>
        </div>
      )}
    </div>
  );
}