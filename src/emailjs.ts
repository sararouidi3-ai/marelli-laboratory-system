/// <reference types="vite/client" />
import emailjs from "@emailjs/browser";

export interface EmailParams {
  to_email: string;
  email_demandeur: string;
  request_id: string;
  request_maker: string;
  department: string;
  reference: string;
  type_essai: string;
  date_demande: string;
  subject_or_object: string;
  additional_msg: string;
  approval_link: string;
  pdf_base64?: string; // Optional PDF attachment as Base64
}

export interface ApprovalEmailParams {
  to_email: string;
  request_id: string;
  request_maker: string;
  status: "Acceptée" | "Refusée";
  date_realisation?: string;
  temps_passe?: string;
  realise_par?: string;
  commentaire?: string;
  motif_refus?: string;

  // Optional original details to map placeholders if the template uses them
  department?: string;
  reference?: string;
  type_essai?: string;
  date_demande?: string;
  subject_or_object?: string;
  additional_msg?: string;
}

/**
 * Sends a notification email to the reviewer when a new Lab Request is created.
 */
export async function sendRequestNotification(params: EmailParams): Promise<boolean> {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_45eiglk";
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_0ecv4ad";
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "Dx4w5vuSqlKWbxflR";

  if (!publicKey) {
    console.warn(
      `[MARELLI EmailJS] No VITE_EMAILJS_PUBLIC_KEY set. Simulating email transmission.\n` +
      `recipient: ${params.to_email}\n` +
      `Request ID: ${params.request_id}\n` +
      `Approval link: ${params.approval_link}`
    );
    return true; // Simulate success
  }

  try {
    const templateParams = {
      // Original mapping
      to_email: params.to_email,
      email_demandeur: params.email_demandeur,
      request_id: params.request_id,
      request_maker: params.request_maker,
      department: params.department,
      reference: params.reference,
      type_essai: params.type_essai,
      date_demande: params.date_demande,
      subject_or_object: params.subject_or_object,
      additional_msg: params.additional_msg,
      approval_link: params.approval_link,
      pdf_attachment: params.pdf_base64 || "", // If template supports attachments

      // Universal English and French mapping to avoid empty fields in EmailJS
      email: params.to_email,
      emailDemandeur: params.email_demandeur,
      demandeur: params.request_maker,
      departement: params.department,
      Department: params.department,
      Departement: params.department,
      reference_piece: params.reference,
      Reference: params.reference,
      REFERENCE: params.reference,
      
      // Type
      type_demande: params.type_essai,
      typeDemande: params.type_essai,
      type: params.type_essai,
      Type: params.type_essai,

      // Message
      message_supplementaire: params.additional_msg,
      messageSupplementaire: params.additional_msg,
      message: params.additional_msg,
      Message: params.additional_msg,

      // Objet
      objet: params.subject_or_object,
      Objet: params.subject_or_object,
      subject: params.subject_or_object,
      Subject: params.subject_or_object,

      // ID and general
      num_essai: params.request_id,
      id: params.request_id,
      review_url: params.approval_link,
      link: params.approval_link,
      date: params.date_demande,
      dateDemande: params.date_demande,

      // Decision/Review Buttons inside the email
      accept_link: `${params.approval_link}?action=accept`,
      reject_link: `${params.approval_link}?action=reject`,
      accept_url: `${params.approval_link}?action=accept`,
      reject_url: `${params.approval_link}?action=reject`,
      approve_link: `${params.approval_link}?action=accept`,
      decline_link: `${params.approval_link}?action=reject`,
      approve_url: `${params.approval_link}?action=accept`,
      decline_url: `${params.approval_link}?action=reject`,
    };

    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.log("[MARELLI EmailJS] Request email sent code:", response.status);
    return true;
  } catch (error) {
    console.error("[MARELLI EmailJS] Email sending failed:", error);
    return false;
  }
}
/**
 * Sends a final confirmation email to the origin requester when actioned.
 */
