import { useEffect, useState } from "react";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setUser({});
  }, []);

  if (!user) {
    return <HomePage onGoLogin={() => setUser("login")} />;
  }

  if (user === "login") {
    return <LoginPage onLogin={() => setUser({})} />;
  }

  return <HomePage />;
}

export default App;