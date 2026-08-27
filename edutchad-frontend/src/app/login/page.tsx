// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const findTeacherAndRedirect = async (email: string) => {
    try {
      const res = await fetch(
        `http://localhost:3001/teachers/profile-by-email?email=${encodeURIComponent(email)}`,
        { credentials: 'include' }
      );
      if (!res.ok) {
        router.push('/teacher/dashboard');
        return;
      }
      const teacher = await res.json();
      if (teacher?.id) {
        sessionStorage.setItem('teacherId', teacher.id);
      }
      router.push('/teacher/dashboard');
    } catch {
      router.push('/teacher/dashboard');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur');

      switch (data.user.role) {
        case 'ADMIN':
          router.push('/admin/dashboard');
          break;
        case 'TEACHER':
          await findTeacherAndRedirect(data.user.email);
          break;
        case 'STUDENT':
          router.push('/student/dashboard');
          break;
        case 'STAFF':
          router.push('/staff/dashboard');
          break;
        default:
          router.push('/');
      }
    } catch (err: any) {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 bg-[url('/images/school-bg.png')] bg-cover bg-center bg-no-repeat">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-5">
            <Image
              src="/logo.svg"
              alt="EduTchad Logo"
              width={96}
              height={96}
              className="drop-shadow-[0_8px_24px_rgba(255,255,255,0.3)]"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">EduTchad</h1>
          {/* <p className="text-slate-200 text-sm mt-1.5 font-medium">
            Plateforme de Gestion Scolaire
          </p> */}
        </div>

        {/* Formulaire avec labels flottants sur la ligne du haut */}
        <form
          onSubmit={handleLogin}
          className="bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6"
        >
          {/* Champ Email */}
          <div className="form-group">
            <div className="form-field relative mt-2">
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-white/90 border border-slate-300 rounded-xl text-slate-800 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition peer"
                placeholder=" "
              />
              <label
                htmlFor="email"
                className="absolute left-3 top-0 -translate-y-1/2 bg-white px-1 text-xs text-slate-600 transition-all duration-200 
                           peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:bg-transparent
                           peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-blue-600 peer-focus:bg-white"
              >
                Email
              </label>
            </div>
          </div>

          {/* Champ Mot de passe */}
          <div className="form-group">
            <div className="form-field relative mt-2">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-white/90 border border-slate-300 rounded-xl text-slate-800 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition peer pr-12"
                placeholder=" "
              />
              <label
                htmlFor="password"
                className="absolute left-3 top-0 -translate-y-1/2 bg-white px-1 text-xs text-slate-600 transition-all duration-200 
                           peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:bg-transparent
                           peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-blue-600 peer-focus:bg-white"
              >
                Mot de passe
              </label>
              {/* Bouton afficher/masquer */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                <Icon icon={showPassword ? 'fa-eye-slash' : 'fa-eye'} />
              </button>
            </div>
          </div>

          {/* Lien Mot de passe oublié */}
          <div className="text-right">
            <a href="/mot-de-passe-oublie" className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition">
              Mot de passe oublié ?
            </a>
          </div>

          {error && (
            <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <Icon icon="fa-exclamation-circle" />
              <span>{error}</span>
            </div>
          )}

          {/* Bouton de connexion */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
          >
            {loading ? (
              <>
                <Icon icon="fa-spinner" className="fa-spin" />
                Connexion...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        {/* Bouton Retour à l'accueil */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 bg-white/40 backdrop-blur-sm border border-slate-200/60 rounded-xl hover:bg-white hover:border-slate-300 hover:text-slate-900 transition duration-200 group"
          >
            <Icon icon="fa-arrow-left" className="text-slate-500 group-hover:text-slate-700 transition" />
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}