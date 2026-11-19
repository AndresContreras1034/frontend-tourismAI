import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiUserPlus } from "react-icons/fi";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";
import "./Expo.css";

export default function ExpoRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "" });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (name.length < 2) {
      setError("Escribe tu nombre para continuar.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Escribe un correo válido.");
      return;
    }

    try {
      localStorage.setItem(
        "expo-demo-profile",
        JSON.stringify({ name, email, createdAt: new Date().toISOString() })
      );
    } catch (storageError) {
      console.error("No se pudo guardar el perfil de muestra.", storageError);
      setError("El navegador no permitió guardar el perfil en este dispositivo.");
      return;
    }

    navigate("/expo");
  };

  return (
    <div className="expo-page">
      <Navbar expoMode />
      <main className="expo-register-main">
        <section className="expo-register-card">
          <span className="expo-register-icon"><FiUserPlus aria-hidden="true" /></span>
          <span className="expo-eyebrow">EXPO · INGENIERÍA</span>
          <h1>Crea tu perfil de muestra</h1>
          <p>
            Un registro corto para personalizar el saludo. No necesitas
            contraseña ni iniciar sesión.
          </p>

          <form className="expo-register-form" onSubmit={handleSubmit}>
            <label htmlFor="expo-name">Nombre</label>
            <input
              id="expo-name"
              name="name"
              autoComplete="name"
              maxLength={60}
              value={form.name}
              onChange={handleChange}
              required
            />
            <label htmlFor="expo-email">Correo electrónico</label>
            <input
              id="expo-email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={150}
              value={form.email}
              onChange={handleChange}
              required
            />
            {error && <p className="expo-register-error" role="alert">{error}</p>}
            <button className="expo-submit-button" type="submit">
              Guardar perfil y entrar
            </button>
          </form>

          <p className="expo-privacy-note">
            El perfil se guarda solo en este navegador. No crea una cuenta real
            ni otorga permisos de administración.
          </p>
          <Link className="expo-back-link" to="/expo">
            <FiArrowLeft aria-hidden="true" /> Volver al panel sin registrarme
          </Link>
        </section>
      </main>
      <Footer expoMode />
    </div>
  );
}
