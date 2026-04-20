// src/app/teacher/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [teacher, setTeacher] = useState<any>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      router.push('/');
    } else {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      // Charger les données du professeur si teacherId existe
      if (userData.teacherId) {
        fetchTeacher(userData.teacherId, token);
      }
    }
  }, [router]);

  const fetchTeacher = async (teacherId: string, token: string) => {
    try {
      const res = await fetch(`http://localhost:3001/teachers/${teacherId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setTeacher(data);
      }
    } catch (error) {
      console.error('Erreur chargement professeur:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  if (!user) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center">
        <Icon icon="fa-spinner" className="fa-spin text-4xl text-blue-500 mb-4" />
        <p className="text-slate-600">Chargement de votre espace...</p>
      </div>
    </div>
  );

  const displayName = teacher ? `${teacher.firstName} ${teacher.lastName}` : user.name || 'Enseignant';
  const displayEmail = teacher?.user?.email || user.email || '';
  
  // Initiales pour l'avatar (fallback)
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const navItems = [
    { href: '/teacher/dashboard', icon: 'fa-tachometer-alt', label: 'Tableau de bord' },
    { href: '/teacher/grades', icon: 'fa-clipboard-list', label: 'Saisie des notes' },
    { href: '/teacher/schedule', icon: 'fa-calendar-alt', label: 'Emploi du temps' },
    { href: '/teacher/classes', icon: 'fa-chalkboard-teacher', label: 'Mes classes' },
    { href: '/teacher/students', icon: 'fa-user-graduate', label: 'Élèves' },
    { href: '/teacher/profile', icon: 'fa-user-cog', label: 'Mon profil' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      {/* --- SIDEBAR (Menu Gauche) --- */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-800 text-white fixed h-full transition-all duration-300 shadow-xl z-50`}>
        <div className="p-6 text-center border-b border-slate-700">
          <h1 className="text-xl font-bold flex items-center justify-center gap-2">
            <Icon icon="fa-chalkboard-teacher" className="text-blue-400" />
            {isSidebarOpen && <span>EduTchad</span>}
          </h1>
          {isSidebarOpen && <p className="text-xs text-slate-400 mt-1">Espace Enseignant</p>}
        </div>

        {/* Bouton toggle sidebar */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 bg-blue-600 text-white p-1.5 rounded-full shadow-lg hover:bg-blue-700 transition"
        >
          <Icon icon={isSidebarOpen ? "fa-chevron-left" : "fa-chevron-right"} className="text-sm" />
        </button>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink 
              key={item.href} 
              href={item.href} 
              icon={item.icon} 
              label={item.label} 
              active={pathname === item.href}
              isOpen={isSidebarOpen}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-2">
          <div className="px-4 py-2 text-sm text-slate-400 flex items-center gap-2">
            {teacher?.photo ? (
              <img 
                src={teacher.photo} 
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
            )}
            {isSidebarOpen && (
              <div className="truncate">
                <p className="font-medium text-white">{displayName}</p>
                <p className="text-xs text-slate-400 truncate">{displayEmail}</p>
              </div>
            )}
          </div>
          <button 
            onClick={confirmLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-slate-700 rounded-lg transition group"
          >
            <Icon icon="fa-sign-out-alt" className="group-hover:scale-110 transition" />
            {isSidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT (Contenu Droite) --- */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header avec infos utilisateur */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-40 shadow-sm">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">
              {navItems.find(item => item.href === pathname)?.label || 'Espace Enseignant'}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">
                <Icon icon="fa-calendar-alt" className="mr-1" />
                {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              {teacher?.photo ? (
                <img 
                  src={teacher.photo} 
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                  {initials}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-8">
          {children}
        </div>
      </main>

      {/* MODAL DE CONFIRMATION DÉCONNEXION */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center gap-3 text-yellow-600 mb-4">
              <Icon icon="fa-exclamation-triangle" className="text-3xl" />
              <h3 className="text-xl font-bold text-gray-900">Confirmation</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir vous déconnecter ?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Annuler
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Composant pour les liens du menu
function NavLink({ href, icon, label, active = false, isOpen }: any) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
      title={!isOpen ? label : ''}
    >
      <Icon icon={icon} className="w-5 text-center" />
      {isOpen && <span className="text-sm font-medium">{label}</span>}
      {active && isOpen && (
        <Icon icon="fa-chevron-right" className="ml-auto text-xs" />
      )}
    </Link>
  );
}