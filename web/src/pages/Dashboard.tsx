import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchoolYear } from '../context/SchoolYearContext';
import { schoolService } from '../api/schoolService';
import { dashboardService } from '../api/dashboardService';
import { School, SetupProgress } from '../types/models';
import { menuGroups } from '../utils/menuStructure';
import { Link } from 'react-router-dom';
import {
  Wifi,
  WifiOff,
  ChevronDown,
  Plus,
  Globe
} from 'lucide-react';
import { clsx } from 'clsx';
import ServerConfigModal from '../components/ServerConfigModal';

const Dashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { years, selectedYear, fetchYears, selectYear } = useSchoolYear();

  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Initial Load: Schools
  useEffect(() => {
    if (user?.id) {
      schoolService.getUserSchools(user.id).then(res => {
        setSchools(res.data);
        const savedSchoolId = localStorage.getItem('school_id');
        if (savedSchoolId) {
          const school = res.data.find(s => (s.idServeur || s.idEtablissement) === Number(savedSchoolId));
          if (school) setSelectedSchool(school);
        } else if (res.data.length > 0) {
          setSelectedSchool(res.data[0]);
        }
      });
    }
  }, [user]);

  // Load Years when School changes
  useEffect(() => {
    const sId = selectedSchool?.idServeur || selectedSchool?.idEtablissement;
    if (sId) {
      localStorage.setItem('school_id', sId.toString());
      fetchYears(sId);
    }
  }, [selectedSchool, fetchYears]);

  // Network check
  useEffect(() => {
     const sId = selectedSchool?.idServeur || selectedSchool?.idEtablissement;
     const yId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;
     if (sId) {
        dashboardService.getSetupProgress(sId, yId)
          .then(() => setIsOnline(true))
          .catch(() => setIsOnline(false));
     }
  }, [selectedSchool, selectedYear]);

  const flatMenuItems = menuGroups.flatMap(g => g.items).filter(item => !item.permission || hasPermission(item.permission));

  const cardTheme = (title: string) => {
    const themes: Record<string, { badge: string; icon: string; title: string; description: string; } > = {
      'Tableau de Bord': {
        badge: 'bg-indigo-100 group-hover:bg-indigo-200',
        icon: 'text-indigo-600 group-hover:text-indigo-700',
        title: 'text-indigo-900 group-hover:text-indigo-950',
        description: 'text-indigo-500'
      },
      'Actualités': {
        badge: 'bg-emerald-100 group-hover:bg-emerald-200',
        icon: 'text-emerald-600 group-hover:text-emerald-700',
        title: 'text-emerald-900 group-hover:text-emerald-950',
        description: 'text-emerald-500'
      },
      "Cockpit d'Analyse": {
        badge: 'bg-amber-100 group-hover:bg-amber-200',
        icon: 'text-amber-600 group-hover:text-amber-700',
        title: 'text-amber-900 group-hover:text-amber-950',
        description: 'text-amber-500'
      },
      'Structure Scolaire': {
        badge: 'bg-violet-100 group-hover:bg-violet-200',
        icon: 'text-violet-600 group-hover:text-violet-700',
        title: 'text-violet-900 group-hover:text-violet-950',
        description: 'text-violet-500'
      },
      'Élèves': {
        badge: 'bg-cyan-100 group-hover:bg-cyan-200',
        icon: 'text-cyan-600 group-hover:text-cyan-700',
        title: 'text-cyan-900 group-hover:text-cyan-950',
        description: 'text-cyan-500'
      },
      'Matières': {
        badge: 'bg-amber-100 group-hover:bg-amber-200',
        icon: 'text-amber-600 group-hover:text-amber-700',
        title: 'text-amber-900 group-hover:text-amber-950',
        description: 'text-amber-500'
      },
      'Notes & Examens': {
        badge: 'bg-rose-100 group-hover:bg-rose-200',
        icon: 'text-rose-600 group-hover:text-rose-700',
        title: 'text-rose-900 group-hover:text-rose-950',
        description: 'text-rose-500'
      },
      'Bulletins Scolaires': {
        badge: 'bg-indigo-100 group-hover:bg-indigo-200',
        icon: 'text-indigo-600 group-hover:text-indigo-700',
        title: 'text-indigo-900 group-hover:text-indigo-950',
        description: 'text-indigo-500'
      },
      'Encaissements': {
        badge: 'bg-teal-100 group-hover:bg-teal-200',
        icon: 'text-teal-600 group-hover:text-teal-700',
        title: 'text-teal-900 group-hover:text-teal-950',
        description: 'text-teal-500'
      },
      'Bilans Financiers': {
        badge: 'bg-sky-100 group-hover:bg-sky-200',
        icon: 'text-sky-600 group-hover:text-sky-700',
        title: 'text-sky-900 group-hover:text-sky-950',
        description: 'text-sky-500'
      },
      'Mon Établissement': {
        badge: 'bg-slate-100 group-hover:bg-slate-200',
        icon: 'text-slate-600 group-hover:text-slate-700',
        title: 'text-slate-900 group-hover:text-slate-950',
        description: 'text-slate-500'
      },
      'Utilisateurs': {
        badge: 'bg-fuchsia-100 group-hover:bg-fuchsia-200',
        icon: 'text-fuchsia-600 group-hover:text-fuchsia-700',
        title: 'text-fuchsia-900 group-hover:text-fuchsia-950',
        description: 'text-fuchsia-500'
      },
      'Configuration': {
        badge: 'bg-orange-100 group-hover:bg-orange-200',
        icon: 'text-orange-600 group-hover:text-orange-700',
        title: 'text-orange-900 group-hover:text-orange-950',
        description: 'text-orange-500'
      }
    };

    return themes[title] || {
      badge: 'bg-gray-100 group-hover:bg-gray-200',
      icon: 'text-slate-600 group-hover:text-slate-800',
      title: 'text-slate-900 group-hover:text-slate-950',
      description: 'text-slate-500'
    };
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-6xl font-black text-black mb-3 tracking-tighter uppercase leading-none">Tableau de bord</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsConfigOpen(true)}
              className="flex items-center bg-white px-4 py-2 border border-border rounded-sharp hover:border-black transition-all group"
            >
              {isOnline ? <Wifi size={14} className="text-green-500 mr-2" /> : <WifiOff size={14} className="text-red-500 mr-2" />}
              <span className={clsx("text-[10px] font-black uppercase tracking-widest mr-3", isOnline ? "text-green-600" : "text-red-600")}>
                {isOnline ? "Connecté au serveur" : "Serveur hors-ligne"}
              </span>
              <Globe size={12} className="text-[#9E9E9E] group-hover:text-accent transition-colors" />
            </button>
          </div>
        </div>

        {/* Selectors Row */}
        <div className="flex flex-wrap gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-[#9E9E9E] tracking-widest ml-1">Établissement Actif</label>
            <div className="relative">
              <select
                className="appearance-none bg-white border border-border px-6 py-3.5 pr-14 rounded-sharp font-black text-xs uppercase tracking-tight focus:border-black outline-none transition-all cursor-pointer shadow-sm hover:shadow-lg"
                value={(selectedSchool?.idServeur || selectedSchool?.idEtablissement) || ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSelectedSchool(schools.find(s => (s.idServeur || s.idEtablissement) === val) || null);
                }}
              >
                {schools.map((s, index) => {
                  const sId = s.idServeur || s.idEtablissement;
                  return <option key={`${sId}-${index}`} value={sId}>{s.nomFr}</option>;
                })}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-black pointer-events-none" size={18} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-[#9E9E9E] tracking-widest ml-1">Année Scolaire</label>
            <div className="relative">
              <select
                className="appearance-none bg-white border border-border px-6 py-3.5 pr-14 rounded-sharp font-black text-xs uppercase tracking-tight focus:border-black outline-none transition-all cursor-pointer shadow-sm hover:shadow-lg"
                value={(selectedYear?.idServeur || selectedYear?.idAnneeScolaire) || ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const year = years.find(y => (y.idServeur || y.idAnneeScolaire) === val) || null;
                  if (year) selectYear(year);
                }}
              >
                <option value="">Sélectionner...</option>
                {years.map((y, index) => {
                  const yId = y.idServeur || y.idAnneeScolaire;
                  return <option key={`${yId}-${index}`} value={yId}>{y.libelleAnneeScolaire}</option>;
                })}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-black pointer-events-none" size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {flatMenuItems.map((item, idx) => {
          const theme = cardTheme(item.title);
          return (
            <Link
              key={idx}
              to={item.path}
              className="group bg-white p-6 border border-border rounded-[24px] hover:border-black hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[170px] relative overflow-hidden"
            >
              <div className="flex justify-between items-start relative z-10">
                <div className={`p-3 rounded-soft shadow-sm transition-all duration-300 ${theme.badge}`}>
                  <item.icon size={24} className={`${theme.icon} transition-colors`} />
                </div>
                <div className="w-3 h-3 rounded-full bg-black/10 shadow-[0_0_12px_rgba(0,0,0,0.08)] animate-pulse"></div>
              </div>
              <div className="relative z-10 mt-6">
                <h3 className={`font-black text-lg uppercase tracking-tight mb-1 transition-transform duration-300 group-hover:translate-x-1 ${theme.title}`}>{item.title}</h3>
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-black opacity-80">Gérer le module {item.title.toLowerCase()}</p>
              </div>
              <div className="absolute -right-6 -bottom-6 opacity-[0.04] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-700 pointer-events-none">
                <item.icon size={130} className="text-black/5" />
              </div>
            </Link>
          );
        })}

        <button className="border-2 border-dashed border-border p-6 rounded-[24px] hover:border-black hover:bg-gray-50 transition-all flex flex-col items-center justify-center space-y-3 group min-h-[170px]">
          <div className="p-3 bg-gray-100 rounded-full group-hover:bg-black group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-xl group-hover:shadow-black/20">
            <Plus size={24} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#9E9E9E] group-hover:text-black">Ajouter</span>
        </button>
      </div>

      <ServerConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </div>
  );
};

export default Dashboard;
