import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { pedagogyService } from '../../api/pedagogyService';
import { studentService } from '../../api/studentService';
import api from '../../api/axios';
import {
  Building2,
  Users,
  Plus,
  ChevronRight,
  ArrowLeft,
  LayoutGrid,
  Zap,
  DoorOpen,
  Edit2,
  Trash2,
  X,
  Save
} from 'lucide-react';
import { clsx } from 'clsx';
import AuthInput from '../../components/ui/AuthInput';
import AuthButton from '../../components/ui/AuthButton';

interface ClasseStat {
    idClasse: number;
    nomClasse: string;
    libelleClasseFr?: string;
    effectif: number;
    capacite: number;
    nbSalles: number;
    roomCount?: number;
    totalEnrolled?: number;
    totalCapacity?: number;
    enseignementLabel?: string;
    cycleLabel?: string;
    idCycle?: number;
    abreviation?: string;
}

interface Cycle {
    idCycle: number;
    libelleCycle: string;
}

const ClasseManagementPage: React.FC = () => {
  const { selectedYear } = useSchoolYear();
  const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;

  const [stats, setStats] = useState<ClasseStat[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [sequenceCount, setSequenceCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentClasse, setCurrentClasse] = useState<Partial<ClasseStat>>({
    nomClasse: '',
    idCycle: undefined,
    abreviation: '',
    capacite: 0
  });

  useEffect(() => {
    if (yearId) {
      loadData();
    }
  }, [yearId]);

  useEffect(() => {
    if (selectedClassId && yearId) {
      loadRoomsForClass(selectedClassId);
    }
  }, [selectedClassId, yearId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, cyclesRes] = await Promise.all([
        api.get(`/salles/classes/stats/${yearId}`),
        pedagogyService.getStructure(yearId!) // To get cycles info from structure
      ]);

      const normalizedStats: ClasseStat[] = statsRes.data.map((item: any) => ({
        ...item,
        nomClasse: item.libelleClasseFr || item.nomClasse || item.libelleClasseEn || item.libelleClasseEs || 'Classe',
        effectif: item.totalEnrolled ?? item.effectif ?? 0,
        capacite: item.totalCapacity ?? item.capacite ?? 0,
        nbSalles: item.roomCount ?? item.nbSalles ?? 0,
        enseignementLabel: item.enseignementLabel || item.enseignement || item.enseignementFr || 'N/A',
        cycleLabel: item.cycleLabel || item.libelleCycle || item.cycle || 'N/A'
      }));

      setStats(normalizedStats);
      if (!selectedClassId && normalizedStats.length > 0) {
        setSelectedClassId(normalizedStats[0].idClasse);
      }

      // Extract all cycles from structure
      const allCycles: Cycle[] = [];
      cyclesRes.data.forEach((ens: any) => {
          ens.cycles?.forEach((cyc: any) => {
              allCycles.push({
                  idCycle: cyc.idCycle,
                  libelleCycle: cyc.libelleCycle || cyc.libelleCycleFr
              });
          });
      });
      setCycles(allCycles);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoomsForClass = async (classId: number) => {
    if (!yearId) return;
    try {
      const [roomsRes, sequencesRes] = await Promise.all([
        studentService.getRooms(yearId),
        pedagogyService.getClassSequences(yearId!, classId)
      ]);

      setRooms(roomsRes.data.filter((room: any) => room.idClasse === classId));
      setSequenceCount(sequencesRes.data.length);
    } catch (error) {
      console.error("Erreur chargement salles ou séquences :", error);
      setRooms([]);
      setSequenceCount(0);
    }
  };

  const handleSelectClass = async (classId: number) => {
    setSelectedClassId(classId);
    await loadRoomsForClass(classId);
  };

  const selectedClass = stats.find(item => item.idClasse === selectedClassId) || stats[0] || null;

  const handleDelete = async (id: number) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette classe ?")) {
      setLoading(true);
      try {
        await pedagogyService.deleteClasse(id);
        loadData();
      } catch (error) {
        alert("Erreur lors de la suppression");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentClasse({ nomClasse: '', idCycle: cycles[0]?.idCycle, abreviation: '', capacite: 50 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (classe: ClasseStat) => {
    setIsEditing(true);
    setCurrentClasse({
        idClasse: classe.idClasse,
        nomClasse: classe.nomClasse,
        idCycle: classe.idCycle,
        abreviation: classe.abreviation,
        capacite: classe.capacite
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        libelleClasseFr: currentClasse.nomClasse,
        idCycle: currentClasse.idCycle,
        abreviation: currentClasse.abreviation,
        capacite: currentClasse.capacite
      };

      if (isEditing && currentClasse.idClasse) {
        await pedagogyService.updateClasse(currentClasse.idClasse, payload);
      } else {
        await pedagogyService.createClasse(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      alert("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[40px] shadow-xl border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

        <div className="flex items-center space-x-6 relative z-10">
            <button onClick={() => window.history.back()} className="p-4 hover:bg-gray-100 rounded-full transition-all bg-gray-50 text-black shadow-sm">
                <ArrowLeft size={28} />
            </button>
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter text-black">Classes & Salles</h1>
                <div className="flex items-center space-x-3 mt-2">
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center">
                        <Zap size={12} className="mr-1.5" /> Live Statistics
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">Effectifs de l'année {selectedYear?.libelleAnneeScolaire}</p>
                </div>
            </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-green-600 text-white py-4 px-10 rounded-sharp flex items-center space-x-3 shadow-2xl shadow-green-100 hover:scale-105 active:scale-95 transition-all font-black uppercase text-xs tracking-[0.2em]"
        >
          <Plus size={20} />
          <span>Nouvelle Classe</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.85fr] gap-3">
        <div className="grid grid-cols-1 gap-2">
          {stats.map((item, idx) => {
            const isActive = selectedClassId === item.idClasse;
            return (
              <div
                key={item.idClasse}
                onClick={() => handleSelectClass(item.idClasse)}
                className={clsx(
                  "bg-white border rounded-[20px] p-2 transition-all shadow-sm overflow-hidden relative cursor-pointer",
                  isActive ? "border-black shadow-md" : "border-gray-100 hover:border-black hover:shadow-sm"
                )}
              >
                 <div className={clsx(
                     "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full transition-all",
                     idx % 3 === 0 ? "bg-accent" : idx % 3 === 1 ? "bg-red-500" : "bg-green-600"
                 )}></div>

                 <div className="flex justify-between items-start mb-2">
                    <div className={clsx(
                        "w-8 h-8 rounded-[12px] flex items-center justify-center text-white transition-all shadow-sm",
                        idx % 3 === 0 ? "bg-accent shadow-violet-100" : idx % 3 === 1 ? "bg-red-500 shadow-red-100" : "bg-green-600 shadow-green-100"
                    )}>
                       <DoorOpen size={16} />
                    </div>
                    <div className="flex items-center space-x-1">
                       <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }}
                        className="p-1 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-black transition-all"
                       >
                         <Edit2 size={12} />
                       </button>
                       <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.idClasse); }}
                        className="p-1 hover:bg-red-50 rounded-lg text-red-300 hover:text-red-600 transition-all"
                       >
                         <Trash2 size={12} />
                       </button>
                    </div>
                 </div>

                 <h3 className="text-sm font-black uppercase tracking-tight text-black mb-2">{item.nomClasse}</h3>

                 <div className="space-y-1 mb-2">
                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-[0.12em]">
                       <span className="text-black flex items-center">
                          <Users size={10} className="mr-1 text-gray-400" /> Élèves
                       </span>
                       <span className="text-black">{item.effectif}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden p-0.5 border border-gray-100">
                       <div
                         className={clsx(
                             "h-full rounded-full transition-all duration-1000",
                             idx % 3 === 0 ? "bg-accent" : idx % 3 === 1 ? "bg-red-500" : "bg-green-600"
                         )}
                         style={{ width: `${Math.min(100, (item.effectif / (item.capacite || 100)) * 100)}%` }}
                       />
                    </div>
                 </div>

                 <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-50">
                    <div className="flex items-center space-x-1">
                       <div className="w-6 h-6 rounded-sharp bg-gray-50 flex items-center justify-center text-black font-black text-[9px]">
                          {item.nbSalles}
                       </div>
                       <span className="text-[8px] font-black text-black uppercase tracking-[0.2em]">Salles</span>
                    </div>
                    <div className="flex items-center space-x-1">
                       <div className="w-6 h-6 rounded-sharp bg-gray-50 flex items-center justify-center text-black font-black text-[9px]">
                          {item.capacite || '--'}
                       </div>
                       <span className="text-[8px] font-black text-black uppercase tracking-[0.2em]">Capacité</span>
                    </div>
                 </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <div className="bg-white border border-gray-100 rounded-[20px] p-2 shadow-sm">
            <div className="flex flex-col gap-2 mb-2">
              <div>
                <p className="text-[7px] font-black uppercase tracking-[0.35em] text-[#9E9E9E]">Classe sélectionnée</p>
                <h2 className="text-lg font-black uppercase tracking-tight text-black mt-1">{selectedClass ? selectedClass.nomClasse : 'Aucune classe'}</h2>
                {selectedClass && (
                  <p className="text-[10px] text-gray-600 mt-1">
                    Enseignement : <span className="font-black text-black text-[10px]">{selectedClass.enseignementLabel || 'N/A'}</span> · Cycle : <span className="font-black text-black text-[10px]">{selectedClass.cycleLabel || 'N/A'}</span>
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-[7px] font-black uppercase tracking-[0.35em] text-[#9E9E9E]">Sous-périodes</span>
                <p className="text-xl font-black text-black mt-0.5">{sequenceCount}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[8px] uppercase tracking-[0.2em] font-black text-[#9E9E9E]">
              <div className="bg-gray-50 rounded-[18px] p-2">
                <p className="text-black text-base font-black">{selectedClass?.nbSalles ?? 0}</p>
                <p>Salles</p>
              </div>
              <div className="bg-gray-50 rounded-[18px] p-2">
                <p className="text-black text-base font-black">{selectedClass?.effectif ?? 0}</p>
                <p>Élèves totaux</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-[20px] p-2 shadow-sm">
            <h3 className="text-[9px] font-black uppercase tracking-[0.35em] mb-2 text-[#9E9E9E]">Salles de la classe</h3>
            <div className="space-y-1.5">
              {rooms.length > 0 ? rooms.map(room => (
                <div key={room.idSalle} className="border border-gray-100 rounded-[18px] p-2 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div>
                      <p className="text-xs font-black uppercase text-black">{room.classeLabel} {room.nomSalle}</p>
                      <p className="text-[8px] uppercase tracking-[0.3em] text-[#9E9E9E]">{room.classeLabel} • {room.nomSalle}</p>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500">{room.capacite || '–'} p</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[8px] uppercase tracking-[0.2em] font-black text-[#9E9E9E]">
                    <div className="bg-gray-50 rounded-[16px] p-1.5">
                      <p className="text-black text-sm font-black">{room.elevesInscrits || 0}</p>
                      <p>Élèves</p>
                    </div>
                    <div className="bg-gray-50 rounded-[16px] p-1.5">
                      <p className="text-black text-sm font-black">{room.capacite || 0}</p>
                      <p>Capacité</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="border border-dashed border-gray-200 rounded-[18px] p-3 text-center text-[#9E9E9E]">
                  <p className="font-black uppercase tracking-[0.3em] text-[8px]">Sélectionnez une classe</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {!loading && stats.length === 0 && (
          <div className="p-32 text-center border-4 border-dashed border-gray-50 rounded-[56px] bg-white/50">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <LayoutGrid size={48} className="text-gray-200" />
              </div>
              <h3 className="text-2xl font-black uppercase text-black mb-3">Aucune classe définie</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#9E9E9E]">Commencez par configurer votre structure académique</p>
          </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center space-y-4">
             <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="font-black uppercase text-[10px] tracking-widest text-black">Mise à jour...</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="w-full max-w-xl bg-white rounded-[56px] p-16 shadow-2xl relative overflow-hidden border border-gray-100">
              <div className="absolute top-0 left-0 w-full h-2 bg-green-600"></div>

              <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                <X size={24} />
              </button>

              <div className="flex items-center space-x-4 text-green-600 mb-4">
                  <DoorOpen size={28} />
                  <span className="text-[11px] font-black uppercase tracking-[0.5em]">Configuration Classe</span>
              </div>

              <h2 className="text-4xl font-black uppercase tracking-tighter text-black mb-10">
                {isEditing ? "Modifier Classe" : "Nouvelle Classe"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] ml-4">Cycle d'appartenance</label>
                    <select
                        className="w-full px-8 py-6 bg-gray-50 border border-transparent rounded-[24px] text-sm font-bold focus:bg-white focus:border-green-600 transition-all outline-none shadow-inner appearance-none"
                        value={currentClasse.idCycle}
                        onChange={(e) => setCurrentClasse({...currentClasse, idCycle: parseInt(e.target.value)})}
                        required
                    >
                        {cycles.map(c => (
                            <option key={c.idCycle} value={c.idCycle}>{c.libelleCycle}</option>
                        ))}
                    </select>
                </div>

                <AuthInput
                  label="Nom de la classe (ex: Terminale C1)"
                  value={currentClasse.nomClasse}
                  onChange={e => setCurrentClasse({...currentClasse, nomClasse: e.target.value})}
                  placeholder="NOM COMPLET"
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AuthInput
                        label="Abréviation"
                        value={currentClasse.abreviation}
                        onChange={e => setCurrentClasse({...currentClasse, abreviation: e.target.value.toUpperCase()})}
                        placeholder="EX: Tle C1"
                    />
                    <AuthInput
                        label="Capacité max."
                        type="number"
                        value={currentClasse.capacite}
                        onChange={e => setCurrentClasse({...currentClasse, capacite: parseInt(e.target.value)})}
                    />
                </div>

                <div className="pt-8">
                  <AuthButton type="submit" disabled={loading}>
                    <div className="flex items-center justify-center space-x-3">
                        <Save size={20} />
                        <span>{isEditing ? "Enregistrer les modifications" : "Créer la classe"}</span>
                    </div>
                  </AuthButton>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default ClasseManagementPage;
