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
  const [notificationCount, setNotificationCount] = useState(0);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${baseUrl}/auth/me`, {
          method: 'POST',
          credentials: 'include',
        });

        if (!res.ok) {
          router.push('/login');
          return;
        }

        const data = await res.json();
        if (!data.user || data.user.role !== 'TEACHER') {
          router.push('/login');
          return;
        }

        setUser(data.user);
        await fetchTeacher(data.user.email);
      } catch (e) {
        console.error('Erreur vérification session', e);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const fetchTeacher = async (email: string) => {
    try {
      const res = await fetch(
        `${baseUrl}/teachers/profile-by-email?email=${encodeURIComponent(email)}`,
        { credentials: 'include' },
      );
      if (res.ok) {
        const data = await res.json();
        setTeacher(data);
      }
    } catch (error) {
      console.error('Erreur chargement professeur:', error);
    }
  };

  // Fetch notification count (messages non lus + réunions à venir)
  useEffect(() => {
    if (!user) return;

    const fetchCount = () => {
      fetch(`${baseUrl}/notifications/count`, {
        credentials: 'include',
      })
        .then((res) => (res.ok ? res.json() : { count: 0 }))
        .then((data) => setNotificationCount(data.count || 0))
        .catch(() => setNotificationCount(0));
    };

    fetchCount();
    // Rafraîchi périodiquement pour rester à jour sans websocket
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [user, baseUrl]);

  const handleLogout = async () => {
    try {
      await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.error('Erreur logout', e);
    } finally {
      router.push('/login');
    }
  };

  const confirmLogout = () => setShowLogoutConfirm(true);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Icon icon="fa-spinner" className="fa-spin text-3xl text-blue-600 mb-3" />
          <p className="text-slate-500 font-medium text-sm">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  const displayName = teacher ? `${teacher.firstName} ${teacher.lastName}` : user.name || 'Enseignant';
  const displayEmail = teacher?.user?.email || user.email || '';

  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const navItems = [
    { href: '/teacher/dashboard', icon: 'fa-home', label: 'Accueil', mobileLabel: 'Accueil' },
    { href: '/teacher/classes', icon: 'fa-chalkboard-teacher', label: 'Classes', mobileLabel: 'Classes' },
    { href: '/teacher/schedule', icon: 'fa-calendar-alt', label: 'Emploi du temps', mobileLabel: 'Planning' },
    { href: '/teacher/grades', icon: 'fa-clipboard-list', label: 'Matières', mobileLabel: 'Notes' },
    { href: '/teacher/students', icon: 'fa-user-graduate', label: 'Élèves', mobileLabel: 'Élèves' },
    { href: '/teacher/messages', icon: 'fa-envelope', label: 'Messages', mobileLabel: 'Messages' },
    { href: '/teacher/meetings', icon: 'fa-users', label: 'Réunions', mobileLabel: 'Réunions' },
    {
      href: '/teacher/notifications',
      icon: 'fa-bell',
      label: 'Notifications',
      mobileLabel: 'Notifs',
      badge: notificationCount,
    },
    { href: '/teacher/profile', icon: 'fa-user-cog', label: 'Profil', mobileLabel: 'Profil' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar Desktop */}
      <aside
        className={`
          hidden md:flex flex-col bg-[#111c2e] text-slate-300 fixed top-0 bottom-0 left-0 z-50 transition-all duration-300 shadow-xl border-r border-[#1e2d45]
          ${isSidebarOpen ? 'w-64' : 'w-20'}
        `}
      >
        {/* Header Sidebar */}
        <div className="p-5 border-b border-[#1e2d45] flex items-center justify-between w-full">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm">
              <Icon icon="fa-graduation-cap" className="text-sm" />
            </div>
            {isSidebarOpen && (
              <div className="truncate">
                <h1 className="font-bold text-white text-base leading-tight">EduTchad</h1>
              </div>
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-16 bg-[#162238] border border-[#24344d] text-slate-300 hover:text-white p-1.5 rounded-full shadow-md transition items-center justify-center"
        >
          <Icon icon={isSidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'} className="text-xs" />
        </button>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={pathname === item.href}
              isOpen={isSidebarOpen}
              badge={(item as any).badge}
            />
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-[#1e2d45] space-y-1">
          <div className="p-2 rounded-xl bg-[#162238] flex items-center gap-3 border border-[#24344d]">
            {teacher?.photo ? (
              <img
                src={teacher.photo}
                alt={displayName}
                className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                {initials}
              </div>
            )}
            {isSidebarOpen && (
              <div className="truncate flex-1">
                <p className="font-semibold text-xs text-white truncate">{displayName}</p>
                <p className="text-[10px] text-slate-400 truncate">{displayEmail}</p>
              </div>
            )}
          </div>
          <button
            onClick={confirmLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition text-xs font-semibold ${
              !isSidebarOpen && 'justify-center'
            }`}
            title="Déconnexion"
          >
            <Icon icon="fa-sign-out-alt" />
            {isSidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111c2e]/95 backdrop-blur-md border-t border-[#1e2d45] px-2 py-1.5 shadow-2xl">
        <div className="flex items-center justify-around overflow-x-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const badge = (item as any).badge as number | undefined;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                  active ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    active ? 'bg-blue-600/20 border border-blue-500/30' : ''
                  }`}
                >
                  <Icon icon={item.icon as any} className="text-base" />
                  {!!badge && badge > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight whitespace-nowrap">{item.mobileLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 pb-24 md:pb-8 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 sticky top-0 z-40 shadow-xs">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="md:hidden w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                <Icon icon="fa-graduation-cap" />
              </div>
              <h2 className="text-base sm:text-xl font-bold text-slate-800 truncate">
                {navItems.find((item) => item.href === pathname)?.label || 'Personnel'}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex text-xs font-medium text-slate-600 items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <Icon icon="fa-calendar-alt" className="text-slate-400" />
                {new Date().toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>

              {/* Notification Bell */}
              <Link href="/teacher/notifications" className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition">
                <Icon icon="fa-bell" className="text-lg" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Link>

              {/* Logout button (mobile) */}
              <button
                onClick={confirmLogout}
                className="md:hidden p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Déconnexion"
              >
                <Icon icon="fa-sign-out-alt" className="text-base" />
              </button>

              {/* Avatar */}
              {teacher?.photo ? (
                <img
                  src={teacher.photo}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {initials}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200">
                <Icon icon="fa-exclamation-triangle" className="text-lg" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Déconnexion</h3>
            </div>

            <p className="text-slate-600 text-sm mb-6">
              Êtes-vous sûr de vouloir quitter votre session ?
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition text-xs font-semibold shadow-sm"
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

// NavLink component for sidebar
function NavLink({ href, icon, label, active = false, isOpen, badge }: any) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-xs font-semibold
        ${
          active
            ? 'bg-blue-600 text-white shadow-sm font-bold'
            : 'text-slate-300 hover:text-white hover:bg-[#162238]'
        }
        ${!isOpen && 'justify-center px-0'}
      `}
      title={!isOpen ? label : ''}
    >
      <Icon icon={icon} className="text-sm w-5 text-center" />
      {isOpen && (
        <>
          <span>{label}</span>
          {!!badge && badge > 0 && (
            <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
          {active && !badge && <Icon icon="fa-chevron-right" className="text-[10px] ml-auto opacity-70" />}
        </>
      )}
    </Link>
  );
}
