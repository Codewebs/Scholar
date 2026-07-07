import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { studentService } from '../../api/studentService';
import { financeService, FraisExigible } from '../../api/financeService';
import {
    Wallet,
    ArrowLeft,
    CheckCircle2,
    Building2,
    Plus,
    Save,
    AlertCircle,
    Trash2,
    Info,
    Check
} from 'lucide-react';
import { clsx } from 'clsx';
import AuthButton from '../../components/ui/AuthButton';
import api from '../../api/axios';

interface TarifRow {
    idFrais: number;
    libelle: string;
    montant: number;
    ordre: number;
    dateLimite: string;
    dateAlerte: string;
    hasPayments?: boolean;
}

const ExigibleDistributionPage: React.FC = () => {
    const { selectedYear } = useSchoolYear();
    const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;

    const [classes, setClasses] = useState<any[]>([]);
    const [libraryFees, setLibraryFees] = useState<FraisExigible[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [tarifs, setTarifs] = useState<TarifRow[]>([]);
    const [allYearTarifs, setAllYearTarifs] = useState<any[]>([]);

    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (yearId) {
            loadInitialData();
        }
    }, [yearId]);

    useEffect(() => {
        if (selectedClassId && yearId) {
            loadClassTarifs(selectedClassId);
        }
    }, [selectedClassId, yearId]);

    const loadInitialData = async () => {
        try {
            const [roomsRes, libRes, allTarifsRes] = await Promise.all([
                studentService.getRooms(yearId!),
                financeService.getExigibles(),
                api.get(`/finance/tarifs/all/${yearId}`)
            ]);

            const uniqueClasses: any[] = [];
            const classIds = new Set();
            roomsRes.data.forEach((salle: any) => {
                if (salle.Classe && !classIds.has(salle.Classe.idClasse)) {
                    classIds.add(salle.Classe.idClasse);
                    uniqueClasses.push(salle.Classe);
                }
            });
            setClasses(uniqueClasses);
            setLibraryFees(libRes.data);
            setAllYearTarifs(allTarifsRes.data.exigibles || []);

            if (uniqueClasses.length > 0 && !selectedClassId) {
                setSelectedClassId(uniqueClasses[0].idClasse);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const loadClassTarifs = async (classId: number) => {
        try {
            const res = await api.get(`/finance/tarifs/classe/${classId}/${yearId}`);

            // Check payments for each tarif (or we could optimize with a single check later)
            const rows: TarifRow[] = await Promise.all(res.data.map(async (t: any) => {
                const payRes = await api.get(`/finance/check-tarif-payments/${t.idTarifFraisExigible}`);
                return {
                    idFrais: t.idFraisExigible,
                    libelle: t.Frais?.fraisFr || 'Frais inconnu',
                    montant: t.montantFraisExigible,
                    ordre: t.ordrePaiement,
                    dateLimite: t.dateLimite?.split('T')[0] || '',
                    dateAlerte: t.dateAlerte?.split('T')[0] || '',
                    hasPayments: payRes.data.hasPayments
                };
            }));

            setTarifs(rows.sort((a, b) => a.ordre - b.ordre));
        } catch (err) {
            console.error(err);
            setTarifs([]);
        }
    };

    const addFee = (fee: FraisExigible) => {
        if (tarifs.some(t => t.idFrais === fee.idFraisExigible)) return;

        const newRow: TarifRow = {
            idFrais: fee.idFraisExigible!,
            libelle: fee.fraisFr,
            montant: 0,
            ordre: tarifs.length + 1,
            dateLimite: '',
            dateAlerte: ''
        };
        setTarifs([...tarifs, newRow]);
    };

    const removeRow = (idFrais: number) => {
        setTarifs(tarifs.filter(t => t.idFrais !== idFrais));
    };

    const updateRow = (idFrais: number, field: keyof TarifRow, value: any) => {
        setTarifs(prev => prev.map(t => t.idFrais === idFrais ? { ...t, [field]: value } : t));
    };

    const handleSave = async () => {
        if (!selectedClassId || !yearId) {
            setError("Session or class missing.");
            return;
        }

        // Basic validation
        if (tarifs.length === 0) {
            setError("Please add at least one fee to configure.");
            return;
        }

        const hasInvalidMontant = tarifs.some(t => t.montant === undefined || t.montant < 0);
        if (hasInvalidMontant) {
            setError("Some amounts are invalid.");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            console.log("💾 Saving rates for class:", selectedClassId);
            const res = await api.post('/finance/tarifs/save', {
                idClasse: selectedClassId,
                idAnneeScolaire: yearId,
                tarifs: tarifs.map(t => ({
                    idFrais: t.idFrais,
                    montant: t.montant,
                    ordre: t.ordre,
                    dateLimite: t.dateLimite || null,
                    dateAlerte: t.dateAlerte || null
                }))
            });

            console.log("✅ Server response:", res.data);
            setSuccess("Configuration saved successfully!");
            await loadClassTarifs(selectedClassId); // Reload to confirm
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error("❌ Error during save:", err.response?.data || err.message);
            setError(err.response?.data?.error || "Error during save.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20 p-4">
            <div className="bg-white p-10 rounded-[40px] shadow-xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
                <div className="flex items-center space-x-6 relative z-10">
                    <button onClick={() => window.history.back()} className="p-4 hover:bg-gray-100 rounded-full transition-all bg-gray-50 text-black shadow-sm">
                        <ArrowLeft size={28} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-black">Fees Distribution</h1>
                        <div className="flex items-center space-x-3 mt-2">
                            <div className="bg-accent/10 text-accent px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center">
                                <Wallet size={12} className="mr-1.5" /> Compulsory Fees
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">Define amounts and deadlines per class</p>
                        </div>
                    </div>
                </div>

                <AuthButton onClick={handleSave} disabled={saving || !selectedClassId} className="md:w-auto px-12 bg-black shadow-2xl">
                    <div className="flex items-center space-x-3">
                        <Save size={20} />
                        <span>{saving ? "Saving..." : "Save Rates"}</span>
                    </div>
                </AuthButton>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-8">
                {/* Column 1: Classes & Library */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[40px] border border-gray-100 flex flex-col overflow-hidden shadow-sm h-[45vh]">
                        <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg">
                                    <Building2 size={24} />
                                </div>
                                <h3 className="font-black uppercase tracking-tight text-lg">Classes</h3>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
                            {classes.map(c => {
                                const classTarifsCount = allYearTarifs.filter(t => t.idClasse === c.idClasse).length;
                                return (
                                    <div
                                        key={c.idClasse}
                                        onClick={() => setSelectedClassId(c.idClasse)}
                                        className={clsx(
                                            "p-5 rounded-[24px] cursor-pointer transition-all border-2 flex items-center justify-between group",
                                            selectedClassId === c.idClasse ? "border-black bg-black text-white shadow-xl" : "border-transparent bg-gray-50 hover:bg-white hover:border-gray-200"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-sm uppercase tracking-tight">{c.libelleClasseFr}</span>
                                            {classTarifsCount > 0 && (
                                                <span className={clsx(
                                                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter",
                                                    selectedClassId === c.idClasse ? "bg-white/20 text-white" : "bg-orange-100 text-orange-600"
                                                )}>
                                                    {classTarifsCount} fees
                                                </span>
                                            )}
                                        </div>
                                        {selectedClassId === c.idClasse && <Check size={18} className="text-accent" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-gray-100 flex flex-col overflow-hidden shadow-sm h-[40vh]">
                        <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-accent text-white rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20">
                                    <Plus size={24} />
                                </div>
                                <h3 className="font-black uppercase tracking-tight text-lg">Add fees</h3>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
                            {libraryFees.map(fee => {
                                const isAdded = tarifs.some(t => t.idFrais === fee.idFraisExigible);
                                return (
                                    <div
                                        key={fee.idFraisExigible}
                                        onClick={() => !isAdded && addFee(fee)}
                                        className={clsx(
                                            "p-4 rounded-2xl transition-all border flex items-center justify-between group",
                                            isAdded ? "opacity-40 cursor-not-allowed bg-gray-50 border-gray-100" : "cursor-pointer border-gray-100 bg-white hover:border-black"
                                        )}
                                    >
                                        <span className="font-bold text-xs uppercase text-black">{fee.fraisFr}</span>
                                        {!isAdded && <Plus size={16} className="text-gray-400 group-hover:text-black" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Column 2: Tarif Configuration */}
                <div className="bg-white rounded-[40px] border border-gray-100 flex flex-col overflow-hidden shadow-sm h-[88vh]">
                    <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-accent text-white rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20">
                                <Wallet size={24} />
                            </div>
                            <div>
                                <h3 className="font-black uppercase tracking-tight text-lg">Rates Configuration</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {classes.find(c => c.idClasse === selectedClassId)?.libelleClasseFr}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                        {tarifs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-20 space-y-6">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
                                    <Wallet size={48} />
                                </div>
                                <div>
                                    <p className="font-black uppercase text-lg">No fees configured</p>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Use the left column to add fees to this class</p>
                                </div>
                            </div>
                        ) : (
                            tarifs.map((row, index) => (
                                <div key={row.idFrais} className="p-6 bg-gray-50/50 rounded-[32px] border border-gray-100 space-y-6 relative group animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-8 h-8 bg-black text-white rounded-xl flex items-center justify-center font-black text-xs">
                                                {index + 1}
                                            </div>
                                            <div className="flex flex-col">
                                                <h4 className="font-black uppercase text-sm tracking-tight text-black">{row.libelle}</h4>
                                                {row.hasPayments && (
                                                    <span className="text-[8px] font-black text-red-500 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                                        <AlertCircle size={10} /> Locked (Existing payments)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {!row.hasPayments && (
                                            <button
                                                onClick={() => removeRow(row.idFrais)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                            ><Trash2 size={18}/></button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Amount (FCFA)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    disabled={row.hasPayments}
                                                    className={clsx(
                                                        "w-full border border-transparent rounded-2xl px-4 py-3 text-xs font-bold outline-none transition-all shadow-inner",
                                                        row.hasPayments ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white focus:border-accent"
                                                    )}
                                                    value={row.montant}
                                                    onChange={e => updateRow(row.idFrais, 'montant', Number(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Order</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    disabled={row.hasPayments}
                                                    className={clsx(
                                                        "w-full border border-transparent rounded-2xl px-4 py-3 text-xs font-bold outline-none transition-all shadow-inner",
                                                        row.hasPayments ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white focus:border-accent"
                                                    )}
                                                    value={row.ordre}
                                                    onChange={e => updateRow(row.idFrais, 'ordre', Number(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Deadline</label>
                                            <input
                                                type="date"
                                                className="w-full bg-white border border-transparent rounded-2xl px-4 py-3 text-[10px] font-bold outline-none focus:border-accent transition-all shadow-inner"
                                                value={row.dateLimite}
                                                onChange={e => updateRow(row.idFrais, 'dateLimite', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Alert</label>
                                            <input
                                                type="date"
                                                className="w-full bg-white border border-transparent rounded-2xl px-4 py-3 text-[10px] font-bold outline-none focus:border-accent transition-all shadow-inner"
                                                value={row.dateAlerte}
                                                onChange={e => updateRow(row.idFrais, 'dateAlerte', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-start space-x-4">
                        <Info className="text-accent shrink-0" size={20} />
                        <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase tracking-tight">
                            The payment order determines the priority of automatic payment allocation.
                            The fee with the lowest order is settled first.
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center space-x-4 animate-in slide-in-from-bottom-10">
                    <AlertCircle size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">{error}</span>
                </div>
            )}

            {success && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center space-x-4 animate-in slide-in-from-bottom-10">
                    <CheckCircle2 size={20} className="text-green-400" />
                    <span className="text-xs font-black uppercase tracking-widest">{success}</span>
                </div>
            )}
        </div>
    );
};

export default ExigibleDistributionPage;
