import { createContext, useContext, useState, useEffect } from "react";

const DateRangeContext = createContext();

export const useDateRange = () => {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
};

export const DateRangeProvider = ({ children }) => {
  // Initialize with today's date range
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [presetFilter, setPresetFilter] = useState(() => {
    return localStorage.getItem('dateRangeFilter') || "session";
  });
  
  // Session management with localStorage persistence
  const [sessionActive, setSessionActive] = useState(() => {
    return localStorage.getItem('sessionActive') === 'true';
  });
  const [sessionStartTime, setSessionStartTime] = useState(() => {
    const stored = localStorage.getItem('sessionStartTime');
    return stored ? new Date(stored) : null;
  });
  const [sessionEndTime, setSessionEndTime] = useState(() => {
    const stored = localStorage.getItem('sessionEndTime');
    return stored ? new Date(stored) : null;
  });
  const [initialCash, setInitialCash] = useState(() => {
    const stored = localStorage.getItem('sessionInitialCash');
    return stored ? parseFloat(stored) : 0;
  });
  
  // New state for session-based filtering
  const [sessionFilterMode, setSessionFilterMode] = useState(false);
  const [foundSessionRanges, setFoundSessionRanges] = useState([]);

  // Helper function to find sessions that started on a specific date
  const findSessionsStartingOnDate = async (targetDate) => {
    try {
      // This would need to query the database for sessions
      // For now, we'll use a placeholder implementation
      return [];
    } catch (error) {
      console.error("Error finding sessions:", error);
      return [];
    }
  };

  // Update dates when preset filter changes
  useEffect(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (presetFilter) {
      case "week":
        start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000); // 7 days ago
        end = new Date();
        break;
      case "month":
        start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000); // 30 days ago
        end = new Date();
        break;
      case "custom":
        // Keep current dates when switching to custom
        return;
      case "session":
        // Session dates are handled separately
        return;
      default:
        // Default to current session or today
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, [presetFilter]);

  // Persist filter changes to localStorage
  useEffect(() => {
    if (presetFilter !== "session") {
      localStorage.setItem('dateRangeFilter', presetFilter);
    }
  }, [presetFilter]);

  // Session management functions
  const startSession = (cashAmount = 0) => {
    const now = new Date();
    setSessionActive(true);
    setSessionStartTime(now);
    setSessionEndTime(null);
    setInitialCash(cashAmount);
    setPresetFilter("session");
    
    // Persist to localStorage
    localStorage.setItem('sessionActive', 'true');
    localStorage.setItem('sessionStartTime', now.toISOString());
    localStorage.setItem('sessionInitialCash', cashAmount.toString());
    localStorage.removeItem('sessionEndTime');
    localStorage.setItem('dateRangeFilter', 'session');
  };

  const endSession = () => {
    const now = new Date();
    setSessionEndTime(now);
    setSessionActive(false);
    
    // Persist to localStorage
    localStorage.setItem('sessionActive', 'false');
    localStorage.setItem('sessionEndTime', now.toISOString());
  };

  // New helper function for session-aware date filtering
  const getSessionAwareDateRange = async (targetStartDate, targetEndDate) => {
    try {
      // Import necessary Firestore functions here to avoid issues
      const { collection, getDocs, query, orderBy } = await import("firebase/firestore");
      const { db } = await import("../services/firebase");

      const targetStart = new Date(targetStartDate);
      targetStart.setHours(0, 0, 0, 0);
      const targetEndActual = targetEndDate ? new Date(targetEndDate) : new Date(targetStartDate);
      targetEndActual.setHours(23, 59, 59, 999);

      // Look for any work sessions that started on the target date
      const billiardsQuery = query(collection(db, "sessions"), orderBy("start_time", "desc"));
      const billiardsSnap = await getDocs(billiardsQuery);
      
      const ordersQuery = query(collection(db, "order_sessions"), orderBy("created_at", "desc"));
      const ordersSnap = await getDocs(ordersQuery);

      let sessionStart = null;
      let sessionEnd = null;

      // Check for sessions that started on the target date
      billiardsSnap.forEach((doc) => {
        const data = doc.data();
        const startTime = data.start_time?.toDate?.() || new Date(data.start_time);
        
        if (startTime >= targetStart && startTime <= targetEndActual) {
          if (!sessionStart || startTime < sessionStart) {
            sessionStart = startTime;
          }
          const endTime = data.end_time?.toDate?.() || new Date(data.end_time);
          if (endTime && (!sessionEnd || endTime > sessionEnd)) {
            sessionEnd = endTime;
          }
        }
      });

      ordersSnap.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.created_at?.toDate?.() || new Date(data.created_at);
        
        if (createdAt >= targetStart && createdAt <= targetEndActual) {
          if (!sessionStart || createdAt < sessionStart) {
            sessionStart = createdAt;
          }
          // Orders don't have explicit end times, so extend to current time or next day
          const potentialEnd = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000); // Next day
          if (!sessionEnd || potentialEnd > sessionEnd) {
            sessionEnd = potentialEnd;
          }
        }
      });

      // If we found session data, use it; otherwise fall back to regular date range
      if (sessionStart) {
        return { 
          start: sessionStart, 
          end: sessionEnd || new Date() 
        };
      }
    } catch (error) {
      console.error("Error in session-aware filtering:", error);
    }

    // Fall back to regular date range
    const start = new Date(targetStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetEndDate || targetStartDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  // Helper function to get Date objects with proper time boundaries
  const getDateRange = () => {
    // If we're in session mode and session is active or completed
    if (presetFilter === "session" && sessionStartTime) {
      const start = new Date(sessionStartTime);
      const end = sessionEndTime ? new Date(sessionEndTime) : new Date(); // Current time if session is still active
      return { start, end };
    }
    
    // For custom filter, show data for the selected single day only
    if (presetFilter === "custom") {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(startDate); // Same day, not until today
      end.setHours(23, 59, 59, 999);
      
      return { start, end };
    }
    
    // Otherwise use the regular date range
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  };

  // Helper function to check if a date falls within the selected range
  const isDateInRange = (date) => {
    const { start, end } = getDateRange();
    const checkDate = date instanceof Date ? date : (date?.toDate ? date.toDate() : new Date(date));
    return checkDate >= start && checkDate <= end;
  };

  // Helper function to get filter display name
  const getFilterDisplayName = () => {
    switch (presetFilter) {
      case "week": return "آخر أسبوع";
      case "month": return "آخر شهر";
      case "session": 
        if (sessionActive) {
          return `جلسة نشطة (بدأت ${sessionStartTime?.toLocaleTimeString('ar-EG')})`;
        } else if (sessionStartTime && sessionEndTime) {
          return `آخر جلسة (${sessionStartTime?.toLocaleDateString('ar-EG')} ${sessionStartTime?.toLocaleTimeString('ar-EG')} - ${sessionEndTime?.toLocaleTimeString('ar-EG')})`;
        }
        return "جلسة";
                  case "custom": 
              return `يوم ${new Date(startDate + 'T00:00:00').toLocaleDateString('ar-EG')}`;
      default: return "مخصص";
    }
  };

  const value = {
    startDate,
    endDate,
    presetFilter,
    setStartDate,
    setEndDate,
    setPresetFilter,
    getDateRange,
    isDateInRange,
    getFilterDisplayName,
    // Session management
    sessionActive,
    sessionStartTime,
    sessionEndTime,
    initialCash,
    startSession,
    endSession
  };

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
};
