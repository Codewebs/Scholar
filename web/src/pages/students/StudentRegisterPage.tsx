import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSchoolYear } from '../../context/SchoolYearContext';
import { studentService, StudentRegistrationPayload } from '../../api/studentService';
import AuthInput from '../../components/ui/AuthInput';
import AuthButton from '../../components/ui/AuthButton';
import {
  ArrowLeft,
  User,
  Users,
  MapPin,
  GraduationCap,
  Save,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';
import { clsx } from 'clsx';

const StudentRegisterPage: React.FC = () => {
  const { selectedYear } = useSchoolYear();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<Partial<StudentRegistrationPayload>>({
    nom: '',
    prenom: '',
    dateNaissance: '',
    lieuNaissance: '',
    sexe: 'M',
    idSalle: 0,
    nouveau: true,
    ancienEtablissement: '',
    quartier: ''
  });

  useEffect(() => {
    const yId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;
    if (yId) {
      console.log("[StudentRegister] Loading rooms for YearID:", yId);
      loadRooms(yId);
      if (editId) {
        console.log("[StudentRegister] Loading student data for EditID:", editId);
        loadStudentData(Number(editId));
      }
    }
  }, [selectedYear, editId]);

  const loadRooms = async (yId: number) => {
    try {
      const res = await studentService.getRooms(yId);
      console.log("[StudentRegister] Rooms loaded:", res.data.length);
      setRooms(res.data);
    } catch (error) {
      console.error("[StudentRegister] Error loading rooms:", error);
    }
  };

  const loadStudentData = async (id: number) => {
    try {
      const res = await studentService.getStudent(id);
      const student = res.data;
      console.log("[StudentRegister] Student data loaded:", student.nomComplet);
      setFormData({
        nom: student.nom || student.nomComplet.split(' ')[0],
        prenom: student.prenom || student.nomComplet.split(' ').slice(1).join(' '),
        dateNaissance: student.dateNaissance?.split('T')[0] || '',
        lieuNaissance: student.lieuNaissance || '',
        sexe: student.sexe,
        idSalle: student.idSalle,
        nouveau: false,
        quartier: student.quartier || ''
      });
    } catch (error) {
      console.error("[StudentRegister] Error loading student data:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const yId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;
    if (!yId || !formData.idSalle) {
        console.warn("[StudentRegister] Submit aborted: Missing YearID or RoomID");
        return;
    }

    setLoading(true);
    console.log("[StudentRegister] Submitting form. Mode:", editId ? "Edit" : "Create");
    try {
      if (editId) {
        await studentService.updateStudent(Number(editId), {
            ...formData,
            idAnneeScolaire: yId,
          } as StudentRegistrationPayload);
        console.log("[StudentRegister] Update success");
      } else {
        await studentService.registerAndEnroll({
            ...formData,
            idAnneeScolaire: yId,
          } as StudentRegistrationPayload);
        console.log("[StudentRegister] Registration success");
      }
      setSuccess(true);
      if (!editId) {
        setFormData({ nom: '', prenom: '', dateNaissance: '', lieuNaissance: '', sexe: 'M', idSalle: 0, nouveau: true });
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("[StudentRegister] Operation failed:", error);
      alert("Erreur lors de l'opération");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof StudentRegistrationPayload, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-black uppercase tracking-tighter">
            {editId ? "Modification d'Élève" : "Inscription d'Élève"}
          </h1>
        </div>
        {success && (
          <div className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-sharp animate-in zoom-in-95">
            <CheckCircle2 size={18} className="mr-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">
                {editId ? "Modifié avec succès" : "Inscrit avec succès"}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Civil Status */}
        <div className="card p-8 space-y-8">
          <div className="flex items-center space-x-3 text-black">
             <User size={20} className="text-accent" />
             <h3 className="text-sm font-black uppercase tracking-widest">État Civil</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AuthInput
              label="Nom de l'élève *"
              value={formData.nom}
              onChange={(e) => handleInputChange('nom', e.target.value)}
              required
            />
            <AuthInput
              label="Prénom(s)"
              value={formData.prenom}
              onChange={(e) => handleInputChange('prenom', e.target.value)}
            />
            <AuthInput
              label="Date de Naissance *"
              type="date"
              value={formData.dateNaissance}
              onChange={(e) => handleInputChange('dateNaissance', e.target.value)}
              required
            />
            <AuthInput
              label="Lieu de Naissance *"
              value={formData.lieuNaissance}
              onChange={(e) => handleInputChange('lieuNaissance', e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] ml-1">Sexe *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleInputChange('sexe', 'M')}
                  className={clsx(
                    "h-14 border rounded-sharp font-bold text-xs uppercase tracking-widest transition-all",
                    formData.sexe === 'M' ? "bg-black text-white" : "border-border text-secondary"
                  )}
                >Masculin</button>
                <button
                  type="button"
                  onClick={() => handleInputChange('sexe', 'F')}
                  className={clsx(
                    "h-14 border rounded-sharp font-bold text-xs uppercase tracking-widest transition-all",
                    formData.sexe === 'F' ? "bg-black text-white" : "border-border text-secondary"
                  )}
                >Féminin</button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Schooling Info */}
        <div className="card p-8 space-y-8">
          <div className="flex items-center space-x-3 text-black">
             <GraduationCap size={20} className="text-accent" />
             <h3 className="text-sm font-black uppercase tracking-widest">Scolarité</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] ml-1">Classe d'Affectation *</label>
              <select
                className="input-field appearance-none cursor-pointer font-bold"
                value={formData.idSalle}
                onChange={(e) => handleInputChange('idSalle', Number(e.target.value))}
                required
              >
                <option value="0">Sélectionner une salle...</option>
                {rooms.map(room => (
                  <option key={room.idServeur} value={room.idServeur}>{room.nomSalle}</option>
                ))}
              </select>
            </div>

            <AuthInput
              label="Ancien Établissement"
              value={formData.ancienEtablissement}
              onChange={(e) => handleInputChange('ancienEtablissement', e.target.value)}
              placeholder="Si ré-inscription"
            />
          </div>
        </div>

        {/* Section 3: Family/Tutor (Optional but mapped) */}
        <div className="card p-8 space-y-8">
          <div className="flex items-center space-x-3 text-black">
             <Users size={20} className="text-accent" />
             <h3 className="text-sm font-black uppercase tracking-widest">Parents / Tuteurs</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AuthInput label="Nom du Père" value={formData.nomPere} onChange={(e) => handleInputChange('nomPere', e.target.value)} />
            <AuthInput label="Téléphone Père" type="tel" value={formData.telephonePere} onChange={(e) => handleInputChange('telephonePere', e.target.value)} />
            <AuthInput label="Nom de la Mère" value={formData.nomMere} onChange={(e) => handleInputChange('nomMere', e.target.value)} />
            <AuthInput label="Téléphone Mère" type="tel" value={formData.telephoneMere} onChange={(e) => handleInputChange('telephoneMere', e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end pt-4">
           <AuthButton
             type="submit"
             className="md:w-auto px-12"
             disabled={loading || !formData.idSalle}
           >
             {loading ? "Opération en cours..." : (
               <span className="flex items-center">
                 <Save size={20} className="mr-2" />
                 {editId ? "Enregistrer les modifications" : "Valider l'Inscription"}
               </span>
             )}
           </AuthButton>
        </div>
      </form>
    </div>
  );
};

export default StudentRegisterPage;
