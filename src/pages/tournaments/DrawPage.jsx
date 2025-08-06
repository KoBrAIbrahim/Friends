import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "../../services/firebase";

export default function DrawPage() {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [drawType, setDrawType] = useState(null);
  const [manualDrawPool, setManualDrawPool] = useState([]);
  const [manualSelections, setManualSelections] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matches, setMatches] = useState([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Animation states
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatedMatches, setAnimatedMatches] = useState([]);
  const [currentAnimatingMatch, setCurrentAnimatingMatch] = useState(-1);
  const [showFinalResults, setShowFinalResults] = useState(false);

  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

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

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const initManualDraw = () => {
    const shuffled = [...tournament.participants];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setManualDrawPool(shuffled);
    setManualSelections([]);
    setFlippedCards([]);
  };

  const handleCardClick = (idx) => {
    if (flippedCards.includes(idx)) return;
    const newFlipped = [...flippedCards, idx];
    setFlippedCards(newFlipped);
    setManualSelections([...manualSelections, manualDrawPool[idx]]);
  };

  const generateManualMatches = () => {
    const firstHalf = manualSelections.slice(0, Math.ceil(manualSelections.length / 2));
    const secondHalf = manualSelections.slice(Math.ceil(manualSelections.length / 2));

    const finalMatches = firstHalf.map((holder, i) => ({
      player1: holder.name,
      player2: secondHalf[i]?.name || "-"
    }));

    return finalMatches;
  };

  const generateRandomMatches = () => {
    const shuffled = [...tournament.participants];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const pairs = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      pairs.push({
        player1: shuffled[i]?.name || "-",
        player2: shuffled[i + 1]?.name || "-",
      });
    }
    return pairs;
  };

  // Animation functions
  const getRandomName = () => {
    const names = tournament.participants;
    return names[Math.floor(Math.random() * names.length)].name;
  };

  const startAnimatedDraw = () => {
    setIsAnimating(true);
    setShowFinalResults(false);
    setCurrentAnimatingMatch(-1);
    
    const finalMatchesResult = generateRandomMatches();
    const numberOfMatches = finalMatchesResult.length;
    
    // Initialize animated matches with random names
    const initialAnimated = Array(numberOfMatches).fill(null).map(() => ({
      player1: getRandomName(),
      player2: getRandomName(),
      isFinished: false
    }));
    
    setAnimatedMatches(initialAnimated);
    
    // Start the animation sequence
    animateMatches(finalMatchesResult, initialAnimated);
  };

  const animateMatches = (finalMatches, ) => {
    let currentMatch = 0;
    const animateNextMatch = () => {
      if (currentMatch >= finalMatches.length) {
        // All matches are done
        setIsAnimating(false);
        setMatches(finalMatches);
        setShowFinalResults(true);
        return;
      }

      setCurrentAnimatingMatch(currentMatch);
      
      // Animate current match
      let speed = 50; // Start fast
      let iterations = 0;
      const maxIterations = 60; // Total animation duration
      
      const animateCurrentMatch = () => {
        iterations++;
        
        // Update current match with random names
        setAnimatedMatches(prev => {
          const newMatches = [...prev];
          if (!newMatches[currentMatch].isFinished) {
            newMatches[currentMatch] = {
              player1: getRandomName(),
              player2: getRandomName(),
              isFinished: false
            };
          }
          return newMatches;
        });
        
        // Slow down gradually
        if (iterations < maxIterations) {
          speed = Math.min(speed + 3, 200); // Gradually slow down
          timeoutRef.current = setTimeout(animateCurrentMatch, speed);
        } else {
          // Stop this match and set final result
          setAnimatedMatches(prev => {
            const newMatches = [...prev];
            newMatches[currentMatch] = {
              player1: finalMatches[currentMatch].player1,
              player2: finalMatches[currentMatch].player2,
              isFinished: true
            };
            return newMatches;
          });
          
          // Wait a bit then animate next match
          setTimeout(() => {
            currentMatch++;
            animateNextMatch();
          }, 800);
        }
      };
      
      animateCurrentMatch();
    };
    
    animateNextMatch();
  };

  const stopAnimation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsAnimating(false);
    setCurrentAnimatingMatch(-1);
  };

  const isAdmin = true; // مؤقتًا، اعتبره مدير النظام

  const confirmResetDraw = async () => {
    console.log("confirmResetDraw called!");
    setShowResetConfirm(false);
    setIsLoading(true);
    
    const ref = doc(db, "tournaments", id);
    try {
      await updateDoc(ref, {
        matches: [],
        bracket: deleteField(),
        winner: null,
        status: false,
      });
      window.alert("✅ تم حذف القرعة بنجاح!");
      window.location.reload();
    } catch (err) {
      console.error("فشل الحذف:", err);
      window.alert("❌ حدث خطأ أثناء حذف القرعة");
    } finally {
      setIsLoading(false);
    }
  };

  const saveMatchesToFirestore = async (data = null) => {
    const matchesToSave = data || (drawType === "manual" ? generateManualMatches() : matches);
    setIsLoading(true);
    
    const ref = doc(db, "tournaments", id);
    try {
      await updateDoc(ref, { matches: matchesToSave });
      window.alert("✅ تم حفظ المباريات بنجاح!");
      fetchTournament(); // Refresh to show completed state
    } catch (err) {
      console.error("فشل الحفظ:", err);
      window.alert("❌ حدث خطأ أثناء حفظ المباريات");
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

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

  // If draw is already completed
  if (tournament.matches && tournament.matches.length > 0) {
    return (
      <div style={{
        padding: "2rem",
        backgroundColor: "#F8F9FA",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', 'Cairo', Tahoma, Arial, sans-serif"
      }}>
        {/* Header */}
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
              backgroundColor: "#D1FAE5",
              color: "#059669",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem"
            }}>
              🎲
            </div>
            <div>
              <h1 style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                color: "#1F2937",
                margin: 0,
                marginBottom: "0.25rem"
              }}>
                قرعة البطولة: {tournament.name}
              </h1>
              <p style={{
                fontSize: "0.875rem",
                color: "#6B7280",
                margin: 0
              }}>
                تم إنجاز القرعة بنجاح
              </p>
            </div>
          </div>

          <div style={{
            padding: "1rem",
            backgroundColor: "#D1FAE5",
            border: "1px solid #A7F3D0",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
          }}>
            <span style={{ fontSize: "1.25rem" }}>✅</span>
            <span style={{
              color: "#065F46",
              fontWeight: "500",
              fontSize: "0.875rem"
            }}>
              تمت القرعة بنجاح، لا يمكن إعادة تنفيذها إلا بحذف النتائج الحالية.
            </span>
          </div>
        </div>

        {/* Matches List */}
        <div style={{
          backgroundColor: "#FFFFFF",
          padding: "2rem",
          marginBottom: "2rem",
          border: "1px solid #E5E7EB",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
        }}>
          <h3 style={{
            fontSize: "1.125rem",
            fontWeight: "600",
            color: "#1F2937",
            margin: "0 0 1.5rem 0",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
          }}>
            <span style={{ fontSize: "1.25rem" }}>📋</span>
            المباريات المسجلة ({tournament.matches.length})
          </h3>

          <div style={{
            display: "grid",
            gap: "0.75rem"
          }}>
            {tournament.matches.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
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
                  width: "32px",
                  height: "32px",
                  backgroundColor: "#A2AF9B",
                  color: "#FFFFFF",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.875rem",
                  fontWeight: "600"
                }}>
                  {idx + 1}
                </div>
                <div style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem"
                }}>
                  <span style={{
                    fontWeight: "500",
                    color: "#1F2937"
                  }}>
                    {m.player1}
                  </span>
                  <span style={{
                    color: "#6B7280",
                    fontSize: "1rem"
                  }}>
                    ضد
                  </span>
                  <span style={{
                    fontWeight: "500",
                    color: "#1F2937"
                  }}>
                    {m.player2}
                  </span>
                </div>
                <span style={{ fontSize: "1.25rem" }}>🥊</span>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Reset Button */}
        {isAdmin && (
          <div style={{
            backgroundColor: "#FFFFFF",
            padding: "2rem",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            textAlign: "center"
          }}>
            <div style={{
              marginBottom: "1rem"
            }}>
              <h4 style={{
                fontSize: "1rem",
                fontWeight: "600",
                color: "#1F2937",
                margin: "0 0 0.5rem 0"
              }}>
                إعدادات المدير
              </h4>
              <p style={{
                fontSize: "0.875rem",
                color: "#6B7280",
                margin: 0
              }}>
                حذف القرعة الحالية وإعادة تنفيذها من البداية
              </p>
            </div>
            
            <button
              onClick={(e) => {
                console.log("🔴 Delete button clicked!");
                console.log("Event target:", e.target);
                console.log("Current showResetConfirm:", showResetConfirm);
                e.preventDefault();
                e.stopPropagation();
                setShowResetConfirm(true);
                console.log("🟢 setShowResetConfirm(true) called");
              }}
              disabled={isLoading}
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                backgroundColor: "#FEF2F2",
                color: "#DC2626",
                border: "2px solid #FECACA",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: "600",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
                transition: "all 0.2s ease",
                margin: "0 auto",
                textDecoration: "none",
                outline: "none",
                userSelect: "none",
                boxShadow: "0 2px 4px rgba(220, 38, 38, 0.1)",
                position: "relative",
                zIndex: 1
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = "#FEE2E2";
                  e.currentTarget.style.borderColor = "#FCA5A5";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(220, 38, 38, 0.15)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = "#FEF2F2";
                  e.currentTarget.style.borderColor = "#FECACA";
                  e.currentTarget.style.transform = "translateY(0px)";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(220, 38, 38, 0.1)";
                }
              }}
            >
              {isLoading ? (
                <div style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid #DC2626",
                  borderTop: "2px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }}></div>
              ) : (
                <span style={{ fontSize: "1rem" }}>🗑️</span>
              )}
              <span>حذف القرعة وإعادة التنفيذ</span>
            </button>
          </div>
        )}

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <>
            {console.log("🟡 Modal is rendering! showResetConfirm:", showResetConfirm)}
            <div 
              style={{
                position: "fixed",
                top: "0px",
                left: "0px",
                right: "0px",
                bottom: "0px",
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: "999999",
                backdropFilter: "blur(2px)"
              }}
              onClick={(e) => {
                console.log("🔵 Backdrop clicked");
                e.preventDefault();
                e.stopPropagation();
                setShowResetConfirm(false);
              }}
            >
              <div 
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "12px",
                  padding: "2.5rem",
                  maxWidth: "450px",
                  width: "95%",
                  maxHeight: "90vh",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                  position: "relative",
                  border: "3px solid #E5E7EB",
                  zIndex: "1000000",
                  transform: "scale(1)",
                  animation: "modalSlideIn 0.3s ease-out"
                }}
                onClick={(e) => {
                  console.log("🟠 Modal content clicked");
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {/* Close X button */}
                <button
                  onClick={(e) => {
                    console.log("❌ Close X button clicked");
                    e.preventDefault();
                    e.stopPropagation();
                    setShowResetConfirm(false);
                  }}
                  style={{
                    position: "absolute",
                    top: "1rem",
                    left: "1rem",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "#F3F4F6",
                    border: "2px solid #E5E7EB",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    color: "#6B7280",
                    fontWeight: "bold",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#EF4444";
                    e.currentTarget.style.color = "#FFFFFF";
                    e.currentTarget.style.borderColor = "#EF4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#F3F4F6";
                    e.currentTarget.style.color = "#6B7280";
                    e.currentTarget.style.borderColor = "#E5E7EB";
                  }}
                >
                  ×
                </button>

                <div style={{
                  textAlign: "center",
                  marginBottom: "2rem"
                }}>
                  <div style={{
                    width: "80px",
                    height: "80px",
                    backgroundColor: "#FEE2E2",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1.5rem auto",
                    fontSize: "2rem",
                    border: "3px solid #FECACA"
                  }}>
                    🗑️
                  </div>
                  <h3 style={{
                    fontSize: "1.25rem",
                    fontWeight: "700",
                    color: "#1F2937",
                    margin: "0 0 0.75rem 0"
                  }}>
                    تأكيد حذف القرعة
                  </h3>
                  <p style={{
                    color: "#6B7280",
                    fontSize: "1rem",
                    margin: 0,
                    lineHeight: "1.6"
                  }}>
                    هل أنت متأكد من حذف القرعة الحالية؟<br/>
                    <strong style={{ color: "#DC2626" }}>سيتم مسح جميع المباريات المسجلة.</strong>
                  </p>
                </div>

                <div style={{
                  backgroundColor: "#FEF2F2",
                  border: "2px solid #FECACA",
                  borderRadius: "8px",
                  padding: "1rem",
                  marginBottom: "2rem"
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    color: "#991B1B",
                    fontSize: "0.875rem",
                    fontWeight: "600"
                  }}>
                    <span style={{ fontSize: "1.25rem" }}>⚠️</span>
                    <span>تحذير: لا يمكن التراجع عن هذا الإجراء!</span>
                  </div>
                </div>

                <div style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "center"
                }}>
                  <button
                    onClick={(e) => {
                      console.log("⚪ Cancel button clicked");
                      e.preventDefault();
                      e.stopPropagation();
                      setShowResetConfirm(false);
                    }}
                    style={{
                      padding: "0.875rem 1.5rem",
                      backgroundColor: "#F9FAFB",
                      color: "#374151",
                      border: "2px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      minWidth: "100px"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#F3F4F6";
                      e.currentTarget.style.borderColor = "#D1D5DB";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#F9FAFB";
                      e.currentTarget.style.borderColor = "#E5E7EB";
                    }}
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={(e) => {
                      console.log("🔴 Confirm delete button clicked");
                      e.preventDefault();
                      e.stopPropagation();
                      confirmResetDraw();
                    }}
                    disabled={isLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.875rem 1.5rem",
                      backgroundColor: isLoading ? "#B91C1C" : "#DC2626",
                      color: "#FFFFFF",
                      border: `2px solid ${isLoading ? '#B91C1C' : '#DC2626'}`,
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      opacity: isLoading ? 0.8 : 1,
                      transition: "all 0.2s ease",
                      minWidth: "140px",
                      justifyContent: "center"
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.backgroundColor = "#B91C1C";
                        e.currentTarget.style.borderColor = "#B91C1C";
                        e.currentTarget.style.transform = "scale(1.05)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.backgroundColor = "#DC2626";
                        e.currentTarget.style.borderColor = "#DC2626";
                        e.currentTarget.style.transform = "scale(1)";
                      }
                    }}
                  >
                    {isLoading ? (
                      <>
                        <div style={{
                          width: "18px",
                          height: "18px",
                          border: "2px solid #FFFFFF",
                          borderTop: "2px solid transparent",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite"
                        }}></div>
                        <span>جاري الحذف...</span>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: "1rem" }}>🗑️</span>
                        <span>تأكيد الحذف</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Main draw page
  return (
    <div style={{
      padding: "2rem",
      backgroundColor: "#F8F9FA",
      minHeight: "100vh",
      fontFamily: "'Segoe UI', 'Cairo', Tahoma, Arial, sans-serif"
    }}>
      {/* Header */}
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
          gap: "1rem"
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
            🎲
          </div>
          <div>
            <h1 style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: "#1F2937",
              margin: 0,
              marginBottom: "0.25rem"
            }}>
              قرعة البطولة: {tournament.name}
            </h1>
            <p style={{
              fontSize: "0.875rem",
              color: "#6B7280",
              margin: 0
            }}>
              👥 المشاركون: {tournament.participants.length}
            </p>
          </div>
        </div>
      </div>

      {/* Draw Type Selection */}
      <div style={{
        backgroundColor: "#FFFFFF",
        padding: "2rem",
        marginBottom: "2rem",
        border: "1px solid #E5E7EB",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
      }}>
        <h3 style={{
          fontSize: "1.125rem",
          fontWeight: "600",
          color: "#1F2937",
          margin: "0 0 1.5rem 0"
        }}>
          اختر نوع القرعة
        </h3>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1rem"
        }}>
          <button
            onClick={() => {
              setDrawType("manual");
              initManualDraw();
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
              padding: "1.5rem",
              backgroundColor: drawType === "manual" ? "#A2AF9B" : "#F9FAFB",
              color: drawType === "manual" ? "#FFFFFF" : "#374151",
              border: `2px solid ${drawType === "manual" ? '#A2AF9B' : '#E5E7EB'}`,
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "center"
            }}
            onMouseEnter={(e) => {
              if (drawType !== "manual") {
                e.target.style.backgroundColor = "#F3F4F6";
                e.target.style.borderColor = "#A2AF9B";
              }
            }}
            onMouseLeave={(e) => {
              if (drawType !== "manual") {
                e.target.style.backgroundColor = "#F9FAFB";
                e.target.style.borderColor = "#E5E7EB";
              }
            }}
          >
            <span style={{ fontSize: "2rem" }}>🃏</span>
            <div>
              <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                اختيار يدوي
              </div>
              <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                اختيار المشاركين عبر الكروت
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setDrawType("animated");
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
              padding: "1.5rem",
              backgroundColor: drawType === "animated" ? "#A2AF9B" : "#F9FAFB",
              color: drawType === "animated" ? "#FFFFFF" : "#374151",
              border: `2px solid ${drawType === "animated" ? '#A2AF9B' : '#E5E7EB'}`,
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "center"
            }}
            onMouseEnter={(e) => {
              if (drawType !== "animated") {
                e.target.style.backgroundColor = "#F3F4F6";
                e.target.style.borderColor = "#A2AF9B";
              }
            }}
            onMouseLeave={(e) => {
              if (drawType !== "animated") {
                e.target.style.backgroundColor = "#F9FAFB";
                e.target.style.borderColor = "#E5E7EB";
              }
            }}
          >
            <span style={{ fontSize: "2rem" }}>🎯</span>
            <div>
              <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                قرعة متحركة
              </div>
              <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                قرعة عشوائية مع تأثيرات حركية
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Manual Draw Section */}
      {drawType === "manual" && (
        <div style={{
          backgroundColor: "#FFFFFF",
          padding: "2rem",
          marginBottom: "2rem",
          border: "1px solid #E5E7EB",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
        }}>
          <h3 style={{
            fontSize: "1.125rem",
            fontWeight: "600",
            color: "#1F2937",
            margin: "0 0 1.5rem 0",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
          }}>
            <span style={{ fontSize: "1.25rem" }}>🃏</span>
            اسحب بطاقة ({flippedCards.length}/{manualDrawPool.length})
          </h3>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem"
          }}>
            {manualDrawPool.map((p, idx) => (
              <div
                key={idx}
                onClick={() => handleCardClick(idx)}
                style={{
                  perspective: "1000px",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "150px",
                    position: "relative",
                    transformStyle: "preserve-3d",
                    transition: "transform 0.6s",
                    transform: flippedCards.includes(idx) ? "rotateY(180deg)" : "rotateY(0deg)",
                    cursor: flippedCards.includes(idx) ? "default" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!flippedCards.includes(idx)) {
                      e.currentTarget.style.transform = "translateY(-4px) scale(1.05)";
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(162, 175, 155, 0.25)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!flippedCards.includes(idx)) {
                      e.currentTarget.style.transform = "translateY(0px) scale(1)";
                      e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                    }
                  }}
                >
                  {/* Front face */}
                  <div
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      backfaceVisibility: "hidden",
                      backgroundColor: "#A2AF9B",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "2rem",
                      borderRadius: "12px",
                      border: "2px solid #8FA288",
                    }}
                  >
                    ❓
                  </div>

                  {/* Back face */}
                  <div
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      backfaceVisibility: "hidden",
                      backgroundColor: "#D1FAE5",
                      color: "#065F46",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      textAlign: "center",
                      padding: "0.5rem",
                      borderRadius: "12px",
                      border: "2px solid #A7F3D0",
                      transform: "rotateY(180deg)",
                      direction: "rtl",
                      unicodeBidi: "isolate",
                    }}
                  >
                    {p.name}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {manualSelections.length >= 2 && (
            <div style={{
              padding: "1.5rem",
              backgroundColor: "#F9FAFB",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              marginBottom: "1rem"
            }}>
              <h4 style={{
                fontSize: "1rem",
                fontWeight: "600",
                color: "#1F2937",
                margin: "0 0 1rem 0",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem"
              }}>
                <span style={{ fontSize: "1.25rem" }}>📋</span>
                توزيع المباريات ({generateManualMatches().length})
              </h4>

              <div style={{
                display: "grid",
                gap: "0.75rem",
                marginBottom: "1.5rem"
              }}>
                {generateManualMatches().map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "1rem",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px"
                    }}
                  >
                    <div style={{
                      width: "28px",
                      height: "28px",
                      backgroundColor: "#A2AF9B",
                      color: "#FFFFFF",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: "600"
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem"
                    }}>
                      <span style={{ fontWeight: "500", color: "#1F2937" }}>
                        {m.player1}
                      </span>
                      <span style={{ color: "#6B7280", fontSize: "0.875rem" }}>
                        ضد
                      </span>
                      <span style={{ fontWeight: "500", color: "#1F2937" }}>
                        {m.player2}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center"
              }}>
                <button
                  onClick={() => saveMatchesToFirestore()}
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
                    transition: "all 0.2s ease"
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
                    <span>💾</span>
                  )}
                  <span>حفظ النتائج</span>
                </button>

                <button
                  onClick={initManualDraw}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
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
                    e.target.style.borderColor = "#D1D5DB";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#F9FAFB";
                    e.target.style.borderColor = "#E5E7EB";
                  }}
                >
                  <span>🔄</span>
                  <span>إعادة القرعة</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Animated Draw Section */}
      {drawType === "animated" && (
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
            marginBottom: "2rem"
          }}>
            <h3 style={{
              fontSize: "1.125rem",
              fontWeight: "600",
              color: "#1F2937",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.75rem"
            }}>
              <span style={{ fontSize: "1.25rem" }}>🎯</span>
              القرعة المتحركة
              {isAnimating && (
                <span style={{
                  padding: "0.25rem 0.75rem",
                  backgroundColor: "#FEF3C7",
                  color: "#D97706",
                  borderRadius: "999px",
                  fontSize: "0.75rem",
                  fontWeight: "500"
                }}>
                  جاري السحب...
                </span>
              )}
            </h3>

            <div style={{ display: "flex", gap: "1rem" }}>
              {!isAnimating && !showFinalResults && (
                <button
                  onClick={startAnimatedDraw}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1rem",
                    backgroundColor: "#A2AF9B",
                    color: "#FFFFFF",
                    border: "1px solid #A2AF9B",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
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
                  <span>🎲</span>
                  <span>ابدأ القرعة</span>
                </button>
              )}

              {isAnimating && (
                <button
                  onClick={stopAnimation}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1rem",
                    backgroundColor: "#EF4444",
                    color: "#FFFFFF",
                    border: "1px solid #EF4444",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#DC2626";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#EF4444";
                  }}
                >
                  <span>⏹️</span>
                  <span>إيقاف</span>
                </button>
              )}

              <button
                onClick={() => {
                  stopAnimation();
                  setMatches([]);
                  setAnimatedMatches([]);
                  setShowFinalResults(false);
                  setCurrentAnimatingMatch(-1);
                  setDrawType(null);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
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
                  e.target.style.borderColor = "#D1D5DB";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#F9FAFB";
                  e.target.style.borderColor = "#E5E7EB";
                }}
              >
                <span>🔄</span>
                <span>إعادة تعيين</span>
              </button>
            </div>
          </div>

          {/* Animated Matches Display */}
          {animatedMatches.length > 0 && (
            <div style={{
              display: "grid",
              gap: "1rem",
              marginBottom: "2rem"
            }}>
              {animatedMatches.map((match, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "1.5rem",
                    backgroundColor: currentAnimatingMatch === idx ? "#FEF3C7" : match.isFinished ? "#D1FAE5" : "#F9FAFB",
                    border: `2px solid ${currentAnimatingMatch === idx ? "#F59E0B" : match.isFinished ? "#10B981" : "#E5E7EB"}`,
                    borderRadius: "12px",
                    transition: "all 0.3s ease",
                    transform: currentAnimatingMatch === idx ? "scale(1.02)" : "scale(1)",
                    boxShadow: currentAnimatingMatch === idx ? "0 8px 25px rgba(245, 158, 11, 0.25)" : match.isFinished ? "0 4px 12px rgba(16, 185, 129, 0.15)" : "0 2px 4px rgba(0,0,0,0.05)"
                  }}
                >
                  <div style={{
                    width: "40px",
                    height: "40px",
                    backgroundColor: currentAnimatingMatch === idx ? "#F59E0B" : match.isFinished ? "#10B981" : "#A2AF9B",
                    color: "#FFFFFF",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem",
                    fontWeight: "600",
                    transition: "all 0.3s ease"
                  }}>
                    {match.isFinished ? "✅" : currentAnimatingMatch === idx ? "🎲" : idx + 1}
                  </div>
                  
                  <div style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "1.5rem"
                  }}>
                    <div style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "1rem",
                      backgroundColor: "#FFFFFF",
                      borderRadius: "8px",
                      border: "1px solid #E5E7EB",
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "#1F2937",
                      transition: "all 0.1s ease",
                      transform: currentAnimatingMatch === idx && !match.isFinished ? "scale(1.05)" : "scale(1)"
                    }}>
                      {match.player1}
                    </div>
                    
                    <div style={{
                      fontSize: "1.5rem",
                      color: "#6B7280",
                      fontWeight: "bold"
                    }}>
                      ⚔️
                    </div>
                    
                    <div style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "1rem",
                      backgroundColor: "#FFFFFF",
                      borderRadius: "8px",
                      border: "1px solid #E5E7EB",
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: "#1F2937",
                      transition: "all 0.1s ease",
                      transform: currentAnimatingMatch === idx && !match.isFinished ? "scale(1.05)" : "scale(1)"
                    }}>
                      {match.player2}
                    </div>
                  </div>

                  <div style={{
                    fontSize: "1.5rem",
                    opacity: match.isFinished ? 1 : 0.5,
                    transition: "opacity 0.3s ease"
                  }}>
                    {match.isFinished ? "🏆" : "⏳"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Final Results and Save Button */}
          {showFinalResults && matches.length > 0 && (
            <div style={{
              padding: "2rem",
              backgroundColor: "#D1FAE5",
              border: "2px solid #10B981",
              borderRadius: "12px",
              textAlign: "center"
            }}>
              <div style={{
                marginBottom: "1.5rem"
              }}>
                <h4 style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "#065F46",
                  margin: "0 0 0.5rem 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.75rem"
                }}>
                  <span style={{ fontSize: "1.5rem" }}>🎉</span>
                  تمت القرعة بنجاح!
                </h4>
                <p style={{
                  color: "#047857",
                  fontSize: "1rem",
                  margin: 0
                }}>
                  تم توزيع {matches.length} مباراة
                </p>
              </div>

              <div style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center"
              }}>
                <button
                  onClick={() => saveMatchesToFirestore(matches)}
                  disabled={isLoading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "1rem 2rem",
                    backgroundColor: isLoading ? "#047857" : "#10B981",
                    color: "#FFFFFF",
                    border: `2px solid ${isLoading ? '#047857' : '#10B981'}`,
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.8 : 1,
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.target.style.backgroundColor = "#047857";
                      e.target.style.borderColor = "#047857";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.target.style.backgroundColor = "#10B981";
                      e.target.style.borderColor = "#10B981";
                    }
                  }}
                >
                  {isLoading ? (
                    <div style={{
                      width: "20px",
                      height: "20px",
                      border: "2px solid #FFFFFF",
                      borderTop: "2px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite"
                    }}></div>
                  ) : (
                    <span style={{ fontSize: "1.25rem" }}>💾</span>
                  )}
                  <span>{isLoading ? "جاري الحفظ..." : "حفظ النتائج"}</span>
                </button>

                <button
                  onClick={startAnimatedDraw}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "1rem 2rem",
                    backgroundColor: "#F9FAFB",
                    color: "#374151",
                    border: "2px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#F3F4F6";
                    e.target.style.borderColor = "#D1D5DB";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#F9FAFB";
                    e.target.style.borderColor = "#E5E7EB";
                  }}
                >
                  <span style={{ fontSize: "1.25rem" }}>🎲</span>
                  <span>قرعة جديدة</span>
                </button>
              </div>
            </div>
          )}
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

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-50px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}