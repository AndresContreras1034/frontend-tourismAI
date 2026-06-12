import { useState } from "react";

export default function MfaVerify({ userId, onSuccess }) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================
  // 🔐 VERIFICAR MFA LOGIN
  // =========================
  const handleVerify = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        "http://localhost:3000/mfa/verify-login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            token,
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error("Código inválido");
      }

      // ✔ login MFA correcto
      onSuccess(data);
    } catch (err) {
      setError("Código incorrecto, intenta nuevamente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mfa-verify-card">
      <h2>🔐 Verificación en dos pasos</h2>

      <p>Ingresa el código de tu app autenticadora</p>

      <input
        type="text"
        placeholder="000000"
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />

      <button onClick={handleVerify} disabled={loading}>
        {loading ? "Verificando..." : "Verificar"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}