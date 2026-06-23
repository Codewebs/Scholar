import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { repartitionEnseignantService } from '../../api/repartitionEnseignantService';
import { Loader2, User, Crown } from 'lucide-react';
import { clsx } from 'clsx';

const TeacherTeamPrintPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const { selectedYear } = useSchoolYear();
    const idSalle = Number(searchParams.get('idSalle'));
    const withEmargement = searchParams.get('emargement') === 'true';

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (idSalle && selectedYear) {
            loadData();
        }
    }, [idSalle, selectedYear]);

    const loadData = async () => {
        setLoading(true);
        try {
            const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;
            const res = await repartitionEnseignantService.getPrintData(idSalle, yearId!);
            setData(res.data);
            document.title = `Equipe Pédagogique - ${res.data.salle.nomSalle}`;
        } catch (err) {
            console.error("Print data error", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
            <p className="font-black uppercase text-[10px] tracking-widest">Génération de la liste...</p>
        </div>
    );

    if (!data) return <div>Erreur de chargement des données.</div>;

    const principal = data.assignments.find((a: any) => a.isPrincipal);
    const team = data.assignments.filter((a: any) => a.idRepartitionMatiere);

    return (
        <div className="min-h-screen bg-white p-[20mm] print:p-0 flex flex-col items-center no-print-bg">
            <div className="w-[210mm] min-h-[297mm] bg-white p-[15mm] flex flex-col relative overflow-hidden print:shadow-none shadow-2xl">

                {/* OFFICIAL HEADER */}
                <header className="flex justify-between items-start border-b-2 border-black pb-6 mb-10">
                    <div className="flex flex-col items-start gap-2">
                        <img src="/logo.png" alt="Logo" className="h-16 w-16 object-contain" />
                        <div className="text-[10px] font-black uppercase tracking-tight">
                            <p>Ministère des Enseignements Secondaires</p>
                            <p className="text-gray-400">Délégation Régionale du Centre</p>
                        </div>
                    </div>

                    <div className="text-center flex flex-col justify-center">
                        <h1 className="text-[10px] font-black uppercase tracking-[0.3em] bg-black text-white px-4 py-1.5 rounded-full mb-3">
                            Année Scolaire {selectedYear?.libelleAnneeScolaire}
                        </h1>
                    </div>

                    <div className="text-right">
                        <h2 className="text-sm font-black uppercase tracking-tighter leading-tight">
                            Indiza Scholar Academy
                        </h2>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Excellence & Discipline</p>
                    </div>
                </header>

                <div className="text-center space-y-2 mb-12">
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Équipe Pédagogique & Répartition</h2>
                    <div className="flex justify-center items-center gap-4">
                        <span className="px-6 py-2 bg-gray-100 rounded-full text-xs font-black uppercase tracking-widest border border-gray-200">
                           Classe : {data.salle.Classe?.libelleClasseFr}
                        </span>
                        <span className="px-6 py-2 bg-accent text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-accent/20">
                           Salle : {data.salle.nomSalle}
                        </span>
                    </div>
                </div>

                {/* PRINCIPAL TEACHER BOX */}
                <div className="bg-gray-50 rounded-[40px] p-8 border-2 border-dashed border-gray-200 mb-12 flex items-center justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] -mr-8 -mt-8 rotate-12">
                        <Crown size={120} />
                    </div>

                    <div className="flex items-center gap-8 relative z-10">
                        <div className="w-20 h-20 rounded-[24px] bg-white shadow-xl border-4 border-white overflow-hidden">
                           {principal?.InscriptionPersonnel?.photo ? <img src={principal.InscriptionPersonnel.photo} className="w-full h-full object-cover" /> : <User size={40} className="text-gray-200 mt-4 mx-auto" />}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-1">Enseignant Principal de la Salle</p>
                            <h3 className="text-2xl font-black uppercase tracking-tighter">
                                {principal ? `${principal.InscriptionPersonnel?.nom} ${principal.InscriptionPersonnel?.prenom || ''}` : 'Non désigné'}
                            </h3>
                        </div>
                    </div>

                    <div className="text-right pr-4">
                        <Crown className="text-amber-400 opacity-20" size={64} />
                    </div>
                </div>

                {/* FULL TEAM TABLE */}
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-black text-white">
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-left w-12 border border-black">N°</th>
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-left border border-black">Enseignant</th>
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-left border border-black">Discipline / Matière</th>
                            {withEmargement && (
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center w-40 border border-black">Émargement / Visa</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {team.length > 0 ? team.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b border-gray-100">
                                <td className="p-4 text-[11px] font-black border border-black">{idx + 1}</td>
                                <td className="p-4 text-[11px] font-black uppercase border border-black">
                                    {item.InscriptionPersonnel?.nom} {item.InscriptionPersonnel?.prenom}
                                </td>
                                <td className="p-4 text-[11px] font-bold border border-black">
                                    {item.RepartitionMatiere?.Matiere?.libelleFr}
                                </td>
                                {withEmargement && (
                                    <td className="p-4 border border-black h-16"></td>
                                )}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={withEmargement ? 4 : 3} className="p-20 text-center text-gray-300 font-black uppercase tracking-widest italic">
                                    Aucune affectation enregistrée
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* SIGNATURES */}
                <div className="mt-auto pt-20 grid grid-cols-2 gap-20">
                    <div className="text-center space-y-20">
                        <p className="text-[10px] font-black uppercase underline">Le Professeur Principal</p>
                        <div className="w-40 h-px bg-gray-300 mx-auto" />
                    </div>
                    <div className="text-center space-y-20">
                        <p className="text-[10px] font-black uppercase underline">Le Chef d'Établissement</p>
                        <div className="w-40 h-px bg-gray-300 mx-auto" />
                    </div>
                </div>

                <footer className="mt-20 pt-8 border-t border-gray-100 flex justify-between items-center opacity-30">
                    <p className="text-[8px] font-black uppercase tracking-widest">Scholar Pedagogy Management System — v3.1</p>
                    <p className="text-[8px] font-bold uppercase">Généré le {new Date().toLocaleDateString()}</p>
                </footer>
            </div>

            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    body { margin: 0; }
                    .no-print-bg { background-color: white !important; }
                }
            `}</style>
        </div>
    );
};

export default TeacherTeamPrintPage;
