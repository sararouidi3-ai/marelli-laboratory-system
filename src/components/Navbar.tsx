import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Landmark, FileSpreadsheet, Search, BarChart3, PlusCircle } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: "Accueil", path: "/", icon: Landmark },
    { name: "Nouvelle Demande", path: "/request", icon: PlusCircle },
    { name: "Suivi Public", path: "/tracking", icon: Search },
    { name: "Registre & Excel", path: "/admin-excel", icon: FileSpreadsheet },
    { name: "Dashboard Admin", path: "/admin", icon: BarChart3 },
  ];

  const currentPath = location.pathname;

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0f2a]/60 backdrop-blur-md border-b border-cyan-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Brand */}
          <Link to="/" className="flex items-center space-x-2 text-white group" id="nav-brand-logo">
            <span className="text-xl font-black tracking-widest bg-gradient-to-r from-blue-400 via-cyan-400 to-white bg-clip-text text-transparent group-hover:from-white group-hover:to-cyan-400 transition-all duration-300">
              MARELLI
            </span>
            <div className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-xs font-semibold uppercase text-cyan-500/80 tracking-wider hidden sm:inline border-l border-cyan-500/20 pl-2">
              Laboratory Request
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-1" id="nav-desktop-menu">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium tracking-wide transition-all duration-200 ${
                    isActive
                      ? "text-cyan-400"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNavBg"
                      className="absolute inset-0 bg-cyan-500/10 border border-cyan-500/20 rounded-lg -z-10 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden" id="nav-mobile-hamburger">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-cyan-500/20 focus:outline-none transition-all"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu, show/hide based on menu state */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-[#070b20]/95 border-b border-cyan-500/25 backdrop-blur-lg"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium transition-all ${
                      isActive
                        ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                        : "text-gray-300 hover:bg-cyan-500/5 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5 text-cyan-400" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
