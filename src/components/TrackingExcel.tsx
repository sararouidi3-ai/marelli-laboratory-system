import { useEffect, useState } from "react";
import React from "react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";
import { FileSpreadsheet, Download, RefreshCw, Filter, Shield, Calendar, Eye, Search } from "lucide-react";
import { Link } from "react-router-dom";

import { dbService } from "../services/dbService";
import { LabRequest, RequestStatus, RequestType } from "../types";

export default function TrackingExcel() {
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States of search & filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterType, setFilterType] = useState<string>("All");
  const [filterDept, setFilterDept] = useState<string>("All");

  useEffect(() => {
    const unsubscribe = dbService.subscribe((list) => {
      setRequests(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Unique list of departments for dynamic filter
  const departmentsList = Array.from(new Set(requests.map((r) => r.departement).filter(Boolean)));

  // Exporter to XLSX File
  const handleExportXLSX = () => {
    if (requests.length === 0) {
      toast.error("Aucune donnée disponible à l'exportation.");
      return;
    }

    try {
      const formattedData = filteredRequests.map((r) => ({
        "ID Demande": r.id,
        "Demandeur": r.demandeur,
        "Département": r.departement,
        "Référence": r.reference,
        "Type de Demande": r.typeDemande,
        "Date de Demande": r.dateDemande,
        "Statut Actuel": r.statut,
        "Date de Réalisation": r.dateRealisation || "N/A",
        "Temps Passé": r.tempsPasse || "N/A",
        "Réalisé par": r.realisePar || "N/A",
        "Commentaires": r.commentaire || "N/A",
        "Motif Refus": r.motifRefus || "N/A",
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Lab Requests Tracker");

      // Set column widths elegantly
      const maxColLengths = Object.keys(formattedData[0] || {}).map(() => 20);
      worksheet["!cols"] = maxColLengths.map((w) => ({ wch: w }));

      XLSX.writeFile(workbook, `Marelli_Lab_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Registre exporté sous Excel (.xlsx) avec succès !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur d'exportation Excel.");
    }
  };

  // Perform client filters
  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.demandeur.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.objet.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "All" || r.statut === filterStatus;
    const matchesType = filterType === "All" || r.typeDemande === filterType;
    const matchesDept = filterDept === "All" || r.departement === filterDept;

    return matchesSearch && matchesStatus && matchesType && matchesDept;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" id="tracking-excel-view">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="text-cyan-400 w-8 h-8" />
            Suivi & Registre Officiel
          </h2>
          <p className="text-slate-400 text-sm">Consultez en temps réel l'ensemble des essais laboratoire et exportez l'historique excel.</p>
        </div>

        {/* Export Button Excel */}
        <button
          onClick={handleExportXLSX}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl font-bold text-sm shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Exporter Excel (.xlsx)</span>
        </button>
      </div>

      {/* Advanced Filters Block */}
      <div className="bg-[#0b132e]/70 border border-slate-800 rounded-2xl p-4 mb-6 shadow-md shadow-black/40">
        <div className="flex items-center gap-2 mb-3 text-cyan-400 font-bold text-sm border-b border-slate-800 pb-2">
          <Filter className="w-4 h-4" /> Filtrer & Rechercher
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Chercher ID, demandeur, pièce..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#060a1f] border border-slate-800 text-white text-sm rounded-lg focus:border-cyan-400 focus:outline-none placeholder:text-slate-500"
            />
          </div>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 bg-[#060a1f] border border-slate-800 text-white text-sm rounded-lg focus:border-cyan-400 focus:outline-none cursor-pointer"
          >
            <option value="All">Tous les Statuts</option>
            <option value="En attente">En attente</option>
            <option value="Acceptée">Acceptée</option>
            <option value="Refusée">Refusée</option>
          </select>

          {/* Filter Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 bg-[#060a1f] border border-slate-800 text-white text-sm rounded-lg focus:border-cyan-400 focus:outline-none cursor-pointer"
          >
            <option value="All">Tous les Types</option>
            <option value="Essai">🔬 Essai</option>
            <option value="Intervention">🛠️ Intervention</option>
          </select>

          {/* Filter Department */}
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-full px-3 py-2 bg-[#060a1f] border border-slate-800 text-white text-sm rounded-lg focus:border-cyan-400 focus:outline-none cursor-pointer"
          >
            <option value="All">Tous les Départements</option>
            {departmentsList.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table Interface */}
      <div className="bg-[#0b132e]/90 border border-cyan-500/10 rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
            <span className="text-slate-400 text-sm mt-4 font-medium">Chargement du registre en cours...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-slate-400 text-sm mb-2">Aucune demande ne correspond à vos filtres de recherche.</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("All");
                setFilterType("All");
                setFilterDept("All");
              }}
              className="text-xs text-cyan-400 hover:underline font-bold"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#05091c]/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-cyan-500/10">
                <tr>
                  <th className="px-6 py-4">ID Demande</th>
                  <th className="px-6 py-4">Demandeur</th>
                  <th className="px-6 py-4">Département</th>
                  <th className="px-6 py-4">Référence</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Date Demande</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                <AnimatePresence>
                  {filteredRequests.map((r) => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-800/30 transition-all group"
                    >
                      <td className="px-6 py-4 font-mono text-cyan-400 font-semibold selection:bg-cyan-500/20">
                        {r.id}
                      </td>
                      <td className="px-6 py-4 text-white font-semibold">
                        {r.demandeur}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {r.departement}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">
                        {r.reference}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className={`px-2 py-1 rounded-md ${
                          r.typeDemande === "Essai"
                            ? "bg-cyan-950/40 text-cyan-400 border border-cyan-500/20"
                            : "bg-teal-950/40 text-teal-400 border border-teal-500/20"
                        }`}>
                          {r.typeDemande}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 inline" /> {r.dateDemande}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-bold ${
                          r.statut === "Acceptée"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                            : r.statut === "Refusée"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.15)]"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.155)] animate-pulse"
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            r.statut === "Acceptée" ? "bg-emerald-400" : r.statut === "Refusée" ? "bg-rose-400" : "bg-amber-400"
                          }`} />
                          {r.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          {/* Page Approve link */}
                          <Link
                            to={`/approve/${r.id}`}
                            className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500 hover:text-white transition-all"
                            title="Consulter / Décider"
                          >
                            <Shield className="w-4 h-4" />
                          </Link>
                          {/* Search Detail link */}
                          <Link
                            to={`/tracking?searchId=${r.id}`}
                            className="p-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-all"
                            title="Suivi de statut"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
