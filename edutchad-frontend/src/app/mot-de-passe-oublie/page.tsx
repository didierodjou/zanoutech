// src/app/mot-de-passe-oublie/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // On affiche toujours le même message de succès, que le compte existe ou
      // non : ça évite de révéler quels emails sont enregistrés (énumération).
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Une erreur est survenue, réessayez plus tard.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue, réessayez plus tard.");
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
          
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
          {submitted ? (
            // ==================== ÉCRAN DE CONFIRMATION ====================
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Icon icon="fa-envelope-open-text" className="text-2xl text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Email envoyé</h2>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                Si un compte existe pour <span className="font-semibold text-slate-800">{email}</span>,
                un nouveau mot de passe temporaire vient de lui être envoyé. Pensez à vérifier vos
                spams si vous ne le recevez pas rapidement.
              </p>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition"
              >
                Retour à la connexion
              </button>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Mot de passe oublié</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Entrez votre email de connexion. Nous vous enverrons un nouveau mot de passe
                  temporaire à utiliser pour vous reconnecter.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
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

                {error && (
                  <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                    <Icon icon="fa-exclamation-circle" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  {loading ? (
                    <>
                      <Icon icon="fa-spinner" className="fa-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    'Envoyer un nouveau mot de passe'
                  )}
                </button>
              </form>

              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
              >
                <Icon icon="fa-arrow-left" />
                Retour à la connexion
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}