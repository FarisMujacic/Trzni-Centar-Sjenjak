// src/pages/AdminDashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const handleEditAds = () => {
    navigate("/admin/ads");
  };

  const handleEditStores = () => {
    navigate("/admin/stores");
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("isAdminLoggedIn");
    navigate("/admin/login", { replace: true });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "2.5rem 2rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          width: "100%",
          maxWidth: 420,
          textAlign: "center",
        }}
      >
        <h1 style={{ marginBottom: "1.5rem", fontSize: "1.6rem" }}>
          Admin dashboard
        </h1>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          }}
        >
          <button onClick={handleEditAds} style={buttonStyle}>
            Izmijeni reklamu
          </button>

          <button onClick={handleEditStores} style={buttonStyle}>
            Izmijeni prodavnicu
          </button>
        </div>

        <button
          onClick={handleLogout}
          style={{
            ...buttonStyle,
            background: "#e5e7eb",
            color: "#111827",
          }}
        >
          Odjava
        </button>
      </div>
    </div>
  );
}

const buttonStyle = {
  width: "100%",
  padding: "0.75rem 1rem",
  borderRadius: "10px",
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.95rem",
  background: "#111827",
  color: "#ffffff",
};
