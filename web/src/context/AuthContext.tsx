import React, { createContext, useContext, useState, useEffect } from 'react';
import { AcademicPermission } from '../types/permissions';

interface User {
    id: number;
    nom: string;
    email: string;
    role: string;
    permissions: AcademicPermission[];
}

interface AuthContextType {
    user: User | null;
    login: (userData: User, token: string) => void;
    updateUser: (data: Partial<User>) => void; // Ajouté
    logout: () => void;
    hasPermission: (permission: AcademicPermission) => boolean;
    isAuthenticated: boolean;
    isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');
        if (savedUser && savedToken) {
            setUser(JSON.parse(savedUser));
            setToken(savedToken);
        }
        setIsInitialized(true);
    }, []);

    const login = (userData: User, newToken: string) => {
        setUser(userData);
        setToken(newToken);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const updateUser = (data: Partial<User>) => {
        setUser(prev => {
            if (!prev) return null;
            const updated = { ...prev, ...data };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('setup_complete');
        localStorage.removeItem('school_id');
        localStorage.removeItem('year_id');
    };

    useEffect(() => {
        if (!token) return;

        let timer: NodeJS.Timeout;

        const resetTimer = () => {
            clearTimeout(timer);
            // 15 minutes en millisecondes = 900000 ms
            timer = setTimeout(() => {
                alert("Votre session a expiré pour inactivité.");
                logout();
                window.location.href = '/login';
            }, 900000);
        };

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
        events.forEach(event => window.addEventListener(event, resetTimer));

        resetTimer();

        return () => {
            events.forEach(event => window.removeEventListener(event, resetTimer));
            clearTimeout(timer);
        };
    }, [token]);

    const hasPermission = (permission: AcademicPermission) => {
        if (!user) {
            return false;
        }

        const role = (user.role || '').toUpperCase();

        // 1. L'administrateur a tous les droits
        if (role === 'ADMINISTRATEUR') return true;

        // 2. Permissions de base accordées à tout membre du personnel validé
        const basePermissions = [
            AcademicPermission.DASHBOARD_ETABLISSEMENT,
            AcademicPermission.SUMMARY,
            AcademicPermission.ACADEMIC_STATS,
            AcademicPermission.WEB_VERSION,
            AcademicPermission.ABOUT,
            AcademicPermission.EDIT_OWN_ACCOUNT
        ];

        if (basePermissions.includes(permission)) {
            // Si c'est une permission de base, on l'accorde si l'utilisateur a un rôle valide
            if (role !== 'DEMANDEUR' && role !== 'SANS_ROLE' && role !== '') {
                return true;
            }
            // Fallback pour Lucien : Si on a un school_id en cache, on est probablement en train de synchroniser
            if (localStorage.getItem('school_id')) return true;
        }

        // 3. Récupérer les permissions par défaut du rôle
        const roleDefaultPermissions: Record<string, string[]> = {
            'FONDATEUR': ['DASHBOARD_ETABLISSEMENT', 'WEB_VERSION', 'ACADEMIC_STATS', 'FINANCIAL_BALANCE_SHEET', 'PRINT_SCHOOL_INFO', 'SUMMARY'],
            'DIRECTEUR': ['DASHBOARD_ETABLISSEMENT', 'WEB_VERSION', 'ACADEMIC_STATS', 'VIEW_STUDENT_LIST', 'STUDENT_DOSSIER', 'MANAGE_ACADEMIC_CONFIG', 'VALIDATE_GRADES', 'GRADES_REPORT_SHEET', 'GLOBAL_ATTENDANCE', 'SUMMARY'],
            'DIRECTEUR_DES_ETUDES': ['DASHBOARD_ETABLISSEMENT', 'WEB_VERSION', 'MANAGE_ACADEMIC_CONFIG', 'MANAGE_GRADES', 'VALIDATE_GRADES', 'GRADES_REPORT_SHEET', 'VIEW_STUDENT_LIST', 'ACADEMIC_STATS'],
            'INTENDANT': ['DASHBOARD_ETABLISSEMENT', 'WEB_VERSION', 'COLLECT_TUITION_FEE', 'COLLECT_REGISTRATION_FEE', 'COLLECT_OTHER_FEES', 'VIEW_FINANCIAL_REPORTS', 'FINANCIAL_BALANCE_SHEET', 'VIEW_PAYMENT_STATUS'],
            'SECRETAIRE': ['DASHBOARD_ETABLISSEMENT', 'WEB_VERSION', 'REGISTER_STUDENT', 'ENROLL_STUDENT', 'VIEW_STUDENT_LIST', 'STUDENT_DOSSIER', 'PRINT_STUDENT_INFO', 'ATTENDANCE_CERTIFICATE'],
            'SURVEILLANT_GENERAL': ['DASHBOARD_ETABLISSEMENT', 'WEB_VERSION', 'VIEW_STUDENT_LIST', 'STUDENT_DOSSIER', 'GLOBAL_ATTENDANCE', 'MANAGE_JUSTIFICATIONS', 'MANAGE_SANCTIONS', 'EXIT_SLIP'],
            'ENSEIGNANT': ['DASHBOARD_ETABLISSEMENT', 'WEB_VERSION', 'MANAGE_GRADES', 'EDIT_STUDENT_NOTE', 'GRADES_REPORT_SHEET', 'SUMMARY'],
        };

        const defaultPerms = roleDefaultPermissions[role] || [];

        // 4. Vérification des permissions spécifiques (surcharges)
        let userPerms: string[] = [];
        if (Array.isArray(user.permissions)) {
            userPerms = user.permissions.map(p => p.toString());
        } else if (typeof user.permissions === 'string') {
            try {
                userPerms = JSON.parse(user.permissions);
            } catch (e) {
                userPerms = [];
            }
        }

        // Combiner par défaut + personnalisées
        const allUserPerms = [...new Set([...defaultPerms, ...userPerms])];

        const hasIt = allUserPerms.includes(permission.toString());

        // Debug intensif pour diagnostiquer le problème de menu
        if (role !== 'ADMINISTRATEUR') {
            if (!hasIt && !basePermissions.includes(permission)) {
                console.log(`[PermissionDenied] User: ${user.nom}, Role: ${role}, Missing: ${permission}, Has: ${userPerms.length} custom perms`);
            }
        }

        return hasIt;
    };

    return (
        <AuthContext.Provider value={{ user, login, updateUser, logout, hasPermission, isAuthenticated: !!token, isInitialized }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
