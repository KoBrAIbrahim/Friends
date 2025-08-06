/* eslint-disable no-unused-vars */

  import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase";

export default function BracketPage() {
  const { id } = useParams();
  const [rounds, setRounds] = useState([]);
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processingMatch, setProcessingMatch] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState(null); // للـ confirmation modal

  // Handle winner selection with confirmation
  const handleSelectWinner = useCallback((roundIdx, matchIdx, player, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const matchKey = `${roundIdx}-${matchIdx}`;
    if (!player || isLoading || processingMatch === matchKey) return;
    
    // Check current winner conflicts
    const currentMatch = rounds[roundIdx]?.[matchIdx];
    const currentWinner = currentMatch?.winner;
    
    if (currentWinner && currentWinner !== player) {
      const conflict = checkPlayerInNextRounds(currentWinner, roundIdx, rounds);
      if (conflict.found) {
        triggerToast(`❌ لا يمكن تغيير الفائز! ${currentWinner} موجود في ${conflict.roundName}. يجب حذفه من المراحل التالية أولاً.`);
        return;
      }
    }
    
    // Show confirmation modal
    showConfirmationModal(roundIdx, matchIdx, player);
  }, [isLoading, processingMatch, rounds]);

  // Helper function to get round title
  const getRoundTitle = (roundIdx, totalRounds) => {
    if (roundIdx === totalRounds - 1) return "🏆 النهائي";
    if (roundIdx === totalRounds - 2) return "🥉 نصف النهائي";
    if (roundIdx === totalRounds - 3) return "🏅 ربع النهائي";
    return `الجولة ${roundIdx + 1}`;
  };

  // Helper function to build bracket structure
  const buildBracket = (baseMatches) => {
    if (!Array.isArray(baseMatches) || baseMatches.length === 0) {
      return [];
    }
    
    try {
      const rounds = [baseMatches];
      let current = baseMatches;
      let maxIterations = 10;
      let iterations = 0;
      
      while (current.length > 1 && iterations < maxIterations) {
        const nextRound = [];
        for (let i = 0; i < current.length; i += 2) {
          nextRound.push({ 
            player1: null, 
            player2: null, 
            winner: null 
          });
        }
        rounds.push(nextRound);
        current = nextRound;
        iterations++;
      }
      
      return rounds;
    } catch (error) {
      console.error("خطأ في بناء البراكيت:", error);
      return [];
    }
  };

  // Check if player exists in next rounds
  const checkPlayerInNextRounds = (playerName, currentRoundIdx, roundsData) => {
    if (!roundsData || !playerName || currentRoundIdx >= roundsData.length - 1) {
      return { found: false };
    }
    
    for (let roundIdx = currentRoundIdx + 1; roundIdx < roundsData.length; roundIdx++) {
      const round = roundsData[roundIdx];
      for (let match of round) {
        if (match.player1 === playerName || match.player2 === playerName || match.winner === playerName) {
          return { 
            found: true, 
            roundIdx, 
            roundName: getRoundTitle(roundIdx, roundsData.length) 
          };
        }
      }
    }
    return { found: false };
  };

  // Get affected matches in next rounds
  const getAffectedMatches = (playerName, currentRoundIdx, roundsData) => {
    const affected = [];
    if (!roundsData || !playerName || currentRoundIdx >= roundsData.length - 1) {
      return affected;
    }
    
    for (let roundIdx = currentRoundIdx + 1; roundIdx < roundsData.length; roundIdx++) {
      const round = roundsData[roundIdx];
      round.forEach((match, matchIdx) => {
        if (match.player1 === playerName || match.player2 === playerName || match.winner === playerName) {
          affected.push({
            roundIdx,
            matchIdx,
            roundName: getRoundTitle(roundIdx, roundsData.length),
            match
          });
        }
      });
    }
    return affected;
  };

  // Show toast message
  const triggerToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch tournament data
  useEffect(() => {
    if (!id) return;
    
    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        const ref = doc(db, "tournaments", id);
        const snap = await getDoc(ref);
        
        if (snap.exists()) {
          const data = snap.data();
          const baseMatches = data.matches || [];

          if (Array.isArray(data.bracket) && data.bracket.length > 0) {
            setRounds(data.bracket);
          } else if (typeof data.bracket === 'object' && data.bracket !== null) {
            const sortedKeys = Object.keys(data.bracket).sort((a, b) => {
              const aNum = parseInt(a.replace("round_", ""));
              const bNum = parseInt(b.replace("round_", ""));
              return aNum - bNum;
            });
            const bracketRounds = sortedKeys.map(key => data.bracket[key]).filter(round => Array.isArray(round));
            if (bracketRounds.length > 0) {
              setRounds(bracketRounds);
            } else if (baseMatches.length > 0) {
              const structure = buildBracket(baseMatches);
              setRounds(structure);
            }
          } else if (baseMatches.length > 0) {
            const structure = buildBracket(baseMatches);
            setRounds(structure);
          } else {
            // Default test data
            setRounds([
              [
                { player1: "لاعب 1", player2: "لاعب 2", winner: null },
                { player1: "لاعب 3", player2: "لاعب 4", winner: null }
              ],
              [
                { player1: null, player2: null, winner: null }
              ]
            ]);
          }
        }
      } catch (error) {
        console.error("خطأ في جلب البيانات:", error);
        triggerToast("❌ خطأ في جلب بيانات البطولة");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMatches();
  }, [id]);

  // Show confirmation modal for winner selection
  const showConfirmationModal = (roundIdx, matchIdx, player) => {
    const roundName = getRoundTitle(roundIdx, rounds.length);
    setConfirmationModal({
      roundIdx,
      matchIdx,
      player,
      roundName,
      isNextRoundAffected: roundIdx < rounds.length - 1
    });
  };

  // Confirm winner selection
  const confirmWinnerSelection = () => {
    if (!confirmationModal) return;
    
    const { roundIdx, matchIdx, player } = confirmationModal;
    setConfirmationModal(null);
    executeWinnerSelection(roundIdx, matchIdx, player);
  };

  // Execute the actual winner selection
  const executeWinnerSelection = (roundIdx, matchIdx, player) => {
    const matchKey = `${roundIdx}-${matchIdx}`;
    
    try {
      setProcessingMatch(matchKey);
      
      setRounds(prevRounds => {
        if (!prevRounds || roundIdx >= prevRounds.length || matchIdx >= prevRounds[roundIdx].length) {
          return prevRounds;
        }
        
        // Create deep copy
        const updatedRounds = prevRounds.map(round => 
          round.map(match => ({ ...match }))
        );
        
        // Remove old winner from next rounds if different
        const oldWinner = updatedRounds[roundIdx][matchIdx].winner;
        if (oldWinner && oldWinner !== player) {
          for (let rIdx = roundIdx + 1; rIdx < updatedRounds.length; rIdx++) {
            const round = updatedRounds[rIdx];
            round.forEach(match => {
              if (match.player1 === oldWinner) match.player1 = null;
              if (match.player2 === oldWinner) match.player2 = null;
              if (match.winner === oldWinner) match.winner = null;
            });
          }
        }
        
        // Set new winner
        updatedRounds[roundIdx][matchIdx].winner = player;

        // Update next round
        if (roundIdx + 1 < updatedRounds.length) {
          const nextRound = updatedRounds[roundIdx + 1];
          const nextMatchIdx = Math.floor(matchIdx / 2);
          
          if (nextRound[nextMatchIdx]) {
            const slot = matchIdx % 2 === 0 ? "player1" : "player2";
            nextRound[nextMatchIdx][slot] = player;
          }
        }
        
        return updatedRounds;
      });
      
      triggerToast(`🏆 تم تأكيد ${player} كفائز! لا يمكن تعديله إلا بالحذف`);
      setTimeout(() => setProcessingMatch(null), 500);
    } catch (error) {
      console.error("خطأ في اختيار الفائز:", error);
      triggerToast("❌ حدث خطأ أثناء اختيار الفائز");
      setProcessingMatch(null);
    }
  };

  // Handle match reset with smart cleanup
  const handleResetMatch = useCallback((roundIdx, matchIdx, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const matchKey = `${roundIdx}-${matchIdx}`;
    if (isLoading || processingMatch === matchKey) return;
    
    try {
      setProcessingMatch(matchKey);
      
      setRounds(prevRounds => {
        if (!prevRounds || roundIdx >= prevRounds.length || matchIdx >= prevRounds[roundIdx].length) {
          return prevRounds;
        }
        
        // Create deep copy
        const updatedRounds = prevRounds.map(round => 
          round.map(match => ({ ...match }))
        );
        
        const match = updatedRounds[roundIdx][matchIdx];
        const winnerToRemove = match.winner;
        
        // Reset current match
        match.winner = null;
        
        // Remove winner from all next rounds and free up previous rounds
        if (winnerToRemove) {
          // Remove from next rounds
          for (let rIdx = roundIdx + 1; rIdx < updatedRounds.length; rIdx++) {
            const round = updatedRounds[rIdx];
            round.forEach(nextMatch => {
              if (nextMatch.player1 === winnerToRemove) nextMatch.player1 = null;
              if (nextMatch.player2 === winnerToRemove) nextMatch.player2 = null;
              if (nextMatch.winner === winnerToRemove) nextMatch.winner = null;
            });
          }
          
          // Free up previous rounds that fed into this match
          if (roundIdx > 0) {
            const prevRound = updatedRounds[roundIdx - 1];
            const match1Idx = matchIdx * 2;
            const match2Idx = matchIdx * 2 + 1;
            
            // Clear winners in previous matches that fed into this one
            if (prevRound[match1Idx] && prevRound[match1Idx].winner === winnerToRemove) {
              // Don't clear the winner, just allow re-selection
            }
            if (prevRound[match2Idx] && prevRound[match2Idx].winner === winnerToRemove) {
              // Don't clear the winner, just allow re-selection  
            }
          }
        }
        
        return updatedRounds;
      });
      
      triggerToast("🔄 تم إعادة تعيين المباراة - يمكن الآن اختيار فائز جديد من المرحلة السابقة");
      setTimeout(() => setProcessingMatch(null), 500);
    } catch (error) {
      console.error("خطأ في إعادة تعيين المباراة:", error);
      triggerToast("❌ حدث خطأ أثناء إعادة التعيين");
      setProcessingMatch(null);
    }
  }, [isLoading, processingMatch]);

  // Save results to Firebase
  const saveWinners = async () => {
    if (!id || isLoading) {
      triggerToast("❌ لم يتم العثور على معرف البطولة");
      return;
    }
    
    setIsLoading(true);
    const ref = doc(db, "tournaments", id);
    try {
      const bracketObject = rounds.reduce((acc, round, i) => {
        acc[`round_${i}`] = round;
        return acc;
      }, {});
      
      const champion = rounds.length > 0 ? rounds[rounds.length - 1][0]?.winner : null;
      
      await updateDoc(ref, {
        bracket: bracketObject,
        ...(champion ? { winner: champion, status: true } : {})
      });
      
      if (champion) {
        triggerToast(`🏆 تم حفظ النتائج بنجاح! البطل: ${champion}`);
      } else {
        triggerToast("💾 تم حفظ النتائج بنجاح");
      }
    } catch (err) {
      console.error("خطأ في الحفظ", err);
      triggerToast("❌ حدث خطأ أثناء الحفظ");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && rounds.length === 0) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#F8F9FA",
        fontFamily: "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif"
      }}>
        <div style={{
          textAlign: "center",
          padding: "2rem",
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
        }}>
          <div style={{
            width: "48px",
            height: "48px",
            border: "4px solid #A2AF9B",
            borderTop: "4px solid transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 1rem"
          }}></div>
          <p style={{
            color: "#6B7280",
            fontSize: "1rem",
            margin: 0
          }}>
            جاري تحميل شجرة البطولة...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: "#F8F9FA", 
      minHeight: "100vh", 
      fontFamily: "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif",
      padding: "2rem 1rem"
    }}>
      {toast && (
        <div style={{
          position: "fixed",
          top: "2rem",
          right: "50%",
          transform: "translateX(50%)",
          backgroundColor: "#FFFFFF",
          color: "#1F2937",
          padding: "1rem 2rem",
          border: "2px solid #A2AF9B",
          borderRadius: "12px",
          boxShadow: "0 8px 25px rgba(162, 175, 155, 0.3)",
          fontSize: "0.95rem",
          fontWeight: "500",
          zIndex: 1000,
          animation: "slideDown 0.3s ease-out"
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ 
        textAlign: "center", 
        marginBottom: "3rem",
        backgroundColor: "#FFFFFF",
        padding: "2.5rem 2rem",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)"
      }}>
        <h1 style={{ 
          fontSize: "2.5rem", 
          fontWeight: "700", 
          color: "#1F2937", 
          margin: "0 0 0.5rem 0",
          textShadow: "0 2px 4px rgba(162, 175, 155, 0.1)"
        }}>
          🏆 شجرة البطولة
        </h1>
        <p style={{ 
          fontSize: "1.1rem", 
          color: "#6B7280", 
          margin: 0,
          fontWeight: "400"
        }}>
          اختر الفائز من كل مباراة للتأهل إلى الجولة التالية
        </p>
      </div>

      {/* Tournament Bracket */}
      <div style={{ 
        display: "flex", 
        gap: "2.5rem", 
        overflowX: "auto", 
        overflowY: "visible",
        alignItems: "flex-start",
        padding: "1rem",
        minHeight: "400px",
        scrollBehavior: "smooth",
        WebkitOverflowScrolling: "touch"
      }}>
        {rounds.map((round, roundIdx) => (
          <div key={roundIdx} style={{ 
            minWidth: "220px", // تصغير من 280px
            maxWidth: "220px", // تصغير من 280px
            position: "relative",
            flexShrink: 0
          }}>
            {/* Round Title */}
            <div style={{
              background: "linear-gradient(135deg, #A2AF9B 0%, #8FA288 100%)",
              color: "white",
              padding: "1rem 1.5rem",
              borderRadius: "20px",
              textAlign: "center",
              marginBottom: "2rem",
              fontSize: "1.2rem",
              fontWeight: "700",
              boxShadow: "0 6px 20px rgba(162, 175, 155, 0.3)",
              border: "2px solid rgba(255, 255, 255, 0.2)",
              textShadow: "0 2px 4px rgba(0,0,0,0.2)"
            }}>
              {getRoundTitle(roundIdx, rounds.length)}
            </div>

            {/* Matches */}
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: roundIdx === rounds.length - 1 ? "0" : "2rem",
              alignItems: "center"
            }}>
              {round.map((match, matchIdx) => {
                const currentWinner = match.winner;
                const hasConflict = currentWinner && checkPlayerInNextRounds(currentWinner, roundIdx, rounds).found;
                
                return (
                  <div key={matchIdx} style={{ 
                    backgroundColor: "#FFFFFF",
                    border: `3px solid ${match.winner ? '#A2AF9B' : '#E5E7EB'}`,
                    borderRadius: "12px", // تصغير من 16px
                    padding: "0",
                    position: "relative",
                    transition: "all 0.3s ease",
                    transform: match.winner ? "scale(1.02)" : "scale(1)",
                    boxShadow: match.winner 
                      ? "0 6px 20px rgba(162, 175, 155, 0.25)" 
                      : "0 3px 12px rgba(0, 0, 0, 0.08)",
                    width: "200px", // تصغير من 250px
                    maxWidth: "200px", // تصغير من 250px
                    overflow: "hidden"
                  }}>
                    
                    {/* Header with Reset Button */}
                    <div style={{
                      backgroundColor: match.winner ? "#A2AF9B" : "#F3F4F6",
                      padding: "0.5rem 0.75rem", // تصغير من 0.75rem 1rem
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: `2px solid ${match.winner ? 'rgba(255,255,255,0.2)' : '#E5E7EB'}`
                    }}>
                      <div style={{
                        color: match.winner ? "#FFFFFF" : "#6B7280",
                        fontSize: "0.8rem", // تصغير من 0.875rem
                        fontWeight: "600"
                      }}>
                        مباراة {matchIdx + 1}
                      </div>
                      
                      <button
                        onClick={(e) => {
                          const matchKey = `${roundIdx}-${matchIdx}`;
                          if (processingMatch !== matchKey) {
                            handleResetMatch(roundIdx, matchIdx, e);
                          }
                        }}
                        disabled={isLoading || processingMatch === `${roundIdx}-${matchIdx}`}
                        style={{ 
                          backgroundColor: match.winner ? "rgba(255,255,255,0.2)" : "#E5E7EB", 
                          border: "none", 
                          color: match.winner ? "#FFFFFF" : "#6B7280", 
                          borderRadius: "6px", // تصغير من 8px
                          fontSize: "0.7rem", // تصغير من 0.75rem
                          padding: "0.4rem 0.6rem", // تصغير من 0.5rem 0.75rem
                          cursor: (isLoading || processingMatch === `${roundIdx}-${matchIdx}`) ? "not-allowed" : "pointer",
                          fontWeight: "600",
                          transition: "all 0.2s ease",
                          opacity: (isLoading || processingMatch === `${roundIdx}-${matchIdx}`) ? 0.6 : 1
                        }}
                      >
                        {processingMatch === `${roundIdx}-${matchIdx}` ? (
                          <div style={{
                            width: "10px", // تصغير من 12px
                            height: "10px",
                            border: "2px solid currentColor",
                            borderTop: "2px solid transparent",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite"
                          }}></div>
                        ) : (
                          "🔄"
                        )}
                      </button>
                    </div>

                    {/* Champion Badge */}
                    {roundIdx === rounds.length - 1 && match.winner && (
                      <div style={{ 
                        position: "absolute", 
                        top: "-12px", 
                        right: "-12px", 
                        background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)", 
                        color: "white", 
                        fontSize: "0.75rem", 
                        padding: "0.5rem 0.75rem", 
                        borderRadius: "12px", 
                        fontWeight: "700",
                        boxShadow: "0 4px 15px rgba(245, 158, 11, 0.4)",
                        border: "2px solid white",
                        zIndex: 10
                      }}>
                        👑 البطل
                      </div>
                    )}

                    {/* Content */}
                    <div style={{ padding: "1rem" }}> {/* تصغير من 1.5rem */}
                      {/* Protection Warning */}
                      {hasConflict && (
                        <div style={{
                          backgroundColor: "#FEF2F2",
                          border: "2px solid #FECACA",
                          borderRadius: "6px", // تصغير من 8px
                          padding: "0.5rem", // تصغير من 0.75rem
                          marginBottom: "0.75rem", // تصغير من 1rem
                          fontSize: "0.75rem" // تصغير من 0.8rem
                        }}>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            color: "#DC2626",
                            fontWeight: "600"
                          }}>
                            <span style={{ fontSize: "0.9rem" }}>🔒</span> {/* تصغير الرمز */}
                            <span>محمي</span>
                          </div>
                        </div>
                      )}

                      {/* Players */}
                      {["player1", "player2"].map((key, i) => {
                        const isThisPlayerWinner = match.winner === match[key];
                        const canClick = match[key] && !isLoading && processingMatch !== `${roundIdx}-${matchIdx}` && !hasConflict;
                        
                        return (
                          <div
                            key={key}
                            onClick={(e) => {
                              const matchKey = `${roundIdx}-${matchIdx}`;
                              if (canClick) {
                                handleSelectWinner(roundIdx, matchIdx, match[key], e);
                              } else if (hasConflict && match[key]) {
                                triggerToast(`❌ لا يمكن تغيير الاختيار! ${currentWinner} موجود في مرحلة تالية`);
                              }
                            }}
                            style={{
                              backgroundColor: isThisPlayerWinner 
                                ? "#A2AF9B" 
                                : hasConflict && match[key] 
                                  ? "#FEF2F2"
                                  : "#F9FAFB",
                              color: isThisPlayerWinner 
                                ? "white" 
                                : hasConflict && match[key] 
                                  ? "#DC2626" 
                                  : "#1F2937",
                              padding: "0.75rem", // تصغير من 1rem
                              marginBottom: i === 0 ? "0.5rem" : "0", // تصغير من 0.75rem
                              borderRadius: "8px", // تصغير من 12px
                              cursor: canClick ? "pointer" : hasConflict ? "not-allowed" : "default",
                              border: isThisPlayerWinner 
                                ? "2px solid rgba(255, 255, 255, 0.3)" 
                                : hasConflict && match[key]
                                  ? "2px solid #FECACA"
                                  : "2px solid #E5E7EB",
                              transition: "all 0.3s ease",
                              fontSize: "0.8rem", // تصغير من 0.9rem
                              fontWeight: isThisPlayerWinner ? "700" : "500",
                              textAlign: "center",
                              boxShadow: isThisPlayerWinner 
                                ? "0 3px 12px rgba(162, 175, 155, 0.3)" 
                                : hasConflict && match[key]
                                  ? "0 2px 6px rgba(220, 38, 38, 0.1)"
                                  : "0 2px 6px rgba(0, 0, 0, 0.05)",
                              wordBreak: "break-word",
                              minHeight: "40px", // تصغير من 48px
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              opacity: (isLoading || processingMatch === `${roundIdx}-${matchIdx}`) ? 0.7 : 1,
                              userSelect: "none",
                              pointerEvents: (isLoading || processingMatch === `${roundIdx}-${matchIdx}`) ? "none" : "auto"
                            }}
                          >
                            {match[key] ? (
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
                                <span style={{ fontSize: "1.2rem" }}>
                                  {isThisPlayerWinner ? "🏆" : 
                                   processingMatch === `${roundIdx}-${matchIdx}` ? "⏳" : 
                                   hasConflict ? "🔒" : "⚡"}
                                </span>
                                <span>{match[key]}</span>
                                {processingMatch === `${roundIdx}-${matchIdx}` && (
                                  <div style={{
                                    width: "14px",
                                    height: "14px",
                                    border: "2px solid #FFFFFF",
                                    borderTop: "2px solid transparent",
                                    borderRadius: "50%",
                                    animation: "spin 1s linear infinite"
                                  }}></div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: "#FFFFFFFF", fontStyle: "italic", fontSize: "0.85rem" }}>
                                في انتظار المتأهل
                              </span>
                            )}
                          </div>
                        );
                      })}

                      {/* Auto Qualification */}
                      {match.player1 && !match.player2 && !match.winner && (
                        <button
                          onClick={(e) => {
                            const matchKey = `${roundIdx}-${matchIdx}`;
                            if (processingMatch !== matchKey) {
                              handleSelectWinner(roundIdx, matchIdx, match.player1, e);
                            }
                          }}
                          disabled={isLoading || processingMatch === `${roundIdx}-${matchIdx}`}
                          style={{ 
                            marginTop: "1rem", 
                            padding: "0.75rem 1.5rem", 
                            background: "linear-gradient(135deg, #A2AF9B 0%, #8FA288 100%)", 
                            border: "none", 
                            color: "white", 
                            borderRadius: "12px", 
                            fontSize: "0.9rem", 
                            cursor: (isLoading || processingMatch === `${roundIdx}-${matchIdx}`) ? "not-allowed" : "pointer", 
                            display: "block", 
                            margin: "1rem auto 0",
                            fontWeight: "600",
                            transition: "all 0.2s ease",
                            boxShadow: "0 4px 15px rgba(162, 175, 155, 0.3)",
                            opacity: (isLoading || processingMatch === `${roundIdx}-${matchIdx}`) ? 0.6 : 1
                          }}
                        >
                          {processingMatch === `${roundIdx}-${matchIdx}` ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div style={{
                                width: "16px",
                                height: "16px",
                                border: "2px solid #FFFFFF",
                                borderTop: "2px solid transparent",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite"
                              }}></div>
                              <span>جاري التأهيل...</span>
                            </div>
                          ) : (
                            "✅ تأهل تلقائي"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div style={{
        backgroundColor: "#FFFFFF",
        padding: "2rem",
        borderRadius: "12px",
        border: "1px solid #E5E7EB",
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
        marginBottom: "2rem"
      }}>
        <h3 style={{
          fontSize: "1.1rem",
          fontWeight: "600",
          color: "#1F2937",
          margin: "0 0 1rem 0",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem"
        }}>
          <span style={{ fontSize: "1.25rem" }}>ℹ️</span>
          كيفية إدارة البراكيت
        </h3>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1rem",
          fontSize: "0.875rem"
        }}>
          <div style={{
            padding: "1rem",
            backgroundColor: "#F0FDF4",
            border: "1px solid #BBF7D0",
            borderRadius: "8px"
          }}>
            <div style={{ fontWeight: "600", color: "#166534", marginBottom: "0.5rem" }}>
              ✅ اختيار الفائز
            </div>
            <div style={{ color: "#15803D" }}>
              اضغط على اسم اللاعب لاختياره كفائز ونقله للمرحلة التالية
            </div>
          </div>
          
          <div style={{
            padding: "1rem",
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: "8px"
          }}>
            <div style={{ fontWeight: "600", color: "#DC2626", marginBottom: "0.5rem" }}>
              🔒 الحماية من التعديل
            </div>
            <div style={{ color: "#991B1B" }}>
              لا يمكن تغيير الفائز إذا كان موجوداً في مرحلة تالية
            </div>
          </div>
          
          <div style={{
            padding: "1rem",
            backgroundColor: "#FFF7ED",
            border: "1px solid #FED7AA",
            borderRadius: "8px"
          }}>
            <div style={{ fontWeight: "600", color: "#EA580C", marginBottom: "0.5rem" }}>
              🔄 إعادة التعيين
            </div>
            <div style={{ color: "#C2410C" }}>
              زر الإعادة يمسح الفائز ويحذفه من جميع المراحل التالية
            </div>
          </div>
          
          <div style={{
            padding: "1rem",
            backgroundColor: "#F0F9FF",
            border: "1px solid #BAE6FD",
            borderRadius: "8px"
          }}>
            <div style={{ fontWeight: "600", color: "#0284C7", marginBottom: "0.5rem" }}>
              💾 الحفظ
            </div>
            <div style={{ color: "#0369A1" }}>
              احفظ النتائج في قاعدة البيانات عند الانتهاء من البراكيت
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ textAlign: "center", marginTop: "4rem" }}>
        <button
          onClick={saveWinners}
          disabled={isLoading}
          style={{ 
            padding: "1.25rem 3rem", 
            background: isLoading 
              ? "linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)"
              : "linear-gradient(135deg, #A2AF9B 0%, #8FA288 100%)", 
            color: "white", 
            borderRadius: "16px", 
            fontSize: "1.1rem", 
            fontWeight: "700", 
            border: "none", 
            cursor: isLoading ? "not-allowed" : "pointer", 
            boxShadow: "0 8px 25px rgba(162, 175, 155, 0.3)",
            transition: "all 0.3s ease",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            opacity: isLoading ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            margin: "0 auto"
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.transform = "translateY(-3px) scale(1.05)";
              e.currentTarget.style.boxShadow = "0 12px 30px rgba(162, 175, 155, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0 8px 25px rgba(162, 175, 155, 0.3)";
            }
          }}
        >
          {isLoading ? (
            <>
              <div style={{
                width: "20px",
                height: "20px",
                border: "2px solid #FFFFFF",
                borderTop: "2px solid transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }}></div>
              <span>جاري الحفظ...</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: "1.3rem" }}>💾</span>
              <span>حفظ النتائج النهائية</span>
            </>
          )}
        </button>
      </div>

      {/* Confirmation Modal */}
      {confirmationModal && (
        <div style={{
          position: "fixed",
          top: "0px",
          left: "0px",
          right: "0px",
          bottom: "0px",
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: "999999",
          backdropFilter: "blur(3px)"
        }}
        onClick={() => setConfirmationModal(null)}
        >
          <div style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            padding: "2rem",
            maxWidth: "400px",
            width: "90%",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
            border: "3px solid #A2AF9B",
            transform: "scale(1)",
            animation: "modalSlideIn 0.3s ease-out"
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              textAlign: "center",
              marginBottom: "1.5rem"
            }}>
              <div style={{
                width: "64px",
                height: "64px",
                backgroundColor: "#D1FAE5",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem auto",
                fontSize: "2rem",
                border: "3px solid #A7F3D0"
              }}>
                🏆
              </div>
              <h3 style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                color: "#1F2937",
                margin: "0 0 0.5rem 0"
              }}>
                تأكيد اختيار الفائز
              </h3>
              <p style={{
                color: "#6B7280",
                fontSize: "0.9rem",
                margin: 0
              }}>
                {confirmationModal.roundName}
              </p>
            </div>

            {/* Winner Info */}
            <div style={{
              backgroundColor: "#F0FDF4",
              border: "2px solid #BBF7D0",
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              textAlign: "center"
            }}>
              <div style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: "#166534",
                marginBottom: "0.5rem"
              }}>
                ⚡ {confirmationModal.player}
              </div>
              <div style={{
                fontSize: "0.875rem",
                color: "#15803D"
              }}>
                {confirmationModal.isNextRoundAffected 
                  ? "سيتم نقله تلقائياً للمرحلة التالية" 
                  : "هذا هو الفائز النهائي بالبطولة! 🎉"
                }
              </div>
            </div>

            {/* Warning */}
            <div style={{
              backgroundColor: "#FEF3C7",
              border: "2px solid #FDE68A",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "2rem"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                color: "#92400E",
                fontSize: "0.875rem",
                fontWeight: "600"
              }}>
                <span style={{ fontSize: "1.25rem" }}>⚠️</span>
                <span>لا يمكن تعديل الاختيار إلا بحذف المراحل التالية</span>
              </div>
            </div>

            {/* Buttons */}
            <div style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center"
            }}>
              <button
                onClick={() => setConfirmationModal(null)}
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
                onClick={confirmWinnerSelection}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.875rem 1.5rem",
                  background: "linear-gradient(135deg, #A2AF9B 0%, #8FA288 100%)",
                  color: "#FFFFFF",
                  border: "2px solid #A2AF9B",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  minWidth: "140px",
                  justifyContent: "center"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(162, 175, 155, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span style={{ fontSize: "1rem" }}>🏆</span>
                <span>تأكيد الاختيار</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(50%) translateY(0);
          }
        }
        
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