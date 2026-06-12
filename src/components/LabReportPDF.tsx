import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { LabRequest } from "../types";

// Create styles for modern PDF report layout
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1e293b",
  },
  headerContainer: {
    borderBottomWidth: 2,
    borderBottomColor: "#0284c7", // Marelli cyan brand
    paddingBottom: 15,
    marginBottom: 25,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 4,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0284c7",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 4,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
  },
  gridItem: {
    width: "50%",
    marginBottom: 8,
  },
  label: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f172a",
  },
  contentBlock: {
    marginBottom: 20,
    lineHeight: 1.5,
  },
  messageBox: {
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 6,
    fontSize: 9,
    color: "#475569",
    fontStyle: "italic",
    marginTop: 15,
  },
  signatureSection: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "45%",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    marginTop: 35,
    marginBottom: 5,
  },
  signatureTitle: {
    fontSize: 8,
    color: "#64748b",
    textAlign: "center",
  },
  footerText: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
  },
});

interface LabReportPDFProps {
  request: LabRequest;
}

export default function LabReportPDF({ request }: LabReportPDFProps) {
  const generatedAt = new Date().toLocaleString("fr-FR");
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Marelli Official Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>MARELLI LABORATORY</Text>
          <Text style={styles.subtitle}>Fiche Officielle de Demande d'Essais et d'Interventions</Text>
        </View>

        {/* Request Identification Panel */}
        <Text style={styles.sectionTitle}>1. INFORMATIONS GÉNÉRALES</Text>
        <View style={styles.metaGrid}>
          <View style={styles.gridItem}>
            <Text style={styles.label}>N° Demande:</Text>
            <Text style={{ ...styles.value, color: "#0284c7" }}>{request.id}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Date Demande (FR):</Text>
            <Text style={styles.value}>{request.dateDemande}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Demandeur:</Text>
            <Text style={styles.value}>{request.demandeur}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Département:</Text>
            <Text style={styles.value}>{request.departement}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Type d'Intervention / Essai:</Text>
            <Text style={styles.value}>{request.typeDemande}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Référence Matériel/Pièce:</Text>
            <Text style={styles.value}>{request.reference}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Destinataire Principal:</Text>
            <Text style={styles.value}>{request.destinataire}</Text>
          </View>
          {request.emailExterne && (
            <View style={styles.gridItem}>
              <Text style={styles.label}>Destinataire Externe:</Text>
              <Text style={styles.value}>{request.emailExterne}</Text>
            </View>
          )}
        </View>

        {/* Objet & Description */}
        <Text style={styles.sectionTitle}>2. CAHIER DES CHARGES / OBJET</Text>
        <View style={styles.contentBlock}>
          <Text style={{ fontSize: 10, color: "#334155" }}>{request.objet}</Text>
        </View>

        {request.messageSupplementaire && (
          <View style={styles.messageBox}>
            <Text style={{ fontWeight: "bold", marginBottom: 3 }}>Message supplémentaire :</Text>
            <Text>{request.messageSupplementaire}</Text>
          </View>
        )}

        {/* Dynamic Certification signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Visa du Demandeur ({request.demandeur})</Text>
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 7, color: "#94a3b8", textAlign: "center" }}>Généré par certificat numérique</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Validation MARELLI Lab Service</Text>
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 7, color: "#0284c7", fontWeight: "bold", textAlign: "center" }}>MARELLI LAB AUTOMATION</Text>
          </View>
        </View>

        <Text style={styles.footerText}>
          Ce document est généré de manière sécurisée par l'automatisation Marelli Lab. Fait le {generatedAt}. Référence de traçabilité système unique.
        </Text>
      </Page>
    </Document>
  );
}
