import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Calendar,
  Network,
  Wallet,
  DoorOpen,
  Bus,
  CalendarDays,
  BookOpen,
  Users,
  Copy,
  Phone,
  Palette,
  Server,
  LogOut,
  ChevronRight,
  Plus,
  Minus,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { clsx } from 'clsx';
import ServerConfigModal from '../../components/ServerConfigModal';

const SettingsPage: React.FC = () => {
  const { logout } = useAuth();
  const { years, selectedYear, selectYear } = useSchoolYear();
  const navigate = useNavigate();

  const [isSyncEnabled, setIsSyncEnabled] = useState(localStorage.getItem('sync_enabled') === 'true');
  const [doubleReceipts, setDoubleReceipts] = useState(localStorage.getItem('double_receipts') === 'true');
  const [useCompetences, setUseCompetences] = useState(localStorage.getItem('use_competences') === 'true');
  const [nbTelephones, setNbTelephones] = useState(Number(localStorage.getItem('nb_telephones')) || 2);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const serverIp = localStorage.getItem('server_ip') || '192.168.0.50';

  useEffect(() => {
    localStorage.setItem('sync_enabled', isSyncEnabled.toString());
  }, [isSyncEnabled]);

  useEffect(() => {
    localStorage.setItem('double_receipts', doubleReceipts.toString());
  }, [doubleReceipts]);

  useEffect(() => {
    localStorage.setItem('use_competences', useCompetences.toString());
  }, [useCompetences]);

  useEffect(() => {
    localStorage.setItem('nb_telephones', nbTelephones.toString());
  }, [nbTelephones]);

  const handleLogout = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20 p-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-10 rounded-[40px] shadow-xl border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10">
            <div className="flex items-center space-x-3 text-accent mb-3">
                <ShieldCheck size={24} />
                <span className="text-[11px] font-black uppercase tracking-[0.4em]">Administration Centrale</span>
            </div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-black">Paramètres</h1>
        </div>
        <div className="bg-red-50 text-red-600 px-8 py-4 rounded-sharp border border-red-100 flex items-center space-x-3 shadow-sm hover:scale-105 transition-transform relative z-10">
            <Zap size={20} className="animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest">Master Admin Mode</span>
        </div>
      </div>

      {/* 1. Section Synchronisation */}
      <SettingsSection title="Synchronisation">
        <SettingsItem
          icon={RefreshCw}
          iconColor="bg-violet-600"
          title="Synchronisation distante"
          subtitle="Sauvegarde automatique sur le serveur central"
          action={
            <div
              onClick={() => setIsSyncEnabled(!isSyncEnabled)}
              className={clsx(
                "w-16 h-8 rounded-full transition-all cursor-pointer relative p-1 shadow-inner",
                isSyncEnabled ? "bg-violet-600 shadow-[0_0_15px_rgba(124,58,237,0.4)]" : "bg-gray-200"
              )}
            >
              <div className={clsx(
                "w-6 h-6 bg-white rounded-full transition-all shadow-md",
                isSyncEnabled ? "translate-x-8" : "translate-x-0"
              )} />
            </div>
          }
          showDivider={false}
        />
      </SettingsSection>

      <div className={clsx("space-y-12 transition-all duration-700", !isSyncEnabled && "opacity-25 grayscale pointer-events-none scale-[0.98] blur-[2px]")}>
        {/* 2. Section Établissement */}
        <SettingsSection title="Établissement">
          <SettingsItem
            icon={Calendar}
            iconColor="bg-blue-600"
            title="Année Scolaire Active"
            subtitle={selectedYear?.libelleAnneeScolaire || "Non définie"}
            onClick={() => setIsYearModalOpen(true)}
          />
          <SettingsItem
            icon={Network}
            iconColor="bg-accent"
            title="Structure Académique"
            subtitle="Cycles et types d'enseignements"
            onClick={() => navigate('/app/academic/structure')}
            showDivider={false}
          />
        </SettingsSection>

        {/* 3. Section Finance */}
        <SettingsSection title="Finance & Tarification">
          <SettingsItem
            icon={Wallet}
            iconColor="bg-orange-500"
            title="Frais Globaux"
            subtitle="Bibliothèque des tarifs (Exigibles & Périscolaires)"
            onClick={() => navigate('/app/finance/library')}
          />
          <SettingsItem
            icon={DoorOpen}
            iconColor="bg-green-600"
            title="Classes & Salles"
            subtitle="Gestion des effectifs et capacités"
            onClick={() => navigate('/app/academic/classes')}
          />
          <SettingsItem
            icon={Bus}
            iconColor="bg-purple-600"
            title="Tarifs Transport"
            subtitle="Zones et abonnements mensuels"
            onClick={() => navigate('/app/finance/transport')}
            showDivider={false}
          />
        </SettingsSection>

        {/* 4. Section Pédagogie */}
        <SettingsSection title="Pédagogie">
          <SettingsItem
            icon={CalendarDays}
            iconColor="bg-red-600"
            title="Calendrier Scolaire"
            subtitle="Trimestres et Séquences d'évaluation"
            onClick={() => navigate('/app/pedagogy/calendar')}
          />
          <SettingsItem
            icon={Layers}
            iconColor="bg-orange-600"
            title="Répartition des Séquences"
            subtitle="Définir les évaluations par classe"
            onClick={() => navigate('/app/pedagogy/sequences/repartition')}
          />
          <SettingsItem
            icon={BookOpen}
            iconColor="bg-indigo-600"
            title="Matières"
            subtitle="Bibliothèque et coefficients par classe"
            onClick={() => navigate('/app/pedagogy/matieres')}
          />
          <SettingsItem
            icon={ShieldCheck}
            iconColor="bg-green-600"
            title="Configuration APC"
            subtitle="Compétences par séquence et groupes"
            onClick={() => navigate('/app/pedagogy/apc')}
          />
          <SettingsItem
            icon={Layers}
            iconColor="bg-orange-500"
            title="Groupes de Matières"
            subtitle="Bibliothèque des catégories (Sciences, Littérature...)"
            onClick={() => navigate('/app/pedagogy/apc')} // For now, redirect to APC which has the CRUD
          />
          <SettingsItem
            icon={Zap}
            iconColor="bg-slate-500"
            title="Mode de Notation APC"
            subtitle="Activer l'évaluation CTBA/CNA dans les bulletins"
            action={
                <div
                  onClick={() => setUseCompetences(!useCompetences)}
                  className={clsx(
                    "w-16 h-8 rounded-full transition-all cursor-pointer relative p-1 shadow-inner",
                    useCompetences ? "bg-slate-500 shadow-[0_0_15px_rgba(100,116,139,0.4)]" : "bg-gray-200"
                  )}
                >
                  <div className={clsx(
                    "w-6 h-6 bg-white rounded-full transition-all shadow-md",
                    useCompetences ? "translate-x-8" : "translate-x-0"
                  )} />
                </div>
            }
          />
          <SettingsItem
            icon={Users}
            iconColor="bg-yellow-600"
            title="Personnel & Staff"
            subtitle="Affectation des enseignants et administratifs"
            onClick={() => navigate('/app/admin/staff')}
            showDivider={false}
          />
        </SettingsSection>

        {/* 5. Section Administration & Impression */}
        <SettingsSection title="Administration & Impression">
          <SettingsItem
            icon={Copy}
            iconColor="bg-sky-600"
            title="Doubler les reçus de paiement"
            subtitle="Imprime la copie parent et établissement sur A5"
            action={
                <div
                  onClick={() => setDoubleReceipts(!doubleReceipts)}
                  className={clsx(
                    "w-16 h-8 rounded-full transition-all cursor-pointer relative p-1 shadow-inner",
                    doubleReceipts ? "bg-sky-600 shadow-[0_0_15px_rgba(14,165,233,0.4)]" : "bg-gray-200"
                  )}
                >
                  <div className={clsx(
                    "w-6 h-6 bg-white rounded-full transition-all shadow-md",
                    doubleReceipts ? "translate-x-8" : "translate-x-0"
                  )} />
                </div>
            }
          />
          <SettingsItem
            icon={Phone}
            iconColor="bg-emerald-600"
            title="Nombre de téléphones"
            subtitle={`Téléphones affichés sur l'en-tête (${nbTelephones})`}
            action={
              <div className="flex items-center space-x-6 bg-emerald-50 p-3 rounded-sharp border border-emerald-100 shadow-sm">
                <button
                  onClick={() => nbTelephones > 1 && setNbTelephones(nbTelephones - 1)}
                  className="p-2 hover:bg-emerald-200 rounded-full text-emerald-700 transition-all active:scale-90"
                ><Minus size={18}/></button>
                <span className="font-black text-lg w-6 text-center text-emerald-800">{nbTelephones}</span>
                <button
                  onClick={() => nbTelephones < 3 && setNbTelephones(nbTelephones + 1)}
                  className="p-2 hover:bg-emerald-200 rounded-full text-emerald-700 transition-all active:scale-90"
                ><Plus size={18}/></button>
              </div>
            }
            showDivider={false}
          />
        </SettingsSection>

        {/* 6. Section Système */}
        <SettingsSection title="Système">
          <SettingsItem
            icon={Palette}
            iconColor="bg-pink-600"
            title="Apparence du Portail"
            subtitle="Personnalisation des couleurs et thèmes"
            onClick={() => {/* Handle theme change */}}
          />
          <SettingsItem
            icon={Server}
            iconColor="bg-slate-600"
            title="Configuration Serveur"
            subtitle={serverIp}
            onClick={() => setIsConfigOpen(true)}
            showDivider={false}
          />
        </SettingsSection>
      </div>

      {/* 7. Section Compte */}
      <SettingsSection title="Sécurité">
        <SettingsItem
          icon={LogOut}
          iconColor="bg-red-500"
          title="Déconnexion"
          subtitle="Mettre fin à votre session actuelle"
          onClick={handleLogout}
          showDivider={false}
        />
      </SettingsSection>

      <ServerConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />

      {/* Year Selection Modal */}
      {isYearModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-50 p-6">
              <div className="bg-white rounded-[56px] p-16 max-w-xl w-full shadow-2xl animate-in zoom-in-95 border border-gray-100">
                  <div className="flex items-center space-x-4 text-blue-600 mb-3">
                      <Calendar size={32} />
                      <span className="text-[11px] font-black uppercase tracking-[0.5em]">Scope Temporel</span>
                  </div>
                  <h2 className="text-5xl font-black uppercase tracking-tighter mb-10 text-black">Année Scolaire</h2>

                  <div className="grid grid-cols-1 gap-4">
                      {years.map((year, index) => {
                          const yId = year.idServeur || year.idAnneeScolaire;
                          const activeYId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;
                          const isSelected = activeYId === yId;

                          return (
                            <div
                                key={`${yId}-${index}`}
                                onClick={() => { selectYear(year); setIsYearModalOpen(false); }}
                                className={clsx(
                                    "p-8 border-3 rounded-[32px] cursor-pointer transition-all flex items-center justify-between group",
                                    isSelected ? "border-blue-600 bg-blue-50 shadow-xl" : "border-gray-100 hover:border-gray-300 bg-white"
                                )}
                            >
                                <div className="flex items-center space-x-6">
                                    <div className={clsx(
                                        "w-4 h-4 rounded-full transition-all",
                                        isSelected ? "bg-blue-600 scale-150 ring- ring-blue-100" : "bg-gray-200 group-hover:bg-gray-400"
                                    )} />
                                    <span className={clsx(
                                        "font-black text-xl uppercase tracking-tighter",
                                        isSelected ? "text-blue-700" : "text-black"
                                    )}>{year.libelleAnneeScolaire}</span>
                                </div>
                                {isSelected && <CheckCircle2 size={28} className="text-blue-600 animate-in zoom-in" />}
                            </div>
                          );
                      })}
                  </div>
                  <button
                    onClick={() => setIsYearModalOpen(false)}
                    className="w-full mt-12 py-6 font-black uppercase text-xs tracking-[0.4em] bg-gray-50 text-black rounded-sharp hover:bg-black hover:text-white transition-all shadow-sm"
                  >RETOUR AUX RÉGLAGES</button>
              </div>
          </div>
      )}
    </div>
  );
};

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center space-x-6 ml-10">
        <div className="h-[1px] flex-1 bg-gray-100"></div>
        <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#9E9E9E] whitespace-nowrap">{title}</h3>
        <div className="h-[1px] w-16 bg-gray-100"></div>
    </div>
    <div className="bg-white border border-gray-100 rounded-[48px] overflow-hidden shadow-2xl shadow-gray-500/10">
      {children}
    </div>
  </div>
);

