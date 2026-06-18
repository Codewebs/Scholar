import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { studentService } from '../../api/studentService';
import { EleveUiModel } from '../../types/student';
import {
  Search,
  UserPlus,
  Filter,
  MoreVertical,
  Edit2,
  FileText,
  Trash2,
  Users,
  ChevronRight,
  Download,
  ArrowRightLeft,
  Printer
} from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

const StudentListPage: React.FC = () => {
  const { selectedYear } = useSchoolYear();
  const [students, setStudents] = useState<EleveUiModel[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Transfer state
  const [transferringStudent, setTransferringStudent] = useState<EleveUiModel | null>(null);
  const [targetRoom, setTargetRoom] = useState<number>(0);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  useEffect(() => {
    if (selectedYear) {
      console.log("[StudentList] Loading data for Year:", selectedYear.idServeur || selectedYear.idAnneeScolaire);
      loadRooms();
      loadStudents();
    }
  }, [selectedYear, selectedRoom]);

  const loadRooms = async () => {
    const yId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;
    if (!yId) return;
    try {
      console.log("[StudentList] Fetching rooms for YearID:", yId);
      const res = await studentService.getRooms(yId);
      console.log("[StudentList] Rooms loaded:", res.data.length);
      setRooms(res.data);
    } catch (error) {
      console.error("[StudentList] Error loading rooms:", error);
    }
  };

  const loadStudents = async () => {
    const yId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;
    if (!yId) return;
    setLoading(true);
    try {
      console.log("[StudentList] Fetching students (RoomID:", selectedRoom, ")");
      const res = selectedRoom > 0
        ? await studentService.getStudentsByRoom(yId, selectedRoom)
        : await studentService.getAllStudents(yId);
      console.log("[StudentList] Students loaded:", res.data.length);
      setStudents(res.data);
    } catch (error) {
      console.error("[StudentList] Error loading students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (student: EleveUiModel) => {
    const yId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;
    if (!yId) return;
    console.log("[StudentList] Attempting to delete enrollment for student:", student.idEleve);
    if (window.confirm(`Êtes-vous sûr de vouloir retirer l'élève ${student.nomComplet} de cette année scolaire ?`)) {
      try {
        await studentService.deleteEnrollment(student.idEleve, yId);
        console.log("[StudentList] Delete success");
        loadStudents();
      } catch (error) {
        console.error("[StudentList] Delete failed:", error);
        alert("Erreur lors de la suppression de l'inscription");
      }
    }
  };

  const handleTransfer = async () => {
    const yId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;
    if (!yId || !transferringStudent || !targetRoom) return;

    console.log("[StudentList] Transferring student:", transferringStudent.idEleve, "to Room:", targetRoom);
    if (transferringStudent.hasGrades || transferringStudent.hasAnyPayment) {
        console.warn("[StudentList] Transfer aborted: student has grades or payments");
        alert("Impossible de transférer l'élève car il possède déjà des notes ou des paiements.");
        return;
    }

    try {
        // Logic: Update student with new salle
        await studentService.updateStudent(transferringStudent.idEleve, {
            idSalle: targetRoom,
            idAnneeScolaire: yId,
            nom: transferringStudent.nomComplet.split(' ')[0],
            sexe: transferringStudent.sexe,
            dateNaissance: transferringStudent.dateNaissance || '',
            lieuNaissance: transferringStudent.lieuNaissance || '',
            nouveau: false
        } as any);
        console.log("[StudentList] Transfer success");
        setIsTransferModalOpen(false);
        loadStudents();
    } catch (error) {
        console.error("[StudentList] Transfer failed:", error);
        alert("Erreur lors du transfert");
    }
  };

  const handlePrintReceipt = async (student: EleveUiModel) => {
    const yId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;
    if (!yId) return;
    console.log("[StudentList] Fetching receipt data for student:", student.idEleve);
    try {
        const res = await studentService.getRegistrationReceiptData(student.idEleve, yId);
        console.log("[StudentList] Receipt data received:", res.data);
        alert("Génération du reçu (Simulée) : " + JSON.stringify(res.data).substring(0, 100) + "...");
    } catch (error) {
        console.error("[StudentList] Error fetching receipt:", error);
        alert("Erreur lors de la récupération du reçu");
    }
  };

  const filteredStudents = students.filter(s =>
    s.nomComplet.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.matricule.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Gestion des Élèves</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] mt-1">
            {filteredStudents.length} élèves inscrits pour {selectedYear?.libelleAnneeScolaire}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-border rounded-sharp hover:bg-gray-50 transition-colors text-[10px] font-black uppercase tracking-widest">
            <Download size={16} />
            <span>Exporter PDF</span>
          </button>
          <Link to="/app/students/register" className="btn-primary flex items-center space-x-2">
            <UserPlus size={18} />
            <span>Nouvel Élève</span>
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9E9E9E]" size={20} />
            <input
                type="text"
                placeholder="Rechercher par nom ou matricule..."
                className="input-field pl-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            </div>
            <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9E9E9E]" size={20} />
            <select
                className="input-field pl-12 appearance-none cursor-pointer font-bold"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(Number(e.target.value))}
            >
                <option value="0">Toutes les classes</option>
                {rooms.map(room => (
                <option key={room.idServeur} value={room.idServeur}>{room.nomSalle}</option>
                ))}
            </select>
            </div>
            <div className="bg-black text-white p-4 rounded-sharp flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Garçons / Filles</span>
                <span className="font-black text-xs">
                    {students.filter(s => s.sexe === 'M').length} M / {students.filter(s => s.sexe === 'F').length} F
                </span>
            </div>
        </div>
      </div>

      {/* Student List */}
      {loading ? (
        <div className="p-20 text-center animate-pulse uppercase font-black tracking-widest text-[#9E9E9E]">Chargement de la liste...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
          {filteredStudents.map((student) => (
            <div key={student.idEleve} className="card p-6 flex flex-col justify-between hover:border-accent transition-all group relative overflow-hidden">
               {/* Rare Violet Accent: Pulse indicator for solde */}
               <div className={clsx(
                 "absolute top-4 right-4 w-2.5 h-2.5 rounded-full",
                 student.isSolded ? "bg-green-500" : "bg-accent shadow-[0_0_10px_rgba(124,58,237,0.4)] animate-pulse"
               )} />

               <div className="flex items-start space-x-4 mb-6">
                  <div className="w-14 h-14 bg-black text-white flex items-center justify-center text-xl font-black rounded-soft group-hover:bg-accent transition-colors">
                    {student.nomComplet.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-black text-sm uppercase tracking-tight truncate">{student.nomComplet}</h3>
                    <p className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">{student.matricule}</p>
                    <p className="text-[10px] font-black text-black mt-1 uppercase bg-gray-50 inline-block px-2 py-0.5 rounded-sharp">
                      {student.salleLabel || student.classeLabel}
                    </p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-2 mb-6">
                  <div className="p-3 bg-gray-50 rounded-sharp flex flex-col justify-center">
                    <span className="text-[8px] font-black text-[#9E9E9E] uppercase tracking-widest">Sexe</span>
                    <span className="text-xs font-bold uppercase">{student.sexe === 'M' ? 'Masculin' : 'Féminin'}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-sharp flex flex-col justify-center">
                    <span className="text-[8px] font-black text-[#9E9E9E] uppercase tracking-widest">Statut</span>
                    <span className={clsx(
                      "text-xs font-bold uppercase",
                      student.statutInscription === 'VALIDE' ? "text-green-600" : "text-accent"
                    )}>{student.statutInscription}</span>
                  </div>
               </div>

               <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/app/students/register?edit=${student.idEleve}`}
                      className="p-2 hover:bg-gray-100 rounded-sharp transition-colors text-[#9E9E9E] hover:text-black"
                      title="Modifier"
                    >
                      <Edit2 size={16} />
                    </Link>
                    <button
                      onClick={() => { setTransferringStudent(student); setIsTransferModalOpen(true); }}
                      className="p-2 hover:bg-gray-100 rounded-sharp transition-colors text-[#9E9E9E] hover:text-accent"
                      title="Transférer"
                    >
                      <ArrowRightLeft size={16} />
                    </button>
                    <button
                      onClick={() => handlePrintReceipt(student)}
                      className="p-2 hover:bg-gray-100 rounded-sharp transition-colors text-[#9E9E9E] hover:text-black"
                      title="Imprimer Reçu"
                    >
                      <Printer size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(student)}
                      className="p-2 hover:bg-gray-100 rounded-sharp transition-colors text-[#9E9E9E] hover:text-red-600"
                      title="Retirer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <Link
                    to={`/app/finance/payments?idEleve=${student.idEleve}`}
                    className="flex items-center text-[10px] font-black uppercase tracking-widest text-black hover:text-accent transition-colors"
                  >
                    <span>Fiche Financière</span>
                    <ChevronRight size={14} className="ml-1" />
                  </Link>
               </div>
            </div>
          ))}

          {filteredStudents.length === 0 && (
            <div className="col-span-full p-20 card flex flex-col items-center justify-center text-center space-y-4">
               <Users size={48} className="text-gray-100" />
               <p className="text-sm font-black uppercase tracking-widest text-[#9E9E9E]">Aucun élève trouvé</p>
            </div>
          )}
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-[24px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95">
                  <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Transfert de Salle</h2>
                  <p className="text-xs font-black uppercase tracking-widest text-[#9E9E9E] mb-8">
                      Déplacer {transferringStudent?.nomComplet} vers une autre salle
                  </p>

                  <div className="space-y-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] ml-1">Nouvelle Salle</label>
                        <select
                            className="input-field appearance-none cursor-pointer font-bold"
                            value={targetRoom}
                            onChange={(e) => setTargetRoom(Number(e.target.value))}
                        >
                            <option value="0">Sélectionner...</option>
                            {rooms.map(r => (
                                <option key={r.idServeur} value={r.idServeur}>{r.nomSalle}</option>
                            ))}
                        </select>
                      </div>

                      <div className="flex gap-4 pt-4">
                          <button
                            onClick={() => setIsTransferModalOpen(false)}
                            className="flex-1 py-4 font-black uppercase text-[10px] tracking-[0.2em] border border-border rounded-sharp hover:bg-gray-50"
                          >Annuler</button>
                          <button
                            onClick={handleTransfer}
                            disabled={!targetRoom}
                            className="flex-1 py-4 font-black uppercase text-[10px] tracking-[0.2em] bg-black text-white rounded-sharp hover:opacity-90 disabled:opacity-30"
                          >Confirmer</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default StudentListPage;
