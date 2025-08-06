import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useNavigate } from "react-router-dom";

export default function TournamentsMainPage() {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  const fetchTournaments = async () => {
    setIsLoading(true);
    try {
      const snap = await getDocs(collection(db, "tournaments"));
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTournaments(data.sort((a, b) => b.created_at?.seconds - a.created_at?.seconds));
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name || !date) {
      window.alert("⚠️ تنبيه!\n\nيرجى إدخال اسم وتاريخ البطولة قبل المتابعة.");
      return;
    }

    setIsLoading(true);
    try {
      await addDoc(collection(db, "tournaments"), {
        name,
        date,
        created_at: Timestamp.now(),
        status: false,
      });
      
      // رسالة نجاح محسنة
      window.alert(`✅ تم إنشاء البطولة بنجاح!\n\n🏆 اسم البطولة: ${name}\n📅 التاريخ: ${formatDate(date)}`);
      
      setName("");
      setDate("");
      setShowCreateForm(false);
      fetchTournaments();
    } catch (error) {
      console.error("Error creating tournament:", error);
      window.alert("❌ حدث خطأ أثناء إنشاء البطولة\n\nيرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (tournament) => {
    setShowDeleteConfirm(tournament);
  };

  const confirmDelete = async () => {
    const tournament = showDeleteConfirm;
    setShowDeleteConfirm(null);
    
    try {
      await deleteDoc(doc(db, "tournaments", tournament.id));
      // رسالة نجاح بسيطة
      window.alert(`✅ تم حذف البطولة "${tournament.name}" بنجاح!`);
      fetchTournaments();
    } catch (error) {
      console.error("Error deleting tournament:", error);
      window.alert(`❌ حدث خطأ أثناء حذف البطولة "${tournament.name}"\nيرجى المحاولة مرة أخرى.`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  return (
    <div style={{
      padding: "2rem",
      backgroundColor: "#F8F9FA",
      minHeight: "100vh",
      fontFamily: "'Segoe UI', 'Cairo', Tahoma, Arial, sans-serif"
    }}>
      {/* Header Section */}
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
          justifyContent: "space-between"
        }}>
          <div>
            <h1 style={{
              fontSize: "1.75rem",
              fontWeight: "600",
              color: "#1F2937",
              margin: 0,
              marginBottom: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem"
            }}>
              <span style={{ fontSize: "1.5rem" }}>🏆</span>
              البطولات
            </h1>
            <p style={{
              fontSize: "0.875rem",
              color: "#6B7280",
              margin: 0
            }}>
              إدارة وتنظيم البطولات الرياضية
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1rem",
              backgroundColor: showCreateForm ? "#A2AF9B" : "#F9FAFB",
              color: showCreateForm ? "#FFFFFF" : "#374151",
              border: `1px solid ${showCreateForm ? '#A2AF9B' : '#E5E7EB'}`,
              borderRadius: "6px",
              fontSize: "0.875rem",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: showCreateForm ? "0 4px 12px rgba(162, 175, 155, 0.25)" : "0 1px 2px rgba(0,0,0,0.05)",
              transform: "scale(1)"
            }}
            onMouseEnter={(e) => {
              if (!showCreateForm) {
                e.target.style.backgroundColor = "#F3F4F6";
                e.target.style.borderColor = "#A2AF9B";
                e.target.style.transform = "scale(1.05)";
                e.target.style.boxShadow = "0 4px 12px rgba(162, 175, 155, 0.15)";
              } else {
                e.target.style.transform = "scale(1.05)";
                e.target.style.boxShadow = "0 6px 16px rgba(162, 175, 155, 0.35)";
              }
            }}
            onMouseLeave={(e) => {
              if (!showCreateForm) {
                e.target.style.backgroundColor = "#F9FAFB";
                e.target.style.borderColor = "#E5E7EB";
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
              } else {
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "0 4px 12px rgba(162, 175, 155, 0.25)";
              }
            }}
          >
            <span style={{ fontSize: "1rem", fontWeight: "bold" }}>+</span>
            بطولة جديدة
          </button>
        </div>
      </div>

      {/* Create Tournament Form */}
      {showCreateForm && (
        <div style={{
          backgroundColor: "#FFFFFF",
          padding: "2rem",
          marginBottom: "2rem",
          border: "1px solid #E5E7EB",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          animation: "fadeInUp 0.3s ease-out"
        }}>
          <h3 style={{
            fontSize: "1.125rem",
            fontWeight: "600",
            color: "#1F2937",
            margin: "0 0 1.5rem 0"
          }}>
            إنشاء بطولة جديدة
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem"
          }}>
            <div>
              <label style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "0.5rem"
              }}>
                اسم البطولة
              </label>
              <input
                type="text"
                placeholder="أدخل اسم البطولة..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "90%",
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
            <div>
              <label style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "0.5rem"
              }}>
                تاريخ البطولة
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: "90%",
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
          </div>
          <div style={{
            display: "flex",
            gap: "0.75rem"
          }}>
            <button
              onClick={handleCreate}
              disabled={isLoading}
              className={isLoading ? "loading-create" : ""}
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
                transition: "all 0.3s ease",
                boxShadow: isLoading ? "0 2px 8px rgba(143, 162, 136, 0.25)" : "0 1px 2px rgba(0,0,0,0.05)",
                transform: isLoading ? "scale(1.02)" : "scale(1)"
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.backgroundColor = "#8FA288";
                  e.target.style.transform = "scale(1.05)";
                  e.target.style.boxShadow = "0 4px 12px rgba(162, 175, 155, 0.25)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.target.style.backgroundColor = "#A2AF9B";
                  e.target.style.transform = "scale(1)";
                  e.target.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
                }
              }}
            >
              {isLoading ? (
                <span style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid #FFFFFF",
                  borderTop: "2px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }}></span>
              ) : (
                <span style={{ fontWeight: "bold" }}>✓</span>
              )}
              إنشاء البطولة
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              style={{
                padding: "0.75rem 1rem",
                backgroundColor: "#F9FAFB",
                color: "#374151",
                border: "1px solid #E5E7EB",
                borderRadius: "6px",
                fontSize: "0.875rem",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                transform: "scale(1)"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#F3F4F6";
                e.target.style.borderColor = "#D1D5DB";
                e.target.style.transform = "scale(1.05)";
                e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#F9FAFB";
                e.target.style.borderColor = "#E5E7EB";
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
              }}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Tournaments Section */}
      <div style={{
        backgroundColor: "#FFFFFF",
        padding: "2rem",
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
          <h2 style={{
            fontSize: "1.125rem",
            fontWeight: "600",
            color: "#1F2937",
            margin: 0
          }}>
            البطولات المتاحة
          </h2>
          <div style={{
            padding: "0.25rem 0.75rem",
            backgroundColor: "#F3F4F6",
            color: "#6B7280",
            borderRadius: "12px",
            fontSize: "0.75rem",
            fontWeight: "500"
          }}>
            {tournaments.length} بطولة
          </div>
        </div>

        {isLoading ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "3rem",
            textAlign: "center",
            animation: "pulse 1.5s infinite"
          }}>
            <div style={{
              width: "32px",
              height: "32px",
              border: "3px solid #A2AF9B",
              borderTop: "3px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginBottom: "1rem"
            }}></div>
            <p style={{
              color: "#6B7280",
              fontSize: "0.875rem",
              margin: 0
            }}>
              جاري تحميل البطولات...
            </p>
          </div>
        ) : tournaments.length === 0 ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "3rem",
            textAlign: "center",
            animation: "fadeInUp 0.5s ease-out"
          }}>
            <div style={{ 
              fontSize: "3rem", 
              marginBottom: "1rem",
              animation: "pulse 2s infinite"
            }}>🏆</div>
            <h3 style={{
              fontSize: "1.125rem",
              fontWeight: "600",
              color: "#1F2937",
              margin: "0 0 0.5rem 0"
            }}>
              لا توجد بطولات حالياً
            </h3>
            <p style={{
              color: "#6B7280",
              fontSize: "0.875rem",
              margin: 0
            }}>
              ابدأ بإنشاء بطولة جديدة لتظهر هنا
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1rem"
          }}>
            {tournaments.map((tournament, index) => (
              <div
                key={tournament.id}
                className="tournament-card"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: tournament.status ? "2px solid #10B981" : "2px solid #EF4444",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  position: "relative",
                  animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                  transform: "translateY(0px)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = tournament.status 
                    ? "0 8px 25px rgba(16, 185, 129, 0.12)" 
                    : "0 8px 25px rgba(239, 68, 68, 0.12)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = tournament.status ? "#059669" : "#DC2626";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.06)";
                  e.currentTarget.style.transform = "translateY(0px)";
                  e.currentTarget.style.borderColor = tournament.status ? "#10B981" : "#EF4444";
                }}
                onClick={() => navigate(`/tournaments/${tournament.id}`)}
              >
                {/* Header */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1rem"
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem"
                  }}>
                    <div style={{
                      width: "36px",
                      height: "36px",
                      backgroundColor: tournament.status ? "#D1FAE5" : "#FEE2E2",
                      color: tournament.status ? "#059669" : "#DC2626",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.125rem"
                    }}>
                      🏆
                    </div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.25rem 0.75rem",
                      backgroundColor: tournament.status ? "#D1FAE5" : "#FEE2E2",
                      color: tournament.status ? "#065F46" : "#991B1B",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: "500"
                    }}>
                      <span style={{
                        width: "6px",
                        height: "6px",
                        backgroundColor: tournament.status ? "#10B981" : "#EF4444",
                        borderRadius: "50%"
                      }}></span>
                      {tournament.status ? "مكتملة" : "جارية"}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(tournament);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 0.75rem",
                      backgroundColor: "#FEF2F2",
                      color: "#DC2626",
                      border: "1px solid #FECACA",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: "500",
                      cursor: "pointer",
                      opacity: 0,
                      transition: "all 0.3s ease",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#FEE2E2";
                      e.target.style.borderColor = "#FCA5A5";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#FEF2F2";
                      e.target.style.borderColor = "#FECACA";
                    }}
                    title={`حذف البطولة: ${tournament.name}`}
                  >
                    <span>🗑️</span>
                    <span>حذف</span>
                  </button>
                </div>

                {/* Content */}
                <div style={{ marginBottom: "1rem" }}>
                  <h3 style={{
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    color: "#1F2937",
                    margin: "0 0 0.75rem 0"
                  }}>
                    {tournament.name}
                  </h3>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "#6B7280",
                    fontSize: "0.875rem"
                  }}>
                    <span>📅</span>
                    <span>{formatDate(tournament.date)}</span>
                  </div>
                </div>

                {/* Footer */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "1rem",
                  borderTop: "1px solid #F3F4F6"
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "#6B7280",
                    fontSize: "0.875rem"
                  }}>
                    <span>👥</span>
                    <span>المشاركون</span>
                  </div>
                  
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: tournament.status ? "#059669" : "#DC2626",
                    fontSize: "0.875rem",
                    fontWeight: "500"
                  }}>
                    <span>عرض التفاصيل</span>
                    <span>←</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
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
                  🗑️
                </div>
                <h3 style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "#1F2937",
                  margin: "0 0 0.5rem 0"
                }}>
                  تأكيد الحذف
                </h3>
                <p style={{
                  color: "#6B7280",
                  fontSize: "0.875rem",
                  margin: 0,
                  lineHeight: "1.5"
                }}>
                  هل أنت متأكد من حذف البطولة:<br/>
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
        </>
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

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
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

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        /* Show delete button on hover */
        .tournament-card:hover button {
          opacity: 1 !important;
        }

        /* Button press effect */
        button:active {
          transform: scale(0.98) !important;
        }

        /* Loading animation for create button */
        .loading-create {
          animation: pulse 1.5s infinite;
        }
       /* Add hover effect to form inputs */
        input:hover {
          border-color: #A2AF9B !important;
        }

        /* Button press effect */
        button:active {
          transform: scale(0.98) !important;
        }

        /* Loading animation for create button */
        .loading-create {
          animation: pulse 1.5s infinite;
        }
      `}</style>
    </div>
  );
}