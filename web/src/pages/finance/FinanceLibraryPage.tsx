import React, { useState, useEffect } from 'react';
import { financeService, FraisExigible, FraisActivitePeriscolaire } from '../../api/financeService';
import { Plus, Trash2, ArrowLeft, Save, X, Wallet, Sparkles, AlertCircle, Pencil } from 'lucide-react';
import AuthInput from '../../components/ui/AuthInput';
import AuthButton from '../../components/ui/AuthButton';
import { clsx } from 'clsx';

const FinanceLibraryPage: React.FC = () => {
  const [tab, setTab] = useState<'EXIGIBLE' | 'PERISCOLAIRE'>('EXIGIBLE');
  const [exigibles, setExigibles] = useState<FraisExigible[]>([]);
  const [periscolaires, setPeriscolaires] = useState<FraisActivitePeriscolaire[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({ fr: '', en: '', desc: '' });

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'EXIGIBLE') {
        const res = await financeService.getExigibles();
        setExigibles(res.data);
      } else {
        const res = await financeService.getPeriscolaires();
        setPeriscolaires(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    if (tab === 'EXIGIBLE') {
      const it = item as FraisExigible;
      setEditingId(it.idFraisExigible!);
      setFormData({ fr: it.fraisFr, en: it.fraisEn, desc: it.description || '' });
    } else {
      const it = item as FraisActivitePeriscolaire;
      setEditingId(it.idFraisActivitePeriscolaire!);
      setFormData({ fr: it.libelleFr, en: it.libelleEn || '', desc: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (tab === 'EXIGIBLE') {
        const data = { fraisFr: formData.fr, fraisEn: formData.en, description: formData.desc };
        if (editingId) await financeService.updateExigible(editingId, data);
        else await financeService.createExigible(data);
      } else {
        const data = { libelleFr: formData.fr, libelleEn: formData.en };
        if (editingId) await financeService.updatePeriscolaire(editingId, data);
        else await financeService.createPeriscolaire(data);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ fr: '', en: '', desc: '' });
      loadData();
    } catch (err) {
      alert("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Supprimer cet élément de la bibliothèque ?")) {
      try {
        if (tab === 'EXIGIBLE') await financeService.deleteExigible(id);
        else await financeService.deletePeriscolaire(id);
        loadData();
      } catch (err) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
        <div className="flex items-center space-x-6">
          <button onClick={() => window.history.back()} className="p-3 hover:bg-gray-100 rounded-full transition-all active:scale-90">
            <ArrowLeft size={28} className="text-black" />
          </button>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-black">Bibliothèques des Frais</h1>
            <div className="flex items-center space-x-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">Référentiel de tarification scolaire</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => { setEditingId(null); setFormData({ fr: '', en: '', desc: '' }); setIsModalOpen(true); }}
          className={clsx(
            "group py-4 px-8 rounded-sharp flex items-center space-x-3 shadow-xl transition-all hover:scale-105 active:scale-95 text-white font-black uppercase text-xs tracking-widest",
            tab === 'EXIGIBLE' ? "bg-accent shadow-violet-200" : "bg-green-600 shadow-green-100"
          )}
        >
          <div className="bg-white/20 p-1 rounded-sm">
            <Plus size={18} />
          </div>
          <span>Nouveau {tab === 'EXIGIBLE' ? 'Frais' : 'Activité'}</span>
        </button>
      </div>

      {/* Modern Tabs with Colors */}
      <div className="flex p-1.5 bg-gray-100/80 backdrop-blur-md rounded-[20px] max-w-md border border-gray-200/50">
        <button
          onClick={() => setTab('EXIGIBLE')}
          className={clsx(
            "flex-1 py-4 font-black uppercase text-[10px] tracking-widest rounded-[14px] transition-all",
            tab === 'EXIGIBLE' ? "bg-white text-accent shadow-md shadow-gray-200" : "text-[#9E9E9E] hover:text-black"
          )}
        >
          <div className="flex items-center justify-center space-x-2">
            <Wallet size={14} />
            <span>Frais Exigibles</span>
          </div>
        </button>
        <button
          onClick={() => setTab('PERISCOLAIRE')}
          className={clsx(
            "flex-1 py-4 font-black uppercase text-[10px] tracking-widest rounded-[14px] transition-all",
            tab === 'PERISCOLAIRE' ? "bg-white text-green-600 shadow-md shadow-gray-200" : "text-[#9E9E9E] hover:text-black"
          )}
        >
          <div className="flex items-center justify-center space-x-2">
            <Sparkles size={14} />
            <span>Périscolaires</span>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="p-20 text-center animate-pulse flex flex-col items-center space-y-4">
             <div className={clsx("w-12 h-12 border-4 border-t-transparent rounded-full animate-spin", tab === 'EXIGIBLE' ? "border-accent" : "border-green-600")}></div>
             <p className="font-black uppercase text-[10px] tracking-widest text-[#9E9E9E]">Synchronisation...</p>
          </div>
        ) : (tab === 'EXIGIBLE' ? exigibles : periscolaires).length === 0 ? (
          <div className="p-24 text-center border-4 border-dashed border-gray-100 rounded-[48px] bg-gray-50/50">
             <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                <AlertCircle size={40} className="text-gray-200" />
             </div>
             <h3 className="font-black uppercase text-xl text-black mb-2">Bibliothèque vide</h3>
             <p className="font-bold text-[10px] uppercase text-[#9E9E9E] tracking-widest">Commencez par ajouter votre premier type de frais</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(tab === 'EXIGIBLE' ? exigibles : periscolaires).map((item, index) => {
              const id = tab === 'EXIGIBLE' ? (item as FraisExigible).idFraisExigible : (item as FraisActivitePeriscolaire).idFraisActivitePeriscolaire;
              const labelFr = tab === 'EXIGIBLE' ? (item as FraisExigible).fraisFr : (item as FraisActivitePeriscolaire).libelleFr;
              const labelEn = tab === 'EXIGIBLE' ? (item as FraisExigible).fraisEn : (item as FraisActivitePeriscolaire).libelleEn;
              const desc = tab === 'EXIGIBLE' ? (item as FraisExigible).description : "";

              return (
                <div key={id || index} className="group relative bg-white border border-gray-100 p-8 rounded-[32px] hover:border-black transition-all shadow-sm hover:shadow-xl hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-6">
                    <div className={clsx(
                      "w-14 h-14 rounded-[18px] flex items-center justify-center text-white transition-all group-hover:rotate-12 group-hover:scale-110 shadow-lg",
                      tab === 'EXIGIBLE' ? "bg-accent shadow-violet-200" : "bg-green-500 shadow-green-100"
                    )}>
                      {tab === 'EXIGIBLE' ? <Wallet size={28} /> : <Sparkles size={28} />}
                    </div>
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                            onClick={() => handleEdit(item)}
                            className="p-2.5 bg-gray-50 text-gray-400 rounded-sharp hover:bg-black hover:text-white transition-all"
                        ><Pencil size={18}/></button>
                        <button
                            onClick={() => handleDelete(id!)}
                            className="p-2.5 bg-red-50 text-red-400 rounded-sharp hover:bg-red-600 hover:text-white transition-all"
                        ><Trash2 size={18}/></button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-black text-lg uppercase tracking-tight text-black line-clamp-1">{labelFr}</h3>
                    <p className="text-[10px] font-black text-[#9E9E9E] uppercase tracking-[0.2em]">{labelEn || '---'}</p>
                    {desc && <p className="text-[10px] text-gray-400 font-medium italic mt-4 line-clamp-2 leading-relaxed">{desc}</p>}
                  </div>

                  {/* Colored Tag */}
                  <div className={clsx(
                    "absolute top-8 right-8 w-1.5 h-6 rounded-full",
                    tab === 'EXIGIBLE' ? "bg-accent" : "bg-green-500"
                  )}></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-[48px] p-12 max-w-lg w-full shadow-2xl animate-in zoom-in-95 border border-gray-100">
            <div className="flex justify-between items-start mb-12">
              <div>
                <div className={clsx("flex items-center space-x-2 mb-2", tab === 'EXIGIBLE' ? "text-accent" : "text-green-600")}>
                    {tab === 'EXIGIBLE' ? <Wallet size={20} /> : <Sparkles size={20} />}
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">{tab} CONFIGURATION</span>
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tighter text-black">
                    {editingId ? "Modifier" : "Ajouter"}
                </h2>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-gray-100 rounded-full transition-all text-black"><X size={28}/></button>
            </div>

            <div className="space-y-8">
              <AuthInput
                label="Libellé Français *"
                placeholder="Ex: Inscription, Scolarité..."
                value={formData.fr}
                onChange={e => setFormData({ ...formData, fr: e.target.value })}
                required
              />
              <AuthInput
                label="Libellé Anglais *"
                placeholder="Ex: Registration, Tuition..."
                value={formData.en}
                onChange={e => setFormData({ ...formData, en: e.target.value })}
                required
              />
              {tab === 'EXIGIBLE' && (
                <AuthInput
                    label="Description Additionnelle"
                    placeholder="Précisions sur ce type de frais..."
                    value={formData.desc}
                    onChange={e => setFormData({ ...formData, desc: e.target.value })}
                />
              )}

              <div className="pt-6">
                  <AuthButton type="submit" className={clsx("w-full py-6 rounded-sharp text-sm font-black tracking-[0.2em]", tab === 'EXIGIBLE' ? "bg-accent" : "bg-green-600")}>
                    <span className="flex items-center justify-center uppercase">
                      <Save size={22} className="mr-4" />
                      ENREGISTRER LE RÉFÉRENTIEL
                    </span>
                  </AuthButton>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FinanceLibraryPage;
