import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { financeService } from '../../api/financeService';
import { studentService } from '../../api/studentService';
import { pedagogyService } from '../../api/pedagogyService';
import { useTranslation } from 'react-i18next';
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
  Filter,
  Printer,
  Banknote
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
  const { t } = useTranslation();
  const { selectedYear } = useSchoolYear();
  const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // States pour la navigation temporelle
  const [period, setPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Scope & Granularité (Version 4.0)
  const [scope, setScope] = useState<'ALL' | 'CYCLE' | 'CLASSE' | 'SALLE'>('ALL');
  const [selectedScopeId, setSelectedScopeId] = useState<string>('');

  // Data for Filters
  const [cycles, setCycles] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [periodes, setPeriodes] = useState<any[]>([]);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<string>('');

  // Autres Filtres
  const [selectedFraisId] = useState<string>('');
  // const [libraryFees, setLibraryFees] = useState<any[]>([]);

  useEffect(() => {
    if (yearId) {
      loadInitialData();
    }
  }, [yearId]);

  useEffect(() => {
    if (yearId) {
      loadStats();
    }
  }, [yearId, period, currentDate, scope, selectedScopeId, selectedFraisId, selectedPeriodeId]);

  const loadInitialData = async () => {
      try {
          const [roomsRes, cyclesRes, classesRes, periodesRes] = await Promise.all([
              studentService.getRooms(yearId!),
              studentService.getCycles(yearId!),
              studentService.getClasses(yearId!),
              pedagogyService.getPeriodes(yearId!)
          ]);
          setRooms(roomsRes.data);
          setCycles(cyclesRes.data);
          setClasses(classesRes.data);
          setPeriodes(periodesRes.data);
      } catch (err) {
          console.error("Error loading filter data", err);
      }
  };

  const getDateRange = () => {
      let start = new Date(currentDate);
      let end = new Date(currentDate);

      // Si une période (séquence/trimestre) est sélectionnée, on utilise ses dates
      if (selectedPeriodeId) {
          const p = periodes.find(per => per.idPeriode.toString() === selectedPeriodeId);
          if (p?.dateDebut && p?.dateFin) {
              return { start: new Date(p.dateDebut), end: new Date(p.dateFin) };
          }
      }

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
          idSalle: scope === 'SALLE' ? selectedScopeId : undefined,
          idClasse: scope === 'CLASSE' ? selectedScopeId : undefined,
          idCycle: scope === 'CYCLE' ? selectedScopeId : undefined,
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

  const reportModules = [
    { id: 1, title: t('reports.modules.daily_journal.title'), desc: t('reports.modules.daily_journal.desc'), icon: Banknote },
    { id: 2, title: t('reports.modules.monthly_balance.title'), desc: t('reports.modules.monthly_balance.desc'), icon: TrendingUp },
    { id: 3, title: t('reports.modules.audit.title'), desc: t('reports.modules.audit.desc'), icon: AlertCircle },
    { id: 4, title: t('reports.modules.recovery.title'), desc: t('reports.modules.recovery.desc'), icon: Target },
    { id: 5, title: t('reports.modules.insolvency_pyramid.title'), desc: t('reports.modules.insolvency_pyramid.desc'), icon: Filter },
    { id: 6, title: t('reports.modules.scholarships.title'), desc: t('reports.modules.scholarships.desc'), icon: Sparkles },
    { id: 7, title: t('reports.modules.annex_services.title'), desc: t('reports.modules.annex_services.desc'), icon: Wallet },
    { id: 8, title: t('reports.modules.treasury_forecast.title'), desc: t('reports.modules.treasury_forecast.desc'), icon: CalendarDays },
    { id: 9, title: t('reports.modules.result_account.title'), desc: t('reports.modules.result_account.desc'), icon: TrendingUp },
    { id: 10, title: t('reports.modules.edu_fin_balance.title'), desc: t('reports.modules.edu_fin_balance.desc'), icon: Users },
  ];

  const renderChips = () => {
    let items: any[] = [];
    if (scope === 'CYCLE') items = cycles.map(c => ({ id: c.idCycle.toString(), label: c.libelleCycle }));
    else if (scope === 'CLASSE') items = classes.map(c => ({ id: c.idClasse.toString(), label: c.libelleClasseFr }));
    else if (scope === 'SALLE') items = rooms.map(r => ({ id: r.idSalle.toString(), label: `${r.Classe?.libelleClasseFr || ''} ${r.nomSalle}` }));

    if (items.length === 0 && scope !== 'ALL') return null;

    return (
        <div className="flex flex-wrap gap-2 mt-6 animate-in slide-in-from-top-4 duration-300">
            {items.map(item => (
                <button
                    key={item.id}
                    onClick={() => setSelectedScopeId(item.id)}
                    className={clsx(
                        "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                        selectedScopeId === item.id
                            ? "bg-black text-white border-black shadow-lg scale-105"
                            : "bg-white text-gray-500 border-gray-100 hover:border-black hover:text-black"
                    )}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20 p-4">
      {/* Header & Main Filters (Version 4.0 - Advanced Scope) */}
      <div className="bg-white p-10 rounded-[48px] shadow-xl border border-gray-100 relative overflow-hidden flex flex-col gap-10">
         <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

         <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 relative z-10">
            <div>
                <h1 className="text-5xl font-black uppercase tracking-tighter text-black flex items-center gap-4">
                   {t('reports.cockpit.title').split(' ')[0]} <span className="text-accent">{t('reports.cockpit.title').split(' ').slice(1).join(' ')}</span>
                </h1>
                <div className="flex items-center gap-3 mt-3">
                   <div className="bg-black text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">{t('reports.cockpit.live_tracking')}</div>
                   <p className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">{t('reports.cockpit.subtitle', { year: selectedYear?.libelleAnneeScolaire })}</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <div className="flex p-1.5 bg-gray-100 rounded-[24px]">
                    {[
                        { id: 'ALL', label: t('reports.cockpit.scopes.all') },
                        { id: 'CYCLE', label: t('reports.cockpit.scopes.cycle') },
                        { id: 'CLASSE', label: t('reports.cockpit.scopes.classe') },
                        { id: 'SALLE', label: t('reports.cockpit.scopes.salle') },
                    ].map(s => (
                        <button
                            key={s.id}
                            onClick={() => { setScope(s.id as any); setSelectedScopeId(''); }}
                            className={clsx(
                                "px-6 py-3 rounded-[18px] text-[9px] font-black uppercase tracking-widest transition-all",
                                scope === s.id ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-black"
                            )}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                <AuthButton className="bg-black shadow-2xl px-8 h-14" onClick={() => window.print()}>
                    <Download size={18} className="mr-2" /> {t('reports.cockpit.pdf_synthesis')}
                </AuthButton>
            </div>
         </div>

         <div className="relative z-10">
             <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
                 <div className="flex gap-2">
                    <button
                        onClick={() => setSelectedPeriodeId('')}
                        className={clsx(
                            "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                            !selectedPeriodeId ? "bg-accent text-white border-accent" : "bg-gray-50 text-gray-400 border-transparent"
                        )}
                    >{t('reports.cockpit.periods.full_year')}</button>
                    {periodes.map(p => (
                        <button
                            key={p.idPeriode}
                            onClick={() => setSelectedPeriodeId(p.idPeriode.toString())}
                            className={clsx(
                                "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                                selectedPeriodeId === p.idPeriode.toString() ? "bg-accent text-white border-accent" : "bg-gray-50 text-gray-400 border-transparent"
                            )}
                        >{p.libellePeriodeFr}</button>
                    ))}
                 </div>
             </div>

             {renderChips()}
         </div>
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <KpiCard
            title={t('reports.cockpit.kpi.revenue')}
            value={`${(stats?.revenue?.total || 0).toLocaleString()} FCFA`}
            subValue={t('reports.cockpit.kpi.revenue_sub')}
            icon={TrendingUp}
            color="bg-accent"
          />
          <KpiCard
            title={t('reports.cockpit.kpi.recovery')}
            value={`${(stats?.performance?.recoveryRate || 0).toFixed(1)}%`}
            subValue={t('reports.cockpit.kpi.recovery_sub')}
            icon={Target}
            color="bg-orange-500"
          />
          <KpiCard
            title={t('reports.cockpit.kpi.insolvables')}
            value={stats?.students?.insolvables || 0}
            subValue={t('reports.cockpit.kpi.insolvables_sub')}
            icon={AlertCircle}
            color="bg-red-600"
          />
          <KpiCard
            title={t('reports.cockpit.kpi.students')}
            value={stats?.students?.total || 0}
            subValue={t('reports.cockpit.kpi.students_sub')}
            icon={Users}
            color="bg-green-600"
          />
          <KpiCard
            title={t('reports.cockpit.kpi.attendance')}
            value={`${(stats?.performance?.attendanceRate || 0).toFixed(1)}%`}
            subValue={t('reports.cockpit.kpi.attendance_sub')}
            icon={Sparkles}
            color="bg-purple-600"
          />
      </div>

      {/* Main Analysis Block (Evolution + Navigation) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          <div className="bg-white p-10 rounded-[56px] border border-gray-100 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                  <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight">{t('reports.cockpit.evolution')}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-[9px] font-black uppercase tracking-widest">{dateLabel}</span>
                      </div>
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-[24px]">
                      <div className="flex gap-1">
                          {[
                            { id: 'DAILY', label: t('reports.cockpit.periods.daily') },
                            { id: 'WEEKLY', label: t('reports.cockpit.periods.weekly') },
                            { id: 'MONTHLY', label: t('reports.cockpit.periods.monthly') },
                            { id: 'ANNUAL', label: t('reports.cockpit.periods.annual') }
                          ].map(p => (
                              <button
                                  key={p.id}
                                  onClick={() => setPeriod(p.id as any)}
                                  className={clsx(
                                      "px-4 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                                      period === p.id ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-black"
                                  )}
                              >{p.label}</button>
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
                <h3 className="text-xl font-black uppercase tracking-tight relative z-10">{t('reports.cockpit.academic_success')}</h3>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2 relative z-10">{t('reports.cockpit.academic_success_sub')}</p>

                <div className="mt-12 space-y-12">
                    <div>
                        <p className="text-6xl font-black">{(stats?.performance?.progressionPass || 0).toFixed(0)}%</p>
                        <p className="text-[10px] font-black text-green-400 uppercase mt-2 tracking-[0.2em]">{t('reports.cockpit.estimated_pass_rate')}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-gray-500">{t('reports.cockpit.general_average')}</span>
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
                      {t('reports.cockpit.success_rate_calc')}
                  </p>
              </div>
          </div>
      </div>

      {/* Robust Financial Reports Engine - 10 Modules Grid */}
      <div className="space-y-6">
          <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black uppercase tracking-tighter">{t('reports.cockpit.financial_reports_engine').split(' ')[0]} {t('reports.cockpit.financial_reports_engine').split(' ')[1]} <span className="text-accent">{t('reports.cockpit.financial_reports_engine').split(' ').slice(2).join(' ')}</span></h2>
              <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-secondary">{t('reports.cockpit.a4_preview_ready')}</span>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {reportModules.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden"
                  >
                      <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-all">
                              <m.icon size={24} />
                          </div>
                          <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-accent text-white rounded-xl">
                              <Printer size={16} />
                          </button>
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-wider mb-2">{m.title}</h4>
                      <p className="text-[10px] font-bold text-secondary leading-relaxed">{m.desc}</p>

                      <div className="absolute bottom-0 left-0 w-full h-1 bg-accent scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                  </div>
              ))}
          </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center space-y-4">
             <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
             <p className="font-black uppercase text-[10px] tracking-widest text-black">{t('reports.cockpit.calculating')}</p>
        </div>
      )}
    </div>
  );
};

export default ReportingCockpitPage;
