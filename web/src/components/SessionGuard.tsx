import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchoolYear } from '../context/SchoolYearContext';
import { setupService, UserAssociation } from '../api/setupService';
import { School, SchoolYear } from '../types/models';
import { useTranslation } from 'react-i18next';
import {
    Calendar,
    CheckCircle2,
    LogOut,
    ShieldAlert,
    Building2,
    ChevronRight,
    Zap
} from 'lucide-react';

const SessionGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t } = useTranslation();
    const { user, isAuthenticated, isInitialized, logout, updateUser } = useAuth();
    const { selectedYear, fetchYears, selectYear, years, loading: yearsLoading } = useSchoolYear();

    const [associations, setAssociations] = useState<UserAssociation[]>([]);
    const [loading, setLoading] = useState(false);
    const [needsSchool, setNeedsSchool] = useState(false);
    const [needsYear, setNeedsYear] = useState(false);

    const schoolId = Number(localStorage.getItem('school_id'));

    useEffect(() => {
        if (isInitialized && isAuthenticated && user) {
            checkSession();
        }
    }, [isInitialized, isAuthenticated, user, schoolId]);

    const checkSession = async () => {
        if (!user) return;

        const currentRole = (user.role || '').toUpperCase();
        const isDefaultRole = currentRole === 'DEMANDEUR' || currentRole === 'SANS_ROLE' || currentRole === '';

        // On ne rafraîchit que si on est encore en rôle par défaut
        // ou si on a une école mais pas encore de permissions chargées en mémoire
        const needsRefresh = isDefaultRole || (!!schoolId && user.permissions.length === 0);

        if (needsRefresh) {
            setLoading(true);
            try {
                console.log(`[SessionGuard] 🔄 Syncing profile for user ${user.nom}...`);
                const res = await setupService.getUserAssociations(user.id);
                const validAssocs = res.data.filter(a => a.etat === 'VALIDE');

                if (validAssocs.length === 0 && !schoolId) {
                    window.location.href = '/initial-config';
                    return;
                }

                // Si on a déjà un schoolId, on rafraîchit les droits pour CETTE école
                if (schoolId) {
                    const currentAssoc = validAssocs.find(a =>
                        (a.school.idServeur || a.school.idEtablissement) === schoolId
                    );

                    if (currentAssoc && updateUser) {
                        const apiPerms = currentAssoc.permissionsAjoutees || [];
                        console.log(`[SessionGuard] 🎯 Profile found: Role=${currentAssoc.roles[0]}, Perms=${apiPerms.length}`);

                        updateUser({
                            role: currentAssoc.roles[0],
                            permissions: apiPerms as any[]
                        });
                    } else if (!currentAssoc && validAssocs.length > 0) {
                        // L'école en cache n'est plus valide pour cet utilisateur
                        setAssociations(validAssocs);
                        setNeedsSchool(true);
                    }
                } else if (validAssocs.length === 1) {
                    // ... (rest of the logic)
                    const assoc = validAssocs[0];
                    const sId = assoc.school.idServeur || assoc.school.idEtablissement;
                    localStorage.setItem('school_id', sId!.toString());
                    if (updateUser) {
                        updateUser({
                            role: assoc.roles[0],
                            permissions: (assoc.permissionsAjoutees || []) as any[]
                        });
                    }
                } else if (validAssocs.length > 1) {
                    setAssociations(validAssocs);
                    setNeedsSchool(true);
                }
            } catch (err) {
                console.error("SessionGuard Refresh Error:", err);
            } finally {
                setLoading(false);
            }
        }

        // Vérification de l'année
        if (schoolId && !selectedYear && !yearsLoading) {
            await fetchYears(schoolId);
            if (years.length === 0 && !yearsLoading) {
                setNeedsYear(true);
            }
        }
    };

    // If years are loaded but still no selectedYear, we might need to show selector
    useEffect(() => {
        if (schoolId && years.length > 0 && !selectedYear && !yearsLoading) {
            setNeedsYear(true);
        }
    }, [years, selectedYear, yearsLoading, schoolId]);

    const handleSelectSchool = async (school: School) => {
        const sId = school.idServeur || school.idEtablissement;

        // Trouver l'association pour récupérer les rôles/permissions
        const assoc = associations.find(a => (a.school.idServeur || a.school.idEtablissement) === sId);
        if (assoc && updateUser) {
            console.log(`[SessionGuard] 🎯 Manual school select: Updating role to ${assoc.roles[0]}`);
            updateUser({
                role: assoc.roles[0],
                permissions: (assoc.permissionsAjoutees || []) as any[]
            });
        }

        localStorage.setItem('school_id', sId!.toString());
        setNeedsSchool(false);
        await fetchYears(sId!);
    };

    const handleSelectYear = (year: SchoolYear) => {
        selectYear(year);
        setNeedsYear(false);
    };

    if (!isInitialized || (isAuthenticated && loading)) {
        return (
            <div className="h-screen w-full bg-black flex flex-col items-center justify-center space-y-6">
                <div className="w-20 h-20 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                <p className="font-black uppercase tracking-[0.4em] text-white text-[10px] animate-pulse">{t('session.verifying')}</p>
            </div>
        );
    }

    if (isAuthenticated && (needsSchool || needsYear)) {
        return (
            <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6">
                <div className="max-w-xl w-full bg-white rounded-[56px] p-16 shadow-2xl animate-in zoom-in-95 border border-gray-100 relative overflow-hidden">
                    {/* Background decor */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="flex items-center space-x-3 text-accent mb-4">
                            <ShieldAlert size={28} />
                            <span className="text-[11px] font-black uppercase tracking-[0.5em]">{t('session.init_required')}</span>
                        </div>

                        <h2 className="text-4xl font-black uppercase tracking-tighter text-black mb-4">
                            {needsSchool ? t('session.choose_school') : t('session.choose_year')}
                        </h2>
                        <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-10 leading-relaxed">
                            {t('session.init_desc')}
                        </p>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {needsSchool ? (
                                associations.map((assoc, idx) => {
                                    const s = assoc.school;
                                    const sId = s.idServeur || s.idEtablissement;
                                    return (
                                        <div
                                            key={sId || idx}
                                            onClick={() => handleSelectSchool(s)}
                                            className="group p-8 border-2 border-gray-100 rounded-[32px] hover:border-accent hover:bg-accent/5 cursor-pointer transition-all flex items-center justify-between"
                                        >
                                            <div className="flex items-center space-x-6">
                                                <div className="w-14 h-14 bg-gray-50 rounded-[18px] flex items-center justify-center text-gray-300 group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
                                                    <Building2 size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-lg uppercase tracking-tight text-black">{s.nomFr}</h4>
                                                    <p className="text-[10px] font-black text-[#9E9E9E] uppercase tracking-widest mt-1">{s.ville || 'Ville non définie'}</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={24} className="text-gray-200 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                                        </div>
                                    );
                                })
                            ) : (
                                years.map((year, idx) => {
                                    const yId = year.idServeur || year.idAnneeScolaire;
                                    return (
                                        <div
                                            key={yId || idx}
                                            onClick={() => handleSelectYear(year)}
                                            className="group p-8 border-2 border-gray-100 rounded-[32px] hover:border-blue-600 hover:bg-blue-50 cursor-pointer transition-all flex items-center justify-between"
                                        >
                                            <div className="flex items-center space-x-6">
                                                <div className="w-14 h-14 bg-gray-50 rounded-[18px] flex items-center justify-center text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                    <Calendar size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-xl uppercase tracking-tight text-black">{year.libelleAnneeScolaire}</h4>
                                                    <p className="text-[10px] font-black text-[#9E9E9E] uppercase tracking-widest mt-1">{t('session.academic_session')}</p>
                                                </div>
                                            </div>
                                            <CheckCircle2 size={24} className="text-gray-100 group-hover:text-blue-600 transition-all" />
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
                            <button
                                onClick={logout}
                                className="flex items-center space-x-2 text-red-500 font-black uppercase text-[10px] tracking-widest hover:bg-red-50 px-6 py-3 rounded-full transition-all"
                            >
                                <LogOut size={16} />
                                <span>{t('session.logout')}</span>
                            </button>
                            <div className="flex items-center space-x-2 bg-gray-50 px-6 py-3 rounded-full border border-gray-100">
                                <Zap size={14} className="text-yellow-500" />
                                <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{t('session.security_flow')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default SessionGuard;
