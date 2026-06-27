import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { matiereService, MatiereKPIs } from '../../api/matiereService';
import { MatiereEntity } from '../../types/pedagogy';
import {
  Search,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  LayoutGrid,
  X,
  Save,
  RotateCcw
} from 'lucide-react';
import { clsx } from 'clsx';
import AuthButton from '../../components/ui/AuthButton';
import AuthInput from '../../components/ui/AuthInput';

const MatiereListPage: React.FC = () => {
  const { selectedYear } = useSchoolYear();
  const [matieres, setMatieres] = useState<MatiereEntity[]>([]);
  const [kpis, setKPIs] = useState<MatiereKPIs | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMatiere, setCurrentMatiere] = useState<Partial<MatiereEntity>>({
    libelleFr: '',
    libelleEn: '',
    codeMatiere: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load Global Library (Critical)
      const resLib = await matiereService.getGlobalLibrary();
      setMatieres(resLib.data);

      // 2. Load KPIs (Non-critical)
      const yId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;
      if (yId) {
        try {
          const resKPI = await matiereService.getKPIs(yId);
          setKPIs(resKPI.data);
        } catch (kpiError) {
          console.warn("KPIs could not be loaded", kpiError);
        }
      }
    } catch (error) {
      console.error("Erreur chargement bibliothèque matières:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentMatiere({ libelleFr: '', libelleEn: '', codeMatiere: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (matiere: MatiereEntity) => {
    setIsEditing(true);
    setCurrentMatiere(matiere);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing && currentMatiere.idServeur) {
        await matiereService.updateMatiere(currentMatiere.idServeur, currentMatiere);
      } else {
        await matiereService.createMatiere(currentMatiere);
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      alert("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette matière de la bibliothèque globale ?")) {
      setLoading(true);
      try {
        await matiereService.deleteMatiere(id);
        loadData();
      } catch (error) {
        alert("Erreur lors de la suppression. Cette matière est peut-être utilisée dans des classes.");
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredMatieres = matieres.filter(m =>
    (m.libelleFr?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (m.codeMatiere?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[40px] shadow-xl border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

        <div className="flex items-center space-x-6 relative z-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-[22px] flex items-center justify-center text-white shadow-lg shadow-indigo-100 rotate-3">
                <BookOpen size={32} />
            </div>
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter text-black">Matières</h1>
                <div className="flex items-center space-x-3 mt-2">
                    <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center">
                        <LayoutGrid size={12} className="mr-1.5" /> Catalogue Global
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">Référentiel des enseignements</p>
                </div>
            </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-black text-white py-4 px-10 rounded-sharp flex items-center space-x-3 shadow-2xl hover:scale-105 active:scale-95 transition-all font-black uppercase text-xs tracking-[0.2em]"
        >
          <Plus size={20} className="text-indigo-400" />
          <span>Nouvelle Matière</span>
        </button>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <KPICard
            icon={BookOpen}
            color="bg-black"
            label="Total Matières"
            value={matieres.length.toString()}
        />
        <KPICard
            icon={TrendingUp}
            color="bg-indigo-600"
            label="Taux Répartition"
            value={`${kpis?.tauxRepartition || 0}%`}
        />
        <KPICard
            icon={RotateCcw}
            color="bg-green-600"
            label="Session Active"
            value={selectedYear?.libelleAnneeScolaire || '---'}
        />
      </div>

      {/* List Area */}
      <div className="bg-white rounded-[48px] p-10 shadow-2xl shadow-gray-200/50 border border-gray-100 space-y-8">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
          <input
            type="text"
            placeholder="Rechercher une matière (Nom ou Code)..."
            className="w-full pl-16 pr-8 py-6 bg-gray-50 border border-transparent rounded-[24px] text-sm font-bold focus:bg-white focus:border-indigo-600 transition-all outline-none shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9E9E9E] border-b border-gray-50">
                  <th className="px-8 py-6 text-left">Code</th>
                  <th className="px-8 py-6 text-left">Dénomination (FR)</th>
                  <th className="px-8 py-6 text-left">Dénomination (EN)</th>
                  <th className="px-8 py-6 text-right">Opérations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredMatieres.map((matiere, idx) => (
                  <tr key={matiere.idServeur || idx} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg inline-block font-black text-xs tracking-widest shadow-sm">
                        {matiere.codeMatiere}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                        <span className="font-black text-sm uppercase tracking-tight text-black">{matiere.libelleFr}</span>
                    </td>
                    <td className="px-8 py-6">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{matiere.libelleEn || '---'}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => handleOpenEdit(matiere)}
                            className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                            onClick={() => handleDelete(matiere.idServeur!)}
                            className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-red-600 hover:border-red-600 transition-all shadow-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>

        {filteredMatieres.length === 0 && !loading && (
            <div className="py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                    <BookOpen size={40} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#9E9E9E]">Aucune matière trouvée</p>
            </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="w-full max-w-xl bg-white rounded-[56px] p-16 shadow-2xl relative overflow-hidden border border-gray-100">
              <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>

              <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                <X size={24} />
              </button>

              <div className="flex items-center space-x-4 text-indigo-600 mb-4">
                  <BookOpen size={28} />
                  <span className="text-[11px] font-black uppercase tracking-[0.5em]">Configuration Matière</span>
              </div>

              <h2 className="text-4xl font-black uppercase tracking-tighter text-black mb-10">
                {isEditing ? "Modifier Matière" : "Nouvelle Matière"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-8">
                <AuthInput
                  label="Code Identifiant (ex: MATH-01)"
                  value={currentMatiere.codeMatiere}
                  onChange={e => setCurrentMatiere({...currentMatiere, codeMatiere: e.target.value.toUpperCase()})}
                  placeholder="CODE"
                  required
                  disabled={loading}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AuthInput
                        label="Nom Français"
                        value={currentMatiere.libelleFr}
                        onChange={e => setCurrentMatiere({...currentMatiere, libelleFr: e.target.value})}
                        placeholder="Libellé FR"
                        required
                        disabled={loading}
                    />
                    <AuthInput
                        label="Nom Anglais"
                        value={currentMatiere.libelleEn}
                        onChange={e => setCurrentMatiere({...currentMatiere, libelleEn: e.target.value})}
                        placeholder="Libellé EN"
                        disabled={loading}
                    />
                </div>

                <div className="pt-8">
                  <AuthButton type="submit" disabled={loading}>
                    {loading ? (
                        <div className="flex items-center space-x-3">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Traitement...</span>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-3">
                            <Save size={20} />
                            <span>{isEditing ? "Enregistrer les modifications" : "Ajouter au catalogue"}</span>
                        </div>
                    )}
                  </AuthButton>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const KPICard: React.FC<{ icon: any, color: string, label: string, value: string }> = ({ icon: Icon, color, label, value }) => (
    <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-xl flex items-center space-x-6 hover:shadow-2xl transition-all group overflow-hidden relative">
        <div className={clsx("w-16 h-16 rounded-[22px] flex items-center justify-center text-white shadow-lg transition-all group-hover:scale-110", color)}>
            <Icon size={28} />
        </div>
        <div>
            <p className="text-[10px] font-black text-[#9E9E9E] uppercase tracking-[0.2em] mb-1">{label}</p>
            <h3 className="text-3xl font-black text-black tracking-tighter">{value}</h3>
        </div>
        <div className={clsx("absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.03] transition-all group-hover:scale-150 rounded-full", color)}></div>
    </div>
);

export default MatiereListPage;
