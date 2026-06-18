import React from 'react';
import { clsx } from 'clsx';
import { Printer, X } from 'lucide-react';

interface ReceiptData {
    schoolInfo: {
        name: string;
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
    };
    studentInfo: {
        matricule: string;
        fullName: string;
        classLabel: string;
    };
    financialDetail: {
        nature: string;
        amountDigits: number;
        amountWords: string;
        paymentMode: string;
        balance: number;
        remaining: number;
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

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 md:p-10 no-print-overlay">
            <div className="bg-white w-full max-w-[800px] h-[90vh] overflow-y-auto rounded-[32px] shadow-2xl relative flex flex-col">
                {/* Actions Header */}
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 no-print">
                    <h3 className="font-black uppercase text-xs tracking-widest text-black">Aperçu du Reçu</h3>
                    <div className="flex space-x-3">
                        <button
                            onClick={handlePrint}
                            className="bg-black text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center space-x-2 hover:scale-105 transition-all"
                        >
                            <Printer size={16} />
                            <span>Imprimer</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Printable Content */}
                <div className="flex-1 p-12 bg-white printable-receipt font-serif">
                    {/* Header: School Info */}
                    <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-6">
                        <div className="w-1/3 text-center">
                            <p className="text-[10px] font-bold uppercase leading-tight">{data.schoolInfo.ministry}</p>
                            <div className="h-0.5 w-8 bg-black mx-auto my-1"></div>
                            <p className="text-[10px] font-black uppercase">{data.schoolInfo.name}</p>
                        </div>

                        <div className="w-1/4 flex justify-center">
                            <div className="w-20 h-20 border-2 border-black rounded-lg flex items-center justify-center font-black text-2xl">
                                LOGO
                            </div>
                        </div>

                        <div className="w-1/3 text-center">
                            <p className="text-[9px] font-bold italic">REPUBLIQUE DU CAMEROUN</p>
                            <p className="text-[8px] font-medium uppercase">Paix - Travail - Patrie</p>
                            <div className="h-0.5 w-8 bg-black mx-auto my-1"></div>
                            <p className="text-[9px] font-bold">Année Scolaire {data.receiptInfo.schoolYear}</p>
                        </div>
                    </div>

                    {/* Receipt Title & No */}
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-black underline underline-offset-8 mb-2">{data.receiptInfo.title}</h2>
                        <p className="font-black text-sm">N° {data.receiptInfo.receiptNo}</p>
                    </div>

                    {/* Student & Payment Info */}
                    <div className="space-y-6 text-sm mb-12">
                        <p><span className="font-black underline">Reçu de l'élève:</span> <span className="uppercase ml-2">{data.studentInfo.fullName}</span></p>
                        <div className="flex justify-between">
                            <p><span className="font-black underline">Matricule:</span> <span className="ml-2">{data.studentInfo.matricule}</span></p>
                            <p><span className="font-black underline">Classe:</span> <span className="ml-2">{data.studentInfo.classLabel}</span></p>
                        </div>
                        <p><span className="font-black underline">La somme de:</span> <span className="italic ml-2">{data.financialDetail.amountWords}</span></p>
                        <p><span className="font-black underline">Nature du versement:</span> <span className="ml-2">{data.financialDetail.nature}</span></p>
                    </div>

                    {/* Table of Totals */}
                    <div className="grid grid-cols-3 border-2 border-black divide-x-2 divide-black text-center mb-12">
                        <div className="p-4">
                            <p className="text-[10px] font-black uppercase border-b border-black mb-2">Montant Versé</p>
                            <p className="text-lg font-black">{data.financialDetail.amountDigits.toLocaleString()} FCFA</p>
                        </div>
                        <div className="p-4">
                            <p className="text-[10px] font-black uppercase border-b border-black mb-2">Total Payé</p>
                            <p className="text-lg font-black">{data.financialDetail.balance.toLocaleString()} FCFA</p>
                        </div>
                        <div className="p-4">
                            <p className="text-[10px] font-black uppercase border-b border-black mb-2">Reste à payer</p>
                            <p className="text-lg font-black">{data.financialDetail.remaining.toLocaleString()} FCFA</p>
                        </div>
                    </div>

                    {/* Validation & Footer */}
                    <div className="flex justify-between items-end">
                        <div className="text-center w-40">
                            <div className="w-24 h-24 border border-dashed border-gray-300 mx-auto flex items-center justify-center text-[8px] text-gray-300 mb-2">
                                QR CODE
                            </div>
                            <p className="text-[8px] font-bold uppercase">{data.receiptInfo.dateTime.toString()}</p>
                        </div>

                        <div className="text-center italic text-xs">
                            <p className="mb-10 font-black underline not-italic">Le Caissier</p>
                            <p>{data.validation.cashierName}</p>
                        </div>
                    </div>

                    <div className="mt-12 pt-4 border-t border-gray-100 text-[8px] text-center text-gray-400 italic">
                        Ce reçu est une preuve de versement. Conservez-le précieusement.
                    </div>
                </div>

                {/* Print styles */}
                <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                        .no-print { display: none !important; }
                        .no-print-overlay { position: static !important; background: none !important; padding: 0 !important; }
                        .printable-receipt { padding: 0 !important; width: 100% !important; }
                        body * { visibility: hidden; }
                        .printable-receipt, .printable-receipt * { visibility: visible; }
                        .printable-receipt { position: absolute; left: 0; top: 0; }
                    }
                `}} />
            </div>
        </div>
    );
};

export default PaymentReceipt;
