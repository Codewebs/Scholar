import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { studentService } from '../../api/studentService';
import {
  FileText,
  Search,
  Printer,
  ChevronRight,
  GraduationCap,
  BadgeCheck,
  UserCheck,
  History,
  Info,
  ArrowLeft,
  Mail,
  MoreVertical
} from 'lucide-react';
import { clsx } from 'clsx';
import AuthInput from '../../components/ui/AuthInput';
import AuthButton from '../../components/ui/AuthButton';

const StudentDocumentsPage: React.FC = () => {
    const { selectedYear } = useSchoolYear();
    const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;

    const [searchTerm, setSearchTerm] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (searchTerm.length >= 3 && yearId) {
            const timer = setTimeout(searchStudents, 500);
            return () => clearTimeout(timer);
        }
    }, [searchTerm]);

    const searchStudents = async () => {
        setLoading(true);
        try {
            const res = await studentService.globalSearch(searchTerm, yearId!);
            setStudents(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const DocCard = ({ title, desc, icon: Icon, onClick }: any) => (
        <button
            onClick={onClick}
            className="p-8 bg-white border border-gray-100 rounded-[40px] shadow-sm hover:shadow-2xl hover:border-black transition-all group flex flex-col text-left"
        >
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-secondary mb-6 group-hover:bg-black group-hover:text-white transition-colors">
                <Icon size={28} />
            </div>
            <h4 className="font-black uppercase text-sm tracking-tight text-black mb-2">{title}</h4>
            <p className="text-[10px] font-bold text-secondary leading-relaxed uppercase tracking-tight">{desc}</p>
            <div className="mt-8 flex items-center text-accent text-[9px] font-black uppercase tracking-widest gap-2 group-hover:translate-x-2 transition-transform">
                Générer maintenant <ChevronRight size={14} />
            </div>
        </button>
    );

    return (
        <div className="max-w-[1500px] mx-auto space-y-10 animate-in fade-in duration-500 pb-20 p-4">
            {/* Header */}
            <div className="bg-white p-10 rounded-[48px] shadow-xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                <div className="flex items-center gap-6 relative z-10">
                    <button onClick={() => window.history.back()} className="p-4 bg-gray-50 rounded-full hover:bg-gray-100 transition-all">
                        <ArrowLeft size={28} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-black">Documents Officiels</h1>
                        <p className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest mt-1">Certificats, cartes et fiches administratives</p>
                    </div>
                </div>

                <div className="relative w-full md:w-[400px]">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher un élève (Nom ou Matricule)..."
                        className="w-full h-16 pl-16 pr-8 bg-gray-50 border border-transparent rounded-[24px] font-black text-xs uppercase focus:bg-white focus:border-black transition-all outline-none shadow-inner"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_450px] gap-8 items-start">
                {/* Left side: Results or Selection */}
                <div className="space-y-8">
                    {!selectedStudent ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {students.map(s => (
                                <div
                                    key={s.idEleve}
                                    onClick={() => setSelectedStudent(s)}
                                    className="p-6 bg-white border border-gray-100 rounded-[32px] hover:border-accent cursor-pointer transition-all flex items-center justify-between group shadow-sm hover:shadow-xl"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-gray-50 rounded-[20px] flex items-center justify-center text-gray-300 font-black text-2xl group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                                            {s.nom[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-black uppercase text-sm text-black">{s.nom} {s.prenom}</h3>
                                            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mt-1">
                                                {s.classeLabel || 'Non inscrit'} • {s.matricule || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-gray-200 group-hover:text-accent transition-colors" />
                                </div>
                            ))}
                            {searchTerm.length >= 3 && students.length === 0 && !loading && (
                                <div className="col-span-full p-20 text-center opacity-30 border-4 border-dashed border-gray-100 rounded-[48px]">
                                    <Info size={48} className="mx-auto mb-4" />
                                    <p className="font-black uppercase">Aucun élève trouvé</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-left-8 duration-500 space-y-8">
                            {/* Selected Student Banner */}
                            <div className="bg-black p-10 rounded-[56px] text-white flex items-center justify-between">
                                <div className="flex items-center gap-8">
                                    <div className="w-24 h-24 bg-white/10 rounded-[32px] flex items-center justify-center text-4xl font-black">
                                        {selectedStudent.nom[0]}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Élève sélectionné</p>
                                        <h2 className="text-4xl font-black uppercase tracking-tight mt-2">{selectedStudent.nom} {selectedStudent.prenom}</h2>
                                        <p className="text-xs font-bold text-accent uppercase tracking-widest mt-2">{selectedStudent.classeLabel}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedStudent(null)}
                                    className="px-6 py-3 bg-white/10 rounded-full text-[9px] font-black uppercase hover:bg-white/20 transition-all"
                                >Changer d'élève</button>
                            </div>

                            {/* Document Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <DocCard
                                    title="Certificat de Scolarité"
                                    desc="Document officiel attestant de l'inscription régulière de l'élève pour l'année en cours."
                                    icon={UserCheck}
                                />
                                <DocCard
                                    title="Carte d'Identité Scolaire"
                                    desc="Badge format PVC avec photo, matricule et classe pour le contrôle d'accès."
                                    icon={BadgeCheck}
                                />
                                <DocCard
                                    title="Fiche de Suivi Individuel"
                                    desc="Historique complet des notes, absences et sanctions depuis le début de l'année."
                                    icon={History}
                                />
                                <DocCard
                                    title="Attestation de Fin d'Études"
                                    desc="Document provisoire en attendant le diplôme officiel ou pour transfert."
                                    icon={GraduationCap}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Right side: Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#9E9E9E] mb-8">Statistiques Documents</h3>
                        <div className="space-y-6">
                             <div className="flex items-center justify-between p-4 bg-gray-50 rounded-3xl">
                                 <span className="text-[10px] font-black uppercase text-secondary">Générés aujourd'hui</span>
                                 <span className="font-black text-xl">12</span>
                             </div>
                             <div className="flex items-center justify-between p-4 bg-gray-50 rounded-3xl">
                                 <span className="text-[10px] font-black uppercase text-secondary">En attente de signature</span>
                                 <span className="font-black text-xl">05</span>
                             </div>
                        </div>
                    </div>

                    <div className="bg-accent/5 border border-accent/10 rounded-[40px] p-8">
                        <div className="flex items-center gap-3 text-accent mb-4">
                            <Info size={20} />
                            <h3 className="text-[10px] font-black uppercase tracking-widest">Aide Rapide</h3>
                        </div>
                        <p className="text-[10px] font-bold text-secondary leading-relaxed uppercase">
                            Les documents sont générés au format PDF A4. Assurez-vous que le logo et les informations de l'établissement sont à jour dans le profil de l'école.
                        </p>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-black uppercase text-[10px] tracking-widest text-black">Recherche en cours...</p>
                </div>
            )}
        </div>
    );
};

export default StudentDocumentsPage;