export async function sendApprovalConfirmation(params: ApprovalEmailParams): Promise<boolean> {
  const isApproved = params.status === "Acceptée";
  
  // Strictly use a single template for both ACCEPTED and REJECTED decision notifications as requested
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_45eiglk";
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_CONFIRM_ID || "template_e2h2dfp";
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "Dx4w5vuSqlKWbxflR";

  if (!publicKey) {
    console.warn(
      `[MARELLI EmailJS] No VITE_EMAILJS_PUBLIC_KEY set. Simulating approval/rejection email.\n` +
      `Requester: ${params.to_email}\n` +
      `Request ID: ${params.request_id}\n` +
      `Status: ${params.status}\n` +
      `Details: ${isApproved ? "Completed by " + params.realise_par : "Reason: " + params.motif_refus}`
    );
    return true;
  }

  try {
    // Generate full dynamic text and HTML blocks for the single master variable option
    let decisionMessage = "";
    let decisionMessageHtml = "";
    
    // Separate block systems to allow fully dynamic email templates on EmailJS if configured
    let acceptanceContent = "";
    let acceptanceContentHtml = "";
    let rejectionContent = "";
    let rejectionContentHtml = "";

    if (isApproved) {
      decisionMessage = 
        `✅ Demande Acceptée\n\n` +
        `Votre demande a été traitée avec succès.\n\n` +
        `Essai réalisé le : ${params.date_realisation || ""}\n` +
        `Temps passé : ${params.temps_passe || ""}\n` +
        `Réalisé par : ${params.realise_par || ""}\n` +
        `Commentaire : ${params.commentaire || ""}\n\n` +
        `Merci pour votre confiance.`;

      decisionMessageHtml = 
        `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px; background-color: #ffffff;">` +
        `<div style="text-align: center; border-bottom: 2px solid #2e7d32; padding-bottom: 12px; margin-bottom: 20px;">` +
        `<h2 style="color: #2e7d32; margin: 0; font-size: 24px;">✅ Demande Acceptée</h2>` +
        `</div>` +
        `<p style="font-size: 16px; color: #555;">Votre demande a été traitée avec succès.</p>` +
        `<table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px;">` +
        `<tr>` +
        `<td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; width: 180px; color: #666;">Essai réalisé le :</td>` +
        `<td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">${params.date_realisation || ""}</td>` +
        `</tr>` +
        `<tr>` +
        `<td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Temps passé :</td>` +
        `<td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">${params.temps_passe || ""}</td>` +
        `</tr>` +
        `<tr>` +
        `<td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Réalisé par :</td>` +
        `<td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333;">${params.realise_par || ""}</td>` +
        `</tr>` +
        `<tr>` +
        `<td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #666;">Commentaire :</td>` +
        `<td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #333; white-space: pre-line;">${params.commentaire || ""}</td>` +
        `</tr>` +
        `</table>` +
        `<p style="font-size: 16px; font-weight: bold; color: #2e7d32; margin-top: 20px;">Merci pour votre confiance.</p>` +
        `</div>`;

      acceptanceContent = decisionMessage;
      acceptanceContentHtml = decisionMessageHtml;
    } else {
      decisionMessage = 
        `❌ Demande Refusée\n\n` +
        `Nous vous informons que votre demande n'a pas pu être acceptée.\n\n` +
        `Motif du refus : ${params.motif_refus || ""}\n\n` +
        `Pour plus d'informations, veuillez contacter le laboratoire.`;

      decisionMessageHtml = 
        `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px; background-color: #ffffff;">` +
        `<div style="text-align: center; border-bottom: 2px solid #c62828; padding-bottom: 12px; margin-bottom: 20px;">` +
        `<h2 style="color: #c62828; margin: 0; font-size: 24px;">❌ Demande Refusée</h2>` +
        `</div>` +
        `<p style="font-size: 16px; color: #555;">Nous vous informons que votre demande n'a pas pu être acceptée.</p>` +
        `<div style="background-color: #ffebee; border-left: 4px solid #c62828; padding: 15px; margin: 20px 0; border-radius: 4px;">` +
        `<h3 style="margin: 0 0 8px 0; color: #c62828; font-size: 16px;">Motif du refus :</h3>` +
        `<p style="margin: 0; color: #333; white-space: pre-line;">${params.motif_refus || ""}</p>` +
        `</div>` +
        `<p style="font-size: 14px; color: #777; margin-top: 20px; font-style: italic;">Pour plus d'informations, veuillez contacter le laboratoire.</p>` +
        `</div>`;

      rejectionContent = decisionMessage;
      rejectionContentHtml = decisionMessageHtml;
    }

    const templateParams = {
      // Original core mapping
      to_email: params.to_email,
      request_id: params.request_id,
      request_maker: params.request_maker,
      status: params.status,
      
      // Dynamic master content variables (perfect for single-variable dynamically built templates)
      email_content: decisionMessage,
      emailContent: decisionMessage,
      email_content_html: decisionMessageHtml,
      emailContentHtml: decisionMessageHtml,
      content: decisionMessage,
      message: decisionMessage,
      
      // Block-level custom content fields (completely clears layout block if unselected)
      acceptance_content: acceptanceContent,
      acceptanceContent: acceptanceContent,
      acceptance_content_html: acceptanceContentHtml,
      acceptanceContentHtml: acceptanceContentHtml,
      acceptance_block: acceptanceContent,
      acceptanceBlock: acceptanceContent,
      acceptance_block_html: acceptanceContentHtml,
      acceptanceBlockHtml: acceptanceContentHtml,

      rejection_content: rejectionContent,
      rejectionContent: rejectionContent,
      rejection_content_html: rejectionContentHtml,
      rejectionContentHtml: rejectionContentHtml,
      rejection_block: rejectionContent,
      rejectionBlock: rejectionContent,
      rejection_block_html: rejectionContentHtml,
      rejectionBlockHtml: rejectionContentHtml,

      approved_content: acceptanceContent,
      approvedContent: acceptanceContent,
      approved_content_html: acceptanceContentHtml,
      approvedContentHtml: acceptanceContentHtml,
      approved_block: acceptanceContent,
      approvedBlock: acceptanceContent,
      approved_block_html: acceptanceContentHtml,
      approvedBlockHtml: acceptanceContentHtml,

      rejected_content: rejectionContent,
      rejectedContent: rejectionContent,
      rejected_content_html: rejectionContentHtml,
      rejectedContentHtml: rejectionContentHtml,
      rejected_block: rejectionContent,
      rejectedBlock: rejectionContent,
      rejected_block_html: rejectionContentHtml,
      rejectedBlockHtml: rejectionContentHtml,

      // Display Toggles for styling containers (<div style="display: {{approved_display}};">)
      approved_display: isApproved ? "block" : "none",
      rejected_display: isApproved ? "none" : "block",
      display_approved: isApproved ? "block" : "none",
      display_rejected: isApproved ? "none" : "block",
      
      // HTML Style string options (e.g., style="{{approved_style}}")
      approved_style: isApproved ? "display: block;" : "display: none;",
      rejected_style: isApproved ? "display: none;" : "display: block;",
      style_approved: isApproved ? "display: block; visibility: visible;" : "display: none; visibility: hidden; height: 0; overflow: hidden;",
      style_rejected: isApproved ? "display: none; visibility: hidden; height: 0; overflow: hidden;" : "display: block; visibility: visible;",

      // CSS Classes
      approved_class: isApproved ? "block" : "hidden",
      rejected_class: isApproved ? "hidden" : "block",
      
      // Strict individual placeholders (empty string when unused so no trailing label text leaks)
      date_realisation: isApproved ? (params.date_realisation || "") : "",
      temps_passe: isApproved ? (params.temps_passe || "") : "",
      realise_par: isApproved ? (params.realise_par || "") : "",
      commentaire: isApproved ? (params.commentaire || "") : "",
      comment: isApproved ? (params.commentaire || "") : "",

      // Direct French variables matching common prompt placeholders
      essai_realise_le: isApproved ? (params.date_realisation || "") : "",
      motif_refus: !isApproved ? (params.motif_refus || "") : "",

      // Pre-formatted lines to prevent label leakage if templates don't support conditional rendering
      essai_realise_le_line: isApproved ? `Essai réalisé le : ${params.date_realisation || ""}` : "",
      temps_passe_line: isApproved ? `Temps passé : ${params.temps_passe || ""}` : "",
      realise_par_line: isApproved ? `Réalisé par : ${params.realise_par || ""}` : "",
      commentaire_line: isApproved ? `Commentaire : ${params.commentaire || ""}` : "",
      motif_refus_line: !isApproved ? `Motif du refus : ${params.motif_refus || ""}` : "",

      // Title & Intro & Footer dynamic components helper
      decision_title: isApproved ? "✅ Demande Acceptée" : "❌ Demande Refusée",
      decision_intro: isApproved 
        ? "Votre demande a été traitée avec succès." 
        : "Nous vous informons que votre demande n'a pas pu être acceptée.",
      decision_footer: isApproved 
        ? "Merci pour votre confiance." 
        : "Pour plus d'informations, veuillez contacter le laboratoire.",

      // French Mapping for template variations
      email: params.to_email,
      demandeur: params.request_maker,
      statut: params.status,
      dateRealisation: isApproved ? (params.date_realisation || "") : "",
      tempsPasse: isApproved ? (params.temps_passe || "") : "",
      realisePar: isApproved ? (params.realise_par || "") : "",
      motifRefus: !isApproved ? (params.motif_refus || "") : "",

      // Boolean condition helpers for EmailJS conditional rendering blocks {{#if is_approved}}...{{/if}}
      is_approved: isApproved,
      isApproved: isApproved,
      approved: isApproved,
      is_rejected: !isApproved,
      isRejected: !isApproved,
      rejected: !isApproved,

      // Pre-compiled decision message to avoid empty layouts or double rendering
      decision_message: decisionMessage,

      // Original request mappings (in case the confirmation of approval/rejection template displays original request info)
      department: params.department || "",
      departement: params.department || "",
      reference: params.reference || "",
      type_essai: params.type_essai || "",
      typeDemande: params.type_essai || "",
      date_demande: params.date_demande || "",
      subject_or_object: params.subject_or_object || "",
      objet: params.subject_or_object || "",
      additional_msg: params.additional_msg || "",
      message_supplementaire: params.additional_msg || "",
      messageSupplementaire: params.additional_msg || "",

      // Highly robust casing/translation alignments
      Statut: params.status,
      Status: params.status,
      
      // Type
      type: params.type_essai || "",
      Type: params.type_essai || "",
      TYPE: params.type_essai || "",
      
      // Objet
      Objet: params.subject_or_object || "",
      OBJET: params.subject_or_object || "",
      subject: params.subject_or_object || "",
      Subject: params.subject_or_object || "",
      
      // Commentaire / Comment
      Commentaire: isApproved ? (params.commentaire || "") : "",
      COMMENTAIRE: isApproved ? (params.commentaire || "") : "",
      Comment: isApproved ? (params.commentaire || "") : "",
      COMMENT: isApproved ? (params.commentaire || "") : "",

      // Rejection Reason / Motif du Refus
      "Rejection Reason": !isApproved ? (params.motif_refus || "") : "",
      rejection_reason: !isApproved ? (params.motif_refus || "") : "",
      rejectionReason: !isApproved ? (params.motif_refus || "") : "",
      "Motif du refus": !isApproved ? (params.motif_refus || "") : "",
      motif_du_refus: !isApproved ? (params.motif_refus || "") : "",
      motif: !isApproved ? (params.motif_refus || "") : "",
      Motif: !isApproved ? (params.motif_refus || "") : "",

      // Date Realisation / Essai réalisé le
      "Essai réalisé le": isApproved ? (params.date_realisation || "") : "",
      essaiRealiseLe: isApproved ? (params.date_realisation || "") : "",

      // Temps passé
      "Temps passé": isApproved ? (params.temps_passe || "") : "",

      // Réalisé par
      "Réalisé par": isApproved ? (params.realise_par || "") : "",
      realised_by: isApproved ? (params.realise_par || "") : "",
      operator: isApproved ? (params.realise_par || "") : "",
    };

    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.log("[MARELLI EmailJS] Decision email sent code:", response.status);
    return true;
  } catch (error) {
    console.error("[MARELLI EmailJS] Decision Email sending failed:", error);
    return false;
  }
}
