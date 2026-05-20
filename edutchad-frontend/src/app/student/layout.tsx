'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { StudentProvider, useStudent } from '@/context/StudentContext';
import { AnimatePresence, motion } from 'framer-motion';

const NAV_ITEMS = [
  { href: '/student/dashboard', icon: 'fa-th-large', label: 'Cabinet personnel' },
  { href: '/student/grades', icon: 'fa-chart-bar', label: 'Notes & Moyennes' },
  { href: '/student/absences', icon: 'fa-calendar-times', label: 'Absences' },
  { href: '/student/bulletins', icon: 'fa-file-alt', label: 'Bulletins' },
  { href: '/student/payment', icon: 'fa-credit-card', label: 'Scolarité' },
  { href: '/student/schedule', icon: 'fa-calendar-week', label: 'Emploi du temps' },
  { href: '/student/meetings', icon: 'fa-users', label: 'Réunions' },
  { href: '/student/help', icon: 'fa-question-circle', label: 'Aide' },
];

function LogoutModal({ isOpen, onClose, onConfirm }: { isOpen: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
              <Icon icon="fa-sign-out-alt" className="text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Déconnexion</h3>
          </div>
          <p className="text-slate-600 text-sm mb-6">
            Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre compte.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 transition shadow-sm"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ProfileDropdown() {
  const { student } = useStudent();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!student) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 p-1.5 pr-3 rounded-xl hover:bg-slate-100 transition"
      >
        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
          {student.firstName?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="text-left text-[11px]">
          <span className="text-slate-700 font-bold">
            {student.firstName} {student.lastName}
          </span>
        </div>
        <Icon icon="fa-chevron-down" className={`text-slate-400 text-[10px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 z-20 overflow-hidden"
          >
            <div className="py-1">
              <Link href="/student/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition" onClick={() => setIsOpen(false)}>
                <Icon icon="fa-user" className="text-slate-400 text-xs" /> Mon profil
              </Link>
              <Link href="/student/grades" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition" onClick={() => setIsOpen(false)}>
                <Icon icon="fa-chart-bar" className="text-slate-400 text-xs" /> Notes & Moyennes
              </Link>
              <Link href="/student/bulletins" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition" onClick={() => setIsOpen(false)}>
                <Icon icon="fa-file-alt" className="text-slate-400 text-xs" /> Bulletins
              </Link>
              <Link href="/student/payment" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition" onClick={() => setIsOpen(false)}>
                <Icon icon="fa-credit-card" className="text-slate-400 text-xs" /> Scolarité
              </Link>
              <Link href="/student/schedule" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition" onClick={() => setIsOpen(false)}>
                <Icon icon="fa-calendar-week" className="text-slate-400 text-xs" /> Emploi du temps
              </Link>
              <Link href="/student/meetings" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition" onClick={() => setIsOpen(false)}>
                <Icon icon="fa-users" className="text-slate-400 text-xs" /> Réunions
              </Link>
              <Link href="/student/help" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition" onClick={() => setIsOpen(false)}>
                <Icon icon="fa-question-circle" className="text-slate-400 text-xs" /> Aide
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false);
                  const event = new CustomEvent('openLogoutModal');
                  window.dispatchEvent(event);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition"
              >
                <Icon icon="fa-sign-out-alt" className="text-rose-500 text-xs" /> Déconnexion
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Sidebar({ sidebarOpen, setSidebarOpen, onLogoutClick }: { sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void; onLogoutClick: () => void }) {
  const { student, loading } = useStudent();
  const pathname = usePathname();

  const initials = student && student.firstName && student.lastName
    ? `${student.firstName[0]}${student.lastName[0]}`.toUpperCase()
    : '?';

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-50
          bg-[#1e2538] text-slate-300
          flex flex-col border-r border-slate-800/40
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700/30 min-h-[73px]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/20 flex-shrink-0">
              <Icon icon="fa-graduation-cap" className="text-white text-xs" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none tracking-wide">EduTchad</p>
              <p className="text-indigo-400 text-[10px] mt-1">Espace Élève</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <Icon icon="fa-times" className="text-xs" />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium
                  transition-all duration-200 justify-between group
                  ${isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon icon={item.icon as any} className={`text-sm ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <Icon icon="fa-chevron-right" className="text-[9px] opacity-80" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700/30 bg-[#191f30] space-y-3">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-indigo-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
              {!loading && initials}
              {loading && '...'}
            </div>
            <div className="min-w-0">
              <p className="text-slate-200 font-semibold text-xs truncate">
                {!loading && student ? `${student.firstName} ${student.lastName}` : 'Chargement...'}
              </p>
              <p className="text-slate-500 text-[10px] truncate">
                {!loading && student ? student.registrationNo : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onLogoutClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all font-medium"
          >
            <Icon icon="fa-sign-out-alt" className="text-sm" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function LayoutContent({ children, setSidebarOpen }: { children: React.ReactNode; setSidebarOpen: (open: boolean) => void }) {
  const { student, loading } = useStudent();
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setFormattedDate(now.toLocaleDateString('fr-FR', options));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#f8fafc]">
      <header className="bg-white border-b border-slate-200 min-h-[73px] flex items-center justify-between px-6 lg:px-8 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600 p-2 rounded-xl hover:bg-slate-100" aria-label="Ouvrir le menu">
            <Icon icon="fa-bars" className="text-base" />
          </button>
          <h2 className="text-slate-800 font-bold text-sm lg:text-base">Espace Élève</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium bg-slate-50 border border-slate-200/60 px-3 py-2 rounded-xl">
            <Icon icon="fa-calendar-alt" className="text-slate-400" />
            <span className="capitalize">{formattedDate}</span>
          </div>
          <ProfileDropdown />
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
    </div>
  );
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024;
    setSidebarOpen(isDesktop);
  }, []);

  useEffect(() => {
    const handleOpenModal = () => setShowLogoutModal(true);
    window.addEventListener('openLogoutModal', handleOpenModal);
    return () => window.removeEventListener('openLogoutModal', handleOpenModal);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <StudentProvider>
      <div className="min-h-screen w-screen bg-[#f8fafc] flex overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogoutClick={() => setShowLogoutModal(true)} />
        <LayoutContent setSidebarOpen={setSidebarOpen}>{children}</LayoutContent>
        <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
      </div>
    </StudentProvider>
  );
}