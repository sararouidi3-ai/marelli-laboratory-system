import { useState } from "react";
import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { pdf } from "@react-pdf/renderer";
import toast from "react-hot-toast";
import { motion } from "motion/react";
import { FileText, Send, User, Building, Layers, Calendar, Mail, Plus, Trash2, AlertCircle } from "lucide-react";

import { dbService } from "../services/dbService";
import { sendRequestNotification } from "../emailjs";
import { LabRequest, RequestType } from "../types";
import LabReportPDF from "./LabReportPDF";

interface RequestFormInput {
  demandeur: string;
  emailDemandeur: string;
  departement: string;
  reference: string;
  dateDemandeRaw: string; // YYYY-MM-DD
  typeDemande: RequestType;
  objet: string;
  destinataire: string;
  emailExterne: string;
  messageSupplementaire?: string;
}

const DESTINATAIRES_FIXES = [
  "chakir.oualgouh@marelli.com",
  "assiya.rouidi@marelli.com",
  "sararouidi3@gmail.com",
  "mohamed.laabouly@marelli.com",
];

export default function RequestForm() {
  const [loading, setLoading] = useState(false);
  const [showExternalEmail, setShowExternalEmail] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RequestFormInput>({
    defaultValues: {
      dateDemandeRaw: new Date().toISOString().split("T")[0],
      typeDemande: "Essai",
      destinataire: DESTINATAIRES_FIXES[0],
      emailDemandeur: "",
      emailExterne: "",
    },
  });

  const selectedType = watch("typeDemande");

  const onSubmitForm = async (data: RequestFormInput) => {
    setLoading(true);
    const toastId = toast.loading("Calcul du numéro d'essai et validation...");

    try {
      // 1. Calculate the YYYY-MM-DD representation from selected raw date
      const rawDate = data.dateDemandeRaw; // "YYYY-MM-DD"
      if (!rawDate) throw new Error("Veuillez sélectionner une date de demande valide.");
      
      const [year, month, day] = rawDate.split("-");
      const formattedDateFR = `${day}/${month}/${year}`;

      // 2. Look up existing demands on the same formatted date to handle autoincrement sequence
      let itemsCount = 0;
      try {
        itemsCount = await dbService.countRequestsOnDate(formattedDateFR);
      } catch (err) {
        console.warn("Could not calculate autoincrement: ", err);
      }

      // Format custom ID: LAB-AAAA-MM-JJ-XXX
      const sequenceString = String(itemsCount + 1).padStart(3, "0");
      const generatedUniqueId = `LAB-${year}-${month}-${day}-${sequenceString}`;

      // 3. Prepare the dataset payload struct
      const newRequestPayload: LabRequest = {
        id: generatedUniqueId,
        demandeur: data.demandeur.trim(),
        emailDemandeur: data.emailDemandeur.trim(),
        departement: data.departement.trim(),
        reference: data.reference.trim(),
        dateDemande: formattedDateFR,
        typeDemande: data.typeDemande,
        objet: data.objet.trim(),
        destinataire: data.destinataire,
        messageSupplementaire: data.messageSupplementaire?.trim() || "",
        statut: "En attente",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (showExternalEmail && data.emailExterne.trim()) {
        newRequestPayload.emailExterne = data.emailExterne.trim();
      }

      // 4. Save to DB service with handling exceptions
      try {
        await dbService.saveRequest(newRequestPayload);
        console.log("Request Created:", generatedUniqueId);
      } catch (error) {
        throw new Error("Erreur de sauvegarde locale.");
      }

      toast.loading("Génération du rapport PDF officiel...", { id: toastId });

      // 5. Generate secure PDF Report using react-pdf dynamically
      const pdfReportElement = <LabReportPDF request={newRequestPayload} />;
      const pdfBlob = await pdf(pdfReportElement).toBlob();

      // Convert PDF Blob to Base64 sequence for EmailJS payload routing
      const fileReader = new FileReader();
      fileReader.readAsDataURL(pdfBlob);
      fileReader.onloadend = async () => {
        try {
          const rawResult = fileReader.result as string;
          const base64String = rawResult.split(",")[1];

          toast.loading("Envoi des mails de notification...", { id: toastId });

          // 6. Notify core reviewer and optional external email
          const targetEmails = [newRequestPayload.destinataire];
          if (newRequestPayload.emailExterne) {
            targetEmails.push(newRequestPayload.emailExterne);
          }

          const originUrl = window.location.origin;
          const reviewUrl = `${originUrl}/approve/${generatedUniqueId}`;

          console.log("Email Link Request ID:", generatedUniqueId);

          let emailDeliverySuccess = true;
          for (const email of targetEmails) {
            const result = await sendRequestNotification({
              to_email: email,
              email_demandeur: newRequestPayload.emailDemandeur || "",
              request_id: generatedUniqueId,
              request_maker: newRequestPayload.demandeur,
              department: newRequestPayload.departement,
              reference: newRequestPayload.reference,
              type_essai: newRequestPayload.typeDemande,
              date_demande: newRequestPayload.dateDemande,
              subject_or_object: newRequestPayload.objet,
              additional_msg: newRequestPayload.messageSupplementaire || "Aucun message",
              approval_link: reviewUrl,
              pdf_base64: base64String,
            });
            if (!result) emailDeliverySuccess = false;
          }

          if (emailDeliverySuccess) {
            toast.success(`Demande ${generatedUniqueId} créée et notifiée avec succès !`, {
              id: toastId,
              duration: 5000,
            });
          } else {
            toast.success(`Demande ${generatedUniqueId} créée, mais problème de délivrance EmailJS.`, {
              id: toastId,
              duration: 5000,
            });
          }

          // Reroute to public search tracking interface so they can inspect their code
          navigate(`/tracking?searchId=${generatedUniqueId}`);
        } catch (fileErr) {
          console.error("PDF Conversion Exception: ", fileErr);
          toast.error("Erreur lors de la compilation du rapport PDF.", { id: toastId });
        }
      };
    } catch (err: any) {
      console.error(err);
      toast.error(`Erreur d'enregistrement : ${err.message || "Serveur non disponible"}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" id="request-form-view">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0b132e]/85 backdrop-blur-md rounded-2xl border border-cyan-500/20 shadow-[0_8px_32px_rgba(6,182,212,0.15)] p-6 md:p-8"
      >
        {/* Card Header Title */}
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-cyan-500/10">
          <FileText className="w-8 h-8 text-cyan-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Soumettre une Demande Lab</h2>
            <p className="text-slate-400 text-sm">Gérez et suivez vos formulaires de test en conformité Marelli.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input: Demandeur */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-cyan-400" /> Demandeur <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex. Chakir Oualgouh"
                {...register("demandeur", { required: "Ce champ est obligatoire" })}
                className="w-full px-4 py-2.5 bg-[#070b1f]/90 text-white border border-slate-700 rounded-lg focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-all placeholder:text-slate-500 text-sm"
              />
              {errors.demandeur && (
                <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3" /> {errors.demandeur.message}
                </p>
              )}
            </div>

            {/* Input: Email du Demandeur */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-cyan-400" /> Email du Demandeur <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                placeholder="Ex. demandeur@marelli.com"
                {...register("emailDemandeur", { 
                  required: "L'e-mail du demandeur est requis pour recevoir les notifications",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Adresse e-mail invalide"
                  }
                })}
                className="w-full px-4 py-2.5 bg-[#070b1f]/90 text-white border border-slate-700 rounded-lg focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-all placeholder:text-slate-500 text-sm"
              />
              {errors.emailDemandeur && (
                <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3" /> {errors.emailDemandeur.message}
                </p>
              )}
            </div>

            {/* Input: Département */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-cyan-400" /> Département <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex. R&D Automotive"
                {...register("departement", { required: "Ce champ est obligatoire" })}
                className="w-full px-4 py-2.5 bg-[#070b1f]/90 text-white border border-slate-700 rounded-lg focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-all placeholder:text-slate-500 text-sm"
              />
              {errors.departement && (
                <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3" /> {errors.departement.message}
                </p>
              )}
            </div>

            {/* Input: Référence */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-400" /> Référence Matériel / Pièce <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex. ECU-VAL-2026-X"
                {...register("reference", { required: "Ce champ est obligatoire" })}
                className="w-full px-4 py-2.5 bg-[#070b1f]/90 text-white border border-slate-700 rounded-lg focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-all placeholder:text-slate-500 text-sm"
              />
              {errors.reference && (
                <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3" /> {errors.reference.message}
                </p>
              )}
            </div>

            {/* Input: Date demande picker */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-400" /> Date de la demande <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                {...register("dateDemandeRaw", { required: "Veuillez choisir une date" })}
                className="w-full px-4 py-2 bg-[#070b1f]/90 text-white border border-slate-700 rounded-lg focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-all text-sm [color-scheme:dark]"
              />
              {errors.dateDemandeRaw && (
                <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3" /> {errors.dateDemandeRaw.message}
                </p>
              )}
            </div>
          </div>

          {/* Selector Type: Essai vs Intervention */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-300">
              Type de demande <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setValue("typeDemande", "Essai")}
                className={`py-3 px-4 rounded-xl border text-sm font-bold tracking-wide transition-all ${
                  selectedType === "Essai"
                    ? "bg-cyan-500/15 border-cyan-400 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                    : "bg-[#070b1f]/60 border-slate-800 text-slate-400 hover:border-slate-600"
                }`}
              >
                🔬 Essai de Laboratoire
              </button>

              <button
                type="button"
                onClick={() => setValue("typeDemande", "Intervention")}
                className={`py-3 px-4 rounded-xl border text-sm font-bold tracking-wide transition-all ${
                  selectedType === "Intervention"
                    ? "bg-teal-500/15 border-teal-400 text-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.2)]"
                    : "bg-[#070b1f]/60 border-slate-800 text-slate-400 hover:border-slate-600"
                }`}
              >
                🛠️ Intervention Technique
              </button>
            </div>
          </div>

          {/* Input: Objet de la demande */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-300">
              Objet de la demande <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Décrivez avec précision l'objectif et les caractéristiques techniques de la manipulation ou intervention demandée..."
              {...register("objet", { required: "Ce champ est obligatoire" })}
              className="w-full px-4 py-2.5 bg-[#070b1f]/90 text-white border border-slate-700 rounded-lg focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-all placeholder:text-slate-500 text-sm"
            />
            {errors.objet && (
              <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3" /> {errors.objet.message}
              </p>
            )}
          </div>

          {/* Dropdown: Destinataire avec 4 emails fixes */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-300 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-cyan-400" /> Validateur Destinataire <span className="text-rose-500">*</span>
            </label>
            <select
              {...register("destinataire", { required: "Sélection obligatoire" })}
              className="w-full px-4 py-2.5 bg-[#070b1f]/90 text-white border border-slate-700 rounded-lg focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-all text-sm cursor-pointer"
            >
              {DESTINATAIRES_FIXES.map((email) => (
                <option key={email} value={email} className="bg-[#0b132e] text-white">
                  {email}
                </option>
              ))}
            </select>
          </div>

          {/* Option: Ajouter email externe */}
          <div className="pt-2">
            {!showExternalEmail ? (
              <button
                type="button"
                onClick={() => setShowExternalEmail(true)}
                className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer py-1"
              >
                <Plus className="w-3.5 h-3.5" /> + Ajouter un email externe
              </button>
            ) : (
              <div className="space-y-2 bg-cyan-500/5 p-4 rounded-xl border border-cyan-500/10 animate-fade-in relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowExternalEmail(false);
                    setValue("emailExterne", "");
                  }}
                  className="absolute right-3 top-3 text-slate-400 hover:text-rose-400 cursor-pointer"
                  title="Retirer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Email externe supplémentaire (facultatif)
                </label>
                <input
                  type="email"
                  placeholder="Ex. client-partenaire@external-brand.com"
                  {...register("emailExterne")}
                  className="w-full max-w-md px-3 py-2 bg-[#070b1f]/90 text-white border border-slate-700 rounded-lg focus:border-cyan-400 focus:ring-1 focus:outline-none text-xs"
                />
              </div>
            )}
          </div>

          {/* Input: Message supplémentaire */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-300">
              Message supplémentaire (Optionnel)
            </label>
            <textarea
              rows={2}
              placeholder="Spécifications de transport, délais particuliers, etc."
              {...register("messageSupplementaire")}
              className="w-full px-4 py-2.5 bg-[#070b1f]/90 text-white border border-slate-700 rounded-lg focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-all placeholder:text-slate-500 text-sm"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-cyan-500/10 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 disabled:from-slate-700 disabled:to-slate-800 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] text-white text-sm font-bold rounded-xl flex items-center gap-2.5 transition-all duration-300 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Traitement en cours...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>📨 Envoyer la demande</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
