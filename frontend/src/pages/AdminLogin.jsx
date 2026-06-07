import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Username i lozinka su obavezni.");
      return;
    }

    localStorage.removeItem("adminToken");
    localStorage.removeItem("isAdminLoggedIn");
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.token) {
        setError(data.message || "Pogrešan username ili lozinka.");
        return;
      }

      localStorage.setItem("adminToken", data.token);
      navigate(location.state?.from || "/admin", { replace: true });
    } catch (_error) {
      setError("Greška pri prijavi. Pokušaj ponovo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>Admin login</h2>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Username
            <input
              style={styles.input}
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              style={styles.input}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <button type="submit" style={styles.button} disabled={submitting}>
            {submitting ? "Prijava..." : "Prijava"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f5f5",
  },
  card: {
    width: "100%",
    maxWidth: "380px",
    padding: "2rem",
    borderRadius: "12px",
    background: "#ffffff",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  },
  title: {
    marginBottom: "1.5rem",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    fontSize: "0.9rem",
    fontWeight: 500,
  },
  input: {
    marginTop: "0.3rem",
    padding: "0.5rem 0.75rem",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "0.95rem",
  },
  button: {
    marginTop: "0.5rem",
    padding: "0.6rem 0.75rem",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.95rem",
    background: "#111827",
    color: "white",
  },
  error: {
    color: "#b91c1c",
    fontSize: "0.85rem",
    marginBottom: "0.5rem",
  },
};
