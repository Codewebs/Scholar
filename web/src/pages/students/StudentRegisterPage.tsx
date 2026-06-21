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
  History,
  Info,
  AlertCircle,
  X
} from 'lucide-react';
import { clsx } from 'clsx';

const StudentRegisterPage: React.FC = () => {
  const { selectedYear } = useSchoolYear();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('edit');

  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', studentId?: number } | null>(null);

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
    telephoneMere: undefined,
    nomTuteur: '',
    telephoneTuteur: undefined
  });

  // Parent Direct logic (Mandatory section)
  const [parentType, setParentType] = useState<'Père' | 'Mère' | 'Tuteur'>('Père');
  const [parentDirectNom, setParentDirectNom] = useState('');
  const [parentDirectTel, setParentDirectTel] = useState('');

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
      loadRooms(yId);
      if (editId) {
        loadStudentData(Number(editId));
      }
    }
  }, [selectedYear, editId]);

  // Sync parentDirect to formData
  useEffect(() => {
      if (parentType === 'Père') {
          setFormData(prev => ({ ...prev, nomPere: parentDirectNom, telephonePere: parentDirectTel ? Number(parentDirectTel) : undefined }));
      } else if (parentType === 'Mère') {
          setFormData(prev => ({ ...prev, nomMere: parentDirectNom, telephoneMere: parentDirectTel ? Number(parentDirectTel) : undefined }));
      } else {
          setFormData(prev => ({ ...prev, nomTuteur: parentDirectNom, telephoneTuteur: parentDirectTel ? Number(parentDirectTel) : undefined }));
      }
  }, [parentDirectNom, parentDirectTel, parentType]);

  const loadRooms = async (yId: number) => {
    try {
      const res = await studentService.getRooms(yId);
      setRooms(res.data);
    } catch (error) {
      console.error("[StudentRegister] Error loading rooms:", error);
    }
  };

  const loadStudentData = async (id: number) => {
    try {
      const res = await studentService.getStudent(id);
      const student = res.data;

      if (student.nomPere) {
          setParentType('Père'); setParentDirectNom(student.nomPere); setParentDirectTel(student.telephonePere?.toString() || '');
      } else if (student.nomMere) {
          setParentType('Mère'); setParentDirectNom(student.nomMere); setParentDirectTel(student.telephoneMere?.toString() || '');
      } else if (student.nomTuteur) {
          setParentType('Tuteur'); setParentDirectNom(student.nomTuteur); setParentDirectTel(student.telephoneTuteur?.toString() || '');
      }

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
        telephoneMere: student.telephoneMere || undefined,
        nomTuteur: student.nomTuteur || '',
        telephoneTuteur: student.telephoneTuteur || undefined
      });
    } catch (error) {
      console.error("[StudentRegister] Error loading student data:", error);
    }
  };

  const handleInputChange = (field: keyof StudentRegistrationPayload, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          showToast(`${student.nomComplet} est déjà inscrit cette année.`, 'error');
          if (window.confirm(`${student.nomComplet} est déjà inscrit cette année en ${student.classeLabel}. Voulez-vous aller sur sa fiche ?`)) {
              navigate(`/app/students/register?edit=${student.idEleve}`);
          }
          setShowSuggestions(false);
          return;
      }

      if (student.nomPere) {
          setParentType('Père'); setParentDirectNom(student.nomPere); setParentDirectTel(student.telephonePere?.toString() || '');
      } else if (student.nomMere) {
          setParentType('Mère'); setParentDirectNom(student.nomMere); setParentDirectTel(student.telephoneMere?.toString() || '');
      } else {
          setParentType('Tuteur'); setParentDirectNom(student.nomTuteur || ''); setParentDirectTel(student.telephoneTuteur?.toString() || '');
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
          nomTuteur: student.nomTuteur || '',
          telephoneTuteur: student.telephoneTuteur || undefined,
          nouveau: false
      });
      setShowSuggestions(false);
      showToast("Données de l'ancien élève chargées", 'success');
  };

  const showToast = (message: string, type: 'success' | 'error', studentId?: number) => {
      setToast({ message, type, studentId });
      setTimeout(() => setToast(null), 8000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const yId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;

    if (!yId || !formData.idSalle) {
        showToast("Veuillez sélectionner une salle d'affectation.", 'error');
        return;
    }

    if (!parentDirectNom || !parentDirectTel) {
        showToast("Les informations du responsable principal (Nom et Téléphone) sont obligatoires.", 'error');
        return;
    }

    setLoading(true);
    try {
      let finalStudentId = Number(editId);

      if (editId) {
        await studentService.updateStudent(finalStudentId, {
            ...formData,
            idAnneeScolaire: yId,
          } as StudentRegistrationPayload);
        showToast("Élève mis à jour avec succès", 'success', finalStudentId);
      } else {
        const res = await studentService.registerAndEnroll({
            ...formData,
            idAnneeScolaire: yId,
          } as StudentRegistrationPayload);
        finalStudentId = res.data.idEleve;
        showToast("Inscription validée avec succès", 'success', finalStudentId);
      }

      if (!editId) {
        setFormData({
            nom: '', prenom: '', dateNaissance: '', lieuNaissance: '', sexe: 'M', idSalle: 0, nouveau: true,
            ancienEtablissement: '', quartier: '', nomPere: '', telephonePere: undefined, nomMere: '', telephoneMere: undefined,
            nomTuteur: '', telephoneTuteur: undefined
        });
        setParentDirectNom('');
        setParentDirectTel('');
      }
    } catch (error: any) {
      const apiError = error.response?.data?.error || error.message || "Une erreur inconnue est survenue";
      showToast(apiError, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 relative">

      {/* Snackbar / Toast Notifications */}
      {toast && (
          <div className={clsx(
              "fixed top-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-top-10 duration-500 min-w-[320px]",
              toast.type === 'success' ? "bg-black text-white" : "bg-red-600 text-white"
          )}>
              {toast.type === 'success' ? <CheckCircle2 className="text-green-400" /> : <AlertCircle />}
              <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                      {toast.type === 'success' ? 'Succès' : 'Erreur'}
                  </p>
                  <p className="font-bold text-xs uppercase">{toast.message}</p>
              </div>
              {toast.type === 'success' && toast.studentId && (
                  <button
                    onClick={() => navigate(`/app/finance/payments?idEleve=${toast.studentId}`)}
                    className="px-4 py-2 bg-accent text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"
                  >
                      <CreditCard size={14} />
                      Payer Frais
                  </button>
              )}
              <button onClick={() => setToast(null)} className="p-1 hover:bg-white/10 rounded-full ml-2">
                  <X size={18} />
              </button>
          </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-black uppercase tracking-tighter">
            {editId ? "Modification d'Élève" : "Inscription d'Élève"}
          </h1>
        </div>
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

        {/* Section 2: Parent/Tutor (Mandatory Section) */}
        <div className="card p-8 space-y-8 border-2 border-accent/20">
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-black">
                <Users size={20} className="text-accent" />
                <h3 className="text-sm font-black uppercase tracking-widest">Responsable Principal <span className="text-red-500 font-black">*</span></h3>
              </div>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                  {['Père', 'Mère', 'Tuteur'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setParentType(type as any)}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all",
                            parentType === type ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"
                        )}
                      >{type}</button>
                  ))}
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AuthInput
                label={`Nom du ${parentType} *`}
                value={parentDirectNom}
                onChange={(e) => setParentDirectNom(e.target.value)}
                required
            />
            <AuthInput
                label={`Téléphone ${parentType} *`}
                type="tel"
                value={parentDirectTel}
                onChange={(e) => setParentDirectTel(e.target.value)}
                required
            />
          </div>

          <div className="flex items-start space-x-3 p-4 bg-accent/5 rounded-2xl">
              <Info className="text-accent shrink-0" size={18} />
              <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase tracking-tight">
                  Veuillez renseigner les coordonnées d'au moins un parent ou tuteur légal.
                  Ces informations sont critiques pour le suivi de l'élève et les urgences.
              </p>
          </div>
        </div>

        {/* Section 3: Schooling Info */}
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

        {/* Section 4: Other Parents (Optional) */}
        <div className="card p-8 space-y-8 opacity-60 hover:opacity-100 transition-opacity">
          <div className="flex items-center space-x-3 text-black">
             <Users size={20} className="text-gray-400" />
             <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Autres Responsables (Facultatif)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {parentType !== 'Père' && (
                <>
                    <AuthInput label="Nom du Père" value={formData.nomPere} onChange={(e) => handleInputChange('nomPere', e.target.value)} />
                    <AuthInput label="Téléphone Père" type="tel" value={formData.telephonePere} onChange={(e) => handleInputChange('telephonePere', e.target.value)} />
                </>
            )}
            {parentType !== 'Mère' && (
                <>
                    <AuthInput label="Nom de la Mère" value={formData.nomMere} onChange={(e) => handleInputChange('nomMere', e.target.value)} />
                    <AuthInput label="Téléphone Mère" type="tel" value={formData.telephoneMere} onChange={(e) => handleInputChange('telephoneMere', e.target.value)} />
                </>
            )}
            {parentType !== 'Tuteur' && (
                <>
                    <AuthInput label="Nom du Tuteur" value={formData.nomTuteur} onChange={(e) => handleInputChange('nomTuteur', e.target.value)} />
                    <AuthInput label="Téléphone Tuteur" type="tel" value={formData.telephoneTuteur} onChange={(e) => handleInputChange('telephoneTuteur', e.target.value)} />
                </>
            )}
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
