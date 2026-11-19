import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "../pages/Home/Home";
import ExpoDashboard from "../pages/Expo/ExpoDashboard";

import ScrollToTop from "../utils/ScrollToTop";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/expo" element={<ExpoDashboard />} />
        <Route path="*" element={<Navigate to="/expo" replace />} />
      </Routes>
    </BrowserRouter>
  );
}