import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AcademicPermission } from '../types/permissions';

interface ProtectedRouteProps {
    children: React.ReactNode;
    permission?: AcademicPermission;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, permission }) => {
    const { isAuthenticated, hasPermission, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Autoriser l'accès au Dashboard même si le rôle n'est pas encore sync
    // pour permettre au SessionGuard de s'exécuter
    const isSyncing = (user?.role === 'DEMANDEUR' || !user?.role) && !!localStorage.getItem('school_id');

    if (permission && !hasPermission(permission) && !isSyncing) {
        console.warn(`[ProtectedRoute] Access Denied for ${user?.nom}. Required: ${permission}`);
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
