import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { verifyToken } from "./api/auth";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import QuestPage from "./pages/QuestPage";

// ↑ QuestPageのimportを削除

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const result = await verifyToken(token);
        if (result.success) {
          setUser(result.user);
        } else {
          localStorage.removeItem("token");
          setUser(null);
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };
  if (loading) return <div>読み込み中...</div>;
  return (
    <Routes>
      <Route
        path="/login"
        element={
          user
            ? <Navigate to="/" />
            : <LoginPage onLogin={(userData) => setUser(userData)} />
        }
      />
      <Route
        path="/"
        element={
          user
            ? <HomePage onLogout={handleLogout} />
            : <Navigate to="/login" />
        }
      />
    </Routes>
  );
}
export default App;