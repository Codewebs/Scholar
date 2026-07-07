import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { studentService } from '../../api/studentService';
import { financeService, FraisActivitePeriscolaire } from '../../api/financeService';
import {
    Sparkles,
    ArrowLeft,
    CheckCircle2,
    Building2,
    Check,
    Save,
    AlertCircle,
    Search
} from 'lucide-react';
import { clsx } from 'clsx';
import AuthButton from '../../components/ui/AuthButton';
import AuthInput from '../../components/ui/AuthInput';
import api from '../../api/axios';
import { useTranslation } from 'react-i18next';

const PeriscolaireDistributionPage: React.FC = () => {
    const { t } = useTranslation();
    const { selectedYear } = useSchoolYear();
    const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;

    const [classes, setClasses] = useState<any[]>([]);
    const [activities, setActivities] = useState<FraisActivitePeriscolaire[]>([]);

    const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
    const [selectedActivityId, setSelectedActivityId] = useState<number>(0);
    const [amount, setAmount] = useState<string>('');
    const [allYearPeriscolaires, setAllYearPeriscolaires] = useState<any[]>([]);

    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (yearId) {
            loadData();
        }
    }, [yearId]);

    const loadData = async () => {
        try {
            const [roomsRes, activitiesRes, allTarifsRes] = await Promise.all([
                studentService.getRooms(yearId!),
                financeService.getPeriscolaires(),
                api.get(`/finance/tarifs/all/${yearId}`)
            ]);

            // Extract unique classes
            const uniqueClasses: any[] = [];
            const classIds = new Set();
            roomsRes.data.forEach((salle: any) => {
                if (salle.Classe && !classIds.has(salle.Classe.idClasse)) {
                    classIds.add(salle.Classe.idClasse);
                    uniqueClasses.push(salle.Classe);
                }
            });
            setClasses(uniqueClasses);
            setActivities(activitiesRes.data);
            setAllYearPeriscolaires(allTarifsRes.data.periscolaires || []);
        } catch (err) {
            console.error("❌ Error loading distribution data:", err);
        }
    };

    const toggleClass = (id: number) => {
        setSelectedClasses(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        if (!yearId) {
            setError(t('finance.periscolaire_distribution.errors.no_year'));
            return;
        }

        if (selectedClasses.length === 0) {
            setError(t('finance.periscolaire_distribution.errors.no_classes'));
            return;
        }

        if (!selectedActivityId) {
            setError(t('finance.periscolaire_distribution.errors.no_activity'));
            return;
        }

        if (!amount || Number(amount) <= 0) {
            setError(t('finance.periscolaire_distribution.errors.invalid_amount'));
            return;
        }

        setSaving(true);
        setError(null);
        try {
            console.log("💾 Enregistrement périscolaire en masse...");
            await api.post('/finance/tarifs/periscolaires/bulk', {
                idAnneeScolaire: yearId,
                idFraisActivitePeriscolaire: selectedActivityId,
                montant: Number(amount),
                classIds: selectedClasses
            });

            setSuccess(t('finance.periscolaire_distribution.success'));
            setSelectedClasses([]);
            setAmount('');
            setSelectedActivityId(0);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error("❌ Erreur bulk assign:", err.response?.data || err.message);
            setError(err.response?.data?.error || t('finance.periscolaire_distribution.errors.save_error'));
        } finally {
            setSaving(false);
        }
    };

    const filteredClasses = classes.filter(c =>
        c.libelleClasseFr.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20 p-4">
            <div className="bg-white p-10 rounded-[40px] shadow-xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
                <div className="flex items-center space-x-6 relative z-10">
                    <button onClick={() => window.history.back()} className="p-4 hover:bg-gray-100 rounded-full transition-all bg-gray-50 text-black shadow-sm">
                        <ArrowLeft size={28} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-black">{t('finance.periscolaire_distribution.title')}</h1>
                        <div className="flex items-center space-x-3 mt-2">
                            <div className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center">
                                <Sparkles size={12} className="mr-1.5" /> {t('finance.periscolaire_distribution.bulk_assignment')}
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E]">{t('finance.periscolaire_distribution.assign_subtitle')}</p>
                        </div>
                    </div>
                </div>

                <AuthButton onClick={handleSave} disabled={saving || selectedClasses.length === 0} className="md:w-auto px-12 bg-black shadow-2xl shadow-gray-200">
                    <div className="flex items-center space-x-3">
                        <Save size={20} />
                        <span>{saving ? t('finance.periscolaire_distribution.saving') : t('finance.periscolaire_distribution.save_button')}</span>
                    </div>
                </AuthButton>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Column 1: Classes */}
                <div className="bg-white rounded-[40px] border border-gray-100 flex flex-col overflow-hidden shadow-sm h-[60vh]">
                    <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg">
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase tracking-tight text-lg">{t('finance.periscolaire_distribution.target_classes')}</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('finance.periscolaire_distribution.selected_count', { count: selectedClasses.length })}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedClasses(selectedClasses.length === classes.length ? [] : classes.map(c => c.idClasse))}
                                className="text-[10px] font-black uppercase text-accent hover:underline"
                            >
                                {selectedClasses.length === classes.length ? t('finance.periscolaire_distribution.deselect_all') : t('finance.periscolaire_distribution.select_all')}
                            </button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder={t('finance.periscolaire_distribution.filter_placeholder')}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:border-black transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-3 custom-scrollbar">
                        {filteredClasses.map(c => {
                            const isSelected = selectedClasses.includes(c.idClasse);
                            const count = allYearPeriscolaires.filter(t => t.idClasse === c.idClasse).length;
                            return (
                                <div
                                    key={c.idClasse}
                                    onClick={() => toggleClass(c.idClasse)}
                                    className={clsx(
                                        "p-6 rounded-[24px] cursor-pointer transition-all border-2 flex items-center justify-between group",
                                        isSelected ? "border-black bg-black text-white shadow-xl" : "border-transparent bg-gray-50 hover:bg-white"
                                    )}
                                >
                                    <div className="flex items-center space-x-6">
                                        <div className={clsx(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                            isSelected ? "bg-accent border-accent" : "border-gray-200"
                                        )}>
                                            {isSelected && <Check size={14} className="text-white" />}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-sm uppercase tracking-tight">{c.libelleClasseFr}</span>
                                            {count > 0 && (
                                                <span className={clsx(
                                                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter",
                                                    isSelected ? "bg-white/20 text-white" : "bg-orange-100 text-orange-600"
                                                )}>
                                                    {t('finance.periscolaire_distribution.activities_tag', { count: count })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Column 2: Activity Selection */}
                <div className="bg-white rounded-[40px] border border-gray-100 flex flex-col overflow-hidden shadow-sm">
                    <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h3 className="font-black uppercase tracking-tight text-lg">{t('finance.periscolaire_distribution.activity_amount')}</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('finance.periscolaire_distribution.configure_subtitle')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 space-y-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">{t('finance.periscolaire_distribution.select_activity')}</label>
                            <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                {activities.map(act => (
                                    <div
                                        key={act.idFraisActivitePeriscolaire}
                                        onClick={() => setSelectedActivityId(act.idFraisActivitePeriscolaire!)}
                                        className={clsx(
                                            "p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between",
                                            selectedActivityId === act.idFraisActivitePeriscolaire ? "border-green-600 bg-green-50" : "border-gray-50 bg-gray-50 hover:border-gray-200"
                                        )}
                                    >
                                        <span className="font-black text-xs uppercase">{act.libelleFr}</span>
                                        {selectedActivityId === act.idFraisActivitePeriscolaire && <CheckCircle2 size={20} className="text-green-600" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <AuthInput
                            label={t('finance.periscolaire_distribution.amount_label')}
                            type="number"
                            placeholder={t('finance.periscolaire_distribution.amount_placeholder')}
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            required
                        />

                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3 text-[10px] font-black uppercase">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}
                        {success && (
                            <div className="p-4 bg-green-50 text-green-600 rounded-2xl border border-green-100 flex items-center gap-3 text-[10px] font-black uppercase">
                                <CheckCircle2 size={16} /> {success}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PeriscolaireDistributionPage;
