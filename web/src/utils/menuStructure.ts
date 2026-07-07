import {
  LayoutDashboard,
  Users,
  Wallet,
  BookOpen,
  Settings,
  ShieldCheck,
  GraduationCap,
  Building2,
  FileBarChart,
  Megaphone,
  LayoutGrid,
  TrendingUp,
  FileText
} from 'lucide-react';
import { AcademicPermission } from '../types/permissions';

export interface MenuItem {
  title: string;
  translationKey: string;
  icon: any;
  path: string;
  permission?: AcademicPermission;
}

export const menuGroups: { group: string, translationKey: string, items: MenuItem[] }[] = [
  {
    group: "Général",
    translationKey: "menu.groups.general",
    items: [
      {
        title: "Tableau de Bord",
        translationKey: "menu.dashboard",
        icon: LayoutDashboard,
        path: "/app/dashboard",
        permission: AcademicPermission.DASHBOARD_ETABLISSEMENT
      },
      {
        title: "Cockpit d'Analyse",
        translationKey: "menu.analysis_cockpit",
        icon: TrendingUp,
        path: "/app/reports/cockpit",
        permission: AcademicPermission.VIEW_FINANCIAL_REPORTS
      },
      {
        title: "Actualités",
        translationKey: "menu.news",
        icon: Megaphone,
        path: "/app/news-feed",
        permission: AcademicPermission.DASHBOARD_ETABLISSEMENT
      },
    ]
  },
  {
    group: "Gestion Académique",
    translationKey: "menu.groups.academic",
    items: [
      {
        title: "Structure Scolaire",
        translationKey: "menu.academic_structure",
        icon: Building2,
        path: "/app/academic/structure",
        permission: AcademicPermission.MANAGE_ACADEMIC_CONFIG
      },
      {
        title: "Élèves",
        translationKey: "menu.students",
        icon: Users,
        path: "/app/students/list",
        permission: AcademicPermission.VIEW_STUDENT_LIST
      },
      {
        title: "Documents Officiels",
        translationKey: "menu.official_documents",
        icon: FileText,
        path: "/app/students/documents",
        permission: AcademicPermission.VIEW_STUDENT_LIST
      },
      {
        title: "Matières",
        translationKey: "menu.subjects",
        icon: BookOpen,
        path: "/app/pedagogy/matieres",
        permission: AcademicPermission.MANAGE_ACADEMIC_CONFIG
      },
      {
        title: "Configuration APC",
        translationKey: "menu.apc_config",
        icon: ShieldCheck,
        path: "/app/pedagogy/apc",
        permission: AcademicPermission.MANAGE_ACADEMIC_CONFIG
      },
      {
        title: "Bulletins Scolaires",
        translationKey: "menu.report_cards",
        icon: FileBarChart,
        path: "/app/pedagogy/bulletins",
        permission: AcademicPermission.MANAGE_GRADES
      },
      {
        title: "Classes & Salles",
        translationKey: "menu.classes_rooms",
        icon: LayoutGrid,
        path: "/app/academic/classes",
        permission: AcademicPermission.MANAGE_CLASSES
      },
      {
        title: "Notes & Examens",
        translationKey: "menu.grades_exams",
        icon: GraduationCap,
        path: "/app/grades",
        permission: AcademicPermission.MANAGE_GRADES
      },
    ]
  },
  {
    group: "Finance",
    translationKey: "menu.groups.finance",
    items: [
      {
        title: "Encaissements",
        translationKey: "menu.collections",
        icon: Wallet,
        path: "/app/finance/payments",
        permission: AcademicPermission.COLLECT_TUITION_FEE
      },
      {
        title: "Bilans Financiers",
        translationKey: "menu.financial_reports",
        icon: FileBarChart,
        path: "/app/finance/reports",
        permission: AcademicPermission.VIEW_FINANCIAL_REPORTS
      },
    ]
  },
  {
    group: "Administration",
    translationKey: "menu.groups.admin",
    items: [
      {
        title: "Mon Établissement",
        translationKey: "menu.my_school",
        icon: Building2,
        path: "/app/admin/school",
        permission: AcademicPermission.EDIT_SCHOOL_INFO
      },
      {
        title: "Utilisateurs",
        translationKey: "menu.users",
        icon: ShieldCheck,
        path: "/app/admin/users",
        permission: AcademicPermission.MANAGE_USERS
      },
      {
        title: "Équipe Pédagogique",
        translationKey: "menu.pedagogical_team",
        icon: Users,
        path: "/app/pedagogy/teachers-repartition",
        permission: AcademicPermission.MANAGE_ACADEMIC_CONFIG
      },
      {
        title: "Configuration",
        translationKey: "menu.configuration",
        icon: Settings,
        path: "/app/admin/config",
        permission: AcademicPermission.GENERAL_CONFIG
      },
    ]
  }
];
