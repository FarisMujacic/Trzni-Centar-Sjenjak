import React from "react";
import { Navigate, useLocation } from "react-router-dom";

function hasUsableToken(token) {
  if (!token) return false;

  try {
    const payloadPart = token.split(".")[1];
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const payload = JSON.parse(window.atob(normalized));
    return payload.exp && payload.exp * 1000 > Date.now();
  } catch (_error) {
    return false;
  }
}

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("adminToken");

  if (!hasUsableToken(token)) {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("isAdminLoggedIn");
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}
