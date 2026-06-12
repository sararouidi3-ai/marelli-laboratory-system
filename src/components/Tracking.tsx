import { useState, useEffect } from "react";
import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";
import { Search, Info, HelpCircle, Shield, Check, Clock, X, Eye } from "lucide-react";

import { dbService } from "../services/dbService";
import { LabRequest } from "../types";

export default function Tracking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlSearchId = searchParams.get("searchId");

  const [searchId, setSearchId] = useState(urlSearchId || "");
  const [request, setRequest] = useState<LabRequest | null>(null);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);

  // Trigger search if url contains searchId param
  useEffect(() => {
    if (urlSearchId) {
      handleSearch(urlSearchId);
    }
  }, [urlSearchId]);

  const handleSearchClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) {
      toast.error("Veuillez saisir un numéro de demande.");
      return;
    }
    // Set query string in URL for shareable link
    navigate(`/tracking?searchId=${searchId.trim()}`);
  };

  const handleSearch = async (targetId: string) => {
    setSearching(true);
    setRequest(null);
    setSearched(true);

    try {
      const found = await dbService.getRequest(targetId.trim().toUpperCase());

      if (found) {
        setRequest(found);
      } else {
        toast.error("ID de demande inconnu.");
      }
    } catch (error) {
      toast.error("Erreur lors de la recherche.");
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" id="tracking-search-view">
      {/* Title */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
          <Search className="w-8 h-8 text-cyan-400" /> Suivi de Demande Public
        </h2>
        <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
          Saisissez votre code d'essai unique `LAB-AAAA-MM-JJ-XXX` pour suivre instantanément l'état d'approbation et obtenir le rapport final.
        </p>
      </div>

      {/* Search Input Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0b132e]/85 border border-slate-800 rounded-2xl p-5 mb-8 shadow-xl"
      >
        <form onSubmit={handleSearchClick} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Saisir ID, ex: LAB-2026-06-03-001"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#060a1f] border border-slate-700 text-white rounded-xl focus:border-cyan-400 focus:outline-none placeholder:text-slate-600 font-mono text-sm uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {searching ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Rechercher"
            )}
          </button>
        </form>
      </motion.div>

      {/* Results Dashboard or Empty state */}
      <AnimatePresence mode="wait">
        {searching && (
          <div className="flex justify-center items-center py-12" key="searching_loader">
            <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!searching && searched && !request && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#1f1315]/40 border border-rose-500/10 rounded-xl p-6 text-center text-rose-300"
            key="not_found_card"
          >
            <HelpCircle className="w-10 h-10 mx-auto text-rose-400 mb-2" />
            <p className="font-semibold text-sm">Aucun essai référencé sous cet identifiant.</p>
            <p className="text-xs text-rose-400/70 mt-1">Vérifiez les traits d'union, l'orthographe du numéro de lot ou retournez au Registre.</p>
          </motion.div>
        )}

        {!searching && request && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-[#0b132e]/90 border border-cyan-500/10 rounded-2xl p-6 shadow-2xl"
            key="result_card"
          >
            {/* Upper Badge Panel */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-500/10 pb-5 mb-6">
              <div>
                <span className="text-xs text-cyan-400 font-extrabold uppercase tracking-wide">État de validation</span>
                <h3 className="text-xl font-bold font-mono text-white mt-1 uppercase selection:bg-cyan-500/20">{request.id}</h3>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  request.statut === "Acceptée"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]"
                    : request.statut === "Refusée"
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.1)]"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)] animate-pulse"
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    request.statut === "Acceptée" ? "bg-emerald-400" : request.statut === "Refusée" ? "bg-rose-400" : "bg-amber-400"
                  }`} />
                  {request.statut}
                </span>

                <button
                  onClick={() => navigate(`/approve/${request.id}`)}
                  className="px-3 py-1.5 bg-cyan-700/20 hover:bg-cyan-600/30 text-cyan-400 rounded-lg text-xs font-semibold flex items-center gap-1 border border-cyan-500/10"
                  title="Ouvrir la page de traitement"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Traiter</span>
                </button>
              </div>
            </div>

            {/* Workflow Step Tracker */}
            <div className="mb-8" id="tracking-stepper">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Chronologie du Workflow</span>
              
              <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
                
                {/* Step 1: Submission */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0a0f24] flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                  <div className="text-sm">
                    <h5 className="font-bold text-white text-sm">Demande Initialisée & Numérotée</h5>
                    <p className="text-slate-400 text-xs mt-0.5">La demande a été rédigée avec succès le {request.dateDemande} par {request.demandeur}.</p>
                  </div>
                </div>

                {/* Step 2: System Routing / Pending Review */}
                <div className="relative">
                  <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#0a0f24] ${
                    request.statut !== "En attente"
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }`}>
                    {request.statut !== "En attente" ? (
                      <Check className="w-2.5 h-2.5 text-white" />
                    ) : (
                      <Clock className="w-2.5 h-2.5 text-white animate-spin" />
                    )}
                  </div>
                  <div className="text-sm">
                    <h5 className="font-bold text-white text-sm">Consultation Reviewer</h5>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Rapport assigné à <span className="text-cyan-400 font-semibold">{request.destinataire}</span> pour décision technique.
                    </p>
                  </div>
                </div>

                {/* Step 3: Approval Decision Result */}
                <div className="relative">
                  <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-[#0a0f24] ${
                    request.statut === "Acceptée"
                      ? "bg-emerald-500"
                      : request.statut === "Refusée"
                      ? "bg-rose-500"
                      : "bg-slate-800"
                  }`} />
                  <div className="text-sm">
                    <h5 className="font-bold text-white text-sm">
                      {request.statut === "Acceptée" && "Validation accordée pour essais"}
                      {request.statut === "Refusée" && "Rapport rejeté / Non Conforme"}
                      {request.statut === "En attente" && "Décision finale en attente"}
                    </h5>
                    {request.statut === "Acceptée" && (
                      <div className="mt-2 text-xs bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10 text-slate-300 space-y-1">
                        <div><strong className="text-emerald-400">Date exécution :</strong> {request.dateRealisation}</div>
                        <div><strong className="text-emerald-400">Temps passé :</strong> {request.tempsPasse}</div>
                        <div><strong className="text-emerald-400">Opérateur :</strong> {request.realisePar}</div>
                        {request.commentaire && <div><strong className="text-emerald-400">Commentaire :</strong> {request.commentaire}</div>}
                      </div>
                    )}
                    {request.statut === "Refusée" && (
                      <div className="mt-2 text-xs bg-rose-500/5 p-3 rounded-lg border border-rose-500/10 text-rose-300">
                        <strong>Motif de refus : </strong> {request.motifRefus || "Non spécifié."}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Quick specifications breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-cyan-500/10 pt-5 text-sm mb-2">
              <div className="flex gap-2">
                <Shield className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <span className="block text-slate-400 text-xs font-bold uppercase">Cahier des charges</span>
                  <span className="text-white text-xs line-clamp-2 mt-0.5 font-light">{request.objet}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Info className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <span className="block text-slate-400 text-xs font-bold uppercase">Référence technique</span>
                  <span className="text-slate-300 font-mono text-xs">{request.reference}</span>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
