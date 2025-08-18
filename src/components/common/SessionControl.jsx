import { useState } from "react";
import { useDateRange } from "../../contexts/DateRangeContext";

export default function SessionControl() {
  const {
    sessionActive,
    sessionStartTime,
    sessionEndTime,
    initialCash,
    startSession,
    endSession,
    getFilterDisplayName
  } = useDateRange();

  const [showCashModal, setShowCashModal] = useState(false);
  const [cashAmount, setCashAmount] = useState("");

  const sessionControlStyle = {
    backgroundColor: 'white',
    border: '2px solid #A2AF9B',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    textAlign: 'center'
  };

  const sessionHeaderStyle = {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px'
  };

  const sessionStatusStyle = {
    fontSize: '16px',
    marginBottom: '20px',
    padding: '12px',
    borderRadius: '8px',
    fontWeight: '600'
  };

  const activeStatusStyle = {
    ...sessionStatusStyle,
    backgroundColor: '#dcfce7',
    color: '#166534',
    border: '1px solid #bbf7d0'
  };

  const inactiveStatusStyle = {
    ...sessionStatusStyle,
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db'
  };

  const completedStatusStyle = {
    ...sessionStatusStyle,
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    border: '1px solid #93c5fd'
  };

  const buttonStyle = {
    padding: '16px 32px',
    fontSize: '18px',
    fontWeight: '700',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '140px'
  };

  const startButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#10b981',
    color: 'white'
  };

  const endButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#ef4444',
    color: 'white'
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#9ca3af',
    color: '#f3f4f6',
    cursor: 'not-allowed'
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    alignItems: 'center'
  };

  const getSessionDuration = () => {
    if (!sessionStartTime) return "";
    const end = sessionEndTime || new Date();
    const duration = end - sessionStartTime;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} ساعة و ${minutes} دقيقة`;
  };

  const handleStartSession = () => {
    setShowCashModal(true);
  };

  const handleConfirmStart = () => {
    const cash = parseFloat(cashAmount) || 0;
    startSession(cash);
    setShowCashModal(false);
    setCashAmount("");
  };

  const handleCancelStart = () => {
    setShowCashModal(false);
    setCashAmount("");
  };

  const getStatusDisplay = () => {
    if (sessionActive && sessionStartTime) {
      return (
        <div style={activeStatusStyle}>
          🟢 جلسة نشطة - بدأت في {sessionStartTime.toLocaleTimeString('ar-EG')}
          <br />
          <small>المدة: {getSessionDuration()}</small>
          {initialCash > 0 && (
            <>
              <br />
              <small>💰 رصيد البداية: {initialCash.toFixed(2)} ₪</small>
            </>
          )}
        </div>
      );
    } else if (sessionStartTime && sessionEndTime) {
      return (
        <div style={completedStatusStyle}>
          ✅ آخر جلسة اكتملت
          <br />
          <small>
            من {sessionStartTime.toLocaleTimeString('ar-EG')} إلى {sessionEndTime.toLocaleTimeString('ar-EG')}
            <br />
            المدة الكاملة: {getSessionDuration()}
          </small>
          {initialCash > 0 && (
            <>
              <br />
              <small>💰 رصيد البداية: {initialCash.toFixed(2)} ₪</small>
            </>
          )}
        </div>
      );
    } else {
      return (
        <div style={inactiveStatusStyle}>
          ⚪ لا توجد جلسة نشطة
          <br />
          <small>اضغط "بدء اليوم" لبدء جلسة جديدة</small>
        </div>
      );
    }
  };

  return (
    <div style={sessionControlStyle}>
      <div style={sessionHeaderStyle}>
        <span>📊</span>
        <span>إدارة جلسة العمل</span>
        <span>📊</span>
      </div>

      {getStatusDisplay()}

      <div style={buttonContainerStyle}>
        <button
          onClick={handleStartSession}
          disabled={sessionActive}
          style={sessionActive ? disabledButtonStyle : startButtonStyle}
          onMouseEnter={(e) => {
            if (!sessionActive) {
              e.target.style.backgroundColor = '#059669';
            }
          }}
          onMouseLeave={(e) => {
            if (!sessionActive) {
              e.target.style.backgroundColor = '#10b981';
            }
          }}
        >
          🚀 بدء اليوم
        </button>

        <button
          onClick={endSession}
          disabled={!sessionActive}
          style={!sessionActive ? disabledButtonStyle : endButtonStyle}
          onMouseEnter={(e) => {
            if (sessionActive) {
              e.target.style.backgroundColor = '#dc2626';
            }
          }}
          onMouseLeave={(e) => {
            if (sessionActive) {
              e.target.style.backgroundColor = '#ef4444';
            }
          }}
        >
          🏁 إنهاء اليوم
        </button>
      </div>

      {/* Cash Input Modal */}
      {showCashModal && (
        <div style={{
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
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            border: '2px solid #A2AF9B',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '16px'
            }}>
              💰 رصيد بداية اليوم
            </div>
            
            <div style={{
              fontSize: '16px',
              color: '#64748b',
              marginBottom: '24px'
            }}>
              كم من المال لديك في بداية اليوم؟
            </div>

            <input
              type="number"
              inputMode="decimal"
              placeholder="مثال: 500.00"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '18px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                textAlign: 'center',
                marginBottom: '24px',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#A2AF9B';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
              }}
              autoFocus
            />

            <div style={buttonContainerStyle}>
              <button
                onClick={handleCancelStart}
                style={{
                  ...buttonStyle,
                  backgroundColor: '#6b7280',
                  color: 'white'
                }}
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmStart}
                style={startButtonStyle}
              >
                بدء اليوم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
