'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  // Données pour les fonctionnalités
  const features = [
    {
      icon: 'fa-chalkboard-teacher',
      title: 'Gestion Pédagogique Avancée',
      description: 'Suivi individualisé des parcours élèves, évaluations par compétences et bulletins dynamiques.',
      color: 'from-blue-500 to-blue-600',
      details: [
        'Suivi personnalisé des acquis',
        'Évaluations continues',
        'Bulletins automatisés',
        'Coordination inter-niveaux'
      ]
    },
    {
      icon: 'fa-users-cog',
      title: 'Administration Simplifiée',
      description: 'Gestion centralisée des effectifs, RH, finances et génération automatique des emplois du temps.',
      color: 'from-purple-500 to-purple-600',
      details: [
        'Gestion des inscriptions',
        'Suivi des paiements',
        'Emplois du temps intelligents',
        'Reporting automatisé'
      ]
    },
    {
      icon: 'fa-comments',
      title: 'Communication Unifiée',
      description: 'Messagerie intégrée, alertes automatiques et espace collaboratif pour toute la communauté.',
      color: 'from-green-500 to-green-600',
      details: [
        'Messages instantanés',
        'Notifications push',
        'Espace parents',
        'Forums de discussion'
      ]
    },
    {
      icon: 'fa-chart-line',
      title: 'Analytics & Pilotage',
      description: 'Tableaux de bord interactifs et indicateurs de performance en temps réel.',
      color: 'from-orange-500 to-orange-600',
      details: [
        'Statistiques détaillées',
        'Prédictions de performance',
        'Alertes personnalisées',
        'Rapports exportables'
      ]
    }
  ];

  // Données pour les rôles
  const roles = [
    {
      icon: 'fa-user-tie',
      title: 'Administration',
      description: 'Gestion complète de l\'établissement : classes, matières, personnel, finances.',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      icon: 'fa-chalkboard',
      title: 'Professeur Principal',
      description: 'Suivi d\'assiduité, notes, bulletins, réunions et communication avec les familles.',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      icon: 'fa-user-graduate',
      title: 'Professeur',
      description: 'Gestion pédagogique, saisie des évaluations et partage des ressources.',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      icon: 'fa-user',
      title: 'Élève & Parent',
      description: 'Accès aux notes, absences, emploi du temps et communication avec l\'équipe.',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    }
  ];

  // Statistiques
  const stats = [
    { value: '60%', label: 'Réduction du temps administratif', icon: 'fa-clock' },
    { value: '100%', label: 'Digitalisation des processus', icon: 'fa-cloud-upload-alt' },
    { value: '24/7', label: 'Accès en temps réel', icon: 'fa-mobile-alt' },
  ];

  // Témoignages
  const testimonials = [
    {
      name: 'M. Abakar',
      role: 'Directeur d\'établissement',
      content: 'Cette plateforme a transformé notre gestion quotidienne. Les bulletins sont générés en quelques clics et le suivi des élèves est devenu un jeu d\'enfant.',
      avatar: '/images/avatar1.jpg'
    },
    {
      name: 'Mme Fatimé',
      role: 'Professeur principal',
      content: 'Je peux enfin communiquer facilement avec les parents et suivre l\'assiduité de mes élèves en temps réel. Un outil indispensable !',
      avatar: '/images/avatar2.jpg'
    }
  ];

  // Logique de redirection
  const findTeacherAndRedirect = async (email: string, token: string) => {
    try {
      const res = await fetch(`http://localhost:3001/teachers/profile-by-email?email=${email}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        router.push('/teacher/dashboard');
        return;
      }

      const teacher = await res.json();
      
      if (teacher) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.teacherId = teacher.id;
        localStorage.setItem('user', JSON.stringify(user));
        router.push('/teacher/dashboard');
      } else {
        router.push('/teacher/dashboard');
      }
    } catch (error) {
      router.push('/teacher/dashboard');
    }
  };

  // Gestion du login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Erreur');

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      switch (data.user.role) {
        case 'ADMIN':
          router.push('/admin/dashboard');
          break;
        case 'TEACHER':
          await findTeacherAndRedirect(data.user.email, data.access_token);
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
      setError("Email ou mot de passe incorrect");
      setLoading(false);
    }
  };

  // Fonction pour défiler vers une section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Image de fond */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/school-bg.jpg"
          alt="École"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/95 via-purple-900/90 to-indigo-900/95"></div>
      </div>

      {/* Header avec navigation */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-20 container mx-auto px-6 py-4"
      >
        <nav className="flex justify-between items-center">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => scrollToSection('hero')}
          >
            {/* Logo du collège */}
            <div className="bg-white rounded-lg p-1.5 shadow-lg">
              <Image 
                src="/logo.svg" 
                alt="Lycée Ibnou Mahadjir" 
                width={40} 
                height={40} 
                className="object-contain"
                priority
              />
            </div>
            <span className="text-2xl font-bold text-white">
              EduTchad
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection('features')}
              className={`text-white/90 hover:text-white transition relative group ${activeSection === 'features' ? 'text-white' : ''}`}
            >
              Fonctionnalités
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-yellow-400 transition-all duration-300 ${activeSection === 'features' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className={`text-white/90 hover:text-white transition relative group ${activeSection === 'about' ? 'text-white' : ''}`}
            >
              À propos
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-yellow-400 transition-all duration-300 ${activeSection === 'about' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className={`text-white/90 hover:text-white transition relative group ${activeSection === 'contact' ? 'text-white' : ''}`}
            >
              Contact
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-yellow-400 transition-all duration-300 ${activeSection === 'contact' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </button>
            <button 
              onClick={() => setShowLoginModal(true)}
              className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Se connecter
            </button>
          </div>
          
          <button 
            onClick={() => setShowLoginModal(true)}
            className="md:hidden bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold"
          >
            <Icon icon="fa-sign-in-alt" />
          </button>
        </nav>
      </motion.header>

      {/* Contenu principal */}
      <main className="relative z-10">
        {/* Section Hero */}
        <section id="hero" className="container mx-auto px-6 py-12 md:py-20 min-h-screen flex items-center">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-full text-sm font-semibold mb-6 border border-white/20">
                <Icon icon="fa-map-marker-alt" className="mr-2" />
                🇹🇩 Plateforme de Gestion Scolaire Intégrée
              </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
            >
              L'avenir de l'éducation
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
                commence ici.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-white/90 mb-8 leading-relaxed max-w-2xl"
            >
              Une plateforme complète pour la gestion scolaire moderne. 
              Simplifiez l'administration, suivez les performances et 
              connectez toute la communauté éducative.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <button 
                onClick={() => setShowLoginModal(true)}
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-8 py-4 rounded-xl font-bold text-lg hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 flex items-center gap-2"
              >
                <Icon icon="fa-rocket" />
                Commencer maintenant
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <Icon icon="fa-play-circle" />
                Découvrir
              </button>
            </motion.div>

            {/* Statistiques */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16"
            >
              {stats.map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/20">
                  <Icon icon={stat.icon as any} className="text-3xl text-yellow-400 mb-2 mx-auto" />
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-white/70">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Section Fonctionnalités */}
        <section id="features" className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Fonctionnalités Principales
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Une solution complète pour répondre à tous les besoins de la communauté éducative
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300"
                >
                  <div className={`h-2 bg-gradient-to-r ${feature.color}`}></div>
                  <div className="p-8">
                    <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6 text-white text-2xl group-hover:scale-110 transition-transform`}>
                      <Icon icon={feature.icon as any} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 mb-4">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.details.map((detail, i) => (
                        <li key={i} className="flex items-center gap-2 text-gray-600">
                          <Icon icon="fa-check-circle" className="text-green-500 text-sm" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Rôles et interfaces */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mt-16"
            >
              <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">
                Interfaces dédiées pour chaque acteur
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {roles.map((role, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className={`${role.bgColor} p-6 rounded-xl text-center hover:shadow-xl transition-all transform hover:-translate-y-1`}
                  >
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl ${role.iconColor}`}>
                      <Icon icon={role.icon as any} />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">{role.title}</h4>
                    <p className="text-sm text-gray-600">{role.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section À propos */}
        <section id="about" className="py-20 bg-gray-50">
          <div className="container mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-center">
                À propos d'EduTchad
              </h2>
              
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                <div className="prose prose-lg max-w-none text-gray-600">
                  <p className="text-lg leading-relaxed mb-6">
                    <strong className="text-gray-900">EduTchad</strong> est une plateforme de gestion scolaire intégrée développée par <strong className="text-gray-900">SARL Zanoutech</strong>. Notre solution vise à transformer l'administration éducative par le numérique, en proposant une solution unifiée permettant de centraliser la gestion administrative, pédagogique et communicationnelle des établissements scolaires.
                  </p>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Notre mission</h3>
                  <p className="mb-6">
                    Simplifier les processus, améliorer la transparence, l'efficacité et le pilotage du système éducatif. 
                    Ce projet s'inscrit dans une démarche de modernisation durable et de performance collective.
                  </p>

                  <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Notre vision</h3>
                  <p className="mb-6">
                    Une administration scolaire 4.0, plus agile, connectée et centrée sur la mission pédagogique.
                  </p>

                  <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Les bénéfices attendus</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <li className="flex items-start gap-3">
                      <Icon icon="fa-check-circle" className="text-green-500 mt-1" />
                      <span>Réduction du temps de traitement administratif de 60%</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Icon icon="fa-check-circle" className="text-green-500 mt-1" />
                      <span>Automatisation des tâches répétitives</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Icon icon="fa-check-circle" className="text-green-500 mt-1" />
                      <span>Accès en temps réel aux données consolidées</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Icon icon="fa-check-circle" className="text-green-500 mt-1" />
                      <span>Amélioration du pilotage par tableaux de bord</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section Témoignages */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Ils nous font confiance
              </h2>
              <p className="text-xl text-gray-600">Découvrez ce que disent nos utilisateurs</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="bg-gray-50 p-6 rounded-xl"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 italic">"{testimonial.content}"</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Section Contact */}
        <section id="contact" className="py-20 bg-gray-50">
          <div className="container mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-center">
                Contactez-nous
              </h2>

              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* Informations de contact */}
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-8 text-white">
                    <h3 className="text-2xl font-bold mb-6">Informations</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Icon icon="fa-map-marker-alt" className="mt-1" />
                        <div>
                          <p className="font-semibold">Adresse</p>
                          <p className="text-white/80">Quartier REPOS III, Face Bouta Cochon<br />N'Djamena, Tchad</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Icon icon="fa-phone-alt" className="mt-1" />
                        <div>
                          <p className="font-semibold">Téléphone</p>
                          <p className="text-white/80">95 91 90 10 / 99 49 14 49</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Icon icon="fa-envelope" className="mt-1" />
                        <div>
                          <p className="font-semibold">Email</p>
                          <p className="text-white/80">contact@edutchad.td</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Icon icon="fa-clock" className="mt-1" />
                        <div>
                          <p className="font-semibold">Horaires</p>
                          <p className="text-white/80">Lun - Ven: 8h - 17h<br />Sam: 9h - 12h</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/20">
                      <p className="font-semibold mb-3">Suivez-nous</p>
                      <div className="flex gap-3">
                        <a href="#" className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition">
                          <Icon icon="fa-linkedin-in" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Formulaire de contact */}
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Envoyez-nous un message</h3>
                    
                    <form className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                        <input 
                          type="text" 
                          className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900"
                          placeholder="Votre nom"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input 
                          type="email" 
                          className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900"
                          placeholder="votre@email.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                        <input 
                          type="text" 
                          className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900"
                          placeholder="Sujet de votre message"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <textarea 
                          rows={4}
                          className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900"
                          placeholder="Votre message..."
                        ></textarea>
                      </div>
                      
                      <button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                      >
                        Envoyer le message
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900 border-t border-gray-800 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Logo et description */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-white rounded-lg p-1">
                  <Image 
                    src="/logo.svg" 
                    alt="Lycée Ibnou Mahadjir" 
                    width={40} 
                    height={40} 
                    className="object-contain"
                  />
                </div>
                <span className="text-xl font-bold text-white">EduTchad</span>
              </div>
              <p className="text-gray-400 text-sm">
                Plateforme de gestion scolaire intégrée pour une éducation moderne et connectée.
              </p>
            </div>

            {/* Liens rapides */}
            <div>
              <h4 className="text-white font-semibold mb-4">Liens rapides</h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => scrollToSection('features')} className="text-gray-400 hover:text-white transition flex items-center gap-2">
                    <Icon icon="fa-chevron-right" className="text-xs" />
                    Fonctionnalités
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('about')} className="text-gray-400 hover:text-white transition flex items-center gap-2">
                    <Icon icon="fa-chevron-right" className="text-xs" />
                    À propos
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('contact')} className="text-gray-400 hover:text-white transition flex items-center gap-2">
                    <Icon icon="fa-chevron-right" className="text-xs" />
                    Contact
                  </button>
                </li>
              </ul>
            </div>

            {/* Mentions légales */}
            <div>
              <h4 className="text-white font-semibold mb-4">Mentions légales</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition flex items-center gap-2">
                    <Icon icon="fa-shield-alt" />
                    Conditions d'utilisation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition flex items-center gap-2">
                    <Icon icon="fa-lock" />
                    Politique de confidentialité
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition flex items-center gap-2">
                    <Icon icon="fa-cookie-bite" />
                    Gestion des cookies
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-white font-semibold mb-4">Newsletter</h4>
              <p className="text-gray-400 text-sm mb-3">
                Restez informé des dernières actualités
              </p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Votre email" 
                  className="flex-1 bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition">
                  <Icon icon="fa-paper-plane" />
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-gray-400 text-sm">
                © {new Date().getFullYear()} EduTchad - SARL Zanoutech. Tous droits réservés.
              </div>
              <div className="flex gap-6">
                <a href="#" className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition">
                  <Icon icon="fa-shield-alt" />
                  Mentions légales
                </a>
                <a href="#" className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition">
                  <Icon icon="fa-lock" />
                  Confidentialité
                </a>
                <a href="#" className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition">
                  <Icon icon="fa-envelope" />
                  Contact
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* MODALE DE CONNEXION */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 relative">
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                  <div className="w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center p-2">
                    <Image 
                      src="/logo.svg" 
                      alt="Lycée Ibnou Mahadjir" 
                      width={80} 
                      height={40} 
                      className="object-contain"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => setShowLoginModal(false)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white"
                >
                  <Icon icon="fa-times" className="text-xl" />
                </button>
              </div>

              <div className="px-8 pt-16 pb-8">
                <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
                  Bienvenue sur EduTchad
                </h2>
                <p className="text-center text-gray-500 mb-8">
                  Connectez-vous à votre espace
                </p>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">
                      Email
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Icon icon="fa-envelope" />
                      </span>
                      <input 
                        type="email" 
                        required 
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900"
                        placeholder="nom@ecole.td"
                        value={email} 
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Icon icon="fa-lock" />
                      </span>
                      <input 
                        type={showPassword ? "text" : "password"}
                        required 
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900"
                        placeholder="••••••••"
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <Icon icon={showPassword ? "fa-eye" : "fa-eye-slash"} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                      <span className="text-sm text-gray-600">Se souvenir de moi</span>
                    </label>
                    <button type="button" className="text-sm text-blue-600 hover:text-blue-800">
                      Mot de passe oublié ?
                    </button>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center gap-2">
                      <Icon icon="fa-exclamation-circle" />
                      {error}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Icon icon="fa-spinner" className="fa-spin" />
                        Connexion...
                      </>
                    ) : (
                      <>
                        <Icon icon="fa-sign-in-alt" />
                        Se connecter
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500">
                    Nouveau sur la plateforme ?{" "}
                    <button className="text-blue-600 hover:text-blue-800 font-semibold">
                      Contacter l'administration
                    </button>
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-center text-gray-400">
                    En vous connectant, vous acceptez nos conditions d'utilisation
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}