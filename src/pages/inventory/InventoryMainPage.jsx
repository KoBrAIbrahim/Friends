/* eslint-disable no-unused-vars */
import { useEffect, useState, useMemo, useCallback } from "react";
import { collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Edit3, 
  Trash2, 
  Undo2, 
  Save, 
  X, 
  Package,
  DollarSign,
  Hash,
  Tag,
  AlertCircle,
  CheckCircle,
  Plus
} from "lucide-react";

export default function InventoryMainPage() {
  const [products, setProducts] = useState([]);
  const [deletedProduct, setDeletedProduct] = useState(null);
  const [undoTimeout, setUndoTimeout] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [formData, setFormData] = useState({});
  const [filterType, setFilterType] = useState("all");
  const [sortOrder, setSortOrder] = useState("none");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [addQtyProduct, setAddQtyProduct] = useState(null);
  const [addQtyValue, setAddQtyValue] = useState("");

  const styles = useMemo(() => ({
    container: {
      padding: "24px",
      backgroundColor: "#f8fafc",
      minHeight: "100vh",
      fontFamily: "'Inter', 'Cairo', system-ui, sans-serif",
      direction: 'rtl'
    },
    header: {
      backgroundColor: "white",
      padding: "32px",
      borderRadius: "8px",
      marginBottom: "24px",
      border: "1px solid #e2e8f0",
      textAlign: "center"
    },
    headerTitle: {
      fontSize: "32px",
      fontWeight: "700",
      color: "#A2AF9B",
      margin: "0 0 8px 0"
    },
    headerSubtitle: {
      fontSize: "16px",
      color: "#64748b",
      margin: 0
    },
    filtersContainer: {
      display: "flex",
      flexWrap: "wrap",
      gap: "16px",
      marginBottom: "24px",
      padding: "20px",
      backgroundColor: "white",
      borderRadius: "8px",
      border: "1px solid #e2e8f0"
    },
    filterGroup: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flex: "1",
      minWidth: "200px"
    },
    filterIcon: {
      width: "20px",
      height: "20px",
      color: "#A2AF9B"
    },
    select: {
      flex: "1",
      padding: "12px 16px",
      borderRadius: "6px",
      border: "1px solid #d1d5db",
      backgroundColor: "white",
      fontSize: "14px",
      fontWeight: "600",
      color: "#374151",
      cursor: "pointer",
      outline: "none"
    },
    searchContainer: {
      position: "relative",
      flex: "2",
      minWidth: "300px"
    },
    searchInput: {
      width: "92%",
      padding: "12px 16px 12px 48px",
      borderRadius: "6px",
      border: "1px solid #d1d5db",
      backgroundColor: "white",
      fontSize: "14px",
      fontWeight: "600",
      color: "#374151",
      outline: "none",
      direction: "rtl"
    },
    searchIcon: {
      position: "absolute",
      left: "16px",
      top: "50%",
      transform: "translateY(-50%)",
      width: "20px",
      height: "20px",
      color: "#A2AF9B"
    },
    undoAlert: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      padding: "16px 24px",
      marginBottom: "24px",
      backgroundColor: "#fef2f2",
      borderRadius: "8px",
      border: "1px solid #fecaca"
    },
    undoButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 16px",
      backgroundColor: "#A2AF9B",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer"
    },
    productsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "16px"
    },
    productCard: {
      backgroundColor: "white",
      borderRadius: "8px",
      padding: "20px",
      border: "1px solid #e2e8f0"
    },
    productHeader: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "16px"
    },
    productIcon: {
      width: "40px",
      height: "40px",
      backgroundColor: "#A2AF9B",
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    productName: {
      fontSize: "18px",
      fontWeight: "700",
      color: "#374151",
      margin: 0
    },
    productDetail: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      margin: "12px 0",
      padding: "8px 12px",
      backgroundColor: "#f8fafc",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: "600",
      color: "#4a5568",
      border: "1px solid #e2e8f0"
    },
    detailIcon: {
      width: "16px",
      height: "16px",
      color: "#A2AF9B"
    },
    actionButtons: {
      display: "flex",
      gap: "8px",
      marginTop: "16px"
    },
    editButton: {
      flex: "1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      padding: "10px 12px",
      backgroundColor: "#A2AF9B",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: "600",
      cursor: "pointer"
    },
    deleteButton: {
      flex: "1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      padding: "10px 12px",
      backgroundColor: "#ef4444",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: "600",
      cursor: "pointer"
    },
    addQtyButton: {
      flex: "1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      padding: "10px 12px",
      backgroundColor: "#3b82f6",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: "600",
      cursor: "pointer"
    },
    modal: {
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: "white",
      borderRadius: "8px",
      padding: "32px",
      width: "100%",
      maxWidth: "500px",
      maxHeight: "90vh",
      overflowY: "auto",
      border: "1px solid #e2e8f0",
      position: "relative"
    },
    modalHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "24px",
      paddingBottom: "16px",
      borderBottom: "1px solid #e2e8f0"
    },
    modalTitle: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#A2AF9B",
      margin: 0
    },
    closeButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "32px",
      height: "32px",
      backgroundColor: "#fef2f2",
      border: "1px solid #fecaca",
      borderRadius: "6px",
      cursor: "pointer"
    },
    formGroup: {
      marginBottom: "20px"
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: "600",
      color: "#374151",
      marginBottom: "8px"
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: "6px",
      border: "1px solid #d1d5db",
      backgroundColor: "white",
      fontSize: "14px",
      fontWeight: "600",
      color: "#374151",
      outline: "none"
    },
    modalActions: {
      display: "flex",
      gap: "12px",
      marginTop: "24px",
      paddingTop: "16px",
      borderTop: "1px solid #e2e8f0"
    },
    cancelButton: {
      flex: "1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "12px 20px",
      backgroundColor: "#e5e7eb",
      color: "#374151",
      border: "none",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer"
    },
    saveButton: {
      flex: "1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "12px 20px",
      backgroundColor: "#A2AF9B",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer"
    },
    saveButtonBlue: {
      flex: "1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "12px 20px",
      backgroundColor: "#3b82f6",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer"
    }
  }), []);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const snap = await getDocs(collection(db, "inventory"));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = useCallback((product) => {
    setDeletedProduct(product);
    setProducts(products.filter((p) => p.id !== product.id));
    const timeout = setTimeout(async () => {
      await deleteDoc(doc(db, "inventory", product.id));
      setDeletedProduct(null);
    }, 3000);
    setUndoTimeout(timeout);
  }, [products]);

  const undoDelete = useCallback(() => {
    if (undoTimeout) clearTimeout(undoTimeout);
    setProducts([...products, deletedProduct]);
    setDeletedProduct(null);
  }, [undoTimeout, products, deletedProduct]);

  const handleEditChange = useCallback((e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }, [formData]);

  const saveEdit = async () => {
    try {
      const ref = doc(db, "inventory", editProduct.id);
      await updateDoc(ref, {
        name: formData.name,
        type: formData.type,
        price: parseFloat(formData.price),
        sell_price: parseFloat(formData.sell_price),
        quantity: parseInt(formData.quantity),
      });
      setEditProduct(null);
      setFormData({});
      fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => filterType === "all" || p.type === filterType)
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortOrder === "asc") return a.quantity - b.quantity;
        if (sortOrder === "desc") return b.quantity - a.quantity;
        return 0;
      });
  }, [products, filterType, searchQuery, sortOrder]);

