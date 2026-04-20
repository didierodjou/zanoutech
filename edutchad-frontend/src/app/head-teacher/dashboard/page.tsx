'use client';
import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';

export default function HeadTeacherDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // On utilise l'endpoint existant class-students pour calculer les stats locales
      // Dans une app réelle, on ferait un endpoint /dashboard/head-teacher
      try {
        const res = await fetch(`${API_URL}/teachers/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const profile = await res.json();
        
        if (profile.mainClass) {
            const resStudents = await fetch(`${API_URL}/teachers/${profile.id}/class-students`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await resStudents.json();
            
            // Calculs simples
            const students = data.students || [];
            const totalStudents = students.length;
            const boys = students.filter((s:any) => s.gender === 'M').length; // Si gender existe
            // Simuler des stats pour l'exemple
            setStats({
                className: profile.mainClass.name,
                level: profile.mainClass.level,
                totalStudents,
                avgAttendance: "92%",
                classAvg: "12.5/20",
                warnings: 2
            });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [API_URL]);

  if (loading) return <div>Chargement...</div>;
  if (!stats) return <div>Erreur de chargement.</div>;

  return (
    <div className="space-y-6">
      {/* BANNIÈRE */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Classe de {stats.className}</h1>
            <p className="text-yellow-100 opacity-90">Niveau {stats.level} • Année scolaire 2025-2026</p>
        </div>
        <Icon icon="fa-chalkboard" className="absolute right-10 bottom-[-20px] text-9xl text-white opacity-10 rotate-12" />
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Effectif" value={stats.totalStudents} icon="fa-users" color="bg-blue-500" />
        <StatCard title="Moyenne Classe" value={stats.classAvg} icon="fa-chart-line" color="bg-green-500" />
        <StatCard title="Taux Présence" value={stats.avgAttendance} icon="fa-check-circle" color="bg-purple-500" />
        <StatCard title="Avertissements" value={stats.warnings} icon="fa-exclamation-triangle" color="bg-red-500" />
      </div>

      {/* WIDGETS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Icon icon="fa-bell" className="text-yellow-500"/> Rappels Importants
            </h3>
            <div className="space-y-3">
                <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm border-l-4 border-yellow-400">
                    📅 Conseil de classe le 25 Mars 2026
                </div>
                <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border-l-4 border-blue-400">
                    📝 Saisie des appréciations avant le 20 Mars
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Icon icon="fa-clock" className="text-blue-500"/> Absences Récentes
            </h3>
            <div className="text-center text-slate-400 py-8 italic">
                Aucune absence signalée aujourd'hui
            </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
                <p className="text-slate-500 text-sm font-medium">{title}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
            </div>
            <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center text-white text-xl shadow-md`}>
                <Icon icon={icon} />
            </div>
        </div>
    )
}