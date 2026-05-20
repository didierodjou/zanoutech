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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Détecter la taille de l'écran
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const confirmLogout = () => setShowLogoutConfirm(true);
  const cancelLogout = () => setShowLogoutConfirm(false);

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
    { href: '/admin/attendances', icon: 'fa-clock', label: 'Absences' },
    { href: '/admin/meetings', icon: 'fa-users', label: 'Réunions' },
    { href: '/admin/messages', icon: 'fa-envelope', label: 'Messages' },
    { href: '/admin/settings', icon: 'fa-cog', label: 'Paramètres' },
  ];

  // Sur mobile, on affiche les 5 premiers dans la barre du bas, le reste dans un menu "Plus"
  const bottomNavItems = navItems.slice(0, 4);
  const moreNavItems = navItems.slice(4);

  const currentLabel = navItems.find(item => item.href === pathname)?.label || 'Administration';

  return (
    <div className={`flex min-h-screen bg-slate-100 font-sans overflow-x-hidden`}>

      {/* =============================================
          SIDEBAR DESKTOP (cachée sur mobile)
         ============================================= */}
      <aside
        className={`
          hidden md:flex flex-col bg-slate-800 text-white fixed h-full shadow-xl z-30
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-16' : 'w-64'}
        `}
      >
        {/* Logo */}
        <div className={`p-4 border-b border-slate-700 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Icon icon="fa-school" className="text-blue-400" />
                <span>EduTchad</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Plateforme de Gestion</p>
            </div>
          )}
          {sidebarCollapsed && (
            <Icon icon="fa-school" className="text-blue-400 text-xl" />
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`text-slate-400 hover:text-white hover:bg-slate-700 p-1.5 rounded-lg transition ${sidebarCollapsed ? 'mt-0' : ''}`}
            title={sidebarCollapsed ? 'Déployer le menu' : 'Réduire le menu'}
          >
            <Icon icon={sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'} className="text-sm" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <DesktopNavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={pathname === item.href}
              collapsed={sidebarCollapsed}
            />
          ))}
        </nav>

        {/* Utilisateur + Déconnexion */}
        <div className={`p-2 border-t border-slate-700 space-y-1`}>
          {!sidebarCollapsed && (
            <div className="px-3 py-2 text-sm text-slate-400 flex items-center gap-2">
              <Icon icon="fa-user-circle" className="text-lg flex-shrink-0" />
              <span className="truncate">{user.name || 'Administrateur'}</span>
            </div>
          )}
          <button
            onClick={confirmLogout}
            title="Déconnexion"
            className={`w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-slate-700 rounded-lg transition group
              ${sidebarCollapsed ? 'justify-center' : ''}
            `}
          >
            <Icon icon="fa-sign-out-alt" className="group-hover:scale-110 transition flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* =============================================
          MAIN CONTENT
         ============================================= */}
      <main className={`
        flex-1 transition-all duration-300 overflow-x-hidden min-w-0
        ${isMobile ? 'ml-0 pb-20' : sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}
      `}>
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 md:py-4 sticky top-0 z-40 shadow-sm">
          <div className="flex justify-between items-center">
            {/* Titre page */}
            <div className="flex items-center gap-3">
              {/* Bouton hamburger visible uniquement sur mobile - optionnel */}
              <h2 className="text-lg md:text-2xl font-bold text-slate-800 truncate">
                {currentLabel}
              </h2>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {/* Date : cachée sur mobile pour gagner de la place */}
              <span className="hidden lg:flex text-sm text-slate-500 items-center gap-1">
                <Icon icon="fa-calendar-alt" className="mr-1" />
                {new Date().toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              {/* Date courte sur tablette */}
              <span className="hidden md:flex lg:hidden text-sm text-slate-500 items-center gap-1">
                {new Date().toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>

              {/* Avatar utilisateur */}
              <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md text-sm md:text-base flex-shrink-0">
                {user.name
                  ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                  : 'AD'}
              </div>
            </div>
          </div>
        </header>

        {/* Contenu de la page */}
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* =============================================
          BARRE DE NAVIGATION MOBILE (bas de l'écran)
         ============================================= */}
      <MobileBottomNav
        navItems={navItems}
        bottomNavItems={bottomNavItems}
        moreNavItems={moreNavItems}
        pathname={pathname}
        user={user}
        onLogout={confirmLogout}
      />

      {/* =============================================
          MODAL CONFIRMATION DÉCONNEXION
         ============================================= */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
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

/* ================================================
   COMPOSANT : Lien de navigation desktop (sidebar)
   ================================================ */
function DesktopNavLink({ href, icon, label, active = false, collapsed = false }: any) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
        ${collapsed ? 'justify-center' : ''}
        ${active
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
        }`}
    >
      <Icon icon={icon} className="w-5 text-center flex-shrink-0" />
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
      {!collapsed && active && (
        <Icon icon="fa-chevron-right" className="ml-auto text-xs" />
      )}
    </Link>
  );
}

/* ================================================
   COMPOSANT : Barre de navigation mobile (bas)
   ================================================ */
function MobileBottomNav({ navItems, bottomNavItems, moreNavItems, pathname, user, onLogout }: any) {
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {/* Panneau "Plus" qui se déploie vers le haut */}
      {showMore && (
        <>
          {/* Overlay pour fermer */}
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowMore(false)}
          />
          {/* Panneau déroulant */}
          <div className="md:hidden fixed bottom-16 left-0 right-0 bg-slate-800 z-50 rounded-t-2xl shadow-2xl border-t border-slate-700 px-4 py-4 pb-2">
            {/* Indicateur de glissement */}
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4" />

            {/* Logo et nom */}
            <div className="flex items-center gap-3 px-2 mb-4 pb-3 border-b border-slate-700">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user.name
                  ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                  : 'AD'}
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{user.name || 'Administrateur'}</p>
                <p className="text-slate-400 text-xs">Proviseur / DG</p>
              </div>
            </div>

            {/* Liens supplémentaires */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {moreNavItems.map((item: any) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl transition-all
                    ${pathname === item.href
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                >
                  <Icon icon={item.icon} className="text-lg" />
                  <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Bouton déconnexion */}
            <button
              onClick={() => { setShowMore(false); onLogout(); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-400 hover:bg-slate-700 rounded-xl transition mt-1"
            >
              <Icon icon="fa-sign-out-alt" />
              <span className="text-sm font-medium">Déconnexion</span>
            </button>
          </div>
        </>
      )}

      {/* Barre de navigation fixe en bas */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 z-40 shadow-2xl">
        <div className="flex items-stretch h-16">
          {/* Les 4 premiers liens */}
          {bottomNavItems.map((item: any) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all relative
                ${pathname === item.href
                  ? 'text-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              {/* Indicateur actif */}
              {pathname === item.href && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-400 rounded-b-full" />
              )}
              <Icon icon={item.icon} className={`text-lg transition-transform ${pathname === item.href ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          ))}

          {/* Bouton "Plus" */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all relative
              ${showMore ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'}
            `}
          >
            {showMore && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-400 rounded-b-full" />
            )}
            <Icon icon={showMore ? 'fa-times' : 'fa-ellipsis-h'} className={`text-lg transition-transform ${showMore ? 'rotate-180 scale-110' : ''}`} />
            <span className="text-[10px] font-medium leading-none">Plus</span>
          </button>
        </div>
      </nav>
    </>
  );
}