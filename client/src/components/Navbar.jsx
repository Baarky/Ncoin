export default function Navbar() {
  const logout = () => {
    localStorage.removeItem("token");
    location.reload();
  };

  return (
    <div>
      <button onClick={logout}>ログアウト</button>
    </div>
  );
}