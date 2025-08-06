import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase";

export default function AccountsPage({ tournamentId }) {
  const [subscriptionFee, setSubscriptionFee] = useState(0);
  const [prizes, setPrizes] = useState([]);
  const [newPrize, setNewPrize] = useState("");
  const [newPrizeAmount, setNewPrizeAmount] = useState(0);
  const [tournament, setTournament] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTournamentData = async () => {
      setLoading(true);
      try {
        const tournamentRef = doc(db, "tournaments", tournamentId);
        const tournamentSnap = await getDoc(tournamentRef);
        if (tournamentSnap.exists()) {
          const tournamentData = tournamentSnap.data();
          setSubscriptionFee(tournamentData.subscriptionFee || 0);
          setPrizes(tournamentData.prizes || []);
          setTournament(tournamentData);
        }
      } catch  {
        triggerToast("خطأ في تحميل البيانات", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchTournamentData();
  }, [tournamentId]);

  const handleSaveData = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const tournamentRef = doc(db, "tournaments", tournamentId);
      await updateDoc(tournamentRef, {
        subscriptionFee: Number(subscriptionFee),
        prizes,
      });
      triggerToast("تم حفظ البيانات بنجاح", "success");
    } catch  {
      triggerToast("خطأ في حفظ البيانات", "error");
    } finally {
      setLoading(false);
    }
  };

  const addNewPrize = () => {
    if (!newPrize.trim() || !newPrizeAmount || newPrizeAmount <= 0) {
      triggerToast("يرجى إدخال بيانات الجائزة بشكل صحيح", "error");
      return;
    }
    const updatedPrizes = [...prizes, { 
      id: Date.now(), 
      name: newPrize.trim(), 
      amount: Number(newPrizeAmount) 
    }];
    setPrizes(updatedPrizes);
    setNewPrize("");
    setNewPrizeAmount(0);
    triggerToast("تم إضافة الجائزة بنجاح", "success");
  };

