import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { financeService } from '../../api/financeService';
import { studentService } from '../../api/studentService';
import {
  Wallet,
  TrendingUp,
  Users,
  Target,
  CalendarDays,
  Sparkles,
  Download,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { clsx } from 'clsx';
import AuthButton from '../../components/ui/AuthButton';

// Version 3.0 - Advanced Temporal Navigation Cockpit

const ReportingCockpitPage: React.FC = () => {
  const { selectedYear } = useSchoolYear();
  const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // States pour la navigation temporelle
  const [period, setPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Autres Filtres
  const [selectedSalleId, setSelectedSalleId] = useState<string>('');
  const [selectedFraisId, setSelectedFraisId] = useState<string>('');
  const [rooms, setRooms] = useState<any[]>([]);
  const [libraryFees, setLibraryFees] = useState<any[]>([]);

  useEffect(() => {
    if (yearId) {
      loadInitialData();
    }
  }, [yearId]);

  useEffect(() => {
    if (yearId) {
      loadStats();
    }
  }, [yearId, period, currentDate, selectedSalleId, selectedFraisId]);

  const loadInitialData = async () => {
      try {
          const [roomsRes, feesRes] = await Promise.all([
              studentService.getRooms(yearId!),
              financeService.getExigibles()
          ]);
          setRooms(roomsRes.data);
          setLibraryFees(feesRes.data);
      } catch (err) {
          console.error("Error loading filter data", err);
      }
  };

  const getDateRange = () => {
      let start = new Date(currentDate);
      let end = new Date(currentDate);

      if (period === 'DAILY') {
          start.setHours(0,0,0,0);
          end.setHours(23,59,59,999);
      } else if (period === 'WEEKLY') {
          const day = start.getDay();
          const diff = start.getDate() - day + (day === 0 ? -6 : 1);
          start.setDate(diff);
          start.setHours(0,0,0,0);
          end = new Date(start);
          end.setDate(start.getDate() + 6);
          end.setHours(23,59,59,999);
      } else if (period === 'MONTHLY') {
          start = new Date(start.getFullYear(), start.getMonth(), 1);
          end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
          end.setHours(23,59,59,999);
      } else {
          // ANNUAL - On utilise les dates de l'année scolaire si dispo
          if (selectedYear?.dateDebut && selectedYear?.dateFin) {
              start = new Date(selectedYear.dateDebut);
              end = new Date(selectedYear.dateFin);
          } else {
              start = new Date(start.getFullYear(), 0, 1);
              end = new Date(start.getFullYear(), 11, 31);
          }
      }
      return { start, end };
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const res = await financeService.getCockpitAggregates(yearId!, {
          period,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          idSalle: selectedSalleId || undefined,
          idFrais: selectedFraisId || undefined
      });
      setStats(res.data);
    } catch (err) {
      console.error("Error loading cockpit stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (direction: 'PREV' | 'NEXT') => {
      const newDate = new Date(currentDate);
      const step = direction === 'PREV' ? -1 : 1;

      if (period === 'DAILY') newDate.setDate(newDate.getDate() + step);
      else if (period === 'WEEKLY') newDate.setDate(newDate.getDate() + (step * 7));
      else if (period === 'MONTHLY') newDate.setMonth(newDate.getMonth() + step);

      // Contrainte Annuelle (Sécurité)
      if (selectedYear?.dateDebut && selectedYear?.dateFin) {
          const startLimit = new Date(selectedYear.dateDebut);
          const endLimit = new Date(selectedYear.dateFin);
          if (newDate < startLimit || newDate > endLimit) return;
      }

      setCurrentDate(newDate);
  };

  const KpiCard = ({ title, value, subValue, icon: Icon, color }: any) => (
    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
      <div className="flex justify-between items-start mb-6">
        <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform", color)}>
          <Icon size={28} />
        </div>
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9E9E9E] mb-1">{title}</p>
      <h3 className="text-3xl font-black text-black tracking-tighter">{value}</h3>
      <p className="text-[11px] font-bold text-secondary mt-2">{subValue}</p>
    </div>
  );

  const { start, end } = getDateRange();
  const dateLabel = period === 'DAILY' ? start.toLocaleDateString() :
                    period === 'ANNUAL' ? selectedYear?.libelleAnneeScolaire :
                    `${start.toLocaleDateString()} — ${end.toLocaleDateString()}`;

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20 p-4">
      {/* Header & Main Filters */}
      <div className="bg-white p-10 rounded-[48px] shadow-xl border border-gray-100 relative overflow-hidden flex flex-col xl:flex-row xl:items-center justify-between gap-8">
         <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

         <div className="relative z-10">
            <h1 className="text-5xl font-black uppercase tracking-tighter text-black flex items-center gap-4">
               Cockpit <span className="text-accent">D'Analyse</span>
            </h1>
            <div className="flex items-center gap-3 mt-3">
               <div className="bg-black text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">Live Tracking</div>
               <p className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">Pilotage stratégique — {selectedYear?.libelleAnneeScolaire}</p>
            </div>
         </div>

         <div className="flex flex-wrap items-center gap-4 relative z-10">
            <select
                className="h-14 px-6 bg-gray-50 border-none rounded-2xl font-black text-[9px] uppercase tracking-widest focus:ring-2 focus:ring-accent outline-none"
                value={selectedSalleId}
                onChange={e => setSelectedSalleId(e.target.value)}
            >
                <option value="">Toutes les Salles</option>
                {rooms.map(r => (
                    <option key={r.idSalle} value={r.idSalle}>{r.Classe?.libelleClasseFr} {r.nomSalle}</option>
                ))}
            </select>

            <select
                className="h-14 px-6 bg-gray-50 border-none rounded-2xl font-black text-[9px] uppercase tracking-widest focus:ring-2 focus:ring-accent outline-none"
                value={selectedFraisId}
                onChange={e => setSelectedFraisId(e.target.value)}
            >
                <option value="">Tous les Frais</option>
                {libraryFees.map(f => (
                    <option key={f.idFraisExigible} value={f.idFraisExigible}>{f.fraisFr}</option>
                ))}
            </select>

            <AuthButton className="bg-black shadow-2xl px-8 h-14" onClick={() => window.print()}>
                <Download size={18} className="mr-2" /> Synthèse PDF
            </AuthButton>
         </div>
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <KpiCard
            title="Revenu Global"
            value={`${(stats?.revenue?.total || 0).toLocaleString()} FCFA`}
            subValue="Sur la période sélectionnée"
            icon={TrendingUp}
            color="bg-accent"
          />
          <KpiCard
            title="Taux de Recouvrement"
            value={`${(stats?.performance?.recoveryRate || 0).toFixed(1)}%`}
            subValue="Tranches échues uniquement"
            icon={Target}
            color="bg-orange-500"
          />
          <KpiCard
            title="Insolvables"
            value={stats?.students?.insolvables || 0}
            subValue="Élèves avec reliquats échus"
            icon={AlertCircle}
            color="bg-red-600"
          />
          <KpiCard
            title="Effectif Total"
            value={stats?.students?.total || 0}
            subValue="Élèves inscrits"
            icon={Users}
            color="bg-green-600"
          />
          <KpiCard
            title="Assiduité"
            value={`${(stats?.performance?.attendanceRate || 0).toFixed(1)}%`}
            subValue="Présence moyenne"
            icon={Sparkles}
            color="bg-purple-600"
          />
      </div>

      {/* Main Analysis Block (Evolution + Navigation) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          <div className="bg-white p-10 rounded-[56px] border border-gray-100 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                  <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight">Évolution des Encaissements</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-[9px] font-black uppercase tracking-widest">{dateLabel}</span>
                      </div>
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-[24px]">
                      <div className="flex gap-1">
                          {['DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL'].map(p => (
                              <button
                                  key={p}
                                  onClick={() => setPeriod(p as any)}
                                  className={clsx(
                                      "px-4 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                                      period === p ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-black"
                                  )}
                              >{p === 'DAILY' ? 'Jour' : p === 'WEEKLY' ? 'Semaine' : p === 'MONTHLY' ? 'Mois' : 'Année'}</button>
                          ))}
                      </div>

                      {period !== 'ANNUAL' && (
                          <div className="flex items-center gap-2 border-l border-gray-200 pl-4 ml-2">
                              <button
                                onClick={() => handleNavigate('PREV')}
                                className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-black hover:text-white transition-all"
                              >
                                  <ChevronLeft size={18} />
                              </button>
                              <button
                                onClick={() => handleNavigate('NEXT')}
                                className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-black hover:text-white transition-all"
                              >
                                  <ChevronRight size={18} />
                              </button>
                          </div>
                      )}
                  </div>
              </div>

              <div className="h-[450px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <AreaChart data={stats?.revenue?.evolution || []}>
                          <defs>
                              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}}
                            dy={15}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}}
                          />
                          <Tooltip
                            contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px'}}
                          />
                          <Area type="monotone" dataKey="montant" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-black p-10 rounded-[56px] text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>

              <div>
                <h3 className="text-xl font-black uppercase tracking-tight relative z-10">Réussite Académique</h3>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2 relative z-10">Performance globale de l'année</p>

                <div className="mt-12 space-y-12">
                    <div>
                        <p className="text-6xl font-black">{(stats?.performance?.progressionPass || 0).toFixed(0)}%</p>
                        <p className="text-[10px] font-black text-green-400 uppercase mt-2 tracking-[0.2em]">Taux de passage estimé</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-gray-500">Moyenne Générale</span>
                            <span className="text-white">{(stats?.performance?.academicAvg || 0).toFixed(2)} / 20</span>
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${(stats?.performance?.academicAvg || 0) * 5}%` }}></div>
                        </div>
                    </div>
                </div>
              </div>

              <div className="mt-20 pt-8 border-t border-white/10">
                  <p className="text-[9px] font-black text-gray-500 uppercase leading-relaxed">
                      Ce taux est calculé en comparant la moyenne actuelle de chaque élève aux seuils de réussite définis pour chaque cycle.
                  </p>
              </div>
          </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center space-y-4">
             <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
             <p className="font-black uppercase text-[10px] tracking-widest text-black">Calcul des indicateurs...</p>
        </div>
      )}
    </div>
  );
};

export default ReportingCockpitPage;