const productTypes = [
  { value: "all", label: "كل الأنواع" },
  { value: "مشروبات باردة", label: "مشروبات باردة" },
  { value: "مشروبات ساخنة", label: "مشروبات ساخنة" },
  { value: "تسالي", label: "تسالي" },
  { value: "شوكلاطة", label: "شوكلاطة" },
  { value: "مأكولات", label: "مأكولات" },
  { value: "ميلك شيك", label: "ميلك شيك" },
  { value: "موهيتو", label: "موهيتو" },
  { value: "أراجيل", label: "أراجيل" },
  { value: "سموذي", label: "سموذي" },
  { value: "مشروبات طبيعية", label: "مشروبات طبيعية" }
];


  const sortOptions = [
    { value: "none", label: "بدون ترتيب" },
    { value: "asc", label: "الكمية - تصاعدي" },
    { value: "desc", label: "الكمية - تنازلي" }
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>قائمة المنتجات</h1>
        <p style={styles.headerSubtitle}>إدارة وتتبع جميع منتجات المستودع</p>
      </div>

      {/* Filters */}
      <div style={styles.filtersContainer}>
        <div style={styles.filterGroup}>
          <Filter style={styles.filterIcon} />
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)} 
            style={styles.select}
          >
            {productTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <ArrowUpDown style={styles.filterIcon} />
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)} 
            style={styles.select}
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div style={styles.searchContainer}>
          <Search style={styles.searchIcon} />
          <input
            type="text"
            placeholder="بحث بالاسم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* Undo Alert */}
      {deletedProduct && (
        <div style={styles.undoAlert}>
          <AlertCircle style={{ color: "#dc2626", width: 20, height: 20 }} />
          <span style={{ color: "#dc2626", fontWeight: "600", flex: 1 }}>
            تم حذف المنتج "{deletedProduct.name}" مؤقتًا
          </span>
          <button 
            onClick={undoDelete} 
            style={styles.undoButton}
          >
            <Undo2 style={{ width: 16, height: 16 }} />
            تراجع
          </button>
        </div>
      )}

      {/* Products Grid */}
      <div style={styles.productsGrid}>
        {filteredProducts.map((product) => (
          <div key={product.id} style={styles.productCard}>
            <div style={styles.productHeader}>
              <div style={styles.productIcon}>
                <Package style={{ color: "white", width: 20, height: 20 }} />
              </div>
              <h2 style={styles.productName}>{product.name}</h2>
            </div>

            <div style={styles.productDetail}>
              <Tag style={styles.detailIcon} />
              <span>النوع: {product.type}</span>
            </div>

            <div style={styles.productDetail}>
              <DollarSign style={styles.detailIcon} />
              <span>سعر الشراء: {product.price} ش</span>
            </div>

            <div style={styles.productDetail}>
              <DollarSign style={styles.detailIcon} />
              <span>سعر البيع: {product.sell_price} ش</span>
            </div>

            <div style={styles.productDetail}>
              <Hash style={styles.detailIcon} />
              <span>الكمية: {product.quantity}</span>
            </div>

            <div style={styles.actionButtons}>
              <button
                onClick={() => {
                  setEditProduct(product);
                  setFormData(product);
                }}
                style={styles.editButton}
              >
                <Edit3 style={{ width: 14, height: 14 }} />
                تعديل
              </button>
              <button
                onClick={() => handleDelete(product)}
                style={styles.deleteButton}
              >
                <Trash2 style={{ width: 14, height: 14 }} />
                حذف
              </button>
              <button
                onClick={() => {
                  setAddQtyProduct(product);
                  setAddQtyValue("");
                }}
                style={styles.addQtyButton}
              >
                <Plus style={{ width: 14, height: 14 }} />
                إضافة كمية
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editProduct && (
        <div style={styles.modal} onClick={(e) => e.target === e.currentTarget && setEditProduct(null)}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>تعديل المنتج</h2>
              <button 
                onClick={() => setEditProduct(null)} 
                style={styles.closeButton}
              >
                <X style={{ color: "#ef4444", width: 16, height: 16 }} />
              </button>
            </div>

            {[
              { field: "name", label: "اسم المنتج", type: "text" },
              { field: "type", label: "نوع المنتج", type: "text" },
              { field: "price", label: "سعر الشراء", type: "number" },
              { field: "sell_price", label: "سعر البيع", type: "number" },
              { field: "quantity", label: "الكمية", type: "number" }
            ].map(({ field, label, type }) => (
              <div key={field} style={styles.formGroup}>
                <label style={styles.label}>
                  {label}:
                </label>
                <input
                  name={field}
                  type={type}
                  value={formData[field] || ""}
                  onChange={handleEditChange}
                  style={styles.input}
                />
              </div>
            ))}

            <div style={styles.modalActions}>
              <button 
                onClick={() => setEditProduct(null)} 
                style={styles.cancelButton}
              >
                <X style={{ width: 16, height: 16 }} />
                إلغاء
              </button>
              <button 
                onClick={saveEdit} 
                style={styles.saveButton}
              >
                <CheckCircle style={{ width: 16, height: 16 }} />
                حفظ التغييرات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Quantity Modal */}
      {addQtyProduct && (
        <div style={styles.modal} onClick={(e) => e.target === e.currentTarget && setAddQtyProduct(null)}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>إضافة كمية إلى: {addQtyProduct.name}</h2>
              <button 
                onClick={() => setAddQtyProduct(null)} 
                style={styles.closeButton}
              >
                <X style={{ color: "#ef4444", width: 16, height: 16 }} />
              </button>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                الكمية الحالية: {addQtyProduct.quantity}
              </label>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                الكمية الإضافية:
              </label>
              <input
                type="number"
                min="1"
                value={addQtyValue}
                onChange={(e) => setAddQtyValue(e.target.value)}
                style={styles.input}
                placeholder="أدخل الكمية المراد إضافتها"
              />
            </div>

            <div style={styles.modalActions}>
              <button 
                onClick={() => setAddQtyProduct(null)} 
                style={styles.cancelButton}
              >
                <X style={{ width: 16, height: 16 }} />
                إلغاء
              </button>
              <button 
                onClick={async () => {
                  const extraQty = parseInt(addQtyValue);
                  if (!extraQty || extraQty <= 0) return;

                  const ref = doc(db, "inventory", addQtyProduct.id);
                  const newQty = (parseInt(addQtyProduct.quantity) || 0) + extraQty;
                  await updateDoc(ref, { quantity: newQty });

                  setAddQtyProduct(null);
                  setAddQtyValue("");
                  fetchProducts();
                }} 
                style={styles.saveButtonBlue}
              >
                <CheckCircle style={{ width: 16, height: 16 }} />
                حفظ الكمية
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}