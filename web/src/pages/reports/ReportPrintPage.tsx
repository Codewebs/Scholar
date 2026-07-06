import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { pedagogyService } from '../../api/pedagogyService';
import { schoolService } from '../../api/schoolService';
import { useTranslation } from 'react-i18next';
import {
    Printer,
    ArrowLeft,
    Loader2,
    Users
} from 'lucide-react';
import { clsx } from 'clsx';

const ReportPrintPage: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [reportInfo, setReportInfo] = useState<any>(null);
    const [schoolInfo, setSchoolInfo] = useState<any>(null);

    const reportId = searchParams.get('reportId');
    const idClasse = searchParams.get('idClasse');
    const idAnneeScolaire = searchParams.get('idAnneeScolaire');

    useEffect(() => {
        const loadData = async () => {
            if (!reportId || !idClasse || !idAnneeScolaire) return;
            setLoading(true);
            try {
                const schoolId = localStorage.getItem('school_id');
                const [reportRes, schoolRes] = await Promise.all([
                    pedagogyService.getReportData(reportId, {
                        idClasse: parseInt(idClasse),
                        idAnneeScolaire: parseInt(idAnneeScolaire)
                    }),
                    schoolId ? schoolService.getSchool(parseInt(schoolId)) : Promise.resolve({ data: null })
                ]);

                setData(reportRes.data);
                setSchoolInfo(schoolRes.data);

                // Get report name (can be passed via query or hardcoded)
                const name = searchParams.get('name') || t('reports.print.academic_report');
                const type = searchParams.get('type') || "A";
                setReportInfo({ id: reportId, name, type });

                setLoading(false);
            } catch (error) {
                console.error("Erreur chargement rapport impression:", error);
                setLoading(false);
            }
        };

        loadData();
    }, [reportId, idClasse, idAnneeScolaire, t]);

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="w-12 h-12 animate-spin text-green-600 mb-4" />
                <p className="font-black uppercase tracking-widest text-xs text-gray-400">{t('reports.print.preparing')}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-10 print:bg-white print:p-0 no-print-bg">
            {/* Header Controls */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-4 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full border border-gray-200 shadow-2xl print:hidden">
                <button onClick={() => window.close()} className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-500">
                    <ArrowLeft size={20} />
                </button>
                <div className="h-6 w-px bg-gray-200 mx-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-black">
                    {reportInfo?.name}
                </p>
                <button
                    onClick={() => window.print()}
                    className="ml-4 px-6 py-2 bg-black text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all flex items-center space-x-2"
                >
                    <Printer size={16} />
                    <span>{t('common.print')} (A4)</span>
                </button>
            </div>

            {/* Print Content */}
            <div className="flex flex-col items-center space-y-8 print:space-y-0">
                {data.map((section, sIdx) => (
                    <div key={sIdx} className="report-page w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[15mm] print:shadow-none print:w-[210mm] print:page-break-after-always relative flex flex-col">

                        {/* School Header */}
                        <div className="flex justify-between items-start pb-4 mb-6 border-b-2 border-black">
                            <div className="w-[35%] text-[8px] font-black uppercase leading-tight space-y-1">
                                <p>{t('reports.print.republic_cameroon')}</p>
                                <p className="text-gray-400">{t('reports.print.republic_cameroon_en')}</p>
                                <p>{t('reports.print.peace_work_fatherland')}</p>
                                <p className="text-gray-400 italic">{t('reports.print.peace_work_fatherland_en')}</p>
                            </div>

                            <div className="flex-1 flex flex-col items-center text-center px-4">
                                {schoolInfo?.logo && <img src={schoolInfo.logo} className="h-16 mb-2 object-contain" alt="Logo" />}
                                <h1 className="text-sm font-black uppercase tracking-tighter leading-tight text-black">{schoolInfo?.nomFr || t('dashboard.label_school')}</h1>
                                <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                    {schoolInfo?.ville} | BP: {schoolInfo?.numBP} | Tel: {schoolInfo?.tel1}
                                </p>
                            </div>

                            <div className="w-[35%] text-[8px] font-black uppercase text-right leading-tight space-y-1">
                                <p>{t('reports.print.min_sec_edu')}</p>
                                <p className="text-gray-400">{t('reports.print.min_sec_edu_en')}</p>
                                <p>{t('reports.print.regional_delegation')}</p>
                            </div>
                        </div>

                        {/* Report Title */}
                        <div className="text-center mb-8">
                            <div className="inline-block border-2 border-black px-8 py-2 bg-gray-50 rounded-xl">
                                <h2 className="text-xl font-black uppercase tracking-[0.2em] text-black">{reportInfo?.name}</h2>
                            </div>
                            {reportInfo?.id === 'daily_payments' && (
                                <p className="text-sm font-black mt-2">{t('reports.print.day_of')} {new Date(section.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</p>
                            )}
                            <p className="text-[10px] font-black uppercase tracking-widest mt-3 text-gray-500">
                                {t('reports.print.academic_year')} : {searchParams.get('yearLabel') || 'N/A'} • {t('reports.print.room')} : {section.nomSalle}
                            </p>
                        </div>

                        {/* Dynamic Design based on Type */}
                        <div className="flex-1">
                            {reportInfo?.id === 'insolvent_fees' && section.eleves && (
                                <div className="space-y-6">
                                    <div className="flex justify-end">
                                        <div className="bg-black text-white px-6 py-2 rounded-xl text-center">
                                            <p className="text-[8px] font-black uppercase tracking-widest opacity-60">{t('reports.print.recovery_rate')}</p>
                                            <p className="text-xl font-black">{section.stats?.tauxRecouvrement || 0}%</p>
                                        </div>
                                    </div>
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-100 text-black">
                                                <th className="border border-black px-2 py-2 text-[9px] font-black uppercase w-8 text-center">N°</th>
                                                <th className="border border-black px-4 py-2 text-[9px] font-black uppercase text-left">{t('reports.print.student')}</th>
                                                <th className="border border-black px-3 py-2 text-[9px] font-black uppercase text-right w-24">{t('reports.print.due')}</th>
                                                <th className="border border-black px-3 py-2 text-[9px] font-black uppercase text-right w-24">{t('reports.print.paid')}</th>
                                                <th className="border border-black px-3 py-2 text-[9px] font-black uppercase text-right w-28 bg-red-50 text-red-600">{t('reports.print.balance')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {section.eleves.map((item: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td className="border border-black px-2 py-2 text-[10px] text-center">{idx + 1}</td>
                                                    <td className="border border-black px-4 py-2 text-[11px] font-black uppercase">{item.nom} {item.prenom}</td>
                                                    <td className="border border-black px-3 py-2 text-[10px] text-right font-bold">{item.attendu?.toLocaleString()}</td>
                                                    <td className="border border-black px-3 py-2 text-[10px] text-right font-bold text-green-600">{item.paye?.toLocaleString()}</td>
                                                    <td className="border border-black px-3 py-2 text-[11px] text-right font-black text-red-600 bg-red-50/30">{item.reste?.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {reportInfo?.id === 'insolvent_perischool' && section.eleves && (
                                <div className="space-y-6">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-100 text-black">
                                                <th className="border border-black px-2 py-2 text-[9px] font-black uppercase w-8 text-center">N°</th>
                                                <th className="border border-black px-4 py-2 text-[9px] font-black uppercase text-left">{t('reports.print.full_name')}</th>
                                                <th className="border border-black px-3 py-2 text-[9px] font-black uppercase text-left">{t('reports.print.activity')}</th>
                                                <th className="border border-black px-2 py-2 text-[9px] font-black uppercase text-right w-20">{t('reports.print.tariff')}</th>
                                                <th className="border border-black px-2 py-2 text-[9px] font-black uppercase text-right w-20">{t('reports.print.total_paid')}</th>
                                                <th className="border border-black px-2 py-2 text-[9px] font-black uppercase text-right w-24 bg-red-50 text-red-600">{t('reports.print.debt')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {section.eleves.map((item: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td className="border border-black px-2 py-2 text-[10px] text-center font-bold">{idx + 1}</td>
                                                    <td className="border border-black px-4 py-2 text-[11px] font-black uppercase text-black">{item.nom}</td>
                                                    <td className="border border-black px-3 py-2 text-[10px] uppercase font-bold text-gray-500">{item.activite}</td>
                                                    <td className="border border-black px-2 py-2 text-[10px] text-right font-bold">{item.tariff.toLocaleString()}</td>
                                                    <td className="border border-black px-2 py-2 text-[10px] text-right font-bold text-green-600">{item.paye.toLocaleString()}</td>
                                                    <td className="border border-black px-2 py-2 text-[11px] text-right font-black text-red-600 bg-red-50/30">{item.dette.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {reportInfo?.id === 'global_financial' && section.eleves && (
                                <div className="report-landscape">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-black text-white">
                                                <th rowSpan={2} className="border border-black px-4 py-2 text-[9px] font-black uppercase text-left">{t('reports.print.student')}</th>
                                                <th colSpan={2} className="border border-black px-2 py-2 text-[8px] font-black uppercase text-center">{t('reports.print.schooling')}</th>
                                                <th colSpan={1} className="border border-black px-2 py-2 text-[8px] font-black uppercase text-center">{t('reports.print.activities')}</th>
                                                <th colSpan={2} className="border border-black px-2 py-2 text-[8px] font-black uppercase text-center">{t('reports.print.transport')}</th>
                                                <th rowSpan={2} className="border border-black px-4 py-2 text-[9px] font-black uppercase text-right bg-red-600">{t('reports.print.total_balance')}</th>
                                            </tr>
                                            <tr className="bg-gray-100 text-[7px] font-black uppercase">
                                                <th className="border border-black p-1 text-center">{t('reports.print.due')}</th>
                                                <th className="border border-black p-1 text-center">{t('reports.print.paid')}</th>
                                                <th className="border border-black p-1 text-center">{t('reports.print.paid')}</th>
                                                <th className="border border-black p-1 text-center">{t('reports.print.due')}</th>
                                                <th className="border border-black p-1 text-center">{t('reports.print.paid')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {section.eleves.map((item: any, idx: number) => (
                                                <tr key={idx} className="text-[9px]">
                                                    <td className="border border-black px-4 py-2 font-black uppercase flex items-center gap-2">
                                                        <div className={clsx("w-2 h-2 rounded-full", item.solde <= 0 ? "bg-green-500" : "bg-red-500")}></div>
                                                        {item.nom}
                                                    </td>
                                                    <td className="border border-black px-2 py-2 text-center text-gray-400">{item.exigible.du.toLocaleString()}</td>
                                                    <td className="border border-black px-2 py-2 text-center font-bold">{item.exigible.paye.toLocaleString()}</td>
                                                    <td className="border border-black px-2 py-2 text-center font-bold">{item.peri.paye.toLocaleString()}</td>
                                                    <td className="border border-black px-2 py-2 text-center text-gray-400">{item.transport.du.toLocaleString()}</td>
                                                    <td className="border border-black px-2 py-2 text-center font-bold">{item.transport.paye.toLocaleString()}</td>
                                                    <td className={clsx("border border-black px-4 py-2 text-right font-black", item.solde > 0 ? "text-red-600 bg-red-50" : "text-green-600")}>
                                                        {item.solde.toLocaleString()} CFA
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {reportInfo?.id === 'daily_payments' && section.eleves && (
                                <div className="space-y-8">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-100 text-black">
                                                <th className="border border-black px-2 py-2 text-[8px] font-black uppercase text-center w-16">{t('reports.print.time')}</th>
                                                <th className="border border-black px-4 py-2 text-[9px] font-black uppercase text-left">{t('reports.print.student')}</th>
                                                <th className="border border-black px-2 py-2 text-[8px] font-black uppercase text-center w-20">{t('reports.print.mode')}</th>
                                                <th className="border border-black px-2 py-2 text-[8px] font-black uppercase text-left">{t('reports.print.ref')}</th>
                                                <th className="border border-black px-2 py-2 text-[8px] font-black uppercase text-right w-20">{t('reports.print.schooling')}</th>
                                                <th className="border border-black px-2 py-2 text-[8px] font-black uppercase text-right w-20">{t('reports.print.others')}</th>
                                                <th className="border border-black px-4 py-2 text-[9px] font-black uppercase text-right w-28 bg-black text-white">{t('reports.print.total')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {section.eleves.map((item: any, idx: number) => (
                                                <tr key={idx} className="text-[9.5px]">
                                                    <td className="border border-black px-2 py-2 text-center font-bold text-gray-400">{item.heure}</td>
                                                    <td className="border border-black px-4 py-2 font-black uppercase">{item.nom}</td>
                                                    <td className="border border-black px-2 py-2 text-center font-bold">{item.mode}</td>
                                                    <td className="border border-black px-2 py-2 italic text-gray-500">{item.ref}</td>
                                                    <td className="border border-black px-2 py-2 text-right">{item.scolarite.toLocaleString()}</td>
                                                    <td className="border border-black px-2 py-2 text-right">{(item.peri + item.transport).toLocaleString()}</td>
                                                    <td className="border border-black px-4 py-2 text-right font-black bg-gray-50">{item.total.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-black text-white font-black text-[10px]">
                                            <tr>
                                                <td colSpan={6} className="border border-black px-4 py-3 text-right uppercase tracking-widest">{t('reports.print.total_recovered')}</td>
                                                <td className="border border-black px-4 py-3 text-right">{section.eleves.reduce((s: number, e: any) => s + e.total, 0).toLocaleString()} CFA</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}

                            {reportInfo?.id.startsWith('fees_bilan') && (
                                <div className="space-y-12">
                                    <div className="grid grid-cols-2 gap-10">
                                        <div className="bg-gray-50 p-8 rounded-[40px] border-2 border-black flex flex-col items-center justify-center">
                                            <p className="text-[10px] font-black uppercase tracking-widest mb-2">{t('reports.print.realization_rate')}</p>
                                            <p className="text-5xl font-black">{section.taux}%</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                                <span className="text-[10px] font-bold uppercase text-gray-500">{t('reports.print.forecasts')}</span>
                                                <span className="font-black">{section.attendu.toLocaleString()} CFA</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                                <span className="text-[10px] font-bold uppercase text-gray-500">{t('reports.print.realizations')}</span>
                                                <span className="font-black text-green-600">{section.paye.toLocaleString()} CFA</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                                <span className="text-[10px] font-bold uppercase text-gray-500">{t('reports.print.gap')}</span>
                                                <span className="font-black text-red-600">{section.ecart.toLocaleString()} CFA</span>
                                            </div>
                                        </div>
                                    </div>

                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-black text-white">
                                                <th className="border border-black px-4 py-3 text-[10px] font-black uppercase text-left">{t('reports.print.detailed_section')}</th>
                                                <th className="border border-black px-4 py-3 text-[10px] font-black uppercase text-right">{t('reports.print.due')}</th>
                                                <th className="border border-black px-4 py-3 text-[10px] font-black uppercase text-right">{t('reports.print.recovered')}</th>
                                                <th className="border border-black px-4 py-3 text-[10px] font-black uppercase text-right">RP (%)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {section.details.map((d: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td className="border border-black px-4 py-2 text-[11px] font-bold uppercase">{d.label}</td>
                                                    <td className="border border-black px-4 py-2 text-[11px] text-right">{d.attendu?.toLocaleString() || '-'}</td>
                                                    <td className="border border-black px-4 py-2 text-[11px] text-right font-black">{d.paye.toLocaleString()}</td>
                                                    <td className="border border-black px-4 py-2 text-[11px] text-right font-black">
                                                        {d.attendu ? Math.round((d.paye / d.attendu) * 100) : '-'}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {reportInfo?.id === 'scholarship' && section.eleves && (
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-black text-white">
                                            <th className="border border-black px-4 py-3 text-[10px] font-black uppercase text-left">{t('reports.print.id_number')}</th>
                                            <th className="border border-black px-4 py-3 text-[10px] font-black uppercase text-left">{t('reports.print.full_name')}</th>
                                            <th className="border border-black px-4 py-3 text-[10px] font-black uppercase text-right">{t('reports.print.normal_tariff')}</th>
                                            <th className="border border-black px-4 py-3 text-[10px] font-black uppercase text-right">{t('reports.print.applied_tariff')}</th>
                                            <th className="border border-black px-4 py-3 text-[10px] font-black uppercase text-left">{t('reports.print.reason')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {section.eleves.map((item: any, idx: number) => (
                                            <tr key={idx}>
                                                <td className="border border-black px-4 py-2 text-[11px] font-bold">{item.matricule}</td>
                                                <td className="border border-black px-4 py-2 text-[11px] font-black uppercase">{item.nom}</td>
                                                <td className="border border-black px-4 py-2 text-[11px] text-right">{item.tarifNormal.toLocaleString()} CFA</td>
                                                <td className="border border-black px-4 py-2 text-[11px] text-right font-black">{item.tarifApplique.toLocaleString()} CFA</td>
                                                <td className="border border-black px-4 py-2 text-[10px] italic">{item.motif}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {reportInfo?.id === 'gender_split' && (
                                <div className="space-y-10">
                                    {/* Stats Ratio */}
                                    <div className="grid grid-cols-3 border-2 border-black divide-x-2 divide-black rounded-xl overflow-hidden mb-6">
                                        <div className="p-4 text-center">
                                            <p className="text-[9px] font-black uppercase text-pink-600">{t('reports.print.girls')}</p>
                                            <p className="text-2xl font-black">{section.stats.girls} ({section.stats.girlsPercent}%)</p>
                                        </div>
                                        <div className="p-4 text-center">
                                            <p className="text-[9px] font-black uppercase text-blue-600">{t('reports.print.boys')}</p>
                                            <p className="text-2xl font-black">{section.stats.boys} ({section.stats.boysPercent}%)</p>
                                        </div>
                                        <div className="p-4 text-center bg-gray-50">
                                            <p className="text-[9px] font-black uppercase text-gray-400">{t('reports.print.total_effectif')}</p>
                                            <p className="text-2xl font-black">{section.stats.total}</p>
                                        </div>
                                    </div>

                                    {/* Split Tables */}
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase mb-4 text-pink-600 border-b border-pink-100 pb-2">{t('reports.print.girls_list')} ({section.stats.girls})</h4>
                                            <table className="w-full border-collapse">
                                                <tbody>
                                                    {section.girls.map((f: any, idx: number) => (
                                                        <tr key={idx}>
                                                            <td className="border border-gray-200 px-2 py-1.5 text-[10px] text-center w-8">{idx + 1}</td>
                                                            <td className="border border-gray-200 px-3 py-1.5 text-[10px] font-black uppercase">{f.nom} {f.prenom}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase mb-4 text-blue-600 border-b border-blue-100 pb-2">{t('reports.print.boys_list')} ({section.stats.boys})</h4>
                                            <table className="w-full border-collapse">
                                                <tbody>
                                                    {section.boys.map((m: any, idx: number) => (
                                                        <tr key={idx}>
                                                            <td className="border border-gray-200 px-2 py-1.5 text-[10px] text-center w-8">{idx + 1}</td>
                                                            <td className="border border-gray-200 px-3 py-1.5 text-[10px] font-black uppercase">{m.nom} {m.prenom}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {reportInfo?.id === 'attendance_monthly' && section.eleves && (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-black">
                                        <thead>
                                            <tr>
                                                <th className="border border-black px-2 py-2 text-[8px] font-black uppercase w-8">N°</th>
                                                <th className="border border-black px-4 py-2 text-[9px] font-black uppercase text-left w-64">{t('reports.print.full_name')}</th>
                                                {[...Array(31)].map((_, i) => (
                                                    <th key={i} className="border border-black p-0 text-[6px] font-black uppercase w-6 text-center">
                                                        <div className="border-b border-black">{i + 1}</div>
                                                        <div className="flex">
                                                            <span className="flex-1 border-r border-black">{t('reports.print.morning')}</span>
                                                            <span className="flex-1">{t('reports.print.evening')}</span>
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {section.eleves.map((item: any, idx: number) => (
                                                <tr key={item.id}>
                                                    <td className="border border-black px-2 py-2 text-[9px] text-center font-bold">{idx + 1}</td>
                                                    <td className="border border-black px-4 py-2 text-[9px] font-black uppercase truncate">{item.nom} {item.prenom}</td>
                                                    {[...Array(31)].map((_, i) => (
                                                        <td key={i} className="border border-black p-0 h-8">
                                                            <div className="flex h-full">
                                                                <div className="flex-1 border-r border-gray-200"></div>
                                                                <div className="flex-1"></div>
                                                            </div>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {reportInfo?.id === 'trombinoscope' && section.eleves && (
                                <div className="grid grid-cols-4 gap-6">
                                    {section.eleves.map((eleve: any) => (
                                        <div key={eleve.id} className="border border-black p-2 flex flex-col items-center">
                                            <div className="w-full aspect-[3/4] bg-gray-100 flex items-center justify-center border-b border-black mb-2 overflow-hidden">
                                                {eleve.photo ? <img src={eleve.photo} className="w-full h-full object-cover" /> : <Users size={40} className="text-gray-300" />}
                                            </div>
                                            <p className="text-[9px] font-black uppercase text-center leading-tight">{eleve.nom} {eleve.prenom}</p>
                                            <p className="text-[8px] font-bold text-gray-500 mt-1">{eleve.matricule}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer / Validation */}
                        <div className="mt-auto pt-10 border-t border-gray-100">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-black">{t('reports.print.printed_by')} : {user?.nom || user?.email || t('reports.print.administrator')}</p>
                                    <p className="text-[8px] text-gray-400 italic">
                                        {t('reports.print.extracted_at')} {new Date().toLocaleString()} - {t('reports.print.software_version')}
                                    </p>
                                </div>
                                <div className="flex space-x-12">
                                    <div className="w-48 text-center">
                                        <p className="text-[10px] font-black uppercase underline mb-16">{t('reports.print.school_head')}</p>
                                        <p className="text-[8px] text-gray-300 italic">{t('reports.print.stamp_signature')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                ))}
            </div>

            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .report-page {
                        page-break-after: always !important;
                        page-break-inside: avoid !important;
                        break-after: page !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                    }
                }
                .no-print-bg {
                    background-color: #E5E7EB;
                }
                @media print {
                    .no-print-bg {
                        background-color: white !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ReportPrintPage;
