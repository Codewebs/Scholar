import React, { useState, useEffect } from 'react';
import { useSchoolYear } from '../../../../context/SchoolYearContext';
import { studentService } from '../../../../api/studentService';
import { pedagogyService } from '../../../../api/pedagogyService';
import { gradeService } from '../../../../api/gradeService';
import { PeriodeEntity, SousPeriodeEntity } from '../../../../types/pedagogy';
import { FileText, Download, Printer, Filter, Layers, Zap, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

interface PVViewProps {
    salle?: any;
    sequence?: any;
}

const PVView: React.FC<PVViewProps> = ({ salle: propSalle, sequence: propSequence }) => {
  const { t } = useTranslation();
  const { selectedYear } = useSchoolYear();
  const yearId = selectedYear?.idServeur || selectedYear?.idAnneeScolaire;

  const [salles, setSalles] = useState<any[]>([]);
  const [periodes, setPeriodes] = useState<PeriodeEntity[]>([]);
  const [sequences, setSequences] = useState<SousPeriodeEntity[]>([]);
  const [sequenceRepartition, setSequenceRepartition] = useState<any[]>([]);

  const [type, setType] = useState<'SEQUENCE' | 'TRIMESTRE' | 'ANNUEL'>('SEQUENCE');
  const [selectedSalle, setSelectedSalle] = useState<number | ''>(propSalle?.idSalle || '');
  const [selectedPeriode, setSelectedPeriode] = useState<number | ''>('');
  const [selectedSequence, setSelectedSequence] = useState<number | ''>(propSequence?.idSousPeriode || '');

  useEffect(() => {
    if (propSalle) setSelectedSalle(propSalle.idSalle);
    if (propSequence) setSelectedSequence(propSequence.idSousPeriode);
  }, [propSalle, propSequence]);

  const [loading, setLoading] = useState(false);
  const [pvData, setPvData] = useState<any>(null);

  useEffect(() => {
    if (yearId) {
      loadInitialData();
    }
  }, [yearId]);

  const loadInitialData = async () => {
    try {
      const [roomsRes, periodsRes, seqRepRes] = await Promise.all([
        studentService.getRooms(yearId!),
        pedagogyService.getPeriodes(yearId!),
        pedagogyService.getSequenceRepartition(yearId!)
      ]);
      const normalizedRooms = roomsRes.data.map((r: any) => ({
          ...r,
          nomSalle: r.nomSalle || r.nom || 'N/A',
          nomComplet: `${r.Classe?.libelleFr || r.Classe?.nomClasse || 'N/A'} ${r.nomSalle || r.nom || ''}`.trim()
      }));
      setSalles(normalizedRooms);
      setPeriodes(periodsRes.data);
      setSequenceRepartition(seqRepRes.data);

      const allSequences: SousPeriodeEntity[] = [];
      periodsRes.data.forEach(p => {
        if (p.sousPeriodes) allSequences.push(...p.sousPeriodes);
      });
      setSequences(allSequences);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSequences = React.useMemo(() => {
    if (!selectedSalle) return sequences;
    const salle = salles.find(s => s.idSalle === selectedSalle);
    if (!salle) return sequences;

    const allowedIds = sequenceRepartition
        .filter(r => r.idClasse === salle.idClasse && !r.supprimer)
        .map(r => Number(r.idSousPeriode));

    if (allowedIds.length === 0) return sequences;
    return sequences.filter(s => allowedIds.includes(Number(s.idSousPeriode)));
  }, [selectedSalle, salles, sequences, sequenceRepartition]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await gradeService.getPVData(
        type,
        yearId!,
        selectedSalle as number,
        type === 'SEQUENCE' ? selectedSequence as number : undefined,
        type === 'TRIMESTRE' ? selectedPeriode as number : undefined
      );
      setPvData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center space-x-3 text-black">
                        <Filter size={18} />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{t('grades.pv.configuration')}</h3>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">{t('grades.pv.report_type')}</label>
                        <div className="grid grid-cols-1 gap-2">
                            {['SEQUENCE', 'TRIMESTRE', 'ANNUEL'].map(tType => (
                                <button
                                    key={tType}
                                    onClick={() => setType(tType as any)}
                                    className={clsx(
                                        "w-full p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-left",
                                        type === tType ? "bg-black text-white shadow-lg shadow-gray-200" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                                    )}
                                >
                                    {tType === 'SEQUENCE' ? t('grades.pv.type_sequence') : tType === 'TRIMESTRE' ? t('grades.pv.type_trimestre') : t('grades.pv.type_annuel')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">{t('grades.selection.room')}</label>
                        <select
                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold outline-none"
                            value={selectedSalle}
                            onChange={(e) => setSelectedSalle(Number(e.target.value))}
                        >
                            <option value="">{t('grades.pv.all_salles')}</option>
                            {salles.map(s => (
                                <option key={s.idSalle} value={s.idSalle}>{s.nomComplet || s.nomSalle}</option>
                            ))}
                        </select>
                    </div>

                    {type === 'TRIMESTRE' && (
                        <div className="space-y-2 animate-in slide-in-from-top-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">{t('grades.pv.select_periode')}</label>
                            <select
                                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold outline-none"
                                value={selectedPeriode}
                                onChange={(e) => setSelectedPeriode(Number(e.target.value))}
                            >
                                <option value="">{t('grades.selection.choose')}</option>
                                {periodes.map(p => (
                                    <option key={p.idPeriode} value={p.idPeriode}>{p.libellePeriodeFr}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {type === 'SEQUENCE' && (
                        <div className="space-y-2 animate-in slide-in-from-top-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">{t('grades.pv.select_sequence')}</label>
                            <select
                                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold outline-none"
                                value={selectedSequence}
                                onChange={(e) => setSelectedSequence(Number(e.target.value))}
                            >
                                <option value="">{t('grades.selection.choose')}</option>
                                {filteredSequences.map(s => (
                                    <option key={s.idSousPeriode} value={s.idSousPeriode}>{s.libelleSousPeriodeFr}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full bg-accent text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-3"
                >
                    {loading ? (
                        <Zap size={18} className="animate-spin" />
                    ) : (
                        <FileText size={18} />
                    )}
                    <span>{t('grades.pv.generate_button')}</span>
                </button>
            </div>
        </div>

        {/* PV Preview Area */}
        <div className="lg:col-span-3">
            {!pvData ? (
                <div className="h-full min-h-[500px] border-4 border-dashed border-gray-100 rounded-[56px] flex flex-col items-center justify-center text-center p-12 bg-white/50">
                    <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-200 mb-6">
                        <FileText size={40} />
                    </div>
                    <h4 className="text-xl font-black uppercase tracking-tight text-gray-300">{t('grades.pv.placeholder_title')}</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2 max-w-[300px]">{t('grades.pv.placeholder_subtitle')}</p>
                </div>
            ) : (
                <div className="bg-white rounded-[56px] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-500 min-h-[600px] flex flex-col">
                    <div className="p-12 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                        <div>
                            <div className="flex items-center space-x-3 text-accent mb-2">
                                <Layers size={18} />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t('grades.pv.deliberation_title')}</span>
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-black">
                                {type} - {selectedYear?.libelleAnneeScolaire}
                            </h2>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button className="p-4 bg-white border border-gray-100 rounded-2xl text-black hover:bg-gray-50 transition-all shadow-sm"><Printer size={20}/></button>
                            <button className="p-4 bg-black text-white rounded-2xl hover:opacity-90 transition-all shadow-xl flex items-center space-x-3">
                                <Download size={20} className="text-accent" />
                                <span className="text-[10px] font-black uppercase tracking-widest px-2">{t('grades.pv.export_pdf')}</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 p-16 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-8">
                            <CheckCircle2 size={48} />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-black">{t('grades.pv.stats_ready')}</h3>
                        <p className="text-sm text-gray-500 max-w-md">{t('grades.pv.stats_desc')}</p>

                        <div className="grid grid-cols-3 gap-8 w-full mt-16">
                            {[
                                { label: t('grades.pv.stat_inscribed'), val: '45', color: 'bg-blue-50 text-blue-600' },
                                { label: t('grades.pv.stat_average'), val: '12.45', color: 'bg-accent/10 text-accent' },
                                { label: t('grades.pv.stat_success'), val: '78%', color: 'bg-green-50 text-green-600' }
                            ].map((stat, i) => (
                                <div key={i} className="p-8 rounded-[32px] bg-gray-50/50 border border-gray-100">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">{stat.label}</p>
                                    <p className={clsx("text-3xl font-black tracking-tighter", stat.color.split(' ')[1])}>{stat.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PVView;
