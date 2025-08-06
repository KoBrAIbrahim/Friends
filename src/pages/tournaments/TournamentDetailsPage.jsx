import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import DrawPage from "./DrawPage";
import BracketPage from "./BracketPage";
import AccountsPage from "./AccountsPage";

export default function TournamentDetailsPage() {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [newParticipant, setNewParticipant] = useState("");
  const [activeTab, setActiveTab] = useState("main");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTournament = async () => {
    const ref = doc(db, "tournaments", id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (!Array.isArray(data.participants)) {
        data.participants = [];
      }
      setTournament({ id: snap.id, ...data });
    }
  };

  const handleAddParticipant = async () => {
    if (!newParticipant.trim()) {
      window.alert("⚠️ يرجى إدخال اسم المشارك");
      return;
    }

    setIsLoading(true);
    const ref = doc(db, "tournaments", id);
    const newEntry = { name: newParticipant.trim(), paid: false };

    try {
      await updateDoc(ref, {
        participants: arrayUnion(newEntry),
      });
      setNewParticipant("");
      window.alert(`✅ تم إضافة المشارك "${newEntry.name}" بنجاح!`);
      fetchTournament();
    } catch (error) {
      console.error("Error adding participant:", error);
      window.alert("❌ حدث خطأ أثناء إضافة المشارك");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePayment = async (participant) => {
    const ref = doc(db, "tournaments", id);
    try {
      await updateDoc(ref, {
        participants: arrayRemove(participant),
      });
      await updateDoc(ref, {
        participants: arrayUnion({ ...participant, paid: !participant.paid }),
      });
      !participant.paid ? "مدفوع" : "غير مدفوع";
      //window.alert(`✅ تم تغيير حالة الدفع للمشارك "${participant.name}" إلى: ${status}`);
      fetchTournament();
    } catch (err) {
      console.error("فشل تعديل حالة الدفع:", err);
      window.alert("❌ حدث خطأ أثناء تغيير حالة الدفع");
    }
  };

  const confirmDelete = async () => {
    const participant = showDeleteConfirm;
    setShowDeleteConfirm(null);
    
    const ref = doc(db, "tournaments", id);
    try {
      await updateDoc(ref, {
        participants: arrayRemove(participant),
      });
      window.alert(`✅ تم حذف المشارك "${participant.name}" بنجاح!`);
      fetchTournament();
    } catch (error) {
      console.error("Error deleting participant:", error);
      window.alert(`❌ حدث خطأ أثناء حذف المشارك "${participant.name}"`);
    }
  };

  const handleSaveEdit = async (oldParticipant) => {
    if (!editedName.trim()) {
      window.alert("⚠️ يرجى إدخال اسم صحيح");
      return;
    }

    const ref = doc(db, "tournaments", id);
    try {
      await updateDoc(ref, {
        participants: arrayRemove(oldParticipant),
      });
      await updateDoc(ref, {
        participants: arrayUnion({ ...oldParticipant, name: editedName.trim() }),
      });
      setEditingIndex(null);
      setEditedName("");
      //window.alert(`✅ تم تعديل اسم المشارك إلى "${editedName.trim()}" بنجاح!`);
      fetchTournament();
    } catch (error) {
      console.error("Error editing participant:", error);
      window.alert("❌ حدث خطأ أثناء تعديل المشارك");
    }
  };

  useEffect(() => {
    fetchTournament();
  }, [id]);

  if (!tournament) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        backgroundColor: "#F8F9FA"
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
          padding: "2rem",
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <div style={{
            width: "32px",
            height: "32px",
            border: "3px solid #A2AF9B",
            borderTop: "3px solid transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }}></div>
          <p style={{
            color: "#6B7280",
            fontSize: "0.875rem",
            margin: 0
          }}>
            جاري تحميل بيانات البطولة...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: "2rem",
      backgroundColor: "#F8F9FA",
      minHeight: "100vh",
      fontFamily: "'Segoe UI', 'Cairo', Tahoma, Arial, sans-serif"
    }}>
      {/* Tab Navigation */}
      <div style={{
        backgroundColor: "#FFFFFF",
        padding: "1rem",
        marginBottom: "2rem",
        border: "1px solid #E5E7EB",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
      }}>
        <div style={{
          display: "flex",
          gap: "0.5rem",
          overflowX: "auto",
          paddingBottom: "0.5rem"
        }}>
          {[
            { key: "main", label: "الرئيسية", icon: "🏠" },
            { key: "draw", label: "القرعة", icon: "🎲" },
            { key: "bracket", label: "الرسم الإقصائي", icon: "🏆" },
            { key: "accounts", label: "الحسابات", icon: "💰" }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1rem",
                backgroundColor: activeTab === tab.key ? "#A2AF9B" : "#F9FAFB",
                color: activeTab === tab.key ? "#FFFFFF" : "#374151",
                border: `1px solid ${activeTab === tab.key ? '#A2AF9B' : '#E5E7EB'}`,
                borderRadius: "6px",
                fontSize: "0.875rem",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
                minWidth: "auto"
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.key) {
                  e.target.style.backgroundColor = "#F3F4F6";
                  e.target.style.borderColor = "#A2AF9B";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.key) {
                  e.target.style.backgroundColor = "#F9FAFB";
                  e.target.style.borderColor = "#E5E7EB";
                }
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "main" && (
        <>
          {/* Tournament Info */}
          <div style={{
            backgroundColor: "#FFFFFF",
            padding: "2rem",
            marginBottom: "2rem",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1rem"
            }}>
              <div style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#A2AF9B",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem"
              }}>
                🏆
              </div>
              <div>
                <h1 style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  color: "#1F2937",
                  margin: 0,
                  marginBottom: "0.25rem"
                }}>
                  {tournament.name}
                </h1>
                <p style={{
                  fontSize: "0.875rem",
                  color: "#6B7280",
                  margin: 0
                }}>
                  📅 التاريخ: {tournament.date}
                </p>
              </div>
            </div>

            {/* Display final winner if exists */}
            {tournament.bracket && typeof tournament.bracket === "object" && (() => {
              const roundsArray = Object.keys(tournament.bracket)
                .sort((a, b) => parseInt(a.replace("round_", "")) - parseInt(b.replace("round_", "")))
                .map((key) => tournament.bracket[key]);

              const finalRound = roundsArray[roundsArray.length - 1];
              const finalMatch = finalRound && finalRound[0];

              return finalMatch?.winner ? (
                <div style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  backgroundColor: "#D1FAE5",
                  border: "1px solid #A7F3D0",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem"
                }}>
                  <span style={{ fontSize: "1.25rem" }}>👑</span>
                  <span style={{
                    color: "#065F46",
                    fontWeight: "600",
                    fontSize: "1rem"
                  }}>
                    الفائز بالبطولة: {finalMatch.winner}
                  </span>
                </div>
              ) : null;
            })()}
          </div>

          {/* Add Participant Section */}
          <div style={{
            backgroundColor: "#FFFFFF",
            padding: "1.5rem",
            marginBottom: "2rem",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
          }}>
            <h3 style={{
              fontSize: "1rem",
              fontWeight: "600",
              color: "#1F2937",
              margin: "0 0 1rem 0"
            }}>
              إضافة مشارك جديد
            </h3>
            <div style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "flex-end"
            }}>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "0.5rem"
                }}>
                  اسم المشارك
                </label>
                <input
                  type="text"
                  placeholder="أدخل اسم المشارك..."
                  value={newParticipant}
                  onChange={(e) => setNewParticipant(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddParticipant();
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #D1D5DB",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    backgroundColor: "#FFFFFF",
                    transition: "border-color 0.2s ease",
                    outline: "none"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#A2AF9B";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#D1D5DB";
                  }}
                />
              </div>
              <button
                onClick={handleAddParticipant}
                disabled={isLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  backgroundColor: isLoading ? "#8FA288" : "#A2AF9B",
                  color: "#FFFFFF",
                  border: `1px solid ${isLoading ? '#8FA288' : '#A2AF9B'}`,
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.8 : 1,
                  transition: "all 0.2s ease",
                  minWidth: "80px",
                  justifyContent: "center"
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.target.style.backgroundColor = "#8FA288";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.target.style.backgroundColor = "#A2AF9B";
                  }
                }}
              >
                {isLoading ? (
                  <div style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid #FFFFFF",
                    borderTop: "2px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }}></div>
                ) : (
                  <>
                    <span>+</span>
                    <span>إضافة</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Participants List */}
          <div style={{
            backgroundColor: "#FFFFFF",
            padding: "1.5rem",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.5rem",
              paddingBottom: "1rem",
              borderBottom: "1px solid #E5E7EB"
            }}>
              <h3 style={{
                fontSize: "1.125rem",
                fontWeight: "600",
                color: "#1F2937",
                margin: 0
              }}>
                المشاركون
              </h3>
              <div style={{
                padding: "0.25rem 0.75rem",
                backgroundColor: "#F3F4F6",
                color: "#6B7280",
                borderRadius: "12px",
                fontSize: "0.75rem",
                fontWeight: "500"
              }}>
                {tournament.participants.length} مشارك
              </div>
            </div>

            {tournament.participants.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "3rem",
                color: "#6B7280"
              }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👥</div>
                <p style={{
                  fontSize: "1rem",
                  fontWeight: "500",
                  margin: "0 0 0.5rem 0"
                }}>
                  لا يوجد مشاركين حتى الآن
                </p>
                <p style={{
                  fontSize: "0.875rem",
                  margin: 0
                }}>
                  ابدأ بإضافة المشاركين في البطولة
                </p>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gap: "0.75rem"
              }}>
                {tournament.participants.map((p, idx) => {
                  const isEditing = editingIndex === idx;

                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "1rem",
                        backgroundColor: "#F9FAFB",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#A2AF9B";
                        e.currentTarget.style.backgroundColor = "#F3F4F6";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#E5E7EB";
                        e.currentTarget.style.backgroundColor = "#F9FAFB";
                      }}
                    >
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        flex: 1
                      }}>
                        <div style={{
                          width: "32px",
                          height: "32px",
                          backgroundColor: p.paid ? "#D1FAE5" : "#FEE2E2",
                          color: p.paid ? "#059669" : "#DC2626",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.875rem",
                          fontWeight: "600"
                        }}>
                          {p.paid ? "✓" : "⏳"}
                        </div>
                        
                        {isEditing ? (
                          <input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveEdit(p);
                              }
                            }}
                            style={{
                              flex: 1,
                              padding: "0.5rem",
                              border: "1px solid #A2AF9B",
                              borderRadius: "4px",
                              fontSize: "0.875rem",
                              outline: "none"
                            }}
                            autoFocus
                          />
                        ) : (
                          <div>
                            <span style={{
                              fontSize: "0.875rem",
                              fontWeight: "500",
                              color: "#1F2937"
                            }}>
                              {p.name}
                            </span>
                            <div style={{
                              fontSize: "0.75rem",
                              color: p.paid ? "#059669" : "#DC2626",
                              fontWeight: "500"
                            }}>
                              {p.paid ? "✅ مدفوع" : "⏳ في انتظار الدفع"}
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "center"
                      }}>
                        <button
                          onClick={() => togglePayment(p)}
                          style={{
                            padding: "0.5rem 0.75rem",
                            backgroundColor: p.paid ? "#D1FAE5" : "#FEE2E2",
                            color: p.paid ? "#065F46" : "#991B1B",
                            border: `1px solid ${p.paid ? '#A7F3D0' : '#FECACA'}`,
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = p.paid ? "#A7F3D0" : "#FCA5A5";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = p.paid ? "#D1FAE5" : "#FEE2E2";
                          }}
                        >
                          {p.paid ? "مدفوع" : "تسديد"}
                        </button>

                        {isEditing ? (
                          <button
                            onClick={() => handleSaveEdit(p)}
                            style={{
                              padding: "0.5rem 0.75rem",
                              backgroundColor: "#A2AF9B",
                              color: "#FFFFFF",
                              border: "1px solid #A2AF9B",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                              cursor: "pointer",
                              transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = "#8FA288";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = "#A2AF9B";
                            }}
                          >
                            حفظ
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingIndex(idx);
                              setEditedName(p.name);
                            }}
                            style={{
                              padding: "0.5rem 0.75rem",
                              backgroundColor: "#F9FAFB",
                              color: "#374151",
                              border: "1px solid #E5E7EB",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                              cursor: "pointer",
                              transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = "#F3F4F6";
                              e.target.style.borderColor = "#A2AF9B";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = "#F9FAFB";
                              e.target.style.borderColor = "#E5E7EB";
                            }}
                          >
                            تعديل
                          </button>
                        )}

                        <button
                          onClick={() => setShowDeleteConfirm(p)}
                          style={{
                            padding: "0.5rem 0.75rem",
                            backgroundColor: "#FEF2F2",
                            color: "#DC2626",
                            border: "1px solid #FECACA",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#FEE2E2";
                            e.target.style.borderColor = "#FCA5A5";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "#FEF2F2";
                            e.target.style.borderColor = "#FECACA";
                          }}
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Draw Tab Content */}
      {activeTab === "draw" && (
        <div style={{
          backgroundColor: "#FFFFFF",
          padding: "2rem",
          border: "1px solid #E5E7EB",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
        }}>
          <DrawPage id={tournament.id} />
        </div>
      )}

      {/* Bracket Tab Content */}
      {activeTab === "bracket" && (
        <div style={{
          backgroundColor: "#FFFFFF",
          padding: "2rem",
          border: "1px solid #E5E7EB",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
        }}>
          <h2 style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            color: "#1F2937",
            margin: "0 0 1.5rem 0",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
          }}>
            <span style={{ fontSize: "1.5rem" }}>🏆</span>
            الرسم الإقصائي
          </h2>
          <BracketPage tournamentId={id} />
        </div>
      )}

      {/* Accounts Tab Content */}
      {activeTab === "accounts" && (
        <div style={{
          backgroundColor: "#FFFFFF",
          padding: "2rem",
          border: "1px solid #E5E7EB",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
        }}>
          <h2 style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            color: "#1F2937",
            margin: "0 0 1.5rem 0",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
          }}>
            <span style={{ fontSize: "1.5rem" }}>💰</span>
            الحسابات
          </h2>
          <AccountsPage tournamentId={id} />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          animation: "fadeIn 0.3s ease-out"
        }}>
          <div style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            padding: "2rem",
            maxWidth: "400px",
            width: "90%",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            animation: "slideIn 0.3s ease-out"
          }}>
            <div style={{
              textAlign: "center",
              marginBottom: "1.5rem"
            }}>
              <div style={{
                width: "64px",
                height: "64px",
                backgroundColor: "#FEE2E2",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem auto",
                fontSize: "1.5rem"
              }}>
                👤
              </div>
              <h3 style={{
                fontSize: "1.125rem",
                fontWeight: "600",
                color: "#1F2937",
                margin: "0 0 0.5rem 0"
              }}>
                تأكيد حذف المشارك
              </h3>
              <p style={{
                color: "#6B7280",
                fontSize: "0.875rem",
                margin: 0,
                lineHeight: "1.5"
              }}>
                هل أنت متأكد من حذف المشارك:<br/>
                <strong style={{ color: "#1F2937" }}>"{showDeleteConfirm.name}"</strong>
              </p>
            </div>

            <div style={{
              backgroundColor: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: "8px",
              padding: "0.75rem",
              marginBottom: "1.5rem"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "#991B1B",
                fontSize: "0.75rem",
                fontWeight: "500"
              }}>
                <span>⚠️</span>
                <span>تحذير: لا يمكن التراجع عن هذا الإجراء!</span>
              </div>
            </div>

            <div style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "flex-end"
            }}>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor: "#F9FAFB",
                  color: "#374151",
                  border: "1px solid #E5E7EB",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#F3F4F6";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#F9FAFB";
                }}
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor: "#DC2626",
                  color: "#FFFFFF",
                  border: "1px solid #DC2626",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#B91C1C";
                  e.target.style.borderColor = "#B91C1C";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#DC2626";
                  e.target.style.borderColor = "#DC2626";
                }}
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Custom scrollbar for tabs */
        div::-webkit-scrollbar {
          height: 4px;
        }

        div::-webkit-scrollbar-track {
          background: #F3F4F6;
          border-radius: 2px;
        }

        div::-webkit-scrollbar-thumb {
          background: #A2AF9B;
          border-radius: 2px;
        }

        div::-webkit-scrollbar-thumb:hover {
          background: #8FA288;
        }
      `}</style>
    </div>
  );
}