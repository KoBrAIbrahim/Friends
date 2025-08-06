import { useState, useEffect, useCallback, useMemo } from "react";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, AlertCircle, Shield } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../services/firebase";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const navigate = useNavigate();

  // Enhanced inline styles
  const styles = useMemo(() => ({
    container: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
      background: "linear-gradient(135deg, #f0f2f5 0%, #e8ecf0 25%, #dde3ea 50%, #f5f7fa 100%)",
      position: "relative",
      fontFamily: "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif",
      overflow: "hidden"
    },
    backgroundCircle: {
      position: "absolute",
      borderRadius: "50%",
      filter: "blur(1px)",
      animation: "float 6s ease-in-out infinite"
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: 28,
      boxShadow: '0 25px 50px rgba(0,0,0,0.1), 0 12px 24px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
      overflow: 'hidden',
      transform: 'translateY(0px)',
      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      border: '1px solid rgba(162, 175, 155, 0.08)',
      backdropFilter: 'blur(20px)',
      position: 'relative'
    },
    cardGlow: {
      position: 'absolute',
      top: -2,
      left: -2,
      right: -2,
      bottom: -2,
      background: 'linear-gradient(45deg, #A2AF9B, #8FA288, #DCCFC0, #A2AF9B)',
      borderRadius: 30,
      opacity: 0,
      transition: 'opacity 0.3s ease',
      zIndex: -1
    },
    header: {
      padding: '3rem 2.5rem 2.5rem',
      textAlign: 'center',
      position: 'relative',
      background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
      borderBottom: '1px solid rgba(162, 175, 155, 0.06)'
    },
    topBar: {
      position: "absolute",
      top: 0,
      left: 0,
      width: '100%',
      height: 5,
      background: 'linear-gradient(90deg, #A2AF9B 0%, #8FA288 50%, #DCCFC0 100%)',
      boxShadow: '0 2px 8px rgba(162, 175, 155, 0.3)'
    },
    iconContainer: {
      width: 80,
      height: 80,
      background: 'linear-gradient(135deg, #A2AF9B 0%, #8FA288 100%)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 2rem',
      boxShadow: '0 12px 24px rgba(162, 175, 155, 0.25), 0 4px 8px rgba(162, 175, 155, 0.1)',
      transition: 'all 0.3s ease',
      position: 'relative'
    },
    iconGlow: {
      position: 'absolute',
      inset: -4,
      background: 'linear-gradient(135deg, #A2AF9B, #8FA288)',
      borderRadius: '50%',
      opacity: 0,
      transition: 'opacity 0.3s ease',
      zIndex: -1,
      filter: 'blur(8px)'
    },
    title: {
      fontSize: '2.25rem',
      fontWeight: '800',
      marginBottom: 12,
      color: '#2d3748',
      letterSpacing: '-0.75px',
      textShadow: '0 2px 4px rgba(0,0,0,0.05)'
    },
    subtitle: {
      fontSize: '0.95rem',
      color: '#718096',
      lineHeight: 1.6,
      fontWeight: '400'
    },
    form: {
      padding: '0 2.5rem 3rem'
    },
    inputGroup: {
      marginBottom: 24,
      position: 'relative'
    },
    label: {
      fontSize: '0.9rem',
      color: '#4a5568',
      display: 'block',
      marginBottom: 10,
      fontWeight: '600',
      transition: 'all 0.3s ease'
    },
    labelFocused: {
      color: '#A2AF9B',
      transform: 'translateY(-2px)'
    },
    inputContainer: {
      position: 'relative',
      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    },
    input: {
      width: '80%',
      padding: '1.1rem 3.5rem 1.1rem 1.25rem',
      border: '2px solid #e2e8f0',
      borderRadius: 18,
      fontSize: '1rem',
      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04), inset 0 1px 2px rgba(0,0,0,0.02)',
      outline: 'none',
      color: '#2d3748',
      fontWeight: '500'
    },
    inputDisabled: {
      backgroundColor: '#f7fafc',
      color: '#718096',
      opacity: 0.9,
      cursor: 'not-allowed'
    },
    inputFocused: {
      borderColor: '#A2AF9B',
      boxShadow: '0 0 0 4px rgba(162, 175, 155, 0.12), 0 4px 16px rgba(162, 175, 155, 0.08)',
      transform: 'translateY(-2px)',
      backgroundColor: '#ffffff'
    },
    inputError: {
      borderColor: '#e53e3e',
      boxShadow: '0 0 0 4px rgba(229, 62, 62, 0.12), 0 4px 16px rgba(229, 62, 62, 0.08)'
    },
    icon: {
      position: 'absolute',
      top: '50%',
      right: 18,
      transform: 'translateY(-50%)',
      color: '#a0aec0',
      transition: 'all 0.3s ease',
      width: 22,
      height: 22
    },
    iconFocused: {
      color: '#A2AF9B',
      transform: 'translateY(-50%) scale(1.05)'
    },
    toggleButton: {
      position: 'absolute',
      top: '50%',
      left: 18,
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '8px',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    errorContainer: {
      backgroundColor: '#fed7d7',
      color: '#c53030',
      borderRadius: 16,
      padding: '1.25rem',
      marginBottom: 24,
      border: '1px solid #feb2b2',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      animation: 'slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      boxShadow: '0 4px 12px rgba(197, 48, 48, 0.15)'
    },
    submitButton: {
      width: '100%',
      background: 'linear-gradient(135deg, #A2AF9B 0%, #8FA288 100%)',
      color: '#ffffff',
      padding: '1.25rem 2rem',
      borderRadius: 18,
      fontSize: '1.05rem',
      fontWeight: '700',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      boxShadow: '0 6px 20px rgba(162, 175, 155, 0.35), 0 2px 8px rgba(162, 175, 155, 0.15)',
      position: 'relative',
      overflow: 'hidden',
      letterSpacing: '0.5px'
    },
    submitButtonHover: {
      transform: 'translateY(-3px)',
      boxShadow: '0 12px 32px rgba(162, 175, 155, 0.45), 0 4px 16px rgba(162, 175, 155, 0.25)',
      background: 'linear-gradient(135deg, #8FA288 0%, #7d9275 100%)'
    },
    submitButtonDisabled: {
      cursor: 'not-allowed',
      opacity: 0.6,
      transform: 'none',
      background: 'linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%)'
    },
    forgotPassword: {
      textAlign: 'center',
      paddingTop: 24
    },
    forgotLink: {
      color: '#A2AF9B',
      fontSize: '0.9rem',
      textDecoration: 'none',
      transition: 'all 0.3s ease',
      padding: '0.75rem 1rem',
      borderRadius: '12px',
      fontWeight: '500',
      display: 'inline-block'
    },
    footer: {
      textAlign: 'center',
      marginTop: 40
    },
    footerText: {
      fontSize: '0.85rem',
      color: '#a0aec0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      fontWeight: '500'
    }
  }), []);

  // Enhanced background circles
  const backgroundCircles = useMemo(() => [
    { top: 60, left: 60, size: 140, color: '#A2AF9B', opacity: 0.04, delay: '0s' },
    { bottom: 100, right: 80, size: 100, color: '#DCCFC0', opacity: 0.05, delay: '2s' },
    { top: "45%", left: 30, size: 70, color: '#8FA288', opacity: 0.03, delay: '4s' },
    { top: 180, right: 100, size: 90, color: '#A2AF9B', opacity: 0.04, delay: '1s' },
    { bottom: 200, left: 120, size: 60, color: '#DCCFC0', opacity: 0.03, delay: '3s' }
  ], []);

  // Back navigation prevention
  useEffect(() => {
    const handleBack = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handleBack);
    return () => window.removeEventListener("popstate", handleBack);
  }, []);

  // Auto-clear error on typing
  useEffect(() => {
    if (error && password) {
      setError("");
    }
  }, [password, error]);

  const handleLogin = useCallback(async () => {
    if (!password.trim()) {
      setError("يرجى إدخال كلمة المرور");
      return;
    }

    setError("");
    setIsLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, "murad@gmail.com", password);
      localStorage.setItem("admin", "true");
      navigate("/home");
    } catch {
      setError("كلمة المرور غير صحيحة أو هناك خطأ في الاتصال.");
    } finally {
      setIsLoading(false);
    }
  }, [password, navigate]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !isLoading && password.trim()) {
      handleLogin();
    }
  }, [handleLogin, isLoading, password]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const handleInputFocus = useCallback((field) => {
    setFocusedField(field);
  }, []);

  const handleInputBlur = useCallback(() => {
    setFocusedField("");
  }, []);

  // Dynamic styling functions
  const getInputStyle = useCallback((field, hasError = false) => {
    let style = { ...styles.input };
    
    if (field === 'email') {
      style = { ...style, ...styles.inputDisabled };
    }
    
    if (focusedField === field) {
      style = { ...style, ...styles.inputFocused };
    }
    
    if (hasError) {
      style = { ...style, ...styles.inputError };
    }
    
    return style;
  }, [styles, focusedField]);

  const getButtonStyle = useCallback(() => {
    let style = { ...styles.submitButton };
    
    if (isLoading) {
      style = { ...style, ...styles.submitButtonDisabled };
    }
    
    return style;
  }, [styles, isLoading]);

  return (
    <div style={styles.container}>
      {/* Enhanced floating background circles */}
      {backgroundCircles.map((circle, idx) => (
        <div
          key={idx}
          style={{
            ...styles.backgroundCircle,
            ...circle,
            width: circle.size,
            height: circle.size,
            backgroundColor: circle.color,
            opacity: circle.opacity,
            animationDelay: circle.delay
          }}
        />
      ))}

      <div style={{ width: '100%', maxWidth: 440, position: "relative" }}>
        <div 
          style={styles.card}
          onMouseEnter={(e) => {
            e.currentTarget.querySelector('.card-glow').style.opacity = '0.1';
            e.currentTarget.style.transform = 'translateY(-4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.querySelector('.card-glow').style.opacity = '0';
            e.currentTarget.style.transform = 'translateY(0px)';
          }}
        >
          <div className="card-glow" style={styles.cardGlow}></div>
          
          {/* Enhanced header */}
          <div style={styles.header}>
            <div style={styles.topBar}></div>
            <div 
              style={styles.iconContainer}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05) rotate(5deg)';
                e.currentTarget.querySelector('.icon-glow').style.opacity = '0.3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                e.currentTarget.querySelector('.icon-glow').style.opacity = '0';
              }}
            >
              <div className="icon-glow" style={styles.iconGlow}></div>
              <Lock style={{ color: '#ffffff', width: 40, height: 40 }} />
            </div>
            <h1 style={styles.title}>مرحباً بك مرة أخرى</h1>
            <p style={styles.subtitle}>
              سعداء لرؤيتك! قم بتسجيل الدخول للوصول إلى حسابك
            </p>
          </div>

          {/* Enhanced form */}
          <div style={styles.form}>
            <div>
              {/* Email field */}
              <div style={styles.inputGroup}>
                <label style={{
                  ...styles.label,
                  ...(focusedField === 'email' ? styles.labelFocused : {})
                }}>البريد الإلكتروني</label>
                <div style={styles.inputContainer}>
                  <Mail style={{
                    ...styles.icon,
                    ...(focusedField === 'email' ? styles.iconFocused : {})
                  }} />
                  <input
                    type="email"
                    value="murad@gmail.com"
                    disabled
                    onFocus={() => handleInputFocus('email')}
                    onBlur={handleInputBlur}
                    style={getInputStyle('email')}
                  />
                </div>
              </div>

              {/* Password field */}
              <div style={styles.inputGroup}>
                <label style={{
                  ...styles.label,
                  ...(focusedField === 'password' ? styles.labelFocused : {})
                }}>كلمة المرور</label>
                <div style={styles.inputContainer}>
                  <Lock style={{
                    ...styles.icon,
                    ...(focusedField === 'password' ? styles.iconFocused : {})
                  }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => handleInputFocus('password')}
                    onBlur={handleInputBlur}
                    onKeyPress={handleKeyPress}
                    placeholder="أدخل كلمة المرور الخاصة بك"
                    required
                    style={{
                      ...getInputStyle('password', !!error),
                      direction: 'rtl'
                    }}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    style={styles.toggleButton}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f7fafc'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    {showPassword ? (
                      <EyeOff style={{ color: '#a0aec0', width: 20, height: 20 }} />
                    ) : (
                      <Eye style={{ color: '#a0aec0', width: 20, height: 20 }} />
                    )}
                  </button>
                </div>
              </div>

              {/* Enhanced error message */}
              {error && (
                <div style={styles.errorContainer}>
                  <AlertCircle style={{ width: 22, height: 22, minWidth: 22 }} />
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500' }}>{error}</p>
                </div>
              )}

              {/* Enhanced submit button */}
              <button
                type="button"
                disabled={isLoading}
                onClick={handleLogin}
                style={getButtonStyle()}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    Object.assign(e.target.style, styles.submitButtonHover);
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.target.style.transform = 'translateY(0px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(162, 175, 155, 0.35), 0 2px 8px rgba(162, 175, 155, 0.15)';
                    e.target.style.background = 'linear-gradient(135deg, #A2AF9B 0%, #8FA288 100%)';
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 style={{
                      width: 22,
                      height: 22,
                      animation: "spin 1s linear infinite"
                    }} />
                    <span>جاري التحقق من البيانات...</span>
                  </>
                ) : (
                  <>
                    <span>تسجيل الدخول</span>
                    <ArrowRight style={{ width: 22, height: 22 }} />
                  </>
                )}
              </button>

              {/* Enhanced forgot password */}
              <div style={styles.forgotPassword}>
                <a
                  href="#"
                  style={styles.forgotLink}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f7fafc';
                    e.target.style.color = '#8FA288';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#A2AF9B';
                    e.target.style.transform = 'translateY(0px)';
                  }}
                >
                  نسيت كلمة المرور؟
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            <Shield style={{ width: 18, height: 18 }} />
            محمي بأحدث تقنيات الأمان والحماية
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-15px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
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
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-20px) rotate(5deg);
          }
          66% {
            transform: translateY(10px) rotate(-3deg);
          }
        }
        
        input::placeholder {
          color: #a0aec0;
          opacity: 1;
          font-weight: 400;
        }
        
        input:focus::placeholder {
          opacity: 0.6;
          transform: translateX(4px);
          transition: all 0.3s ease;
        }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: #A2AF9B #f1f1f1;
        }
        
        *::-webkit-scrollbar {
          width: 8px;
        }
        
        *::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        *::-webkit-scrollbar-thumb {
          background: #A2AF9B;
          border-radius: 4px;
        }
        
        *::-webkit-scrollbar-thumb:hover {
          background: #8FA288;
        }
      `}</style>
    </div>
  );
}