const removePrize = async (name, amount) => {
  const updatedPrizes = prizes.filter(
    (prize) => !(prize.name === name && prize.amount === amount)
  );
  setPrizes(updatedPrizes);

  try {
    const tournamentRef = doc(db, "tournaments", tournamentId);
    await updateDoc(tournamentRef, {
      prizes: updatedPrizes,
    });
    triggerToast("✅ تم حذف الجائزة بنجاح", "success");
  } catch (err) {
    console.error("❌ فشل حذف الجائزة:", err);
    triggerToast("❌ فشل حذف الجائزة من فايربيس", "error");
  }
};




  const triggerToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // الحسابات
  const totalParticipants = tournament?.participants?.length || 0;
  const paidParticipants = tournament?.participants?.filter(p => p.paid).length || 0;
  const totalCollectedAmount = paidParticipants * subscriptionFee;
  const totalExpectedAmount = totalParticipants * subscriptionFee;
  const totalPrizesValue = prizes.reduce((sum, prize) => sum + prize.amount, 0);
  const netProfit = totalCollectedAmount - totalPrizesValue;

  const toastStyles = {
    success: { backgroundColor: "#A2AF9B", borderLeft: "4px solid #8FA086" },
    error: { backgroundColor: "#D32F2F", borderLeft: "4px solid #B71C1C" },
    info: { backgroundColor: "#A2AF9B", borderLeft: "4px solid #8FA086" }
  };

  return (
    <div style={{ 
      backgroundColor: "#EEEEEE", 
      minHeight: "100vh", 
      padding: "2rem 1rem",
      fontFamily: "'Cairo', 'Segoe UI', 'Tahoma', sans-serif",
      direction: "rtl"
    }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{
          ...toastStyles[toast.type],
          color: "white",
          padding: "12px 20px",
          borderRadius: "8px",
          marginBottom: "20px",
          textAlign: "center",
          fontWeight: "600",
          fontSize: "14px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          minWidth: "300px"
        }}>
          {toast.message}
        </div>
      )}

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* العنوان الرئيسي */}
        <div style={{
          backgroundColor: "#FAF9EE",
          padding: "1.5rem 2rem",
          borderRadius: "12px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          marginBottom: "2rem",
          borderTop: "4px solid #A2AF9B"
        }}>
          <h1 style={{
            color: "#333",
            margin: 0,
            fontSize: "24px",
            fontWeight: "700",
            textAlign: "center"
          }}>
            إدارة الحسابات والجوائز
          </h1>
          <p style={{
            color: "#666",
            margin: "8px 0 0 0",
            fontSize: "14px",
            textAlign: "center"
          }}>
            إعدادات الاشتراكات وإدارة الجوائز والتقارير المالية
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          
          {/* قسم إعدادات الاشتراك والجوائز */}
          <div style={{
            backgroundColor: "#FAF9EE",
            padding: "2rem",
            borderRadius: "12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            border: "1px solid #E8E6D9"
          }}>
            <h2 style={{
              color: "#333",
              marginBottom: "1.5rem",
              fontSize: "18px",
              fontWeight: "600",
              borderBottom: "2px solid #DCCFC0",
              paddingBottom: "8px"
            }}>
              إعدادات الاشتراك
            </h2>

            <div style={{ marginBottom: "2rem" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#555",
                fontSize: "14px"
              }}>
                قيمة الاشتراك (شيكل):
              </label>
              <input
                type="number"
                value={subscriptionFee}
                onChange={(e) => setSubscriptionFee(e.target.value)}
                min="0"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "2px solid #E8E6D9",
                  backgroundColor: "#fff",
                  fontSize: "16px",
                  fontWeight: "500",
                  outline: "none",
                  transition: "border-color 0.3s ease",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => e.target.style.borderColor = "#A2AF9B"}
                onBlur={(e) => e.target.style.borderColor = "#E8E6D9"}
              />
            </div>

            <h3 style={{
              color: "#333",
              marginBottom: "1rem",
              fontSize: "16px",
              fontWeight: "600",
              borderBottom: "1px solid #DCCFC0",
              paddingBottom: "6px"
            }}>
              الجوائز المحددة
            </h3>

            {prizes.length === 0 ? (
              <div style={{
                backgroundColor: "#F5F5F5",
                padding: "20px",
                borderRadius: "8px",
                textAlign: "center",
                color: "#999",
                fontSize: "14px",
                marginBottom: "1rem"
              }}>
                لم يتم تحديد أي جوائز بعد
              </div>
            ) : (
              <div style={{ marginBottom: "1rem", maxHeight: "200px", overflowY: "auto" }}>
                {prizes.map((prize, index) => (
                  <div key={prize.id || index} style={{
                    backgroundColor: "#DCCFC0",
                    marginBottom: "8px",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "14px"
                  }}>
                    <span style={{ fontWeight: "500" }}>
                      {prize.name} - {prize.amount} ₪
                    </span>
                    <button
                       onClick={() => removePrize(prize.name, prize.amount)}
                      style={{
                        backgroundColor: "#D32F2F",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "500"
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = "#B71C1C"}
                      onMouseOut={(e) => e.target.style.backgroundColor = "#D32F2F"}
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ 
              display: "flex", 
              flexDirection: "column",
              gap: "12px",
              marginBottom: "1.5rem"
            }}>
              <input
                type="text"
                placeholder="اسم الجائزة"
                value={newPrize}
                onChange={(e) => setNewPrize(e.target.value)}
                style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "2px solid #E8E6D9",
                  backgroundColor: "#fff",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.3s ease"
                }}
                onFocus={(e) => e.target.style.borderColor = "#A2AF9B"}
                onBlur={(e) => e.target.style.borderColor = "#E8E6D9"}
              />
              <input
                type="number"
                placeholder="قيمة الجائزة (شيكل)"
                value={newPrizeAmount}
                onChange={(e) => setNewPrizeAmount(e.target.value)}
                min="0"
                style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "2px solid #E8E6D9",
                  backgroundColor: "#fff",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.3s ease"
                }}
                onFocus={(e) => e.target.style.borderColor = "#A2AF9B"}
                onBlur={(e) => e.target.style.borderColor = "#E8E6D9"}
              />
              <button
                onClick={addNewPrize}
                disabled={loading}
                style={{
                  backgroundColor: "#A2AF9B",
                  color: "white",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  opacity: loading ? 0.7 : 1,
                  transition: "all 0.3s ease"
                }}
                onMouseOver={(e) => {
                  if (!loading) e.target.style.backgroundColor = "#8FA086";
                }}
                onMouseOut={(e) => {
                  if (!loading) e.target.style.backgroundColor = "#A2AF9B";
                }}
              >
                إضافة جائزة
              </button>
            </div>

            <button
              onClick={handleSaveData}
              disabled={loading}
              style={{
                width: "100%",
                backgroundColor: "#A2AF9B",
                color: "white",
                padding: "14px 24px",
                borderRadius: "8px",
                border: "none",
                fontWeight: "600",
                fontSize: "16px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px rgba(162, 175, 155, 0.3)"
              }}
              onMouseOver={(e) => {
                if (!loading) e.target.style.backgroundColor = "#8FA086";
              }}
              onMouseOut={(e) => {
                if (!loading) e.target.style.backgroundColor = "#A2AF9B";
              }}
            >
              {loading ? "جاري الحفظ..." : "حفظ جميع البيانات"}
            </button>
          </div>

          {/* قسم التقارير المالية */}
          <div style={{
            backgroundColor: "#FAF9EE",
            padding: "2rem",
            borderRadius: "12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            border: "1px solid #E8E6D9"
          }}>
            <h2 style={{
              color: "#333",
              marginBottom: "1.5rem",
              fontSize: "18px",
              fontWeight: "600",
              borderBottom: "2px solid #DCCFC0",
              paddingBottom: "8px"
            }}>
              التقرير المالي
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                backgroundColor: "#DCCFC0",
                borderRadius: "8px",
                fontSize: "14px"
              }}>
                <span style={{ fontWeight: "500" }}>إجمالي المشاركين:</span>
                <span style={{ fontWeight: "700", color: "#333" }}>{totalParticipants}</span>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                backgroundColor: "#DCCFC0",
                borderRadius: "8px",
                fontSize: "14px"
              }}>
                <span style={{ fontWeight: "500" }}>المشاركين المدفوعين:</span>
                <span style={{ fontWeight: "700", color: "#333" }}>{paidParticipants}</span>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                backgroundColor: "#A2AF9B",
                borderRadius: "8px",
                fontSize: "14px",
                color: "white"
              }}>
                <span style={{ fontWeight: "500" }}>المبلغ المحصل:</span>
                <span style={{ fontWeight: "700" }}>{totalCollectedAmount} ₪</span>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                backgroundColor: "#DCCFC0",
                borderRadius: "8px",
                fontSize: "14px"
              }}>
                <span style={{ fontWeight: "500" }}>المبلغ المتوقع:</span>
                <span style={{ fontWeight: "700", color: "#333" }}>{totalExpectedAmount} ₪</span>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                backgroundColor: "#DCCFC0",
                borderRadius: "8px",
                fontSize: "14px"
              }}>
                <span style={{ fontWeight: "500" }}>إجمالي الجوائز:</span>
                <span style={{ fontWeight: "700", color: "#333" }}>{totalPrizesValue} ₪</span>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                backgroundColor: netProfit >= 0 ? "#4CAF50" : "#F44336",
                borderRadius: "8px",
                fontSize: "14px",
                color: "white",
                fontWeight: "600",
                marginTop: "8px"
              }}>
                <span>الربح الصافي:</span>
                <span style={{ fontWeight: "700" }}>{netProfit} ₪</span>
              </div>

            </div>

            {totalParticipants > 0 && (
              <div style={{
                marginTop: "1.5rem",
                padding: "16px",
                backgroundColor: "#F8F8F8",
                borderRadius: "8px",
                border: "1px solid #E0E0E0"
              }}>
                <h4 style={{
                  margin: "0 0 12px 0",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#333"
                }}>
                  إحصائيات إضافية:
                </h4>
                <div style={{ fontSize: "12px", color: "#666", lineHeight: "1.5" }}>
                  <div>معدل الدفع: {((paidParticipants / totalParticipants) * 100).toFixed(1)}%</div>
                  <div>متوسط قيمة الجائزة: {prizes.length > 0 ? (totalPrizesValue / prizes.length).toFixed(2) : 0} ₪</div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}