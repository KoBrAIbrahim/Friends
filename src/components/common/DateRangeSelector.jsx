import { useDateRange } from "../../contexts/DateRangeContext";

export default function DateRangeSelector() {
  const {
    startDate,
    endDate,
    presetFilter,
    setStartDate,
    setEndDate,
    setPresetFilter,
    getFilterDisplayName
  } = useDateRange();

  const handlePresetChange = (value) => {
    setPresetFilter(value);
  };

  const handleStartDateChange = (value) => {
    setStartDate(value);
    // If no end date is set, automatically set it to the same as start date
    if (!endDate || endDate < value) {
      setEndDate(value);
    }
    if (presetFilter !== "custom") {
      setPresetFilter("custom");
    }
  };

  const handleEndDateChange = (value) => {
    setEndDate(value);
    if (presetFilter !== "custom") {
      setPresetFilter("custom");
    }
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

  return (
    <div style={filterSectionStyle}>
      <div style={filterGridStyle}>
        {[
          { key: "session", label: "جلسة العمل", desc: "الجلسة النشطة أو المكتملة" },
          { key: "week", label: "الأسبوع", desc: "آخر 7 أيام" },
          { key: "month", label: "الشهر", desc: "آخر 30 يوم" },
          { key: "custom", label: "يوم محدد", desc: "اختيار يوم عمل بعينه" }
        ].map((filterOption) => (
          <button
            key={filterOption.key}
            onClick={() => handlePresetChange(filterOption.key)}
            style={getFilterButtonStyle(presetFilter === filterOption.key)}
            className="filter-hover"
          >
            <h3 style={filterButtonTextStyle}>{filterOption.label}</h3>
            <p style={filterButtonDescStyle}>{filterOption.desc}</p>
          </button>
        ))}
      </div>

      {presetFilter === "custom" && (
        <div style={customDateStyle}>
          {/* Info about day-specific filtering */}
          <div style={{
            gridColumn: '1 / -1',
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#f0f4f0',
            borderRadius: '6px',
            border: '1px solid #A2AF9B'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '4px'
            }}>
              📅 اختيار يوم محدد
            </div>
            <div style={{
              fontSize: '12px',
              color: '#64748b'
            }}>
              سيتم عرض جميع الأنشطة لليوم المحدد فقط
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '16px',
            maxWidth: '300px',
            margin: '0 auto'
          }}>
            <div style={dateInputGroupStyle}>
              <label style={dateInputLabelStyle}>
                📅 اختر التاريخ
                <span style={{
                  fontSize: '12px',
                  color: '#A2AF9B',
                  fontWeight: '400',
                  marginRight: '8px'
                }}>
                  (معلومات هذا اليوم فقط)
                </span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                style={{
                  ...dateInputStyle,
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              />
            </div>
            
            {/* Quick day selection buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '8px',
              marginBottom: '16px'
            }}>
              {[
                { label: 'اليوم', days: 0 },
                { label: 'أمس', days: -1 },
                { label: 'أول أمس', days: -2 },
                { label: 'قبل 3 أيام', days: -3 }
              ].map((option) => {
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + option.days);
                const dateStr = targetDate.toISOString().split('T')[0];
                
                return (
                  <button
                    key={option.days}
                    onClick={() => handleStartDateChange(dateStr)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: startDate === dateStr ? '#A2AF9B' : 'white',
                      color: startDate === dateStr ? 'white' : '#1e293b',
                      border: `1px solid ${startDate === dateStr ? '#A2AF9B' : '#d1d5db'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (startDate !== dateStr) {
                        e.target.style.backgroundColor = '#f3f4f6';
                        e.target.style.borderColor = '#A2AF9B';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (startDate !== dateStr) {
                        e.target.style.backgroundColor = 'white';
                        e.target.style.borderColor = '#d1d5db';
                      }
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {/* Show selected date info */}
            {startDate && (
              <div style={{
                textAlign: 'center',
                padding: '16px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '2px solid #A2AF9B'
              }}>
                                 <div style={{
                   fontSize: '14px',
                   color: '#1e293b',
                   fontWeight: '600',
                   marginBottom: '8px'
                 }}>
                   📅 اليوم المحدد:
                 </div>
                 <div style={{
                   fontSize: '18px',
                   color: '#A2AF9B',
                   fontWeight: '700'
                 }}>
                   {new Date(startDate + 'T00:00:00').toLocaleDateString('ar-EG', {
                     weekday: 'long',
                     year: 'numeric',
                     month: 'long',
                     day: 'numeric'
                   })}
                 </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
