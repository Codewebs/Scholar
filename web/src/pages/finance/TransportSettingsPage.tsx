import React, { useState, useEffect } from 'react';
import { financeService } from '../../api/financeService';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { Bus, Plus, Trash2, MapPin, Search, Wallet, Save, ChevronRight, X } from 'lucide-react';
import { clsx } from 'clsx';
import AuthInput from '../../components/ui/AuthInput';
import AuthButton from '../../components/ui/AuthButton';

const TransportSettingsPage: React.FC = () => {
    const { selectedYear } = useSchoolYear();
    const yearId = selectedYear?.idAnneeScolaire || selectedYear?.idServeur;

    const [quartiers, setQuartiers] = useState<any[]>([]);
    const [tarifs, setTarifs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showQuartierModal, setShowQuartierModal] = useState(false);
    const [newQuartier, setNewQuartier] = useState({ libelle: '', ville: '' });

    useEffect(() => {
        loadData();
    }, [yearId]);

    const loadData = async () => {
        if (!yearId) return;
        setLoading(true);
        try {
            const [qRes, tRes] = await Promise.all([
                financeService.getQuartiers(),
                financeService.getTarifsTransport(yearId)
            ]);
            setQuartiers(qRes.data);
            setTarifs(tRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateQuartier = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await financeService.createQuartier(newQuartier);
            setNewQuartier({ libelle: '', ville: '' });
            setShowQuartierModal(false);
            loadData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveTarif = async (idQuartier: number, montant: string) => {
        if (!yearId || !montant) return;
        try {
            await financeService.saveTarifTransport({
                idQuartier,
                idAnneeScolaire: yearId,
                montantTransport: parseInt(montant)
            });
            loadData();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Zones de Transport</h1>
                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary mt-1">
                        Configuration des tarifs par quartier pour {selectedYear?.libelleAnneeScolaire}
                    </p>
                </div>
                <button
                    onClick={() => setShowQuartierModal(true)}
                    className="flex items-center space-x-3 bg-black text-white px-8 py-4 rounded-[20px] shadow-xl hover:scale-105 transition-all w-fit"
                >
                    <Plus size={20} />
                    <span className="text-[11px] font-black uppercase tracking-widest">Ajouter un quartier</span>
                </button>
            </div>

            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-4 animate-pulse">
                    <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Chargement...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {quartiers.map(q => {
                        const tarif = tarifs.find(t => t.idQuartier === q.idQuartier);
                        return (
                            <div key={q.idQuartier} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                                <div className="flex items-center space-x-4 mb-8">
                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-secondary group-hover:bg-black group-hover:text-white transition-all shadow-inner">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black uppercase text-sm tracking-tight">{q.libelle}</h3>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{q.ville || 'Toutes villes'}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-secondary ml-2">Tarif Annuel (FCFA)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            defaultValue={tarif?.montantTransport || ''}
                                            onBlur={(e) => handleSaveTarif(q.idQuartier, e.target.value)}
                                            className="flex-1 h-14 bg-gray-50 border-none rounded-2xl px-6 font-black text-sm focus:ring-2 ring-black outline-none transition-all shadow-inner"
                                            placeholder="Ex: 45000"
                                        />
                                        <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shadow-inner">
                                            <Wallet size={20} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {quartiers.length === 0 && !loading && (
                <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100">
                    <Bus size={48} className="text-gray-100" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Aucun quartier configuré</p>
                </div>
            )}

            {showQuartierModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in zoom-in-95 duration-300">
                    <div className="bg-white rounded-[48px] p-12 max-w-md w-full shadow-2xl relative">
                        <button onClick={() => setShowQuartierModal(false)} className="absolute top-8 right-8 p-3 hover:bg-gray-100 rounded-full transition-all"><X size={24}/></button>
                        <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 text-black">Nouveau Quartier</h3>
                        <form onSubmit={handleCreateQuartier} className="space-y-8">
                            <AuthInput
                                label="Nom du quartier"
                                value={newQuartier.libelle}
                                onChange={e => setNewQuartier({...newQuartier, libelle: e.target.value})}
                                required
                            />
                            <AuthInput
                                label="Ville (Optionnel)"
                                value={newQuartier.ville}
                                onChange={e => setNewQuartier({...newQuartier, ville: e.target.value})}
                            />
                            <AuthButton type="submit" className="w-full py-6">
                                Enregistrer
                            </AuthButton>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransportSettingsPage;
