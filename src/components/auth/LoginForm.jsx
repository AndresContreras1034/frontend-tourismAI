import { useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { loginUser, verifyMfaLogin } from "../../services/auth.service";
import { AuthContext } from "../../context/AuthContext";

import "./Login.css";
import MfaQRModal from "../../components/mfa/MfaQrModal";

// ==============================
// 🔐 VALIDATORS
// ==============================
const validateEmail = (email) => {
  const value = email.trim().toLowerCase();

  if (!value) return "El correo es obligatorio";

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(value)) return "Correo inválido";

  return "";
};

const validatePassword = (password) => {
  if (!password) return "La contraseña es obligatoria";
  if (password.length < 6) return "Mínimo 6 caracteres";
  return "";
};

const validateMfaCode = (code) => {
  if (!code) return "Ingresa el código MFA";

  if (!/^\d{6}$/.test(code)) {
    return "El código debe tener 6 dígitos";
  }

  return "";
};

// ==============================
// 🚀 COMPONENT
// ==============================
export default function LoginForm() {
  const navigate = useNavigate();
  const { login, completeMfaLogin } = useContext(AuthContext);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ==============================
  // 🔐 MFA STATE
  // ==============================
  const [mfaUserId, setMfaUserId] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [mfaCode, setMfaCode] = useState("");

  // ==============================
  // 🧠 MEMO EMAIL NORMALIZADO
  // ==============================
  const normalizedEmail = useMemo(
    () => form.email.trim().toLowerCase(),
    [form.email]
  );

  // ==============================
  // ✍️ INPUT CHANGE
  // ==============================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ==============================
  // 🔑 LOGIN
  // ==============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return; // 🛑 anti double submit

    const emailError = validateEmail(form.email);
    const passwordError = validatePassword(form.password);

    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError,
      });
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const response = await loginUser({
        email: normalizedEmail,
        password: form.password,
      });

      if (!response) {
        throw new Error("Respuesta inválida del servidor");
      }

      console.log("📦 LOGIN RESPONSE:", response);

      // =========================
      // 🔐 MFA FLOW
      // =========================
      if (response.requiresMFA) {
        const userId = response.userId;

        if (!userId) {
          throw new Error("MFA inválido: falta userId");
        }

        // 🔥 TEMP TOKEN SAFE HANDLING
        if (response.tempToken) {
          localStorage.setItem("token", response.tempToken);
        }

        sessionStorage.setItem("mfa_userId", userId);

        setMfaUserId(userId);
        setShowQR(true);

        return;
      }

      // =========================
      // 🟢 NORMAL LOGIN
      // =========================
      if (!response.token) {
        throw new Error("Token inválido");
      }

      login(response);
      localStorage.setItem("token", response.token);

      navigate("/");
    } catch (error) {
      setErrors({
        general:
          error?.response?.data?.message ||
          error?.message ||
          "Error de login",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // 🔐 VERIFY MFA
  // ==============================
  const handleVerify = async (e) => {
    e.preventDefault();

    if (loading) return;

    const codeError = validateMfaCode(mfaCode);

    if (codeError) {
      setErrors({ general: codeError });
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const userId = mfaUserId || sessionStorage.getItem("mfa_userId");

      if (!userId) {
        throw new Error("Sesión MFA inválida");
      }

      const response = await verifyMfaLogin({
        userId,
        token: mfaCode,
      });

      if (!response?.token) {
        throw new Error("Respuesta MFA inválida");
      }

      console.log("🟢 MFA VERIFIED:", response);

      completeMfaLogin(response);

      localStorage.setItem("token", response.token);

      // cleanup seguro
      sessionStorage.removeItem("mfa_userId");

      setShowVerify(false);
      setShowQR(false);

      navigate("/");
    } catch (error) {
      setErrors({
        general:
          error?.response?.data?.message ||
          error?.message ||
          "Código MFA inválido",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // 🎨 UI
  // ==============================
  return (
    <div className="login-wrapper">
      {/* =========================
          🔐 QR MODAL
      ========================= */}
      {showQR && (
        <MfaQRModal
          isOpen={showQR}
          userId={mfaUserId}
          onClose={() => {
            setShowQR(false);
            setShowVerify(true);
          }}
        />
      )}

      {/* =========================
          🔐 VERIFY MFA
      ========================= */}
      {showVerify && (
        <div className="mfa-modal">
          <form onSubmit={handleVerify}>
            <h2>Verificación MFA</h2>

            {errors.general && (
              <div className="error-box">{errors.general}</div>
            )}

            <input
              value={mfaCode}
              onChange={(e) => {
                setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                if (errors.general) {
                  setErrors({});
                }
              }}
              placeholder="Código 6 dígitos"
              inputMode="numeric"
            />

            <button disabled={loading}>
              {loading ? "Verificando..." : "Verificar"}
            </button>
          </form>
        </div>
      )}

      {/* =========================
          🔑 LOGIN FORM
      ========================= */}
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>

        {errors.general && (
          <div className="error-box">{errors.general}</div>
        )}

        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          autoComplete="email"
        />
        {errors.email && <span className="error">{errors.email}</span>}

        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Password"
          autoComplete="current-password"
        />
        {errors.password && (
          <span className="error">{errors.password}</span>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Cargando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}