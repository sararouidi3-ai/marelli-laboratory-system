import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import BackgroundAnimation from "./components/BackgroundAnimation";
import Landing from "./components/Landing";
import RequestForm from "./components/RequestForm";
import Tracking from "./components/Tracking";
import TrackingExcel from "./components/TrackingExcel";
import AdminDashboard from "./components/AdminDashboard";
import ApproveRequest from "./components/ApproveRequest";

export default function App() {
  return (
    <Router>
      <div className="relative min-h-screen text-slate-100 flex flex-col font-sans selection:bg-cyan-500/35 selection:text-white">
        
        {/* Core Premium Industrial Animated Background */}
        <BackgroundAnimation />

        {/* Global Toaster for notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#080c21",
              color: "#e2e8f0",
              border: "1px solid rgba(6, 182, 212, 0.25)",
              fontSize: "14px",
              fontWeight: 500,
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#f43f5e",
                secondary: "#fff",
              },
            },
          }}
        />

        {/* Dynamic Glassmorphic Navbar */}
        <Navbar />

        {/* Main Content Routers */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/request" element={<RequestForm />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/admin-excel" element={<TrackingExcel />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/approve/:id" element={<ApproveRequest />} />
            <Route path="/approve" element={<ApproveRequest />} />
            <Route path="/reject/:id" element={<ApproveRequest />} />
            <Route path="/reject" element={<ApproveRequest />} />
            <Route path="/decision/:id" element={<ApproveRequest />} />
            <Route path="/decision" element={<ApproveRequest />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
