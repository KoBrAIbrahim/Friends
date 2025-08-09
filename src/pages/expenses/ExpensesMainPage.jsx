/* eslint-disable no-undef */
// src/pages/expenses/ExpensesMainPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../services/firebase";

/* ============ Helpers ============ */
// تحويل تاريخ JS إلى yyyy-mm-dd محلي بدون UTC
const toYMDLocal = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
// Timestamp -> yyyy-mm-dd محلي
const tsToYMDLocal = (ts) => {
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return toYMDLocal(d);
};
// تنسيق عرض عربي للتواريخ
const fmtDatePretty = (val) => {
  const d = val?.toDate ? val.toDate() : new Date(val);
  return d.toLocaleDateString("ar-EG", { year: "numeric", month: "2-digit", day: "2-digit" });
};

export default function ExpensesMainPage() {
  /* ============ Add form ============ */
  const [date, setDate] = useState(() => toYMDLocal(new Date()));
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  /* ============ List ============ */
  const [expenses, setExpenses] = useState([]);

  /* ============ Filter ============ */
  const [filter, setFilter] = useState("today"); // today | week | month | custom
  const [fromDate, setFromDate] = useState(() => toYMDLocal(new Date()));
  const [toDate, setToDate] = useState(() => toYMDLocal(new Date()));

  /* ============ Edit modal ============ */
  const [editing, setEditing] = useState(null); // {id, date(TS), note, amount}
  const [editDate, setEditDate] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editAmount, setEditAmount] = useState("");

  /* ============ Realtime subscription ============ */
  useEffect(() => {
    const q = query(collection(db, "expenses"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setExpenses(rows);
    });
    return () => unsub();
  }, []);

  const handleAdd = async () => {
    if (!date || !amount) return alert("الرجاء إدخال التاريخ والسعر");
    const value = Number(amount);
    if (!value || value <= 0) return alert("الرجاء إدخال سعر صالح");
    setLoading(true);
    try {
      const ts = Timestamp.fromDate(new Date(`${date}T00:00:00`));
      await addDoc(collection(db, "expenses"), {
        date: ts,
        note: note?.trim() || "",
        amount: value,
        created_at: Timestamp.now(),
      });
      setNote("");
      setAmount("");
    } catch (e) {
      console.error(e);
      alert("تعذّر إضافة المصروف");
    } finally {
      setLoading(false);
    }
  };

  /* ============ Client-side filtering ============ */
  const filteredExpenses = useMemo(() => {
    if (!expenses?.length) return [];
    const now = new Date();
    let start = null;
    let end = null;

    if (filter === "today") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else if (filter === "week") {
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    } else if (filter === "month") {
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    } else if (filter === "custom" && fromDate && toDate) {
      start = new Date(`${fromDate}T00:00:00`);
      end = new Date(`${toDate}T23:59:59`);
    }

    return expenses.filter((e) => {
      const d = e.date?.toDate ? e.date.toDate() : new Date(e.date);
      if (!start || !end) return true;
      return d >= start && d <= end;
    });
  }, [expenses, filter, fromDate, toDate]);

  const total = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [filteredExpenses]
  );

  /* ============ Actions ============ */
  const handleDelete = async (id) => {
    if (!window.confirm("هل تريد حذف هذا المصروف؟")) return;
    try {
      await deleteDoc(doc(db, "expenses", id));
    } catch (e) {
      console.error(e);
      alert("تعذّر الحذف");
    }
  };

  const openEdit = (row) => {
    setEditing(row);
    setEditDate(tsToYMDLocal(row.date)); // اليوم نفسه بالضبط
    setEditNote(row.note || "");
    setEditAmount(String(row.amount ?? ""));
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!editDate || !editAmount) return alert("أدخل التاريخ والسعر");
    const value = Number(editAmount);
    if (!value || value <= 0) return alert("سعر غير صالح");
    try {
      await updateDoc(doc(db, "expenses", editing.id), {
        date: Timestamp.fromDate(new Date(`${editDate}T00:00:00`)),
        note: editNote?.trim() || "",
        amount: value,
      });
      setEditing(null);
    } catch (e) {
      console.error(e);
      alert("تعذّر الحفظ");
    }
  };

  /* ============ UI ============ */
  return (
    <div style={{ padding: "2rem", backgroundColor: "#F8F9FA", minHeight: "100vh" }}>
      {/* Header */}
      <div style={cardHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={iconBox}>💸</div>
          <div>
            <h1 style={title}>المصاريف</h1>
            <p style={subtitle}>إدارة وتتبع المصاريف اليومية</p>
          </div>
        </div>
      </div>

      {/* Controls + Add */}
      <div style={cardBody}>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "space-between" }}>
          {/* Filter */}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={input}
            >
              <option value="today">اليوم</option>
              <option value="week">آخر 7 أيام</option>
              <option value="month">آخر 30 يوم</option>
              <option value="custom">تاريخ مخصص</option>
            </select>

            {filter === "custom" && (
              <>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  style={input}
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  style={input}
                />
                {/* شارة تُظهر النطاق المختار */}
                <span style={rangePill}>
                  من {new Date(`${fromDate}T00:00:00`).toLocaleDateString("ar-EG")} — إلى{" "}
                  {new Date(`${toDate}T00:00:00`).toLocaleDateString("ar-EG")}
                </span>
              </>
            )}
          </div>

          {/* Add form */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={input} />
            <input
              type="text"
              placeholder="ملاحظات"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ ...input, minWidth: 220 }}
            />
            <input
              type="number"
              inputMode="decimal"
              placeholder="السعر"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ ...input, width: 140 }}
            />
            <button onClick={handleAdd} disabled={loading} style={btnPrimary}>
              {loading ? "جاري الإضافة..." : "➕ إضافة مصروف"}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "#FFFFFF", padding: "1rem", border: "1px solid #E5E7EB", borderRadius: "12px" }}>
        {filteredExpenses.length === 0 ? (
          <p style={{ color: "#6B7280", margin: 0 }}>لا توجد بيانات ضمن الفلتر المحدد.</p>
        ) : (
          <>
            <div style={tableWrap}>
              <table style={tableBase}>
                <thead>
                  <tr>
                    <th style={th}>التاريخ</th>
                    <th style={th}>الملاحظة</th>
                    <th style={th}>السعر</th>
                    <th style={{ ...th, width: 180, textAlign: "center" }}>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((row, i) => (
                    <tr
                      key={row.id}
                      style={{ ...rowStyle, backgroundColor: i % 2 ? "#FCFCFC" : "#FFFFFF" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAFAFA")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = i % 2 ? "#FCFCFC" : "#FFFFFF")}
                    >
                      <td style={td}>{fmtDatePretty(row.date)}</td>
                      <td style={td}>{row.note || "-"}</td>
                      <td style={{ ...td, fontWeight: 700 }}>{Number(row.amount).toLocaleString("ar-EG")}</td>
                      <td style={{ ...td, textAlign: "center" }}>
                        <button onClick={() => openEdit(row)} style={btnPrimarySmall}>✏️ تعديل</button>
                        <button onClick={() => handleDelete(row.id)} style={btnDanger}>🗑️ حذف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", fontWeight: 700, color: "#111827" }}>
              المجموع: {total.toLocaleString("ar-EG")}
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div
          onClick={() => setEditing(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "95%",
              maxWidth: 520,
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #E5E7EB",
              boxShadow: "0 20px 50px rgba(0,0,0,.2)",
              padding: "1.5rem",
              direction: "rtl",
              animation: "fadeIn .15s ease-out",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "1rem", color: "#111827" }}>تعديل المصروف</h3>

            <div style={{ display: "grid", gap: ".75rem" }}>
              <label style={labelStyle}>التاريخ</label>
              <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={input} />

              <label style={labelStyle}>الملاحظة</label>
              <input type="text" value={editNote} onChange={(e) => setEditNote(e.target.value)} style={input} placeholder="اختياري" />

              <label style={labelStyle}>السعر</label>
              <input type="number" inputMode="decimal" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} style={input} />
            </div>

            <div style={{ display: "flex", gap: ".5rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
              <button onClick={() => setEditing(null)} style={btnGhost}>إلغاء</button>
              <button onClick={saveEdit} style={btnPrimary}>حفظ</button>
            </div>
          </div>

          <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
      )}
    </div>
  );
}

/* ============ Styles ============ */
const cardHeader = {
  backgroundColor: "#FFFFFF",
  padding: "2rem",
  marginBottom: "2rem",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};
const cardBody = {
  backgroundColor: "#FFFFFF",
  padding: "1rem",
  marginBottom: "1rem",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
};
const iconBox = {
  width: "48px",
  height: "48px",
  backgroundColor: "#FFE4E6",
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1.5rem",
};
const title = { fontSize: "1.5rem", fontWeight: 600, color: "#1F2937", margin: 0 };
const subtitle = { fontSize: ".875rem", color: "#6B7280", margin: 0 };
const input = { padding: ".6rem .75rem", borderRadius: "8px", border: "1px solid #D1D5DB", outline: "none", background: "#fff" };

const rangePill = {
  padding: ".4rem .6rem",
  borderRadius: "999px",
  background: "#F3F4F6",
  border: "1px solid #E5E7EB",
  fontSize: ".8rem",
  color: "#374151",
  whiteSpace: "nowrap",
};

const tableWrap = {
  overflow: "hidden",
  borderRadius: "12px",
  border: "1px solid #E5E7EB",
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
};
const tableBase = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  direction: "rtl",
  backgroundColor: "#fff",
};
const th = {
  textAlign: "right",
  padding: "0.9rem 1rem",
  fontSize: ".9rem",
  color: "#111827",
  backgroundColor: "#F3F4F6",
  borderBottom: "1px solid #E5E7EB",
  fontWeight: 700,
};
const td = {
  textAlign: "right",
  padding: "0.9rem 1rem",
  fontSize: ".9rem",
  color: "#374151",
  borderBottom: "1px solid #F3F4F6",
};
const rowStyle = { transition: "background .15s ease" };

const btnPrimary = {
  padding: ".6rem 1rem",
  backgroundColor: "#A2AF9B",
  color: "#fff",
  border: "1px solid #A2AF9B",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600,
};
const btnPrimarySmall = {
  padding: ".45rem .8rem",
  backgroundColor: "#A2AF9B",
  color: "#fff",
  border: "1px solid #A2AF9B",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600,
  marginInlineStart: ".25rem",
};
const btnDanger = {
  padding: ".45rem .8rem",
  backgroundColor: "#EF4444",
  color: "#fff",
  border: "1px solid #EF4444",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600,
  marginInlineStart: ".25rem",
};
const btnGhost = {
  padding: ".45rem .8rem",
  backgroundColor: "#F9FAFB",
  color: "#374151",
  border: "1px solid #E5E7EB",
  borderRadius: "8px",
  cursor: "pointer",
};
