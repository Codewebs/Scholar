import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { financeService } from '../../api/financeService';
import {
  FileText,
  Calendar,
  Printer,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  History,
  ArrowLeft,
  Banknote,
  Search,
  Users
} from 'lucide-react';
import { clsx } from 'clsx';
import AuthButton from '../../components/ui/AuthButton';

const FinancialReportsPage: React.FC = () => {
    const { selectedYear } = useSchoolYear();
    const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;

    const [reportType, setReportType] = useState<'DAILY' | 'MONTHLY' | 'INSOLVABLES'>('DAILY');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (yearId) {
            loadReport();
        }
    }, [yearId, reportType, selectedDate]);

    const loadReport = async () => {
        console.log("🚀 [Report] Loading report:", { reportType, selectedDate });
        setLoading(true);
        try {
            let res;
            if (reportType === 'DAILY') {
                res = await financeService.getBilanJournalier(yearId!, selectedDate);
            } else if (reportType === 'MONTHLY') {
                res = await financeService.getBilanMensuel(yearId!);
            } else {
                res = await financeService.getInsolvablesList(yearId!, 0);
            }
            console.log("✅ [Report] Data received:", res.data);
            setData(res.data);
        } catch (err) {
            console.error("❌ [Report] Error loading report:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-10 animate-in fade-in duration-500 pb-20 p-4">
            {/* Header Area */}
            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-6">
                    <button onClick={() => window.history.back()} className="p-3 hover:bg-gray-100 rounded-full bg-gray-50 transition-all">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-black">États Financiers</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">Bordereaux de caisse et listes de contrôle</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex p-1.5 bg-gray-100 rounded-2xl">
                        {[
                            { id: 'DAILY', label: 'Journalier', icon: Calendar },
                            { id: 'MONTHLY', label: 'Mensuel', icon: TrendingUp },
                            { id: 'INSOLVABLES', label: 'Insolvables', icon: AlertCircle },
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setReportType(t.id as any)}
                                className={clsx(
                                    "px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                                    reportType === t.id ? "bg-white text-black shadow-md" : "text-[#9E9E9E] hover:text-black"
                                )}
                            >
                                <t.icon size={14} />
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-8 items-start">
                {/* Left Controls */}
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-10">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-6 text-accent flex items-center gap-3">
                            <Search size={16} /> Filtres du rapport
                        </h3>
                        <div className="space-y-6">
                            {reportType === 'DAILY' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] ml-2">Sélectionner le jour</label>
                                    <input
                                        type="date"
                                        className="w-full h-14 px-6 bg-gray-50 border border-transparent rounded-[20px] font-bold text-sm focus:bg-white focus:border-black transition-all outline-none"
                                        value={selectedDate}
                                        onChange={e => setSelectedDate(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="bg-gray-50 p-6 rounded-[28px] border border-gray-100 space-y-4">
                                <div className="flex items-center justify-between text-[10px] font-black uppercase text-[#9E9E9E]">
                                    <span>Total Encaissé</span>
                                    <span className="text-black">{reportType === 'DAILY' ? 'Aujourd\'hui' : 'Ce mois'}</span>
                                </div>
                                <p className="text-3xl font-black text-black">
                                    {(data?.totalRecouvre ?? data?.transactions?.reduce((sum: number, t: any) => sum + (t.montantTotal || 0), 0) ?? 0).toLocaleString()} FCFA
                                </p>
                                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-[65%]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <AuthButton className="w-full py-5 rounded-[24px]">
                            <Printer size={20} className="mr-3" /> Imprimer le Bordereau
                        </AuthButton>
                        <button className="w-full py-5 border-2 border-gray-100 rounded-[24px] font-black uppercase text-[10px] tracking-widest text-secondary hover:border-black hover:text-black transition-all">
                            Exporter en Excel
                        </button>
                    </div>
                </div>

                {/* Right Results */}
                <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                    <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
                                <FileText size={20} />
                            </div>
                            <h2 className="font-black uppercase tracking-tight text-lg">Détails des transactions</h2>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[9px] font-black uppercase tracking-widest">
                            {(data?.transactions || data?.paiements || []).length} Opérations
                        </span>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        {loading ? (
                            <div className="p-20 text-center animate-pulse">
                                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-[10px] font-black uppercase text-secondary tracking-widest">Calcul du bilan...</p>
                            </div>
                        ) : (data?.transactions || data?.paiements || []).length === 0 ? (
                            <div className="p-32 text-center opacity-30">
                                <Banknote size={64} className="mx-auto mb-6" />
                                <p className="font-black uppercase text-xl">Aucune donnée</p>
                                <p className="text-[10px] font-black uppercase tracking-widest mt-2">Aucune transaction enregistrée pour cette période</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9E9E9E]">
                                        <th className="px-8 py-6">Réf.</th>
                                        <th className="px-8 py-6">Élève</th>
                                        <th className="px-8 py-6">Classe</th>
                                        <th className="px-8 py-6">Mode</th>
                                        <th className="px-8 py-6 text-right">Montant</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(data?.transactions || data?.paiements || []).map((p: any) => (
                                        <tr key={p.idPaiementFraisGlobal} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <span className="font-mono text-[10px] text-secondary">#FS-{p.idPaiementFraisGlobal}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="font-black text-xs uppercase text-black">{p.Eleve?.nom} {p.Eleve?.prenom}</p>
                                                <p className="text-[9px] font-bold text-secondary uppercase mt-1">{p.Eleve?.matricule || 'N/A'}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-[10px] font-black uppercase">{p.Eleve?.Inscription?.[0]?.Salle?.Classe?.libelleClasseFr || p.Eleve?.classeLabel || '---'}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={clsx(
                                                    "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                                                    p.modePaiement === 'CASH' ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                                                )}>{p.modePaiement}</span>
                                            </td>
                                            <td className="px-8 py-6 text-right font-black text-sm">
                                                {(p.montantTotal || 0).toLocaleString()} <span className="text-[9px] text-secondary">FCFA</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Insolvables Table Summary (Conditional) */}
            {reportType === 'INSOLVABLES' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8">
                     <div className="bg-red-600 p-8 rounded-[48px] text-white space-y-6">
                         <div className="flex items-center justify-between">
                            <Users size={32} />
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Élèves concernés</p>
                         </div>
                         <h4 className="text-4xl font-black">{data?.insolvables?.length || 0}</h4>
                         <p className="text-[11px] font-bold uppercase opacity-80">Élèves ayant un reliquat sur la tranche sélectionnée</p>
                     </div>
                     {/* More insolvency details cards... */}
                </div>
            )}
        </div>
    );
};

export default FinancialReportsPage;
