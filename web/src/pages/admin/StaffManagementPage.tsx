import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { staffService, PersonnelEntity, DemandeInscription } from '../../api/staffService';
import { AcademicPermission } from '../../types/permissions';
import {
    Users,
    ArrowLeft,
    Check,
    X,
    ShieldCheck,
    Mail,
    Phone,
    MoreVertical,
    Search,
    UserCheck,
    UserX,
    Clock,
    Zap,
    Lock,
    Unlock,
    Shield,
    Calendar,
    BadgeCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import AuthInput from '../../components/ui/AuthInput';
import AuthButton from '../../components/ui/AuthButton';

const permissionGroups = {
    "Tableau de Bord": [
        AcademicPermission.DASHBOARD_ETABLISSEMENT,
        AcademicPermission.ACTIVITY_LOGS,
        AcademicPermission.ACADEMIC_STATS,
        AcademicPermission.SUMMARY
    ],
    "Gestion Académique": [
        AcademicPermission.MANAGE_CYCLES,
        AcademicPermission.MANAGE_CLASSES,
        AcademicPermission.MANAGE_ACADEMIC_CONFIG,
        AcademicPermission.MANAGE_PERIODS
    ],
    "Élèves": [
        AcademicPermission.REGISTER_STUDENT,
        AcademicPermission.VIEW_STUDENT_LIST,
        AcademicPermission.EDIT_STUDENT_INFO,
        AcademicPermission.STUDENT_DOSSIER
    ],
    "Notes & Évaluations": [
        AcademicPermission.MANAGE_GRADES,
        AcademicPermission.VALIDATE_GRADES,
        AcademicPermission.GRADES_REPORT_SHEET
    ],
    "Finance": [
        AcademicPermission.COLLECT_TUITION_FEE,
        AcademicPermission.COLLECT_OTHER_FEES,
        AcademicPermission.VIEW_FINANCIAL_REPORTS,
        AcademicPermission.VIEW_PAYMENT_STATUS
    ],
    "Administration": [
        AcademicPermission.MANAGE_STAFF,
        AcademicPermission.MANAGE_USERS,
        AcademicPermission.GENERAL_CONFIG,
        AcademicPermission.EDIT_SCHOOL_INFO
    ]
};

const roles = ["DIRECTEUR", "DIRECTEUR_DES_ETUDES", "SURVEILLANT_GENERAL", "ENSEIGNANT", "INTENDANT", "SECRETAIRE", "ADMINISTRATEUR"];

const StaffManagementPage: React.FC = () => {
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
      sexe: 'M'
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
          sexe: 'M'
      });
      setShowValModal(true);
  };

  const handleRejectRequest = async (idDemande: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir rejeter cette demande ?")) return;
    setLoading(true);
    try {
        await staffService.rejeterDemande(idDemande);
        loadData();
    } catch (err) {
        alert("Erreur lors du rejet");
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
      alert("Erreur");
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

  const togglePermission = (perm: string) => {
    if (addedPerms.includes(perm)) {
        setAddedPerms(prev => prev.filter(p => p !== perm));
        setRemovedPerms(prev => [...prev, perm]);
    } else if (removedPerms.includes(perm)) {
        setRemovedPerms(prev => prev.filter(p => p !== perm));
    } else {
        setAddedPerms(prev => [...prev, perm]);
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
        alert("Erreur lors de la mise à jour");
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
                <h1 className="text-4xl font-black uppercase tracking-tighter text-black">Utilisateurs & Personnel</h1>
                <div className="flex items-center space-x-3 mt-2">
                    <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center">
                        <Zap size={12} className="mr-1.5" /> Administration
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">Effectifs de l'année {selectedYear?.libelleAnneeScolaire}</p>
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
                Membres Actifs ({staff.length})
            </button>
            <button
                onClick={() => setActiveTab('requests')}
                className={clsx(
                    "px-8 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all",
                    activeTab === 'requests' ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-black"
                )}
            >
                Demandes en attente ({requests.length})
            </button>
        </div>
      </div>

      <div className="space-y-8">
        <div className="relative max-w-md">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input
                type="text"
                placeholder="Filtrer par nom ou fonction..."
                className="w-full pl-16 pr-8 py-5 bg-white border border-gray-100 rounded-[24px] text-sm font-bold focus:border-yellow-500 transition-all outline-none shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>

        {activeTab === 'staff' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayStaff.map((member, idx) => (
                    <div key={member.idInscriptionPersonnel} className="bg-white border border-gray-100 rounded-[40px] p-8 hover:border-black group transition-all shadow-sm hover:shadow-2xl relative overflow-hidden">
                        <div className={clsx(
                            "absolute left-0 top-0 w-full h-1.5 transition-all group-hover:h-3",
                            member.bloque ? "bg-red-500" : "bg-yellow-500"
                        )}></div>

                        <div className="flex justify-between items-start mb-8">
                            <div className={clsx(
                                "w-16 h-16 rounded-[22px] flex items-center justify-center text-white font-black text-xl shadow-lg transition-all group-hover:rotate-6",
                                member.bloque ? "bg-red-500 shadow-red-100" : "bg-yellow-500 shadow-yellow-100"
                            )}>
                                {(member.utilisateur?.nom || member.nom || "?").charAt(0)}
                            </div>
                            <div className="flex flex-col items-end">
                                <div className={clsx(
                                    "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                                    member.bloque ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                                )}>
                                    {member.bloque ? "Bloqué" : "Actif"}
                                </div>
                                <button className="mt-4 p-2 hover:bg-gray-100 rounded-full text-gray-300 hover:text-black transition-all">
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-xl font-black uppercase tracking-tight text-black mb-1 truncate">{member.utilisateur?.nom || member.nom}</h3>
                        <div className="flex items-center space-x-2 mb-8">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                            <p className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.2em]">{member.role}</p>
                        </div>

                        <div className="space-y-4 mb-10">
                            <div className="flex items-center space-x-3 text-gray-400">
                                <Mail size={16} />
                                <span className="text-xs font-bold truncate">{member.utilisateur?.email || member.email}</span>
                            </div>
                            <div className="flex items-center space-x-3 text-gray-400">
                                <Phone size={16} />
                                <span className="text-xs font-bold">{member.utilisateur?.telephone || member.utilisateur?.telephone1 || member.telephone1}</span>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-50 flex items-center justify-between">
                            <button
                                onClick={() => openPermissionModal(member)}
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                <ShieldCheck size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Droits d'accès</span>
                            </button>

                            <button
                                onClick={() => handleToggleBlock(member)}
                                className={clsx(
                                    "p-4 rounded-[18px] transition-all shadow-sm",
                                    member.bloque ? "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white" : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                                )}
                            >
                                {member.bloque ? <Unlock size={20}/> : <Lock size={20}/>}
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
                        <h3 className="text-2xl font-black uppercase text-black mb-2">Aucune demande</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#9E9E9E]">Le personnel n'a pas encore envoyé de demande</p>
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
                                    <span>Recruter</span>
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
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-black">Permissions & Accès</h2>
                                <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] mt-1">{selectedStaff.utilisateur?.nom || selectedStaff.nom}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowPermModal(false)} className="p-4 hover:bg-gray-100 rounded-full transition-colors relative z-10">
                            <X size={28} />
                        </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
                        {Object.entries(permissionGroups).map(([groupName, perms]) => (
                            <div key={groupName} className="space-y-6">
                                <div className="flex items-center space-x-4">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#9E9E9E] whitespace-nowrap">{groupName}</h3>
                                    <div className="h-[1px] flex-1 bg-gray-100"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {perms.map(perm => {
                                        const isAdded = addedPerms.includes(perm);
                                        const isRemoved = removedPerms.includes(perm);

                                        return (
                                            <div
                                                key={perm}
                                                onClick={() => togglePermission(perm)}
                                                className={clsx(
                                                    "p-6 border-2 rounded-[28px] cursor-pointer transition-all flex items-center justify-between group",
                                                    isAdded ? "border-green-500 bg-green-50 shadow-lg translate-y-[-2px]" :
                                                    isRemoved ? "border-red-500 bg-red-50" : "border-gray-100 hover:border-gray-300"
                                                )}
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className={clsx(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                                        isAdded ? "bg-green-500 text-white" :
                                                        isRemoved ? "bg-red-500 text-white" : "bg-gray-50 text-gray-300 group-hover:bg-black group-hover:text-white"
                                                    )}>
                                                        {isAdded ? <Check size={18}/> : isRemoved ? <X size={18}/> : <Shield size={18}/>}
                                                    </div>
                                                    <span className={clsx(
                                                        "text-[10px] font-black uppercase tracking-widest",
                                                        isAdded ? "text-green-700" : isRemoved ? "text-red-700" : "text-black"
                                                    )}>{perm.replace(/_/g, ' ')}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                  </div>

                  <div className="p-10 border-t border-gray-50 bg-gray-50/50 flex justify-end">
                        <AuthButton
                            onClick={savePermissions}
                            className="md:w-auto px-16 py-5 bg-blue-600 shadow-2xl shadow-blue-200"
                            disabled={loading}
                        >
                            <div className="flex items-center space-x-3">
                                <Check size={20} />
                                <span>Enregistrer les Droits</span>
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
                            <span className="text-[11px] font-black uppercase tracking-[0.5em]">Recrutement Personnel</span>
                        </div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-black">Finaliser l'inscription</h2>
                        <p className="text-xs font-bold text-gray-400 mt-2">{selectedRequest.nom} {selectedRequest.prenom}</p>
                  </div>

                  <div className="p-12 space-y-8">
                        <AuthInput
                            label="Matricule Interne"
                            placeholder="Ex: PERS-2024-001"
                            value={valForm.matricule}
                            onChange={e => setValForm({...valForm, matricule: e.target.value.toUpperCase()})}
                        />

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] ml-1">Rôle & Affectation</label>
                            <div className="grid grid-cols-2 gap-3">
                                {roles.map(role => (
                                    <div
                                        key={role}
                                        onClick={() => setValForm({...valForm, role})}
                                        className={clsx(
                                            "p-4 border-2 rounded-[20px] cursor-pointer transition-all text-center",
                                            valForm.role === role ? "border-black bg-gray-50 font-black text-[10px]" : "border-gray-100 text-gray-400 text-[9px] font-bold"
                                        )}
                                    >
                                        {role.replace(/_/g, ' ')}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-8">
                            <AuthButton onClick={handleConfirmValidation} disabled={!valForm.matricule || !valForm.role || loading}>
                                {loading ? "Traitement..." : "Confirmer le Recrutement"}
                            </AuthButton>
                            <button
                                onClick={() => setShowValModal(false)}
                                className="w-full mt-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                  </div>
              </div>
          </div>
      )}

      {loading && !showPermModal && !showValModal && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[200] flex flex-col items-center justify-center space-y-4">
             <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="font-black uppercase text-[10px] tracking-widest text-black">Mise à jour...</p>
        </div>
      )}
    </div>
  );
};

export default StaffManagementPage;
