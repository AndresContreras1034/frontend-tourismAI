import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./Home.css";

import Navbar from "../../components/navbar/Navbar";
import Hero from "../../components/hero/Hero";
import Features from "../../components/features/Features";
import Footer from "../../components/footer/Footer";
import SeguridadDashboard from "../../components/dashboard/SeguridadDashboard";

export default function Home() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target) {
        requestAnimationFrame(() =>
          target.scrollIntoView({ behavior: "smooth", block: "start" })
        );
        return;
      }
    }

    if (location.state?.fromChat) {
      document.querySelector(".hero")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location]);

  return (
    <div className="home">
      <Navbar expoMode />
      <main className="home__main">
        <Hero />
        <SeguridadDashboard />
        <Features />
      </main>
      <Footer expoMode />
    </div>
  );
}