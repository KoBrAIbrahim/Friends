import { useDateRange } from "../../contexts/DateRangeContext";

export default function CashFlowCard({ 
  totalRevenue = 0, 
  expensesTotal = 0 
}) {
  const { initialCash, sessionActive, presetFilter } = useDateRange();

  // Only show this card when we're in session mode and have initial cash
  if (presetFilter !== "session" || initialCash === 0) {
    return null;
  }

  const netCashFlow = initialCash + totalRevenue - expensesTotal;
  const isPositive = netCashFlow >= initialCash;

  const cardStyle = {
    backgroundColor: isPositive ? '#059669' : '#dc2626',
    color: 'white',
    border: `1px solid ${isPositive ? '#047857' : '#b91c1c'}`,
    borderRadius: '8px',
    padding: '24px'
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  };

  const cardTitleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: 'white',
    margin: '0 0 4px 0'
  };

  const cardSubtitleStyle = {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.9)',
    margin: 0
  };

  const amountStyle = {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '16px',
    color: 'white'
  };

  const currencyStyle = {
    fontSize: '20px',
    color: 'rgba(255, 255, 255, 0.9)',
    marginRight: '8px'
  };

  const cardFooterStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.2)'
  };

  const footerItemStyle = {
    textAlign: 'center'
  };

  const footerLabelStyle = {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.8)',
    margin: '0 0 4px 0'
  };

  const footerValueStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    margin: 0
  };

  const calculationStyle = {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '6px'
  };

  return (
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
            <h3 style={cardTitleStyle}>صافي التدفق النقدي</h3>
            <p style={cardSubtitleStyle}>الرصيد + الإيرادات - المصاريف</p>
          </div>
        </div>
        <div style={{
          fontSize: '24px'
        }}>
          {isPositive ? '📈' : '📉'}
        </div>
      </div>

      <div style={calculationStyle}>
        {initialCash.toFixed(2)} + {totalRevenue.toFixed(2)} - {expensesTotal.toFixed(2)} = {netCashFlow.toFixed(2)} ₪
      </div>
      
      <div style={amountStyle}>
        {netCashFlow.toFixed(2)}
        <span style={currencyStyle}>₪</span>
      </div>
      
      <div style={cardFooterStyle}>
        <div style={footerItemStyle}>
          <p style={footerLabelStyle}>رصيد البداية</p>
          <p style={footerValueStyle}>{initialCash.toFixed(2)} ₪</p>
        </div>
        <div style={footerItemStyle}>
          <p style={footerLabelStyle}>صافي الربح</p>
          <p style={footerValueStyle}>
            {(netCashFlow - initialCash).toFixed(2)} ₪
          </p>
        </div>
        <div style={footerItemStyle}>
          <p style={footerLabelStyle}>حالة النقد</p>
          <p style={footerValueStyle}>
            {isPositive ? '✅ موجب' : '❌ سالب'}
          </p>
        </div>
      </div>
    </div>
  );
}

