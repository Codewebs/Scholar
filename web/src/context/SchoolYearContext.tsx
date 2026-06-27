import React, { createContext, useContext, useState, useCallback } from 'react';
import { SchoolYear } from '../types/models';
import { dashboardService } from '../api/dashboardService';
import { useAuth } from './AuthContext';
import { AcademicPermission } from '../types/permissions';

interface SchoolYearContextType {
    years: SchoolYear[];
    selectedYear: SchoolYear | null;
    loading: boolean;
    error: string | null;
    fetchYears: (schoolId: number) => Promise<void>;
    selectYear: (year: SchoolYear) => void;
    createYear: (data: Partial<SchoolYear>, schoolId: number) => Promise<void>;
    updateYear: (id: number, data: Partial<SchoolYear>, schoolId: number) => Promise<void>;
    deleteYear: (id: number, schoolId: number) => Promise<void>;
}

const SchoolYearContext = createContext<SchoolYearContextType | undefined>(undefined);

export const SchoolYearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { hasPermission } = useAuth();
    const [years, setYears] = useState<SchoolYear[]>([]);
    const [selectedYear, setSelectedYear] = useState<SchoolYear | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchYears = useCallback(async (schoolId: number, selectedId: number = 0) => {
        if (schoolId <= 0) return;
        setLoading(true);
        setError(null);
        console.log("[SchoolYearContext] Fetching years for schoolId:", schoolId);
        try {
            const res = await dashboardService.getYears(schoolId);
            const allYears = res.data;
            console.log("[SchoolYearContext] Total years received from API:", allYears);

            // Filter based on permissions like in Android
            const canSeeAll = hasPermission(AcademicPermission.COLLECT_ALL_SCHOOL_YEARS_INFO);
            const filtered = canSeeAll ? allYears : allYears.filter(y => !y.cloturerAnnee);
            console.log("[SchoolYearContext] Filtered years (canSeeAll:", canSeeAll, "):", filtered);

            setYears(filtered);

            // Logic for default selection
            const savedYearId = Number(localStorage.getItem('year_id')) || selectedId;
            const toSelect = filtered.find(y => (y.idServeur || y.idAnneeScolaire) === savedYearId)
                           || filtered.find(y => !y.cloturerAnnee)
                           || filtered[0]
                           || null;

            if (toSelect) {
                const yId = toSelect.idServeur || toSelect.idAnneeScolaire;
                setSelectedYear(toSelect);
                if (yId) localStorage.setItem('year_id', yId.toString());
            }
        } catch (err) {
            setError("Erreur lors de la récupération des années");
        } finally {
            setLoading(false);
        }
    }, [hasPermission]);

    const selectYear = (year: SchoolYear) => {
        const yId = year.idServeur || year.idAnneeScolaire;
        setSelectedYear(year);
        if (yId) localStorage.setItem('year_id', yId.toString());
    };

    const createYear = async (data: Partial<SchoolYear>, schoolId: number) => {
        try {
            const res = await dashboardService.createYear({ ...data, idEtablissement: schoolId });
            await fetchYears(schoolId, res.data.idServeur);
        } catch (err) {
            throw new Error("Échec de la création");
        }
    };

    const updateYear = async (id: number, data: Partial<SchoolYear>, schoolId: number) => {
        try {
            await dashboardService.updateYear(id, data);
            await fetchYears(schoolId, id);
        } catch (err) {
            throw new Error("Échec de la mise à jour");
        }
    };

    const deleteYear = async (id: number, schoolId: number) => {
        try {
            await dashboardService.deleteYear(id);
            await fetchYears(schoolId);
        } catch (err) {
            throw new Error("Échec de la suppression");
        }
    };

    return (
        <SchoolYearContext.Provider value={{
            years, selectedYear, loading, error,
            fetchYears, selectYear, createYear, updateYear, deleteYear
        }}>
            {children}
        </SchoolYearContext.Provider>
    );
};

export const useSchoolYear = () => {
    const context = useContext(SchoolYearContext);
    if (context === undefined) {
        throw new Error('useSchoolYear must be used within a SchoolYearProvider');
    }
    return context;
};
