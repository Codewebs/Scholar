import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { financeService } from '../../api/financeService';
import {
    Printer,
    ArrowLeft,
    Loader2
} from 'lucide-react';
import { clsx } from 'clsx';

const TransportReceiptPrintPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    const idEleve = searchParams.get('idEleve');
    const idAnneeScolaire = searchParams.get('idAnneeScolaire');

    useEffect(() => {
        const loadData = async () => {
            if (!idEleve || !idAnneeScolaire) return;
            setLoading(true);
            try {
                // We use a specific parameter or endpoint if available,
                // but here we filter the data returned by the registration receipt endpoint
                const res = await financeService.getRegistrationReceiptData(
                    parseInt(idEleve),
                    parseInt(idAnneeScolaire),
                    'TRANSPORT_RECEIPT'
                );
                setData(res.data);

                if (res.data?.studentInfo?.fullName) {
                    document.title = `Reçu Transport ${res.data.studentInfo.fullName} ${res.data.receiptInfo.schoolYear}`;
                }

                setLoading(false);
            } catch (error) {
                console.error("Erreur chargement reçu transport:", error);
                setLoading(false);
            }
        };

        loadData();
    }, [idEleve, idAnneeScolaire]);

    if (loading || !data) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="w-12 h-12 animate-spin text-accent mb-4" />
                <p className="font-black uppercase tracking-widest text-xs text-gray-400">Génération du reçu de transport...</p>
            </div>
        );
    }

    const ReceiptContent = ({ mention }: { mention: string }) => {
        // Filtre pour identifier les libellés liés au transport
        const isTransportLibelle = (lib: string) => {
            const l = lib.toLowerCase();
            return l.includes('transport') || l.includes('bus') || l.includes('abonnement');
        };

        // On récupère ce qui est payé aujourd'hui pour le transport
        const transportToday = data.financialDetail.todayBreakdown.filter((t: any) =>
            isTransportLibelle(t.libelle)
        );

        const totalTransportToday = transportToday.reduce((s: number, t: any) => s + t.montantAlloue, 0);

        // Construction des lignes en associant le versement du jour à l'historique global
        const transportRows = transportToday.map((t: any) => {
            const h = data.financialDetail.fullHistory.find((hist: any) =>
                hist.libelle.trim().toLowerCase() === t.libelle.trim().toLowerCase()
            ) || t;

            return {
                ordre: h.ordre || '—',
                libelle: t.libelle,
                verseCeJour: t.montantAlloue,
                montantTotal: h.montantTotal || (t.montantDu || t.montantAlloue),
                augmentation: h.augmentation || 0,
                reduction: h.reduction || 0,
                dejaPaye: h.dejaPaye || t.montantAlloue,
                reste: h.reste !== undefined ? h.reste : 0
            };
        });

        return (
            <div className="relative p-8 bg-white h-[148.5mm] border-b border-dashed border-gray-400 last:border-0 flex flex-col">
                <div className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 origin-right text-[8px] font-black uppercase tracking-widest text-gray-400">
                    {mention}
                </div>

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
                            Année Scolaire : <span className="underline">{data.receiptInfo.schoolYear}</span>
                        </p>
                    </div>
                </header>

                <div className="flex justify-center mb-4">
                    <div className="px-10 py-1.5 bg-gray-100 border border-black rounded-full shadow-sm">
                        <h2 className="text-xs font-black uppercase tracking-widest">
                            REÇU DE TRANSPORT N° : <span className="text-red-600">{data.receiptInfo.receiptNo}</span>
                        </h2>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-y-2 gap-x-4 mb-4 text-[9px]">
                    <div className="col-span-8">
                        <span className="font-black underline">Noms et Prénoms :</span> <span className="font-bold uppercase">{data.studentInfo.fullName}</span>
                    </div>
                    <div className="col-span-4">
                        <span className="font-black underline">Matricule :</span> <span className="font-bold">{data.studentInfo.matricule}</span>
                    </div>
                    <div className="col-span-6">
                        <span className="font-black underline">Date du paiement :</span> <span className="font-bold">{new Date(data.receiptInfo.dateTime).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="col-span-6 text-right">
                        <span className="font-black underline">Montant total versé :</span> <span className="font-black text-red-600">{totalTransportToday.toLocaleString()} FCFA</span>
                    </div>
                </div>

                <div className="flex-1">
                    <h3 className="text-[8px] font-black uppercase bg-gray-600 text-white p-0.5 text-center">Détail de l'affectation du versement (Par Mois)</h3>
                    <table className="w-full border-collapse border border-black text-[7.5px]">
                        <thead>
                            <tr className="bg-gray-50 font-black text-center">
                                <th className="border border-black px-1 py-[1px] w-8">Ordre</th>
                                <th className="border border-black px-1 py-[1px] text-left">Mois / Période</th>
                                <th className="border border-black px-1 py-[1px] bg-yellow-50">Versé ce jour</th>
                                <th className="border border-black px-1 py-[1px]">Montant Dû</th>
                                <th className="border border-black px-1 py-[1px]">Aug/Red</th>
                                <th className="border border-black px-1 py-[1px]">Cumul Payé</th>
                                <th className="border border-black px-1 py-[1px]">Reste à payer</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transportRows.length > 0 ? transportRows.map((item: any, idx: number) => {
                                const isAvance = item.reste > 0;
                                return (
                                    <tr key={idx} className={clsx(isAvance && "bg-orange-50")}>
                                        <td className="border border-black px-1 py-[1px] text-center">{item.ordre}</td>
                                        <td className="border border-black px-1 py-[1px] font-black uppercase">{item.libelle}</td>
                                        <td className="border border-black px-1 py-[1px] text-center font-black bg-yellow-50/50">
                                            {item.verseCeJour.toLocaleString()}
                                        </td>
                                        <td className="border border-black px-1 py-[1px] text-center">{item.montantTotal.toLocaleString()}</td>
                                        <td className="border border-black px-1 py-[1px] text-center">
                                            {item.augmentation > 0 ? `+${item.augmentation}` : item.reduction > 0 ? `-${item.reduction}` : '0'}
                                        </td>
                                        <td className={clsx("border border-black px-1 py-[1px] text-center font-black", isAvance ? "bg-orange-400" : "bg-lime-400")}>
                                            <div className="flex flex-col items-center leading-tight">
                                                <span>{item.dejaPaye.toLocaleString()}</span>
                                                <span className="text-[5px] uppercase font-black">
                                                    {isAvance ? "Avance" : "Soldé"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className={clsx("border border-black px-1 py-[1px] text-center font-black transition-colors", item.reste > 0 ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-600")}>
                                            {item.reste > 0 ? (
                                                <div className="flex flex-col items-center leading-tight">
                                                    <span>{item.reste.toLocaleString()}</span>
                                                    <span className="text-[5px] uppercase font-black">Reste</span>
                                                </div>
                                            ) : (
                                                "0"
                                            )}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={7} className="border border-black p-2 text-center text-gray-400 italic font-bold">
                                        Aucun versement de transport enregistré.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="font-black bg-gray-100">
                                <td colSpan={2} className="border border-black px-1 py-[1px] text-right uppercase">TOTAUX</td>
                                <td className="border border-black px-1 py-[1px] text-center bg-yellow-100">{totalTransportToday.toLocaleString()}</td>
                                <td className="border border-black px-1 py-[1px] text-center">{transportRows.reduce((s: number, h: any) => s + h.montantTotal, 0).toLocaleString()}</td>
                                <td className="border border-black px-1 py-[1px] text-center">—</td>
                                <td className="border border-black px-1 py-[1px] text-center bg-lime-400">{transportRows.reduce((s: number, h: any) => s + h.dejaPaye, 0).toLocaleString()}</td>
                                <td className="border border-black px-1 py-[1px] text-center bg-gray-200">{transportRows.reduce((s: number, h: any) => s + h.reste, 0).toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="flex justify-between items-start mt-4">
                    <div className="flex flex-col gap-2">
                         <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-black uppercase text-gray-500">Net versé ce jour (Transport) :</span>
                            <div className="bg-lime-400 px-4 py-1 rounded-md border border-black font-black text-xs">
                                {totalTransportToday.toLocaleString()} FCFA
                            </div>
                        </div>
                    </div>
                    <div className="w-48 h-16 border-2 border-dashed border-black rounded-lg flex flex-col items-center justify-start p-1">
                        <span className="text-[8px] font-black italic">Signature et cachet</span>
                    </div>
                </div>

                <div className="mt-auto flex justify-between items-end text-[7px] font-bold text-gray-500 italic border-t border-gray-100 pt-1">
                    <p>{new Date().toLocaleString('fr-FR')}</p>
                    <p>NB : Ce document ne concerne que le service de transport scolaire.</p>
                    <p>Imprimé par : {data.financialDetail.printedBy}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 py-10 print:bg-white print:p-0 no-print-bg">
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-4 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full border border-gray-200 shadow-2xl print:hidden">
                <button onClick={() => window.close()} className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-500">
                    <ArrowLeft size={20} />
                </button>
                <div className="h-6 w-px bg-gray-200 mx-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-black">
                    Reçu Transport - {data.studentInfo.fullName}
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
                        <ReceiptContent mention="Reçu parent (Transport)" />
                        <ReceiptContent mention="Reçu établissement (Transport)" />
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .no-print-bg { background-color: white !important; }
                }
                .no-print-bg { background-color: #E5E7EB; }
            `}</style>
        </div>
    );
};

export default TransportReceiptPrintPage;
