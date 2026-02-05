import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProductPage } from "./pages/ProductPage";
import { StatusPage } from "./pages/StatusPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProductPage />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
