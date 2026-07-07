import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { staffService, PersonnelEntity, DemandeInscription } from '../../api/staffService';
import { AcademicPermission } from '../../types/permissions';
import {
    ArrowLeft,
    Check,
    X,
    ShieldCheck,
    Mail,
    Phone,
    MoreVertical,
    Search,
    Clock,
    Zap,
    Lock,
    Unlock,
    Shield,
    BadgeCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import { PermissionGrouping } from '../../components/admin/PermissionGrouping';
import AuthInput from '../../components/ui/AuthInput';
import AuthButton from '../../components/ui/AuthButton';
import { useTranslation } from 'react-i18next';

export const permissionGroups = {
    "Dashboard & Statistiques": [
        AcademicPermission.DASHBOARD_ETABLISSEMENT,
        AcademicPermission.ACADEMIC_STATS,
        AcademicPermission.SUMMARY,
        AcademicPermission.NEW_OLD_EFFECTIVE,
        AcademicPermission.CYCLE_EFFECTIVE_HISTOGRAM,
        AcademicPermission.ROOM_EFFECTIVE,
        AcademicPermission.GLOBAL_TUITION_STATUS
    ],
    "Gestion Académique - Structures": [
        AcademicPermission.MANAGE_CYCLES,
        AcademicPermission.MANAGE_LEVELS,
        AcademicPermission.MANAGE_STREAMS,
        AcademicPermission.MANAGE_CLASSES,
        AcademicPermission.MANAGE_ROOMS,
        AcademicPermission.MANAGE_NEIGHBORHOODS,
        AcademicPermission.MANAGE_ACADEMIC_CONFIG
    ],
    "Gestion Académique - Calendrier": [
        AcademicPermission.MANAGE_PERIODS,
        AcademicPermission.MANAGE_SUB_PERIODS,
        AcademicPermission.MANAGE_TERMS,
        AcademicPermission.MANAGE_SEQUENCES,
        AcademicPermission.MANAGE_MONTHS
    ],
    "Gestion Académique - Année": [
        AcademicPermission.REGISTER_SCHOOL_YEAR,
        AcademicPermission.ENROLL_SCHOOL_YEAR,
        AcademicPermission.EDIT_SCHOOL_YEAR_INFO,
        AcademicPermission.UNENROLL_SCHOOL_YEAR,
        AcademicPermission.PRINT_SCHOOL_YEAR_INFO,
        AcademicPermission.COLLECT_SCHOOL_YEAR_INFO,
        AcademicPermission.COLLECT_ALL_SCHOOL_YEARS_INFO,
        AcademicPermission.VIEW_SCHOOL_YEAR_INFO
    ],
    "Gestion des Élèves - Inscriptions": [
        AcademicPermission.REGISTER_STUDENT,
        AcademicPermission.ENROLL_STUDENT,
        AcademicPermission.EDIT_STUDENT_INFO,
        AcademicPermission.UNENROLL_STUDENT,
        AcademicPermission.IMPORT_STUDENTS
    ],
    "Gestion des Élèves - Suivi": [
        AcademicPermission.STUDENT_DOSSIER,
        AcademicPermission.VIEW_STUDENT_LIST,
        AcademicPermission.PRINT_STUDENT_INFO,
        AcademicPermission.PRINT_STUDENT_CARDS,
        AcademicPermission.PRINT_STUDENT_CARD,
        AcademicPermission.MANAGE_TUTORSHIP,
        AcademicPermission.ATTENDANCE_CERTIFICATE,
        AcademicPermission.EXPORT_PDF_CLASS
    ],
    "Notes & Évaluations": [
        AcademicPermission.MANAGE_GRADES,
        AcademicPermission.HARMONIZE_GRADES,
        AcademicPermission.VALIDATE_GRADES,
        AcademicPermission.EDIT_STUDENT_NOTE,
        AcademicPermission.GRADES_REPORT_SHEET,
        AcademicPermission.GRADES_COMPLETION_RATE,
        AcademicPermission.PRINT_ANNUAL_REPORT_CARDS
    ],
    "Discipline & Assiduité": [
        AcademicPermission.GLOBAL_ATTENDANCE,
        AcademicPermission.MANAGE_JUSTIFICATIONS,
        AcademicPermission.MANAGE_SANCTIONS,
        AcademicPermission.PERMISSION_REASONS,
        AcademicPermission.EXIT_SLIP
    ],
    "Finances - Encaissements": [
        AcademicPermission.COLLECT_REGISTRATION_FEE,
        AcademicPermission.COLLECT_TUITION_FEE,
        AcademicPermission.COLLECT_OTHER_FEES,
        AcademicPermission.PAY_OTHER_FEES,
        AcademicPermission.PAY_TRANSPORT,
        AcademicPermission.CANCEL_PAYMENT
    ],
    "Finances - Bilans": [
        AcademicPermission.FINANCIAL_BALANCE_SHEET,
        AcademicPermission.TUITION_BALANCE_SHEET,
        AcademicPermission.OTHER_FEES_BALANCE_SHEET,
        AcademicPermission.TRANSPORT_BALANCE_SHEET,
        AcademicPermission.VIEW_FINANCIAL_REPORTS,
        AcademicPermission.VIEW_PAYMENT_STATUS,
        AcademicPermission.VIEW_MY_PAYMENT_STATUS
    ],
    "Finances - Paramètres": [
        AcademicPermission.MANAGE_PAYMENT_MODES,
        AcademicPermission.MANAGE_BANKS,
        AcademicPermission.TRANSPORT_RATES
    ],
    "Administration - Ecole": [
        AcademicPermission.REGISTER_SCHOOL,
        AcademicPermission.ENROLL_SCHOOL,
        AcademicPermission.EDIT_SCHOOL_INFO,
        AcademicPermission.UNENROLL_SCHOOL,
        AcademicPermission.PRINT_SCHOOL_INFO
    ],
    "Administration - Utilisateurs": [
        AcademicPermission.MANAGE_USERS,
        AcademicPermission.REGISTER_USER,
        AcademicPermission.ENROLL_USER,
        AcademicPermission.EDIT_USER_INFO,
        AcademicPermission.UNENROLL_USER,
        AcademicPermission.PRINT_USER_INFO
    ],
    "Administration - Personnel": [
        AcademicPermission.MANAGE_STAFF,
        AcademicPermission.STAFF_PLACEMENT,
        AcademicPermission.MANAGE_FUNCTIONS,
        AcademicPermission.REGISTER_TEACHER,
        AcademicPermission.ENROLL_TEACHER,
        AcademicPermission.EDIT_TEACHER_INFO,
        AcademicPermission.UNENROLL_TEACHER,
        AcademicPermission.PRINT_TEACHER_INFO
    ],
    "Administration - Maintenance": [
        AcademicPermission.BACKUP_DB,
        AcademicPermission.RESTORE_DB,
        AcademicPermission.LOAD_MENUS,
        AcademicPermission.ACTIVITY_LOGS,
        AcademicPermission.SESSIONS_CONNECTIONS,
        AcademicPermission.GENERAL_CONFIG,
        AcademicPermission.REGISTER_CONFIG,
        AcademicPermission.EDIT_CONFIG,
        AcademicPermission.PRINT_CONFIG
    ],
    "Communication": [
        AcademicPermission.SEND_MESSAGE,
        AcademicPermission.VIEW_MESSAGES,
        AcademicPermission.EDIT_MESSAGE,
        AcademicPermission.DELETE_MESSAGE
    ],
    "Divers": [
        AcademicPermission.EDIT_OWN_ACCOUNT,
        AcademicPermission.CALCULATOR,
        AcademicPermission.ABOUT,
        AcademicPermission.WEB_VERSION,
        AcademicPermission.CHOOSE_BUTTON
    ]
};


const roles = ["DIRECTEUR", "DIRECTEUR_DES_ETUDES", "SURVEILLANT_GENERAL", "ENSEIGNANT", "INTENDANT", "SECRETAIRE", "ADMINISTRATEUR"];

const StaffManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const { selectedYear } = useSchoolYear();
  const schoolId = Number(localStorage.getItem('school_id'));
  const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;

  const [activeTab, setActiveTab] = useState<'staff' | 'requests'>('staff');
  const [staff, setStaff] = useState<PersonnelEntity[]>([]);
  const [requests, setRequests] = useState<DemandeInscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Permission Modal State
  const [selectedStaff, setSelectedStaff] = useState<PersonnelEntity | null>(null);
  const [showPermModal, setShowPermModal] = useState(false);
  const [addedPerms, setAddedPerms] = useState<string[]>([]);
  const [removedPerms, setRemovedPerms] = useState<string[]>([]);

  // Validation Modal State
  const [selectedRequest, setSelectedRequest] = useState<DemandeInscription | null>(null);
  const [showValModal, setShowValModal] = useState(false);
  const [valForm, setValForm] = useState({
      matricule: '',
      role: '',
      dateNaissance: '',
      lieuNaissance: '',
      sexe: 'M',
      diplomes: '',
      addedPerms: [] as string[],
      removedPerms: [] as string[]
  });

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
      idUtilisateur: 0,
      nom: '',
      prenom: '',
      diplomes: '',
      email: '',
      telephone: ''
  });

  useEffect(() => {
    if (schoolId && yearId) {
      loadData();
    }
  }, [schoolId, yearId, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'staff') {
        const res = await staffService.getStaffActif(schoolId, yearId!);
        console.log("[StaffManagement] Loaded staff:", res.data);
        setStaff(res.data);
      } else {
        const res = await staffService.getDemandesEnAttente(schoolId);
        console.log("[StaffManagement] Loaded requests:", res.data);
        setRequests(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openValidationModal = (req: DemandeInscription) => {
      setSelectedRequest(req);
      setValForm({
          matricule: '',
          role: req.profilDemande,
          dateNaissance: '',
          lieuNaissance: '',
          sexe: 'M',
          diplomes: '',
          addedPerms: [],
          removedPerms: []
      });
      setShowValModal(true);
  };

  const handleConfirmValidation = async () => {
      if (!selectedRequest || !valForm.matricule || !valForm.role) return;
      setLoading(true);
      try {
          await staffService.validerDemande({
              idDemande: selectedRequest.idDemande,
              idAnneeScolaire: yearId!,
              matricule: valForm.matricule,
              role: valForm.role,
              dateNaissance: valForm.dateNaissance,
              lieuNaissance: valForm.lieuNaissance,
              sexe: valForm.sexe,
              diplomes: valForm.diplomes,
              permissionsAjoutees: valForm.addedPerms,
              permissionsRetirees: valForm.removedPerms
          });
          setShowValModal(false);
          loadData();
      } catch (err) {
          alert(t('common.error'));
      } finally {
          setLoading(false);
      }
  };

  const handleRejectRequest = async (idDemande: number) => {
    if (!window.confirm(t('common.confirm_delete'))) return;
    setLoading(true);
    try {
        await staffService.rejeterDemande(idDemande);
        loadData();
    } catch (err) {
        alert(t('common.error'));
    } finally {
        setLoading(false);
    }
  };

  const handleToggleBlock = async (member: PersonnelEntity) => {
    try {
      setLoading(true);
      await staffService.setBloque(member.idUtilisateur, schoolId, !member.bloque);
      loadData();
    } catch (err) {
      alert(t('common.error'));
    } finally {
        setLoading(false);
    }
  };

  const openPermissionModal = (member: PersonnelEntity) => {
    setSelectedStaff(member);
    setAddedPerms(member.permissionsAjoutees || []);
    setRemovedPerms(member.permissionsRetirees || []);
    setShowPermModal(true);
  };

  const togglePermission = (perm: string, isInherited: boolean) => {
      if (isInherited) {
          if (removedPerms.includes(perm)) {
              setRemovedPerms(prev => prev.filter(p => p !== perm));
          } else {
              setRemovedPerms(prev => [...prev, perm]);
          }
      } else {
          if (addedPerms.includes(perm)) {
              setAddedPerms(prev => prev.filter(p => p !== perm));
          } else {
              setAddedPerms(prev => [...prev, perm]);
          }
      }
  };

  const savePermissions = async () => {
    if (!selectedStaff) return;
    setLoading(true);
    try {
        await staffService.updatePermissions(selectedStaff.idInscriptionPersonnel, addedPerms, removedPerms);
        setShowPermModal(false);
        loadData();
    } catch (err) {
        alert(t('common.error'));
    } finally {
        setLoading(false);
    }
  };

  const openEditModal = (member: PersonnelEntity) => {
    setEditForm({
        idUtilisateur: member.idUtilisateur,
        nom: member.nom || '',
        prenom: member.prenom || '',
        diplomes: member.utilisateur?.diplomes || '',
        email: member.email || member.utilisateur?.email || '',
        telephone: (member.utilisateur?.telephone || member.telephone1 || '').toString()
    });
    setShowEditModal(true);
  };

  const handleUpdateStaff = async () => {
    setLoading(true);
    try {
        await staffService.updateStaffProfile(editForm.idUtilisateur, {
            nom: editForm.nom,
            prenom: editForm.prenom,
            diplomes: editForm.diplomes,
            email: editForm.email,
            telephone: editForm.telephone
        });
        setShowEditModal(false);
        loadData();
    } catch (err) {
        alert(t('common.error'));
    } finally {
        setLoading(false);
    }
  };

  // Robust filtering with extreme safety
  const displayStaff = React.useMemo(() => {
    console.log("[StaffFilter] Recalculating with searchQuery:", searchQuery);
    const q = (searchQuery || "").toLowerCase().trim();
    if (!Array.isArray(staff)) {
        console.warn("[StaffFilter] staff is not an array:", staff);
        return [];
    }

    return staff.filter((s, index) => {
      if (!s) {
          console.warn(`[StaffFilter] staff[${index}] is null/undefined`);
          return false;
      }

      try {
        // Extract values safely
        const userNom = s.utilisateur?.nom || "";
        const staffNom = s.nom || "";
        const staffRole = s.role || "";
        const staffProfil = (s as any).profil || ""; // Sometimes named profil in old data

        const searchBase = `${userNom} ${staffNom} ${staffRole} ${staffProfil}`.toLowerCase();

        const matches = searchBase.includes(q);
        return matches;
      } catch (err) {
        console.error(`[StaffFilter] Crash at index ${index} with object:`, s, err);
        return false;
      }
    });
  }, [staff, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[40px] shadow-xl border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

        <div className="flex items-center space-x-6 relative z-10">
            <button onClick={() => window.history.back()} className="p-4 hover:bg-gray-100 rounded-full transition-all bg-gray-50 text-black shadow-sm">
                <ArrowLeft size={28} />
            </button>
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter text-black">{t('staff.title')}</h1>
                <div className="flex items-center space-x-3 mt-2">
                    <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center">
                        <Zap size={12} className="mr-1.5" /> {t('menu.groups.admin')}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">{t('staff.subtitle', { year: selectedYear?.libelleAnneeScolaire })}</p>
                </div>
            </div>
        </div>

        <div className="flex bg-gray-50 p-1.5 rounded-[24px] border border-gray-100 relative z-10">
            <button
                onClick={() => setActiveTab('staff')}
                className={clsx(
                    "px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all",
                    activeTab === 'staff' ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-black"
                )}
            >
                {t('staff.active_members')} ({staff.length})
            </button>
            <button
                onClick={() => setActiveTab('requests')}
                className={clsx(
                    "px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all",
                    activeTab === 'requests' ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-black"
                )}
            >
                {t('staff.pending_requests')} ({requests.length})
            </button>
        </div>
      </div>

      <div className="space-y-8">
        <div className="relative max-w-md">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input
                type="text"
                placeholder={t('staff.search_placeholder')}
                className="w-full pl-16 pr-8 py-5 bg-white border border-gray-100 rounded-[24px] text-sm font-bold focus:border-yellow-500 transition-all outline-none shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>

        {activeTab === 'staff' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayStaff.map((member) => (
                    <div key={member.idInscriptionPersonnel} className="bg-white border border-gray-100 rounded-[32px] p-6 hover:border-black group transition-all shadow-sm hover:shadow-xl relative overflow-hidden flex flex-col justify-between">
                        <div className={clsx(
                            "absolute left-0 top-0 w-full h-1 transition-all group-hover:h-2",
                            member.bloque ? "bg-red-500" : "bg-yellow-500"
                        )}></div>

                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <div className={clsx(
                                    "w-12 h-12 rounded-[18px] flex items-center justify-center text-white font-black text-lg shadow-md transition-all group-hover:rotate-6",
                                    member.bloque ? "bg-red-500 shadow-red-100" : "bg-yellow-500 shadow-yellow-100"
                                )}>
                                    {(member.utilisateur?.nom || member.nom || "?").charAt(0)}
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className={clsx(
                                        "px-2.5 py-1 rounded-full text-[7px] font-black uppercase tracking-widest",
                                        member.bloque ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                                    )}>
                                        {member.bloque ? t('staff.status.blocked') : t('staff.status.active')}
                                    </div>
                                    <button
                                        onClick={() => openEditModal(member)}
                                        className="mt-2 p-1.5 hover:bg-gray-100 rounded-full text-gray-300 hover:text-black transition-all"
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-black uppercase tracking-tight text-black mb-1 truncate">{member.utilisateur?.nom || member.nom}</h3>
                            <div className="flex items-center space-x-2 mb-6">
                                <div className="w-1 h-1 rounded-full bg-yellow-500"></div>
                                <p className="text-[8px] font-black text-yellow-600 uppercase tracking-[0.2em]">{member.role}</p>
                            </div>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-center space-x-3 text-gray-400">
                                    <Mail size={14} />
                                    <span className="text-[10px] font-bold truncate">{member.utilisateur?.email || member.email}</span>
                                </div>
                                <div className="flex items-center space-x-3 text-gray-400">
                                    <Phone size={14} />
                                    <span className="text-[10px] font-bold">{member.utilisateur?.telephone || member.utilisateur?.telephone1 || member.telephone1}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                            <button
                                onClick={() => openPermissionModal(member)}
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                <ShieldCheck size={18} />
                                <span className="text-[9px] font-black uppercase tracking-widest">{t('staff.permissions_title').split(' ')[0]}</span>
                            </button>

                            <button
                                onClick={() => handleToggleBlock(member)}
                                className={clsx(
                                    "p-3 rounded-[14px] transition-all shadow-sm",
                                    member.bloque ? "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white" : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                                )}
                            >
                                {member.bloque ? <Unlock size={16}/> : <Lock size={16}/>}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="space-y-6">
                {requests.length === 0 ? (
                    <div className="p-32 text-center border-4 border-dashed border-gray-50 rounded-[56px] bg-white/50">
                        <Clock size={64} className="text-gray-200 mx-auto mb-8" />
                        <h3 className="text-2xl font-black uppercase text-black mb-2">{t('staff.no_request')}</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#9E9E9E]">{t('staff.no_request_desc')}</p>
                    </div>
                ) : (
                    requests.map((req) => (
                        <div key={req.idDemande} className="bg-white border border-gray-100 rounded-[40px] p-10 flex flex-col md:flex-row items-center justify-between gap-10 hover:border-black transition-all shadow-sm">
                            <div className="flex items-center space-x-8">
                                <div className="w-20 h-20 bg-gray-50 rounded-[24px] flex items-center justify-center text-black font-black text-2xl border-4 border-white shadow-xl">
                                    {req.nom.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black uppercase tracking-tight text-black">{req.nom} {req.prenom}</h4>
                                    <div className="flex items-center space-x-6 mt-2">
                                        <div className="flex items-center space-x-2 text-yellow-600">
                                            <Zap size={14} />
                                            <p className="text-[11px] font-black uppercase tracking-widest">{req.profilDemande}</p>
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{req.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => openValidationModal(req)}
                                    className="px-10 py-5 bg-black text-white rounded-sharp font-black uppercase text-[11px] tracking-[0.2em] flex items-center space-x-3 hover:scale-105 transition-all shadow-2xl shadow-gray-200"
                                >
                                    <Check size={20} className="text-yellow-500" />
                                    <span>{t('staff.recruit')}</span>
                                </button>
                                <button
                                    onClick={() => handleRejectRequest(req.idDemande)}
                                    className="p-5 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}
      </div>

      {/* Permission Modal */}
      {showPermModal && selectedStaff && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
              <div className="max-w-4xl w-full bg-white rounded-[56px] h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100">
                  <div className="p-12 border-b border-gray-50 flex items-center justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="relative z-10 flex items-center space-x-6">
                            <div className="w-16 h-16 bg-blue-600 rounded-[22px] flex items-center justify-center text-white shadow-lg">
                                <Shield size={32} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-black">{t('staff.permissions_title')}</h2>
                                <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] mt-1">{selectedStaff.utilisateur?.nom || selectedStaff.nom}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowPermModal(false)} className="p-4 hover:bg-gray-100 rounded-full transition-colors relative z-10">
                            <X size={28} />
                        </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
                        <PermissionGrouping
                            role={selectedStaff.role}
                            addedPerms={addedPerms}
                            removedPerms={removedPerms}
                            onTogglePermission={(perm, isInherited) => togglePermission(perm, isInherited)}
                            onToggleGroup={(perms, state, inheritedArray) => {
                                let newAdded = [...addedPerms];
                                let newRemoved = [...removedPerms];

                                perms.forEach((perm, idx) => {
                                    const isInherited = inheritedArray[idx];
                                    if (state) {
                                        if (isInherited) newRemoved = newRemoved.filter(p => p !== perm);
                                        else if (!newAdded.includes(perm)) newAdded.push(perm);
                                    } else {
                                        if (isInherited) { if (!newRemoved.includes(perm)) newRemoved.push(perm); }
                                        else newAdded = newAdded.filter(p => p !== perm);
                                    }
                                });
                                setAddedPerms(newAdded);
                                setRemovedPerms(newRemoved);
                            }}
                        />
                  </div>

                  <div className="p-10 border-t border-gray-50 bg-gray-50/50 flex justify-end">
                        <AuthButton
                            onClick={savePermissions}
                            className="md:w-auto px-16 py-5 bg-blue-600 shadow-2xl shadow-blue-200"
                            disabled={loading}
                        >
                            <div className="flex items-center space-x-3">
                                <Check size={20} />
                                <span>{t('staff.save_rights')}</span>
                            </div>
                        </AuthButton>
                  </div>
              </div>
          </div>
      )}

      {/* Validation Modal (Tunnel d'inscription) */}
      {showValModal && selectedRequest && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
              <div className="max-w-xl w-full bg-white rounded-[56px] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="p-12 border-b border-gray-50">
                        <div className="flex items-center space-x-4 text-green-600 mb-4">
                            <BadgeCheck size={28} />
                            <span className="text-[11px] font-black uppercase tracking-[0.5em]">{t('staff.recruitment_tunnel')}</span>
                        </div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-black">{t('staff.finalize_registration')}</h2>
                        <p className="text-xs font-bold text-gray-400 mt-2">{selectedRequest.nom} {selectedRequest.prenom}</p>
                  </div>

                  <div className="p-12 space-y-8 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <AuthInput
                                label="Matricule"
                                placeholder="PERS-..."
                                value={valForm.matricule}
                                onChange={e => setValForm({...valForm, matricule: e.target.value.toUpperCase()})}
                            />
                            <AuthInput
                                label="Date Naissance"
                                type="date"
                                value={valForm.dateNaissance}
                                onChange={e => setValForm({...valForm, dateNaissance: e.target.value})}
                            />
                        </div>

                        <AuthInput
                            label="Lieu Naissance"
                            value={valForm.lieuNaissance}
                            onChange={e => setValForm({...valForm, lieuNaissance: e.target.value})}
                        />

                        <AuthInput
                            label="Diplômes / Qualifications"
                            placeholder="Doctorat, Master, etc."
                            value={valForm.diplomes}
                            onChange={e => setValForm({...valForm, diplomes: e.target.value})}
                        />

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] ml-1">{t('common.status')}</label>
                            <div className="grid grid-cols-2 gap-2">
                                {roles.map(role => (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => setValForm({...valForm, role})}
                                        className={clsx(
                                            "p-3 rounded-[16px] text-[9px] font-black uppercase transition-all border",
                                            valForm.role === role ? "border-black bg-gray-900 text-white" : "border-gray-200 text-gray-400"
                                        )}
                                    >
                                        {role.replace(/_/g, ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3 border-t pt-6">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">{t('staff.permissions_title')}</label>
                            <PermissionGrouping
                                role={valForm.role}
                                addedPerms={valForm.addedPerms}
                                removedPerms={valForm.removedPerms}
                                onTogglePermission={(perm, isInherited) => {
                                    const isAdded = valForm.addedPerms.includes(perm);
                                    const isRemoved = valForm.removedPerms.includes(perm);

                                    if (isInherited) {
                                        const newRemoved = isRemoved ? valForm.removedPerms.filter(p => p !== perm) : [...valForm.removedPerms, perm];
                                        setValForm({...valForm, removedPerms: newRemoved});
                                    } else {
                                        const newAdded = isAdded ? valForm.addedPerms.filter(p => p !== perm) : [...valForm.addedPerms, perm];
                                        setValForm({...valForm, addedPerms: newAdded});
                                    }
                                }}
                                onToggleGroup={(perms, state, inheritedArray) => {
                                    let newAdded = [...valForm.addedPerms];
                                    let newRemoved = [...valForm.removedPerms];

                                    perms.forEach((perm, idx) => {
                                        const isInherited = inheritedArray[idx];
                                        if (state) {
                                            if (isInherited) newRemoved = newRemoved.filter(p => p !== perm);
                                            else if (!newAdded.includes(perm)) newAdded.push(perm);
                                        } else {
                                            if (isInherited) { if (!newRemoved.includes(perm)) newRemoved.push(perm); }
                                            else newAdded = newAdded.filter(p => p !== perm);
                                        }
                                    });
                                    setValForm({...valForm, addedPerms: newAdded, removedPerms: newRemoved});
                                }}
                            />
                        </div>

                        <div className="pt-8">
                            <AuthButton onClick={handleConfirmValidation} disabled={!valForm.matricule || !valForm.role || loading}>
                                {loading ? t('common.processing') : t('staff.confirm_recruitment')}
                            </AuthButton>
                            <button
                                onClick={() => setShowValModal(false)}
                                className="w-full mt-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                  </div>
              </div>
          </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
              <div className="max-w-xl w-full bg-white rounded-[56px] shadow-2xl border border-gray-100 overflow-hidden">
                  <div className="p-12 border-b border-gray-50">
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-black">{t('staff.edit_profile')}</h2>
                        <p className="text-xs font-bold text-gray-400 mt-2">{t('staff.edit_profile_desc')}</p>
                  </div>

                  <div className="p-12 space-y-8">
                        <div className="grid grid-cols-2 gap-4">
                            <AuthInput
                                label={t('students.register.last_name')}
                                value={editForm.nom}
                                onChange={e => setEditForm({...editForm, nom: e.target.value})}
                            />
                            <AuthInput
                                label={t('students.register.first_name')}
                                value={editForm.prenom}
                                onChange={e => setEditForm({...editForm, prenom: e.target.value})}
                            />
                        </div>

                        <AuthInput
                            label="Diplômes / Qualifications"
                            placeholder="Doctorat en Mathématiques, etc."
                            value={editForm.diplomes}
                            onChange={e => setEditForm({...editForm, diplomes: e.target.value})}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <AuthInput
                                label={t('login.label_email')}
                                value={editForm.email}
                                onChange={e => setEditForm({...editForm, email: e.target.value})}
                            />
                            <AuthInput
                                label={t('school.profile.phone1')}
                                value={editForm.telephone}
                                onChange={e => setEditForm({...editForm, telephone: e.target.value})}
                            />
                        </div>

                        <div className="pt-8 flex gap-4">
                            <AuthButton onClick={handleUpdateStaff} disabled={loading} className="flex-1">
                                {t('common.save')}
                            </AuthButton>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-10 py-5 bg-gray-50 text-gray-400 rounded-sharp font-black uppercase text-[11px] tracking-widest hover:text-black transition-all"
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                  </div>
              </div>
          </div>
      )}

      {loading && !showPermModal && !showValModal && !showEditModal && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[200] flex flex-col items-center justify-center space-y-4">
             <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="font-black uppercase text-[10px] tracking-widest text-black">{t('common.processing')}</p>
        </div>
      )}
    </div>
  );
};

export default StaffManagementPage;
