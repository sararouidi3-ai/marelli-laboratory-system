import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE_PATH = path.join(process.cwd(), "requests_db.json");

app.use(express.json());

// Initial seed requests
const INITIAL_REQUESTS = [
  {
    id: "LAB-2026-06-01-001",
    demandeur: "Chakir Oualgouh",
    emailDemandeur: "chakir.oualgouh@marelli.com",
    departement: "R&D Automotive",
    reference: "ECU-VAL-2026-X",
    dateDemande: "01/06/2026",
    typeDemande: "Essai",
    objet: "Test de choc thermique sur boîtier ECU Marelli de nouvelle génération.",
    destinataire: "chakir.oualgouh@marelli.com",
    statut: "Acceptée",
    dateRealisation: "02/06/2026",
    tempsPasse: "3h15",
    realisePar: "Assiya Rouidi",
    commentaire: "Simulation thermique réussie, aucune anomalie structurelle détectée sur le composant."
  },
  {
    id: "LAB-2026-06-02-001",
    demandeur: "Assiya Rouidi",
    emailDemandeur: "assiya.rouidi@marelli.com",
    departement: "Qualité Maroc",
    reference: "SENSOR-PT-99",
    dateDemande: "02/06/2026",
    typeDemande: "Intervention",
    objet: "Étalonnage du capteur de pression d'admission sur banc de test principal.",
    destinataire: "assiya.rouidi@marelli.com",
    statut: "En attente"
  },
  {
    id: "LAB-2026-06-03-001",
    demandeur: "Sara Rouidi",
    emailDemandeur: "rouidisara881@gmail.com",
    departement: "Validation Lab",
    reference: "VALVE-CTRL-01",
    dateDemande: "03/06/2026",
    typeDemande: "Essai",
    objet: "Mesures du flux pneumatique résiduel.",
    destinataire: "sararouidi3@gmail.com",
    statut: "En attente"
  }
];

// Helper to load requests securely from server-side json file
function readRequests(): any[] {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(INITIAL_REQUESTS, null, 2), "utf8");
      return INITIAL_REQUESTS;
    }
    const content = fs.readFileSync(DB_FILE_PATH, "utf8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading requests database file:", err);
    return INITIAL_REQUESTS;
  }
}

// Helper to write changes to server-side json file
function writeRequests(requests: any[]) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(requests, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving to requests database file:", err);
  }
}

// REST Backend Endpoints
app.get("/api/requests", (req, res) => {
  const data = readRequests();
  res.json(data);
});

app.get("/api/requests/:id", (req, res) => {
  const reqId = req.params.id;
  console.log("Searching Request:", reqId);
  const data = readRequests();
  const found = data.find(r => r.id.toLowerCase() === reqId.toLowerCase());
  
  if (found) {
    console.log("FOUND request:", found.id);
    res.json(found);
  } else {
    console.log("NOT FOUND request:", reqId);
    res.status(404).json({ error: "Demande introuvable" });
  }
});

app.get("/api/requests/count/:date", (req, res) => {
  const dateStr = decodeURIComponent(req.params.date); // expects format DD/MM/YYYY
  const data = readRequests();
  const matchCount = data.filter(r => r.dateDemande === dateStr).length;
  res.json({ count: matchCount });
});

app.post("/api/requests", (req, res) => {
  const newRequest = req.body;
  if (!newRequest || !newRequest.id) {
    return res.status(400).json({ error: "Request payload missing identifier" });
  }
  
  console.log("Request Created:", newRequest.id);
  const data = readRequests();
  const index = data.findIndex(r => r.id.toLowerCase() === newRequest.id.toLowerCase());
  
  if (index >= 0) {
    data[index] = newRequest;
  } else {
    data.unshift(newRequest);
  }
  
  writeRequests(data);
  res.status(201).json(newRequest);
});

app.put("/api/requests/:id", (req, res) => {
  const reqId = req.params.id;
  const updates = req.body;
  
  console.log("Updating Request:", reqId, "with updates:", updates);
  const data = readRequests();
  const index = data.findIndex(r => r.id.toLowerCase() === reqId.toLowerCase());
  
  if (index >= 0) {
    data[index] = { ...data[index], ...updates };
    writeRequests(data);
    res.json(data[index]);
  } else {
    res.status(404).json({ error: `Demande ${reqId} inexistante` });
  }
});

// Configure Vite integration or SPA static asset serving
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

// Start Listener
setupViteOrStatic().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}).catch(err => {
  console.error("Vite setup error on backend:", err);
});
