import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { pedagogyService } from '../../api/pedagogyService';
import { schoolService } from '../../api/schoolService';
import {
    Printer,
    ArrowLeft,
    Loader2,
    Download,
    Users,
    DoorOpen,
    CheckCircle2
} from 'lucide-react';
import { clsx } from 'clsx';

const ReportPrintPage: React.FC = () => {
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
                const name = searchParams.get('name') || "Rapport Académique";
                const type = searchParams.get('type') || "A";
                setReportInfo({ id: reportId, name, type });

                setLoading(false);
            } catch (error) {
                console.error("Erreur chargement rapport impression:", error);
                setLoading(false);
            }
        };

        loadData();
    }, [reportId, idClasse, idAnneeScolaire]);

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="w-12 h-12 animate-spin text-green-600 mb-4" />
                <p className="font-black uppercase tracking-widest text-xs text-gray-400">Préparation de l'impression...</p>
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
                    <span>Imprimer (A4)</span>
                </button>
            </div>

            {/* Print Content */}
            <div className="flex flex-col items-center space-y-8 print:space-y-0">
                {data.map((section, sIdx) => (
                    <div key={sIdx} className="report-page w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[15mm] print:shadow-none print:w-[210mm] print:page-break-after-always relative overflow-hidden flex flex-col">

                        {/* School Header */}
                        <div className="flex justify-between items-start pb-4 mb-6 border-b-2 border-black">
                            <div className="w-[35%] text-[8px] font-black uppercase leading-tight space-y-1">
                                <p>REPUBLIQUE DU CAMEROUN</p>
                                <p className="text-gray-400">REPUBLIC OF CAMEROON</p>
                                <p>Paix - Travail - Patrie</p>
                                <p className="text-gray-400 italic">Peace - Work - Fatherland</p>
                            </div>

                            <div className="flex-1 flex flex-col items-center text-center px-4">
                                {schoolInfo?.logo && <img src={schoolInfo.logo} className="h-16 mb-2 object-contain" alt="Logo" />}
                                <h1 className="text-sm font-black uppercase tracking-tighter leading-tight text-black">{schoolInfo?.nomFr || "ÉTABLISSEMENT"}</h1>
                                <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                    {schoolInfo?.ville} | BP: {schoolInfo?.numBP} | Tel: {schoolInfo?.tel1}
                                </p>
                            </div>

                            <div className="w-[35%] text-[8px] font-black uppercase text-right leading-tight space-y-1">
                                <p>MINISTERE DES ENSEIGNEMENTS SECONDAIRES</p>
                                <p className="text-gray-400">MINISTRY OF SECONDARY EDUCATION</p>
                                <p>DÉLÉGATION RÉGIONALE DU CENTRE</p>
                            </div>
                        </div>

                        {/* Report Title */}
                        <div className="text-center mb-8">
                            <div className="inline-block border-2 border-black px-8 py-2 bg-gray-50 rounded-xl">
                                <h2 className="text-xl font-black uppercase tracking-[0.2em] text-black">{reportInfo?.name}</h2>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest mt-3 text-gray-500">
                                Année Scolaire : {searchParams.get('yearLabel') || 'N/A'} • Salle : {section.nomSalle}
                            </p>
                        </div>

                        {/* Dynamic Design based on Type */}
                        <div className="flex-1">
                            {reportInfo?.type === 'A' && section.eleves && (
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-black text-white">
                                            <th className="border border-black px-2 py-2 text-[9px] font-black uppercase w-8 text-center">N°</th>
                                            <th className="border border-black px-3 py-2 text-[9px] font-black uppercase text-left w-24">Matricule</th>
                                            <th className="border border-black px-4 py-2 text-[9px] font-black uppercase text-left">Nom & Prénom de l'élève</th>
                                            <th className="border border-black px-2 py-2 text-[9px] font-black uppercase w-10 text-center">Sexe</th>
                                            <th className="border border-black px-3 py-2 text-[9px] font-black uppercase w-24 text-center">Né(e) le</th>
                                            <th className="border border-black px-3 py-2 text-[9px] font-black uppercase w-20 text-center">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {section.eleves.map((item: any, idx: number) => (
                                            <tr key={item.id} className={clsx(idx % 2 === 1 && "bg-gray-50")}>
                                                <td className="border border-black px-2 py-2 text-[10px] text-center font-bold">{idx + 1}</td>
                                                <td className="border border-black px-3 py-2 text-[10px] font-bold text-gray-500 uppercase">{item.matricule}</td>
                                                <td className="border border-black px-4 py-2 text-[11px] font-black uppercase text-black">{item.nom} {item.prenom}</td>
                                                <td className="border border-black px-2 py-2 text-[10px] text-center font-black">{item.sexe}</td>
                                                <td className="border border-black px-3 py-2 text-[10px] text-center">{new Date(item.date).toLocaleDateString()}</td>
                                                <td className="border border-black px-3 py-2 text-[9px] text-center font-black uppercase">{item.statut}</td>
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
                                            <p className="text-[9px] font-black uppercase text-pink-600">Filles</p>
                                            <p className="text-2xl font-black">{section.stats.girls} ({section.stats.girlsPercent}%)</p>
                                        </div>
                                        <div className="p-4 text-center">
                                            <p className="text-[9px] font-black uppercase text-blue-600">Garçons</p>
                                            <p className="text-2xl font-black">{section.stats.boys} ({section.stats.boysPercent}%)</p>
                                        </div>
                                        <div className="p-4 text-center bg-gray-50">
                                            <p className="text-[9px] font-black uppercase text-gray-400">Effectif Total</p>
                                            <p className="text-2xl font-black">{section.stats.total}</p>
                                        </div>
                                    </div>

                                    {/* Split Tables */}
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase mb-4 text-pink-600 border-b border-pink-100 pb-2">Liste des Filles ({section.stats.girls})</h4>
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
                                            <h4 className="text-[10px] font-black uppercase mb-4 text-blue-600 border-b border-blue-100 pb-2">Liste des Garçons ({section.stats.boys})</h4>
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
                                                <th className="border border-black px-4 py-2 text-[9px] font-black uppercase text-left w-64">Nom & Prénom de l'élève</th>
                                                {[...Array(31)].map((_, i) => (
                                                    <th key={i} className="border border-black p-0 text-[6px] font-black uppercase w-6 text-center">
                                                        <div className="border-b border-black">{i + 1}</div>
                                                        <div className="flex">
                                                            <span className="flex-1 border-r border-black">M</span>
                                                            <span className="flex-1">S</span>
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
                        <div className="mt-auto pt-10">
                            <div className="flex justify-between items-end">
                                <div className="text-[8px] text-gray-400 italic">
                                    Extrait le {new Date().toLocaleString()} - Logiciel Scholar v3.1
                                </div>
                                <div className="flex space-x-12">
                                    <div className="w-48 text-center">
                                        <p className="text-[10px] font-black uppercase underline mb-16">Le Principal / Le Chef d'établissement</p>
                                        <p className="text-[8px] text-gray-300 italic">(Cachet et Signature)</p>
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
