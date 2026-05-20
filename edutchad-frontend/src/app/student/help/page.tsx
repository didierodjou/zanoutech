'use client';

import Icon from '@/components/ui/Icon';

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Aide & Support</h1>
        <p className="text-slate-500 text-sm">Trouvez des réponses à vos questions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <HelpCard
          icon="fa-graduation-cap"
          title="Notes & Moyennes"
          description="Comment sont calculées les moyennes ? Les coefficients sont définis par matière et la moyenne générale est pondérée."
        />
        <HelpCard
          icon="fa-calendar-times"
          title="Absences"
          description="Seul l'administration peut justifier une absence. Contactez votre professeur principal ou le secrétariat."
        />
        <HelpCard
          icon="fa-file-alt"
          title="Bulletins"
          description="Les bulletins sont disponibles après validation par l'équipe pédagogique. Vous pouvez les télécharger au format PDF."
        />
        <HelpCard
          icon="fa-credit-card"
          title="Scolarité"
          description="Les frais de scolarité sont à régler avant la fin de chaque trimestre. En cas de difficulté, contactez le service financier."
        />
        <HelpCard
          icon="fa-user"
          title="Profil"
          description="Vos informations personnelles sont modifiables uniquement par l'administration. Signalez toute erreur au secrétariat."
        />
        <HelpCard
          icon="fa-envelope"
          title="Messagerie"
          description="Vous pouvez recevoir des messages de l'administration et de vos professeurs. Consultez régulièrement votre boîte de réception."
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <Icon icon="fa-headset" /> Contactez-nous
        </h2>
        <div className="space-y-3 text-slate-600">
          <p><Icon icon="fa-envelope" className="inline mr-2 text-indigo-500" /> support@edutchad.com</p>
          <p><Icon icon="fa-phone" className="inline mr-2 text-indigo-500" /> +235 XX XX XX XX</p>
          <p><Icon icon="fa-clock" className="inline mr-2 text-indigo-500" /> Lun – Ven, 8h – 16h</p>
        </div>
      </div>
    </div>
  );
}

function HelpCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition">
      <Icon icon={icon as any} className="text-2xl text-indigo-500 mb-3" />
      <h3 className="font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
    </div>
  );
}