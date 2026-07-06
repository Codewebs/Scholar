import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { studentService } from '../../api/studentService';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Search,
  ChevronRight,
  GraduationCap,
  UserCheck,
  History,
  ArrowLeft,
  Building2,
  MoreVertical
} from 'lucide-react';
import { clsx } from 'clsx';

const StudentDocumentsPage: React.FC = () => {
    const { t } = useTranslation();
    const { selectedYear } = useSchoolYear();
    const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;

    const [searchTerm, setSearchTerm] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeMenu, setActiveMenu] = useState<number | null>(null);

    // Filters
    const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
    const [classes, setClasses] = useState<any[]>([]);

    useEffect(() => {
        if (yearId) {
            loadInitialData();
        }
    }, [yearId]);

    useEffect(() => {
        if (yearId) {
            const timer = setTimeout(fetchStudents, 500);
            return () => clearTimeout(timer);
        }
    }, [searchTerm, selectedClassId, yearId]);

    const loadInitialData = async () => {
        try {
            const roomsRes = await studentService.getRooms(yearId!);
            // Extract unique classes from rooms
            const uniqueClasses = Array.from(new Map(roomsRes.data.map((r: any) => [r.idClasse, r.classeLabel || r.Classe?.libelleClasseFr])).entries())
                .map(([id, label]) => ({ id, label }));
            setClasses(uniqueClasses);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            let res;
            if (searchTerm.length >= 3) {
                res = await studentService.globalSearch(searchTerm, yearId!);
            } else {
                res = await studentService.getAllStudents(yearId!);
            }

            let filtered = res.data;
            if (selectedClassId !== 'ALL') {
                filtered = filtered.filter((s: any) => s.idClasse === parseInt(selectedClassId));
            }

            setStudents(filtered);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintDoc = (docType: string, student: any) => {
        const studentId = student.idEleve;
        const url = `/app/students/documents/print?docType=${docType}&idEleve=${studentId}&idAnneeScolaire=${yearId}`;
        window.open(url, '_blank');
        setActiveMenu(null);
    };

    const DocOption = ({ label, icon: Icon, onClick, color = "text-black" }: any) => (
        <button
            onClick={onClick}
            className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-all flex items-center justify-between group"
        >
            <div className="flex items-center space-x-4">
                <div className={clsx("w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all", color)}>
                    <Icon size={16} />
                </div>
                <span className="text-xs font-black uppercase tracking-tight text-gray-600 group-hover:text-black">{label}</span>
            </div>
            <ChevronRight size={14} className="text-gray-300 group-hover:text-black transition-all" />
        </button>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-500 pb-20 p-4">
            {/* Header with Search and Filters */}
            <div className="bg-white p-10 rounded-[48px] shadow-xl border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10 relative z-10">
                    <div className="flex items-center gap-6">
                        <button onClick={() => window.history.back()} className="p-4 bg-gray-50 rounded-full hover:bg-gray-100 transition-all">
                            <ArrowLeft size={28} />
                        </button>
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter text-black">{t('students.documents.title')}</h1>
                            <p className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest mt-1">{t('students.documents.subtitle')}</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4 flex-1 max-w-4xl">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder={t('students.documents.search_placeholder')}
                                className="w-full h-16 pl-16 pr-8 bg-gray-50 border border-transparent rounded-[24px] font-black text-xs uppercase focus:bg-white focus:border-black transition-all outline-none shadow-inner"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="w-full md:w-64">
                            <select
                                className="w-full h-16 px-8 bg-gray-50 border border-transparent rounded-[24px] font-black text-xs uppercase focus:bg-white focus:border-black transition-all outline-none shadow-inner appearance-none"
                                value={selectedClassId}
                                onChange={e => setSelectedClassId(e.target.value)}
                            >
                                <option value="ALL">{t('common.all_classes')}</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {students.map(student => (
                    <div
                        key={student.idEleve}
                        className={clsx(
                            "bg-white border rounded-[32px] p-6 transition-all flex items-center justify-between group relative",
                            activeMenu === student.idEleve ? "border-black shadow-2xl z-20 scale-[1.01]" : "border-gray-100 hover:border-gray-300 hover:shadow-lg"
                        )}
                    >
                        <div className="flex items-center gap-8">
                            <div className="w-16 h-16 bg-gray-50 rounded-[22px] flex items-center justify-center text-gray-300 font-black text-2xl group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                                {student.nom[0]}
                            </div>
                            <div>
                                <h3 className="font-black uppercase text-base text-black tracking-tight">{student.nomComplet}</h3>
                                <div className="flex items-center gap-4 mt-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Building2 size={12} /> {student.classeLabel} • {student.salleLabel}
                                    </p>
                                    <p className="text-[10px] font-black text-accent uppercase tracking-widest">{student.matricule}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex items-center gap-2 mr-6">
                                <span className={clsx(
                                    "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                    student.isSolded ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"
                                )}>
                                    {student.isSolded ? t('students.documents.solded') : t('students.documents.insolvent')}
                                </span>
                            </div>

                            <button
                                onClick={() => setActiveMenu(activeMenu === student.idEleve ? null : student.idEleve)}
                                className={clsx(
                                    "p-4 rounded-2xl transition-all",
                                    activeMenu === student.idEleve ? "bg-black text-white" : "bg-gray-50 text-gray-400 hover:text-black hover:bg-gray-100"
                                )}
                            >
                                < MoreVertical size={20} />
                            </button>

                            {/* Contextual Menu */}
                            {activeMenu === student.idEleve && (
                                <div className="absolute right-6 top-24 w-80 bg-white border border-gray-100 rounded-[32px] shadow-2xl z-30 py-4 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-6 py-2 border-b border-gray-50 mb-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('students.documents.available_docs')}</p>
                                    </div>
                                    <DocOption
                                        label={t('students.documents.cert_scolarite')}
                                        icon={UserCheck}
                                        onClick={() => handlePrintDoc('CERTIFICAT_SCOLARITE', student)}
                                        color="text-blue-600"
                                    />
                                    <DocOption
                                        label={t('students.documents.cert_promotion')}
                                        icon={GraduationCap}
                                        onClick={() => handlePrintDoc('CERTIFICAT_PROMOTION', student)}
                                        color="text-green-600"
                                    />
                                    <div className="h-px bg-gray-50 my-2 mx-6"></div>
                                    <DocOption
                                        label={t('students.documents.year_receipt')}
                                        icon={FileText}
                                        onClick={() => handlePrintDoc('YEAR_RECEIPT', student)}
                                        color="text-accent"
                                    />
                                    <DocOption
                                        label={t('students.documents.global_history')}
                                        icon={History}
                                        onClick={() => handlePrintDoc('GLOBAL_RECEIPT_HISTORY', student)}
                                        color="text-violet-600"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {loading && (
                <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-black uppercase text-[10px] tracking-widest text-black">{t('students.documents.updating_list')}</p>
                </div>
            )}

            {!loading && students.length === 0 && (
                <div className="p-32 text-center border-4 border-dashed border-gray-100 rounded-[56px] opacity-30">
                    <Search size={48} className="mx-auto mb-4" />
                    <p className="font-black uppercase tracking-widest">{t('students.documents.no_results')}</p>
                </div>
            )}
        </div>
    );
};

export default StudentDocumentsPage;
