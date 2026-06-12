import { useEffect, useState } from "react";
import React from "react";
import { motion } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ClipboardList, AlertCircle, CheckCircle, XCircle, TrendingUp, Cpu, Landmark, Wrench } from "lucide-react";

import { dbService } from "../services/dbService";
import { LabRequest } from "../types";

export default function AdminDashboard() {
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = dbService.subscribe((list) => {
      setRequests(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Aggregating statistics metrics
  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.statut === "En attente").length;
  const acceptedCount = requests.filter((r) => r.statut === "Acceptée").length;
  const rejectedCount = requests.filter((r) => r.statut === "Refusée").length;

  // Pie chart calculation: Request types
  const essaiCount = requests.filter((r) => r.typeDemande === "Essai").length;
  const interventionCount = requests.filter((r) => r.typeDemande === "Intervention").length;
  
  const typeData = [
    { name: "Essai de Laboratoire", value: essaiCount, color: "#22d3ee" }, // cyan
    { name: "Intervention Technique", value: interventionCount, color: "#14b8a6" }, // teal
  ];

  // Bar chart calculation: Requests by Department
  const deptCounts: { [key: string]: number } = {};
  requests.forEach((r) => {
    const dept = r.departement || "Inconnu";
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });
  const deptData = Object.keys(deptCounts).map((key) => ({
    department: key,
    demandes: deptCounts[key],
  }));

  // Bar chart calculation: Requests by Date (last 8 days / requests in sequence)
  const dateCounts: { [key: string]: number } = {};
  requests.slice(0, 50).forEach((r) => {
    const d = r.dateDemande || "Inconnue";
    dateCounts[d] = (dateCounts[d] || 0) + 1;
  });
  const chronologicalData = Object.keys(dateCounts)
    .reverse()
    .slice(-8)
    .map((key) => ({
      date: key,
      demandes: dateCounts[key],
    }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-sm mt-4 font-semibold">Génération des graphiques et données...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" id="admin-dashboard-view">
      {/* View Header */}
      <div className="flex items-center space-x-3 mb-8">
        <TrendingUp className="text-cyan-400 w-8 h-8" />
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Tableau de Bord Décisionnel</h2>
          <p className="text-slate-400 text-sm">Visualisation des charges, performances de validation et diagnostics des flux.</p>
        </div>
      </div>

      {/* KPI Cards section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" id="dashboard-kpi-grid">
        {/* Total demands */}
        <div className="bg-[#0b132e]/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex items-center gap-5 shadow-lg group hover:border-cyan-500/40 transition-all">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <ClipboardList className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider mb-0.5">Total demandes</span>
            <span className="text-3xl font-black text-white">{totalCount}</span>
          </div>
          <div className="absolute right-0 bottom-0 text-blue-500/5 select-none font-bold text-7xl translate-y-4 pointer-events-none">
            #
          </div>
        </div>

        {/* Pending demands */}
        <div className="bg-[#0b132e]/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex items-center gap-5 shadow-lg group hover:border-amber-500/40 transition-all">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <AlertCircle className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider mb-0.5">En Attente</span>
            <span className="text-3xl font-black text-amber-400">{pendingCount}</span>
          </div>
          <div className="absolute right-0 bottom-0 text-amber-500/5 select-none font-bold text-7xl translate-y-4 pointer-events-none">
            ?
          </div>
        </div>

        {/* Accepted demands */}
        <div className="bg-[#0b132e]/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex items-center gap-5 shadow-lg group hover:border-emerald-500/40 transition-all">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider mb-0.5">Acceptées</span>
            <span className="text-3xl font-black text-emerald-400">{acceptedCount}</span>
          </div>
          <div className="absolute right-0 bottom-0 text-emerald-500/5 select-none font-bold text-7xl translate-y-4 pointer-events-none">
            OK
          </div>
        </div>

        {/* Rejected demands */}
        <div className="bg-[#0b132e]/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex items-center gap-5 shadow-lg group hover:border-rose-500/40 transition-all">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
            <XCircle className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider mb-0.5">Refusées</span>
            <span className="text-3xl font-black text-rose-400">{rejectedCount}</span>
          </div>
          <div className="absolute right-0 bottom-0 text-rose-500/5 select-none font-bold text-7xl translate-y-4 pointer-events-none">
            KO
          </div>
        </div>
      </div>

      {/* Recharts Analytics Grid */}
      {totalCount === 0 ? (
        <div className="bg-[#0b132e]/40 border border-slate-800 p-12 text-center rounded-2xl text-slate-400">
          Enregistrez des demandes d'essais pour visualiser les premiers rapports statistiques.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8" id="dashboard-charts-grid">
          
          {/* Chart 1: Daily load of requests (Bar chart) */}
          <div className="bg-[#0b132e]/85 border border-cyan-500/10 rounded-2xl p-5 lg:col-span-2 shadow-xl">
            <h3 className="text-white font-bold text-sm mb-4 border-b border-cyan-500/10 pb-2 uppercase tracking-wider text-cyan-400">
              📆 Chronologie & Fréquence (Derniers jours)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chronologicalData}>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0b132e", borderColor: "#1e293b", color: "#fff" }}
                    itemStyle={{ color: "#22d3ee" }}
                  />
                  <Bar dataKey="demandes" name="Nb Demandes" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Request types breakdown (Pie chart) */}
          <div className="bg-[#0b132e]/85 border border-cyan-500/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-white font-bold text-sm mb-4 border-b border-cyan-500/10 pb-2 uppercase tracking-wider text-cyan-400">
                🧬 Typologie d'Activité
              </h3>
              <div className="h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0b132e", borderColor: "#1e293b", color: "#fff" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Custom legends list */}
            <div className="space-y-2 pt-4">
              {typeData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-md" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="text-white font-bold">{item.value} ({totalCount ? Math.round((item.value / totalCount) * 100) : 0}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 3: Department Workload (Bar chart grid-span-3) */}
          <div className="bg-[#0b132e]/85 border border-cyan-500/10 rounded-2xl p-5 lg:col-span-3 shadow-xl">
            <h3 className="text-white font-bold text-sm mb-4 border-b border-cyan-500/10 pb-2 uppercase tracking-wider text-cyan-400">
              🏢 Charge de validation par département
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} layout="vertical">
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="department" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={130} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0b132e", borderColor: "#1e293b", color: "#fff" }}
                    itemStyle={{ color: "#38bdf8" }}
                  />
                  <Bar dataKey="demandes" name="Travaux validés" fill="#38bdf8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
