'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';

export default function HeadTeacherLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      try {
        const res = await fetch(`${API_URL}/teachers/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          if (!data.mainClass) {
            router.push('/teacher/dashboard');
            return;
          }
          setTeacher(data);
        } else {
          throw new Error('Non autorisé');
        }
      } catch (error) {
        localStorage.clear();
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router, API_URL]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Icon icon="fa-spinner" className="fa-spin text-4xl text-blue-600" />
    </div>
  );

  if (!teacher) return null;

  // Calcul des initiales pour l'avatar si pas de photo
  const initials = `${teacher.firstName[0]}${teacher.lastName[0]}`.toUpperCase();

  const navItems: Array<{ href: string; icon: 'fa-chart-pie' | 'fa-users' | 'fa-file-alt' | 'fa-user-cog' | 'fa-chalkboard-teacher'; label: string; specialized?: boolean }> = [
    { href: '/head-teacher/dashboard', icon: 'fa-chart-pie', label: 'Vue d\'ensemble' },
    { href: '/head-teacher/class', icon: 'fa-users', label: 'Ma Classe' },
    { href: '/head-teacher/reports', icon: 'fa-file-alt', label: 'Bulletins & Notes' },
    { href: '/head-teacher/absences', icon: 'fa-user-cog', label: 'Vie Scolaire' },
    { href: '/teacher/dashboard', icon: 'fa-chalkboard-teacher', label: 'Espace Enseignant', specialized: true },
  ];

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white fixed h-full transition-all duration-300 shadow-xl z-50 flex flex-col`}>
        
        {/* EN-TÊTE SIDEBAR : PHOTO + NOM */}
        <div className="p-6 flex flex-col items-center justify-center border-b border-slate-800 transition-all">
          <div className="flex items-center gap-3 overflow-hidden w-full">
            {/* Avatar ou Photo */}
            <div className="shrink-0">
                {teacher.photo ? (
                    <img 
                        src={teacher.photo} 
                        alt="Profil" 
                        className="w-12 h-12 rounded-full object-cover border-2 border-yellow-500 shadow-lg"
                    />
                ) : (
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {initials}
                    </div>
                )}
            </div>
            
            {/* Nom et Classe (Visible uniquement si sidebar ouverte) */}
            {isSidebarOpen && (
              <div className="truncate">
                <h1 className="font-bold text-sm leading-tight text-white truncate">
                    {teacher.firstName} {teacher.lastName}
                </h1>
                <p className="text-xs text-yellow-400 font-medium mt-1 truncate">
                    Prof. Principal {teacher.mainClass?.name}
                </p>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-24 bg-yellow-500 text-white p-1.5 rounded-full shadow-md hover:bg-yellow-600 transition z-50"
        >
          <Icon icon={isSidebarOpen ? "fa-chevron-left" : "fa-chevron-right"} className="text-xs" />
        </button>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === item.href 
                  ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-white shadow-lg' 
                  : item.specialized 
                    ? 'mt-8 bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title={!isSidebarOpen ? item.label : ''}
            >
              <Icon icon={item.icon} className={`text-lg w-6 text-center ${pathname === item.href ? 'text-white' : item.specialized ? 'text-blue-400' : 'text-slate-500 group-hover:text-yellow-400'}`} />
              {isSidebarOpen && <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition ${!isSidebarOpen && 'justify-center'}`}
          >
            <Icon icon="fa-sign-out-alt" />
            {isSidebarOpen && <span className="font-medium">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-40 shadow-sm flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">
            {navItems.find(i => i.href === pathname)?.label || 'Espace Titulaire'}
          </h2>
          
          {/* Info utilisateur Header (Rappel) */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-slate-700">{teacher.firstName} {teacher.lastName}</p>
              <p className="text-xs text-slate-500">{teacher.user?.email}</p>
            </div>
            {teacher.photo ? (
              <img src={teacher.photo} className="w-10 h-10 rounded-full object-cover border-2 border-slate-100 shadow-sm" alt="" />
            ) : (
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                {initials}
              </div>
            )}
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>

      {/* LOGOUT MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-sm w-full animate-fade-in-up">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Déconnexion</h3>
            <p className="text-slate-600 mb-6">Voulez-vous vraiment quitter votre espace ?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
              <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Se déconnecter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}