import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  CalendarDays,
  Search,
  History
} from 'lucide-react';
import { clsx } from 'clsx';

const StudentRegisterPage: React.FC = () => {
  const { selectedYear } = useSchoolYear();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('edit');

  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<Partial<StudentRegistrationPayload>>({
    nom: '',
    prenom: '',
    dateNaissance: '',
    lieuNaissance: '',
    sexe: 'M',
    idSalle: 0,
    nouveau: true,
    ancienEtablissement: '',
    quartier: '',
    nomPere: '',
    telephonePere: undefined,
    nomMere: '',
    telephoneMere: undefined
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        nom: student.nom || '',
        prenom: student.prenom || '',
        dateNaissance: student.dateNaissance?.split('T')[0] || '',
        lieuNaissance: student.lieuNaissance || '',
        sexe: student.sexe || 'M',
        idSalle: student.idSalle || 0,
        nouveau: false,
        quartier: student.quartier || '',
        nomPere: student.nomPere || '',
        telephonePere: student.telephonePere || undefined,
        nomMere: student.nomMere || '',
        telephoneMere: student.telephoneMere || undefined
      });
    } catch (error) {
      console.error("[StudentRegister] Error loading student data:", error);
    }
  };

  const handleNomChange = async (val: string) => {
      handleInputChange('nom', val);
      const yId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;
      if (val.length >= 3 && yId && !editId) {
          try {
              const res = await studentService.globalSearch(val, yId);
              setSuggestions(res.data);
              setShowSuggestions(true);
          } catch (e) {
              console.error("Search error", e);
          }
      } else {
          setSuggestions([]);
          setShowSuggestions(false);
      }
  };

  const selectStudent = (student: any) => {
      if (student.isInscribed) {
          if (window.confirm(`${student.nomComplet} est déjà inscrit cette année en ${student.classeLabel}. Voulez-vous aller sur sa fiche ?`)) {
              navigate(`/app/students/register?edit=${student.idEleve}`);
          }
          setShowSuggestions(false);
          return;
      }

      setFormData({
          ...formData,
          nom: student.nom || '',
          prenom: student.prenom || '',
          dateNaissance: student.dateNaissance?.split('T')[0] || '',
          lieuNaissance: student.lieuNaissance || '',
          sexe: student.sexe || 'M',
          quartier: student.quartier || '',
          nomPere: student.nomPere || '',
          telephonePere: student.telephonePere || undefined,
          nomMere: student.nomMere || '',
          telephoneMere: student.telephoneMere || undefined,
          nouveau: false
      });
      setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const yId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;
    if (!yId || !formData.idSalle) {
        console.warn("[StudentRegister] Submit aborted: Missing YearID or RoomID");
        alert("Veuillez sélectionner une salle d'affectation.");
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
        setFormData({
            nom: '', prenom: '', dateNaissance: '', lieuNaissance: '', sexe: 'M', idSalle: 0, nouveau: true,
            ancienEtablissement: '', quartier: '', nomPere: '', telephonePere: undefined, nomMere: '', telephoneMere: undefined
        });
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error("[StudentRegister] Operation failed:", error);
      const apiError = error.response?.data?.error || error.message || "Une erreur inconnue est survenue";
      alert(`Erreur lors de l'opération : ${apiError}`);
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
            <div className="relative" ref={suggestionRef}>
                <AuthInput
                label="Nom de l'élève *"
                value={formData.nom}
                onChange={(e) => handleNomChange(e.target.value)}
                required
                autoComplete="off"
                />
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden max-h-64 overflow-y-auto animate-in slide-in-from-top-2 duration-300">
                        {suggestions.map(s => (
                            <div
                                key={s.idEleve}
                                onClick={() => selectStudent(s)}
                                className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center justify-between group"
                            >
                                <div>
                                    <p className="font-black text-xs uppercase text-black">{s.nom} {s.prenom}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{s.sexe === 'M' ? 'Garçon' : 'Fille'}</span>
                                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Né(e) le {s.dateNaissance}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {s.isInscribed ? (
                                        <span className="text-[7px] font-black uppercase tracking-widest bg-green-100 text-green-600 px-2 py-1 rounded-full flex items-center gap-1">
                                            <CheckCircle2 size={8} /> Inscrit en {s.classeLabel}
                                        </span>
                                    ) : (
                                        <span className="text-[7px] font-black uppercase tracking-widest bg-orange-100 text-orange-600 px-2 py-1 rounded-full flex items-center gap-1">
                                            <History size={8} /> Ancien Élève
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

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
              <label className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] ml-1">Sexe <span className="text-red-500 font-black">*</span></label>
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

            <AuthInput
              label="Quartier"
              value={formData.quartier}
              onChange={(e) => handleInputChange('quartier', e.target.value)}
            />
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
              <label className="text-[10px] font-black uppercase tracking-widest text-[#9E9E9E] ml-1">
                Classe d'Affectation <span className="text-red-500 font-black">*</span>
              </label>
              <select
                className="w-full h-14 px-4 bg-white border border-gray-100 rounded-sharp text-sm font-bold focus:border-black focus:ring-1 focus:ring-black outline-none transition-all cursor-pointer"
                value={formData.idSalle}
                onChange={(e) => handleInputChange('idSalle', Number(e.target.value))}
                required
              >
                <option value="0">Sélectionner une salle...</option>
                {rooms.map(room => (
                  <option key={room.idSalle} value={room.idSalle}>
                    {room.Classe?.libelleClasseFr} {room.nomSalle}
                  </option>
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
