import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { financeService } from '../../api/financeService';
import {
    Printer,
    ArrowLeft,
    Loader2
} from 'lucide-react';
import { clsx } from 'clsx';

const receiptTranslations: any = {
    FR: {
        schoolYear: "Année Scolaire",
        receiptNo: "N°",
        fullName: "Noms et Prénoms",
        matricule: "Matricule",
        birthInfo: "Date et Lieu de naissance",
        at: "à",
        sex: "Sexe",
        class: "Classe",
        repeater: "Redoublant",
        motif: "Motif",
        sumOf: "La somme de",
        penalties: "Pénalités",
        paymentDate: "Date du paiement",
        operationDate: "Date opération",
        breakdownTitle: "Répartition du montant reçu",
        fraisTitle: "Frais scolaire",
        amountAllocated: "Montant alloué",
        total: "Total",
        statusTitle: "Etat actuel des frais de scolarité",
        transportStatusTitle: "Détail du versement transport",
        order: "Ordre",
        amount: "Montant",
        aug: "Aug.",
        red: "Réd.",
        alreadyPaid: "Déjà payé",
        remaining: "Reste à payé",
        totalPaid: "Total déjà payé",
        totalRemaining: "Total reste à payer",
        totalPaidMonths: "Total payé (sur ces mois)",
        totalRemainingMonths: "Reste à payer (sur ces mois)",
        signature: "Signature et cachet",
        note: "NB : Ce document n'est valable qu'avec le cachet et la signature de l'administration.",
        printedBy: "Imprimé par",
        parentReceipt: "Reçu parent",
        schoolReceipt: "Reçu établissement"
    },
    EN: {
        schoolYear: "Academic Year",
        receiptNo: "No",
        fullName: "Full Name",
        matricule: "Student ID",
        birthInfo: "Date and Place of Birth",
        at: "at",
        sex: "Gender",
        class: "Class",
        repeater: "Repeater",
        motif: "Purpose",
        sumOf: "The sum of",
        penalties: "Penalties",
        paymentDate: "Payment Date",
        operationDate: "Operation Date",
        breakdownTitle: "Breakdown of amount received",
        fraisTitle: "School Fees",
        amountAllocated: "Amount Allocated",
        total: "Total",
        statusTitle: "Current status of school fees",
        transportStatusTitle: "Transport payment details",
        order: "Order",
        amount: "Amount",
        aug: "Inc.",
        red: "Red.",
        alreadyPaid: "Already Paid",
        remaining: "Balance",
        totalPaid: "Total already paid",
        totalRemaining: "Total remaining",
        totalPaidMonths: "Total paid (for these months)",
        totalRemainingMonths: "Balance (for these months)",
        signature: "Signature and Stamp",
        note: "NB: This document is only valid with the school stamp and signature.",
        printedBy: "Printed by",
        parentReceipt: "Parent Receipt",
        schoolReceipt: "School Receipt"
    },
    ES: {
        schoolYear: "Año Escolar",
        receiptNo: "N°",
        fullName: "Nombres y Apellidos",
        matricule: "Matrícula",
        birthInfo: "Fecha y Lugar de nacimiento",
        at: "en",
        sex: "Sexo",
        class: "Clase",
        repeater: "Repetidor",
        motif: "Motivo",
        sumOf: "La suma de",
        penalties: "Penalidades",
        paymentDate: "Fecha de pago",
        operationDate: "Fecha de operación",
        breakdownTitle: "Desglose del monto recibido",
        fraisTitle: "Gastos escolares",
        amountAllocated: "Monto asignado",
        total: "Total",
        statusTitle: "Estado actual de los gastos escolares",
        transportStatusTitle: "Detalle del pago de transporte",
        order: "Orden",
        amount: "Monto",
        aug: "Aum.",
        red: "Red.",
        alreadyPaid: "Ya pagado",
        remaining: "Restante",
        totalPaid: "Total ya pagado",
        totalRemaining: "Total restante",
        totalPaidMonths: "Total pagado (meses seleccionados)",
        totalRemainingMonths: "Restante (meses seleccionados)",
        signature: "Firma y Sello",
        note: "NB: Este documento solo es válido con el sello y la firma de la administración.",
        printedBy: "Impreso por",
        parentReceipt: "Recibo del Padre",
        schoolReceipt: "Recibo de la Escuela"
    }
};

const PaymentReceiptPrintPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    const idEleve = searchParams.get('idEleve');
    const idAnneeScolaire = searchParams.get('idAnneeScolaire');
    const docType = searchParams.get('docType');
    const lang = searchParams.get('lang') || localStorage.getItem('app_language') || 'FR';

    const t = receiptTranslations[lang] || receiptTranslations.FR;

    useEffect(() => {
        const loadData = async () => {
            if (!idEleve || !idAnneeScolaire) return;
            setLoading(true);
            try {
                const res = await financeService.getRegistrationReceiptData(
                    parseInt(idEleve),
                    parseInt(idAnneeScolaire),
                    docType || undefined
                );
                setData(res.data);

                // Set document title
                if (res.data?.studentInfo?.fullName) {
                    const docTitle = res.data.receiptInfo?.title || "Reçu de paiement";
                    document.title = `${docTitle} ${res.data.studentInfo.fullName} ${res.data.receiptInfo.schoolYear}`;
                }

                setLoading(false);
            } catch (error) {
                console.error("Erreur chargement reçu impression:", error);
                setLoading(false);
            }
        };

        loadData();
    }, [idEleve, idAnneeScolaire]);

    if (loading || !data) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="w-12 h-12 animate-spin text-accent mb-4" />
                <p className="font-black uppercase tracking-widest text-xs text-gray-400">Génération du reçu de paiement...</p>
            </div>
        );
    }

    const ReceiptContent = ({ mentionKey }: { mentionKey: 'parentReceipt' | 'schoolReceipt' }) => {
        const isTransport = docType === 'TRANSPORT_RECEIPT';
        const isPeriscolaire = docType === 'PERISCOLAIRE_RECEIPT';

        // Filter history to exclude transport and periscolaire if it's a regular receipt
        const filteredHistory = data.financialDetail.fullHistory.filter((h: any) => {
            const lib = h.libelle.toLowerCase();
            const isTransportItem = lib.includes('transport') || lib.includes('bus') || lib.includes('abonnement');
            // Assuming periscolaire might have specific labels or we filter by what's NOT in todayBreakdown if needed,
            // but for now let's just exclude transport as requested.
            if (!isTransport && !isPeriscolaire) return !isTransportItem;

            // If it's transport/periscolaire receipt, the other logic (only today items) should have been here,
            // but we moved it to TransportReceiptPrintPage.
            return true;
        });

        return (
            <div className="relative p-8 bg-white h-[148.5mm] border-b border-dashed border-gray-400 last:border-0 flex flex-col">
                {/* Mention verticale */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 origin-right text-[8px] font-black uppercase tracking-widest text-gray-400">
                    {t[mentionKey]}
                </div>

                {/* 1. Header */}
                <header className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-full border-2 border-black flex items-center justify-center overflow-hidden">
                            {data.schoolInfo.logoUrl ? (
                                <img src={data.schoolInfo.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <div className="font-black text-[10px]">LOGO</div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 text-center px-4">
                        <h1 className="text-sm font-black uppercase leading-tight">{data.schoolInfo.name}</h1>
                        <p className="text-[9px] font-bold italic mb-1">{data.schoolInfo.devise}</p>
                        <p className="text-[8px] font-medium text-gray-600">
                            BP: {data.schoolInfo.bp} {data.schoolInfo.address} | Tel: {data.schoolInfo.phones}
                        </p>
                    </div>

                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase whitespace-nowrap">
                            {t.schoolYear} : <span className="underline">{data.receiptInfo.schoolYear}</span>
                        </p>
                    </div>
                </header>

                {/* 2. Titre Badge */}
                <div className="flex justify-center mb-4">
                    <div className="px-10 py-1.5 bg-gray-100 border border-black rounded-full shadow-sm">
                        <h2 className="text-xs font-black uppercase tracking-widest">
                            {data.receiptInfo.title} {t.receiptNo} : <span className="text-red-600">{data.receiptInfo.receiptNo}</span>
                        </h2>
                    </div>
                </div>

                {/* 3. Infos Elève & Opération */}
                <div className="grid grid-cols-12 gap-y-2 gap-x-4 mb-4 text-[9px]">
                    <div className="col-span-8">
                        <span className="font-black underline">{t.fullName} :</span> <span className="font-bold uppercase">{data.studentInfo.fullName}</span>
                    </div>
                    <div className="col-span-4">
                        <span className="font-black underline">{t.matricule} :</span> <span className="font-bold">{data.studentInfo.matricule}</span>
                    </div>

                    <div className="col-span-6">
                        <span className="font-black underline">{t.birthInfo} :</span> <span className="font-bold">{data.studentInfo.dateNaissance} {t.at} {data.studentInfo.lieuNaissance}</span>
                    </div>
                    <div className="col-span-2 text-center">
                        <span className="font-black underline">{t.sex} :</span> <span className="font-bold">{data.studentInfo.sexe}</span>
                    </div>
                    <div className="col-span-2 text-center">
                        <span className="font-black underline">{t.class} :</span> <span className="font-bold">{data.studentInfo.classLabel}</span>
                    </div>
                    <div className="col-span-2 text-center">
                        <span className="font-black underline">{t.repeater} :</span> <span className="font-bold">{data.studentInfo.redoublant}</span>
                    </div>

                    <div className="col-span-5">
                        <span className="font-black underline">{t.motif} :</span> <span className="font-bold">{data.financialDetail.nature}</span>
                    </div>
                    <div className="col-span-4">
                        <span className="font-black underline">{t.sumOf} :</span> <span className="font-black text-red-600">{data.financialDetail.amountDigits.toLocaleString()}</span> <span className="font-black">FCFA</span>
                    </div>
                    <div className="col-span-3 text-right">
                        <span className="font-black underline">{t.penalties} :</span> <span className="font-bold">{data.financialDetail.penalties.toLocaleString()} FCFA</span>
                    </div>

                    <div className="col-span-6">
                        <span className="font-black underline">{t.paymentDate} :</span> <span className="font-bold">{new Date(data.receiptInfo.dateTime).toLocaleDateString(lang === 'FR' ? 'fr-FR' : lang === 'ES' ? 'es-ES' : 'en-US')}</span>
                    </div>
                    <div className="col-span-6 text-right">
                        <span className="font-black underline">{t.operationDate} :</span> <span className="font-bold">{new Date(data.receiptInfo.operationTime).toLocaleString(lang === 'FR' ? 'fr-FR' : lang === 'ES' ? 'es-ES' : 'en-US')}</span>
                    </div>
                </div>

                {/* 4. Tableaux Financiers */}
                <div className="flex gap-4 mb-4 flex-1">
                    {/* Tableau A */}
                    {!isTransport && (
                        <div className="w-[35%]">
                            <h3 className="text-[8px] font-black uppercase bg-gray-600 text-white p-1 text-center">{t.breakdownTitle}</h3>
                            <table className="w-full border-collapse border border-black text-[8px]">
                                <thead>
                                    <tr className="bg-gray-50 font-black">
                                        <th className="border border-black p-1 text-left">{t.fraisTitle}</th>
                                        <th className="border border-black p-1 text-center">{t.amountAllocated}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.financialDetail.todayBreakdown.map((item: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="border border-black p-1 font-black uppercase">{item.libelle}</td>
                                            <td className="border border-black p-1 text-center font-bold">{item.montantAlloue.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {/* Remplissage si vide pour garder la structure */}
                                    {Array.from({ length: Math.max(0, 3 - data.financialDetail.todayBreakdown.length) }).map((_, i) => (
                                        <tr key={`empty-${i}`}>
                                            <td className="border border-black p-1">&nbsp;</td>
                                            <td className="border border-black p-1">&nbsp;</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-lime-400 font-black">
                                        <td className="border border-black p-1 text-right">{t.total}</td>
                                        <td className="border border-black p-1 text-center">{data.financialDetail.amountDigits.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    {/* Tableau B */}
                    <div className={clsx(isTransport ? "w-full" : "flex-1")}>
                        <h3 className="text-[8px] font-black uppercase bg-gray-600 text-white p-1 text-center">
                            {isTransport ? t.transportStatusTitle : t.statusTitle}
                        </h3>
                        <table className="w-full border-collapse border border-black text-[7.5px]">
                            <thead>
                                <tr className="bg-gray-50 font-black">
                                    <th className="border border-black p-0.5">{t.order}</th>
                                    <th className="border border-black p-0.5 text-left">{t.fraisTitle}</th>
                                    <th className="border border-black p-0.5">{t.amount}</th>
                                    <th className="border border-black p-0.5">{t.aug}</th>
                                    <th className="border border-black p-0.5">{t.red}</th>
                                    <th className="border border-black p-0.5">{t.alreadyPaid}</th>
                                    <th className="border border-black p-0.5">{t.remaining}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredHistory.map((item: any, idx: number) => {
                                    const isAvance = item.reste > 0;
                                    return (
                                        <tr key={idx} className={clsx(isTransport && isAvance && "bg-orange-50")}>
                                            <td className="border border-black p-0.5 text-center">{item.ordre}</td>
                                            <td className="border border-black p-0.5 font-black uppercase">{item.libelle}</td>
                                            <td className="border border-black p-0.5 text-center">{item.montantTotal.toLocaleString()}</td>
                                            <td className="border border-black p-0.5 text-center">{item.augmentation}</td>
                                            <td className="border border-black p-0.5 text-center">{item.reduction}</td>
                                            <td className={clsx("border border-black p-0.5 text-center font-black", isTransport ? (isAvance ? "bg-orange-400" : "bg-lime-400") : "bg-lime-400")}>
                                                {item.dejaPaye.toLocaleString()}
                                                {isTransport && (isAvance ? " (Avance)" : " (Soldé)")}
                                            </td>
                                            <td className="border border-black p-0.5 text-center font-black bg-gray-200">
                                                {item.reste.toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="font-black">
                                    <td colSpan={2} className="border border-black p-0.5 text-right uppercase">{t.total}</td>
                                    <td className="border border-black p-0.5 text-center">{filteredHistory.reduce((s: number, h: any) => s + h.montantTotal, 0).toLocaleString()}</td>
                                    <td className="border border-black p-0.5 text-center">0</td>
                                    <td className="border border-black p-0.5 text-center">0</td>
                                    <td className="border border-black p-0.5 text-center bg-lime-400">{filteredHistory.reduce((s: number, h: any) => s + h.dejaPaye, 0).toLocaleString()}</td>
                                    <td className="border border-black p-0.5 text-center bg-gray-200">{filteredHistory.reduce((s: number, h: any) => s + h.reste, 0).toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* 5. Footer & Signatures */}
                <div className="flex justify-between items-start mt-2">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-black uppercase">
                                {isTransport ? t.totalPaidMonths : t.totalPaid} :
                            </span>
                            <div className="bg-lime-400 px-4 py-1 rounded-md border border-black font-black text-xs">
                                {filteredHistory.reduce((s: number, h: any) => s + h.dejaPaye, 0).toLocaleString()}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-black uppercase">
                                {isTransport ? t.totalRemainingMonths : t.totalRemaining} :
                            </span>
                            <div className="bg-gray-300 px-4 py-1 rounded-md border border-black font-black text-xs">
                                {filteredHistory.reduce((s: number, h: any) => s + h.reste, 0).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    <div className="w-48 h-16 border-2 border-dashed border-black rounded-lg flex flex-col items-center justify-start p-1">
                        <span className="text-[8px] font-black italic">{t.signature}</span>
                    </div>
                </div>

                {/* 6. Métadonnées */}
                <div className="mt-auto flex justify-between items-end text-[7px] font-bold text-gray-500 italic border-t border-gray-100 pt-1">
                    <p>{new Date().toLocaleString(lang === 'FR' ? 'fr-FR' : lang === 'ES' ? 'es-ES' : 'en-US')}</p>
                    <p>{t.note}</p>
                    <p>{t.printedBy} : {data.financialDetail.printedBy}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 py-10 print:bg-white print:p-0 no-print-bg">
            {/* Header Controls */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-4 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full border border-gray-200 shadow-2xl print:hidden">
                <button onClick={() => window.close()} className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-500">
                    <ArrowLeft size={20} />
                </button>
                <div className="h-6 w-px bg-gray-200 mx-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-black">
                    Reçu de paiement - {data.studentInfo.fullName}
                </p>
                <button
                    onClick={() => window.print()}
                    className="ml-4 px-6 py-2 bg-black text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all flex items-center space-x-2"
                >
                    <Printer size={16} />
                    <span>Imprimer (A4)</span>
                </button>
            </div>

            <div className="flex flex-col items-center">
                <div className="bg-white w-[210mm] h-[297mm] shadow-2xl relative flex flex-col overflow-hidden print:shadow-none print:w-[210mm]">
                    <div className="flex-1 flex flex-col print:m-0 print:h-[297mm]">
                        <ReceiptContent mentionKey="parentReceipt" />
                        <ReceiptContent mentionKey="schoolReceipt" />
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
                    .no-print { display: none !important; }
                    .no-print-bg { background-color: white !important; }
                }
                .no-print-bg {
                    background-color: #E5E7EB;
                }
            `}</style>
        </div>
    );
};

export default PaymentReceiptPrintPage;
