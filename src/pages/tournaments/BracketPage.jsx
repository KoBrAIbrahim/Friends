/* eslint-disable no-unused-vars */
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase";

export default function BracketPage() {
  const { id } = useParams();
  
  // Core states
  const [tournament, setTournament] = useState(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [viewingRound, setViewingRound] = useState(1);
  const [currentMatches, setCurrentMatches] = useState([]);
  const [tournamentHistory, setTournamentHistory] = useState([]);
  const [champion, setChampion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Animation states
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatedMatches, setAnimatedMatches] = useState([]);
  const [currentAnimatingMatch, setCurrentAnimatingMatch] = useState(-1);
  const [showNewRoundModal, setShowNewRoundModal] = useState(false);

  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  // Player swap states
  const [showSwapSection, setShowSwapSection] = useState(false);
  const [selectedPlayer1, setSelectedPlayer1] = useState("");
  const [selectedPlayer2, setSelectedPlayer2] = useState("");

  // Cleanup animation function
  const cleanupAnimation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Show toast message
  const triggerToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Get round title
// Helpers
const normalizeName = (v) => {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  if (s === "" || s === "-" || s === "—" || s === "–") return "";
  return s;
};

const getRoundPlayersCount = useCallback((roundNum) => {
  // احضر مباريات الجولة المطلوبة (الحالية أو من التاريخ)
  const matches = roundNum === currentRound
    ? (currentMatches || [])
    : ((tournamentHistory.find(r => r.round === roundNum)?.matches) || []);

  // عدّ أسماء اللاعبين غير الفارغة (player1 / player2)
  const names = new Set();
  matches.forEach(m => {
    const p1 = normalizeName(m?.player1);
    const p2 = normalizeName(m?.player2);
    if (p1) names.add(p1);
    if (p2) names.add(p2);
    // ملاحظة: لو في BYE، بيكون لاعب واحد بالمباراة، وبيِنعد ضمن عدد هذه الجولة
  });

  return names.size; // عدد اللاعبين في هذه الجولة
}, [currentRound, currentMatches, tournamentHistory]);

// أعطي اسم ديناميكي حسب عدد اللاعبين في هذه الجولة
const getRoundTitle = useCallback((roundNum) => {
  const n = getRoundPlayersCount(roundNum); // عدد اللاعبين في الجولة

  // خرائط الأدوار المعروفة
  if (n === 2)  return "🏆 النهائي";
  if (n === 4)  return "🥈 نصف النهائي";
  if (n === 8)  return "🥉 ربع النهائي";

  // أدوار أكبر
  if (n === 16) return "دور الـ 16";
  if (n === 32) return "دور الـ 32";
  if (n === 64) return "دور الـ 64";

  // أدوار تمهيدية/غير قياسية (عدد فردي أو غير قوة 2)
  if (n > 0 && (n & (n - 1)) !== 0) {
    return `🎯 دور تمهيدي (${n} لاعبين)`;
  }

  // fallback لو ما قدرنا نحدد (أول جولة أو بيانات ناقصة)
  if (roundNum === 1) return "🥊 الجولة الأولى";
  return `الجولة ${roundNum} (${n || 0} لاعبين)`;
}, [getRoundPlayersCount]);


  // Get matches for viewing round
  const getDisplayMatches = useCallback(() => {
    if (viewingRound === currentRound) {
      return currentMatches;
    }
    
    const historicalRound = tournamentHistory.find(round => round.round === viewingRound);
    if (historicalRound && historicalRound.matches) {
      return historicalRound.matches.map(match => ({
        ...match,
        isCompleted: !!match.winner
      }));
    }
    
    return [];
  }, [viewingRound, currentRound, currentMatches, tournamentHistory]);

  // Get random name for animation
  const getRandomName = useCallback(() => {
    if (!tournament || !tournament.participants || !Array.isArray(tournament.participants)) {
      return "لاعب";
    }
    const names = tournament.participants;
    return names[Math.floor(Math.random() * names.length)].name;
  }, [tournament]);

  // Get players who have auto-qualified before
// 🔁 اجمع اللاعبين الذين حصلوا على BYE من قبل (بالاسم فقط)
// ضع هذا فوق كمساعد صغير
const isEmptySlot = (v) => {
  if (v === null || v === undefined) return true;
  const s = String(v).trim();
  return s === "" || s === "-" || s === "—" || s === "–";
};

// استبدل الدالة القديمة بهذه
const getAutoQualifiedPlayers = useCallback(() => {
  const s = new Set();

  // من الجولات السابقة (history)
  (tournamentHistory || []).forEach((round) => {
    (round.matches || []).forEach((m) => {
      const p1 = m?.player1?.toString().trim();
      const p2 = m?.player2?.toString().trim();
      const completed = !!m?.isCompleted || !!m?.winner;

      if (completed) {
        // إذا أحد الجانبين فاضي والآخر موجود => BYE
        if (p1 && isEmptySlot(p2)) s.add(p1);
        if (p2 && isEmptySlot(p1)) s.add(p2);
      }
    });
  });

  // من الجولة الحالية (مهم جداً للجولة الأولى)
  (currentMatches || []).forEach((m) => {
    const p1 = m?.player1?.toString().trim();
    const p2 = m?.player2?.toString().trim();
    if (m?.isCompleted) {
      if (p1 && isEmptySlot(p2)) s.add(p1);
      if (p2 && isEmptySlot(p1)) s.add(p2);
    }
  });

  return s;
}, [tournamentHistory, currentMatches]);




  // Generate next round matches with auto-qualification rules


// أداة خلط
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// ✅ توليد مباريات الجولة القادمة مع أولوية الـBYE لمن "لم يأخذه من قبل"
const generateNextRoundMatches = useCallback((winners) => {
  if (!Array.isArray(winners) || winners.length === 0) return [];

  const autoSet = getAutoQualifiedPlayers(); // أسماء من أخذوا BYE سابقاً

  // قسّم حسب تاريخ الـBYE
  const hadBye = [];
  const noBye  = [];
  winners.forEach((name) => {
    (autoSet.has(name) ? hadBye : noBye).push(name);
  });

  shuffle(hadBye);
  shuffle(noBye);

  const matches = [];

  // 👈 لو العدد فردي: اختر صاحب الـBYE أولاً
  let byeCandidate = null;
  const needsBye = winners.length % 2 === 1;
  if (needsBye) {
    // أولويّة لمن لم يأخذ BYE من قبل
    if (noBye.length > 0) byeCandidate = noBye.pop();
    else byeCandidate = hadBye.pop(); // الكل أخذ BYE من قبل (الاستثناء المسموح)
  }

  // 1) زاوج "سبق له BYE" مع "لم يسبق" قدر الإمكان
  while (hadBye.length && noBye.length) {
    matches.push({
      player1: hadBye.pop(),
      player2: noBye.pop(),
      winner: null,
      isCompleted: false,
    });
  }

  // 2) المتبقّي من "لم يسبق" بين بعض
  while (noBye.length >= 2) {
    matches.push({
      player1: noBye.pop(),
      player2: noBye.pop(),
      winner: null,
      isCompleted: false,
    });
  }

  // 3) المتبقّي من "سبق له" بين بعض
  while (hadBye.length >= 2) {
    matches.push({
      player1: hadBye.pop(),
      player2: hadBye.pop(),
      winner: null,
      isCompleted: false,
    });
  }

  // 4) أضف صاحب الـBYE (إن وُجد) كمباراة بلا خصم
  if (byeCandidate) {
    matches.push({
      player1: byeCandidate,
      player2: "",
      winner: null,
      isCompleted: false,
    });
  }

  return matches;
}, [getAutoQualifiedPlayers]);


  // Check if round is completed and get winners
  const roundWinners = useMemo(() => {
    const displayMatches = getDisplayMatches();
    if (!displayMatches || displayMatches.length === 0) return [];
    return displayMatches
      .filter(match => match && match.isCompleted && match.winner)
      .map(match => match.winner);
  }, [getDisplayMatches]);

  const isRoundCompleted = useMemo(() => {
    const displayMatches = getDisplayMatches();
    if (!displayMatches || displayMatches.length === 0) return false;
    return displayMatches.every(match => match && match.isCompleted);
  }, [getDisplayMatches]);

  const isViewingCurrentRound = useMemo(() => {
    return viewingRound === currentRound;
  }, [viewingRound, currentRound]);

  // Save final results
  const saveFinalResults = useCallback(async (championName = null) => {
    if (!id) return;
    
    setIsLoading(true);
    const ref = doc(db, "tournaments", id);
    
    try {
      const updateData = {
        bracket_history: tournamentHistory,
        current_round: currentRound,
        current_matches: currentMatches,
        status: championName ? true : false
      };
      
      if (championName) {
        updateData.winner = championName;
        updateData.completed_date = new Date().toISOString();
      }
      
      await updateDoc(ref, updateData);
      
      if (championName) {
        triggerToast(`🏆 مبروك! ${championName} بطل البطولة!`);
      } else {
        triggerToast("💾 تم حفظ التقدم بنجاح - يمكنك العودة لاحقاً!");
      }
    } catch (error) {
      console.error("خطأ في الحفظ:", error);
      triggerToast("❌ حدث خطأ أثناء الحفظ");
    } finally {
      setIsLoading(false);
    }
  }, [id, tournamentHistory, currentRound, currentMatches, triggerToast]);

  // Navigation functions
  const goToPreviousRound = useCallback(() => {
    if (viewingRound > 1) {
      setViewingRound(viewingRound - 1);
    }
  }, [viewingRound]);

  const goToNextRound = useCallback(() => {
    if (viewingRound < currentRound) {
      setViewingRound(viewingRound + 1);
    }
  }, [viewingRound, currentRound]);

  const goToCurrentRound = useCallback(() => {
    setViewingRound(currentRound);
  }, [currentRound]);

  // Handle winner selection
  const handleSelectWinner = useCallback((matchIdx, playerName, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (!playerName || isLoading || isAnimating) return;
    
    setCurrentMatches(prev => {
      const updated = [...prev];
      if (updated[matchIdx]) {
        updated[matchIdx] = {
          ...updated[matchIdx],
          winner: playerName,
          isCompleted: true
        };
      }
      return updated;
    });
    
    triggerToast(`🏆 ${playerName} فاز في المباراة ${matchIdx + 1}!`);
  }, [isLoading, isAnimating, triggerToast]);

  // Reset match
  const handleResetMatch = useCallback((matchIdx, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    setCurrentMatches(prev => {
      const updated = [...prev];
      if (updated[matchIdx]) {
        updated[matchIdx] = {
          ...updated[matchIdx],
          winner: null,
          isCompleted: false
        };
      }
      return updated;
    });
    
    triggerToast("🔄 تم إعادة تعيين المباراة");
  }, [triggerToast]);

  // Get all players in current round for swapping
  const getAllCurrentRoundPlayers = useCallback(() => {
    const players = [];
    const displayMatches = getDisplayMatches();
    
    displayMatches.forEach((match, matchIndex) => {
      if (match?.player1 && normalizeName(match.player1)) {
        players.push({
          name: match.player1,
          matchIndex: matchIndex,
          position: 'player1'
        });
      }
      if (match?.player2 && normalizeName(match.player2)) {
        players.push({
          name: match.player2,
          matchIndex: matchIndex,
          position: 'player2'
        });
      }
    });
    
    return players;
  }, [getDisplayMatches]);

  // Execute player swap
  const executePlayerSwap = useCallback(async () => {
    if (!selectedPlayer1 || !selectedPlayer2 || selectedPlayer1 === selectedPlayer2) {
      triggerToast("❌ يجب اختيار لاعبين مختلفين");
      return;
    }
    
    if (!window.confirm(`هل أنت متأكد من تبديل ${selectedPlayer1} مع ${selectedPlayer2}؟`)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const allPlayers = getAllCurrentRoundPlayers();
      
      // Find the positions of both players
      const player1Info = allPlayers.find(p => p.name === selectedPlayer1);
      const player2Info = allPlayers.find(p => p.name === selectedPlayer2);
      
      if (!player1Info || !player2Info) {
        triggerToast("❌ فشل في العثور على اللاعبين");
        return;
      }
      
      // Create new matches array with swapped players
      const updatedMatches = [...currentMatches];
      
      // Swap the players in their positions
      updatedMatches[player1Info.matchIndex][player1Info.position] = selectedPlayer2;
      updatedMatches[player2Info.matchIndex][player2Info.position] = selectedPlayer1;
      
      // Reset any completed matches that involved these players
      if (updatedMatches[player1Info.matchIndex].isCompleted) {
        updatedMatches[player1Info.matchIndex].isCompleted = false;
        updatedMatches[player1Info.matchIndex].winner = null;
      }
      if (updatedMatches[player2Info.matchIndex].isCompleted && player2Info.matchIndex !== player1Info.matchIndex) {
        updatedMatches[player2Info.matchIndex].isCompleted = false;
        updatedMatches[player2Info.matchIndex].winner = null;
      }
      
      setCurrentMatches(updatedMatches);
      
      // Save to Firebase if we're viewing current round
      if (isViewingCurrentRound && id) {
        const ref = doc(db, "tournaments", id);
        await updateDoc(ref, {
          current_matches: updatedMatches
        });
      }
      
      // Reset selection
      setSelectedPlayer1("");
      setSelectedPlayer2("");
      setShowSwapSection(false);
      
      triggerToast(`✅ تم تبديل ${selectedPlayer1} مع ${selectedPlayer2} بنجاح!`);
    } catch (error) {
      console.error("خطأ في تبديل اللاعبين:", error);
      triggerToast("❌ حدث خطأ أثناء تبديل اللاعبين");
    } finally {
      setIsLoading(false);
    }
  }, [selectedPlayer1, selectedPlayer2, currentMatches, getAllCurrentRoundPlayers, isViewingCurrentRound, id, triggerToast]);

  // Animate next round matches
  const animateNextRoundMatches = useCallback((finalMatches) => {
    if (!finalMatches || finalMatches.length === 0) return;
    
    let currentMatch = 0;
    
    const animateNextMatch = () => {
      if (currentMatch >= finalMatches.length) {
        timeoutRef.current = setTimeout(() => {
          setIsAnimating(false);
          setShowNewRoundModal(false);
          
          const nextRound = currentRound + 1;
          setCurrentRound(nextRound);
          setViewingRound(nextRound);
          setCurrentMatches(finalMatches);
          
          const newHistoryEntry = {
            round: currentRound,
            roundTitle: getRoundTitle(currentRound),
            matches: getDisplayMatches().map(match => ({
              player1: match.player1 || "",
              player2: match.player2 || "",
              winner: match.winner || ""
            })),
            winners: roundWinners,
            date: new Date().toISOString()
          };
          
          setTournamentHistory(prev => [...prev, newHistoryEntry]);
          
          triggerToast(`🎉 تم إنشاء ${getRoundTitle(nextRound)} بنجاح!`);
        }, 1000);
        return;
      }

      setCurrentAnimatingMatch(currentMatch);
      
      let speed = 50;
      let iterations = 0;
      const maxIterations = 60;
      
      const animateCurrentMatch = () => {
        iterations++;
        
        setAnimatedMatches(prev => {
          const newMatches = [...prev];
          if (newMatches[currentMatch] && !newMatches[currentMatch].isFinished) {
            newMatches[currentMatch] = {
              player1: getRandomName(),
              player2: getRandomName(),
              isFinished: false
            };
          }
          return newMatches;
        });
        
        if (iterations < maxIterations) {
          speed = Math.min(speed + 3, 200);
          timeoutRef.current = setTimeout(animateCurrentMatch, speed);
        } else {
          setAnimatedMatches(prev => {
            const newMatches = [...prev];
            if (newMatches[currentMatch]) {
              newMatches[currentMatch] = {
                player1: finalMatches[currentMatch].player1,
                player2: finalMatches[currentMatch].player2,
                isFinished: true
              };
            }
            return newMatches;
          });
          
          timeoutRef.current = setTimeout(() => {
            currentMatch++;
            animateNextMatch();
          }, 800);
        }
      };
      
      animateCurrentMatch();
    };
    
    animateNextMatch();
  }, [currentRound, roundWinners, getRoundTitle, getRandomName, triggerToast, getDisplayMatches]);

  // Start animated draw for next round
  const startNextRoundDraw = useCallback(() => {
    if (roundWinners.length < 2) {
      triggerToast("❌ يجب أن يكون هناك فائزان على الأقل للجولة التالية");
      return;
    }

    if (roundWinners.length === 1) {
      setChampion(roundWinners[0]);
      saveFinalResults(roundWinners[0]);
      return;
    }

    setIsAnimating(true);
    setShowNewRoundModal(true);
    setCurrentAnimatingMatch(-1);
    
    const finalMatchesResult = generateNextRoundMatches(roundWinners);
    const numberOfMatches = finalMatchesResult.length;
    
    const initialAnimated = Array(numberOfMatches).fill(null).map(() => ({
      player1: getRandomName(),
      player2: getRandomName(),
      isFinished: false
    }));
    
    setAnimatedMatches(initialAnimated);
    animateNextRoundMatches(finalMatchesResult);
  }, [roundWinners, generateNextRoundMatches, getRandomName, animateNextRoundMatches, triggerToast, saveFinalResults]);

  // Cancel last round
  const cancelLastRound = useCallback(async () => {
    if (currentRound <= 1 || tournamentHistory.length === 0) {
      triggerToast("❌ لا يمكن إلغاء الجولة الأولى");
      return;
    }

    if (!window.confirm("هل أنت متأكد من إلغاء الجولة الأخيرة؟ سيتم حذف جميع نتائجها.")) {
      return;
    }

    setIsLoading(true);
    try {
      const previousRound = currentRound - 1;
      const newHistory = tournamentHistory.slice(0, -1);
      
      let previousMatches = [];
      if (newHistory.length > 0) {
        const lastHistoricalRound = newHistory[newHistory.length - 1];
        previousMatches = lastHistoricalRound.matches.map(match => ({
          ...match,
          isCompleted: !!match.winner
        }));
      } else {
        if (tournament.matches && Array.isArray(tournament.matches)) {
          previousMatches = tournament.matches.map(match => ({
            player1: match.player1 || "",
            player2: match.player2 || "",
            winner: match.winner || null,
            isCompleted: !!match.winner
          }));
        }
      }

      setCurrentRound(previousRound);
      setViewingRound(previousRound);
      setCurrentMatches(previousMatches);
      setTournamentHistory(newHistory);

      const ref = doc(db, "tournaments", id);
      await updateDoc(ref, {
        current_round: previousRound,
        current_matches: previousMatches,
        bracket_history: newHistory,
        winner: null,
        status: false
      });

      triggerToast("✅ تم إلغاء الجولة الأخيرة بنجاح!");
    } catch (error) {
      console.error("خطأ في إلغاء الجولة:", error);
      triggerToast("❌ حدث خطأ أثناء إلغاء الجولة");
    } finally {
      setIsLoading(false);
    }
  }, [currentRound, tournamentHistory, tournament, id, triggerToast]);

  // Edit historical match result
  const editHistoricalMatch = useCallback(async (roundNum, matchIdx, newWinner) => {
    if (roundNum >= currentRound) {
      triggerToast("❌ لا يمكن تعديل الجولة الحالية من هنا");
      return;
    }

    setIsLoading(true);
    try {
      const updatedHistory = tournamentHistory.map(round => {
        if (round.round === roundNum) {
          const updatedMatches = round.matches.map((match, idx) => {
            if (idx === matchIdx) {
              return {
                ...match,
                winner: newWinner
              };
            }
            return match;
          });
          
          return {
            ...round,
            matches: updatedMatches,
            winners: updatedMatches.filter(m => m.winner).map(m => m.winner)
          };
        }
        return round;
      });

      setTournamentHistory(updatedHistory);

      const ref = doc(db, "tournaments", id);
      await updateDoc(ref, {
        bracket_history: updatedHistory
      });

      triggerToast(`✅ تم تحديث نتيجة المباراة ${matchIdx + 1} في ${getRoundTitle(roundNum)}`);
    } catch (error) {
      console.error("خطأ في تعديل النتيجة:", error);
      triggerToast("❌ حدث خطأ أثناء تعديل النتيجة");
    } finally {
      setIsLoading(false);
    }
  }, [currentRound, tournamentHistory, id, triggerToast, getRoundTitle]);

  // Regenerate rounds from a specific point
  const regenerateFromRound = useCallback(async (fromRound) => {
    if (fromRound >= currentRound) {
      triggerToast("❌ لا يمكن إعادة توليد الجولة الحالية");
      return;
    }

    if (!window.confirm(`هل تريد إعادة توليد جميع الجولات من ${getRoundTitle(fromRound + 1)} فما بعد؟`)) {
      return;
    }

    setIsLoading(true);
    try {
      const newHistory = tournamentHistory.slice(0, fromRound);
      
      const targetRound = tournamentHistory[fromRound - 1];
      if (!targetRound) {
        triggerToast("❌ لا يمكن العثور على بيانات الجولة");
        return;
      }

      const winners = targetRound.winners || [];
      if (winners.length === 0) {
        triggerToast("❌ لا توجد فائزين في الجولة المحددة");
        return;
      }

      const newRound = fromRound + 1;
      const newMatches = generateNextRoundMatches(winners);
      
      setCurrentRound(newRound);
      setViewingRound(newRound);
      setCurrentMatches(newMatches);
      setTournamentHistory(newHistory);

      const ref = doc(db, "tournaments", id);
      await updateDoc(ref, {
        current_round: newRound,
        current_matches: newMatches,
        bracket_history: newHistory,
        winner: null,
        status: false
      });

      triggerToast(`✅ تم إعادة توليد البطولة من ${getRoundTitle(newRound)}!`);
    } catch (error) {
      console.error("خطأ في إعادة التوليد:", error);
      triggerToast("❌ حدث خطأ أثناء إعادة التوليد");
    } finally {
      setIsLoading(false);
    }
  }, [currentRound, tournamentHistory, generateNextRoundMatches, getRoundTitle, id, triggerToast]);

  // Fetch tournament data
  useEffect(() => {
    let isMounted = true;
    
    const fetchTournament = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const ref = doc(db, "tournaments", id);
        const snap = await getDoc(ref);
        
        if (!isMounted) return;
        
        if (snap.exists()) {
          const data = snap.data();
          setTournament({ id: snap.id, ...data });
          
          if (data.current_round) {
            setCurrentRound(data.current_round);
            setViewingRound(data.current_round);
          }
          
          if (data.current_matches && Array.isArray(data.current_matches)) {
            setCurrentMatches(data.current_matches);
          } else if (data.matches && Array.isArray(data.matches) && data.matches.length > 0) {
            const initialMatches = data.matches.map(match => ({
              player1: match.player1 || "",
              player2: match.player2 || "",
              winner: null,
              isCompleted: false
            }));
            setCurrentMatches(initialMatches);
          }
          
          if (data.bracket_history && Array.isArray(data.bracket_history)) {
            setTournamentHistory(data.bracket_history);
          }
          
          if (data.winner) {
            setChampion(data.winner);
          }
        }
      } catch (error) {
        console.error("خطأ في جلب البيانات:", error);
        if (isMounted) {
          triggerToast("❌ خطأ في جلب بيانات البطولة");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchTournament();
    
    return () => {
      isMounted = false;
    };
  }, [id, triggerToast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAnimation();
    };
  }, [cleanupAnimation]);

  if (isLoading && !tournament) {
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
            جاري تحميل البطولة...
          </p>
        </div>
      </div>
    );
  }

  if (champion) {
    return (
      <div style={{ 
        backgroundColor: "#F8F9FA", 
        minHeight: "100vh", 
        fontFamily: "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif",
        padding: "2rem 1rem"
      }}>
        <div style={{
          textAlign: "center",
          marginBottom: "3rem",
          backgroundColor: "#FFFFFF",
          padding: "3rem 2rem",
          borderRadius: "20px",
          border: "3px solid #F59E0B",
          boxShadow: "0 10px 30px rgba(245, 158, 11, 0.2)",
          background: "linear-gradient(135deg, #FFFFFF 0%, #FEF3C7 100%)"
        }}>
          <div style={{
            fontSize: "4rem",
            marginBottom: "1rem",
            animation: "bounce 2s infinite"
          }}>
            🏆
          </div>
          <h1 style={{
            fontSize: "2.5rem",
            fontWeight: "700",
            color: "#D97706",
            margin: "0 0 1rem 0",
            textShadow: "0 2px 4px rgba(217, 119, 6, 0.3)"
          }}>
            مبروك البطولة!
          </h1>
          <div style={{
            fontSize: "2rem",
            fontWeight: "600",
            color: "#92400E",
            marginBottom: "1rem"
          }}>
            {champion}
          </div>
          <div style={{
            fontSize: "1.2rem",
            color: "#78350F",
            fontWeight: "500"
          }}>
            بطل {tournament?.name}
          </div>
        </div>

        <div style={{
          backgroundColor: "#FFFFFF",
          padding: "2rem",
          borderRadius: "16px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)"
        }}>
          <h3 style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            color: "#1F2937",
            margin: "0 0 2rem 0",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
          }}>
            <span style={{ fontSize: "1.5rem" }}>📜</span>
            تاريخ البطولة
          </h3>

          {tournamentHistory && tournamentHistory.length > 0 && tournamentHistory.map((round, idx) => (
            <div key={idx} style={{
              marginBottom: "2rem",
              padding: "1.5rem",
              backgroundColor: "#F9FAFB",
              borderRadius: "12px",
              border: "1px solid #E5E7EB"
            }}>
              <h4 style={{
                fontSize: "1.2rem",
                fontWeight: "600",
                color: "#1F2937",
                margin: "0 0 1rem 0"
              }}>
                {round.roundTitle}
              </h4>
              
              <div style={{
                display: "grid",
                gap: "0.75rem"
              }}>
                {round.matches && round.matches.map((match, matchIdx) => (
                  <div key={matchIdx} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "1rem",
                    backgroundColor: "#FFFFFF",
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB"
                  }}>
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
                      {matchIdx + 1}
                    </div>
                    
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span style={{
                        fontWeight: match.winner === match.player1 ? "700" : "500",
                        color: match.winner === match.player1 ? "#059669" : "#1F2937"
                      }}>
                        {match.player1}
                      </span>
                      <span style={{ color: "#6B7280" }}>ضد</span>
                      <span style={{
                        fontWeight: match.winner === match.player2 ? "700" : "500",
                        color: match.winner === match.player2 ? "#059669" : "#1F2937"
                      }}>
                        {match.player2}
                      </span>
                    </div>
                    
                    <div style={{ fontWeight: "600", color: "#059669" }}>
                      الفائز: {match.winner}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
          🏆 {tournament?.name || "البطولة"}
        </h1>
        
        {/* Round Navigation */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          marginBottom: "1rem"
        }}>
          <button
            onClick={goToPreviousRound}
            disabled={viewingRound <= 1}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: viewingRound <= 1 ? "#F3F4F6" : "#A2AF9B",
              color: viewingRound <= 1 ? "#9CA3AF" : "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: viewingRound <= 1 ? "not-allowed" : "pointer",
              transition: "all 0.2s ease"
            }}
          >
            ← السابقة
          </button>
          
          <div style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: isViewingCurrentRound ? "#A2AF9B" : "#F3F4F6",
            color: isViewingCurrentRound ? "#FFFFFF" : "#1F2937",
            borderRadius: "12px",
            fontSize: "1.1rem",
            fontWeight: "700",
            border: `2px solid ${isViewingCurrentRound ? '#A2AF9B' : '#E5E7EB'}`
          }}>
            {getRoundTitle(viewingRound)}
            {!isViewingCurrentRound && (
              <span style={{ 
                fontSize: "0.75rem", 
                marginRight: "0.5rem",
                opacity: 0.8
              }}>
                (منتهية)
              </span>
            )}
          </div>
          
          <button
            onClick={goToNextRound}
            disabled={viewingRound >= currentRound}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: viewingRound >= currentRound ? "#F3F4F6" : "#A2AF9B",
              color: viewingRound >= currentRound ? "#9CA3AF" : "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: viewingRound >= currentRound ? "not-allowed" : "pointer",
              transition: "all 0.2s ease"
            }}
          >
            التالية →
          </button>
        </div>

        {/* Quick Actions for Historical Rounds */}
        {!isViewingCurrentRound && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            marginBottom: "1rem"
          }}>
            <button
              onClick={goToCurrentRound}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#3B82F6",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              🏃 الذهاب للجولة الحالية
            </button>
            
            <button
              onClick={() => regenerateFromRound(viewingRound)}
              disabled={isLoading}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#F59E0B",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: "600",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
                transition: "all 0.2s ease"
              }}
            >
              🔄 إعادة توليد من هنا
            </button>
          </div>
        )}

        {/* Cancel Last Round Button */}
        {isViewingCurrentRound && currentRound > 1 && (
          <div style={{
            marginBottom: "1rem"
          }}>
            <button
              onClick={cancelLastRound}
              disabled={isLoading}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#EF4444",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: "600",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
                transition: "all 0.2s ease"
              }}
            >
              🗑️ إلغاء الجولة الأخيرة
            </button>
          </div>
        )}
        
        <p style={{ 
          fontSize: "1.1rem", 
          color: "#6B7280", 
          margin: "0 0 1rem 0",
          fontWeight: "400"
        }}>
          {isViewingCurrentRound ? "نظام الإقصاء المباشر" : "جولة منتهية - يمكن التعديل"}
        </p>
        
                 {/* Round Progress */}
         {isViewingCurrentRound && (
           <div style={{
             display: "flex",
             alignItems: "center",
             justifyContent: "center",
             gap: "1rem",
             padding: "1rem",
             backgroundColor: "#F0F9FF",
             borderRadius: "12px",
             border: "1px solid #BAE6FD"
           }}>
             <span style={{ color: "#0369A1", fontWeight: "600" }}>
               المباريات المكتملة: {getDisplayMatches().filter(m => m && m.isCompleted).length} / {getDisplayMatches().length}
             </span>
             <div style={{
               width: "200px",
               height: "8px",
               backgroundColor: "#E0F2FE",
               borderRadius: "4px",
               overflow: "hidden"
             }}>
               <div style={{
                 width: `${getDisplayMatches().length > 0 ? (getDisplayMatches().filter(m => m && m.isCompleted).length / getDisplayMatches().length) * 100 : 0}%`,
                 height: "100%",
                 backgroundColor: "#0EA5E9",
                 borderRadius: "4px",
                 transition: "width 0.3s ease"
               }}></div>
             </div>
           </div>
         )}

         {/* Player Swap Section */}
         {isViewingCurrentRound && (
           <div style={{ marginTop: "1rem" }}>
             <button
               onClick={() => setShowSwapSection(!showSwapSection)}
               style={{
                 padding: "0.5rem 1rem",
                 backgroundColor: showSwapSection ? "#EF4444" : "#A2AF9B",
                 color: "#FFFFFF",
                 border: "none",
                 borderRadius: "8px",
                 fontSize: "0.875rem",
                 fontWeight: "600",
                 cursor: "pointer",
                 transition: "all 0.2s ease",
                 display: "flex",
                 alignItems: "center",
                 gap: "0.5rem",
                 margin: "0 auto"
               }}
             >
               <span>{showSwapSection ? "🔄" : "⚡"}</span>
               <span>{showSwapSection ? "إلغاء التبديل" : "تبديل اللاعبين"}</span>
             </button>

             {showSwapSection && (
               <div style={{
                 marginTop: "1rem",
                 padding: "1.5rem",
                 backgroundColor: "#FEF3C7",
                 border: "2px solid #FBBF24",
                 borderRadius: "12px"
               }}>
                 <h4 style={{
                   fontSize: "1.1rem",
                   fontWeight: "600",
                   color: "#92400E",
                   margin: "0 0 1rem 0",
                   textAlign: "center"
                 }}>
                   🔄 تبديل مكان اللاعبين
                 </h4>

                 <div style={{
                   display: "grid",
                   gridTemplateColumns: "1fr 1fr auto",
                   gap: "1rem",
                   alignItems: "end"
                 }}>
                   {/* Player 1 Selector */}
                   <div>
                     <label style={{
                       display: "block",
                       fontSize: "0.875rem",
                       fontWeight: "600",
                       color: "#92400E",
                       marginBottom: "0.5rem"
                     }}>
                       اللاعب الأول:
                     </label>
                     <select
                       value={selectedPlayer1}
                       onChange={(e) => setSelectedPlayer1(e.target.value)}
                       style={{
                         width: "100%",
                         padding: "0.75rem",
                         border: "2px solid #FBBF24",
                         borderRadius: "8px",
                         fontSize: "1rem",
                         backgroundColor: "#FFFFFF",
                         color: "#1F2937"
                       }}
                     >
                       <option value="">-- اختر اللاعب الأول --</option>
                       {getAllCurrentRoundPlayers().map((player, idx) => (
                         <option key={idx} value={player.name}>
                           {player.name}
                         </option>
                       ))}
                     </select>
                   </div>

                   {/* Player 2 Selector */}
                   <div>
                     <label style={{
                       display: "block",
                       fontSize: "0.875rem",
                       fontWeight: "600",
                       color: "#92400E",
                       marginBottom: "0.5rem"
                     }}>
                       اللاعب الثاني:
                     </label>
                     <select
                       value={selectedPlayer2}
                       onChange={(e) => setSelectedPlayer2(e.target.value)}
                       style={{
                         width: "100%",
                         padding: "0.75rem",
                         border: "2px solid #FBBF24",
                         borderRadius: "8px",
                         fontSize: "1rem",
                         backgroundColor: "#FFFFFF",
                         color: "#1F2937"
                       }}
                     >
                       <option value="">-- اختر اللاعب الثاني --</option>
                       {getAllCurrentRoundPlayers()
                         .filter(p => p.name !== selectedPlayer1)
                         .map((player, idx) => (
                           <option key={idx} value={player.name}>
                             {player.name}
                           </option>
                         ))}
                     </select>
                   </div>

                   {/* Swap Button */}
                   <button
                     onClick={executePlayerSwap}
                     disabled={!selectedPlayer1 || !selectedPlayer2 || selectedPlayer1 === selectedPlayer2 || isLoading}
                     style={{
                       padding: "0.75rem 1.5rem",
                       backgroundColor: (!selectedPlayer1 || !selectedPlayer2 || selectedPlayer1 === selectedPlayer2 || isLoading) 
                         ? "#9CA3AF" 
                         : "#10B981",
                       color: "#FFFFFF",
                       border: "none",
                       borderRadius: "8px",
                       fontSize: "1rem",
                       fontWeight: "600",
                       cursor: (!selectedPlayer1 || !selectedPlayer2 || selectedPlayer1 === selectedPlayer2 || isLoading) 
                         ? "not-allowed" 
                         : "pointer",
                       transition: "all 0.2s ease",
                       minWidth: "120px"
                     }}
                   >
                     {isLoading ? "جاري التبديل..." : "تبديل"}
                   </button>
                 </div>

                 {selectedPlayer1 && selectedPlayer2 && selectedPlayer1 !== selectedPlayer2 && (
                   <div style={{
                     marginTop: "1rem",
                     padding: "0.75rem",
                     backgroundColor: "rgba(59, 130, 246, 0.1)",
                     border: "1px solid #3B82F6",
                     borderRadius: "8px",
                     fontSize: "0.875rem",
                     color: "#1E40AF",
                     textAlign: "center"
                   }}>
                     <strong>معاينة:</strong> سيتم تبديل <strong>{selectedPlayer1}</strong> مع <strong>{selectedPlayer2}</strong>
                   </div>
                 )}
               </div>
             )}
           </div>
         )}
      </div>

      {/* Current Round Matches */}
      {(() => {
        const displayMatches = getDisplayMatches();
        return displayMatches && displayMatches.length > 0 && (
          <div style={{
            backgroundColor: "#FFFFFF",
            padding: "2rem",
            borderRadius: "16px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
            marginBottom: "2rem"
          }}>
            <h3 style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: "#1F2937",
              margin: "0 0 2rem 0",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem"
            }}>
              <span style={{ fontSize: "1.5rem" }}>⚔️</span>
              {getRoundTitle(viewingRound)}
              {!isViewingCurrentRound && (
                <span style={{
                  fontSize: "0.875rem",
                  backgroundColor: "#F3F4F6",
                  color: "#6B7280",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "12px",
                  fontWeight: "500"
                }}>
                  يمكن التعديل
                </span>
              )}
            </h3>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "2rem"
            }}>
              {displayMatches.map((match, matchIdx) => {
                if (!match) return null;
                
                return (
                  <div key={matchIdx} style={{
                    backgroundColor: match.isCompleted ? "#D1FAE5" : "#FFFFFF",
                    border: `3px solid ${match.isCompleted ? '#10B981' : '#E5E7EB'}`,
                    borderRadius: "16px",
                    padding: "0",
                    position: "relative",
                    transition: "all 0.3s ease",
                    transform: match.isCompleted ? "scale(1.02)" : "scale(1)",
                    boxShadow: match.isCompleted 
                      ? "0 8px 25px rgba(16, 185, 129, 0.2)" 
                      : "0 4px 15px rgba(0, 0, 0, 0.1)",
                    overflow: "hidden"
                  }}>
                    
                    {/* Header */}
                    <div style={{
                      backgroundColor: match.isCompleted ? "#10B981" : "#F3F4F6",
                      padding: "1rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: `2px solid ${match.isCompleted ? 'rgba(255,255,255,0.2)' : '#E5E7EB'}`
                    }}>
                      <div style={{
                        color: match.isCompleted ? "#FFFFFF" : "#6B7280",
                        fontSize: "1rem",
                        fontWeight: "600"
                      }}>
                        مباراة {matchIdx + 1}
                      </div>
                      
                      {match.isCompleted && isViewingCurrentRound && (
                        <button
                          onClick={(e) => handleResetMatch(matchIdx, e)}
                          style={{ 
                            backgroundColor: "rgba(255,255,255,0.2)", 
                            border: "none", 
                            color: "#FFFFFF", 
                            borderRadius: "8px",
                            fontSize: "0.75rem",
                            padding: "0.5rem 0.75rem",
                            cursor: "pointer",
                            fontWeight: "600",
                            transition: "all 0.2s ease"
                          }}
                        >
                          🔄 إعادة
                        </button>
                      )}
                    </div>

                    {/* Winner Badge */}
                    {match.isCompleted && (
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
                        🏆 فائز
                      </div>
                    )}

                    {/* Players */}
                    <div style={{ padding: "1.5rem" }}>
                      {[{key: "player1", player: match.player1}, {key: "player2", player: match.player2}].map((item, i) => {
                        const isWinner = match.winner === item.player;
                        const canClick = item.player && (isViewingCurrentRound ? !match.isCompleted : true);
                        
                        return (
                          <div
                            key={item.key}
                            onClick={(e) => {
                              if (canClick) {
                                if (isViewingCurrentRound) {
                                  handleSelectWinner(matchIdx, item.player, e);
                                } else {
                                  editHistoricalMatch(viewingRound, matchIdx, item.player);
                                }
                              }
                            }}
                            style={{
                              backgroundColor: isWinner 
                                ? "#A2AF9B" 
                                : canClick 
                                  ? "#F9FAFB" 
                                  : "#F3F4F6",
                              color: isWinner 
                                ? "white" 
                                : "#1F2937",
                              padding: "1.25rem",
                              marginBottom: i === 0 ? "1rem" : "0",
                              borderRadius: "12px",
                              cursor: canClick ? "pointer" : "default",
                              border: isWinner 
                                ? "2px solid rgba(255, 255, 255, 0.3)" 
                                : "2px solid #E5E7EB",
                              transition: "all 0.3s ease",
                              fontSize: "1rem",
                              fontWeight: isWinner ? "700" : "500",
                              textAlign: "center",
                              boxShadow: isWinner 
                                ? "0 4px 15px rgba(162, 175, 155, 0.3)" 
                                : "0 2px 8px rgba(0, 0, 0, 0.05)",
                              minHeight: "60px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              userSelect: "none"
                            }}
                            onMouseEnter={(e) => {
                              if (canClick) {
                                e.currentTarget.style.backgroundColor = "#F3F4F6";
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(162, 175, 155, 0.15)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (canClick) {
                                e.currentTarget.style.backgroundColor = "#F9FAFB";
                                e.currentTarget.style.transform = "translateY(0px)";
                                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.05)";
                              }
                            }}
                          >
                            {item.player ? (
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
                                <span style={{ fontSize: "1.5rem" }}>
                                  {isWinner ? "🏆" : canClick ? (isViewingCurrentRound ? "⚡" : "✏️") : "👤"}
                                </span>
                                <span>{item.player}</span>
                              </div>
                            ) : (
                              <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>
                                في انتظار المتأهل
                              </span>
                            )}
                          </div>
                        );
                      })}

                      {/* Auto Qualification */}
                      {isViewingCurrentRound && match.player1 && !match.player2 && !match.isCompleted && (
                        <div style={{ marginTop: "1rem" }}>
                          {(() => {
                            const autoQualifiedPlayers = getAutoQualifiedPlayers();
                            const hasAutoQualifiedBefore = autoQualifiedPlayers.has(match.player1);
                            
                            return (
                              <>
                                {hasAutoQualifiedBefore && (
                                  <div style={{
                                    padding: "0.75rem",
                                    backgroundColor: "#FEF3C7",
                                    border: "1px solid #FBBF24",
                                    borderRadius: "8px",
                                    fontSize: "0.75rem",
                                    color: "#92400E",
                                    textAlign: "center",
                                    marginBottom: "0.75rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.5rem"
                                  }}>
                                    <span>⚠️</span>
                                    <span>هذا اللاعب تأهل تلقائياً من قبل</span>
                                  </div>
                                )}
                                
                                <button
                                  onClick={(e) => handleSelectWinner(matchIdx, match.player1, e)}
                                  style={{ 
                                    padding: "1rem 2rem", 
                                    background: hasAutoQualifiedBefore 
                                      ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
                                      : "linear-gradient(135deg, #A2AF9B 0%, #8FA288 100%)", 
                                    border: "none", 
                                    color: "white", 
                                    borderRadius: "12px", 
                                    fontSize: "1rem", 
                                    cursor: "pointer", 
                                    display: "block", 
                                    margin: "0 auto",
                                    fontWeight: "600",
                                    transition: "all 0.2s ease",
                                    boxShadow: hasAutoQualifiedBefore
                                      ? "0 4px 15px rgba(245, 158, 11, 0.3)"
                                      : "0 4px 15px rgba(162, 175, 155, 0.3)"
                                  }}
                                >
                                  {hasAutoQualifiedBefore ? "⚠️ تأهل تلقائي مكرر" : "✅ تأهل تلقائي"}
                                </button>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Winners Display */}
      {roundWinners.length > 0 && (
        <div style={{
          backgroundColor: "#FFFFFF",
          padding: "2rem",
          borderRadius: "16px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
          marginBottom: "2rem"
        }}>
          <h3 style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            color: "#1F2937",
            margin: "0 0 1.5rem 0",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
          }}>
            <span style={{ fontSize: "1.5rem" }}>🏆</span>
            فائزو {getRoundTitle(viewingRound)} ({roundWinners.length})
          </h3>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem"
          }}>
            {roundWinners.map((winner, idx) => {(() => {
  const isAutoQualifiedSet = getAutoQualifiedPlayers();

  return roundWinners.map((winner, idx) => {
    // هل أخذ BYE في الجولة المعروضة الآن؟ (مهم للجولة الأولى)
    const isAutoQualifiedThisViewingRound = getDisplayMatches().some((m) => {
      if (!m?.isCompleted) return false;
      const p1 = m?.player1?.toString().trim();
      const p2 = m?.player2?.toString().trim();
      return (
        (winner === p1 && isEmptySlot(p2)) ||
        (winner === p2 && isEmptySlot(p1))
      );
    });

    // إما أخذ BYE سابقًا من الـ history أو في الجولة الحالية
    const showAsAutoQualified =
      isAutoQualifiedSet.has(winner) || isAutoQualifiedThisViewingRound;

    return (
      <div
        key={idx}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "1rem",
          backgroundColor: "#F0FDF4",
          border: "2px solid #BBF7D0",
          borderRadius: "12px",
          transition: "all 0.2s ease",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            backgroundColor: "#10B981",
            color: "#FFFFFF",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.2rem",
            fontWeight: "700",
          }}
        >
          {idx + 1}
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: "600",
              color: "#065F46",
              fontSize: "1rem",
              marginBottom: "0.25rem",
            }}
          >
            {winner}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "#047857",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {showAsAutoQualified ? (
              <>
                <span>✅</span>
                <span>تأهل تلقائي</span>
              </>
            ) : (
              <>
                <span>⚔️</span>
                <span>فوز مباشر</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  });
})()}
)}
          </div>

          {/* Auto-qualification warning */}
          {roundWinners.length > 1 && (() => {
            const autoQualifiedPlayers = getAutoQualifiedPlayers();
            const autoQualifiedWinners = roundWinners.filter(winner => autoQualifiedPlayers.has(winner));
            const allAutoQualified = autoQualifiedWinners.length === roundWinners.length;
            
            if (autoQualifiedWinners.length > 0 && !allAutoQualified) {
              return (
                <div style={{
                  marginTop: "1.5rem",
                  padding: "1rem",
                  backgroundColor: "#FEF3C7",
                  border: "2px solid #FBBF24",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem"
                }}>
                  <span style={{ fontSize: "1.25rem" }}>⚠️</span>
                  <div style={{ fontSize: "0.875rem", color: "#92400E" }}>
                    <strong>تنبيه:</strong> اللاعبون الذين تأهلوا تلقائياً من قبل ({autoQualifiedWinners.join(", ")}) 
                    يجب أن يلعبوا ضد خصوم في الجولة التالية.
                  </div>
                </div>
              );
            }
            
            if (allAutoQualified && autoQualifiedWinners.length > 1) {
              return (
                <div style={{
                  marginTop: "1.5rem",
                  padding: "1rem",
                  backgroundColor: "#DBEAFE",
                  border: "2px solid #3B82F6",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem"
                }}>
                  <span style={{ fontSize: "1.25rem" }}>ℹ️</span>
                  <div style={{ fontSize: "0.875rem", color: "#1E40AF" }}>
                    جميع الفائزين قد تأهلوا تلقائياً من قبل، لذلك يُسمح بالتأهل التلقائي في الجولة التالية إذا لزم الأمر.
                  </div>
                </div>
              );
            }
            
            return null;
          })()}
        </div>
      )}

      {/* Next Round Button */}
      {isViewingCurrentRound && isRoundCompleted && roundWinners.length > 1 && (
        <div style={{
          backgroundColor: "#FFFFFF",
          padding: "2rem",
          borderRadius: "16px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
          textAlign: "center",
          marginBottom: "2rem"
        }}>
          <div style={{
            marginBottom: "1.5rem"
          }}>
            <h4 style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#1F2937",
              margin: "0 0 0.5rem 0"
            }}>
              🎉 اكتملت الجولة!
            </h4>
            <p style={{
              color: "#6B7280",
              fontSize: "1rem",
              margin: 0
            }}>
              المتأهلون ({roundWinners.length}): {roundWinners.join(" - ")}
            </p>
          </div>

          <button
            onClick={startNextRoundDraw}
            disabled={isAnimating}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "1.25rem 2.5rem",
              background: "linear-gradient(135deg, #A2AF9B 0%, #8FA288 100%)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "16px",
              fontSize: "1.1rem",
              fontWeight: "700",
              cursor: isAnimating ? "not-allowed" : "pointer",
              margin: "0 auto",
              boxShadow: "0 8px 25px rgba(162, 175, 155, 0.3)",
              transition: "all 0.3s ease",
              opacity: isAnimating ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!isAnimating) {
                e.currentTarget.style.transform = "translateY(-3px) scale(1.05)";
                e.currentTarget.style.boxShadow = "0 12px 30px rgba(162, 175, 155, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isAnimating) {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(162, 175, 155, 0.3)";
              }
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>🎲</span>
            <span>{isAnimating ? "جاري إنشاء الجولة..." : "إنشاء الجولة التالية"}</span>
          </button>
        </div>
      )}

      {/* Champion Declaration */}
      {isViewingCurrentRound && isRoundCompleted && roundWinners.length === 1 && (
        <div style={{
          backgroundColor: "#FFFFFF",
          padding: "3rem 2rem",
          borderRadius: "20px",
          border: "3px solid #F59E0B",
          boxShadow: "0 10px 30px rgba(245, 158, 11, 0.2)",
          textAlign: "center",
          background: "linear-gradient(135deg, #FFFFFF 0%, #FEF3C7 100%)",
          marginBottom: "2rem"
        }}>
          <div style={{
            fontSize: "4rem",
            marginBottom: "1rem",
            animation: "bounce 2s infinite"
          }}>
            🏆
          </div>
          <h2 style={{
            fontSize: "2rem",
            fontWeight: "700",
            color: "#D97706",
            margin: "0 0 1rem 0"
          }}>
            مبروك البطولة!
          </h2>
          <div style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            color: "#92400E",
            marginBottom: "2rem"
          }}>
            {roundWinners[0]}
          </div>
          
          <button
            onClick={() => saveFinalResults(roundWinners[0])}
            disabled={isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "1.25rem 2.5rem",
              background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "16px",
              fontSize: "1.1rem",
              fontWeight: "700",
              cursor: isLoading ? "not-allowed" : "pointer",
              margin: "0 auto",
              boxShadow: "0 8px 25px rgba(245, 158, 11, 0.3)",
              transition: "all 0.3s ease",
              opacity: isLoading ? 0.7 : 1
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
                <span style={{ fontSize: "1.3rem" }}>👑</span>
                <span>إعلان البطل وحفظ النتائج</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Save Progress Button */}
      {isViewingCurrentRound && (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <button
            onClick={() => saveFinalResults()}
            disabled={isLoading}
            style={{ 
              padding: "1rem 2rem", 
              background: isLoading 
                ? "linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)"
                : "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", 
              color: "white", 
              borderRadius: "12px", 
              fontSize: "1rem", 
              fontWeight: "600", 
              border: "none", 
              cursor: isLoading ? "not-allowed" : "pointer", 
              boxShadow: "0 6px 20px rgba(99, 102, 241, 0.3)",
              transition: "all 0.3s ease",
              opacity: isLoading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              margin: "0 auto"
            }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid #FFFFFF",
                  borderTop: "2px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }}></div>
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: "1.1rem" }}>💾</span>
                <span>حفظ التقدم</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* New Round Animation Modal */}
      {showNewRoundModal && (
        <div style={{
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
          backdropFilter: "blur(3px)"
        }}>
          <div style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "20px",
            padding: "3rem",
            maxWidth: "600px",
            width: "90%",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
            border: "3px solid #A2AF9B",
            textAlign: "center"
          }}>
            <div style={{
              fontSize: "3rem",
              marginBottom: "1rem"
            }}>
              🎲
            </div>
            <h3 style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#1F2937",
              margin: "0 0 1rem 0"
            }}>
              قرعة {getRoundTitle(currentRound + 1)}
            </h3>
            <p style={{
              color: "#6B7280",
              fontSize: "1rem",
              marginBottom: "2rem"
            }}>
              جاري سحب المتأهلين لتكوين مباريات الجولة التالية...
            </p>

            {/* Animated Matches */}
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
                    padding: "1rem",
                    backgroundColor: currentAnimatingMatch === idx ? "#FEF3C7" : match.isFinished ? "#D1FAE5" : "#F9FAFB",
                    border: `2px solid ${currentAnimatingMatch === idx ? "#F59E0B" : match.isFinished ? "#10B981" : "#E5E7EB"}`,
                    borderRadius: "12px",
                    transition: "all 0.3s ease"
                  }}
                >
                  <div style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: currentAnimatingMatch === idx ? "#F59E0B" : match.isFinished ? "#10B981" : "#A2AF9B",
                    color: "#FFFFFF",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.875rem",
                    fontWeight: "600"
                  }}>
                    {match.isFinished ? "✅" : currentAnimatingMatch === idx ? "🎲" : idx + 1}
                  </div>
                  
                  <div style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem"
                  }}>
                    <div style={{
                      flex: 1,
                      fontWeight: "600",
                      color: "#1F2937",
                      textAlign: "center"
                    }}>
                      {match.player1}
                    </div>
                    <span style={{ color: "#6B7280" }}>ضد</span>
                    <div style={{
                      flex: 1,
                      fontWeight: "600",
                      color: "#1F2937",
                      textAlign: "center"
                    }}>
                      {match.player2}
                    </div>
                  </div>
                </div>
              ))}
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
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0,0,0);
          }
          40%, 43% {
            transform: translate3d(0, -30px, 0);
          }
          70% {
            transform: translate3d(0, -15px, 0);
          }
          90% {
            transform: translate3d(0, -4px, 0);
          }
        }
      `}</style>
    </div>
  );
}