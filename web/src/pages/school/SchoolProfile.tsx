import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { schoolService } from '../../api/schoolService';
import { School } from '../../types/models';
import { AcademicPermission } from '../../types/permissions';
import AuthInput from '../../components/ui/AuthInput';
import AuthButton from '../../components/ui/AuthButton';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  MapPin,
  Phone,
  Globe,
  Mail,
  Camera,
  Save,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Edit3,
  X,
  Hash,
  FileText
} from 'lucide-react';
import { clsx } from 'clsx';

const SchoolProfile: React.FC = () => {
  const { t } = useTranslation();
  const { user, hasPermission } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSchoolId = Number(localStorage.getItem('school_id') || 0);
  const canEdit = hasPermission(AcademicPermission.EDIT_SCHOOL_INFO);

  useEffect(() => {
    if (currentSchoolId) {
      loadSchool();
    }
  }, [currentSchoolId]);

  const loadSchool = async () => {
    setLoading(true);
    try {
      // Use search endpoint for single school if available, or filter from user schools
      const res = await schoolService.getUserSchools(user?.id || 0);
      const current = res.data.find(s => (s.idServeur || s.idEtablissement) === currentSchoolId);
      if (current) setSchool(current);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !canEdit) return;

    setSaving(true);
    try {
      const id = school.idServeur || school.idEtablissement;
      await schoolService.updateSchool(id!, school);
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      alert(t('school.profile.error_update'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !school) return;

    const id = school.idServeur || school.idEtablissement;
    try {
      setSaving(true);
      await schoolService.uploadLogo(id!, file);
      loadSchool(); // Reload to get new logo URL
    } catch (err) {
      alert(t('school.profile.error_logo'));
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof School, value: any) => {
    if (!school) return;
    setSchool({ ...school, [field]: value });
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black uppercase tracking-[0.4em] text-[#9E9E9E] text-[10px]">{t('school.profile.loading')}</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20 p-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-10 rounded-[40px] shadow-xl border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

        <div className="flex items-center space-x-6 relative z-10">
            <button onClick={() => window.history.back()} className="p-4 hover:bg-gray-100 rounded-full transition-all bg-gray-50 text-black shadow-sm">
                <ArrowLeft size={28} />
            </button>
            <div>
                <div className="flex items-center space-x-3 text-accent mb-2">
                    <ShieldCheck size={20} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t('school.profile.identity_title')}</span>
                </div>
                <h1 className="text-4xl font-black uppercase tracking-tighter text-black">{t('school.profile.title')}</h1>
            </div>
        </div>

        <div className="flex items-center space-x-4 relative z-10">
            {canEdit && !isEditing && (
                <button
                    onClick={() => setIsEditing(true)}
                    className="bg-black text-white py-4 px-8 rounded-sharp flex items-center space-x-3 shadow-xl hover:scale-105 active:scale-95 transition-all font-black uppercase text-[10px] tracking-widest"
                >
                    <Edit3 size={18} />
                    <span>{t('school.profile.edit_info')}</span>
                </button>
            )}
            {isEditing && (
                <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-100 text-black py-4 px-8 rounded-sharp flex items-center space-x-3 hover:bg-gray-200 transition-all font-black uppercase text-[10px] tracking-widest"
                >
                    <X size={18} />
                    <span>{t('school.profile.cancel')}</span>
                </button>
            )}
            <div className="bg-blue-50 text-blue-600 px-6 py-4 rounded-sharp border border-blue-100 flex items-center space-x-3 shadow-sm">
                <Zap size={18} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('school.profile.active_status')}</span>
            </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Branding (4 cols) */}
        <div className="lg:col-span-4 space-y-10">
          <div className="bg-white rounded-[48px] p-10 shadow-2xl shadow-gray-200/50 border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-accent"></div>

             <div className="relative group mb-8">
                <div className={clsx(
                    "w-48 h-48 bg-gray-50 border-4 rounded-[40px] flex items-center justify-center overflow-hidden transition-all shadow-inner",
                    isEditing ? "border-dashed border-accent cursor-pointer hover:bg-violet-50" : "border-gray-100"
                )} onClick={() => isEditing && fileInputRef.current?.click()}>
                  {school?.logo ? (
                    <img src={school.logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={80} className="text-gray-200" />
                  )}
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[40px]">
                        <Camera size={32} className="text-white" />
                    </div>
                  )}
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoUpload}
                />
             </div>

             <h2 className="text-2xl font-black uppercase tracking-tighter text-black mb-2">{school?.nomFr}</h2>
             <div className="bg-gray-50 px-4 py-1.5 rounded-full inline-block">
                <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">{school?.abreviation || t('school.profile.no_short_name')}</p>
             </div>

             <div className="w-full mt-10 pt-10 border-t border-gray-50 space-y-6">
                <div className="text-left">
                    <p className="text-[9px] font-black text-[#9E9E9E] uppercase tracking-[0.3em] mb-3 ml-2">{t('school.profile.slogan_devise')}</p>
                    <div className="bg-gray-50 p-6 rounded-[24px] border border-gray-100 italic font-medium text-gray-600 text-sm leading-relaxed">
                        "{school?.deviseFr || t('school.profile.no_devise')}"
                    </div>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-[40px] p-10 shadow-xl border border-gray-100 space-y-6">
            <div className="flex items-center space-x-3 text-blue-600 mb-2">
                <FileText size={20} />
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">{t('school.profile.registration')}</h3>
            </div>
            <AuthInput
              label={t('school.profile.decree_number')}
              value={school?.arrete || ''}
              onChange={(e) => handleInputChange('arrete', e.target.value)}
              disabled={!isEditing}
              icon={Hash}
            />
            <AuthInput
              label={t('school.profile.bp')}
              value={school?.numBp || ''}
              onChange={(e) => handleInputChange('numBp', e.target.value)}
              disabled={!isEditing}
              icon={Mail}
            />
          </div>
        </div>

        {/* Right Columns: Forms (8 cols) */}
        <div className="lg:col-span-8 space-y-10">
          {/* General Information */}
          <div className="bg-white rounded-[48px] p-12 shadow-2xl shadow-gray-200/50 border border-gray-100 space-y-10">
            <div className="flex items-center space-x-4">
               <div className="w-12 h-12 bg-blue-600 rounded-[18px] flex items-center justify-center text-white shadow-lg shadow-blue-100">
                  <Building2 size={24} />
               </div>
               <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-black leading-none">{t('school.profile.official_identity')}</h3>
                  <p className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest mt-2">{t('school.profile.official_identity_sub')}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <AuthInput
                label={t('school.profile.name_fr')}
                value={school?.nomFr || ''}
                onChange={(e) => handleInputChange('nomFr', e.target.value)}
                disabled={!isEditing}
                required
              />
              <AuthInput
                label={t('school.profile.name_en')}
                value={school?.nomEn || ''}
                onChange={(e) => handleInputChange('nomEn', e.target.value)}
                disabled={!isEditing}
              />
              <AuthInput
                label={t('school.profile.short_name')}
                value={school?.abreviation || ''}
                onChange={(e) => handleInputChange('abreviation', e.target.value)}
                disabled={!isEditing}
              />
              <AuthInput
                label={t('school.profile.devise_en')}
                value={school?.deviseEn || ''}
                onChange={(e) => handleInputChange('deviseEn', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-[48px] p-12 shadow-2xl shadow-gray-200/50 border border-gray-100 space-y-10">
            <div className="flex items-center space-x-4">
               <div className="w-12 h-12 bg-green-600 rounded-[18px] flex items-center justify-center text-white shadow-lg shadow-green-100">
                  <MapPin size={24} />
               </div>
               <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-black leading-none">{t('school.profile.contact_title')}</h3>
                  <p className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest mt-2">{t('school.profile.contact_sub')}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <AuthInput
                label={t('school.profile.city')}
                value={school?.ville || ''}
                onChange={(e) => handleInputChange('ville', e.target.value)}
                disabled={!isEditing}
                icon={MapPin}
              />
              <AuthInput
                label={t('school.profile.address')}
                value={school?.adresse || ''}
                onChange={(e) => handleInputChange('adresse', e.target.value)}
                disabled={!isEditing}
              />
              <AuthInput
                label={t('school.profile.phone1')}
                type="tel"
                value={school?.telephone1 || ''}
                onChange={(e) => handleInputChange('telephone1', e.target.value)}
                disabled={!isEditing}
                required
                icon={Phone}
              />
              <AuthInput
                label={t('school.profile.phone2')}
                type="tel"
                value={school?.telephone2 || ''}
                onChange={(e) => handleInputChange('telephone2', e.target.value)}
                disabled={!isEditing}
                icon={Phone}
              />
              <AuthInput
                label={t('school.profile.email')}
                type="email"
                value={school?.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!isEditing}
                icon={Mail}
              />
              <AuthInput
                label={t('school.profile.website')}
                value={school?.siteWeb || ''}
                onChange={(e) => handleInputChange('siteWeb', e.target.value)}
                disabled={!isEditing}
                icon={Globe}
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end pt-4 animate-in slide-in-from-bottom-4">
                <AuthButton
                    type="submit"
                    className="md:w-auto px-16 py-6 shadow-2xl shadow-accent/20"
                    disabled={saving}
                >
                    {saving ? (
                        <div className="flex items-center space-x-3">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>{t('school.profile.saving')}</span>
                        </div>
                    ) : (
                        <span className="flex items-center space-x-3">
                            <Save size={22} />
                            <span className="text-sm">{t('school.profile.save_changes')}</span>
                        </span>
                    )}
                </AuthButton>
            </div>
          )}
        </div>
      </form>

      {/* Success Toast */}
      {success && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black text-white px-10 py-5 rounded-sharp shadow-2xl flex items-center space-x-4 animate-in slide-in-from-bottom-10 z-[100]">
           <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle2 size={18} />
           </div>
           <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t('school.profile.success_toast')}</span>
        </div>
      )}
    </div>
  );
};

export default SchoolProfile;
