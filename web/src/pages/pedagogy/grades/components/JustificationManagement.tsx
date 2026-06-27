import React, { useState, useEffect } from 'react';
import { gradeService } from '../../../../api/gradeService';
import {
    Plus,
    Trash2,
    Edit2,
    Check,
    X,
    AlertCircle,
    Clock
} from 'lucide-react';

const JustificationManagement: React.FC = () => {
    const [justifications, setJustifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    const [newValue, setNewValue] = useState('');

    useEffect(() => {
        loadJustifications();
    }, []);

    const loadJustifications = async () => {
        setLoading(true);
        try {
            const res = await gradeService.getJustifications();
            setJustifications(res.data);
        } catch (err) {
            setError("Erreur chargement motifs");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newValue.trim()) return;
        try {
            await gradeService.saveJustification({ libelle: newValue });
            setNewValue('');
            loadJustifications();
        } catch (err) {
            setError("Erreur lors de l'ajout");
        }
    };

    const handleUpdate = async (id: number) => {
        if (!editValue.trim()) return;
        try {
            await gradeService.saveJustification({ idJustification: id, libelle: editValue });
            setEditingId(null);
            loadJustifications();
        } catch (err) {
            setError("Erreur lors de la modification");
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Supprimer ce motif ?")) return;
        try {
            await gradeService.deleteJustification(id);
            loadJustifications();
        } catch (err) {
            setError("Erreur lors de la suppression");
        }
    };

    return (
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center">
                        <Clock size={24} />
                    </div>
                    <div>
                        <h3 className="font-black uppercase tracking-tight text-lg">Motifs de Justification</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Configuration des absences</p>
                    </div>
                </div>
            </div>

            <div className="p-8 space-y-6">
                {/* Add New */}
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        placeholder="Nouveau motif (ex: Maladie, Voyage...)"
                        className="flex-1 bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl px-6 py-4 font-bold outline-none transition-all"
                    />
                    <button
                        onClick={handleAdd}
                        disabled={!newValue.trim()}
                        className="bg-black text-white px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-20"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {error && (
                    <div className="flex items-center space-x-2 text-red-500 bg-red-50 p-4 rounded-2xl">
                        <AlertCircle size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                    </div>
                )}

                <div className="space-y-2">
                    {loading ? (
                        <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" /></div>
                    ) : justifications.length === 0 ? (
                        <div className="py-10 text-center text-gray-300 text-[10px] font-black uppercase tracking-widest">Aucun motif configuré</div>
                    ) : justifications.map(j => (
                        <div key={j.idJustification} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all group">
                            {editingId === j.idJustification ? (
                                <input
                                    autoFocus
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="flex-1 bg-white border-2 border-black rounded-xl px-4 py-2 font-bold outline-none"
                                />
                            ) : (
                                <span className="font-bold text-black">{j.libelle}</span>
                            )}

                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                                {editingId === j.idJustification ? (
                                    <>
                                        <button onClick={() => handleUpdate(j.idJustification)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg"><Check size={18} /></button>
                                        <button onClick={() => setEditingId(null)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><X size={18} /></button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => { setEditingId(j.idJustification); setEditValue(j.libelle); }}
                                            className="p-2 text-gray-400 hover:text-black hover:bg-white rounded-lg transition-all"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(j.idJustification)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default JustificationManagement;
