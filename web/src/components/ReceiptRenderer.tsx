import React from 'react';
import { clsx } from 'clsx';

interface ReceiptData {
  numRecu: string;
  date: string;
  nomEleve: string;
  classe: string;
  matricule: string;
  motif: string;
  montantVerse: number;
  modePaiement: string;
  resteAPayer: number;
  totalScolarite: number;
  details: Array<{ label: string, amount: number }>;
}

interface ReceiptRendererProps {
  data: ReceiptData;
  doubleReceipts: boolean; // From global config
}

const SingleReceipt: React.FC<{ data: ReceiptData, label: string }> = ({ data, label }) => {
  return (
    <div className="w-[210mm] h-[148mm] p-8 border border-gray-200 bg-white relative overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-black flex items-center justify-center text-white font-bold text-2xl">S</div>
          <div>
            <h2 className="text-xl font-black uppercase leading-tight">Scholar International School</h2>
            <p className="text-xs font-medium italic">Excellence - Discipline - Success</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">Année Scolaire: 2023-2024</p>
          <p className="text-xs text-secondary">{label}</p>
        </div>
      </div>

      {/* Receipt Title */}
      <div className="bg-black text-white p-2 mb-6 flex justify-between items-center px-4">
        <h3 className="text-lg font-bold">REÇU DE PAIEMENT</h3>
        <span className="text-xl font-black tracking-widest">N° {data.numRecu}</span>
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div className="space-y-2">
          <div className="flex border-b border-gray-100 pb-1">
            <span className="w-24 text-xs font-bold text-secondary uppercase">Élève:</span>
            <span className="text-sm font-bold">{data.nomEleve}</span>
          </div>
          <div className="flex border-b border-gray-100 pb-1">
            <span className="w-24 text-xs font-bold text-secondary uppercase">Classe:</span>
            <span className="text-sm font-bold">{data.classe}</span>
          </div>
          <div className="flex border-b border-gray-100 pb-1">
            <span className="w-24 text-xs font-bold text-secondary uppercase">Matricule:</span>
            <span className="text-sm font-bold">{data.matricule}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex border-b border-gray-100 pb-1">
            <span className="w-24 text-xs font-bold text-secondary uppercase">Motif:</span>
            <span className="text-sm font-bold">{data.motif}</span>
          </div>
          <div className="flex border-b border-gray-100 pb-1">
            <span className="w-24 text-xs font-bold text-secondary uppercase">Date:</span>
            <span className="text-sm font-bold">{data.date}</span>
          </div>
          <div className="flex border-b border-gray-100 pb-1">
            <span className="w-24 text-xs font-bold text-secondary uppercase">Mode:</span>
            <span className="text-sm font-bold">{data.modePaiement}</span>
          </div>
        </div>
      </div>

      {/* Table Section (Asymmetrical) */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left Table (28%) - Today's breakdown */}
        <div className="w-[28%] border border-black flex flex-col">
          <div className="bg-gray-100 p-1 text-center font-bold text-[10px] uppercase border-b border-black">
            Détails du Versement
          </div>
          <div className="flex-1 p-2 space-y-1">
            {data.details.map((d, i) => (
              <div key={i} className="flex justify-between text-[11px]">
                <span className="truncate">{d.label}</span>
                <span className="font-bold">{d.amount.toLocaleString()} FCFA</span>
              </div>
            ))}
          </div>
          <div className="bg-black text-white p-2 flex justify-between text-[12px] font-black">
            <span>TOTAL</span>
            <span>{data.montantVerse.toLocaleString()}</span>
          </div>
        </div>

        {/* Right Table (72%) - History */}
        <div className="w-[72%] border border-black flex flex-col">
          <div className="bg-gray-100 p-1 text-center font-bold text-[10px] uppercase border-b border-black">
            Situation Financière Annuelle
          </div>
          <table className="w-full text-[11px] text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="p-2">Description</th>
                <th className="p-2 text-right">Montant</th>
                <th className="p-2 text-right">Payé</th>
                <th className="p-2 text-right">Solde</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2">Scolarité Totale</td>
                <td className="p-2 text-right">{data.totalScolarite.toLocaleString()}</td>
                <td className="p-2 text-right">{(data.totalScolarite - data.resteAPayer).toLocaleString()}</td>
                <td className="p-2 text-right font-bold">{data.resteAPayer.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          <div className="flex-1 flex items-end p-4">
             <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="border-t border-dashed border-black pt-2 text-center text-[10px] uppercase font-bold">
                  Signature Établissement
                </div>
                <div className="border-t border-dashed border-black pt-2 text-center text-[10px] uppercase font-bold">
                  Signature Parent
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <div className="mt-4 flex justify-between items-center text-[9px] text-secondary font-medium">
        <span>Généré par Scholar Web - {new Date().toLocaleString()}</span>
        <span>Imprimé par: Admin System</span>
      </div>
    </div>
  );
};

const ReceiptRenderer: React.FC<ReceiptRendererProps> = ({ data, doubleReceipts }) => {
  if (doubleReceipts) {
    return (
      <div className="flex flex-col items-center space-y-0 bg-gray-50 min-h-screen p-4 print:p-0">
        <div className="print:block">
          <SingleReceipt data={data} label="COPIE PARENT" />
          <div className="w-[210mm] border-t-2 border-dashed border-black py-4 flex justify-center items-center relative overflow-hidden no-print">
            <span className="bg-white px-4 text-xs font-bold uppercase tracking-widest text-secondary">
              Découper ici / Cut here
            </span>
          </div>
          <div className="hidden print:block h-8" />
          <SingleReceipt data={data} label="COPIE ÉCOLE" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-gray-50 min-h-screen p-4 print:p-0">
      <SingleReceipt data={data} label="COPIE UNIQUE" />
    </div>
  );
};

export default ReceiptRenderer;
