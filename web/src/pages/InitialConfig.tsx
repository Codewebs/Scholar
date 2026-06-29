import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSchoolYear } from '../context/SchoolYearContext';
import { setupService, UserAssociation, DemandeInscriptionPayload } from '../api/setupService';
import { School, SchoolYear } from '../types/models';
import AuthButton from '../components/ui/AuthButton';
import AuthInput from '../components/ui/AuthInput';
import {
  ArrowLeft,
  Plus,
  Users,
  GraduationCap,
  Globe,
  CheckCircle2,
  School as SchoolIcon,
  ShieldCheck,
  Search,
  Check,
  Calendar,
  User as UserIcon,
  X
} from 'lucide-react';
import { clsx } from 'clsx';
import ServerConfigModal from '../components/ServerConfigModal';

enum SetupStep { LANDING, SELECT_LANGUAGE, WELCOME, SELECT_SCHOOL, SELECT_PROFILE, SELECT_YEAR, SECURITY_PIN }

const InitialConfig: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isInitialized, updateUser } = useAuth();
  const { years, fetchYears, selectYear, createYear } = useSchoolYear();
  const [step, setStep] = useState<SetupStep>(SetupStep.LANDING);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Data State
  const [associations, setAssociations] = useState<UserAssociation[]>([]);
  const [language, setLanguage] = useState<'Français' | 'English'>('Français');
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [selectedMatieres] = useState<string[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<string[]>([]);
  const [tempSelectedYear, setTempSelectedYear] = useState<SchoolYear | null>(null);

  const [recruitmentCode, setRecruitmentCode] = useState('');
  const [inscriptionCode, setInscriptionCode] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [isCreatingSchool, setIsCreatingSchool] = useState(false);
  const [isCreatingYear, setIsCreatingYear] = useState(false);

  // Year Creation Form State
  const [newYearLabel, setNewYearLabel] = useState('');
  const [newYearStart, setNewYearStart] = useState('');
  const [newYearEnd, setNewYearEnd] = useState('');

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isInitialized, navigate]);

  useEffect(() => {
    if (user?.id) {
      loadInitialData();
    }
  }, [user]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const res = await setupService.getUserAssociations(user!.id);
      setAssociations(res.data);
      setIsNewUser(res.data.length === 0);
    } catch (err) {
      setIsNewUser(true);
    } finally {
      setLoading(false);
    }
  };

  const prevStep = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleSearchSchools = async (query: string) => {
    if (query.length < 3) return;
    try {
      const res = await setupService.searchSchools(query);
      setSchools(res.data);
    } catch (err) {
      setError("Erreur lors de la recherche");
    }
  };

  const handleSelectSchool = (school: School) => {
    console.log("[Setup] School selected:", school);
    setSelectedSchool(school);
    setIsCreatingSchool(school.idCreateur === user?.id);

    const schoolId = school.idServeur || school.idEtablissement;
    const assoc = associations.find(a => (a.school.idServeur || a.school.idEtablissement) === schoolId);
    console.log("[Setup] Association for school:", assoc);
    if (assoc && assoc.etat === 'VALIDE') {
      if (assoc.roles.length === 1) {
        setSelectedProfile(assoc.roles[0]);
      } else {
        setAvailableProfiles(assoc.roles);
      }
    }
  };

  useEffect(() => {
    const schoolId = selectedSchool?.idServeur || selectedSchool?.idEtablissement;
    if (step === SetupStep.SELECT_YEAR && schoolId) {
        console.log("[Setup] Entering SELECT_YEAR step. Fetching years for schoolId:", schoolId);
        fetchYears(schoolId);
    }
  }, [step, selectedSchool, fetchYears]);

  const getBreadcrumbs = () => {
    const steps = [
        { label: 'École', val: selectedSchool?.nomFr },
        { label: 'Profil', val: selectedProfile },
        { label: 'Année', val: tempSelectedYear?.libelleAnneeScolaire }
    ].filter(s => s.val);
    return steps;
  };


  const handleValidateSchool = async () => {
    if (!selectedSchool) return;
    setLoading(true);
    setError(null);
    const schoolId = selectedSchool.idServeur || selectedSchool.idEtablissement;
    try {
      const assoc = associations.find(a => (a.school.idServeur || a.school.idEtablissement) === schoolId);

      if (assoc?.etat === 'VALIDE') {
        if (assoc.roles.length > 1) {
          setAvailableProfiles(assoc.roles);
          setStep(SetupStep.SELECT_PROFILE);
        } else {
          setSelectedProfile(assoc.roles[0]);
          if (schoolId) await fetchYears(schoolId as number);
          setStep(SetupStep.SELECT_YEAR);
        }
      } else if (assoc?.etat === 'EN_ATTENTE') {
        setError("Votre demande est déjà en cours d'étude.");
      } else if (isCreatingSchool) {
        setSelectedProfile('ADMINISTRATEUR');
        if (schoolId) await fetchYears(schoolId as number);
        setStep(SetupStep.SELECT_YEAR);
      } else {
        // Code verification
        const isStaff = selectedProfile !== 'ELEVE';
        const entered = isStaff ? recruitmentCode : inscriptionCode;
        const expected = isStaff ? selectedSchool.codeRecrutement : selectedSchool.codeInscription;

        if (entered !== expected) {
          setError(`Code ${isStaff ? 'de recrutement' : 'd\'inscription'} invalide`);
          setLoading(false);
          return;
        }

        await submitDemand();
      }
    } catch (err) {
      setError("Erreur de validation");
    } finally {
      setLoading(false);
    }
  };

  const submitDemand = async () => {
    if (!selectedSchool || !user) return;
    const schoolId = selectedSchool.idServeur || selectedSchool.idEtablissement;
    const payload: DemandeInscriptionPayload = {
        idUtilisateur: user.id,
        idEtablissement: schoolId!,
        profilDemande: selectedProfile || 'ENSEIGNANT',
        nom: user.nom.split(' ')[0],
        prenom: user.nom.split(' ').slice(1).join(' ') || 'User',
        telephone1: 0,
        email: user.email,
        specialites: selectedProfile === 'ENSEIGNANT' ? selectedMatieres.join(',') : null
    };

    try {
        await setupService.envoyerDemande(payload);
        const res = await setupService.getUserAssociations(user!.id);
        setAssociations(res.data);
        alert("Demande envoyée avec succès !");
    } catch (err) {
        setError("Échec de l'envoi de la demande");
    }
  };

  const handleCreateYear = async () => {
    const schoolId = selectedSchool?.idServeur || selectedSchool?.idEtablissement;
    if (!schoolId || !newYearLabel || !newYearStart || !newYearEnd) return;
    setLoading(true);
    try {
      await createYear({
        libelleAnneeScolaire: newYearLabel,
        dateDebut: newYearStart,
        dateFin: newYearEnd,
        cloturerAnnee: false
      }, schoolId);
      setIsCreatingYear(false);
      // reset form
      setNewYearLabel('');
      setNewYearStart('');
      setNewYearEnd('');
    } catch (err) {
      setError("Erreur lors de la création de l'année");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    const schoolId = selectedSchool?.idServeur || selectedSchool?.idEtablissement;
    if (schoolId && tempSelectedYear) {
      // Mettre à jour les permissions et le rôle de l'utilisateur pour cette école
      const assoc = associations.find(a =>
        (a.school.idServeur || a.school.idEtablissement) === schoolId
      );

      if (assoc && updateUser) {
          const finalRole = selectedProfile || assoc.roles[0];
          console.log(`[InitialConfig] 🎯 Finishing setup: Role=${finalRole}, PermsCount=${assoc.permissionsAjoutees?.length || 0}`);
          updateUser({
              role: finalRole,
              permissions: (assoc.permissionsAjoutees || []) as any[]
          });
      }

      selectYear(tempSelectedYear); // Persistent selection
      localStorage.setItem('setup_complete', 'true');
      localStorage.setItem('school_id', schoolId.toString());
      navigate('/app/dashboard');
    }
  };

  if (!isInitialized) return null;

  const renderStep = () => {
    switch (step) {
      case SetupStep.LANDING:
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 gap-4">
              <div
                onClick={() => { setIsCreatingSchool(true); setStep(SetupStep.SELECT_LANGUAGE); }}
                className="bg-white p-6 cursor-pointer border-2 border-blue-50 hover:border-blue-500 shadow-sm hover:shadow-blue-100 hover:shadow-xl group transition-all rounded-[24px]"
              >
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-sharp flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-inner">
                  <Plus size={24} />
                </div>
                <h3 className="font-black text-black uppercase text-sm tracking-tight">Créer un établissement</h3>
                <p className="text-[10px] text-[#9E9E9E] font-black uppercase tracking-widest">Nouvelle intégration</p>
              </div>

              <div
                onClick={() => { setSelectedProfile('ENSEIGNANT'); setStep(SetupStep.SELECT_LANGUAGE); }}
                className="bg-white p-6 cursor-pointer border-2 border-purple-50 hover:border-purple-500 shadow-sm hover:shadow-purple-100 hover:shadow-xl group transition-all rounded-[24px]"
              >
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-sharp flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-inner">
                  <Users size={24} />
                </div>
                <h3 className="font-black text-black uppercase text-sm tracking-tight">Rejoindre le personnel</h3>
                <p className="text-[10px] text-[#9E9E9E] font-black uppercase tracking-widest">Enseignant / Administratif</p>
              </div>

              <div
                onClick={() => { setSelectedProfile('ELEVE'); setStep(SetupStep.SELECT_LANGUAGE); }}
                className="bg-white p-6 cursor-pointer border-2 border-orange-50 hover:border-orange-500 shadow-sm hover:shadow-orange-100 hover:shadow-xl group transition-all rounded-[24px]"
              >
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-sharp flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors shadow-inner">
                  <GraduationCap size={24} />
                </div>
                <h3 className="font-black text-black uppercase text-sm tracking-tight">Accès Élève / Parent</h3>
                <p className="text-[10px] text-[#9E9E9E] font-black uppercase tracking-widest">Consulter les notes & frais</p>
              </div>
            </div>
          </div>
        );

      case SetupStep.SELECT_LANGUAGE:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <h2 className="text-xl font-black uppercase tracking-tight mb-8">Langue du portail</h2>
            <div className="space-y-3">
              {(['Français', 'English'] as const).map(lang => (
                <div
                  key={lang}
                  onClick={() => { setLanguage(lang); setStep(isNewUser ? SetupStep.WELCOME : SetupStep.SELECT_SCHOOL); }}
                  className={clsx(
                    "p-5 border-2 rounded-soft cursor-pointer transition-all flex items-center justify-between",
                    language === lang ? "border-black bg-gray-50" : "border-gray-100 hover:border-gray-200"
                  )}
                >
                  <div className="flex items-center space-x-4">
                    <Globe size={20} className={language === lang ? "text-accent" : "text-gray-300"} />
                    <span className="font-black text-sm uppercase tracking-widest">{lang}</span>
                  </div>
                  {language === lang && <CheckCircle2 size={20} className="text-black" />}
                </div>
              ))}
            </div>
          </div>
        );

      case SetupStep.WELCOME:
        return (
          <div className="text-center py-8 space-y-12 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-black text-white rounded-full flex items-center justify-center mx-auto shadow-xl">
               <SchoolIcon size={40} />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Bienvenue sur Scholar</h2>
              <p className="text-sm text-[#9E9E9E] font-medium max-w-xs mx-auto">
                Prêt à numériser la gestion de votre établissement en toute simplicité ?
              </p>
            </div>
            <AuthButton onClick={() => setStep(SetupStep.SELECT_SCHOOL)}>
              Rechercher mon école
            </AuthButton>
          </div>
        );

      case SetupStep.SELECT_SCHOOL:
        const schoolId = selectedSchool?.idServeur || selectedSchool?.idEtablissement;
        const currentAssoc = schoolId ? associations.find(a => (a.school.idServeur || a.school.idEtablissement) === schoolId) : null;
        const isAlreadyValidated = currentAssoc?.etat === 'VALIDE';

        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <AuthInput
              label="Rechercher mon établissement"
              placeholder="Ex: Lycée Classique..."
              onChange={(e) => handleSearchSchools(e.target.value)}
            />

            <div className="space-y-6 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar p-1">
              {/* 1. Show existing associations (Recrutements ou demandes) */}
              {associations.length > 0 && schools.length === 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent ml-1 flex items-center gap-2">
                    <ShieldCheck size={12} /> Mes établissements
                  </p>
                  {associations.map((assoc, index) => {
                    const school = assoc.school;
                    const sId = school.idServeur || school.idEtablissement;
                    const selectedSId = selectedSchool?.idServeur || selectedSchool?.idEtablissement;
                    return (
                      <div
                        key={`assoc-${sId}-${index}`}
                        onClick={() => handleSelectSchool(school)}
                        className={clsx(
                          "p-5 border-2 rounded-[20px] cursor-pointer transition-all flex items-center justify-between",
                          selectedSId === sId
                            ? "border-accent bg-accent/5 shadow-xl shadow-accent/10 -translate-y-1"
                            : "border-gray-100 bg-white shadow-sm hover:border-accent/30 hover:shadow-md"
                        )}
                      >
                        <div>
                          <h4 className="font-black uppercase text-xs tracking-tight">{school.nomFr}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-[9px] text-[#9E9E9E] font-black uppercase tracking-widest">{school.ville}</p>
                            <span className={clsx(
                              "text-[8px] px-2 py-0.5 rounded-full font-black uppercase",
                              assoc.etat === 'VALIDE' ? "bg-green-100 text-green-700" :
                              assoc.etat === 'EN_ATTENTE' ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                            )}>
                              {assoc.etat.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        {selectedSId === sId && <CheckCircle2 size={18} className="text-black" />}
                      </div>
                    );
                  })}
                  <div className="h-px bg-gray-100 my-4" />
                </div>
              )}

              {/* 2. Show search results */}
              {schools.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] ml-1">
                    Résultats de la recherche
                  </p>
                  {schools.map((school, index) => {
                    const sId = school.idServeur || school.idEtablissement;
                    const assoc = associations.find(a => (a.school.idServeur || a.school.idEtablissement) === sId);
                    const selectedSId = selectedSchool?.idServeur || selectedSchool?.idEtablissement;

                    return (
                      <div
                        key={`search-${sId}-${index}`}
                        onClick={() => handleSelectSchool(school)}
                        className={clsx(
                          "p-5 border-2 rounded-[20px] cursor-pointer transition-all flex items-center justify-between",
                          selectedSId === sId
                            ? "border-accent bg-accent/5 shadow-xl shadow-accent/10 -translate-y-1"
                            : "border-gray-100 bg-white shadow-sm hover:border-accent/30 hover:shadow-md"
                        )}
                      >
                        <div>
                          <h4 className="font-black uppercase text-xs tracking-tight">{school.nomFr}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-[9px] text-[#9E9E9E] font-black uppercase tracking-widest">{school.ville}</p>
                            {assoc && (
                              <span className={clsx(
                                "text-[8px] px-2 py-0.5 rounded-full font-black uppercase",
                                assoc.etat === 'VALIDE' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                              )}>
                                {assoc.etat.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedSId === sId && <CheckCircle2 size={18} className="text-black" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {schools.length === 0 && associations.length === 0 && (
                <div className="text-center py-10 opacity-40">
                  <Search size={40} className="mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Recherchez une école pour commencer</p>
                </div>
              )}
            </div>

            {selectedSchool && !isCreatingSchool && !isAlreadyValidated && currentAssoc?.etat !== 'EN_ATTENTE' && (
              <div className="pt-4 animate-in fade-in duration-300">
                 <AuthInput
                   label={selectedProfile === 'ELEVE' ? "Code d'inscription" : "Code de recrutement"}
                   placeholder="Code à 4 chiffres"
                   value={selectedProfile === 'ELEVE' ? inscriptionCode : recruitmentCode}
                   onChange={(e) => selectedProfile === 'ELEVE' ? setInscriptionCode(e.target.value) : setRecruitmentCode(e.target.value)}
                 />
              </div>
            )}

            <div className="pt-8">
              <AuthButton
                onClick={handleValidateSchool}
                disabled={!selectedSchool || loading || currentAssoc?.etat === 'EN_ATTENTE'}
              >
                {loading ? "Vérification..." :
                 currentAssoc?.etat === 'EN_ATTENTE' ? "Demande en attente" :
                 isAlreadyValidated ? "Continuer" : "Confirmer l'Établissement"}
              </AuthButton>
            </div>
          </div>
        );

      case SetupStep.SELECT_PROFILE:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <h2 className="text-xl font-black uppercase tracking-tight mb-8">Choisissez un Profil</h2>
            <div className="space-y-3">
              {availableProfiles.map(profile => (
                <div
                  key={profile}
                  onClick={() => setSelectedProfile(profile)}
                  className={clsx(
                    "p-5 border-2 rounded-[20px] cursor-pointer transition-all flex items-center justify-between",
                    selectedProfile === profile
                        ? "border-accent bg-accent/5 shadow-xl shadow-accent/10 -translate-y-1"
                        : "border-gray-100 bg-white shadow-sm hover:border-accent/30 hover:shadow-md"
                  )}
                >
                   <div className="flex items-center space-x-4">
                    <div className={clsx("p-2 rounded-sharp", selectedProfile === profile ? "bg-accent text-white" : "bg-gray-100 text-gray-400")}>
                      <UserIcon size={20} />
                    </div>
                    <span className="font-black text-sm uppercase tracking-widest">{profile}</span>
                  </div>
                  {selectedProfile === profile && <CheckCircle2 size={20} className="text-accent" />}
                </div>
              ))}
            </div>
            <div className="pt-12">
               <AuthButton onClick={async () => {
                  const sId = selectedSchool?.idServeur || selectedSchool?.idEtablissement;
                  if (sId) {
                    await fetchYears(sId);
                    setStep(SetupStep.SELECT_YEAR);
                  }
               }} disabled={!selectedProfile}>
                 Confirmer le Profil
               </AuthButton>
            </div>
          </div>
        );

      case SetupStep.SELECT_YEAR:
        const activeYears = years.filter(y => !y.cloturerAnnee);
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black uppercase tracking-tight leading-none">Année Scolaire Active</h2>
                {isCreatingSchool && (
                  <button
                    onClick={() => setIsCreatingYear(true)}
                    className="w-10 h-10 bg-black text-white rounded-sharp hover:opacity-90 transition-all flex items-center justify-center shadow-lg active:scale-95"
                  >
                    <Plus size={20} />
                  </button>
                )}
             </div>

             {isCreatingYear ? (
               <div className="space-y-6 animate-in slide-in-from-top-2 duration-300 bg-white p-8 border-2 border-black rounded-[32px] shadow-2xl relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black uppercase text-xs tracking-widest text-secondary">Nouvelle Année</h3>
                    <button onClick={() => setIsCreatingYear(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X size={18}/></button>
                  </div>
                  <AuthInput label="Libellé (ex: 2024-2025)" value={newYearLabel} onChange={e => setNewYearLabel(e.target.value)} />
                  <div className="grid grid-cols-2 gap-4">
                    <AuthInput label="Date Début" type="date" value={newYearStart} onChange={e => setNewYearStart(e.target.value)} />
                    <AuthInput label="Date Fin" type="date" value={newYearEnd} onChange={e => setNewYearEnd(e.target.value)} />
                  </div>
                  <AuthButton onClick={handleCreateYear} disabled={loading}>
                    {loading ? "Création..." : "Créer l'année"}
                  </AuthButton>
               </div>
             ) : (
               <div className="space-y-3">
                 <div className="p-4 border-2 border-dashed border-gray-100 rounded-[32px] min-h-[200px] flex flex-col items-center justify-center bg-gray-50/20">
                   {activeYears.length > 0 ? (
                     <div className="w-full space-y-3 p-2">
                        {activeYears.map((year, index) => {
                          const yId = year.idServeur || year.idAnneeScolaire;
                          const tempYId = tempSelectedYear?.idServeur || tempSelectedYear?.idAnneeScolaire;
                          return (
                            <div
                              key={`${yId}-${index}`}
                              onClick={() => setTempSelectedYear(year)}
                              className={clsx(
                                "p-5 border-2 rounded-[20px] cursor-pointer transition-all flex items-center justify-between",
                                tempYId === yId
                                    ? "border-accent bg-accent/5 shadow-xl shadow-accent/10 -translate-y-1"
                                    : "border-gray-100 bg-white shadow-sm hover:border-accent/30"
                              )}
                            >
                              <div className="flex items-center space-x-4">
                                <Calendar size={20} className={tempYId === yId ? "text-accent" : "text-gray-300"} />
                                <div>
                                   <p className="font-black text-sm uppercase tracking-widest">{year.libelleAnneeScolaire}</p>
                                   <p className="text-[10px] text-[#9E9E9E] font-bold uppercase tracking-tight">{year.dateDebut} — {year.dateFin}</p>
                                </div>
                              </div>
                              {tempYId === yId && <Check size={20} className="text-accent" />}
                            </div>
                          );
                        })}
                     </div>
                   ) : (
                     <div className="text-center space-y-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">Aucune année configurée</p>
                        {isCreatingSchool && (
                          <button
                            onClick={() => setIsCreatingYear(true)}
                            className="px-8 py-3 border border-border rounded-sharp font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all active:scale-95"
                          >
                            Créer la première année
                          </button>
                        )}
                     </div>
                   )}
                 </div>
               </div>
             )}

             {!isCreatingYear && (
               <div className="pt-12">
                  <AuthButton onClick={handleFinish} disabled={!tempSelectedYear}>
                    Terminer la Configuration
                  </AuthButton>
               </div>
             )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#9E9E9E] flex items-center justify-center p-4 font-sans relative">
      <button
        onClick={() => setIsConfigOpen(true)}
        className="absolute top-8 right-8 p-4 bg-white rounded-soft shadow-xl border border-gray-100 group transition-all active:scale-95 z-20"
      >
        <Globe size={20} className="text-accent group-hover:rotate-12 transition-transform" />
      </button>

      <div className="w-full max-w-[450px] bg-white min-h-[750px] p-10 rounded-[32px] shadow-2xl flex flex-col relative overflow-hidden">
        <div className="flex justify-between items-center mb-12 relative z-10">
          <button
            onClick={step === SetupStep.LANDING ? () => navigate(-1) : prevStep}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft size={24} className="text-black" />
          </button>

          <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-black bg-gray-100 px-4 py-1.5 rounded-full mb-2">
                Étape {step + 1}/7
              </span>
              <div className="flex gap-1">
                {getBreadcrumbs().map((b, i) => (
                    <span key={b.label} className="text-[8px] font-bold uppercase tracking-widest text-gray-400">
                        {b.label}: {b.val?.substring(0, 5)} {i < getBreadcrumbs().length - 1 ? '>' : ''}
                    </span>
                ))}
              </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col relative z-10">
          <div className="mb-10">
            <h1 className="text-4xl font-black text-black mb-2 uppercase tracking-tighter leading-none">
              Setup Flow.
            </h1>
            <p className="text-lg text-[#9E9E9E] font-medium leading-tight">
              Finalisez ces étapes pour commencer.
            </p>
          </div>

          <div className="flex-1">
            {renderStep()}
          </div>
        </div>

        {error && (
          <div className="absolute bottom-28 left-10 right-10 bg-black text-white p-4 rounded-sharp flex items-center space-x-3 animate-in slide-in-from-bottom-2 z-20">
            <ShieldCheck size={20} className="text-accent" />
            <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
          </div>
        )}

        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-accent opacity-[0.03] rounded-full blur-3xl pointer-events-none"></div>
      </div>

      <ServerConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </div>
  );
};

export default InitialConfig;
