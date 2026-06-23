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
  icon: any;
  path: string;
  permission?: AcademicPermission;
}

export const menuGroups: { group: string, items: MenuItem[] }[] = [
  {
    group: "Général",
    items: [
      {
        title: "Tableau de Bord",
        icon: LayoutDashboard,
        path: "/app/dashboard",
        permission: AcademicPermission.DASHBOARD_ETABLISSEMENT
      },
      {
        title: "Cockpit d'Analyse",
        icon: TrendingUp,
        path: "/app/reports/cockpit",
        permission: AcademicPermission.VIEW_FINANCIAL_REPORTS
      },
      {
        title: "Actualités",
        icon: Megaphone,
        path: "/app/news-feed",
        permission: AcademicPermission.DASHBOARD_ETABLISSEMENT
      },
    ]
  },
  {
    group: "Gestion Académique",
    items: [
      {
        title: "Structure Scolaire",
        icon: Building2,
        path: "/app/academic/structure",
        permission: AcademicPermission.MANAGE_ACADEMIC_CONFIG
      },
      {
        title: "Élèves",
        icon: Users,
        path: "/app/students/list",
        permission: AcademicPermission.VIEW_STUDENT_LIST
      },
      {
        title: "Documents Officiels",
        icon: FileText,
        path: "/app/students/documents",
        permission: AcademicPermission.VIEW_STUDENT_LIST
      },
      {
        title: "Matières",
        icon: BookOpen,
        path: "/app/pedagogy/matieres",
        permission: AcademicPermission.MANAGE_ACADEMIC_CONFIG
      },
      {
        title: "Configuration APC",
        icon: ShieldCheck,
        path: "/app/pedagogy/apc",
        permission: AcademicPermission.MANAGE_ACADEMIC_CONFIG
      },
      {
        title: "Bulletins Scolaires",
        icon: FileBarChart,
        path: "/app/pedagogy/bulletins",
        permission: AcademicPermission.MANAGE_GRADES
      },
      {
        title: "Classes & Salles",
        icon: LayoutGrid,
        path: "/app/academic/classes",
        permission: AcademicPermission.MANAGE_CLASSES
      },
      {
        title: "Notes & Examens",
        icon: GraduationCap,
        path: "/app/grades",
        permission: AcademicPermission.MANAGE_GRADES
      },
    ]
  },
  {
    group: "Finance",
    items: [
      {
        title: "Encaissements",
        icon: Wallet,
        path: "/app/finance/payments",
        permission: AcademicPermission.COLLECT_TUITION_FEE
      },
      {
        title: "Bilans Financiers",
        icon: FileBarChart,
        path: "/app/finance/reports",
        permission: AcademicPermission.VIEW_FINANCIAL_REPORTS
      },
    ]
  },
  {
    group: "Administration",
    items: [
      {
        title: "Mon Établissement",
        icon: Building2,
        path: "/app/admin/school",
        permission: AcademicPermission.EDIT_SCHOOL_INFO
      },
      {
        title: "Utilisateurs",
        icon: ShieldCheck,
        path: "/app/admin/users",
        permission: AcademicPermission.MANAGE_USERS
      },
      {
        title: "Équipe Pédagogique",
        icon: Users,
        path: "/app/pedagogy/teachers-repartition",
        permission: AcademicPermission.MANAGE_ACADEMIC_CONFIG
      },
      {
        title: "Configuration",
        icon: Settings,
        path: "/app/admin/config",
        permission: AcademicPermission.GENERAL_CONFIG
      },
    ]
  }
];
