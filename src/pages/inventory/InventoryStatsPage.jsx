/* eslint-disable no-unused-vars */
import { useEffect, useState, useMemo, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useDateRange } from "../../contexts/DateRangeContext";
import { 
  BarChart3, 
  Package, 
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Hash,
  Award,
  Archive,
  PieChart,
  Sparkles,
  ShoppingCart,
  Tag ,
  Activity,
  TrendingDown,
  RefreshCw
} from "lucide-react";

export default function InventoryStatsPage() {
  const { getFilterDisplayName } = useDateRange();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const styles = useMemo(() => ({
    container: {
      padding: "2rem",
      backgroundColor: "#F8F9FA",
      minHeight: "100vh",
      fontFamily: "'Segoe UI', 'Cairo', Tahoma, Arial, sans-serif"
    },
    header: {
      backgroundColor: "#FFFFFF",
      padding: "2rem",
      marginBottom: "2rem",
      border: "1px solid #E5E7EB",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
    },
    headerContent: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    },
    titleSection: {
      display: "flex",
      alignItems: "center",
      gap: "1rem"
    },
    iconContainer: {
      width: "48px",
      height: "48px",
      backgroundColor: "#A2AF9B",
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    title: {
      fontSize: "1.75rem",
      fontWeight: "600",
      color: "#1F2937",
      margin: 0,
      marginBottom: "0.25rem"
    },
    subtitle: {
      fontSize: "0.875rem",
      color: "#6B7280",
      margin: 0
    },
    refreshButton: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.75rem 1rem",
      backgroundColor: "#A2AF9B",
      color: "#FFFFFF",
      border: "none",
      borderRadius: "6px",
      fontSize: "0.875rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "background-color 0.2s"
    },
    alertSection: {
      marginBottom: "2rem"
    },
    alertHeader: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      padding: "1rem",
      backgroundColor: "#FEF2F2",
      border: "1px solid #FECACA",
      borderRadius: "6px",
      marginBottom: "1rem"
    },
    alertTitle: {
      fontSize: "1rem",
      fontWeight: "600",
      color: "#DC2626",
      margin: 0
    },
    alertGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "1rem"
    },
    alertCard: {
      backgroundColor: "#FFFFFF",
      border: "1px solid #FCA5A5",
      borderRadius: "6px",
      padding: "1rem",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
      gap: "1rem",
      marginBottom: "2rem"
    },
    statCard: {
      backgroundColor: "#FFFFFF",
      border: "1px solid #E5E7EB",
      borderRadius: "6px",
      padding: "1.5rem",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
      textAlign: "center"
    },
    statIconContainer: {
      width: "40px",
      height: "40px",
      backgroundColor: "#A2AF9B",
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 1rem auto"
    },
    statLabel: {
      fontSize: "0.875rem",
      color: "#6B7280",
      fontWeight: "500",
      margin: "0 0 0.5rem 0"
    },
    statValue: {
      fontSize: "1.5rem",
      fontWeight: "600",
      color: "#1F2937",
      margin: 0
    },
    analysisSection: {
      marginBottom: "2rem"
    },
    sectionHeader: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      padding: "1rem",
      backgroundColor: "#FFFFFF",
      border: "1px solid #E5E7EB",
      borderRadius: "6px",
      marginBottom: "1rem"
    },
    sectionTitle: {
      fontSize: "1rem",
      fontWeight: "600",
      color: "#1F2937",
      margin: 0
    },
    typeGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: "0.75rem"
    },
    typeItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0.75rem 1rem",
      backgroundColor: "#FFFFFF",
      border: "1px solid #E5E7EB",
      borderRadius: "6px",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
    },
    typeName: {
      fontSize: "0.875rem",
      color: "#1F2937",
      fontWeight: "500"
    },
    typeCount: {
      fontSize: "0.875rem",
      color: "#A2AF9B",
      fontWeight: "600",
      padding: "0.25rem 0.5rem",
      backgroundColor: "#F3F4F6",
      borderRadius: "4px"
    },
    highlightGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
      gap: "1rem"
    },
    highlightCard: {
      backgroundColor: "#FFFFFF",
      border: "1px solid #E5E7EB",
      borderRadius: "6px",
      padding: "1.5rem",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
    },
    highlightHeader: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      marginBottom: "1rem",
      paddingBottom: "1rem",
      borderBottom: "1px solid #E5E7EB"
    },
    highlightIconContainer: {
      width: "36px",
      height: "36px",
      backgroundColor: "#DCCFC0",
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    highlightTitle: {
      fontSize: "1rem",
      fontWeight: "600",
      color: "#1F2937",
      margin: 0
    },
    productDetail: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0.5rem 0",
      borderBottom: "1px solid #F3F4F6",
      fontSize: "0.875rem"
    },
    detailLabel: {
      color: "#6B7280",
      fontWeight: "500"
    },
    detailValue: {
      color: "#1F2937",
      fontWeight: "600"
    },
    profitValue: {
      color: "#059669",
      fontWeight: "600"
    },
    loadingContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "50vh"
    },
    loadingCard: {
      backgroundColor: "#FFFFFF",
      border: "1px solid #E5E7EB",
      borderRadius: "6px",
      padding: "2rem",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
      textAlign: "center"
    },
    errorContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "50vh"
    },
    errorCard: {
      backgroundColor: "#FFFFFF",
      border: "1px solid #FCA5A5",
      borderRadius: "6px",
      padding: "2rem",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
      textAlign: "center",
      maxWidth: "400px"
    },
    emptyContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "50vh"
    },
    emptyCard: {
      backgroundColor: "#FFFFFF",
      border: "1px solid #E5E7EB",
      borderRadius: "6px",
      padding: "2rem",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
      textAlign: "center",
      maxWidth: "400px"
    }
  }), []);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, "inventory"));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("حدث خطأ في تحميل البيانات. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    const lowStock = products.filter(p => p.quantity < 10);
    const totalProducts = products.length;
    const totalQuantity = products.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
    const totalValuePurchase = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);
    const totalValueSell = products.reduce((sum, p) => sum + (p.quantity * p.sell_price), 0);
    const totalProfit = totalValueSell - totalValuePurchase;

    // Count by type
    const countByType = {};
    products.forEach(p => {
      countByType[p.type] = (countByType[p.type] || 0) + 1;
    });

    // Most profitable product
    const mostProfitable = [...products].sort((a, b) => {
      const profitA = (a.sell_price - a.price) * a.quantity;
      const profitB = (b.sell_price - b.price) * b.quantity;
      return profitB - profitA;
    })[0];

    // Most stocked product
    const mostStocked = [...products].sort((a, b) => b.quantity - a.quantity)[0];

    return {
      lowStock,
      totalProducts,
      totalQuantity,
      totalValuePurchase,
      totalValueSell,
      totalProfit,
      countByType,
      mostProfitable,
      mostStocked
    };
  }, [products]);

  const statCards = [
    { label: "عدد المنتجات", value: stats.totalProducts, icon: Package },
    { label: "إجمالي الكمية", value: stats.totalQuantity, icon: Hash },
    { label: "قيمة الشراء الكاملة", value: `${stats.totalValuePurchase.toFixed(2)} ش`, icon: ShoppingCart },
    { label: "قيمة البيع الكاملة", value: `${stats.totalValueSell.toFixed(2)} ش`, icon: DollarSign },
    { label: "الربح المتوقع", value: `${stats.totalProfit.toFixed(2)} ش`, icon: TrendingUp }
  ];

  const StatCard = useCallback(({ label, value, icon: Icon }) => (
    <div style={styles.statCard}>
      <div style={styles.statIconContainer}>
        <Icon style={{ color: "#FFFFFF", width: 20, height: 20 }} />
      </div>
      <h3 style={styles.statLabel}>{label}</h3>
      <p style={styles.statValue}>{value}</p>
    </div>
  ), [styles]);

  const HighlightCard = useCallback(({ title, product, icon: Icon }) => {
    if (!product) return null;
    const profit = (product.sell_price - product.price) * product.quantity;

    return (
      <div style={styles.highlightCard}>
        <div style={styles.highlightHeader}>
          <div style={styles.highlightIconContainer}>
            <Icon style={{ color: "#A2AF9B", width: 20, height: 20 }} />
          </div>
          <h3 style={styles.highlightTitle}>{title}</h3>
        </div>

        <div style={styles.productDetail}>
          <span style={styles.detailLabel}>الاسم:</span>
          <span style={styles.detailValue}>{product.name}</span>
        </div>
        <div style={styles.productDetail}>
          <span style={styles.detailLabel}>النوع:</span>
          <span style={styles.detailValue}>{product.type}</span>
        </div>
        <div style={styles.productDetail}>
          <span style={styles.detailLabel}>الكمية:</span>
          <span style={styles.detailValue}>{product.quantity}</span>
        </div>
        <div style={styles.productDetail}>
          <span style={styles.detailLabel}>سعر الشراء:</span>
          <span style={styles.detailValue}>{product.price} ش</span>
        </div>
        <div style={styles.productDetail}>
          <span style={styles.detailLabel}>سعر البيع:</span>
          <span style={styles.detailValue}>{product.sell_price} ش</span>
        </div>
        <div style={{...styles.productDetail, borderBottom: "none", paddingTop: "0.75rem"}}>
          <span style={styles.detailLabel}>الربح المتوقع:</span>
          <span style={styles.profitValue}>{profit.toFixed(2)} ش</span>
        </div>
      </div>
    );
  }, [styles]);

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingCard}>
            <Activity style={{ 
              color: "#A2AF9B", 
              width: 32, 
              height: 32,
              marginBottom: "1rem"
            }} />
            <p style={{
              fontSize: "1rem",
              fontWeight: "500",
              color: "#1F2937",
              margin: 0
            }}>
              جاري تحميل الإحصائيات...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <div style={styles.errorCard}>
            <AlertTriangle style={{ 
              color: "#DC2626", 
              width: 32, 
              height: 32,
              marginBottom: "1rem"
            }} />
            <h2 style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#DC2626",
              margin: "0 0 0.5rem 0"
            }}>
              خطأ في تحميل البيانات
            </h2>
            <p style={{
              fontSize: "0.875rem",
              color: "#7F1D1D",
              margin: "0 0 1.5rem 0"
            }}>
              {error}
            </p>
            <button
              onClick={fetchProducts}
              style={{
                ...styles.refreshButton,
                margin: "0 auto"
              }}
            >
              <Activity style={{ width: 16, height: 16 }} />
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyContainer}>
          <div style={styles.emptyCard}>
            <Package style={{ 
              color: "#A2AF9B", 
              width: 32, 
              height: 32,
              marginBottom: "1rem"
            }} />
            <h2 style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#1F2937",
              margin: "0 0 0.5rem 0"
            }}>
              لا توجد منتجات
            </h2>
            <p style={{
              fontSize: "0.875rem",
              color: "#6B7280",
              margin: 0
            }}>
              لم يتم العثور على أي منتجات في المستودع. قم بإضافة منتجات أولاً لعرض الإحصائيات.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.titleSection}>
            <div style={styles.iconContainer}>
              <BarChart3 style={{ color: "#FFFFFF", width: 24, height: 24 }} />
            </div>
            <div>
              <h1 style={styles.title}>إحصائيات المستودع</h1>
              <p style={styles.subtitle}>تحليل شامل لبيانات المخزون والأرباح (المستوى الحالي للمخزون)</p>
            </div>
          </div>
          <button
            onClick={fetchProducts}
            disabled={isLoading}
            style={{
              ...styles.refreshButton,
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? "not-allowed" : "pointer"
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
            <Activity style={{ 
              width: 16, 
              height: 16,
              animation: isLoading ? "spin 1s linear infinite" : "none"
            }} />
            {isLoading ? "جاري التحديث..." : "تحديث البيانات"}
          </button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStock.length > 0 && (
        <div style={styles.alertSection}>
          <div style={styles.alertHeader}>
            <AlertTriangle style={{ color: "#DC2626", width: 20, height: 20 }} />
            <h2 style={styles.alertTitle}>منتجات على وشك النفاد ({stats.lowStock.length})</h2>
          </div>
          <div style={styles.alertGrid}>
            {stats.lowStock.map(p => (
              <div key={p.id} style={styles.alertCard}>
                <h3 style={{ fontWeight: "600", color: "#DC2626", fontSize: "1rem", marginBottom: "0.75rem" }}>
                  {p.name}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <Tag style={{ width: "14px", height: "14px", color: "#6B7280" }} />
                  <span style={{ color: "#6B7280", fontSize: "0.875rem" }}>النوع: {p.type}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <Hash style={{ width: "14px", height: "14px", color: "#6B7280" }} />
                  <span style={{ color: "#1F2937", fontWeight: "600", fontSize: "0.875rem" }}>الكمية: {p.quantity}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <TrendingUp style={{ width: "14px", height: "14px", color: "#059669" }} />
                  <span style={{ color: "#059669", fontWeight: "600", fontSize: "0.875rem" }}>
                    ربح متوقع: {((p.sell_price - p.price) * p.quantity).toFixed(2)} ش
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div style={styles.statsGrid}>
        {statCards.map(card => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Type Analysis */}
      <div style={styles.analysisSection}>
        <div style={styles.sectionHeader}>
          <PieChart style={{ color: "#A2AF9B", width: 20, height: 20 }} />
          <h2 style={styles.sectionTitle}>عدد المنتجات حسب النوع</h2>
        </div>
        <div style={styles.typeGrid}>
          {Object.entries(stats.countByType).map(([type, count]) => (
            <div key={type} style={styles.typeItem}>
              <span style={styles.typeName}>{type}</span>
              <span style={styles.typeCount}>{count} منتج</span>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div style={styles.highlightGrid}>
        <HighlightCard 
          title="أعلى منتج ربحاً" 
          product={stats.mostProfitable} 
          icon={Award}
        />
        <HighlightCard 
          title="أكثر منتج مخزوناً" 
          product={stats.mostStocked} 
          icon={Archive}
        />
      </div>
    </div>
  );
}