const SettingsItem: React.FC<{
  icon: any;
  iconColor: string;
  title: string;
  subtitle: string;
  onClick?: () => void;
  action?: React.ReactNode;
  showDivider?: boolean;
}> = ({ icon: Icon, iconColor, title, subtitle, onClick, action, showDivider = true }) => (
  <div className="group">
    <div
      className={clsx(
        "p-10 flex items-center justify-between transition-all relative overflow-hidden",
        onClick ? "cursor-pointer hover:bg-gray-50/50 active:scale-[0.99]" : ""
      )}
      onClick={onClick}
    >
      <div className="flex items-center space-x-8 relative z-10">
        <div className={clsx("w-16 h-16 rounded-[24px] flex items-center justify-center text-white shadow-xl transition-all group-hover:scale-110 group-hover:rotate-6", iconColor)}>
          <Icon size={30} />
        </div>
        <div>
          <h4 className="font-black text-xl uppercase tracking-tight text-black group-hover:text-black transition-colors">{title}</h4>
          <p className="text-[11px] font-bold text-[#9E9E9E] uppercase tracking-widest mt-1 group-hover:text-gray-500">{subtitle}</p>
        </div>
      </div>
      <div className="relative z-10">
        {action ? action : (onClick && <div className="p-4 bg-gray-100 rounded-full group-hover:bg-black group-hover:text-white transition-all shadow-sm">
            <ChevronRight size={24} />
        </div>)}
      </div>
      {/* Decorative gradient background on hover */}
      <div className={clsx("absolute -right-10 -bottom-10 w-48 h-48 rounded-full opacity-[0.02] transition-all duration-700 group-hover:scale-150 group-hover:opacity-[0.05]", iconColor)}></div>
    </div>
    {showDivider && <div className="mx-16 border-t border-gray-100/80" />}
  </div>
);

export default SettingsPage;
