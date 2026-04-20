// src/app/admin/layout.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Vérification de sécurité (Si pas connecté -> Dehors)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      router.push('/');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  if (!user) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center">
        <Icon icon="fa-spinner" className="fa-spin text-4xl text-blue-500 mb-4" />
        <p className="text-slate-600">Chargement de votre espace...</p>
      </div>
    </div>
  );

  // Navigation items avec icônes Font Awesome
  const navItems = [
    { href: '/admin/dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard' },
    { href: '/admin/classes', icon: 'fa-chalkboard-teacher', label: 'Classes' },
    { href: '/admin/teachers', icon: 'fa-user-tie', label: 'Professeurs' },
    { href: '/admin/subjects', icon: 'fa-book', label: 'Matières' },
    { href: '/admin/students', icon: 'fa-user-graduate', label: 'Élèves' },
    { href: '/admin/staff', icon: 'fa-users', label: 'Personnel' },
    { href: '/admin/salaries', icon: 'fa-money-bill-wave', label: 'Salaires' },
    { href: '/admin/schedule', icon: 'fa-calendar-alt', label: 'Emploi du temps' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      {/* --- SIDEBAR (Menu Gauche) --- */}
      <aside className="w-64 bg-slate-800 text-white fixed h-full flex flex-col shadow-xl">
        <div className="p-6 text-center border-b border-slate-700">
          <h1 className="text-xl font-bold flex items-center justify-center gap-2">
            <Icon icon="fa-school" className="text-blue-400" />
            <span>EduTchad</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Plateforme de Gestion</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink 
              key={item.href} 
              href={item.href} 
              icon={item.icon} 
              label={item.label} 
              active={pathname === item.href}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-2">
          <div className="px-4 py-2 text-sm text-slate-400 flex items-center gap-2">
            <Icon icon="fa-user-circle" className="text-lg" />
            <span className="truncate">{user.name || 'Administrateur'}</span>
          </div>
          <button 
            onClick={confirmLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-slate-700 rounded-lg transition group"
          >
            <Icon icon="fa-sign-out-alt" className="group-hover:scale-110 transition" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT (Contenu Droite) --- */}
      <main className="flex-1 ml-64">
        {/* Header avec date et infos utilisateur */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-40 shadow-sm">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">
              {navItems.find(item => item.href === pathname)?.label || 'Administration'}
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                {user.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'AD'}
              </div>
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
                onClick={cancelLogout}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Annuler
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                <Icon icon="fa-sign-out-alt" />
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Petit composant pour les liens du menu
function NavLink({ href, icon, label, active = false }: any) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
    >
      <Icon icon={icon} className="w-5 text-center" />
      <span className="text-sm font-medium">{label}</span>
      {active && (
        <Icon icon="fa-chevron-right" className="ml-auto text-xs" />
      )}
    </Link>
  );
}