import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Activity, ShieldCheck, Cpu, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12 text-center" id="landing-container">
      {/* Brand Header Group */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl"
      >
        <span className="text-xs font-bold tracking-[0.25em] text-cyan-400 uppercase bg-cyan-950/40 px-4 py-1.5 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.1)] inline-block mb-6">
          System Validation Lab
        </span>

        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4">
          MARELLI
        </h1>
        
        <h2 className="text-2xl md:text-4xl font-extrabold text-[#e2e8f0] tracking-tight mb-6 bg-gradient-to-r from-white via-slate-100 to-cyan-200 bg-clip-text text-transparent">
          Laboratory Request Management System
        </h2>

        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Smart platform engineered for managing automotive lab validation, custom testing sequences, and real-time intervention approvals with precision compliance tracking.
        </p>
      </motion.div>

      {/* Button Action Dynamic */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-16"
        id="landing-cta"
      >
        <Link to="/request">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(6,182,212,0.5)" }}
            whileTap={{ scale: 0.98 }}
            className="group px-8 py-4 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-white text-lg font-bold rounded-xl shadow-[0_4px_20px_rgba(6,182,212,0.3)] border border-cyan-300/30 flex items-center space-x-3 transition-all duration-300 cursor-pointer"
          >
            <span>🚀 Start Request</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </motion.button>
        </Link>
      </motion.div>

      {/* Feature Badges Grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full"
        id="landing-grid-features"
      >
        {/* Core pillar 1 */}
        <div className="bg-[#0e1635]/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 mx-auto">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Smart Automations</h3>
          <p className="text-slate-400 text-sm">
            Auto-generate regulatory compliant laboratory sheets with strict chronological tracking records.
          </p>
        </div>

        {/* Core pillar 2 */}
        <div className="bg-[#0e1635]/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Automated Flows</h3>
          <p className="text-slate-400 text-sm">
            Instant email loops and secure token URLs let reviewers confirm or block requests instantly.
          </p>
        </div>

        {/* Core pillar 3 */}
        <div className="bg-[#0e1635]/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4 mx-auto">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Metrics Dashboard</h3>
          <p className="text-slate-400 text-sm">
            Query total workloads, monitor execution times, and export tracking data straight into XLSX.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
