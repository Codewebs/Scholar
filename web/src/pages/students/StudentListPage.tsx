import React, { useState, useEffect, useMemo } from 'react';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { studentService } from '../../api/studentService';
import { financeService } from '../../api/financeService';
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
  Printer,
  FileDown
} from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import RegistrationReceipt from '../../components/students/RegistrationReceipt';

const StudentListPage: React.FC = () => {
  const { selectedYear } = useSchoolYear();
  const [students, setStudents] = useState<EleveUiModel[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Receipt state
  const [receiptData, setReceiptData] = useState<any>(null);

  // Transfer state
  const [transferringStudent, setTransferringStudent] = useState<EleveUiModel | null>(null);
  const [targetRoom, setTargetRoom] = useState<number>(0);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  useEffect(() => {
    if (selectedYear) {
      loadRooms();
      loadStudents();
    }
  }, [selectedYear, selectedRoom]);

  const loadRooms = async () => {
    const yId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;
    if (!yId) return;
    try {
      const res = await studentService.getRooms(yId);
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
      const res = selectedRoom > 0
        ? await studentService.getStudentsByRoom(yId, selectedRoom)
        : await studentService.getAllStudents(yId);
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

    if (student.hasGrades || student.hasAnyPayment) {
        alert("Impossible de retirer cet élève : il possède des notes ou des paiements actifs pour cette année scolaire.");
        return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir retirer l'élève ${student.nomComplet} de cette année scolaire ?`)) {
      try {
        await studentService.deleteEnrollment(student.idEleve, yId);
        loadStudents();
      } catch (error: any) {
        alert(error.response?.data?.error || "Erreur lors de la suppression de l'inscription");
      }
    }
  };

  const handleTransfer = async () => {
    const yId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;
    if (!yId || !transferringStudent || !targetRoom) return;

    setLoading(true);
    try {
        await studentService.updateStudent(transferringStudent.idEleve, {
            ...transferringStudent,
            idSalle: targetRoom,
            idAnneeScolaire: yId,
            nom: transferringStudent.nom || transferringStudent.nomComplet.split(' ')[0],
            prenom: transferringStudent.prenom || transferringStudent.nomComplet.split(' ').slice(1).join(' '),
            nouveau: false
        } as any);
        setIsTransferModalOpen(false);
        loadStudents();
    } catch (error: any) {
        console.error("[StudentList] Transfer failed:", error);
        const apiError = error.response?.data?.error || error.message || "Une erreur inconnue est survenue";
        alert(`Erreur lors du transfert : ${apiError}`);
    } finally {
        setLoading(false);
    }
  };

  const handlePrintReceipt = async (student: EleveUiModel) => {
    const yId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;
    if (!yId) return;
    try {
        const res = await financeService.getRegistrationReceiptSimple(student.idEleve, yId);
        setReceiptData(res.data);
    } catch (error) {
        alert("Erreur lors de la récupération de la fiche d'inscription");
    }
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const roomLabel = selectedRoom > 0 ? rooms.find(r => r.idServeur === selectedRoom)?.nomSalle : "Tous les élèves";

    const content = `
      <html>
        <head>
          <title>Liste des élèves - ${roomLabel}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; font-size: 10px; }
            th { background-color: #f2f2f2; text-transform: uppercase; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { margin: 0; text-transform: uppercase; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Liste des élèves - ${selectedYear?.libelleAnneeScolaire}</h1>
            <p>${roomLabel}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Matricule</th>
                <th>Nom Complet</th>
                <th>Sexe</th>
                <th>Classe / Salle</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              ${filteredStudents.map(s => `
                <tr>
                  <td>${s.matricule}</td>
                  <td>${s.nomComplet}</td>
                  <td>${s.sexe}</td>
                  <td>${s.classeLabel} ${s.salleLabel}</td>
                  <td>${s.statutInscription}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  const filteredStudents = useMemo(() => {
    let result = students.filter(s =>
      s.nomComplet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.matricule.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Default sort by dateInscription DESC (most recent)
    result.sort((a, b) => {
        const dateA = new Date(a.dateInscription || 0).getTime();
        const dateB = new Date(b.dateInscription || 0).getTime();
        return dateB - dateA;
    });

    return result;
  }, [students, searchQuery]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {receiptData && (
          <RegistrationReceipt data={receiptData} onClose={() => setReceiptData(null)} />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Gestion des Élèves</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] mt-1">
            {filteredStudents.length} élèves inscrits pour {selectedYear?.libelleAnneeScolaire}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-2 px-4 py-2 border border-border rounded-sharp hover:bg-gray-50 transition-colors text-[10px] font-black uppercase tracking-widest"
          >
            <FileDown size={16} />
            <span>Exporter Liste</span>
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
                className="input-field pl-12 cursor-pointer font-bold"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(Number(e.target.value))}
            >
                <option value="0">Toutes les classes</option>
                {rooms.map(room => (
                    <option key={room.idSalle} value={room.idSalle}>
                        {room.Classe?.libelleClasseFr} {room.nomSalle}
                    </option>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
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
                      {student.classeLabel} {student.salleLabel}
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
                      title="Fiche d'Inscription"
                    >
                      <FileText size={16} />
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
                    to={`/app/finance/payments?idEleve=${student.idEleve}&highlight=true`}
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
                  <p className="text-xs font-black uppercase tracking-widest text-[#9E9E9E] mb-8 leading-relaxed">
                      Déplacer {transferringStudent?.nomComplet} vers une autre salle.<br/>
                      <span className="text-red-500 font-bold italic underline">Note :</span> Le transfert n'est possible que si l'élève n'a pas de notes ni de paiements actifs.
                  </p>

                  <div className="space-y-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] ml-1">Nouvelle Salle</label>
                        <select
                            className="w-full h-14 px-4 bg-white border border-gray-100 rounded-sharp text-sm font-bold focus:border-black focus:ring-1 focus:ring-black outline-none transition-all cursor-pointer"
                            value={targetRoom}
                            onChange={(e) => setTargetRoom(Number(e.target.value))}
                        >
                            <option value="0">Sélectionner...</option>
                            {rooms.map(r => (
                                <option key={r.idSalle} value={r.idSalle}>
                                    {r.Classe?.libelleClasseFr} {r.nomSalle}
                                </option>
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
