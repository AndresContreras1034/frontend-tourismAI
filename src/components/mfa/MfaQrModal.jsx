import { useState, useEffect, useRef } from "react";
import "./MfaQRModal.css";

export default function MfaQRModal({ isOpen, onClose, userId }) {
  const [qrData, setQrData] = useState(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const hasLoaded = useRef(false);

  if (!isOpen) return null;

  // =========================
  // 🔐 GENERAR QR (SIN JWT - FIX REAL)
  // =========================
  const generateQR = async () => {
    try {
      setLoading(true);
      setError("");

      if (!userId) {
        throw new Error("No hay userId MFA");
      }

      console.log("🧪 [MFA] Generando QR para:", userId);

      const res = await fetch(`${API}/mfa/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      console.log("📦 [MFA SETUP RESPONSE]:", data);

      if (!res.ok || !data?.data) {
        throw new Error(data?.message || "Error generando MFA");
      }

      setQrData(data.data);
      setStep(2);

    } catch (err) {
      console.error("❌ ERROR QR:", err);
      setError(err.message || "No se pudo generar el QR");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 🔐 VERIFICAR TOKEN
  // =========================
const verifyToken = async () => {
  try {
    setLoading(true);
    setError("");

    const tokenJWT = localStorage.getItem("token");

    if (!tokenJWT) {
      throw new Error("No hay sesión activa");
    }

    console.log("🔐 VERIFY MFA:", token);

    const res = await fetch(`${API}/mfa/verify-setup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenJWT}`, // 🔥 ESTE ERA EL FALLO
      },
      body: JSON.stringify({ token }),
    });

    const data = await res.json();

    console.log("📦 VERIFY RESPONSE:", data);

    if (!res.ok || !data?.success) {
      throw new Error(data?.message || "Código inválido");
    }

    setStep(3);

  } catch (err) {
    console.error("❌ VERIFY ERROR:", err);
    setError(err.message || "Código inválido");
  } finally {
    setLoading(false);
  }
};

  // =========================
  // 🚀 CONTROL DE RENDER
  // =========================
  useEffect(() => {
    if (isOpen && step === 1 && !hasLoaded.current) {
      hasLoaded.current = true;
      generateQR();
    }

    if (!isOpen) {
      hasLoaded.current = false;
      setStep(1);
      setQrData(null);
      setToken("");
      setError("");
    }
  }, [isOpen]);

  // =========================
  // UI
  // =========================
  return (
    <div className="mfa-overlay">
      <div className="mfa-modal">

        <h2>🔐 Configuración MFA</h2>

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <p>Generando autenticador...</p>
            {loading && <p>⏳ Creando QR...</p>}
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <p>Escanea este QR con Google Authenticator</p>

            {qrData?.qrCode ? (
              <img
                src={qrData.qrCode}
                alt="MFA QR"
                style={{ width: 200, height: 200 }}
              />
            ) : (
              <p style={{ color: "orange" }}>⚠️ QR no disponible</p>
            )}

            {qrData?.secret && (
              <p style={{ fontSize: 12 }}>
                🔑 Backup: <b>{qrData.secret}</b>
              </p>
            )}

            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Código 6 dígitos"
            />

            <button onClick={verifyToken} disabled={loading}>
              {loading ? "Verificando..." : "Verificar"}
            </button>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <h3>✅ MFA activado correctamente</h3>
            <button onClick={onClose}>Cerrar</button>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <p style={{ color: "red" }}>{error}</p>
        )}

        <button onClick={onClose}>✕ Cerrar</button>

      </div>
    </div>
  );
}