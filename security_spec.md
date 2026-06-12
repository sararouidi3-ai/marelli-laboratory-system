# Security Specification for MARELLI Laboratory Request Management System

## 1. Data Invariants
1. All requests must have a valid custom ID formatted as `LAB-YYYY-MM-DD-XXX`.
2. All writes to the `/demandes/{demandeId}` path must enforce that `id` equals `{demandeId}`.
3. The initial status `statut` of any request must be `"En attente"`.
4. Only authorized transitions can change `statut` fields. A status of `"Acceptée"` or `"Refusée"` is terminal and cannot be changed back to `"En attente"`.
5. Creation of requests requires `demandeur`, `departement`, `reference`, `dateDemande`, `typeDemande`, `objet`, `destinataire`, and `statut` to be present and non-empty.

## 2. The "Dirty Dozen" Security Payloads (Rejected Vectors)

We reject these 12 attempts to compromise or bypass input rules:

| Payload ID | Vector Style | Malicious Intent / Action | Expected Result |
| :--- | :--- | :--- | :--- |
| `PIACE-01` | **Identity Spoofing** | Setting client-side user account roles falsely on profiles. | **Denied** |
| `PIACE-02` | **Orphaned Writes** | Creating a request with a mismatch between `id` and document path ID. | **Denied** |
| `PIACE-03` | **State Bypass** | Creating a demand with initial status `"Acceptée"` bypassing approval. | **Denied** |
| `PIACE-04` | **Input Poisoning** | Injecting a giant random buffer string (>50KB) as a Request ID. | **Denied** |
| `PIACE-05` | **Field Pollution** | Injecting unregistered keys like `isAdmin: true` into the request document. | **Denied** |
| `PIACE-06` | **Temporal Tampering**| Providing a manual client-side timestamp for `createdAt` instead of ServerTimestamp. | **Denied** |
| `PIACE-07` | **Status Reversal**   | Attempting to move a locked `"Refusée"` request back to `"En attente"`. | **Denied** |
| `PIACE-08` | **Null Injection** | Submitting empty required strings for `demandeur` or `departement`. | **Denied** |
| `PIACE-09` | **Email Spoofing** | Sending emails under false pretexts without verified accounts. | **Denied** |
| `PIACE-10` | **Cross-Tenant Read** | Reading individual private requests from external unauthenticated sessions. | **Denied** |
| `PIACE-11` | **Type Spoofing** | Storing `typeDemande` with an unsupported enum value, e.g. `"Destroy"`. | **Denied** |
| `PIACE-12` | **Blanket Listing** | Running list queries on `/demandes` without proper access. | **Denied** |

## 3. Recommended Security Rules Concept (`DRAFT_firestore.rules`)

Every read and write on `demandes` is fully audited against:
- Authentication state of the user (or anonymous public reading if querying by their single ID for tracking, but write is strictly structured).
- Fields matching schema structures.
- Immutability of origin attributes (`demandeur`, `departement`).
- Valid status transition sequences.
