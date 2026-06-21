import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { clsx } from 'clsx';
import { permissionGroups } from '../../pages/admin/StaffManagementPage';

interface PermissionGroupingProps {
  role: string;
  addedPerms: string[];
  removedPerms: string[];
  onTogglePermission: (perm: string, isInherited: boolean) => void;
  onToggleGroup: (perms: string[], state: boolean, isInheritedArray: boolean[]) => void;
}

// Map role to default inherited permissions
const getRolePermissions = (role: string): string[] => {
  const commonStaff = [
    'DASHBOARD_ETABLISSEMENT',
    'WEB_VERSION',
    'SUMMARY',
    'ACADEMIC_STATS',
    'EDIT_OWN_ACCOUNT',
    'ABOUT'
  ];


  switch (role) {
    case 'ADMINISTRATEUR':
      return Object.values(permissionGroups).flat();

    case 'DIRECTEUR':
    case 'DIRECTEUR_DES_ETUDES':
      return [
        ...commonStaff,
        'ACADEMIC_STATS', 'VIEW_STUDENT_LIST', 'STUDENT_DOSSIER',
        'MANAGE_ACADEMIC_CONFIG', 'VALIDATE_GRADES', 'GRADES_REPORT_SHEET',
        'GLOBAL_ATTENDANCE', 'VIEW_FINANCIAL_REPORTS'
      ];

    case 'SURVEILLANT_GENERAL':
      return [
        ...commonStaff,
        'VIEW_STUDENT_LIST', 'STUDENT_DOSSIER', 'GLOBAL_ATTENDANCE',
        'MANAGE_JUSTIFICATIONS', 'MANAGE_SANCTIONS', 'EXIT_SLIP'
      ];

    case 'INTENDANT':
      return [
        ...commonStaff,
        'COLLECT_TUITION_FEE', 'COLLECT_REGISTRATION_FEE', 'COLLECT_OTHER_FEES',
        'VIEW_FINANCIAL_REPORTS', 'VIEW_PAYMENT_STATUS', 'FINANCIAL_BALANCE_SHEET'
      ];

    case 'SECRETAIRE':
      return [
        ...commonStaff,
        'REGISTER_STUDENT', 'ENROLL_STUDENT', 'VIEW_STUDENT_LIST', 'STUDENT_DOSSIER',
        'PRINT_STUDENT_INFO', 'ATTENDANCE_CERTIFICATE'
      ];

    case 'ENSEIGNANT':
      return [
        ...commonStaff,
        'MANAGE_GRADES', 'EDIT_STUDENT_NOTE', 'GRADES_REPORT_SHEET'
      ];

    default:
      return role !== 'DEMANDEUR' ? commonStaff : [];
  }
};


export const PermissionGrouping: React.FC<PermissionGroupingProps> = ({
    role, addedPerms, removedPerms, onTogglePermission, onToggleGroup
}) => {
  const nativePerms = getRolePermissions(role);

  // Initialiser l'état d'expansion : ouvert seulement si au moins une permission est active dedans
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    Object.entries(permissionGroups).forEach(([groupName, perms]) => {
      const hasActive = perms.some(p => {
        const isInherited = nativePerms.includes(p);
        return (isInherited && !removedPerms.includes(p)) || addedPerms.includes(p);
      });
      initialState[groupName] = hasActive;
    });
    return initialState;
  });

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  return (
    <div className="space-y-3">
      {Object.entries(permissionGroups).map(([groupName, perms]) => {
        const isExpanded = expandedGroups[groupName];
        const groupPerms = perms;
        const allActive = groupPerms.every(p => {
            const isInherited = nativePerms.includes(p);
            return (isInherited && !removedPerms.includes(p)) || addedPerms.includes(p);
        });

        const activeCount = groupPerms.filter(p => {
            const isInherited = nativePerms.includes(p);
            return (isInherited && !removedPerms.includes(p)) || addedPerms.includes(p);
        }).length;

        return (
          <div key={groupName} className="border border-gray-100 rounded-[20px] overflow-hidden bg-white shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between p-3 bg-gray-50/50">
              <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleGroup(groupName)}>
                  <div className={clsx("w-6 h-6 rounded-lg flex items-center justify-center transition-all", isExpanded ? "bg-black text-white" : "bg-white text-gray-400")}>
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </div>
                  <div>
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-black">{groupName}</h4>
                    <p className="text-[7px] font-bold text-secondary uppercase tracking-tight">{activeCount} / {groupPerms.length} actifs</p>
                  </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleGroup(groupPerms, !allActive, groupPerms.map(p => nativePerms.includes(p)));
                  }}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest transition-all",
                    allActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-black text-white hover:scale-105"
                  )}
                >
                  {allActive ? "Tout retirer" : "Tout cocher"}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 bg-white animate-in slide-in-from-top-1 duration-200">
                {perms.map(perm => {
                  const isInherited = nativePerms.includes(perm);
                  const isActive = (isInherited && !removedPerms.includes(perm)) || addedPerms.includes(perm);

                  return (
                    <div
                      key={perm}
                      onClick={() => onTogglePermission(perm, isInherited)}
                      className={clsx(
                        "p-2 rounded-lg border cursor-pointer flex items-center justify-between transition-all group",
                        isActive
                            ? "border-green-400 bg-green-50/30 text-green-700"
                            : isInherited
                                ? "border-orange-200 bg-orange-50/20 text-orange-600"
                                : "border-gray-50 text-gray-400 hover:border-gray-200"
                      )}
                    >
                      <span className="text-[7px] font-black uppercase tracking-tight truncate pr-1">
                        {perm.replace(/_/g, ' ')}
                      </span>
                      {isActive ? (
                        <div className="w-3.5 h-3.5 bg-green-500 text-white rounded-full flex items-center justify-center shrink-0">
                          <Check size={8} strokeWidth={5} />
                        </div>
                      ) : (
                        <div className="w-3.5 h-3.5 border border-gray-100 rounded-full shrink-0 group-hover:border-gray-300" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      })}
    </div>
  );
};

