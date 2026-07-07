import React from 'react';
import { clsx } from 'clsx';
import { Printer, X } from 'lucide-react';

interface FeeBreakdown {
    libelle: string;
    montantAlloue: number;
}

interface FeeHistory {
    ordre: number;
    libelle: string;
    montantTotal: number;
    augmentation: number;
    reduction: number;
    dejaPaye: number;
    reste: number;
}

interface ReceiptData {
    schoolInfo: {
        name: string;
        devise?: string;
        ministry: string;
        address?: string;
        bp?: string;
        phones?: string;
        email?: string;
        authorizationNo?: string;
        logoUrl?: string;
    };
    receiptInfo: {
        title: string;
        receiptNo: string;
        schoolYear: string;
        dateTime: string;
        operationTime: string;
    };
    studentInfo: {
        matricule: string;
        fullName: string;
        classLabel: string;
        dateNaissance?: string;
        lieuNaissance?: string;
        sexe?: string;
        redoublant?: string;
    };
    financialDetail: {
        nature: string;
        amountDigits: number;
        amountWords: string;
        paymentMode: string;
        balance: number;
        remaining: number;
        penalties: number;
        printedBy: string;
        todayBreakdown: FeeBreakdown[];
        fullHistory: FeeHistory[];
    };
    validation: {
        cashierName: string;
        qrContent: string;
    };
}

interface Props {
    data: ReceiptData | null;
    onClose: () => void;
}

