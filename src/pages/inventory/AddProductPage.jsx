/* eslint-disable no-unused-vars */
import { useState, useMemo, useCallback } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { 
  Plus, 
  Package, 
  Tag, 
  DollarSign, 
  Hash, 
  CheckCircle, 
  Save,
  RefreshCw
} from "lucide-react";

export default function AddProductPage() {
  const [formData, setFormData] = useState({
    name: "",
    type: "مشروبات باردة",
    price: "",
    sell_price: "",
    quantity: ""
  });
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  const styles = useMemo(() => ({
    container: {
      padding: "24px",
      backgroundColor: "#f8fafc",
      minHeight: "100vh",
      fontFamily: "'Inter', 'Cairo', system-ui, sans-serif",
      direction: 'rtl',
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    },
    header: {
      backgroundColor: "white",
      padding: "32px",
      borderRadius: "8px",
      marginBottom: "24px",
      border: "1px solid #e2e8f0",
      textAlign: "center",
      maxWidth: "600px",
      width: "100%"
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
    successAlert: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      padding: "16px 24px",
      marginBottom: "24px",
      backgroundColor: "#dcfce7",
      borderRadius: "8px",
      border: "1px solid #bbf7d0",
      maxWidth: "600px",
      width: "100%"
    },
    successText: {
      color: "#166534",
      fontWeight: "600",
      fontSize: "16px",
      flex: 1,
      textAlign: "center"
    },
    formContainer: {
      backgroundColor: "white",
      padding: "32px",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
      maxWidth: "600px",
      width: "100%"
    },
    formHeader: {
      textAlign: "center",
      marginBottom: "32px",
      paddingBottom: "16px",
      borderBottom: "1px solid #e2e8f0"
    },
    formTitle: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#A2AF9B",
      margin: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px"
    },
    formGroup: {
      marginBottom: "24px",
      position: "relative"
    },
    label: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "14px",
      fontWeight: "600",
      color: "#374151", 
      marginBottom: "8px"
    },
    labelIcon: {
      width: "16px",
      height: "16px",
      color: "#A2AF9B"
    },
    inputContainer: {
      position: "relative"
    },
    input: {
      width: "95%",
      padding: "12px 16px",
      borderRadius: "6px",
      border: "1px solid #d1d5db",
      backgroundColor: "white",
      fontSize: "14px",
      fontWeight: "600",
      color: "#374151",
      outline: "none",
      direction: "rtl"
    },
    inputFocused: {
      borderColor: "#A2AF9B"
    },
    select: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: "6px",
      border: "1px solid #d1d5db",
      backgroundColor: "white",
      fontSize: "14px",
      fontWeight: "600",
      color: "#374151",
      outline: "none",
      cursor: "pointer",
      appearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23666'%3e%3cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3e%3c/svg%3e")`,
      backgroundPosition: "left 12px center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "16px 16px"
    },
    submitButton: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "16px 24px",
      backgroundColor: isLoading ? "#9ca3af" : "#A2AF9B",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "16px",
      fontWeight: "700",
      cursor: isLoading ? "not-allowed" : "pointer",
      marginTop: "16px"
    },
    loadingSpinner: {
      width: "20px",
      height: "20px",
      animation: "spin 1s linear infinite"
    }
  }), [focusedField, isLoading]);

  const productTypes = [
    { value: "مشروبات باردة", label: "مشروبات باردة" },
    { value: "مشروبات ساخنة", label: "مشروبات ساخنة" },
    { value: "تسالي", label: "تسالي" },
    { value: "شوكلاطة", label: "شوكلاطة" },
      { value: "مأكولات", label: "مأكولات" },
    { value: "ميلك شيك", label: "ميلك شيك" },
  { value: "موهيتو", label: "موهيتو" }
  ];

  const formFields = [
    { name: "name", label: "اسم المنتج", type: "text", icon: Package, placeholder: "أدخل اسم المنتج" },
    { name: "type", label: "نوع المنتج", type: "select", icon: Tag },
    { name: "price", label: "سعر الشراء (بالشيقل)", type: "number", icon: DollarSign, placeholder: "0.00" },
    { name: "sell_price", label: "سعر البيع (بالشيقل)", type: "number", icon: DollarSign, placeholder: "0.00" },
    { name: "quantity", label: "الكمية", type: "number", icon: Hash, placeholder: "0" }
  ];

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData.name || !formData.price || !formData.sell_price || !formData.quantity) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await addDoc(collection(db, "inventory"), {
        name: formData.name,
        type: formData.type,
        price: parseFloat(formData.price),
        sell_price: parseFloat(formData.sell_price),
        quantity: parseInt(formData.quantity),
      });
      
      setFormData({
        name: "",
        type: "مشروبات باردة",
        price: "",
        sell_price: "",
        quantity: ""
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (error) {
      console.error("Error adding product:", error);
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !isLoading && formData.name && formData.price && formData.sell_price && formData.quantity) {
      handleSubmit();
    }
  }, [handleSubmit, isLoading, formData]);

  const handleInputFocus = useCallback((field) => {
    setFocusedField(field);
  }, []);

  const handleInputBlur = useCallback(() => {
    setFocusedField("");
  }, []);

  const getInputStyle = useCallback((field) => {
    let style = { ...styles.input };
    
    if (focusedField === field) {
      style = { ...style, ...styles.inputFocused };
    }
    
    return style;
  }, [styles, focusedField]);

  const getSelectStyle = useCallback((field) => {
    let style = { ...styles.select };
    
    if (focusedField === field) {
      style = { ...style, borderColor: "#A2AF9B" };
    }
    
    return style;
  }, [styles, focusedField]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>إضافة منتج جديد</h1>
        <p style={styles.headerSubtitle}>أضف منتج جديد إلى مستودع المخزون</p>
      </div>

      {/* Success Alert */}
      {success && (
        <div style={styles.successAlert}>
          <CheckCircle style={{ color: "#166534", width: 20, height: 20 }} />
          <div style={styles.successText}>
            تم إضافة المنتج بنجاح إلى المستودع!
          </div>
        </div>
      )}

      {/* Form */}
      <div style={styles.formContainer}>
        <div style={styles.formHeader}>
          <h2 style={styles.formTitle}>
            <Package style={{ width: 20, height: 20, color: "#A2AF9B" }} />
            بيانات المنتج
          </h2>
        </div>

        <div>
          {formFields.map(({ name, label, type, icon: Icon, placeholder }) => (
            <div key={name} style={styles.formGroup}>
              <label style={styles.label}>
                <Icon style={styles.labelIcon} />
                {label}:
              </label>
              
              <div style={styles.inputContainer}>
                {type === "select" ? (
                  <select
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    onFocus={() => handleInputFocus(name)}
                    onBlur={handleInputBlur}
                    required
                    style={getSelectStyle(name)}
                  >
                    {productTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name={name}
                    type={type}
                    value={formData[name]}
                    onChange={handleChange}
                    onFocus={() => handleInputFocus(name)}
                    onBlur={handleInputBlur}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    required
                    min={type === "number" ? "0" : undefined}
                    step={type === "number" && name !== "quantity" ? "0.01" : undefined}
                    style={getInputStyle(name)}
                  />
                )}
              </div>
            </div>
          ))}

          <button 
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            style={styles.submitButton}
          >
            {isLoading ? (
              <>
                <RefreshCw style={styles.loadingSpinner} />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save style={{ width: 20, height: 20 }} />
                <span>حفظ المنتج</span>
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        input::placeholder, select::placeholder {
          color: #9ca3af;
          opacity: 1;
          font-weight: 400;
        }
      `}</style>
    </div>
  );
}