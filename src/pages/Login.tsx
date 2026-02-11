import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");

    const res = await fetch(
      "http://localhost/gudang-api/login.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      setError(data.message);
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-6 rounded w-80 shadow">
        <h1 className="text-lg font-bold mb-4 text-center">
          Login Sistem Gudang
        </h1>

        {error && (
          <p className="text-red-500 text-xs mb-2">
            {error}
          </p>
        )}

        <input
          className="border p-2 w-full mb-2 text-sm"
          placeholder="Username"
          onChange={e => setUsername(e.target.value)}
        />

        <input
          type="password"
          className="border p-2 w-full mb-4 text-sm"
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white w-full py-2 rounded text-sm hover:bg-blue-700"
        >
          Login
        </button>
      </div>
    </div>
  );
}