const PaymentReceipt: React.FC<Props> = ({ data, onClose }) => {
    if (!data) return null;

    const handlePrint = () => {
        window.print();
    };

    const ReceiptContent = ({ mention }: { mention: string }) => (
        <div className="relative p-8 bg-white h-[130mm] border-b border-dashed border-gray-400 last:border-0 flex flex-col">
            {/* Mention verticale */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 origin-right text-[8px] font-black uppercase tracking-widest text-gray-400">
                {mention}
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
                        School Year : <span className="underline">{data.receiptInfo.schoolYear}</span>
                    </p>
                </div>
            </header>

            {/* 2. Titre Badge */}
            <div className="flex justify-center mb-4">
                <div className="px-10 py-1.5 bg-gray-100 border border-black rounded-full shadow-sm">
                    <h2 className="text-xs font-black uppercase tracking-widest">
                        {data.receiptInfo.title} No : <span className="text-red-600">{data.receiptInfo.receiptNo}</span>
                    </h2>
                </div>
            </div>

            {/* 3. Infos Elève & Opération */}
            <div className="grid grid-cols-12 gap-y-2 gap-x-4 mb-4 text-[9px]">
                <div className="col-span-8">
                    <span className="font-black underline">Full Names :</span> <span className="font-bold uppercase">{data.studentInfo.fullName}</span>
                </div>
                <div className="col-span-4">
                    <span className="font-black underline">Student ID :</span> <span className="font-bold">{data.studentInfo.matricule}</span>
                </div>

                <div className="col-span-6">
                    <span className="font-black underline">Date and Place of Birth :</span> <span className="font-bold">{data.studentInfo.dateNaissance} at {data.studentInfo.lieuNaissance}</span>
                </div>
                <div className="col-span-2 text-center">
                    <span className="font-black underline">Gender :</span> <span className="font-bold">{data.studentInfo.sexe}</span>
                </div>
                <div className="col-span-2 text-center">
                    <span className="font-black underline">Class :</span> <span className="font-bold">{data.studentInfo.classLabel}</span>
                </div>
                <div className="col-span-2 text-center">
                    <span className="font-black underline">Repeater :</span> <span className="font-bold">{data.studentInfo.redoublant}</span>
                </div>

                <div className="col-span-5">
                    <span className="font-black underline">Reason :</span> <span className="font-bold">{data.financialDetail.nature}</span>
                </div>
                <div className="col-span-4">
                    <span className="font-black underline">The sum of :</span> <span className="font-black text-red-600">{data.financialDetail.amountDigits.toLocaleString()}</span> <span className="font-black">FCFA</span>
                </div>
                <div className="col-span-3 text-right">
                    <span className="font-black underline">Penalties :</span> <span className="font-bold">{data.financialDetail.penalties.toLocaleString()} FCFA</span>
                </div>

                <div className="col-span-6">
                    <span className="font-black underline">Payment Date :</span> <span className="font-bold">{new Date(data.receiptInfo.dateTime).toLocaleDateString('en-US')}</span>
                </div>
                <div className="col-span-6 text-right">
                    <span className="font-black underline">Operation Date :</span> <span className="font-bold">{new Date(data.receiptInfo.operationTime).toLocaleString('en-US')}</span>
                </div>
            </div>

            {/* 4. Tableaux Financiers */}
            <div className="flex gap-4 mb-4 flex-1">
                {/* Tableau A */}
                <div className="w-[35%]">
                    <h3 className="text-[8px] font-black uppercase bg-gray-600 text-white p-1 text-center">Breakdown of amount received</h3>
                    <table className="w-full border-collapse border border-black text-[8px]">
                        <thead>
                            <tr className="bg-gray-50 font-black">
                                <th className="border border-black p-1 text-left">School Fee</th>
                                <th className="border border-black p-1 text-center">Amount Allocated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.financialDetail.todayBreakdown.map((item, idx) => (
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
                                <td className="border border-black p-1 text-right">Total</td>
                                <td className="border border-black p-1 text-center">{data.financialDetail.amountDigits.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Tableau B */}
                <div className="flex-1">
                    <h3 className="text-[8px] font-black uppercase bg-gray-600 text-white p-1 text-center">Current status of school fees</h3>
                    <table className="w-full border-collapse border border-black text-[7.5px]">
                        <thead>
                            <tr className="bg-gray-50 font-black">
                                <th className="border border-black p-0.5">Order</th>
                                <th className="border border-black p-0.5 text-left">School Fee</th>
                                <th className="border border-black p-0.5">Amount</th>
                                <th className="border border-black p-0.5">Inc.</th>
                                <th className="border border-black p-0.5">Red.</th>
                                <th className="border border-black p-0.5">Already paid</th>
                                <th className="border border-black p-0.5">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.financialDetail.fullHistory.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="border border-black p-0.5 text-center">{item.ordre}</td>
                                    <td className="border border-black p-0.5 font-black uppercase">{item.libelle}</td>
                                    <td className="border border-black p-0.5 text-center">{item.montantTotal.toLocaleString()}</td>
                                    <td className="border border-black p-0.5 text-center">{item.augmentation}</td>
                                    <td className="border border-black p-0.5 text-center">{item.reduction}</td>
                                    <td className={clsx("border border-black p-0.5 text-center font-black bg-lime-400")}>
                                        {item.dejaPaye.toLocaleString()}
                                    </td>
                                    <td className="border border-black p-0.5 text-center font-black bg-gray-200">
                                        {item.reste.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-black">
                                <td colSpan={2} className="border border-black p-0.5 text-right uppercase">Total</td>
                                <td className="border border-black p-0.5 text-center">{data.financialDetail.fullHistory.reduce((s, h) => s + h.montantTotal, 0).toLocaleString()}</td>
                                <td className="border border-black p-0.5 text-center">0</td>
                                <td className="border border-black p-0.5 text-center">0</td>
                                <td className="border border-black p-0.5 text-center bg-lime-400">{data.financialDetail.balance.toLocaleString()}</td>
                                <td className="border border-black p-0.5 text-center bg-gray-200">{data.financialDetail.remaining.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* 5. Footer & Signatures */}
            <div className="flex justify-between items-start mt-2">
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black uppercase">Total already paid :</span>
                        <div className="bg-lime-400 px-4 py-1 rounded-md border border-black font-black text-xs">
                            {data.financialDetail.balance.toLocaleString()}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black uppercase">Total balance :</span>
                        <div className="bg-gray-300 px-4 py-1 rounded-md border border-black font-black text-xs">
                            {data.financialDetail.remaining.toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="w-48 h-16 border-2 border-dashed border-black rounded-lg flex flex-col items-center justify-start p-1">
                    <span className="text-[8px] font-black italic">Signature and stamp</span>
                </div>
            </div>

            {/* 6. Métadonnées */}
            <div className="mt-auto flex justify-between items-end text-[7px] font-bold text-gray-500 italic border-t border-gray-100 pt-1">
                <p>{new Date().toLocaleString('en-US')}</p>
                <p>NB: This document is only valid with the school stamp and signature.</p>
                <p>Printed by : {data.financialDetail.printedBy}</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-0 no-print-overlay">
            <div className="bg-white w-[210mm] h-[297mm] shadow-2xl relative flex flex-col overflow-hidden">
                {/* Actions Header */}
                <div className="absolute top-4 right-4 z-10 flex space-x-3 no-print">
                    <button
                        onClick={handlePrint}
                        className="bg-black text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center space-x-2 hover:scale-105 transition-all shadow-xl"
                    >
                        <Printer size={16} />
                        <span>Print</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/80 backdrop-blur hover:bg-white rounded-full transition-colors shadow-lg border border-gray-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col print:m-0 print:h-[297mm]">
                    <ReceiptContent mention="Parent receipt" />
                    <ReceiptContent mention="School receipt" />
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
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
                        .no-print-overlay { position: static !important; background: none !important; padding: 0 !important; }
                        body * { visibility: hidden; }
                        .fixed, .no-print-overlay, .shadow-2xl { box-shadow: none !important; }
                        .bg-white.w-\\[210mm\\] {
                            visibility: visible !important;
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            margin: 0 !important;
                            width: 210mm !important;
                            height: 297mm !important;
                        }
                        .bg-white.w-\\[210mm\\] * { visibility: visible !important; }
                    }
                `}} />
            </div>
        </div>
    );
};

export default PaymentReceipt;
