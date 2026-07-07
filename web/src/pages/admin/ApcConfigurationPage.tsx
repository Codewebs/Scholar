import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { matiereService } from '../../api/matiereService';
import { pedagogyService } from '../../api/pedagogyService';
import api from '../../api/axios';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Users,
  Plus,
  ChevronRight,
  ArrowLeft,
  LayoutGrid,
  Zap,
  BookOpen,
  Layers,
  ShieldCheck,
  CheckCircle2,
  X,
  Trash2,
  Edit2,
  Search,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import {
    MatiereEntity,
    GroupeMatiereEntity,
    RepartitionMatiereEntity,
    CompetenceEntity,
    RepartitionCompetenceEntity,
    SousPeriodeEntity
} from '../../types/pedagogy';

const ApcConfigurationPage: React.FC = () => {
  const { t } = useTranslation();
  const { selectedYear } = useSchoolYear();
  const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;

  // Data States
  const [classes, setClasses] = useState<any[]>([]);
  const [groups, setGroups] = useState<GroupeMatiereEntity[]>([]);
  const [globalMatieres, setGlobalMatieres] = useState<MatiereEntity[]>([]);
  const [globalCompetences, setGlobalCompetences] = useState<CompetenceEntity[]>([]);
  const [sequences, setSequences] = useState<SousPeriodeEntity[]>([]);

  // Selection States
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedMatiere, setSelectedMatiere] = useState<RepartitionMatiereEntity | null>(null);
  const [activeCompetenceId, setActiveCompetenceId] = useState<number | null>(null);
  const [selectedCompetenceIds, setSelectedCompetenceIds] = useState<number[]>([]);
  const [selectedSousPeriodes, setSelectedSousPeriodes] = useState<number[]>([]);

  // Filtered States
  const [repartition, setRepartition] = useState<RepartitionMatiereEntity[]>([]);
  const [repartitionCompetences, setRepartitionCompetences] = useState<RepartitionCompetenceEntity[]>([]);
  const [allYearCompetences, setAllYearCompetences] = useState<any[]>([]); // For cross-filters
  const [manualGroups, setManualGroups] = useState<number[]>([]); // Group IDs selected for this class
  const [block4SequenceFilter, setBlock4SequenceFilter] = useState<number | null>(null);
  const [competenceModalFilter, setCompetenceModalFilter] = useState<'ALL' | 'SAME_SUBJECT' | 'SAME_CLASS' | 'SAME_GROUP' | 'OTHER_GROUPS'>('ALL');

  // Notification State (Soft Modal)
  const [notification, setNotification] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const notify = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
    console.log(`%c[NOTIFICATION] ${type.toUpperCase()}: ${title} - ${message}`, 'background: #222; color: #bada55');
    setNotification({ show: true, title, message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({ show: false, title: '', message: '', onConfirm: () => {}, type: 'info' });

  const confirm = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'warning') => {
    setConfirmConfig({ show: true, title, message, onConfirm, type });
  };

  const toggleSousPeriode = (id: number) => {
    setSelectedSousPeriodes(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAllSequences = () => setSelectedSousPeriodes(sequences.map(s => s.idSousPeriode!));
  const deselectAllSequences = () => setSelectedSousPeriodes([]);

  // UI States
  const [loading, setLoading] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showCompetenceModal, setShowCompetenceModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showGroupLibraryModal, setShowGroupLibraryModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupeMatiereEntity | null>(null);

  // Search/Filters in Modals
  const [subjectSearch, setSubjectSearch] = useState('');
  const [selectedMatieresToAssign, setSelectedMatieresToAssign] = useState<number[]>([]);
  const [newCompetenceLibelle, setNewCompetenceLibelle] = useState('');
  const [matiereCoefs, setMatiereCoefs] = useState<{[key: number]: number}>({});
  const [newGroupLibelle, setNewGroupLibelle] = useState('');

  useEffect(() => {
    if (yearId) {
      loadInitialData();
    }
  }, [yearId]);

  useEffect(() => {
    if (selectedClassId && yearId) {
      console.log("🎯 [APC] Changement de contexte (Classe/Année):", { selectedClassId, yearId });
      loadRepartition();
      loadSequences();
      loadAllYearCompetences(); // Charger toutes les compétences pour les indicateurs visuels (Block 3)
      setSelectedMatiere(null);
      setManualGroups([]); // On réinitialise les groupes ajoutés manuellement lors du changement de classe
    }
  }, [selectedClassId, yearId]);

  useEffect(() => {
    if (selectedMatiere) {
        loadCompetencesForMatiere();
    } else {
        setRepartitionCompetences([]);
    }
  }, [selectedMatiere]);

  useEffect(() => {
      console.log("Repartition Competences Changed:", repartitionCompetences);
  }, [repartitionCompetences]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      const schoolId = localStorage.getItem('school_id');
      const idEtablissement = user.idEtablissement || (schoolId ? parseInt(schoolId) : undefined);

      console.log("--------------------------------------------------");
      console.log("📡 [FRONTEND] 1. Chargement initial", {
        yearId,
        idEtablissement,
        source: user.idEtablissement ? 'user_object' : 'localStorage_school_id'
      });

      const [classesRes, groupsRes, matieresRes, compsRes] = await Promise.all([
        api.get(`/salles/classes/stats/${yearId}`),
        matiereService.getGroups(idEtablissement),
        matiereService.getGlobalLibrary(idEtablissement),
        matiereService.getGlobalCompetencies(idEtablissement)
      ]);

      console.log("✅ [APC] 2. Données reçues:", {
        classes: classesRes.data?.length,
        groups: groupsRes.data?.length,
        matieres: matieresRes.data?.length,
        competences: compsRes.data?.length
      });

      setClasses(classesRes.data);
      setGroups(groupsRes.data);
      setGlobalMatieres(matieresRes.data);
      setGlobalCompetences(compsRes.data);

      if (classesRes.data.length > 0 && !selectedClassId) {
          const firstClassId = classesRes.data[0].idClasse;
          console.log("📍 [APC] 3. Sélection par défaut classe:", firstClassId);
          setSelectedClassId(firstClassId);
          // On n'appelle pas loadRepartition ici, le useEffect s'en chargera via selectedClassId
      }
    } catch (error) {
      console.error("❌ [APC] Erreur Initial Data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRepartition = async () => {
    if (!yearId || !selectedClassId) return;

    console.log("📡 [APC] 4. Chargement Répartition pour Classe:", selectedClassId);

    try {
      const res = await matiereService.getRepartition(yearId, selectedClassId);
      console.log("✅ [APC] 5. Répartition chargée:", res.data?.length, "matières");
      setRepartition(res.data);

      // On déduit les groupes "affectés" de la répartition
      const affectedGroupIds = Array.from(new Set(res.data.map((r: any) => r.idGroupeMatiere).filter(Boolean)));
      console.log("🔍 [APC] 6. Groupes affectés détectés:", affectedGroupIds);

      // Si le groupe actuel n'est plus valide pour cette classe, on change
      if (affectedGroupIds.length > 0) {
          if (!selectedGroupId || !affectedGroupIds.includes(selectedGroupId)) {
              console.log("📍 [APC] 7. Sélection auto du groupe:", affectedGroupIds[0]);
              setSelectedGroupId(affectedGroupIds[0] as number);
          }
      } else {
          // Si aucun groupe n'est affecté, on ne force pas le premier groupe global
          // pour éviter de montrer des matières d'un groupe vide
          // setSelectedGroupId(null); // Optionnel selon le comportement souhaité
      }
    } catch (error) {
      console.error("❌ [APC] Erreur Repartition:", error);
    }
  };

  const loadSequences = async () => {
      if (!yearId || !selectedClassId) return;
      try {
          console.log("📡 [FRONTEND] Chargement des séquences pour la classe:", selectedClassId);
          const res = await pedagogyService.getClassSequences(yearId, selectedClassId);
          setSequences(res.data);
      } catch (error) {
          console.error(error);
      }
  };

  const loadCompetencesForMatiere = async () => {
      const rmId = selectedMatiere?.idRepartitionMatiere;
      if (!rmId) {
          setRepartitionCompetences([]);
          return;
      }

      try {
          const res = await matiereService.getRepartitionCompetences({ repartitionMatiereId: rmId });
          if (res.data && Array.isArray(res.data)) {
              setRepartitionCompetences(res.data);
          } else {
              setRepartitionCompetences([]);
          }
      } catch (error) {
          console.error("❌ Error loading competences:", error);
      }
  };

  const loadAllYearCompetences = async () => {
    if (!yearId) return;
    try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : {};
        const schoolId = localStorage.getItem('school_id');
        const idEtablissement = user.idEtablissement || (schoolId ? parseInt(schoolId) : undefined);

        const res = await matiereService.getRepartitionCompetences({ yearId, idEtablissement });
        setAllYearCompetences(res.data);
    } catch (error) {
        console.error("❌ Error loading year competences:", error);
    }
  };

  const saveRepartition = async () => {
    if (!selectedMatiere || selectedCompetenceIds.length === 0 || selectedSousPeriodes.length === 0) {
        console.warn("⚠️ [APC] Tentative d'enregistrement incomplète:", {
            matiere: selectedMatiere?.Matiere?.libelleFr,
            competences: selectedCompetenceIds.length,
            sequences: selectedSousPeriodes.length
        });
        return;
    }

    setLoading(true);
    console.log("🚀 [APC] DÉBUT ENREGISTREMENT MULTI-COMPÉTENCES", {
        matiereId: selectedMatiere.idRepartitionMatiere,
        competences: selectedCompetenceIds,
        sequences: selectedSousPeriodes
    });

    try {
        // On boucle sur les compétences sélectionnées
        const promises = selectedCompetenceIds.map(compId => {
            const payload = {
                idRepartitionMatiere: selectedMatiere.idRepartitionMatiere,
                idCompetence: compId,
                idSousPeriodes: selectedSousPeriodes
            };
            console.log(`   📡 Envoi requête pour compétence ${compId}:`, payload);
            return matiereService.saveRepartitionCompetence(payload);
        });

        await Promise.all(promises);

        console.log("✅ [APC] Enregistrement réussi pour toutes les compétences");
        notify(t('common.success'), `${selectedCompetenceIds.length} ${t('apc.competencies').toLowerCase()} ${t('common.success').toLowerCase()}.`);

        // Reset & Refresh
        setSelectedCompetenceIds([]);
        setSelectedSousPeriodes([]);
        setActiveCompetenceId(null);
        loadCompetencesForMatiere();
        loadAllYearCompetences();
        setShowCompetenceModal(false);
    } catch (error: any) {
        console.error("❌ [APC] Erreur lors de l'enregistrement:", error);
        notify("Erreur", "Un problème est survenu lors de l'enregistrement.", 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleSaveGroup = async () => {
    if (!newGroupLibelle.trim()) return;
    setLoading(true);
    try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : {};
        const schoolId = localStorage.getItem('school_id');
        const idEtablissement = user.idEtablissement || (schoolId ? parseInt(schoolId) : undefined);

        if (editingGroup) {
            await matiereService.updateGroup(editingGroup.idGroupeMatiere, { libelleFr: newGroupLibelle, idEtablissement });
        } else {
            const res = await matiereService.createGroup({
                libelleFr: newGroupLibelle,
                ordre: groups.length + 1,
                idEtablissement: idEtablissement // On force l'idEtablissement ici
            });
            setManualGroups(prev => [...prev, res.data.idGroupeMatiere]);
        }
        setShowGroupModal(false);
        setNewGroupLibelle('');
        setEditingGroup(null);
        // On rafraîchit avec l'ID de l'établissement
        const groupsRes = await matiereService.getGroups(idEtablissement);
        setGroups(groupsRes.data);
    } catch (error) {
        alert(t('common.error'));
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteGroup = async (id: number) => {
    confirm(
        t('apc.confirm_delete_group'),
        t('apc.confirm_delete_group_desc'),
        async () => {
            setLoading(true);
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                await matiereService.deleteGroup(id);
                const groupsRes = await matiereService.getGroups(user.idEtablissement);
                setGroups(groupsRes.data);
                if (selectedGroupId === id) setSelectedGroupId(groupsRes.data[0]?.idGroupeMatiere || null);
            } catch (error: any) {
                alert(error.response?.data?.error || t('common.error'));
            } finally {
                setLoading(false);
            }
        },
        'danger'
    );
  };

  const handleAddMatieres = async () => {
      if (!yearId || !selectedClassId || selectedMatieresToAssign.length === 0) return;
      setLoading(true);
      try {
          const assignments = selectedMatieresToAssign.map(id => ({
              idMatiere: id,
              idClasse: selectedClassId,
              coef: matiereCoefs[id] || 2,
              idGroupeMatiere: selectedGroupId
          }));
          await matiereService.bulkAssign({ idAnneeScolaire: yearId, idMatiere: null, assignments });
          setShowSubjectModal(false);
          setSelectedMatieresToAssign([]);
          loadRepartition();
      } catch (error) {
          alert(t('common.error'));
      } finally {
          setLoading(false);
      }
  };

  const handleAddCompetence = async (idComp?: number) => {
      if (!selectedMatiere) return;
      setLoading(true);
      console.log("➕ [APC] Ajout/Sélection d'une nouvelle compétence...");

      try {
          let targetId = idComp;
          if (!targetId && newCompetenceLibelle.trim()) {
              const userStr = localStorage.getItem('user');
              const user = userStr ? JSON.parse(userStr) : {};
              const schoolId = localStorage.getItem('school_id');
              const idEtablissement = user.idEtablissement || (schoolId ? parseInt(schoolId) : undefined);

              const payload = {
                libelle: newCompetenceLibelle,
                idEtablissement: idEtablissement
              };
              console.log("   📡 Création compétence en BD:", payload);

              const res = await api.post('/pedagogy/competences', payload);
              console.log("   ✅ Réponse serveur (Création):", res.data);

              targetId = res.data.idCompetence;
              setGlobalCompetences([...globalCompetences, res.data]);
              notify(t('common.success'), `"${newCompetenceLibelle}" ${t('common.success').toLowerCase()}.`);
          }

          if (targetId) {
              if (!selectedCompetenceIds.includes(targetId)) {
                  setSelectedCompetenceIds([...selectedCompetenceIds, targetId]);
                  console.log(`   📌 Compétence ${targetId} ajoutée à la sélection temporaire`);
              }
              setNewCompetenceLibelle('');
          }
      } catch (error: any) {
          console.error("❌ [APC] Erreur ajout compétence:", error);
          notify(t('common.error'), t('common.error'), 'error');
      } finally {
          setLoading(false);
      }
  };

  const removeCompetence = async (id: number) => {
      confirm(
          t('apc.confirm_remove_comp'),
          t('apc.confirm_remove_comp_desc'),
          async () => {
              try {
                  await matiereService.deleteRepartitionCompetence(id);
                  loadCompetencesForMatiere();
              } catch (error) {
                  alert(t('common.error'));
              }
          },
          'danger'
      );
  };

  const filteredLibrary = globalMatieres.filter(m =>
      m.libelleFr.toLowerCase().includes(subjectSearch.toLowerCase()) &&
      !repartition.some(r => r.idMatiere === m.idServeur)
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[40px] shadow-xl border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="flex items-center space-x-6 relative z-10">
            <button onClick={() => window.history.back()} className="p-4 hover:bg-gray-100 rounded-full transition-all bg-gray-50 text-black shadow-sm">
                <ArrowLeft size={28} />
            </button>
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter text-black">{t('apc.title')}</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] mt-2">{t('apc.subtitle')}</p>
            </div>
        </div>

        <div className="flex items-center space-x-4 relative z-10">
            <div className="bg-accent text-white px-6 py-4 rounded-sharp border border-accent/20 flex items-center space-x-3 shadow-xl shadow-accent/20">
                <ShieldCheck size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('apc.expert_mode')}</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Block 1: Classes */}
        <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex flex-col h-[700px]">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                        <Building2 size={20} />
                    </div>
                    <h2 className="font-black uppercase tracking-tight text-black text-sm">1. {t('apc.classes')}</h2>
                </div>
                <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded-full">{classes.length}</span>
            </div>

            <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-2">
                {classes.map(c => (
                    <div
                        key={c.idClasse}
                        onClick={() => {
                            console.log("--------------------------------------------------");
                            console.log("🖱️ [FRONTEND] Clic sur la classe:", { id: c.idClasse, libelle: c.libelleClasseFr });
                            setSelectedClassId(c.idClasse);
                        }}
                        className={clsx(
                            "p-5 rounded-[20px] cursor-pointer transition-all border flex items-center justify-between group",
                            selectedClassId === c.idClasse ? "bg-black border-black text-white shadow-xl scale-[1.02]" : "bg-white border-gray-100 hover:border-gray-300"
                        )}
                    >
                        <div>
                            <p className="font-black uppercase tracking-tight text-xs">{c.libelleClasseFr}</p>
                            <p className={clsx("text-[9px] uppercase tracking-widest font-bold mt-1", selectedClassId === c.idClasse ? "text-gray-400" : "text-[#9E9E9E]")}>{c.cycleLabel}</p>
                        </div>
                        <ChevronRight size={16} className={clsx("transition-transform", selectedClassId === c.idClasse ? "translate-x-1" : "opacity-0 group-hover:opacity-100")} />
                    </div>
                ))}
            </div>
        </div>

        {/* Block 2: Groups */}
        <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex flex-col h-[700px]">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-sm">
                            <Layers size={20} />
                        </div>
                        <h2 className="font-black uppercase tracking-tight text-black text-sm">2. {t('apc.groups')}</h2>
                    </div>
                    <button onClick={() => setShowGroupLibraryModal(true)} className="p-2 bg-orange-600 text-white rounded-full hover:scale-110 active:scale-95 transition-all shadow-md">
                        <PlusCircle size={20}/>
                    </button>
                </div>
                <button
                    onClick={() => setShowGroupLibraryModal(true)}
                    className="w-full py-3 bg-orange-50 text-orange-600 border border-orange-100 rounded-[15px] font-black uppercase text-[8px] tracking-[0.2em] flex items-center justify-center space-x-2 hover:bg-orange-100 transition-all"
                >
                    <PlusCircle size={12}/>
                    <span>{t('apc.manage_library')}</span>
                </button>
            </div>

            <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-2">
                {(() => {
                    const displayedGroups = groups.filter(g =>
                        repartition.some(r => r.idGroupeMatiere === g.idGroupeMatiere) ||
                        manualGroups.includes(g.idGroupeMatiere)
                    );
                    console.log("🖥️ [APC] Groupes affichés dans le Bloc 2:", displayedGroups.map(g => ({ id: g.idGroupeMatiere, libelle: g.libelleFr })));

                    return displayedGroups.map(g => (
                        <div
                            key={g.idGroupeMatiere}
                            onClick={() => setSelectedGroupId(g.idGroupeMatiere)}
                            className={clsx(
                                "p-5 rounded-[20px] cursor-pointer transition-all border flex items-center justify-between group",
                                selectedGroupId === g.idGroupeMatiere ? "bg-orange-600 border-orange-600 text-white shadow-xl scale-[1.02]" : "bg-white border-gray-100 hover:border-gray-300"
                            )}
                        >
                            <div>
                                <p className="font-black uppercase tracking-tight text-xs">{g.libelleFr}</p>
                                <p className={clsx("text-[9px] uppercase tracking-widest font-bold mt-1", selectedGroupId === g.idGroupeMatiere ? "text-orange-200" : "text-[#9E9E9E]")}>ORDRE: {g.ordre}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingGroup(g); setNewGroupLibelle(g.libelleFr); setShowGroupModal(true); }}
                                    className={clsx("p-1 hover:bg-white/20 rounded", selectedGroupId === g.idGroupeMatiere ? "text-white" : "text-gray-400")}
                                >
                                    <Edit2 size={12} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.idGroupeMatiere); }}
                                    className={clsx("p-1 hover:bg-red-500/20 rounded", selectedGroupId === g.idGroupeMatiere ? "text-white" : "text-red-400")}
                                >
                                    <Trash2 size={12} />
                                </button>
                                <span className={clsx("text-[10px] font-black", selectedGroupId === g.idGroupeMatiere ? "text-white" : "text-gray-400")}>
                                    {repartition.filter(r => r.idGroupeMatiere === g.idGroupeMatiere).length}
                                </span>
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    ));
                })()}
            </div>
        </div>

        {/* Block 3: Subjects */}
        <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex flex-col h-[700px]">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shadow-sm">
                            <BookOpen size={20} />
                        </div>
                        <h2 className="font-black uppercase tracking-tight text-black text-sm">3. {t('apc.subjects')}</h2>
                    </div>
                    <button onClick={() => setShowSubjectModal(true)} className="p-2 bg-violet-600 text-white rounded-full hover:scale-110 active:scale-95 transition-all shadow-md">
                        <Plus size={20}/>
                    </button>
                </div>
            </div>

            <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-2">
                {repartition.filter(r => r.idGroupeMatiere === selectedGroupId).length > 0 ? (
                    repartition.filter(r => r.idGroupeMatiere === selectedGroupId).map(rm => {
                        const hasCompetences = allYearCompetences.some(ac => ac.idRepartitionMatiere === rm.idRepartitionMatiere);

                        return (
                            <div
                                key={rm.idRepartitionMatiere}
                                onClick={() => {
                                    console.log(`🔍 [APC] Sélection matière: ${rm.Matiere?.libelleFr}`, rm);
                                    setSelectedMatiere(rm);
                                }}
                                className={clsx(
                                    "p-5 rounded-[20px] cursor-pointer transition-all border relative overflow-hidden group",
                                    selectedMatiere?.idRepartitionMatiere === rm.idRepartitionMatiere
                                        ? "bg-violet-600 border-violet-600 text-white shadow-xl scale-[1.02]"
                                        : !hasCompetences
                                            ? "bg-red-50 border-red-200 text-red-600 hover:border-red-400"
                                            : "bg-white border-gray-100 hover:border-gray-300"
                                )}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-black uppercase tracking-tight text-xs">{rm.Matiere?.libelleFr}</p>
                                    <div className={clsx(
                                        "px-2 py-0.5 rounded-full text-[9px] font-black",
                                        selectedMatiere?.idRepartitionMatiere === rm.idRepartitionMatiere ? "bg-white/20" : "bg-gray-100 text-gray-500"
                                    )}>
                                        COEF: {rm.coef}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <p className={clsx(
                                        "text-[8px] uppercase tracking-widest font-bold",
                                        selectedMatiere?.idRepartitionMatiere === rm.idRepartitionMatiere
                                            ? "text-violet-200"
                                            : !hasCompetences ? "text-red-400" : "text-[#9E9E9E]"
                                    )}>NOTE / {rm.noteSur}</p>
                                    <div className="flex -space-x-1">
                                        {hasCompetences ? (
                                            [1, 2, 3].map(i => (
                                                <div key={i} className={clsx("w-3 h-3 rounded-full border border-white", i === 1 ? "bg-green-500" : "bg-gray-200")}></div>
                                            ))
                                        ) : (
                                            <div className="w-3 h-3 rounded-full border border-white bg-red-400 animate-pulse"></div>
                                        )}
                                    </div>
                                </div>
                                {!hasCompetences && (
                                    <div className="absolute top-0 right-0 p-2">
                                        <AlertCircle size={12} className="text-red-400" />
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-30 p-10">
                        <BookOpen size={48} className="mb-4 text-gray-300" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('apc.no_subject_in_group')}</p>
                    </div>
                )}
            </div>
        </div>

        {/* Block 4: Competencies */}
        <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex flex-col h-[700px]">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shadow-sm">
                            <ShieldCheck size={20} />
                        </div>
                        <h2 className="font-black uppercase tracking-tight text-black text-sm">4. {t('apc.competencies')}</h2>
                    </div>
                    <button
                        disabled={!selectedMatiere}
                        onClick={() => {
                            console.log("🔓 [APC] Ouverture modale compétences pour la matière:", selectedMatiere?.Matiere?.libelleFr);
                            setShowCompetenceModal(true);
                            loadAllYearCompetences();
                        }}
                        className="p-2 bg-green-600 text-white rounded-full hover:scale-110 active:scale-95 transition-all shadow-md disabled:opacity-30"
                    >
                        <Plus size={20}/>
                    </button>
                </div>

                {/* Sequence Filter for Block 4 */}
                <div className="flex items-center space-x-1 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                    <button
                        onClick={() => setBlock4SequenceFilter(null)}
                        className={clsx(
                            "px-3 py-2 rounded-xl text-[8px] font-black uppercase transition-all flex-shrink-0",
                            block4SequenceFilter === null ? "bg-black text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                        )}
                    >
                        {t('apc.all')}
                    </button>
                    {sequences.map(s => {
                        const hasCompetences = repartitionCompetences.some(rc => rc.idSousPeriode === s.idSousPeriode);
                        return (
                            <button
                                key={s.idSousPeriode}
                                onClick={() => setBlock4SequenceFilter(s.idSousPeriode!)}
                                className={clsx(
                                    "px-3 py-2 rounded-xl text-[8px] font-black uppercase transition-all flex-shrink-0 border",
                                    block4SequenceFilter === s.idSousPeriode
                                        ? "bg-green-600 border-green-600 text-white"
                                        : !hasCompetences
                                            ? "bg-orange-50/50 border-orange-200 text-orange-400"
                                            : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100"
                                )}
                            >
                                {t('apc.seq_short')} {s.ordreSousPeriode}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-2">
                {!selectedMatiere ? (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-30 p-10">
                        <ShieldCheck size={48} className="mb-4 text-gray-300" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">{t('apc.select_subject_hint')}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {repartitionCompetences.length > 0 ? (
                            repartitionCompetences
                                .filter(rc => block4SequenceFilter === null || rc.idSousPeriode === block4SequenceFilter)
                                .reduce((acc: RepartitionCompetenceEntity[], current) => {
                                    if (!acc.find(item => String(item.idCompetence) === String(current.idCompetence))) {
                                        acc.push(current);
                                    }
                                    return acc;
                                }, [])
                                .map(rc => (
                                    <div key={rc.id} className="p-4 bg-white border border-gray-100 rounded-[20px] flex items-start gap-4 shadow-sm group hover:border-black transition-all">
                                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                                            <ShieldCheck size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-black">{rc.Competence?.libelle || "Compétence inconnue"}</p>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {repartitionCompetences
                                                    .filter(item => String(item.idCompetence) === String(rc.idCompetence))
                                                    .map(item => {
                                                        const seq = sequences.find(s => String(s.idSousPeriode) === String(item.idSousPeriode));
                                                        return (
                                                            <span
                                                                key={item.id}
                                                                className={clsx(
                                                                    "px-2 py-1 rounded text-[7px] font-black uppercase flex flex-col items-center",
                                                                    block4SequenceFilter === item.idSousPeriode ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500"
                                                                )}
                                                            >
                                                                <span>S{seq?.ordreSousPeriode || '?'}</span>
                                                                {seq?.libelleSousPeriodeFr && (
                                                                    <span className="text-[5px] opacity-70 mt-0.5 whitespace-nowrap">
                                                                        {seq.libelleSousPeriodeFr}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeCompetence(rc.id)}
                                            className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                        ) : (
                            <div className="text-center py-10 opacity-50">
                                <p className="text-[10px] font-black uppercase text-gray-400">Aucune compétence associée</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Subject Library Modal */}
      {showSubjectModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300">
             <div className="w-full max-w-4xl bg-white rounded-[56px] p-12 shadow-2xl relative overflow-hidden border border-gray-100 h-[80vh] flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter text-black">{t('apc.subject_library')}</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] mt-1">{t('apc.add_to_class', { className: classes.find(c => c.idClasse === selectedClassId)?.libelleClasseFr })}</p>
                    </div>
                    <button onClick={() => {
                        console.log("🔓 [APC] Ouverture Bibliothèque des Matières...");
                        setShowSubjectModal(false);
                    }} className="p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <X size={24} />
                    </button>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#9E9E9E]" size={20} />
                    <input
                        type="text"
                        placeholder={t('apc.search_subject')}
                        className="w-full pl-16 pr-8 py-5 bg-gray-50 rounded-[24px] text-xs font-black uppercase tracking-widest outline-none focus:bg-white transition-all border border-transparent focus:border-black"
                        value={subjectSearch}
                        onChange={e => setSubjectSearch(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                    {filteredLibrary.map(m => {
                        const isSelected = selectedMatieresToAssign.includes(m.idServeur!);
                        const isAlreadyInClass = repartition.some(r => r.idMatiere === m.idServeur);

                        return (
                            <div
                                key={m.idServeur}
                                onClick={() => {
                                    if (isAlreadyInClass) {
                                        console.log(`ℹ️ [APC] Matière "${m.libelleFr}" déjà présente dans la classe.`);
                                        return;
                                    }
                                    if (isSelected) setSelectedMatieresToAssign(selectedMatieresToAssign.filter(id => id !== m.idServeur));
                                    else setSelectedMatieresToAssign([...selectedMatieresToAssign, m.idServeur!]);
                                }}
                                className={clsx(
                                    "p-4 border rounded-[24px] cursor-pointer transition-all flex items-center gap-4",
                                    isSelected ? "border-violet-600 bg-violet-50" :
                                    isAlreadyInClass ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed" :
                                    "border-gray-100 hover:border-gray-300"
                                )}
                            >
                                <div className={clsx(
                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                    isSelected ? "bg-violet-600 border-violet-600 text-white" :
                                    isAlreadyInClass ? "bg-gray-200 border-gray-200 text-gray-400" :
                                    "border-gray-200"
                                )}>
                                    {isSelected && <CheckCircle2 size={14} />}
                                    {isAlreadyInClass && <ShieldCheck size={14} />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-black uppercase tracking-tight text-black">{m.libelleFr}</p>
                                    <p className="text-[9px] font-bold text-[#9E9E9E] uppercase tracking-widest">
                                        {isAlreadyInClass ? t('apc.already_registered') : m.codeMatiere}
                                    </p>
                                </div>
                                {isSelected && !isAlreadyInClass && (
                                    <div className="flex items-center space-x-2 bg-white p-2 rounded-xl shadow-sm border border-violet-100">
                                        <span className="text-[8px] font-black text-[#9E9E9E]">COEF:</span>
                                        <input
                                            type="number"
                                            className="w-10 text-center font-black text-xs outline-none"
                                            value={matiereCoefs[m.idServeur!] || 2}
                                            onClick={e => e.stopPropagation()}
                                            onChange={e => setMatiereCoefs({...matiereCoefs, [m.idServeur!]: parseInt(e.target.value)})}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center justify-between pt-8 border-t border-gray-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">{selectedMatieresToAssign.length} {t('apc.subjects').toLowerCase()} sélectionnées</p>
                    <button
                        disabled={selectedMatieresToAssign.length === 0 || loading}
                        onClick={handleAddMatieres}
                        className="bg-black text-white px-12 py-5 rounded-sharp font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                    >
                        {loading ? t('common.loading') : t('apc.save_to_class')}
                    </button>
                </div>
             </div>
          </div>
      )}

      {/* Competence Association Modal */}
      {showCompetenceModal && selectedMatiere && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300">
             <div className="w-full max-w-4xl bg-white rounded-[56px] p-12 shadow-2xl relative overflow-hidden border border-gray-100 h-[85vh] flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter text-black">{t('apc.apc_library')}</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] mt-1">{t('pedagogy.subjects.title').slice(0, -1)}: {selectedMatiere.Matiere?.libelleFr}</p>
                    </div>
                    <button onClick={() => {
                        console.log("🔓 [APC] Ouverture Bibliothèque APC (Compétences)...");
                        setShowCompetenceModal(false);
                    }} className="p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <X size={24} />
                    </button>
                </div>

                {/* MODAL FILTERS */}
                <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                    {[
                        { id: 'ALL', label: t('common.all_classes'), icon: LayoutGrid },
                        { id: 'SAME_SUBJECT', label: 'Même Matière', icon: BookOpen },
                        { id: 'SAME_CLASS', label: 'Même Classe', icon: Building2 },
                        { id: 'SAME_GROUP', label: 'Même Groupe', icon: Layers },
                        { id: 'OTHER_GROUPS', label: 'Autres Groupes', icon: Users }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setCompetenceModalFilter(f.id as any)}
                            className={clsx(
                                "px-4 py-3 rounded-2xl flex items-center space-x-2 transition-all flex-shrink-0 border font-black uppercase text-[9px] tracking-widest",
                                competenceModalFilter === f.id ? "bg-black border-black text-white shadow-lg" : "bg-white border-gray-100 text-gray-400 hover:border-gray-300"
                            )}
                        >
                            <f.icon size={14} />
                            <span>{f.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8">
                    {/* 1. Sélection / Ajout Compétence */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] mb-4 block ml-4">{t('apc.competencies')}</label>

                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    className="flex-1 px-8 py-5 bg-gray-50 rounded-[24px] text-xs font-bold outline-none focus:bg-white transition-all border border-transparent focus:border-green-600"
                                    placeholder={t('apc.new_competency')}
                                    value={newCompetenceLibelle}
                                    onChange={e => setNewCompetenceLibelle(e.target.value)}
                                />
                                <button
                                    onClick={() => handleAddCompetence()}
                                    className="p-5 bg-green-600 text-white rounded-[24px] hover:scale-105 transition-all shadow-lg shadow-green-100"
                                >
                                    <Plus size={24} />
                                </button>
                            </div>

                            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                {globalCompetences
                                    .filter(c => {
                                        if (competenceModalFilter === 'ALL') return true;
                                        const usages = allYearCompetences.filter(u => String(u.idCompetence) === String(c.idCompetence));

                                        if (competenceModalFilter === 'SAME_SUBJECT') return usages.some(u => u.RepartitionMatiere?.idMatiere === selectedMatiere.idMatiere);
                                        if (competenceModalFilter === 'SAME_CLASS') return usages.some(u => u.RepartitionMatiere?.idClasse === selectedClassId);
                                        if (competenceModalFilter === 'SAME_GROUP') return usages.some(u => u.RepartitionMatiere?.idGroupeMatiere === selectedGroupId);
                                        if (competenceModalFilter === 'OTHER_GROUPS') return usages.some(u => u.RepartitionMatiere?.idClasse === selectedClassId && u.RepartitionMatiere?.idGroupeMatiere !== selectedGroupId);

                                        return true;
                                    })
                                    .map(c => {
                                        const isSelected = selectedCompetenceIds.includes(c.idCompetence);
                                        const isUsedInSubject = repartitionCompetences.some(rc => String(rc.idCompetence) === String(c.idCompetence));
                                        const isUsedInCurrentSequences = repartitionCompetences.some(rc =>
                                            String(rc.idCompetence) === String(c.idCompetence) &&
                                            selectedSousPeriodes.includes(rc.idSousPeriode)
                                        );

                                        return (
                                            <button
                                                key={c.idCompetence}
                                                onClick={() => {
                                                    if (isSelected) setSelectedCompetenceIds(selectedCompetenceIds.filter(id => id !== c.idCompetence));
                                                    else setSelectedCompetenceIds([...selectedCompetenceIds, c.idCompetence]);
                                                    console.log(`   🎯 Toggle compétence: ${c.libelle}`, { isSelected: !isSelected });
                                                }}
                                                className={clsx(
                                                    "w-full p-4 border rounded-[20px] transition-all flex items-center justify-between group text-left",
                                                    isSelected
                                                        ? "border-green-600 bg-green-50 shadow-md"
                                                        : isUsedInCurrentSequences
                                                            ? "border-orange-400 bg-orange-50/30"
                                                            : isUsedInSubject
                                                                ? "border-blue-200 bg-blue-50/20"
                                                                : "border-gray-100 bg-white hover:border-green-600"
                                                )}
                                            >
                                                <div className="flex-1 pr-4">
                                                    <p className="text-[11px] font-bold text-gray-700 leading-relaxed">{c.libelle}</p>
                                                    {isUsedInSubject && (
                                                        <span className="text-[7px] font-black uppercase tracking-widest text-blue-500 mt-1 block">{t('apc.already_used')}</span>
                                                    )}
                                                </div>
                                                <div className={clsx(
                                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                                                    isSelected ? "bg-green-600 border-green-600 text-white" : "border-gray-200"
                                                )}>
                                                    {isSelected && <CheckCircle2 size={12} />}
                                                </div>
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-6 px-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">{t('apc.assign_to_sequences')}</label>
                                <div className="space-x-4">
                                    <button onClick={selectAllSequences} className="text-[9px] font-black uppercase text-green-600 hover:underline">{t('apc.all_short')}</button>
                                    <button onClick={deselectAllSequences} className="text-[9px] font-black uppercase text-red-600 hover:underline">{t('apc.none_short')}</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {sequences.map(seq => {
                                    const isAlreadyConfiguredForComp = activeCompetenceId && repartitionCompetences.some(rc =>
                                        String(rc.idCompetence) === String(activeCompetenceId) &&
                                        rc.idSousPeriode === seq.idSousPeriode
                                    );

                                    return (
                                        <button
                                            key={seq.idSousPeriode}
                                            onClick={() => toggleSousPeriode(seq.idSousPeriode!)}
                                            className={clsx(
                                                "p-6 rounded-[24px] text-[10px] font-black uppercase transition-all border flex flex-col items-center justify-center space-y-2",
                                                selectedSousPeriodes.includes(seq.idSousPeriode!)
                                                    ? isAlreadyConfiguredForComp ? "bg-blue-600 border-blue-600 text-white shadow-xl scale-[1.02]" : "bg-green-600 border-green-600 text-white shadow-xl scale-[1.02]"
                                                    : isAlreadyConfiguredForComp ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100"
                                            )}
                                        >
                                            <Zap size={16} />
                                            <span>{t('apc.seq_short')} {seq.ordreSousPeriode}</span>
                                            {isAlreadyConfiguredForComp && (
                                                <span className="text-[6px] font-black opacity-60">Actif</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-8 p-6 bg-blue-50 rounded-[32px] border border-blue-100">
                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                        <Zap size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase text-blue-900 tracking-widest mb-1">{t('apc.guide_title')}</h4>
                                        <p className="text-[9px] font-medium text-blue-700/80 leading-relaxed">
                                            {t('apc.guide_desc')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">
                        {selectedCompetenceIds.length} {t('apc.competencies').toLowerCase()} | {selectedSousPeriodes.length} {t('grades.selection.sequence').toLowerCase()}(s)
                    </p>
                    <button
                        onClick={saveRepartition}
                        disabled={selectedCompetenceIds.length === 0 || selectedSousPeriodes.length === 0}
                        className="bg-black text-white px-12 py-5 rounded-sharp font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-30 shadow-xl"
                    >
                        {loading ? t('common.loading') : t('apc.save_distribution')}
                    </button>
                </div>
             </div>
          </div>
      )}

      {/* Modern Confirmation Modal */}
      {confirmConfig.show && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
              <div className="w-full max-w-sm bg-white rounded-[40px] p-10 shadow-2xl border border-gray-100 text-center">
                  <div className={clsx(
                      "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6",
                      confirmConfig.type === 'danger' ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"
                  )}>
                      {confirmConfig.type === 'danger' ? <Trash2 size={32} /> : <Zap size={32} />}
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-black mb-2">{confirmConfig.title}</h3>
                  <p className="text-xs font-medium text-gray-500 leading-relaxed mb-8">{confirmConfig.message}</p>
                  <div className="flex gap-3">
                      <button
                          onClick={() => setConfirmConfig(prev => ({ ...prev, show: false }))}
                          className="flex-1 py-4 bg-gray-50 text-black rounded-sharp font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 transition-all"
                      >
                          {t('common.cancel')}
                      </button>
                      <button
                          onClick={() => { confirmConfig.onConfirm(); setConfirmConfig(prev => ({ ...prev, show: false })); }}
                          className={clsx(
                              "flex-1 py-4 text-white rounded-sharp font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg",
                              confirmConfig.type === 'danger' ? "bg-red-600 shadow-red-100" : "bg-black shadow-gray-100"
                          )}
                      >
                          {t('common.save')}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Group Management Modal */}
      {showGroupModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300">
             <div className="w-full max-w-md bg-white rounded-[56px] p-12 shadow-2xl relative overflow-hidden border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter text-black">{editingGroup ? t('apc.group_modal.edit') : t('apc.group_modal.new')}</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] mt-1">{t('apc.group_modal.subtitle')}</p>
                    </div>
                    <button onClick={() => setShowGroupModal(false)} className="p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] mb-2 block ml-4">{t('apc.group_modal.label')}</label>
                        <input
                            type="text"
                            className="w-full px-8 py-5 bg-gray-50 rounded-[24px] text-xs font-bold outline-none focus:bg-white transition-all border border-transparent focus:border-orange-600"
                            placeholder="LIBELLÉ..."
                            value={newGroupLibelle}
                            onChange={e => setNewGroupLibelle(e.target.value)}
                        />
                    </div>
                </div>

                <div className="mt-10 pt-8 border-t border-gray-100 flex gap-4">
                    <button
                        onClick={() => setShowGroupModal(false)}
                        className="flex-1 py-5 bg-gray-50 text-black rounded-sharp font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 transition-all"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleSaveGroup}
                        disabled={!newGroupLibelle.trim() || loading}
                        className="flex-1 py-5 bg-orange-600 text-white rounded-sharp font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                    >
                        {loading ? t('common.loading') : t('common.save')}
                    </button>
                </div>
             </div>
          </div>
      )}

      {/* Group Library / Selector Modal */}
      {showGroupLibraryModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300">
             <div className="w-full max-w-2xl bg-white rounded-[56px] p-12 shadow-2xl relative overflow-hidden border border-gray-100 h-[70vh] flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter text-black">{t('apc.group_library.title')}</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] mt-1">{t('apc.group_library.subtitle')}</p>
                    </div>
                    <button onClick={() => setShowGroupLibraryModal(false)} className="p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-3 mb-8">
                    {groups.map(g => {
                        const hasSubjects = repartition.some(r => r.idGroupeMatiere === g.idGroupeMatiere);
                        const isSelected = manualGroups.includes(g.idGroupeMatiere) || hasSubjects;

                        return (
                            <div
                                key={g.idGroupeMatiere}
                                onClick={() => {
                                    if (hasSubjects) return; // Can't "unload" a group that already has subjects
                                    if (isSelected) setManualGroups(manualGroups.filter(id => id !== g.idGroupeMatiere));
                                    else setManualGroups([...manualGroups, g.idGroupeMatiere]);
                                }}
                                className={clsx(
                                    "p-5 border rounded-[24px] cursor-pointer transition-all flex items-center justify-between group",
                                    isSelected ? "border-orange-600 bg-orange-50" : "border-gray-100 hover:border-gray-300"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={clsx(
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                        isSelected ? "bg-orange-600 border-orange-600 text-white" : "border-gray-200"
                                    )}>
                                        {isSelected && <CheckCircle2 size={14} />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-tight text-black">{g.libelleFr}</p>
                                        {hasSubjects && <p className="text-[8px] font-black text-orange-600 uppercase tracking-widest mt-0.5">{t('apc.group_library.active_tag')}</p>}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditingGroup(g); setNewGroupLibelle(g.libelleFr); setShowGroupModal(true); }}
                                        className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-black shadow-sm"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.idGroupeMatiere); }}
                                        className="p-2 hover:bg-red-50 rounded-lg text-red-300 hover:text-red-600 shadow-sm"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center justify-between pt-8 border-t border-gray-100">
                    <button
                        onClick={() => { setEditingGroup(null); setNewGroupLibelle(''); setShowGroupModal(true); }}
                        className="flex items-center space-x-2 text-orange-600 font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform"
                    >
                        <PlusCircle size={18} />
                        <span>{t('apc.group_library.create_new')}</span>
                    </button>
                    <button
                        onClick={() => setShowGroupLibraryModal(false)}
                        className="bg-black text-white px-12 py-5 rounded-sharp font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all"
                    >
                        {t('apc.group_library.finish')}
                    </button>
                </div>
             </div>
          </div>
      )}

      {/* Soft Notification Modal */}
      {notification && (
          <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-top-full duration-500">
              <div className={clsx(
                  "px-8 py-4 rounded-[20px] shadow-2xl flex items-center space-x-4 border backdrop-blur-md",
                  notification.type === 'success' ? "bg-green-500/90 border-green-400 text-white" :
                  notification.type === 'error' ? "bg-red-500/90 border-red-400 text-white" :
                  "bg-black/90 border-gray-700 text-white"
              )}>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      {notification.type === 'success' ? <CheckCircle2 size={18} /> : notification.type === 'error' ? <X size={18} /> : <Zap size={18} />}
                  </div>
                  <div>
                      <p className="text-[10px] font-black uppercase tracking-widest leading-none">{notification.title}</p>
                      <p className="text-[11px] font-bold opacity-80 mt-1">{notification.message}</p>
                  </div>
              </div>
          </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center space-y-4">
             <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
             <p className="font-black uppercase text-[10px] tracking-widest text-black">{t('common.processing')}</p>
        </div>
      )}
    </div>
  );
};

export default ApcConfigurationPage;
