import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

import GreenRackAI from "./GreenRackAI";
import Login from "./Login";



const API_URL = "http://localhost:4000";

function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem("greenrack_token");

      if (!token) {
        setCheckingSession(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          localStorage.removeItem("greenrack_token");
          localStorage.removeItem("greenrack_user");

          setUser(null);
        } else {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Error verificando sesión:", error);

        localStorage.removeItem("greenrack_token");
        localStorage.removeItem("greenrack_user");

        setUser(null);
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const handleLogin = (loggedUser) => {
    setUser(loggedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("greenrack_token");
    localStorage.removeItem("greenrack_user");

    setUser(null);
  };

  if (checkingSession) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0A0F1C",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94A3B8",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 14,
        }}
      >
        Verificando sesión...
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <GreenRackAI
      user={user}
      onLogout={handleLogout}
    />
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);