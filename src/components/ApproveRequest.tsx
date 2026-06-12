import { useEffect, useState } from "react";
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, ShieldAlert, Cpu, Calendar, Clock, UserCheck, MessageSquare, ArrowLeft } from "lucide-react";

import { dbService } from "../services/dbService";
import { sendApprovalConfirmation } from "../emailjs";
import { LabRequest } from "../types";

export default function ApproveRequest() {
  const { id: pathId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [request, setRequest] = useState<LabRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Extract ID from path param or query parameter names (requestId, request_id, id)
  const [targetId, setTargetId] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const qId = urlParams.get("requestId") || urlParams.get("request_id") || urlParams.get("id");
    const resolvedId = qId || pathId || "";
    console.log("Received Request ID:", resolvedId);
    return resolvedId;
  });
  
  // Selection of decision: "accept" | "reject" | null
  const [decision, setDecision] = useState<"accept" | "reject" | null>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const actionParam = urlParams.get("action") || urlParams.get("decision");
      if (actionParam === "accept" || actionParam === "approve" || actionParam === "accepter") {
        return "accept";
      }
      if (actionParam === "reject" || actionParam === "decline" || actionParam === "refuse" || actionParam === "refuser") {
        return "reject";
      }
      // Check if path is routing to /reject
      const path = window.location.pathname.toLowerCase();
      if (path.includes("reject")) {
        return "reject";
      }
      if (path.includes("approve")) {
        // If there's an action search param, it handles it, otherwise default to null
      }
    } catch (e) {
      console.error("Error parsing window search params:", e);
    }
    return null;
  });

  // Keep search param and path in sync
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const qId = urlParams.get("requestId") || urlParams.get("request_id") || urlParams.get("id");
      const resolvedId = qId || pathId || "";
      if (resolvedId && resolvedId !== targetId) {
        console.log("Received Request ID:", resolvedId);
        setTargetId(resolvedId);
      }

      const actionParam = urlParams.get("action") || urlParams.get("decision");
      if (actionParam === "accept" || actionParam === "approve" || actionParam === "accepter") {
        setDecision("accept");
      } else if (actionParam === "reject" || actionParam === "decline" || actionParam === "refuse" || actionParam === "refuser") {
        setDecision("reject");
      } else {
        const path = window.location.pathname.toLowerCase();
        if (path.includes("reject")) {
          setDecision("reject");
        }
      }
    } catch (e) {
      console.error("Error in action param sync:", e);
    }
  }, [pathId, window.location.search, window.location.pathname]);

  // Form states - Accept case
  const [dateRealisation, setDateRealisation] = useState(new Date().toISOString().split("T")[0]);
  const [tempsPasse, setTempsPasse] = useState("");
  const [realisePar, setRealisePar] = useState("");
  const [commentaire, setCommentaire] = useState("");

  // Form states - Reject case
  const [motifRefus, setMotifRefus] = useState("");

  useEffect(() => {
    if (!targetId) {
      setLoading(false);
      return;
    }

    const fetchRequest = async () => {
      setLoading(true);
      console.log("Searching Request:", targetId);
      try {
        const found = await dbService.getRequest(targetId.trim().toUpperCase());
        if (found) {
          setRequest(found);
        } else {
          toast.error("Demande introuvable.");
          setRequest(null);
        }
      } catch (error) {
        toast.error("Erreur d'accès à la base locale.");
        console.error(error);
        setRequest(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [targetId]);

  // Submit Accept Decision form
  const handleAcceptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request || !targetId) return;

    if (!dateRealisation || !tempsPasse || !realisePar || !commentaire) {
      toast.error("Veuillez remplir tous les champs requis, y compris le commentaire.");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Enregistrement de l'acceptation...");

    try {
      const updatePayload: Partial<LabRequest> = {
        updatedAt: new Date().toISOString(),
      };

      // Format date to FR format (dd/mm/yyyy)
      const [year, month, day] = dateRealisation.split("-");
      const formattedDateRealisation = `${day}/${month}/${year}`;

      updatePayload.statut = "Acceptée";
      updatePayload.dateRealisation = formattedDateRealisation;
      updatePayload.tempsPasse = tempsPasse.trim();
      updatePayload.realisePar = realisePar.trim();
      updatePayload.commentaire = commentaire.trim();

      // Update in our DB Service
      await dbService.updateRequest(targetId.toUpperCase(), updatePayload);

      // Trigger approval receipt email safely (non-blocking)
      const notificationList = [
        "rouidisara881@gmail.com" // Easy debugging verification inbox for user
      ];
      if (request.emailDemandeur) {
        notificationList.push(request.emailDemandeur.trim());
      }
      if (request.emailExterne) {
        notificationList.push(request.emailExterne.trim());
      }

      try {
        toast.loading("Envoi du mail d'approbation...", { id: toastId });
        for (const email of notificationList) {
          await sendApprovalConfirmation({
            to_email: email,
            request_id: request.id,
            request_maker: request.demandeur,
            status: "Acceptée",
            date_realisation: updatePayload.dateRealisation,
            temps_passe: updatePayload.tempsPasse,
            realise_par: updatePayload.realisePar,
            commentaire: updatePayload.commentaire,
            // Original fields for rich templates
            department: request.departement,
            reference: request.reference,
            type_essai: request.typeDemande,
            date_demande: request.dateDemande,
            subject_or_object: request.objet,
            additional_msg: request.messageSupplementaire || "Aucun message",
          });
        }
      } catch (emailErr) {
        console.warn("EmailJS notification failed, but DB has been saved successfully:", emailErr);
      }

      toast.success(`Dossier accepté et validé avec succès pour ${request.id} !`, {
        id: toastId,
        duration: 5000,
      });

      // Reload local request state
      setRequest((prev) => (prev ? { ...prev, ...updatePayload } : null));
      setDecision(null);
    } catch (err: any) {
      console.error(err);
      toast.error(`Échec d'approbation : ${err.message || "Problème"}`, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Reject Decision form
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request || !targetId) return;

    if (!motifRefus.trim()) {
      toast.error("Veuillez spécifier le motif du refus.");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Enregistrement du refus...");

    try {
      const updatePayload: Partial<LabRequest> = {
        statut: "Refusée",
        motifRefus: motifRefus.trim(),
        updatedAt: new Date().toISOString(),
      };

      // Update in our DB Service
      await dbService.updateRequest(targetId.toUpperCase(), updatePayload);

      // Trigger rejection notification email safely (non-blocking)
      const notificationList = [
        "rouidisara881@gmail.com" // Easy debugging verification inbox for user
      ];
      if (request.emailDemandeur) {
        notificationList.push(request.emailDemandeur.trim());
      }
      if (request.emailExterne) {
        notificationList.push(request.emailExterne.trim());
      }

      try {
        toast.loading("Envoi de la notification de rejet...", { id: toastId });
        for (const email of notificationList) {
          await sendApprovalConfirmation({
            to_email: email,
            request_id: request.id,
            request_maker: request.demandeur,
            status: "Refusée",
            motif_refus: updatePayload.motifRefus,
            // Original fields for rich templates
            department: request.departement,
            reference: request.reference,
            type_essai: request.typeDemande,
            date_demande: request.dateDemande,
            subject_or_object: request.objet,
            additional_msg: request.messageSupplementaire || "Aucun message",
          });
        }
      } catch (emailErr) {
        console.warn("EmailJS notification failed, but DB has been saved successfully:", emailErr);
      }

      toast.success(`Demande ${request.id} refusée avec succès !`, {
        id: toastId,
        duration: 5000,
      });

      // Reload local request state
      setRequest((prev) => (prev ? { ...prev, ...updatePayload } : null));
      setDecision(null);
    } catch (err: any) {
      console.error(err);
      toast.error(`Échec du rejet : ${err.message || "Problème"}`, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-sm mt-4 font-semibold">Récupération des données d'essais...</span>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-rose-950/20 border border-rose-500/20 rounded-2xl p-6 text-center text-rose-400">
        <ShieldAlert className="w-12 h-12 mx-auto mb-3" />
        <h3 className="font-bold text-lg mb-1">Demande Introuvable</h3>
        <p className="text-sm text-rose-300/80 mb-4">Le code d'identification de demande fourni n'est associé à aucun essai actif.</p>
        <button onClick={() => navigate("/admin-excel")} className="text-sm font-semibold underline">
          Retourner au registre
        </button>
      </div>
    );
  }

  const isTerminalState = request.statut === "Acceptée" || request.statut === "Refusée";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" id="approve-request-view">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-6 font-semibold"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Summary Panel */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#0b132e]/80 border border-cyan-500/10 rounded-2xl p-6 md:p-8"
          >
            {/* ID Badge */}
            <div className="flex items-center justify-between gap-4 border-b border-cyan-500/10 pb-4 mb-6">
              <div>
                <span className="text-xs text-cyan-400 font-extrabold uppercase tracking-wide">Fiche de laboratoire</span>
                <h3 className="text-2xl font-black text-white tracking-tight">{request.id}</h3>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase ${
                request.statut === "Acceptée"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : request.statut === "Refusée"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "bg-amber-400/20 text-amber-400 border border-amber-400/30 animate-pulse"
              }`}>
                {request.statut}
              </span>
            </div>

            {/* General Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-sm">
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Demandeur</span>
                <span className="text-white text-base font-semibold">{request.demandeur}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Département</span>
                <span className="text-slate-300 text-base">{request.departement}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Référence de pièce</span>
                <span className="text-white font-mono text-sm font-semibold">{request.reference}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Format Date demande</span>
                <span className="text-slate-300">{request.dateDemande}</span>
              </div>
            </div>

            <div className="border-t border-cyan-500/15 pt-5 text-sm space-y-4">
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Cahier des charges / Objet</span>
                <p className="text-slate-300 leading-relaxed bg-[#060a1f]/80 p-4 rounded-xl border border-slate-800">
                  {request.objet}
                </p>
              </div>

              {request.messageSupplementaire && (
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Message optionnel</span>
                  <p className="text-slate-400 text-sm font-light bg-cyan-950/10 p-3 rounded-lg border border-cyan-950/40">
                    {request.messageSupplementaire}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Historical Results display if already treated */}
          {isTerminalState && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-2xl p-6 ${
                request.statut === "Acceptée"
                  ? "bg-emerald-950/10 border-emerald-500/20"
                  : "bg-rose-950/10 border-rose-500/20"
              }`}
            >
              <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-1.5">
                {request.statut === "Acceptée" ? (
                  <>
                    <CheckCircle2 className="text-emerald-400" /> Informations de Réalisation
                  </>
                ) : (
                  <>
                    <XCircle className="text-rose-400" /> Motif du Rejet
                  </>
                )}
              </h4>

              {request.statut === "Acceptée" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-300">
                  <div>
                    <span className="block text-xs text-slate-400 uppercase font-semibold">Date d'exécution</span>
                    <span className="text-white font-bold">{request.dateRealisation}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400 uppercase font-semibold">Temps passé</span>
                    <span className="text-white font-mono">{request.tempsPasse}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400 uppercase font-semibold">Réalisé par</span>
                    <span className="text-white font-bold">{request.realisePar}</span>
                  </div>
                  <div className="md:col-span-3 pt-2">
                    <span className="block text-xs text-slate-400 uppercase font-semibold mb-1">Retour commentaires</span>
                    <p className="text-white italic bg-[#061e12]/60 p-3 rounded-xl border border-emerald-500/10 text-sm">
                      {request.commentaire || "Aucun commentaire fourni."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-sm bg-rose-950/20 p-4 border border-rose-500/10 rounded-xl text-rose-300">
                  {request.motifRefus || "Aucune spécification."}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Right Side: Decision Actions or Locked State */}
        <div className="lg:col-span-1">
          {isTerminalState ? (
            <div className="bg-[#0b132e]/50 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
              <Cpu className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h4 className="text-white font-bold mb-1">Dossier Verrouillé</h4>
              <p className="text-xs leading-relaxed">
                Cette demande a déjà été consignée et archivée. Plus aucune modification n'est réalisable sur ce jeton client.
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0b132e]/90 border border-cyan-500/20 rounded-2xl p-6 shadow-xl sticky top-24"
            >
              <h4 className="text-white font-black text-lg mb-2 border-b border-slate-800 pb-2 flex items-center gap-2">
                📋 Request Decision
              </h4>
              <p className="text-slate-400 text-xs mb-6 font-medium">
                Click a button to process the request.
              </p>
 
              {/* Initial Action Options */}
              {decision === null && (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setDecision("accept")}
                    disabled={submitting}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-green-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>✅ ACCEPT</span>
                  </button>
 
                  <button
                    type="button"
                    onClick={() => setDecision("reject")}
                    disabled={submitting}
                    className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-red-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>❌ REJECT</span>
                  </button>
                </div>
              )}

              {/* Action Form details: Accept */}
              {decision === "accept" && (
                <form onSubmit={handleAcceptSubmit} className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-emerald-400 font-extrabold uppercase">Formulaire de Réalisation</span>
                    <button
                      type="button"
                      onClick={() => setDecision(null)}
                      className="text-xs text-slate-400 hover:underline"
                    >
                      Annuler
                    </button>
                  </div>

                  {/* Date Realisation */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Essai réalisé le : <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={dateRealisation}
                      onChange={(e) => setDateRealisation(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[#060a1f] border border-slate-700 text-white text-xs rounded-lg focus:outline-none focus:border-cyan-400 [color-scheme:dark]"
                    />
                  </div>

                  {/* Temps passé */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" /> Temps passé : <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 2h30, 4h"
                      value={tempsPasse}
                      onChange={(e) => setTempsPasse(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[#060a1f] border border-slate-700 text-white text-xs rounded-lg focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
                    />
                  </div>

                  {/* Réalisé par */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-cyan-400" /> Réalisé par : <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Nom de l'opérateur / technicien"
                      value={realisePar}
                      onChange={(e) => setRealisePar(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[#060a1f] border border-slate-700 text-white text-xs rounded-lg focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
                    />
                  </div>

                  {/* Commentaire */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> Commentaire : <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Observations ou résultats d'essais..."
                      value={commentaire}
                      onChange={(e) => setCommentaire(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[#060a1f] border border-slate-700 text-white text-xs rounded-lg focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-500 hover:shadow-[0_0_12px_rgba(16,185,129,0.4)] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Traitement..." : "✅ Valider la Réalisation"}
                  </button>
                </form>
              )}

              {/* Action Form details: Reject */}
              {decision === "reject" && (
                <form onSubmit={handleRejectSubmit} className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-rose-400 font-extrabold uppercase">Motif du Refus</span>
                    <button
                      type="button"
                      onClick={() => setDecision(null)}
                      className="text-xs text-slate-400 hover:underline"
                    >
                      Annuler
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      Motif du refus / Rejection Reason : <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Veuillez spécifier la raison du refus..."
                      value={motifRefus}
                      onChange={(e) => setMotifRefus(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[#060a1f] border border-slate-700 text-white text-xs rounded-lg focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-500 hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Traitement..." : "❌ Confirmer le Rejet"}
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
