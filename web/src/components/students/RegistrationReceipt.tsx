import React from 'react';
import { Printer, X } from 'lucide-react';

interface RegistrationReceiptData {
    schoolInfo: {
        name: string;
        devise?: string;
        ministry: string;
        address?: string;
        bp?: string;
        phones?: string;
        email?: string;
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
        dateNaissance?: string;
        lieuNaissance?: string;
        sexe?: string;
        redoublant?: string;
    };
    validation: {
        qrContent: string;
    };
}

interface Props {
    data: RegistrationReceiptData | null;
    onClose: () => void;
}

const RegistrationReceipt: React.FC<Props> = ({ data, onClose }) => {
    if (!data) return null;

    const handlePrint = () => {
        window.print();
    };

    const ReceiptContent = ({ mention }: { mention: string }) => (
        <div className="relative p-12 bg-white h-[148mm] border-b border-dashed border-gray-400 last:border-0 flex flex-col">
            {/* Mention verticale */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 origin-right text-[8px] font-black uppercase tracking-widest text-gray-400">
                {mention}
            </div>

            {/* 1. Header */}
            <header className="flex justify-between items-start mb-8">
                <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-full border-2 border-black flex items-center justify-center overflow-hidden">
                        {data.schoolInfo.logoUrl ? (
                            <img src={data.schoolInfo.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <div className="font-black text-[10px]">LOGO</div>
                        )}
                    </div>
                </div>

                <div className="flex-1 text-center px-4">
                    <h1 className="text-lg font-black uppercase leading-tight">{data.schoolInfo.name}</h1>
                    <p className="text-[10px] font-bold italic mb-1 uppercase opacity-70">{data.schoolInfo.devise}</p>
                    <p className="text-[9px] font-medium text-gray-600">
                        BP: {data.schoolInfo.bp} {data.schoolInfo.address} | Tel: {data.schoolInfo.phones}
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-[11px] font-black uppercase whitespace-nowrap bg-black text-white px-3 py-1">
                        Année Scolaire : {data.receiptInfo.schoolYear}
                    </p>
                </div>
            </header>

            {/* 2. Titre Badge */}
            <div className="flex justify-center mb-10">
                <div className="px-14 py-3 border-4 border-black rounded-sharp shadow-xl">
                    <h2 className="text-xl font-black uppercase tracking-[0.2em]">
                        {data.receiptInfo.title}
                    </h2>
                    <p className="text-center font-black text-sm mt-1">N° : <span className="text-red-600">{data.receiptInfo.receiptNo}</span></p>
                </div>
            </div>

            {/* 3. Infos Elève */}
            <div className="space-y-6 flex-1">
                <div className="grid grid-cols-12 gap-y-6 gap-x-8 text-sm">
                    <div className="col-span-12 border-b-2 border-black pb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Noms et Prénoms de l'élève</span>
                        <span className="font-black uppercase text-xl">{data.studentInfo.fullName}</span>
                    </div>

                    <div className="col-span-6 border-b border-gray-200 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Matricule</span>
                        <span className="font-black">{data.studentInfo.matricule}</span>
                    </div>

                    <div className="col-span-6 border-b border-gray-200 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Classe d'affectation</span>
                        <span className="font-black uppercase">{data.studentInfo.classLabel}</span>
                    </div>

                    <div className="col-span-12 border-b border-gray-200 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Date et Lieu de Naissance</span>
                        <span className="font-black uppercase">{data.studentInfo.dateNaissance} à {data.studentInfo.lieuNaissance}</span>
                    </div>

                    <div className="col-span-4 border-b border-gray-200 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Sexe</span>
                        <span className="font-black uppercase">{data.studentInfo.sexe}</span>
                    </div>

                    <div className="col-span-4 border-b border-gray-200 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Statut</span>
                        <span className="font-black uppercase">{data.studentInfo.redoublant === 'OUI' ? 'REDOUBLANT' : 'NOUVEAU'}</span>
                    </div>

                    <div className="col-span-4 border-b border-gray-200 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Date d'Inscription</span>
                        <span className="font-black">{new Date(data.receiptInfo.dateTime).toLocaleDateString('fr-FR')}</span>
                    </div>
                </div>

                <div className="mt-12 p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-sharp">
                   <p className="text-[10px] font-black uppercase tracking-widest text-center leading-relaxed">
                       L'élève susmentionné est régulièrement inscrit au sein de notre établissement pour le compte de l'année scolaire {data.receiptInfo.schoolYear}. Ce document atteste de son appartenance à la communauté éducative et doit être conservé précieusement.
                   </p>
                </div>
            </div>

            {/* 5. Signatures */}
            <div className="flex justify-between items-end mt-8">
                <div className="text-center space-y-2">
                    <p className="text-[9px] font-black uppercase underline">L'élève / Parent</p>
                    <div className="w-40 h-16"></div>
                </div>

                <div className="text-center space-y-2">
                    <p className="text-[9px] font-black uppercase underline">Le Chef d'Établissement</p>
                    <div className="w-48 h-20 border border-black rounded flex items-center justify-center p-2">
                         <span className="text-[8px] font-bold italic opacity-30">Signature et Cachet</span>
                    </div>
                </div>
            </div>

            {/* 6. Métadonnées */}
            <div className="mt-4 flex justify-between items-end text-[7px] font-bold text-gray-400 italic">
                <p>Généré le {new Date().toLocaleString('fr-FR')}</p>
                <p>Authenticité vérifiable par QR Code : {data.validation.qrContent}</p>
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
                        <span>Imprimer la Fiche</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/80 backdrop-blur hover:bg-white rounded-full transition-colors shadow-lg border border-gray-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col print:m-0">
                    <ReceiptContent mention="Copie Parent" />
                    <ReceiptContent mention="Copie Administration" />
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

export default RegistrationReceipt;
