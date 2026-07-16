import React, { useState, useEffect, useMemo } from 'react';
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
  X,
  LogOut
} from 'lucide-react';
import { clsx } from 'clsx';
import ServerConfigModal from '../components/ServerConfigModal';
import { useTranslation } from 'react-i18next';

enum SetupStep {
  LANDING,
  SELECT_LANGUAGE,
  WELCOME,
  SELECT_SCHOOL,
  CREATE_SCHOOL_1,
  CREATE_SCHOOL_2,
  CREATE_SCHOOL_3,
  SELECT_PROFILE,
  SEARCH_CHILD,
  SELECT_YEAR
}

const InitialConfig: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isInitialized, updateUser, logout } = useAuth();
  const { years, fetchYears, selectYear, createYear } = useSchoolYear();
  const [step, setStep] = useState<SetupStep>(SetupStep.LANDING);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Data State
  const [associations, setAssociations] = useState<UserAssociation[]>([]);
  const [language, setLanguage] = useState<'Français' | 'English'>(
    i18n.language.startsWith('fr') ? 'Français' : 'English'
  );
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [selectedMatieres] = useState<string[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<string[]>([]);
  const [tempSelectedYear, setTempSelectedYear] = useState<SchoolYear | null>(null);

  const [childSearchQuery, setChildSearchQuery] = useState('');
  const [foundStudents, setFoundStudents] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any | null>(null);

  const [recruitmentCode, setRecruitmentCode] = useState('');
  const [inscriptionCode, setInscriptionCode] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [isCreatingSchool, setIsCreatingSchool] = useState(false);
  const [isCreatingYear, setIsCreatingYear] = useState(false);

  // School Creation State
  const [newSchool, setNewSchool] = useState<Partial<School>>({
    nomFr: '',
    pays: 'Cameroun',
    ville: '',
    arrete: '',
    codeRecrutement: '',
    telephone1: undefined,
    telephone2: undefined,
    pinSecurite: ''
  });

  const createdSchoolsCount = associations.filter(a => a.school.idCreateur === user?.id).length;
  const isStudentElsewhere = associations.some(a => a.roles.includes('ELEVE') && a.etat === 'VALIDE');

  const displayAssociations = useMemo(() => {
    const map = new Map<number, UserAssociation & { enfants?: string[] }>();
    associations.forEach(assoc => {
      const sId = assoc.school.idServeur || assoc.school.idEtablissement;
      if (sId) {
        if (!map.has(sId)) {
          map.set(sId, {
            ...assoc,
            roles: [...assoc.roles],
            enfants: assoc.enfant ? [`${assoc.enfant.nom} ${assoc.enfant.prenom}`] : []
          });
        } else {
          const existing = map.get(sId)!;
          assoc.roles.forEach(r => {
            if (!existing.roles.includes(r)) existing.roles.push(r);
          });
          if (assoc.enfant) {
              const name = `${assoc.enfant.nom} ${assoc.enfant.prenom}`;
              if (!existing.enfants?.includes(name)) existing.enfants?.push(name);
          }
          if (assoc.etat === 'VALIDE') existing.etat = 'VALIDE';
        }
      }
    });
    return Array.from(map.values());
  }, [associations]);

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
    if (step === SetupStep.CREATE_SCHOOL_1) {
      setStep(SetupStep.WELCOME);
    } else if (step === SetupStep.SELECT_SCHOOL && !isNewUser) {
      setStep(SetupStep.SELECT_LANGUAGE);
    } else if (step === SetupStep.SELECT_YEAR) {
      if (isCreatingSchool) {
        setStep(SetupStep.CREATE_SCHOOL_3);
      } else if (selectedProfile === 'PARENT') {
        setStep(SetupStep.SEARCH_CHILD);
      } else if (availableProfiles.length > 1) {
        setStep(SetupStep.SELECT_PROFILE);
      } else {
        setStep(SetupStep.SELECT_SCHOOL);
      }
    } else if (step === SetupStep.SEARCH_CHILD) {
      setStep(SetupStep.SELECT_SCHOOL);
    } else if (step === SetupStep.SELECT_PROFILE) {
      setStep(SetupStep.SELECT_SCHOOL);
    } else if (step === SetupStep.WELCOME) {
      setStep(SetupStep.SELECT_LANGUAGE);
    } else {
      setStep(prev => prev - 1);
    }
  };

  const handleSearchStudents = async (query: string) => {
    setChildSearchQuery(query);
    const sId = selectedSchool?.idServeur || selectedSchool?.idEtablissement;
    if (query.length < 3 || !sId) return;
    try {
      const res = await setupService.searchStudents(sId, query);
      setFoundStudents(res.data);
    } catch (err) {
      setError(t('common.error'));
    }
  };

  const handleSearchSchools = async (query: string) => {
    if (query.length < 3) return;
    try {
      const res = await setupService.searchSchools(query);
      setSchools(res.data);
    } catch (err) {
      setError(t('common.error'));
    }
  };

  const handleSelectSchool = (school: School) => {
    setError(null);
    const schoolId = school.idServeur || school.idEtablissement;
    const assoc = associations.find(a => (a.school.idServeur || a.school.idEtablissement) === schoolId);

    // --- CONFLICT CHECK ---
    if (assoc) {
        const intent = selectedProfile;
        const isTryingToBeStudentOrParent = intent === 'ELEVE' || intent === 'PARENT';
        const isTryingToBeStaff = intent !== null && !isTryingToBeStudentOrParent;

        const hasStaffRole = assoc.roles.some(r => !['ELEVE', 'PARENT', 'DEMANDEUR', 'SANS_ROLE'].includes(r));
        const hasStudentRole = assoc.roles.includes('ELEVE');
        const hasParentRole = assoc.roles.includes('PARENT');

        let conflictError = null;
        if (intent === 'ELEVE' && hasParentRole) conflictError = "Vous êtes déjà Parent dans cet établissement. Un élève ne peut pas être parent.";
        else if (intent === 'PARENT' && hasStudentRole) conflictError = "Vous êtes déjà Élève dans cet établissement. Un parent ne peut pas être élève.";
        else if (isTryingToBeStudentOrParent && hasStaffRole) conflictError = "Vous êtes membre du personnel dans cet établissement. Accès réservé aux usagers externes.";
        else if (isTryingToBeStaff && (hasStudentRole || hasParentRole)) conflictError = "Vous êtes déjà élève ou parent ici. Un membre du staff ne peut pas être usager.";

        if (conflictError) {
            setError(conflictError);
            return;
        }
    }

    console.log("[Setup] School selected:", school);
    setSelectedSchool(school);
    setIsCreatingSchool(school.idCreateur === user?.id);

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
        { label: t('setup.breadcrumbs.school'), val: isCreatingSchool ? (newSchool.nomFr || 'Nouveau') : selectedSchool?.nomFr },
        { label: t('setup.breadcrumbs.profile'), val: selectedProfile },
        { label: t('setup.breadcrumbs.year'), val: tempSelectedYear?.libelleAnneeScolaire }
    ].filter(s => s.val);
    return steps;
  };


  const handleValidateSchool = async () => {
    if (!selectedSchool) return;
    setLoading(true);
    setError(null);
    const schoolId = selectedSchool.idServeur || selectedSchool.idEtablissement;
    try {
      const schoolAssocs = associations.filter(a => (a.school.idServeur || a.school.idEtablissement) === schoolId);
      const assoc = schoolAssocs.find(a => a.etat === 'VALIDE') || schoolAssocs[0];
      const isParentLinkingNewChild = selectedProfile === 'PARENT' && selectedChild !== null;

      // --- NOUVELLES RESTRICTIONS DE RÔLE ---
      const isTryingToBeStudentOrParent = selectedProfile === 'ELEVE' || selectedProfile === 'PARENT';
      const isTryingToBeStaff = !isTryingToBeStudentOrParent && selectedProfile !== null;

      if (assoc) {
          const hasStaffRole = assoc.roles.some(r => !['ELEVE', 'PARENT', 'DEMANDEUR', 'SANS_ROLE'].includes(r));
          const hasStudentRole = assoc.roles.includes('ELEVE');
          const hasParentRole = assoc.roles.includes('PARENT');

          // 1. Ne peut pas être élève et parent dans le même étab
          if (selectedProfile === 'ELEVE' && hasParentRole) {
              setError("Vous êtes déjà enregistré comme Parent dans cet établissement.");
              setLoading(false); return;
          }
          if (selectedProfile === 'PARENT' && hasStudentRole) {
              setError("Vous êtes déjà enregistré comme Élève dans cet établissement.");
              setLoading(false); return;
          }

          // 2. Ne peut pas être (élève ou parent) ET staff dans le même etab
          if (isTryingToBeStudentOrParent && hasStaffRole) {
              setError("Un membre du personnel ne peut pas s'inscrire comme élève ou parent dans le même établissement.");
              setLoading(false); return;
          }
          if (isTryingToBeStaff && (hasStudentRole || hasParentRole)) {
              setError("Un élève ou parent ne peut pas devenir membre du personnel dans le même établissement.");
              setLoading(false); return;
          }
      }
      // -------------------------------------

      if (assoc?.etat === 'VALIDE' && !isParentLinkingNewChild) {
        if (assoc.roles.length > 1) {
          setAvailableProfiles(assoc.roles);
          setStep(SetupStep.SELECT_PROFILE);
        } else {
          // Double vérification si l'utilisateur tente de rejoindre avec un nouveau rôle
          // alors qu'il a déjà une association valide
          if (selectedProfile && !assoc.roles.includes(selectedProfile)) {
             // Si le profil choisi n'est pas dans ses rôles actuels, il doit soumettre une nouvelle demande
             // mais les restrictions ci-dessus (Staff vs Elève/Parent) bloqueront si nécessaire.
             const isStaff = selectedProfile !== 'ELEVE' && selectedProfile !== 'PARENT';
             const entered = isStaff ? recruitmentCode : inscriptionCode;
             const expected = isStaff ? selectedSchool.codeRecrutement : selectedSchool.codeInscription;

             if (entered !== expected) {
                setError(t('setup.select_school.code_invalide_msg', {
                    defaultValue: `Code ${isStaff ? 'de recrutement' : 'd\'inscription'} invalide`,
                    type: isStaff ? t('setup.select_school.recruitment_code') : t('setup.select_school.inscription_code')
                }));
                setLoading(false); return;
             }

             if (selectedProfile === 'PARENT' && !selectedChild) {
                setStep(SetupStep.SEARCH_CHILD);
                setLoading(false); return;
             }

             await submitDemand();
             return;
          }

          setSelectedProfile(assoc.roles[0]);
          if (schoolId) await fetchYears(schoolId as number);
          setStep(SetupStep.SELECT_YEAR);
        }
      } else if (assoc?.etat === 'EN_ATTENTE' && !isParentLinkingNewChild) {
        setError(t('setup.select_school.demande_en_attente_msg', { defaultValue: "Votre demande est déjà en cours d'étude." }));
      } else if (isCreatingSchool) {
        setSelectedProfile('ADMINISTRATEUR');
        if (schoolId) await fetchYears(schoolId as number);
        setStep(SetupStep.SELECT_YEAR);
      } else {
        // Code verification
        if (selectedProfile === 'PARENT') {
          if (step === SetupStep.SELECT_SCHOOL) {
            if (recruitmentCode !== selectedSchool.pinSecurite) {
              setError("PIN de l'établissement invalide.");
              setLoading(false); return;
            }
            setStep(SetupStep.SEARCH_CHILD);
            setLoading(false); return;
          } else if (step === SetupStep.SEARCH_CHILD) {
            if (!selectedChild) {
              setError("Veuillez sélectionner un enfant.");
              setLoading(false); return;
            }
            const childCode = selectedChild.Inscriptions?.[0]?.codeInscription || selectedChild.codeInscription;
            if (inscriptionCode !== childCode) {
              setError("Code d'inscription de l'élève invalide.");
              setLoading(false); return;
            }
          }
        } else {
          const isStaff = selectedProfile !== 'ELEVE' && selectedProfile !== 'PARENT';
          const entered = isStaff ? recruitmentCode : inscriptionCode;
          const expected = isStaff ? (isStaff ? selectedSchool.codeRecrutement : selectedSchool.codeInscription) : selectedSchool.codeInscription;

          if (entered !== expected) {
            setError(t('setup.select_school.code_invalide_msg', {
              defaultValue: `Code ${isStaff ? 'de recrutement' : 'd\'inscription'} invalide`,
              type: isStaff ? t('setup.select_school.recruitment_code') : t('setup.select_school.inscription_code')
            }));
            setLoading(false);
            return;
          }
        }

        await submitDemand();
      }
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const submitDemand = async () => {
    if (!selectedSchool || !user) return;
    const schoolId = selectedSchool.idServeur || selectedSchool.idEtablissement;

    // Pour le personnel, on envoie le code de recrutement.
    // Pour les usagers (Eleve/Parent), on envoie le code d'inscription.
    const isStaff = selectedProfile !== 'ELEVE' && selectedProfile !== 'PARENT';
    const codeToSend = isStaff ? recruitmentCode : inscriptionCode;

    const payload: DemandeInscriptionPayload = {
        idUtilisateur: user.id,
        idEtablissement: schoolId!,
        profilDemande: selectedProfile || 'ENSEIGNANT',
        nom: user.nom.split(' ')[0],
        prenom: user.nom.split(' ').slice(1).join(' ') || 'User',
        telephone1: 0,
        email: user.email,
        specialites: selectedProfile === 'ENSEIGNANT' ? selectedMatieres.join(',') : null,
        idEleveLinked: selectedChild?.idEleve || null,
        code: codeToSend
    };

    try {
        await setupService.envoyerDemande(payload);
        const res = await setupService.getUserAssociations(user!.id);
        setAssociations(res.data);
        alert("Demande envoyée ! Veuillez attendre la validation de l'administration.");
        setStep(SetupStep.LANDING); // Go back or show a pending screen
    } catch (err) {
        setError(t('common.error'));
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
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchool = async () => {
    if (!newSchool.nomFr || !newSchool.pays || !newSchool.ville || !newSchool.arrete || !newSchool.telephone1 || !newSchool.pinSecurite) {
        setError("Veuillez remplir tous les champs obligatoires.");
        return;
    }
    setLoading(true);
    try {
        const res = await setupService.createSchool({
            ...newSchool,
            idCreateur: user?.id
        });
        setSelectedSchool(res.data);
        const assocRes = await setupService.getUserAssociations(user!.id);
        setAssociations(assocRes.data);
        setStep(SetupStep.SELECT_YEAR);
    } catch (err) {
        setError("Erreur lors de la création de l'établissement.");
    } finally {
        setLoading(false);
    }
  };

  const handleFinish = () => {
    const schoolId = selectedSchool?.idServeur || selectedSchool?.idEtablissement;
    if (schoolId && tempSelectedYear) {
      const assoc = associations.find(a =>
        (a.school.idServeur || a.school.idEtablissement) === schoolId
      );

      if (assoc && updateUser) {
          const finalRole = selectedProfile || assoc.roles[0];
          updateUser({
              role: finalRole,
              permissions: (assoc.permissionsAjoutees || []) as any[]
          });
      }

      selectYear(tempSelectedYear);
      localStorage.setItem('setup_complete', 'true');
      localStorage.setItem('school_id', schoolId.toString());
      navigate('/app/dashboard');
    }
  };

  if (!isInitialized) return null;

  const renderStep = () => {
    switch (step) {
      case SetupStep.LANDING:
        // ... (Already updated)
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 gap-4">
              <div
                onClick={() => {
                    if (isStudentElsewhere) {
                        setError("Les élèves ne peuvent pas créer d'établissement.");
                        return;
                    }
                    if (createdSchoolsCount >= 3) {
                        setError("Limite de 3 établissements atteinte.");
                        return;
                    }
                    setIsCreatingSchool(true);
                    setStep(SetupStep.SELECT_LANGUAGE);
                }}
                className="bg-white p-6 cursor-pointer border-2 border-blue-50 hover:border-blue-500 shadow-sm hover:shadow-blue-100 hover:shadow-xl group transition-all rounded-[24px]"
              >
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-sharp flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-inner">
                  <Plus size={24} />
                </div>
                <h3 className="font-black text-black uppercase text-sm tracking-tight">{t('setup.landing.create_school_title')}</h3>
                <p className="text-[10px] text-[#9E9E9E] font-black uppercase tracking-widest">{t('setup.landing.create_school_subtitle')}</p>
              </div>

              <div
                onClick={() => { setSelectedProfile('ENSEIGNANT'); setIsCreatingSchool(false); setStep(SetupStep.SELECT_LANGUAGE); }}
                className={clsx(
                    "p-6 cursor-pointer border-2 transition-all rounded-[24px] group",
                    selectedProfile === 'ENSEIGNANT'
                      ? "bg-purple-50 border-purple-500 shadow-xl shadow-purple-100"
                      : "bg-white border-purple-50 hover:border-purple-500 shadow-sm"
                )}
              >
                <div className={clsx(
                    "w-12 h-12 rounded-sharp flex items-center justify-center mb-4 transition-colors shadow-inner",
                    selectedProfile === 'ENSEIGNANT' ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white"
                )}>
                  <Users size={24} />
                </div>
                <h3 className="font-black text-black uppercase text-sm tracking-tight">{t('setup.landing.staff_access_title')}</h3>
                <p className={clsx(
                    "text-[10px] font-black uppercase tracking-widest",
                    selectedProfile === 'ENSEIGNANT' ? "text-purple-600" : "text-[#9E9E9E]"
                )}>{t('setup.landing.staff_access_subtitle')}</p>
              </div>

              <div
                onClick={() => { setSelectedProfile('PARENT'); setIsCreatingSchool(false); setStep(SetupStep.SELECT_LANGUAGE); }}
                className="bg-white p-6 cursor-pointer border-2 border-green-50 hover:border-green-500 shadow-sm hover:shadow-green-100 hover:shadow-xl group transition-all rounded-[24px]"
              >
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-sharp flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors shadow-inner">
                  <UserIcon size={24} />
                </div>
                <h3 className="font-black text-black uppercase text-sm tracking-tight">Accès Parent</h3>
                <p className="text-[10px] text-[#9E9E9E] font-black uppercase tracking-widest">Rejoindre en tant que parent</p>
              </div>

              <div
                onClick={() => { setSelectedProfile('ELEVE'); setIsCreatingSchool(false); setStep(SetupStep.SELECT_LANGUAGE); }}
                className="bg-white p-6 cursor-pointer border-2 border-orange-50 hover:border-orange-500 shadow-sm hover:shadow-orange-100 hover:shadow-xl group transition-all rounded-[24px]"
              >
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-sharp flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors shadow-inner">
                  <GraduationCap size={24} />
                </div>
                <h3 className="font-black text-black uppercase text-sm tracking-tight">{t('setup.landing.student_access_title')}</h3>
                <p className="text-[10px] text-[#9E9E9E] font-black uppercase tracking-widest">{t('setup.landing.student_access_subtitle')}</p>
              </div>
            </div>
          </div>
        );

      case SetupStep.SELECT_LANGUAGE:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <h2 className="text-xl font-black uppercase tracking-tight mb-8">{t('setup.language_title')}</h2>
            <div className="space-y-3">
              {(['Français', 'English'] as const).map(lang => (
                <div
                  key={lang}
                  onClick={() => {
                    const lngCode = lang === 'Français' ? 'fr' : 'en';
                    setLanguage(lang);
                    i18n.changeLanguage(lngCode);
                    setStep((isNewUser || isCreatingSchool) ? SetupStep.WELCOME : SetupStep.SELECT_SCHOOL);
                  }}
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
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">{t('setup.welcome_title')}</h2>
              <p className="text-sm text-[#9E9E9E] font-medium max-w-xs mx-auto">
                {t('setup.welcome_subtitle')}
              </p>
            </div>
            <AuthButton onClick={() => setStep(isCreatingSchool ? SetupStep.CREATE_SCHOOL_1 : SetupStep.SELECT_SCHOOL)}>
              {isCreatingSchool ? "Commencer la création" : t('setup.select_school.placeholder')}
            </AuthButton>
          </div>
        );

      case SetupStep.CREATE_SCHOOL_1:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-blue-50 p-6 rounded-[24px] border border-blue-100 mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Etape 1: Informations de base</p>
                <h3 className="text-sm font-black text-black uppercase">Identité de l'établissement</h3>
                <p className="text-[8px] text-blue-400 mt-1 uppercase tracking-tight">Note: L'arrêté de création, le pays et la ville sont obligatoires.</p>
            </div>

            <AuthInput
                label="Nom de l'établissement (Obligatoire) *"
                placeholder="Ex: Lycée Technique de Douala"
                value={newSchool.nomFr}
                onChange={e => setNewSchool({...newSchool, nomFr: e.target.value})}
            />

            <div className="grid grid-cols-2 gap-4">
                <AuthInput
                    label="Pays (Obligatoire) *"
                    value={newSchool.pays}
                    onChange={e => setNewSchool({...newSchool, pays: e.target.value})}
                />
                <AuthInput
                    label="Ville (Obligatoire) *"
                    placeholder="Ex: Yaoundé"
                    value={newSchool.ville}
                    onChange={e => setNewSchool({...newSchool, ville: e.target.value})}
                />
            </div>

            <AuthInput
                label="N° Arrêté de création (Obligatoire) *"
                placeholder="Ex: 123/A/MINESEC du ..."
                value={newSchool.arrete}
                onChange={e => setNewSchool({...newSchool, arrete: e.target.value})}
            />

            <div className="pt-8">
                <AuthButton
                    onClick={() => setStep(SetupStep.CREATE_SCHOOL_2)}
                    disabled={!newSchool.nomFr || !newSchool.pays || !newSchool.ville || !newSchool.arrete}
                >
                    Suivant
                </AuthButton>
            </div>
          </div>
        );

      case SetupStep.CREATE_SCHOOL_2:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-purple-50 p-6 rounded-[24px] border border-purple-100 mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-2">Etape 2: Sécurité et Accès</p>
                <div className="space-y-1">
                    <p className="text-[9px] font-bold text-gray-500 uppercase">{newSchool.nomFr}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">{newSchool.ville}, {newSchool.pays}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <AuthInput
                    label="Code Recrutement Staff *"
                    placeholder="Ex: 1234"
                    value={newSchool.codeRecrutement}
                    onChange={e => setNewSchool({...newSchool, codeRecrutement: e.target.value})}
                    maxLength={10}
                />
            </div>

            <AuthInput
                label="PIN de sécurité (4 chiffres) *"
                placeholder="••••"
                type="password"
                value={newSchool.pinSecurite}
                onChange={e => setNewSchool({...newSchool, pinSecurite: e.target.value.replace(/\D/g, '')})}
                maxLength={4}
            />

            <div className="pt-8 flex gap-4">
                <button
                    onClick={() => setStep(SetupStep.CREATE_SCHOOL_1)}
                    className="flex-1 py-4 bg-gray-50 text-gray-500 font-black uppercase text-[10px] tracking-widest rounded-sharp hover:bg-gray-100 transition-all"
                >
                    Retour
                </button>
                <AuthButton
                    onClick={() => setStep(SetupStep.CREATE_SCHOOL_3)}
                    disabled={!newSchool.codeRecrutement || newSchool.pinSecurite?.length !== 4}
                >
                    Suivant
                </AuthButton>
            </div>
          </div>
        );

      case SetupStep.CREATE_SCHOOL_3:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-green-50 p-6 rounded-[24px] border border-green-100 mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-2">Etape 3: Contact et Validation</p>
                <div className="space-y-2">
                    <p className="text-xs font-black text-black uppercase">{newSchool.nomFr}</p>
                    <div className="flex gap-4">
                        <span className="text-[8px] font-bold text-gray-500 uppercase">PIN: ****</span>
                        <span className="text-[8px] font-bold text-gray-500 uppercase">CODE STAFF: {newSchool.codeRecrutement}</span>
                    </div>
                </div>
            </div>

            <AuthInput
                label="Téléphone Principal *"
                placeholder="Ex: 6XXXXXXXX"
                type="number"
                value={newSchool.telephone1}
                onChange={e => setNewSchool({...newSchool, telephone1: e.target.value ? parseInt(e.target.value) : undefined})}
            />

            <AuthInput
                label="Téléphone Secondaire (Optionnel)"
                placeholder="Ex: 6XXXXXXXX"
                type="number"
                value={newSchool.telephone2}
                onChange={e => setNewSchool({...newSchool, telephone2: e.target.value ? parseInt(e.target.value) : undefined})}
            />

            <div className="pt-8 flex gap-4">
                <button
                    onClick={() => setStep(SetupStep.CREATE_SCHOOL_2)}
                    className="flex-1 py-4 bg-gray-50 text-gray-500 font-black uppercase text-[10px] tracking-widest rounded-sharp hover:bg-gray-100 transition-all"
                >
                    Retour
                </button>
                <AuthButton
                    onClick={handleCreateSchool}
                    disabled={!newSchool.telephone1 || loading}
                >
                    {loading ? "Création en cours..." : "Créer l'établissement"}
                </AuthButton>
            </div>
          </div>
        );

      case SetupStep.SELECT_SCHOOL:
        const schoolId = selectedSchool?.idServeur || selectedSchool?.idEtablissement;
        const schoolAssocs = schoolId ? associations.filter(a => (a.school.idServeur || a.school.idEtablissement) === schoolId) : [];
        const currentAssoc = schoolAssocs.find(a => a.etat === 'VALIDE') || schoolAssocs[0];
        const isAlreadyValidated = currentAssoc?.etat === 'VALIDE';

        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <AuthInput
              label={t('setup.select_school.placeholder')}
              placeholder={t('setup.select_school.hint')}
              onChange={(e) => handleSearchSchools(e.target.value)}
            />

            <div className="space-y-6 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar p-1">
              {/* 1. Show existing associations (Recrutements ou demandes) */}
              {displayAssociations.length > 0 && schools.length === 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent ml-1 flex items-center gap-2">
                    <ShieldCheck size={12} /> {t('setup.select_school.my_schools')}
                  </p>
                  {displayAssociations.map((assoc, index) => {
                    const school = assoc.school;
                    const sId = school.idServeur || school.idEtablissement;
                    const selectedSId = selectedSchool?.idServeur || selectedSchool?.idEtablissement;

                    const intent = selectedProfile;
                    const isTryingToBeStudentOrParent = intent === 'ELEVE' || intent === 'PARENT';
                    const isTryingToBeStaff = intent !== null && !isTryingToBeStudentOrParent;
                    const hasStaffRole = assoc.roles.some(r => !['ELEVE', 'PARENT', 'DEMANDEUR', 'SANS_ROLE'].includes(r));
                    const hasStudentRole = assoc.roles.includes('ELEVE');
                    const hasParentRole = assoc.roles.includes('PARENT');

                    const isConflicting = (intent === 'ELEVE' && hasParentRole) ||
                                         (intent === 'PARENT' && hasStudentRole) ||
                                         (isTryingToBeStudentOrParent && hasStaffRole) ||
                                         (isTryingToBeStaff && (hasStudentRole || hasParentRole));

                    return (
                      <div
                        key={`assoc-${sId}-${index}`}
                        onClick={() => {
                            if (isConflicting) {
                                setError("Accès impossible en raison d'un conflit de rôle dans cet établissement.");
                                return;
                            }
                            handleSelectSchool(school);
                            // On réinitialise les codes quand on change d'école
                            setInscriptionCode('');
                            setRecruitmentCode('');
                        }}
                        className={clsx(
                          "p-5 border-2 rounded-[20px] cursor-pointer transition-all flex items-center justify-between",
                          isConflicting ? "opacity-50 grayscale cursor-not-allowed border-red-50" :
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
                          {/* Affichage des rôles actuels pour aider l'utilisateur */}
                          {assoc.etat === 'VALIDE' && (
                              <p className="text-[7px] font-bold text-accent uppercase mt-1">
                                  {isConflicting ? "CONFLIT DE RÔLE" : `Rôles: ${assoc.roles.join(', ')}`}
                              </p>
                          )}
                          {/* Affichage des enfants pour les parents */}
                          {(assoc as any).enfants && (assoc as any).enfants.length > 0 && (
                             <div className="mt-2 flex flex-wrap gap-1">
                                {(assoc as any).enfants.map((name: string, i: number) => (
                                   <span key={i} className="text-[7px] bg-gray-100 px-1.5 py-0.5 rounded-full font-bold text-gray-500 uppercase tracking-tight">
                                      {name}
                                   </span>
                                ))}
                             </div>
                          )}
                        </div>
                        {selectedSId === sId && <CheckCircle2 size={18} className="text-black" />}
                        {isConflicting && <X size={18} className="text-red-500" />}
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
                    {t('setup.select_school.search_results')}
                  </p>
                  {schools.map((school, index) => {
                    const sId = school.idServeur || school.idEtablissement;
                    const assoc = associations.find(a => (a.school.idServeur || a.school.idEtablissement) === sId);
                    const selectedSId = selectedSchool?.idServeur || selectedSchool?.idEtablissement;

                    const intent = selectedProfile;
                    const isTryingToBeStudentOrParent = intent === 'ELEVE' || intent === 'PARENT';
                    const isTryingToBeStaff = intent !== null && !isTryingToBeStudentOrParent;
                    const hasStaffRole = assoc?.roles.some(r => !['ELEVE', 'PARENT', 'DEMANDEUR', 'SANS_ROLE'].includes(r));
                    const hasStudentRole = assoc?.roles.includes('ELEVE');
                    const hasParentRole = assoc?.roles.includes('PARENT');

                    const isConflicting = assoc && ((intent === 'ELEVE' && hasParentRole) ||
                                         (intent === 'PARENT' && hasStudentRole) ||
                                         (isTryingToBeStudentOrParent && hasStaffRole) ||
                                         (isTryingToBeStaff && (hasStudentRole || hasParentRole)));

                    return (
                      <div
                        key={`search-${sId}-${index}`}
                        onClick={() => {
                            if (isConflicting) {
                                setError("Conflit de rôle : Vous êtes déjà enregistré avec un profil incompatible dans cette école.");
                                return;
                            }
                            handleSelectSchool(school);
                        }}
                        className={clsx(
                          "p-5 border-2 rounded-[20px] cursor-pointer transition-all flex items-center justify-between",
                          isConflicting ? "opacity-50 grayscale cursor-not-allowed border-red-50" :
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
                          {isConflicting && (
                              <p className="text-[7px] font-bold text-red-500 uppercase mt-1">Accès bloqué : Conflit de rôle</p>
                          )}
                        </div>
                        {selectedSId === sId && <CheckCircle2 size={18} className="text-black" />}
                        {isConflicting && <X size={18} className="text-red-500" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {schools.length === 0 && associations.length === 0 && (
                <div className="text-center py-10 opacity-40">
                  <Search size={40} className="mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">{t('setup.select_school.no_school_found')}</p>
                </div>
              )}
            </div>

            {selectedSchool && !isCreatingSchool && !isAlreadyValidated && currentAssoc?.etat !== 'EN_ATTENTE' && (
              <div className="pt-4 animate-in fade-in duration-300">
                 <AuthInput
                   label={
                     selectedProfile === 'ELEVE'
                       ? t('setup.select_school.inscription_code')
                       : (selectedProfile === 'PARENT' ? "PIN de l'établissement" : t('setup.select_school.recruitment_code'))
                   }
                   placeholder={selectedProfile === 'PARENT' ? "4 chiffres (ex: 1234)" : t('setup.select_school.code_placeholder')}
                   value={selectedProfile === 'ELEVE' ? inscriptionCode : recruitmentCode}
                   onChange={(e) => selectedProfile === 'ELEVE' ? setInscriptionCode(e.target.value) : setRecruitmentCode(e.target.value)}
                   maxLength={selectedProfile === 'PARENT' ? 4 : undefined}
                 />
              </div>
            )}

            <div className="pt-8 space-y-3">
              <AuthButton
                onClick={handleValidateSchool}
                disabled={!selectedSchool || loading}
              >
                {loading ? t('common.loading') :
                 currentAssoc?.etat === 'EN_ATTENTE' ? t('setup.select_school.demande_en_attente_msg', { defaultValue: "Demande en attente" }) :
                 isAlreadyValidated ? (selectedProfile === 'PARENT' ? "Continuer vers l'espace parent" : t('common.success')) : t('setup.select_school.confirm_button')}
              </AuthButton>

              {selectedProfile === 'PARENT' && selectedSchool && (isAlreadyValidated || currentAssoc?.etat === 'EN_ATTENTE') && (
                <button
                  onClick={() => setStep(SetupStep.SEARCH_CHILD)}
                  className="w-full py-4 bg-gray-50 text-black font-black uppercase text-[10px] tracking-widest rounded-sharp hover:bg-gray-100 transition-all border border-gray-100 flex items-center justify-center gap-2"
                >
                  <Plus size={14} />
                  Lier un autre enfant
                </button>
              )}
            </div>
          </div>
        );

      case SetupStep.SELECT_PROFILE:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <h2 className="text-xl font-black uppercase tracking-tight mb-8">{t('setup.profile.title')}</h2>
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
                 {t('setup.profile.confirm_button')}
               </AuthButton>
            </div>
          </div>
        );

      case SetupStep.SEARCH_CHILD:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-green-50 p-6 rounded-[24px] border border-green-100 mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-2">Liaison Parent-Enfant</p>
                <h3 className="text-sm font-black text-black uppercase">Trouver votre enfant</h3>
                <p className="text-[8px] text-green-400 mt-1 uppercase tracking-tight">Recherchez l'élève par son nom complet.</p>
            </div>

            <AuthInput
              label="Nom de l'enfant"
              placeholder="Ex: Jean Dupont"
              value={childSearchQuery}
              onChange={(e) => handleSearchStudents(e.target.value)}
            />

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar p-1">
              {foundStudents.map((student, index) => (
                <div
                  key={`student-${student.idEleve}-${index}`}
                  onClick={() => setSelectedChild(student)}
                  className={clsx(
                    "p-4 border-2 rounded-[20px] cursor-pointer transition-all flex items-center justify-between",
                    selectedChild?.idEleve === student.idEleve
                      ? "border-green-500 bg-green-50 shadow-lg"
                      : "border-gray-100 bg-white hover:border-green-200"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                        <GraduationCap size={20} />
                    </div>
                    <div>
                      <h4 className="font-black uppercase text-[10px] tracking-tight">{student.nom} {student.prenom}</h4>
                      <p className="text-[8px] text-[#9E9E9E] font-bold uppercase">Matricule: {student.matricule || 'N/A'}</p>
                    </div>
                  </div>
                  {selectedChild?.idEleve === student.idEleve && <CheckCircle2 size={18} className="text-green-600" />}
                </div>
              ))}
              {childSearchQuery.length >= 3 && foundStudents.length === 0 && (
                <p className="text-center text-[10px] font-bold text-gray-400 uppercase py-4">Aucun élève trouvé</p>
              )}
            </div>

            {selectedChild && (
                <div className="pt-4 animate-in fade-in duration-300">
                    <AuthInput
                        label="Code d'inscription de l'enfant"
                        placeholder="Disponible sur le reçu d'inscription"
                        value={inscriptionCode}
                        onChange={(e) => setInscriptionCode(e.target.value)}
                    />
                </div>
            )}

            <div className="pt-8">
              <AuthButton
                onClick={handleValidateSchool}
                disabled={!selectedChild || (selectedProfile === 'PARENT' && !inscriptionCode) || loading}
              >
                {loading ? t('common.loading') : "Confirmer et lier"}
              </AuthButton>
            </div>
          </div>
        );

      case SetupStep.SELECT_YEAR:
        const activeYears = years.filter(y => !y.cloturerAnnee);
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black uppercase tracking-tight leading-none">{t('setup.year.active_title')}</h2>
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
                    <h3 className="font-black uppercase text-xs tracking-widest text-secondary">{t('setup.year.new_title')}</h3>
                    <button onClick={() => setIsCreatingYear(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X size={18}/></button>
                  </div>
                  <AuthInput label={t('setup.year.label')} value={newYearLabel} onChange={e => setNewYearLabel(e.target.value)} />
                  <div className="grid grid-cols-2 gap-4">
                    <AuthInput label={t('setup.year.start')} type="date" value={newYearStart} onChange={e => setNewYearStart(e.target.value)} />
                    <AuthInput label={t('setup.year.end')} type="date" value={newYearEnd} onChange={e => setNewYearEnd(e.target.value)} />
                  </div>
                  <AuthButton onClick={handleCreateYear} disabled={loading}>
                    {loading ? t('common.loading') : t('setup.year.create_button')}
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
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">{t('setup.select_school.no_school_found')}</p>
                        {isCreatingSchool && (
                          <button
                            onClick={() => setIsCreatingYear(true)}
                            className="px-8 py-3 border border-border rounded-sharp font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all active:scale-95"
                          >
                            {t('setup.year.create_button')}
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
                    {t('setup.year.finish_button')}
                  </AuthButton>
               </div>
             )}
          </div>
        );

      default:
        return null;
    }
  };

  const videoBg = "https://assets.mixkit.co/videos/preview/mixkit-unrecognizable-student-taking-notes-in-a-notebook-42790-large.mp4";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src={videoBg} type="video/mp4" />
      </video>
      <div className="absolute top-0 left-0 w-full h-full bg-black/40 z-[1]"></div>

      <button
        onClick={() => logout?.()}
        className="absolute top-8 left-8 p-4 bg-white rounded-soft shadow-xl border border-gray-100 group transition-all active:scale-95 z-20 flex items-center space-x-2"
      >
        <LogOut size={20} className="text-red-500" />
        <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Déconnexion</span>
      </button>

      <button
        onClick={() => setIsConfigOpen(true)}
        className="absolute top-8 right-8 p-4 bg-white rounded-soft shadow-xl border border-gray-100 group transition-all active:scale-95 z-20"
      >
        <Globe size={20} className="text-accent group-hover:rotate-12 transition-transform" />
      </button>

      <div className="w-full max-w-[450px] bg-white min-h-[750px] p-10 rounded-[32px] shadow-2xl flex flex-col relative overflow-hidden z-10">
        <div className="flex justify-between items-center mb-12 relative z-10">
          <button
            onClick={step === SetupStep.LANDING ? () => navigate(-1) : prevStep}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft size={24} className="text-black" />
          </button>

          <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-black bg-gray-100 px-4 py-1.5 rounded-full mb-2">
                {(() => {
                  const creationFlow = [0, 1, 2, 4, 5, 6, 9];
                  const joinFlow = [0, 1];
                  if (isNewUser) joinFlow.push(2);
                  joinFlow.push(3);
                  if (selectedProfile === 'PARENT') joinFlow.push(8);
                  if (availableProfiles.length > 1) joinFlow.push(7);
                  joinFlow.push(9);
                  const flow = isCreatingSchool ? creationFlow : joinFlow;
                  const idx = flow.indexOf(step);
                  return t('setup.step_info', { current: idx + 1, total: flow.length });
                })()}
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
              {t('setup.title')}
            </h1>
            <p className="text-lg text-[#9E9E9E] font-medium leading-tight">
              {t('setup.subtitle')}
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
