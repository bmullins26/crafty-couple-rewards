import React, { useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import LandingPage from "@/pages/LandingPage";
import CustomerDashboard from "@/pages/CustomerDashboard";
import AdminPanel from "@/pages/AdminPanel";

function App() {
  return (
    <div className="app-container">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard/:customerId" element={<CustomerDashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </BrowserRouter>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#1A1A1A',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            color: '#F5F5DC',
          },
        }}
      />
    </div>
  );
}

export default App;
