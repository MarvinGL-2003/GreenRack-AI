import React, { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Cpu,
  AlertCircle,
} from "lucide-react";

const API_URL = "http://localhost:4000";

const C = {
  bg: "#0A0F1C",
  panel: "#131B2E",
  panelLight: "#182238",
  border: "#26324A",
  text: "#F1F5F9",
  textSecondary: "#94A3B8",
  green: "#22C55E",
  greenDark: "#16A34A",
  red: "#EF4444",
};

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Ingresa tu correo electrónico y contraseña.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "No fue posible iniciar sesión."
        );
      }

      // Guardar sesión
      localStorage.setItem("greenrack_token", data.token);
      localStorage.setItem(
        "greenrack_user",
        JSON.stringify(data.user)
      );

      // Avisar al componente principal
      if (onLogin) {
        onLogin(data.user);
      }
    } catch (err) {
      setError(
        err.message || "Ocurrió un error al iniciar sesión."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
        }}
      >
        {/* LOGO */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              margin: "0 auto 14px",
              borderRadius: 14,
              background: `linear-gradient(135deg, ${C.green}, ${C.greenDark})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 30px rgba(34, 197, 94, 0.18)",
            }}
          >
            <Cpu size={30} color="#FFFFFF" />
          </div>

          <h1
            style={{
              margin: 0,
              color: C.text,
              fontSize: 27,
              fontWeight: 800,
              letterSpacing: "-0.5px",
            }}
          >
            GreenRack AI
          </h1>

          <p
            style={{
              margin: "7px 0 0",
              color: C.textSecondary,
              fontSize: 14,
            }}
          >
            Plataforma inteligente de monitoreo
          </p>
        </div>

        {/* LOGIN CARD */}
        <div
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 30,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.28)",
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <h2
              style={{
                margin: 0,
                color: C.text,
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              Iniciar sesión
            </h2>

            <p
              style={{
                margin: "6px 0 0",
                color: C.textSecondary,
                fontSize: 13,
              }}
            >
              Accede al panel de control de GreenRack AI
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                background: "rgba(239, 68, 68, 0.10)",
                border: "1px solid rgba(239, 68, 68, 0.30)",
                borderRadius: 10,
                padding: "11px 12px",
                marginBottom: 18,
                color: "#FCA5A5",
                fontSize: 13,
              }}
            >
              <AlertCircle
                size={18}
                style={{
                  flexShrink: 0,
                  marginTop: 1,
                }}
              />

              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* EMAIL */}
            <div style={{ marginBottom: 18 }}>
              <label
                style={{
                  display: "block",
                  color: C.text,
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                Correo electrónico
              </label>

              <div style={{ position: "relative" }}>
                <Mail
                  size={18}
                  color={C.textSecondary}
                  style={{
                    position: "absolute",
                    left: 13,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@greenrack.local"
                  autoComplete="email"
                  disabled={loading}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: C.panelLight,
                    border: `1px solid ${C.border}`,
                    borderRadius: 9,
                    padding: "12px 13px 12px 42px",
                    color: C.text,
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  color: C.text,
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                Contraseña
              </label>

              <div style={{ position: "relative" }}>
                <Lock
                  size={18}
                  color={C.textSecondary}
                  style={{
                    position: "absolute",
                    left: 13,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  disabled={loading}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: C.panelLight,
                    border: `1px solid ${C.border}`,
                    borderRadius: 9,
                    padding: "12px 45px 12px 42px",
                    color: C.text,
                    fontSize: 14,
                    outline: "none",
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: C.textSecondary,
                    cursor: "pointer",
                    padding: 5,
                    display: "flex",
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 9,
                padding: "13px 16px",
                background: loading
                  ? "#166534"
                  : C.green,
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                transition: "all 0.2s ease",
                boxShadow: loading
                  ? "none"
                  : "0 6px 20px rgba(34, 197, 94, 0.16)",
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid rgba(255,255,255,0.35)",
                      borderTopColor: "#FFFFFF",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />

                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Iniciar sesión
                </>
              )}
            </button>
          </form>
        </div>

        {/* FOOTER */}
        <div
          style={{
            textAlign: "center",
            marginTop: 18,
            color: "#64748B",
            fontSize: 11,
          }}
        >
          GreenRack AI · Monitoreo inteligente de infraestructura
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          input::placeholder {
            color: #64748B;
          }

          input:focus {
            border-color: #22C55E !important;
            box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.08);
          }

          button:hover:not(:disabled) {
            filter: brightness(1.08);
          }
        `}
      </style>
    </div>
  );
}