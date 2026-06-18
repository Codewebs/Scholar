import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { pedagogyService, EducationProfile, PredefinedProfil } from '../../api/pedagogyService';
import { ArrowLeft, Save, Plus, X, Globe, CheckCircle2, Edit2, ChevronRight, Building2, Layers, BookOpen, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import AuthButton from '../../components/ui/AuthButton';
import { useNavigate } from 'react-router-dom';

interface Enseignement {
    idEnseignement: number;
    enseignementFr: string;
    enseignementEn?: string;
    cycles?: any[];
}

const AcademicStructurePage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedYear } = useSchoolYear();
  const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;

  const [existingConfig, setExistingConfig] = useState<Enseignement[]>([]);
  const [profiles, setProfiles] = useState<EducationProfile[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<EducationProfile | null>(null);
  const [selectedEnseignements, setSelectedEnseignements] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    if (yearId) {
        loadData();
    }
  }, [yearId]);

  const loadData = async () => {
    setLoading(true);
    try {
        const [configRes, profilesRes] = await Promise.all([
            pedagogyService.getStructure(yearId!),
            pedagogyService.getEducationProfiles()
        ]);
        console.log("Structure reçue:", configRes.data);
        setExistingConfig(configRes.data);
        setProfiles(profilesRes.data);
        setIsAddingNew(configRes.data.length === 0);
    } catch (err) {
        console.error("Erreur lors du chargement de la structure:", err);
    } finally {
        setLoading(false);
    }
  };

  const handleToggle = (id: number) => {
    setSelectedEnseignements(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!yearId || !selectedCountry) return;
    setLoading(true);
    try {
      const selectedOnes = selectedCountry.profils.filter(p => selectedEnseignements.includes(p.idEnseignement));
      await pedagogyService.saveProfiles(yearId, selectedCountry.nomPays, selectedOnes);
      alert("Structure enregistrée avec succès !");
      setIsAddingNew(false);
      loadData();
    } catch (err) {
      alert("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isAddingNew) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="animate-pulse font-black uppercase text-[10px] tracking-widest text-[#9E9E9E]">Initialisation de la structure...</p>
        </div>
      );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20 p-4">
      {/* Header avec plus de couleur */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-500/5 rounded-full -ml-12 -mb-12 blur-2xl"></div>

        <div className="flex items-center space-x-6 relative z-10">
            <button onClick={() => window.history.back()} className="p-4 hover:bg-gray-100 rounded-full transition-all active:scale-90 bg-gray-50 text-black shadow-sm">
                <ArrowLeft size={28} />
            </button>
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter text-black">Structure Scolaire</h1>
                <div className="flex items-center space-x-3 mt-2">
                    <div className="flex -space-x-2">
                        <div className="w-4 h-4 rounded-full bg-accent border-2 border-white"></div>
                        <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
                        <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">Année Scolaire {selectedYear?.libelleAnneeScolaire}</p>
                </div>
            </div>
        </div>

        {existingConfig.length > 0 && !isAddingNew && (
            <button
                onClick={() => setIsAddingNew(true)}
                className="bg-black text-white py-4 px-10 rounded-sharp flex items-center space-x-3 shadow-2xl hover:scale-105 active:scale-95 transition-all font-black uppercase text-xs tracking-[0.2em]"
            >
                <Plus size={20} className="text-accent" />
                <span>Ajouter un Enseignement</span>
            </button>
        )}
      </div>

      {!isAddingNew ? (
          <div className="grid grid-cols-1 gap-8 animate-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center space-x-4 mb-2">
                  <div className="h-[1px] flex-1 bg-gray-100"></div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#9E9E9E]">Profils Académiques Actifs</h3>
                  <div className="h-[1px] w-12 bg-gray-100"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {existingConfig.map((ens, idx) => (
                      <div key={ens.idEnseignement || idx} className="bg-white border border-gray-100 rounded-[40px] p-10 hover:border-black group cursor-pointer transition-all shadow-sm hover:shadow-2xl relative overflow-hidden">
                          {/* Accent bar */}
                          <div className={clsx(
                              "absolute left-0 top-1/2 -translate-y-1/2 w-2 h-20 rounded-r-full transition-all group-hover:h-32",
                              idx % 3 === 0 ? "bg-accent" : idx % 3 === 1 ? "bg-red-500" : "bg-green-500"
                          )}></div>

                          <div className="flex justify-between items-start mb-10">
                              <div className={clsx(
                                  "w-16 h-16 rounded-[22px] flex items-center justify-center text-white transition-all group-hover:rotate-6 group-hover:scale-110 shadow-lg",
                                  idx % 3 === 0 ? "bg-accent" : idx % 3 === 1 ? "bg-red-500" : "bg-green-500"
                              )}>
                                  <Building2 size={32} />
                              </div>
                              <div className="flex space-x-2">
                                  <button className="p-3 bg-gray-50 rounded-sharp text-gray-400 hover:bg-black hover:text-white transition-all"><Edit2 size={18} /></button>
                                  <button className="p-3 bg-red-50 rounded-sharp text-red-400 hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18} /></button>
                              </div>
                          </div>

                          <div className="space-y-4">
                              <div>
                                  <h4 className="font-black text-2xl uppercase tracking-tighter text-black group-hover:text-accent transition-colors">{ens.enseignementFr}</h4>
                                  <p className="text-[10px] font-black text-[#9E9E9E] uppercase tracking-widest mt-1">Niveau d'Enseignement</p>
                              </div>

                              <div className="flex items-center space-x-6 pt-6 border-t border-gray-50">
                                  <div className="flex items-center space-x-2">
                                      <Layers size={16} className="text-gray-300" />
                                      <span className="text-[11px] font-black uppercase text-black">{ens.cycles?.length || 0} Cycles</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                      <BookOpen size={16} className="text-gray-300" />
                                      <span className="text-[11px] font-black uppercase text-black">Matières Définies</span>
                                  </div>
                              </div>
                          </div>

                          <div className="mt-10 pt-8 flex items-center justify-between text-accent font-black text-[10px] uppercase tracking-widest border-t border-dashed border-gray-100">
                                <span>Gérer les Classes & Salles</span>
                                <ChevronRight size={18} />
                          </div>
                      </div>
                  ))}

                  {/* Empty Card for adding */}
                  <div
                    onClick={() => setIsAddingNew(true)}
                    className="border-4 border-dashed border-gray-100 rounded-[40px] p-10 flex flex-col items-center justify-center space-y-6 hover:border-accent hover:bg-accent/5 transition-all group cursor-pointer"
                  >
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-white group-hover:text-accent group-hover:rotate-90 transition-all">
                            <Plus size={32} />
                        </div>
                        <p className="font-black uppercase text-[11px] tracking-[0.3em] text-[#9E9E9E] group-hover:text-accent">Nouveau Profil</p>
                  </div>
              </div>
          </div>
      ) : (
        <div className="space-y-12 animate-in zoom-in-95 duration-500">
            <div className="flex justify-between items-center bg-black text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-accent opacity-10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Configuration Assistée</h3>
                    <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mt-2">Définition de la structure académique</p>
                </div>
                {existingConfig.length > 0 && (
                    <button onClick={() => setIsAddingNew(false)} className="p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-md border border-white/10"><X size={24}/></button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Step 1: Country */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center font-black text-sm">1</div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#9E9E9E]">Sélection du Pays</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {profiles.map(country => (
                        <div
                            key={country.nomPays}
                            onClick={() => { setSelectedCountry(country); setSelectedEnseignements([]); }}
                            className={clsx(
                            "p-8 border-2 rounded-[32px] cursor-pointer transition-all flex items-center justify-between group",
                            selectedCountry?.nomPays === country.nomPays ? "border-red-500 bg-red-50" : "border-gray-100 hover:border-gray-200 bg-white"
                            )}
                        >
                            <div className="flex items-center space-x-6">
                               <div className={clsx(
                                   "w-12 h-12 rounded-soft flex items-center justify-center transition-all",
                                   selectedCountry?.nomPays === country.nomPays ? "bg-red-500 text-white rotate-6" : "bg-gray-100 text-gray-300"
                               )}>
                                   <Globe size={24} />
                               </div>
                               <span className={clsx(
                                   "font-black text-sm uppercase tracking-widest",
                                   selectedCountry?.nomPays === country.nomPays ? "text-red-600" : "text-black"
                               )}>{country.nomPays}</span>
                            </div>
                            {selectedCountry?.nomPays === country.nomPays && <CheckCircle2 size={24} className="text-red-500" />}
                        </div>
                        ))}
                    </div>
                </div>

                {/* Step 2: Profiles */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-green-600 text-white rounded-lg flex items-center justify-center font-black text-sm">2</div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#9E9E9E]">Profils d'Enseignement</h3>
                    </div>

                    {selectedCountry ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedCountry.profils
                                    .filter(p => !existingConfig.some(ex => ex.enseignementFr.toLowerCase() === p.nomProfil.toLowerCase()))
                                    .map(profil => {
                                        const isSelected = selectedEnseignements.includes(profil.idEnseignement);
                                        return (
                                            <div
                                                key={profil.idEnseignement}
                                                onClick={() => handleToggle(profil.idEnseignement)}
                                                className={clsx(
                                                    "p-8 border-2 rounded-[32px] cursor-pointer transition-all flex flex-col space-y-6 bg-white",
                                                    isSelected ? "border-green-600 bg-green-50 shadow-lg" : "border-gray-100 hover:border-gray-200"
                                                )}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className={clsx(
                                                        "w-10 h-10 rounded-soft flex items-center justify-center transition-all",
                                                        isSelected ? "bg-green-600 text-white" : "bg-gray-50 text-gray-300"
                                                    )}>
                                                        <Layers size={20} />
                                                    </div>
                                                    <div className={clsx(
                                                        "w-6 h-6 border-2 rounded-full flex items-center justify-center transition-all",
                                                        isSelected ? "bg-green-600 border-green-600" : "border-gray-200"
                                                    )}>
                                                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                                    </div>
                                                </div>
                                                <span className={clsx(
                                                    "font-black text-xs uppercase tracking-tight",
                                                    isSelected ? "text-green-700" : "text-black"
                                                )}>{profil.nomProfil}</span>
                                            </div>
                                        );
                                    })
                                }
                            </div>

                            {selectedEnseignements.length > 0 && (
                                <div className="pt-10 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <AuthButton
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="bg-green-600 shadow-green-200 py-6 text-sm"
                                    >
                                        <div className="flex items-center justify-center space-x-4">
                                            <Save size={22} />
                                            <span>VALIDER LA STRUCTURE ({selectedEnseignements.length})</span>
                                        </div>
                                    </AuthButton>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-[400px] border-4 border-dashed border-gray-50 rounded-[48px] flex flex-col items-center justify-center space-y-4 text-center p-10">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                                <Globe size={32} />
                            </div>
                            <p className="text-[10px] font-black uppercase text-[#9E9E9E] tracking-[0.3em] max-w-[200px]">En attente de la sélection du pays d'origine</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AcademicStructurePage;
