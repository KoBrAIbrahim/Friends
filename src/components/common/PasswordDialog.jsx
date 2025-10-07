import { useState } from "react";

export default function PasswordDialog({ isOpen, onClose, onConfirm, title = "أدخل كلمة المرور" }) {
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
    
    if (password === adminPassword) {
      setErrorMessage("");
      setPassword("");
      onConfirm();
    } else {
      setErrorMessage("كلمة السر غلط");
    }
  };

  const handleClose = () => {
    setPassword("");
    setErrorMessage("");
    onClose();
  };

  if (!isOpen) return null;

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    fontFamily: "'Inter', 'Cairo', system-ui, sans-serif",
    direction: 'rtl'
  };

  const modalStyle = {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "32px",
    width: "100%",
    maxWidth: "400px",
    margin: "16px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
  };

  const titleStyle = {
    fontSize: "24px",
    fontWeight: "700",
    color: "#A2AF9B",
    marginBottom: "24px",
    textAlign: "center"
  };

  const formStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  };

  const inputStyle = {
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "16px",
    outline: "none",
    textAlign: "center",
    fontFamily: "inherit"
  };

  const errorStyle = {
    color: "#dc2626",
    fontSize: "14px",
    textAlign: "center",
    marginTop: "8px"
  };

  const buttonGroupStyle = {
    display: "flex",
    gap: "12px",
    marginTop: "16px"
  };

  const buttonStyle = {
    flex: 1,
    padding: "12px 20px",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease"
  };

  const confirmButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#A2AF9B",
    color: "white"
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db"
  };

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={titleStyle}>{title}</h2>
        
        <form onSubmit={handleSubmit} style={formStyle}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور"
            style={inputStyle}
            autoFocus
          />
          
          {errorMessage && (
            <div style={errorStyle}>{errorMessage}</div>
          )}
          
          <div style={buttonGroupStyle}>
            <button
              type="button"
              onClick={handleClose}
              style={cancelButtonStyle}
            >
              إلغاء
            </button>
            <button
              type="submit"
              style={confirmButtonStyle}
            >
              تأكيد
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}