import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { studentService } from '../../api/studentService';
import {
    Printer,
    ArrowLeft,
    Loader2,
    FileText,
    Users,
    CheckCircle2
} from 'lucide-react';
import { clsx } from 'clsx';

const StudentDocumentPrintPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [docData, setDocData] = useState<any>(null);

    const docType = searchParams.get('docType');
    const idEleve = searchParams.get('idEleve');
    const idAnneeScolaire = searchParams.get('idAnneeScolaire');

    useEffect(() => {
        const loadData = async () => {
            if (!docType || !idEleve || !idAnneeScolaire) return;
            setLoading(true);
            try {
                const res = await studentService.getOfficialDocumentData(
                    parseInt(idEleve),
                    parseInt(idAnneeScolaire),
                    docType
                );
                setDocData(res.data);

                // Set Document Title
                const docNameMap: any = {
                    'CERTIFICAT_SCOLARITE': 'Certificat de Scolarité',
                    'CERTIFICAT_PROMOTION': 'Certificat de Promotion',
                    'GLOBAL_RECEIPT_HISTORY': 'Historique des Paiements',
                    'YEAR_RECEIPT': "Reçu Global de l'Année"
                };
                const docName = docNameMap[docType] || docType.split('_').join(' ');
                if (res.data?.student?.nomComplet) {
                   document.title = `${docName} ${res.data.student.nomComplet} ${res.data.inscription.AnneeScolaire.libelleAnneeScolaire}`;
                }

                setLoading(false);
            } catch (error) {
                console.error("Erreur chargement document impression:", error);
                setLoading(false);
            }
        };

        loadData();
    }, [docType, idEleve, idAnneeScolaire]);

    if (loading || !docData) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="w-12 h-12 animate-spin text-accent mb-4" />
                <p className="font-black uppercase tracking-widest text-xs text-gray-400">Génération du document officiel...</p>
            </div>
        );
    }

    const { school, student, printerName, printDate, paymentHistory } = docData;

    return (
        <div className="min-h-screen bg-gray-100 py-10 print:bg-white print:p-0 no-print-bg">
            {/* Header Controls */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-4 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full border border-gray-200 shadow-2xl print:hidden">
                <button onClick={() => window.close()} className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-500">
                    <ArrowLeft size={20} />
                </button>
                <div className="h-6 w-px bg-gray-200 mx-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-black">
                    Document Officiel - {student.nomComplet}
                </p>
                <button
                    onClick={() => window.print()}
                    className="ml-4 px-6 py-2 bg-black text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all flex items-center space-x-2"
                >
                    <Printer size={16} />
                    <span>Imprimer (A4)</span>
                </button>
            </div>

            {/* A4 Page Content */}
            <div className="flex flex-col items-center">
                <div className="report-page w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[20mm] print:shadow-none print:w-[210mm] relative flex flex-col border border-gray-100">

                    {/* School Header */}
                    <div className="flex justify-between items-start pb-6 mb-10 border-b-2 border-black">
                        <div className="w-[35%] text-[8px] font-black uppercase leading-tight space-y-1">
                            <p>REPUBLIQUE DU CAMEROUN</p>
                            <p className="text-gray-400">REPUBLIC OF CAMEROON</p>
                            <p>Paix - Travail - Patrie</p>
                            <p className="text-gray-400 italic">Peace - Work - Fatherland</p>
                        </div>

                        <div className="flex-1 flex flex-col items-center text-center px-4">
                            {school?.logo && <img src={school.logo} className="h-20 mb-3 object-contain" alt="Logo" />}
                            <h1 className="text-lg font-black uppercase tracking-tighter leading-tight text-black">{school?.nomFr || "ÉTABLISSEMENT"}</h1>
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1 italic">"{school?.deviseFr}"</p>
                            <p className="text-[9px] font-bold text-black uppercase tracking-widest mt-2">
                                {school?.ville} | BP: {school?.numBp} | Tel: {school?.telephone1}
                            </p>
                        </div>

                        <div className="w-[35%] text-[8px] font-black uppercase text-right leading-tight space-y-1">
                            <p>MINISTERE DES ENSEIGNEMENTS SECONDAIRES</p>
                            <p className="text-gray-400">MINISTRY OF SECONDARY EDUCATION</p>
                            <p>DÉLÉGATION RÉGIONALE DU CENTRE</p>
                        </div>
                    </div>

                    {/* Content based on Document Type */}
                    <div className="flex-1 flex flex-col">
                        <div className="flex-1">
                            {docType === 'CERTIFICAT_SCOLARITE' && (
                                <div className="space-y-12 py-10">
                                    <h2 className="text-4xl font-black text-center uppercase tracking-[0.2em] underline decoration-4 underline-offset-8">CERTIFICAT DE SCOLARITÉ</h2>

                                    <div className="text-lg leading-[2] text-justify space-y-8 font-medium">
                                        <p>
                                            Le Chef d'établissement soussigné, certifie que l'élève <span className="font-black uppercase text-xl">{student.nomComplet}</span>,
                                            né(e) le <span className="font-black">{new Date(student.dateNaissance).toLocaleDateString()}</span> à <span className="font-black">{student.lieuNaissance}</span>,
                                            est régulièrement inscrit(e) dans notre établissement pour l'année scolaire <span className="font-black text-accent">{docData.inscription.AnneeScolaire.libelleAnneeScolaire}</span>.
                                        </p>
                                        <p>
                                            Il/Elle est inscrit(e) en classe de <span className="font-black text-xl">{student.classeLabel}</span>, salle <span className="font-black">{student.salleLabel}</span>,
                                            sous le matricule <span className="font-black">{student.matricule}</span>.
                                        </p>
                                        <p>
                                            En foi de quoi, le présent certificat lui est délivré pour servir et valoir ce que de droit.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {docType === 'CERTIFICAT_PROMOTION' && (
                                <div className="space-y-12 py-10">
                                    <h2 className="text-4xl font-black text-center uppercase tracking-[0.2em] underline decoration-4 underline-offset-8">CERTIFICAT DE PROMOTION</h2>

                                    <div className="text-lg leading-[2] text-justify space-y-8 font-medium">
                                        <p>
                                            Le Conseil des Professeurs de l'établissement <span className="font-black">{school.nomFr}</span>,
                                            réuni à l'issue de l'année scolaire <span className="font-black">{docData.inscription.AnneeScolaire.libelleAnneeScolaire}</span>,
                                            déclare que l'élève <span className="font-black uppercase text-xl">{student.nomComplet}</span>,
                                            inscrit(e) en classe de <span className="font-black">{student.classeLabel}</span>, est admis(e) en classe supérieure.
                                        </p>
                                        <p>
                                            Ce certificat atteste de ses aptitudes académiques et de son comportement exemplaire durant tout son cursus au sein de notre institution.
                                        </p>
                                        <p>
                                            Délivré pour servir et valoir ce que de droit.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {(docType === 'GLOBAL_RECEIPT_HISTORY' || docType === 'YEAR_RECEIPT') && (
                                <div className="space-y-8">
                                    <h2 className="text-3xl font-black text-center uppercase tracking-widest bg-gray-50 py-4 border-2 border-black rounded-2xl">
                                        {docType === 'YEAR_RECEIPT' ? "REÇU GLOBAL DE L'ANNÉE" : "RELEVÉ GLOBAL DES PAIEMENTS"}
                                    </h2>

                                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-gray-400">Élève</p>
                                            <p className="text-xl font-black uppercase">{student.nomComplet}</p>
                                            <p className="text-sm font-bold text-accent">{student.matricule}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase text-gray-400">Classe / Salle</p>
                                            <p className="text-lg font-black uppercase">{student.classeLabel}</p>
                                            <p className="text-sm font-bold">{student.salleLabel}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-10">
                                        {paymentHistory?.map((yearData: any, yIdx: number) => (
                                            <div key={yIdx} className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-0.5 flex-1 bg-gray-100"></div>
                                                    <span className="px-6 py-1 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest">{yearData.year}</span>
                                                    <div className="h-0.5 flex-1 bg-gray-100"></div>
                                                </div>

                                                <table className="w-full border-collapse">
                                                    <thead>
                                                        <tr className="bg-gray-100">
                                                            <th className="border border-gray-200 px-4 py-2 text-[10px] font-black uppercase text-left">Type de Frais</th>
                                                            <th className="border border-gray-200 px-4 py-2 text-[10px] font-black uppercase text-right w-32">Montant Versé</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {yearData.exigibles.map((e: any, idx: number) => (
                                                            <tr key={`ex-${idx}`}>
                                                                <td className="border border-gray-200 px-4 py-2 text-[11px] font-bold uppercase">{e.label}</td>
                                                                <td className="border border-gray-200 px-4 py-2 text-[11px] text-right font-black">{e.amount.toLocaleString()} CFA</td>
                                                            </tr>
                                                        ))}
                                                        {yearData.periscolaires.map((p: any, idx: number) => (
                                                            <tr key={`pe-${idx}`}>
                                                                <td className="border border-gray-200 px-4 py-2 text-[11px] font-bold uppercase">Périscolaire - {p.label}</td>
                                                                <td className="border border-gray-200 px-4 py-2 text-[11px] text-right font-black">{p.amount.toLocaleString()} CFA</td>
                                                            </tr>
                                                        ))}
                                                        {yearData.transport > 0 && (
                                                            <tr>
                                                                <td className="border border-gray-200 px-4 py-2 text-[11px] font-bold uppercase">Service de Transport</td>
                                                                <td className="border border-gray-200 px-4 py-2 text-[11px] text-right font-black">{yearData.transport.toLocaleString()} CFA</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                    <tfoot className="bg-black text-white font-black">
                                                        <tr>
                                                            <td className="px-4 py-3 text-[11px] uppercase tracking-widest">Total Annuel</td>
                                                            <td className="px-4 py-3 text-right text-lg">{yearData.total.toLocaleString()} CFA</td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer / Validation */}
                        <div className="mt-auto pt-10 border-t border-gray-100">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-[11px] font-black uppercase text-black">Imprimé par : {printerName}</p>
                                    <p className="text-[9px] text-gray-400 italic">
                                        Généré le {new Date(printDate).toLocaleString()} - Logiciel Scholar v3.1
                                    </p>
                                </div>
                                <div className="w-64 text-center">
                                    <p className="text-[13px] font-black uppercase underline mb-24">Le Chef d'établissement</p>
                                    <p className="text-[11px] text-gray-300 italic">(Signature et Cachet)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
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
                        border: none !important;
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

export default StudentDocumentPrintPage;
