import React from 'react';

interface Subject {
  id: number;
  name: string;
  coef: number;
}

interface StudentGrade {
  studentId: number;
  studentName: string;
  grades: Record<number, number | null>; // subjectId -> grade
}

interface GradesMatrixProps {
  subjects: Subject[];
  students: StudentGrade[];
  onGradeChange: (studentId: number, subjectId: number, value: number) => void;
}

const GradesMatrix: React.FC<GradesMatrixProps> = ({ subjects, students, onGradeChange }) => {
  return (
    <div className="card overflow-x-auto shadow-none">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-background">
            <th className="p-4 border border-border text-left min-w-[250px] sticky left-0 bg-background z-10">
              Nom de l'Élève
            </th>
            {subjects.map(subject => (
              <th key={subject.id} className="border border-border p-0 h-[180px] w-[50px] relative">
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 -rotate-90 whitespace-nowrap origin-center text-xs font-bold uppercase tracking-tight">
                  {subject.name} <span className="text-secondary ml-1">(x{subject.coef})</span>
                </div>
              </th>
            ))}
            <th className="p-4 border border-border text-center bg-primary text-white font-bold w-[80px]">
              Moy.
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            let total = 0;
            let totalCoef = 0;

            return (
              <tr key={student.studentId} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 border border-border font-medium sticky left-0 bg-surface z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                  {student.studentName}
                </td>
                {subjects.map(subject => {
                  const grade = student.grades[subject.id];
                  if (grade !== null) {
                    total += (grade * subject.coef);
                    totalCoef += subject.coef;
                  }

                  return (
                    <td key={subject.id} className="border border-border p-0">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.25"
                        defaultValue={grade ?? ''}
                        onBlur={(e) => onGradeChange(student.studentId, subject.id, parseFloat(e.target.value))}
                        className="w-full h-full p-2 text-center text-sm font-bold bg-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset transition-all"
                      />
                    </td>
                  );
                })}
                <td className="p-4 border border-border text-center font-black text-primary">
                  {totalCoef > 0 ? (total / totalCoef).toFixed(2) : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default GradesMatrix;
