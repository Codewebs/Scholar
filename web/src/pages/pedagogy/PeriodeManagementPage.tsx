import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { pedagogyService } from '../../api/pedagogyService';
import { PeriodeEntity, SousPeriodeEntity } from '../../types/pedagogy';
import { ArrowLeft, Plus, Edit2, Trash2, Calendar, CornerDownRight, X, Save } from 'lucide-react';
import { clsx } from 'clsx';
import AuthInput from '../../components/ui/AuthInput';
import AuthButton from '../../components/ui/AuthButton';

const PeriodeManagementPage: React.FC = () => {
  const { selectedYear } = useSchoolYear();
  const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;

  const [periodes, setPeriodes] = useState<PeriodeEntity[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialog States
  const [isPeriodeModalOpen, setIsPeriodeModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingPeriode, setEditingPeriode] = useState<Partial<PeriodeEntity> | null>(null);
  const [editingSub, setEditingSub] = useState<Partial<SousPeriodeEntity> | null>(null);

  useEffect(() => {
    if (yearId) loadPeriodes();
  }, [yearId]);

  const loadPeriodes = async () => {
    setLoading(true);
    try {
      const res = await pedagogyService.getPeriodes(yearId!);
      setPeriodes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePeriode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearId || !editingPeriode) return;
    try {
      const nextOrder = editingPeriode.idPeriode ? editingPeriode.ordrePeriode : (periodes.length + 1);
      await pedagogyService.savePeriode({ ...editingPeriode, idAnneeScolaire: yearId, ordrePeriode: nextOrder });
      setIsPeriodeModalOpen(false);
      loadPeriodes();
    } catch (err) { alert("Erreur"); }
  };

  const handleSaveSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    try {
        const parent = periodes.find(p => p.idPeriode === editingSub.idPeriode);
        const nextOrder = editingSub.idSousPeriode ? editingSub.ordreSousPeriode : ((parent?.sousPeriodes?.length || 0) + 1);
        await pedagogyService.saveSousPeriode({ ...editingSub, ordreSousPeriode: nextOrder });
        setIsSubModalOpen(false);
        loadPeriodes();
    } catch (err) { alert("Erreur"); }
  };

  const handleDeletePeriode = async (id: number) => {
    if (window.confirm("Supprimer cette période et ses séquences ?")) {
      await pedagogyService.deletePeriode(id);
      loadPeriodes();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Calendrier Scolaire</h1>
        </div>
        <button
          onClick={() => { setEditingPeriode({ libellePeriodeFr: '', abrevLibelleFr: '', dateDebut: '', dateFin: '' }); setIsPeriodeModalOpen(true); }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Nouvelle Période</span>
        </button>
      </div>

      <div className="space-y-6">
        {loading ? (
            <div className="p-20 text-center animate-pulse font-black uppercase text-[#9E9E9E]">Chargement du calendrier...</div>
        ) : periodes.map(periode => (
            <div key={periode.idPeriode} className="bg-white border border-border rounded-[24px] overflow-hidden shadow-sm">
                <div className="p-6 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-black text-white rounded-soft flex items-center justify-center">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-sm uppercase tracking-tight">
                                {periode.libellePeriodeFr}
                                {periode.abrevLibelleFr && <span className="ml-2 text-[10px] text-accent opacity-50">[{periode.abrevLibelleFr}]</span>}
                            </h3>
                            <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <Calendar size={12} />
                                <span>{periode.dateDebut} — {periode.dateFin}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => { setEditingPeriode(periode); setIsPeriodeModalOpen(true); }} className="p-2 hover:bg-white rounded-sharp text-[#9E9E9E] hover:text-black transition-colors shadow-sm"><Edit2 size={16}/></button>
                        <button onClick={() => handleDeletePeriode(periode.idPeriode!)} className="p-2 hover:bg-white rounded-sharp text-[#9E9E9E] hover:text-red-600 transition-colors shadow-sm"><Trash2 size={16}/></button>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {periode.sousPeriodes?.map(sub => (
                        <div key={sub.idSousPeriode} className="flex items-center justify-between pl-8 group">
                            <div className="flex items-center space-x-3">
                                <CornerDownRight size={14} className="text-gray-300" />
                                <div>
                                    <p className="font-black text-[11px] uppercase tracking-tight">
                                        {sub.libelleSousPeriodeFr}
                                        {sub.abrevLibelleFr && <span className="ml-2 text-[9px] text-gray-400">({sub.abrevLibelleFr})</span>}
                                    </p>
                                    <p className="text-[9px] font-bold text-[#9E9E9E] uppercase tracking-widest">{sub.dateDebut} — {sub.dateFin}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingSub(sub); setIsSubModalOpen(true); }} className="p-1.5 hover:bg-gray-100 rounded-sharp text-[#9E9E9E] hover:text-black"><Edit2 size={12}/></button>
                                <button className="p-1.5 hover:bg-gray-100 rounded-sharp text-[#9E9E9E] hover:text-red-600"><Trash2 size={12}/></button>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={() => { setEditingSub({ idPeriode: periode.idPeriode, libelleSousPeriodeFr: '', abrevLibelleFr: '', dateDebut: periode.dateDebut, dateFin: periode.dateFin }); setIsSubModalOpen(true); }}
                        className="w-full mt-4 py-3 border border-dashed border-gray-200 rounded-sharp text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] hover:border-black hover:text-black transition-all"
                    >
                        + Ajouter une séquence
                    </button>
                </div>
            </div>
        ))}
      </div>

      {/* Modal Periode */}
      {isPeriodeModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <form onSubmit={handleSavePeriode} className="bg-white rounded-[32px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[90vh]">
                  <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-black uppercase tracking-tighter">Période</h2>
                      <button type="button" onClick={() => setIsPeriodeModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
                  </div>
                  <div className="space-y-6">
                      <AuthInput label="Libellé (ex: Trimestre 1)" value={editingPeriode?.libellePeriodeFr || ''} onChange={e => setEditingPeriode({...editingPeriode!, libellePeriodeFr: e.target.value})} required />

                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                          <p className="text-[10px] font-black uppercase text-gray-400">Identifiants Courts (Bulletins)</p>
                          <AuthInput label="Abréviation FR" placeholder="ex: TRIM 1" value={editingPeriode?.abrevLibelleFr || ''} onChange={e => setEditingPeriode({...editingPeriode!, abrevLibelleFr: e.target.value})} required />
                          <AuthInput label="Abréviation EN" placeholder="ex: TERM 1" value={editingPeriode?.abrevLibelleEn || ''} onChange={e => setEditingPeriode({...editingPeriode!, abrevLibelleEn: e.target.value})} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <AuthInput label="Début" type="date" value={editingPeriode?.dateDebut || ''} onChange={e => setEditingPeriode({...editingPeriode!, dateDebut: e.target.value})} required />
                          <AuthInput label="Fin" type="date" value={editingPeriode?.dateFin || ''} onChange={e => setEditingPeriode({...editingPeriode!, dateFin: e.target.value})} required />
                      </div>
                      <AuthButton type="submit" className="w-full"><Save size={18} className="mr-2"/> Enregistrer</AuthButton>
                  </div>
              </form>
          </div>
      )}

      {/* Modal Séquence */}
      {isSubModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <form onSubmit={handleSaveSub} className="bg-white rounded-[32px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[90vh]">
                  <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-black uppercase tracking-tighter">Séquence</h2>
                      <button type="button" onClick={() => setIsSubModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
                  </div>
                  <div className="space-y-6">
                      <AuthInput label="Libellé (ex: Séquence 1)" value={editingSub?.libelleSousPeriodeFr || ''} onChange={e => setEditingSub({...editingSub!, libelleSousPeriodeFr: e.target.value})} required />

                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                          <p className="text-[10px] font-black uppercase text-gray-400">Identifiants Courts (Bulletins)</p>
                          <AuthInput label="Abréviation FR" placeholder="ex: SEQ 1" value={editingSub?.abrevLibelleFr || ''} onChange={e => setEditingSub({...editingSub!, abrevLibelleFr: e.target.value})} required />
                          <AuthInput label="Abréviation EN" placeholder="ex: SEQ 1" value={editingSub?.abrevLibelleEn || ''} onChange={e => setEditingSub({...editingSub!, abrevLibelleEn: e.target.value})} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <AuthInput label="Début" type="date" value={editingSub?.dateDebut || ''} onChange={e => setEditingSub({...editingSub!, dateDebut: e.target.value})} required />
                          <AuthInput label="Fin" type="date" value={editingSub?.dateFin || ''} onChange={e => setEditingSub({...editingSub!, dateFin: e.target.value})} required />
                      </div>
                      <AuthButton type="submit" className="w-full"><Save size={18} className="mr-2"/> Enregistrer</AuthButton>
                  </div>
              </form>
          </div>
      )}
    </div>
  );
};

export default PeriodeManagementPage;
