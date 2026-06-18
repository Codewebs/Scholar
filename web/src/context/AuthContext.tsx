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

    const hasPermission = (permission: AcademicPermission) => {
        if (!user) return false;

        // L'administrateur a tous les droits
        if (user.role === 'ADMINISTRATEUR') return true;

        // Le Dashboard et les Actualités sont accessibles à tout le personnel (non demandeur)
        if ((permission === AcademicPermission.DASHBOARD_ETABLISSEMENT ||
             permission === AcademicPermission.SUMMARY ||
             permission === AcademicPermission.ACADEMIC_STATS) &&
            user.role !== 'DEMANDEUR') {
            return true;
        }

        const userPerms = user.permissions || [];
        return userPerms.includes(permission);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, hasPermission, isAuthenticated: !!token, isInitialized }}>
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
