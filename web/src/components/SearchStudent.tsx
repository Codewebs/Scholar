import React, { useState, useEffect } from 'react';
import { Search, User, ChevronRight } from 'lucide-react';
import { financeService } from '../api/financeService';
import { EleveUiModel } from '../types/student';

interface SearchStudentProps {
  yearId: number;
  onSelect: (student: EleveUiModel) => void;
}

const SearchStudent: React.FC<SearchStudentProps> = ({ yearId, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EleveUiModel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length > 2) {
        setLoading(true);
        financeService.searchStudents(query, yearId)
          .then((res: any) => setResults(res.data))
          .finally(() => setLoading(false));
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, yearId]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={20} />
        <input
          type="text"
          placeholder="Rechercher un élève (Nom ou Matricule)..."
          className="w-full h-14 pl-12 pr-4 bg-surface border border-border rounded-sharp focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {results.length > 0 && (
        <div className="card divide-y divide-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          {results.map((student) => (
            <div
              key={student.idEleve}
              onClick={() => onSelect(student)}
              className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-secondary group-hover:bg-black group-hover:text-white transition-colors">
                  <User size={20} />
                </div>
                <div>
                  <p className="font-black uppercase text-sm tracking-tight">{student.nomComplet}</p>
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">
                    {student.matricule} • {student.classeLabel}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-black transition-colors" />
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="p-8 text-center text-secondary text-xs font-bold uppercase tracking-widest animate-pulse">
          Recherche en cours...
        </div>
      )}
    </div>
  );
};

export default SearchStudent;
