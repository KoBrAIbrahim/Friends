import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import tableImage from "../../assets/table.png";
import { query, orderBy } from "firebase/firestore";

export default function EditTablePage() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [newPrice, setNewPrice] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tableToDelete, setTableToDelete] = useState(null);
  
  // New table form data
  const [newTableData, setNewTableData] = useState({
    table_number: "",
    price_per_hour: "",
    status: "active"
  });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    const q = query(collection(db, "peli_tables"), orderBy("table_number"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setTables(data);
  };

  const handleSave = async () => {
    if (!selectedTable) return;
    await updateDoc(doc(db, "peli_tables", selectedTable.id), {
      price_per_hour: parseFloat(newPrice),
    });
    setSelectedTable(null);
    setNewPrice("");
    fetchTables();
  };

  const handleAddTable = async () => {
    if (!newTableData.table_number || !newTableData.price_per_hour) return;
    
    await addDoc(collection(db, "peli_tables"), {
      table_number: newTableData.table_number,
      price_per_hour: parseFloat(newTableData.price_per_hour),
      status: newTableData.status
    });
    
    setShowAddModal(false);
    setNewTableData({
      table_number: "",
      price_per_hour: "",
      status: "active"
    });
    fetchTables();
  };

  const handleDeleteTable = async () => {
    if (!tableToDelete) return;
    await deleteDoc(doc(db, "peli_tables", tableToDelete.id));
    setShowDeleteConfirm(false);
    setTableToDelete(null);
    fetchTables();
  };

  const totalTables = tables.length;
  const averagePrice = tables.length > 0 
    ? (tables.reduce((sum, table) => sum + (parseFloat(table.price_per_hour) || 0), 0) / tables.length).toFixed(2)
    : 0;
  const highestPrice = tables.length > 0 
    ? Math.max(...tables.map(table => parseFloat(table.price_per_hour) || 0)).toFixed(2)
    : 0;

  const containerStyle = {
    padding: "24px",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "'Inter', 'Cairo', system-ui, sans-serif",
    direction: 'rtl'
  };

  const headerStyle = {
    backgroundColor: "white",
    padding: "32px",
    borderRadius: "8px",
    marginBottom: "24px",
    border: "1px solid #e2e8f0",
    textAlign: "center"
  };

  const headerTitleStyle = {
    fontSize: "32px",
    fontWeight: "700",
    color: "#A2AF9B",
    margin: "0 0 8px 0"
  };

  const headerSubtitleStyle = {
    color: "#64748b",
    fontSize: "16px",
    margin: 0
  };

  const statsGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "24px"
  };

  const statCardStyle = {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "8px",
    textAlign: "center",
    border: "1px solid #e2e8f0"
  };

  const statIconStyle = {
    fontSize: "24px",
    marginBottom: "12px"
  };

  const statValueStyle = {
    fontSize: "32px",
    fontWeight: "700",
    marginBottom: "8px"
  };

  const statLabelStyle = {
    color: "#64748b",
    fontSize: "14px",
    margin: 0
  };

  const actionButtonsStyle = {
    display: "flex",
    justifyContent: "center",
    marginBottom: "24px"
  };

  const addTableButtonStyle = {
    backgroundColor: "#A2AF9B",
    color: "white",
    border: "none",
    padding: "16px 32px",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  };

  const instructionsCardStyle = {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "24px",
    border: "1px solid #e2e8f0",
    textAlign: "center"
  };

  const instructionsIconStyle = {
    fontSize: "20px",
    marginBottom: "8px"
  };

  const instructionsTextStyle = {
    margin: 0,
    color: "#A2AF9B",
    fontSize: "16px",
    fontWeight: "600"
  };

  const tablesGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "24px"
  };

  const tableCardStyle = {
    backgroundColor: "white",
    border: "2px solid #A2AF9B",
    borderRadius: "8px",
    padding: "24px",
    textAlign: "center",
    position: "relative",
    transition: "box-shadow 0.2s ease"
  };

  const tableImageContainerStyle = {
    backgroundColor: "#A2AF9B",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px"
  };

  const tableImageStyle = {
    width: "100%",
    height: "120px",
    objectFit: "contain"
  };

  const tableNumberStyle = {
    fontSize: "20px",
    fontWeight: "700",
    color: "#A2AF9B",
    margin: "0 0 12px 0"
  };

  const priceContainerStyle = {
    backgroundColor: "#f8fafc",
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    marginBottom: "16px"
  };

  const priceTextStyle = {
    fontSize: "16px",
    color: "#A2AF9B",
    margin: 0,
    fontWeight: "700"
  };

  const statusBadgeStyle = (status) => ({
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: status === "active" ? "#dcfce7" : "#fef2f2",
    color: status === "active" ? "#166534" : "#dc2626",
    marginBottom: "16px"
  });

  const tableActionsStyle = {
    display: "flex",
    gap: "8px",
    justifyContent: "center"
  };

  const editButtonStyle = {
    backgroundColor: "#A2AF9B",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  };

  const deleteButtonStyle = {
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  };

  const modalOverlayStyle = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  };

  const modalContentStyle = {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "32px",
    width: "90%",
    maxWidth: "450px",
    border: "1px solid #e2e8f0"
  };

  const modalHeaderStyle = {
    textAlign: "center",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "1px solid #e2e8f0"
  };

  const modalIconStyle = {
    fontSize: "32px",
    marginBottom: "8px"
  };

  const modalTitleStyle = {
    fontSize: "24px",
    fontWeight: "700",
    color: "#A2AF9B",
    margin: "0 0 8px 0"
  };

  const modalSubtitleStyle = {
    color: "#64748b",
    fontSize: "16px",
    margin: 0
  };

  const currentPriceDisplayStyle = {
    backgroundColor: "#f8fafc",
    padding: "16px",
    borderRadius: "6px",
    marginBottom: "24px",
    border: "1px solid #e2e8f0"
  };

  const currentPriceLabelStyle = {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "4px"
  };

  const currentPriceValueStyle = {
    fontSize: "20px",
    fontWeight: "700",
    color: "#A2AF9B"
  };

  const inputGroupStyle = {
    marginBottom: "24px"
  };

  const labelStyle = {
    display: "block",
    color: "#374151",
    fontWeight: "600",
    marginBottom: "8px"
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "16px",
    fontWeight: "600",
    textAlign: "center"
  };

  const selectStyle = {
    width: "100%",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "16px",
    fontWeight: "600",
    textAlign: "center",
    backgroundColor: "white"
  };

  const modalActionsStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px"
  };

  const cancelButtonStyle = {
    padding: "12px 24px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    backgroundColor: "white",
    color: "#374151",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer"
  };

  const saveButtonStyle = {
    padding: "12px 24px",
    backgroundColor: "#A2AF9B",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer"
  };

  const deleteConfirmButtonStyle = {
    padding: "12px 24px",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer"
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={headerTitleStyle}>
          إدارة الطاولات
        </h1>
        <p style={headerSubtitleStyle}>
          إضافة وتعديل وحذف الطاولات وإدارة معلوماتها
        </p>
      </div>

      {/* Statistics Cards */}
      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <div style={statIconStyle}>🎱</div>
          <div style={{...statValueStyle, color: "#A2AF9B"}}>
            {totalTables}
          </div>
          <p style={statLabelStyle}>إجمالي الطاولات</p>
        </div>
        
        <div style={statCardStyle}>
          <div style={statIconStyle}>💰</div>
          <div style={{...statValueStyle, color: "#22c55e"}}>
            {averagePrice}
          </div>
          <p style={statLabelStyle}>متوسط السعر/ساعة</p>
        </div>
        
        <div style={statCardStyle}>
          <div style={statIconStyle}>📈</div>
          <div style={{...statValueStyle, color: "#ef4444"}}>
            {highestPrice}
          </div>
          <p style={statLabelStyle}>أعلى سعر/ساعة</p>
        </div>
      </div>

      {/* Add Table Button */}
      <div style={actionButtonsStyle}>
        <button
          onClick={() => setShowAddModal(true)}
          style={addTableButtonStyle}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#8a9b85";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#A2AF9B";
          }}
        >
          <span>➕</span>
          إضافة طاولة جديدة
        </button>
      </div>

      {/* Instructions Card */}
      <div style={instructionsCardStyle}>
        <div style={instructionsIconStyle}>💡</div>
        <p style={instructionsTextStyle}>
          اضغط تعديل لتغيير السعر أو حذف لإزالة الطاولة
        </p>
      </div>

      {/* Tables Grid */}
      <div style={tablesGridStyle}>
        {tables.map(table => (
          <div
            key={table.id}
            style={tableCardStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Table Image Container */}
            <div style={tableImageContainerStyle}>
              <img
                src={tableImage}
                alt="table"
                style={tableImageStyle}
              />
            </div>

            {/* Table Info */}
            <h2 style={tableNumberStyle}>
              طاولة رقم {table.table_number}
            </h2>

            {/* Status Badge */}
            <div style={statusBadgeStyle(table.status)}>
              {table.status === "active" ? "نشط" : "غير نشط"}
            </div>
            
            <div style={priceContainerStyle}>
              <p style={priceTextStyle}>
                السعر: {table.price_per_hour || 0} شيقل/ساعة
              </p>
            </div>

            {/* Action Buttons */}
            <div style={tableActionsStyle}>
              <button
                onClick={() => {
                  setSelectedTable(table);
                  setNewPrice(table.price_per_hour || "");
                }}
                style={editButtonStyle}
              >
                ✏️ تعديل
              </button>
              
              <button
                onClick={() => {
                  setTableToDelete(table);
                  setShowDeleteConfirm(true);
                }}
                style={deleteButtonStyle}
              >
                🗑️ حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {selectedTable && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            {/* Modal Header */}
            <div style={modalHeaderStyle}>
              <div style={modalIconStyle}>💰</div>
              <h2 style={modalTitleStyle}>
                تعديل سعر الطاولة
              </h2>
              <p style={modalSubtitleStyle}>
                طاولة رقم {selectedTable.table_number}
              </p>
            </div>

            {/* Current Price Display */}
            <div style={currentPriceDisplayStyle}>
              <div style={currentPriceLabelStyle}>
                السعر الحالي:
              </div>
              <div style={currentPriceValueStyle}>
                {selectedTable.price_per_hour || 0} شيقل/ساعة
              </div>
            </div>

            {/* Price Input */}
            <div style={inputGroupStyle}>
              <label style={labelStyle}>
                السعر الجديد (بالشيقل):
              </label>
              <input
                type="number"
                step="1"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                style={inputStyle}
                placeholder="أدخل السعر الجديد"
              />
            </div>

            {/* Action Buttons */}
            <div style={modalActionsStyle}>
              <button
                onClick={() => setSelectedTable(null)}
                style={cancelButtonStyle}
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                style={saveButtonStyle}
              >
                حفظ التغييرات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            {/* Modal Header */}
            <div style={modalHeaderStyle}>
              <div style={modalIconStyle}>➕</div>
              <h2 style={modalTitleStyle}>
                إضافة طاولة جديدة
              </h2>
              <p style={modalSubtitleStyle}>
                أدخل معلومات الطاولة الجديدة
              </p>
            </div>

            {/* Table Number Input */}
            <div style={inputGroupStyle}>
              <label style={labelStyle}>
                رقم الطاولة:
              </label>
              <input
                type="text"
                value={newTableData.table_number}
                onChange={(e) => setNewTableData({...newTableData, table_number: e.target.value})}
                style={inputStyle}
                placeholder="أدخل رقم الطاولة"
              />
            </div>

            {/* Price Input */}
            <div style={inputGroupStyle}>
              <label style={labelStyle}>
                السعر (بالشيقل/ساعة):
              </label>
              <input
                type="number"
                step="1"
                value={newTableData.price_per_hour}
                onChange={(e) => setNewTableData({...newTableData, price_per_hour: e.target.value})}
                style={inputStyle}
                placeholder="أدخل السعر"
              />
            </div>

            {/* Status Select */}
            <div style={inputGroupStyle}>
              <label style={labelStyle}>
                حالة الطاولة:
              </label>
              <select
                value={newTableData.status}
                onChange={(e) => setNewTableData({...newTableData, status: e.target.value})}
                style={selectStyle}
              >
                <option value="active">نشط</option>
                <option value="deactive">غير نشط</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div style={modalActionsStyle}>
              <button
                onClick={() => setShowAddModal(false)}
                style={cancelButtonStyle}
              >
                إلغاء
              </button>
              <button
                onClick={handleAddTable}
                style={saveButtonStyle}
              >
                إضافة الطاولة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && tableToDelete && (
        <div style={modalOverlayStyle}>
          <div style={{...modalContentStyle, maxWidth: "400px"}}>
            <div style={modalHeaderStyle}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
              <h2 style={modalTitleStyle}>
                تأكيد الحذف
              </h2>
              <p style={modalSubtitleStyle}>
                هل أنت متأكد من حذف طاولة رقم {tableToDelete.table_number}؟
              </p>
            </div>

            <div style={{
              textAlign: "center",
              marginBottom: "24px",
              padding: "16px",
              backgroundColor: "#fef2f2",
              borderRadius: "6px",
              border: "1px solid #fecaca"
            }}>
              <p style={{ margin: 0, color: "#dc2626", fontSize: "14px" }}>
                لا يمكن التراجع عن هذا الإجراء
              </p>
            </div>

            <div style={modalActionsStyle}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setTableToDelete(null);
                }}
                style={cancelButtonStyle}
              >
                إلغاء
              </button>

              <button
                onClick={handleDeleteTable}
                style={deleteConfirmButtonStyle}
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}