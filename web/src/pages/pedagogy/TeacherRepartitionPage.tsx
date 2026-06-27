import React, { useEffect, useState } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { repartitionEnseignantService } from '../../api/repartitionEnseignantService';
import { studentService } from '../../api/studentService';
import {
    Search,
    User,
    Crown,
    BookOpen,
    Trash2,
    Printer,
    ChevronRight,
    Plus,
    AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const TeacherRepartitionPage: React.FC = () => {
  const { selectedYear } = useSchoolYear();
  const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;

  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const [teachers, setTeachers] = useState<any[]>([]);
  const [searchTeacher, setSearchTeacher] = useState('');

  const [roomData, setRoomData] = useState<{
    salle: any;
    subjects: any[];
    assignments: any[];
  } | null>(null);

  const [draggedTeacher, setDraggedTeacher] = useState<any | null>(null);

  useEffect(() => {
    if (yearId) {
      loadInitialData();
    }
  }, [yearId]);

  useEffect(() => {
    if (yearId && selectedRoomId) {
      loadRoomAssignments();
    }
  }, [yearId, selectedRoomId]);

  const loadInitialData = async () => {
    try {
      const [roomsRes, teachersRes] = await Promise.all([
        studentService.getRooms(yearId!),
        repartitionEnseignantService.getTeachersPool(yearId!)
      ]);
      setRooms(roomsRes.data);
      setTeachers(teachersRes.data);
      if (roomsRes.data.length > 0 && !selectedRoomId) {
        setSelectedRoomId(roomsRes.data[0].idSalle);
      }
    } catch (err) {
      console.error("Error loading initial data", err);
    }
  };

  const loadRoomAssignments = async () => {
    try {
      const res = await repartitionEnseignantService.getRoomAssignments(selectedRoomId!, yearId!);
      setRoomData(res.data);
    } catch (err) {
      console.error("Error loading room assignments", err);
    }
  };

  const handleAssign = async (target: { idRepartitionMatiere?: number, isPrincipal?: boolean }) => {
    if (!draggedTeacher || !selectedRoomId || !yearId) return;

    try {
      await repartitionEnseignantService.assignTeacher({
        idInscriptionPersonnel: draggedTeacher.idInscriptionPersonnel,
        idSalle: selectedRoomId,
        idRepartitionMatiere: target.idRepartitionMatiere,
        isPrincipal: target.isPrincipal,
        idAnneeScolaire: yearId
      });
      loadRoomAssignments();
      loadInitialData(); // To refresh counts
    } catch (err) {
      console.error("Assignment error", err);
    }
  };

  const removeAssignment = async (id: number) => {
    try {
      await repartitionEnseignantService.removeAssignment(id);
      loadRoomAssignments();
      loadInitialData();
    } catch (err) {
      console.error("Remove error", err);
    }
  };

  const filteredTeachers = teachers.filter(t =>
    `${t.nom} ${t.prenom}`.toLowerCase().includes(searchTeacher.toLowerCase()) ||
    (t.Utilisateur?.diplomes || '').toLowerCase().includes(searchTeacher.toLowerCase())
  );

  const principalTeacher = roomData?.assignments.find(a => a.isPrincipal);

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6 animate-in fade-in duration-500">
      {/* LEFT PANEL: TEACHERS POOL */}
      <div className="w-[380px] bg-white rounded-[40px] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-8 border-b border-gray-50">
           <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-3">
             <User size={18} className="text-accent" />
             Vivier Enseignants
           </h3>
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Nom ou spécialité..."
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-accent transition-all"
                value={searchTeacher}
                onChange={e => setSearchTeacher(e.target.value)}
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
           {filteredTeachers.map(t => (
             <motion.div
               key={t.idInscriptionPersonnel}
               draggable
               onDragStart={() => setDraggedTeacher(t)}
               className={clsx(
                 "p-4 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group",
                 draggedTeacher?.idInscriptionPersonnel === t.idInscriptionPersonnel && "opacity-50"
               )}
             >
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                    {t.photo ? <img src={t.photo} className="w-full h-full object-cover" /> : <User size={24} className="text-gray-300" />}
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black uppercase truncate">{t.nom} {t.prenom}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight truncate">{t.Utilisateur?.diplomes || 'Non renseigné'}</p>
                 </div>
                 <div className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-[9px] font-black">
                   {t.assignmentCount} {t.assignmentCount > 1 ? 'salles' : 'salle'}
                 </div>
               </div>
             </motion.div>
           ))}
        </div>
      </div>

      {/* RIGHT PANEL: ROOM PLAN */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {/* ROOM SELECTOR & HEADER */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Sélectionner la salle</p>
                 <select
                   className="h-14 px-6 bg-gray-50 border-none rounded-2xl font-black text-xs uppercase tracking-widest focus:ring-2 focus:ring-accent outline-none"
                   value={selectedRoomId || ''}
                   onChange={e => setSelectedRoomId(Number(e.target.value))}
                 >
                   {rooms.map(r => (
                     <option key={r.idSalle} value={r.idSalle}>{r.Classe?.libelleClasseFr} {r.nomSalle}</option>
                   ))}
                 </select>
              </div>
              <div className="h-10 w-px bg-gray-100" />
              <div>
                 <h2 className="text-2xl font-black uppercase tracking-tighter">Répartition de la salle</h2>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gestion de l'équipe pédagogique</p>
              </div>
           </div>

           <div className="flex gap-3">
              <button
                onClick={() => window.open(`/app/pedagogy/teachers-repartition/print?idSalle=${selectedRoomId}&emargement=false`, '_blank')}
                className="p-4 bg-gray-50 text-gray-600 rounded-2xl hover:bg-black hover:text-white transition-all shadow-sm"
              >
                <Printer size={20} />
              </button>
              <button
                onClick={() => window.open(`/app/pedagogy/teachers-repartition/print?idSalle=${selectedRoomId}&emargement=true`, '_blank')}
                className="flex items-center gap-3 px-6 py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
              >
                <Printer size={18} /> Liste Émargement
              </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
            {/* 1. ZONE ENSEIGNANT PRINCIPAL (LE TRÔNE) */}
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleAssign({ isPrincipal: true })}
              className={clsx(
                "relative p-10 rounded-[48px] border-4 border-dashed transition-all flex flex-col items-center justify-center text-center group min-h-[220px]",
                principalTeacher
                  ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
                  : "bg-gray-50 border-gray-200 hover:border-accent hover:bg-accent/5"
              )}
            >
               <div className="absolute top-6 left-1/2 -translate-x-1/2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <Crown size={120} />
               </div>

               {principalTeacher ? (
                 <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3 bg-amber-500 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mx-auto w-fit">
                       <Crown size={14} /> Enseignant Principal
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="w-24 h-24 rounded-[32px] bg-white shadow-2xl border-4 border-white overflow-hidden">
                          {principalTeacher.InscriptionPersonnel?.photo ? <img src={principalTeacher.InscriptionPersonnel.photo} className="w-full h-full object-cover" /> : <User size={48} className="text-gray-100 mt-4 mx-auto" />}
                       </div>
                       <div className="text-left">
                          <h3 className="text-3xl font-black uppercase tracking-tighter text-black">{principalTeacher.InscriptionPersonnel?.nom} {principalTeacher.InscriptionPersonnel?.prenom}</h3>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Désigné pour coordonner la salle</p>
                          <button
                            onClick={() => removeAssignment(principalTeacher.idRepartitionEnseignant)}
                            className="mt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors"
                          >
                             <Trash2 size={14} /> Retirer le trône
                          </button>
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="relative z-10 space-y-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mx-auto text-gray-300">
                       <Plus size={32} />
                    </div>
                    <div>
                       <p className="text-lg font-black uppercase tracking-tight text-gray-400 italic">Le Trône est vacant</p>
                       <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-1">Glissez un enseignant ici pour le nommer Enseignant Principal</p>
                    </div>
                 </div>
               )}
            </div>

            {/* 2. GRILLE DES DISCIPLINES */}
            <div className="bg-white p-10 rounded-[56px] border border-gray-100 shadow-sm">
                <h3 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
                   <BookOpen size={24} className="text-accent" />
                   Équipe Pédagogique (Matières)
                </h3>

                {roomData?.subjects.length === 0 ? (
                  <div className="p-20 bg-red-50 rounded-[40px] border-2 border-dashed border-red-100 text-center space-y-4">
                     <AlertCircle size={48} className="mx-auto text-red-300" />
                     <div>
                        <p className="text-lg font-black uppercase tracking-tight text-red-900">Aucune matière affectée</p>
                        <p className="text-xs font-bold text-red-400 uppercase tracking-widest mt-1">Veuillez d'abord configurer la structure de cette classe</p>
                     </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                     {roomData?.subjects.map(subject => {
                        const assigned = roomData.assignments.find(a => a.idRepartitionMatiere === subject.idRepartitionMatiere);
                        return (
                          <div
                            key={subject.idRepartitionMatiere}
                            onDragOver={e => e.preventDefault()}
                            onDrop={() => handleAssign({ idRepartitionMatiere: subject.idRepartitionMatiere })}
                            className={clsx(
                              "group flex items-center gap-6 p-6 rounded-[32px] border-2 transition-all",
                              assigned ? "bg-white border-gray-100" : "bg-gray-50 border-dashed border-gray-200 hover:border-accent hover:bg-accent/5"
                            )}
                          >
                             <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center font-black text-lg shadow-lg">
                                {subject.Matiere?.code || subject.Matiere?.libelleFr?.substring(0,2).toUpperCase()}
                             </div>

                             <div className="flex-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{subject.GroupeMatiere?.libelleFr || 'Général'}</p>
                                <h4 className="text-lg font-black uppercase tracking-tight">{subject.Matiere?.libelleFr}</h4>
                             </div>

                             <div className="flex items-center gap-4 min-w-[300px] justify-end">
                                {assigned ? (
                                  <div className="flex items-center gap-4 bg-gray-50 pl-4 pr-2 py-2 rounded-full border border-gray-100">
                                     <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 overflow-hidden shadow-sm">
                                           {assigned.InscriptionPersonnel?.photo ? <img src={assigned.InscriptionPersonnel.photo} className="w-full h-full object-cover" /> : <User size={16} className="text-gray-200 mt-1.5 mx-auto" />}
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-tight truncate max-w-[150px]">
                                          {assigned.InscriptionPersonnel?.nom} {assigned.InscriptionPersonnel?.prenom}
                                        </span>
                                     </div>
                                     <button
                                       onClick={() => removeAssignment(assigned.idRepartitionEnseignant)}
                                       className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                     >
                                        <Trash2 size={16} />
                                     </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 italic group-hover:text-accent transition-colors">
                                     <span>Déposer l'enseignant ici</span>
                                     <ChevronRight size={14} className="animate-pulse" />
                                  </div>
                                )}
                             </div>
                          </div>
                        );
                     })}
                  </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherRepartitionPage;
