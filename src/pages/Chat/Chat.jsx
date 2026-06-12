import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./Chat.css";

// 🔝 GLOBAL LAYOUT
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";

// 🤖 AVATAR LOCAL (TU IMAGEN)
import botAvatar from "../../assets/bot.png";

export default function Chat() {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  // 🧠 Mensaje inicial si viene desde Hero
  useEffect(() => {
    if (searchParams.get("start")) {
      setMessages([
        {
          from: "bot",
          text: "Hola, soy Carlos 🤖 ¿Qué plan estás buscando hoy?",
        },
      ]);
    }
  }, [searchParams]);

  // 🔽 Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 📩 Enviar mensaje
  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = {
      from: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // 🤖 respuesta simulada
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Déjame pensar 🤔... tengo algo brutal para ti 🔥",
        },
      ]);
    }, 800);
  };

  // ⌨️ Enter para enviar
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <>
      {/* 🔝 NAVBAR */}
      <Navbar />

      {/* 💬 CHAT APP */}
      <div className="chat-page">

        {/* HEADER */}
        <div className="chat-header">
          <div className="chat-avatar">
            <img src={botAvatar} alt="Carlos IA" />
          </div>

          <div className="chat-header-info">
            <h2>Carlos</h2>
            <span className="chat-status">En línea</span>
          </div>
        </div>

        {/* MENSAJES */}
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-row ${msg.from}`}>
              <div className="chat-bubble">{msg.text}</div>
            </div>
          ))}

          <div ref={chatEndRef} />
        </div>

        {/* INPUT */}
        <div className="chat-input">
          <input
            type="text"
            placeholder="Escribe un mensaje... 💬"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button onClick={handleSend} className="send-btn">
            →
          </button>
        </div>

      </div>

      {/* 🔻 FOOTER */}
      <Footer />
    </>
  );
}