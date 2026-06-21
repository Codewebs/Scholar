import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SchoolYearProvider } from './context/SchoolYearContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import SessionGuard from './components/SessionGuard';
import { AcademicPermission } from './types/permissions';

// Import Pages
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import WaitingRoom from './pages/WaitingRoom';
import InitialConfig from './pages/InitialConfig';
import Dashboard from './pages/Dashboard';
import NewsFeedPage from './pages/NewsFeedPage';
import PaymentPage from './pages/finance/PaymentPage';
import SchoolProfile from './pages/school/SchoolProfile';
import StudentListPage from './pages/students/StudentListPage';
import StudentRegisterPage from './pages/students/StudentRegisterPage';
import MatiereListPage from './pages/pedagogy/MatiereListPage';
import ClasseManagementPage from './pages/pedagogy/ClasseManagementPage';
import GradeManagementPage from './pages/pedagogy/grades/GradeManagementPage';
import SettingsPage from './pages/admin/SettingsPage';
import StaffManagementPage from './pages/admin/StaffManagementPage';
import ApcConfigurationPage from './pages/admin/ApcConfigurationPage';
import BulletinConfigPage from './pages/pedagogy/BulletinConfigPage';
import BulletinPrintPage from './pages/pedagogy/BulletinPrintPage';
import ReportPrintPage from './pages/reports/ReportPrintPage';
import FinanceLibraryPage from './pages/finance/FinanceLibraryPage';
import AcademicStructurePage from './pages/pedagogy/AcademicStructurePage';
import PeriodeManagementPage from './pages/pedagogy/PeriodeManagementPage';
import SequenceRepartitionPage from './pages/pedagogy/SequenceRepartitionPage';
import PeriscolaireDistributionPage from './pages/finance/PeriscolaireDistributionPage';
import ExigibleDistributionPage from './pages/finance/ExigibleDistributionPage';
import TransportSettingsPage from './pages/finance/TransportSettingsPage';

// Cockpit & Reports
import ReportingCockpitPage from './pages/reports/ReportingCockpitPage';
import FinancialReportsPage from './pages/finance/FinancialReportsPage';
import StudentDocumentsPage from './pages/students/StudentDocumentsPage';

function App() {
  return (
    <AuthProvider>
      <SchoolYearProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/waiting-room" element={<WaitingRoom />} />
            <Route path="/initial-config" element={<InitialConfig />} />

            <Route path="/app/pedagogy/bulletins/print" element={
              <SessionGuard>
                <ProtectedRoute permission={AcademicPermission.MANAGE_GRADES}>
                  <BulletinPrintPage />
                </ProtectedRoute>
              </SessionGuard>
            } />

            <Route path="/app/reports/print" element={
              <SessionGuard>
                <ProtectedRoute permission={AcademicPermission.DASHBOARD_ETABLISSEMENT}>
                  <ReportPrintPage />
                </ProtectedRoute>
              </SessionGuard>
            } />

            <Route path="/app" element={
              <SessionGuard>
                <MainLayout />
              </SessionGuard>
            }>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute permission={AcademicPermission.DASHBOARD_ETABLISSEMENT}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="news-feed"
                element={
                  <ProtectedRoute permission={AcademicPermission.DASHBOARD_ETABLISSEMENT}>
                    <NewsFeedPage />
                  </ProtectedRoute>
                }
              />

              {/* Reports & Cockpit */}
              <Route
                path="reports/cockpit"
                element={
                  <ProtectedRoute permission={AcademicPermission.VIEW_FINANCIAL_REPORTS}>
                    <ReportingCockpitPage />
                  </ProtectedRoute>
                }
              />

              {/* Academic & Students Routes */}
              <Route
                path="academic/structure"
                element={
                  <ProtectedRoute permission={AcademicPermission.MANAGE_ACADEMIC_CONFIG}>
                    <AcademicStructurePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="academic/classes"
                element={
                  <ProtectedRoute permission={AcademicPermission.MANAGE_ACADEMIC_CONFIG}>
                    <ClasseManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="students/list"
                element={
                  <ProtectedRoute permission={AcademicPermission.VIEW_STUDENT_LIST}>
                    <StudentListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="students/register"
                element={
                  <ProtectedRoute permission={AcademicPermission.REGISTER_STUDENT}>
                    <StudentRegisterPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="students/documents"
                element={
                  <ProtectedRoute permission={AcademicPermission.VIEW_STUDENT_LIST}>
                    <StudentDocumentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="pedagogy/matieres"
                element={
                  <ProtectedRoute permission={AcademicPermission.MANAGE_ACADEMIC_CONFIG}>
                    <MatiereListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="grades"
                element={
                  <ProtectedRoute permission={AcademicPermission.MANAGE_GRADES}>
                    <GradeManagementPage />
                  </ProtectedRoute>
                }
              />

              {/* Finance Routes */}
              <Route
                path="finance/payments"
                element={
                  <ProtectedRoute permission={AcademicPermission.COLLECT_TUITION_FEE}>
                    <PaymentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="finance/reports"
                element={
                  <ProtectedRoute permission={AcademicPermission.VIEW_FINANCIAL_REPORTS}>
                    <FinancialReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="finance/periscolaire/distribution"
                element={
                  <ProtectedRoute permission={AcademicPermission.MANAGE_ACADEMIC_CONFIG}>
                    <PeriscolaireDistributionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="finance/exigible/distribution"
                element={
                  <ProtectedRoute permission={AcademicPermission.MANAGE_ACADEMIC_CONFIG}>
                    <ExigibleDistributionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="finance/library"
                element={
                  <ProtectedRoute permission={AcademicPermission.GENERAL_CONFIG}>
                    <FinanceLibraryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="finance/transport"
                element={
                  <ProtectedRoute permission={AcademicPermission.GENERAL_CONFIG}>
                    <TransportSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="pedagogy/calendar"
                element={
                  <ProtectedRoute permission={AcademicPermission.MANAGE_ACADEMIC_CONFIG}>
                    <PeriodeManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="pedagogy/sequences/repartition"
                element={
                  <ProtectedRoute permission={AcademicPermission.MANAGE_ACADEMIC_CONFIG}>
                    <SequenceRepartitionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="pedagogy/apc"
                element={
                  <ProtectedRoute permission={AcademicPermission.MANAGE_ACADEMIC_CONFIG}>
                    <ApcConfigurationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="pedagogy/bulletins"
                element={
                  <ProtectedRoute permission={AcademicPermission.MANAGE_GRADES}>
                    <BulletinConfigPage />
                  </ProtectedRoute>
                }
              />

              {/* Administration Routes */}
              <Route
                path="admin/school"
                element={
                  <ProtectedRoute permission={AcademicPermission.EDIT_SCHOOL_INFO}>
                    <SchoolProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute permission={AcademicPermission.MANAGE_USERS}>
                    <StaffManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/config"
                element={
                  <ProtectedRoute permission={AcademicPermission.GENERAL_CONFIG}>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="/unauthorized" element={
              <div className="h-screen bg-background flex flex-col items-center justify-center gap-4">
                <h1 className="font-black text-2xl uppercase tracking-tighter">Accès non autorisé</h1>
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = '/login';
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Se déconnecter
                </button>
              </div>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SchoolYearProvider>
    </AuthProvider>
  );
}

export default App;
