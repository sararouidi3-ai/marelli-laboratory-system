export type RequestStatus = "En attente" | "Acceptée" | "Refusée";
export type RequestType = "Essai" | "Intervention";

export interface LabRequest {
  id: string; // Format: LAB-YYYY-MM-DD-XXX
  demandeur: string;
  emailDemandeur?: string; // The requester's own email address
  departement: string;
  reference: string;
  dateDemande: string; // DD/MM/YYYY
  typeDemande: RequestType;
  objet: string;
  destinataire: string;
  emailExterne?: string;
  messageSupplementaire?: string;
  statut: RequestStatus;
  
  // Realization Info (for Acceptée status)
  dateRealisation?: string;
  tempsPasse?: string;
  realisePar?: string;
  commentaire?: string;
  
  // Rejection Info (for Refusée status)
  motifRefus?: string;
  
  // Timestamps
  createdAt?: any; // Firestore serverTimestamp
  updatedAt?: any; // Firestore serverTimestamp
}
