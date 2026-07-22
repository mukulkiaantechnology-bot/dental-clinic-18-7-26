import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '../../modules/auth/LandingPage';
import { LoginPage } from '../../modules/auth/LoginPage';
import { RegisterPage } from '../../modules/auth/RegisterPage';
import { ProtectedRoute } from './ProtectedRoute';
import { SuperAdminLayout } from '../layout/SuperAdminLayout';
import { ClinicOwnerLayout } from '../layout/ClinicOwnerLayout';
import { DentistLayout } from '../layout/DentistLayout';
import { SuperAdminDashboardPage } from '../../modules/dashboard/pages/SuperAdminDashboardPage';
import {
  SuperAdminClinicsPage,
  SuperAdminSubscriptionsPage,
  SuperAdminBillingPage,
  SuperAdminAIPage,
  SuperAdminReportsPage,
  SuperAdminUsersPage
} from '../../modules/dashboard/pages/SuperAdminPages';
import { ClinicOwnerDashboardPage } from '../../modules/dashboard/pages/ClinicOwnerDashboardPage';
import {
  ClinicPatientsPage,
  ClinicClinicalPage,
  ClinicBillingPage,
  ClinicStaffPage,
  ClinicReportsPage,
  ClinicSettingsPage
} from '../../modules/dashboard/pages/ClinicOwnerPages';
import { BillingDashboardPage } from '../../modules/dashboard/pages/BillingDashboardPage';
import { DentistPatientsPage, PatientDetailPage } from '../../modules/dashboard/pages/DentistPages';
import { DentistDashboardPage } from '../../modules/dashboard/pages/DentistDashboardPage';
import { DentistAppointmentsPage } from '../../modules/dashboard/pages/DentistAppointmentsPage';
import { useAuthStore } from '../../store/authStore';
import { AIRecallDashboard } from '../../modules/ai/pages/AIRecallDashboard';
import { AppointmentsPage } from '../../modules/appointments/pages/AppointmentsPage';
import { ToastContainer } from '../../shared/ui/Toast';

// Hygienist Imports
import { HygienistLayout } from '../layout/HygienistLayout';
import { HygienistDashboardPage } from '../../modules/dashboard/pages/HygienistDashboardPage';
import { HygienistPatientsPage, HygienistPatientDetailPage } from '../../modules/dashboard/pages/HygienistPages';

// Front Desk Imports
import { FrontDeskLayout } from '../layout/FrontDeskLayout';
import { FrontDeskDashboardPage } from '../../modules/dashboard/pages/FrontDeskDashboardPage';
import {
  FrontDeskAppointmentsPage,
  FrontDeskRegistrationPage,
  FrontDeskInsurancePage,
  FrontDeskWaitlistPage
} from '../../modules/dashboard/pages/FrontDeskPages';

// Billing Staff Imports
import { BillingLayout } from '../layout/BillingLayout';
import { BillingPage } from '../../modules/billing/pages/BillingPage';

// Dental Assistant Imports
import { DentalAssistantLayout } from '../layout/DentalAssistantLayout';
import { TodayPatientsPage } from '../../modules/assistant/pages/TodayPatientsPage';
import { AssistantPatientDetailPage } from '../../modules/assistant/pages/AssistantPatientDetailPage';
import { XrayUploadPage } from '../../modules/assistant/pages/XrayUploadPage';
import { ChairsideToolsPage } from '../../modules/assistant/pages/ChairsideToolsPage';
import { ClinicalNotesPage } from '../../modules/assistant/pages/ClinicalNotesPage';
import { AICopilotWidget } from '../../shared/ui/AICopilotWidget';

// Lab Coordinator Imports
import { LabCoordinatorLayout } from '../layout/LabCoordinatorLayout';
import { LabCasesPage } from '../../modules/lab/pages/LabCasesPage';
import { CrownTrackingPage } from '../../modules/lab/pages/CrownTrackingPage';
import { ImplantCasesPage } from '../../modules/lab/pages/ImplantCasesPage';
import { StatusBoardPage } from '../../modules/lab/pages/StatusBoardPage';

// Patient Portal Imports
import { PatientLayout } from '../layout/PatientLayout';
import { PatientDashboard } from '../../modules/patient/pages/PatientDashboard';
import { PatientAppointments } from '../../modules/patient/pages/PatientAppointments';
import { PatientTreatmentPlan } from '../../modules/patient/pages/PatientTreatmentPlan';
import { PatientBilling } from '../../modules/patient/pages/PatientBilling';
import { PatientPrescriptions } from '../../modules/patient/pages/PatientPrescriptions';
import { PatientReports } from '../../modules/patient/pages/PatientReports';

// Simple Not Found component styled with modern aesthetics
function NotFoundPage() {
  const user = useAuthStore((state) => state.user);
  const dashboardPath = user?.role === 'clinic_owner'
    ? '/clinic/dashboard'
    : user?.role === 'dentist'
    ? '/dentist/dashboard'
    : user?.role === 'hygienist'
    ? '/hygienist/dashboard'
    : user?.role === 'front_desk' || user?.role === 'frontdesk'
    ? '/frontdesk/dashboard'
    : user?.role === 'billing_staff'
    ? '/billing'
    : user?.role === 'dental_assistant' || user?.role === 'assistant'
    ? '/assistant/dashboard'
    : user?.role === 'lab_coordinator'
    ? '/lab/cases'
    : user?.role === 'patient'
    ? '/patient/dashboard'
    : '/super-admin/dashboard';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[80vh] animate-fade-in text-left">
      <h1 className="text-6xl font-extrabold text-primary select-none mb-2">404</h1>
      <h2 className="text-xl font-bold text-foreground mb-2">Page Not Found</h2>
      <p className="text-xs text-muted-foreground max-w-sm mb-6 font-semibold">
        The path you are trying to visit does not exist or may have been archived.
      </p>
      <button
        onClick={() => window.location.href = dashboardPath}
        className="px-4 py-2 bg-primary text-primary-foreground font-semibold text-xs rounded-lg hover:bg-primary/95 cursor-pointer"
      >
        Go to Dashboard
      </button>
    </div>
  );
}

// Wrapper component to dynamically resolve layout based on logged-in user's role for shared routes
function RoleLayoutWrapper() {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'clinic_owner':
      return <ClinicOwnerLayout />;
    case 'dentist':
      return <DentistLayout />;
    case 'hygienist':
      return <HygienistLayout />;
    case 'front_desk':
    case 'frontdesk':
      return <FrontDeskLayout />;
    case 'dental_assistant':
    case 'assistant':
      return <DentalAssistantLayout />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function ImpersonationBanner() {
  const user = useAuthStore((state) => state.user);
  const originalAdmin = localStorage.getItem('hms_original_admin_user');

  if (!originalAdmin || !user) return null;

  const handleReturnToAdmin = () => {
    try {
      const adminUser = JSON.parse(originalAdmin);
      localStorage.removeItem('hms_original_admin_user');
      localStorage.setItem('hms_auth_user', JSON.stringify(adminUser));
      useAuthStore.setState({ user: adminUser, isAuthenticated: true });
      window.location.href = '/clinic/staff';
    } catch {
      localStorage.removeItem('hms_original_admin_user');
      window.location.href = '/login';
    }
  };

  return (
    <div className="bg-indigo-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between z-[9999] shadow-md border-b border-indigo-700 select-none">
      <div className="flex items-center gap-2">
        <span className="bg-white/20 text-white px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">
          🔑 Admin Direct Login Active
        </span>
        <span>
          Viewing section as: <strong>{user.name}</strong> ({user.role ? user.role.replace('_', ' ') : 'Staff'})
        </span>
      </div>
      <button
        onClick={handleReturnToAdmin}
        className="bg-white hover:bg-slate-100 text-indigo-900 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-xs transition-transform active:scale-95 flex items-center gap-1"
      >
        Return to Admin Staff Panel ↩
      </button>
    </div>
  );
}

export function AppRoutes() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const getDashboardRedirect = () => {
    if (!user) return '/login';
    if (user.role === 'clinic_owner') return '/clinic/dashboard';
    if (user.role === 'dentist') return '/dentist/dashboard';
    if (user.role === 'hygienist') return '/hygienist/dashboard';
    if (user.role === 'front_desk' || user.role === 'frontdesk') return '/frontdesk/dashboard';
    if (user.role === 'billing_staff') return '/billing';
    if (user.role === 'dental_assistant' || user.role === 'assistant') return '/assistant/dashboard';
    if (user.role === 'lab_coordinator') return '/lab/cases';
    if (user.role === 'patient') return '/patient/dashboard';
    return '/super-admin/dashboard';
  };

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen w-screen overflow-hidden">
        <ImpersonationBanner />
        <ToastContainer />
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
          <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            !isAuthenticated ? (
              <LoginPage />
            ) : (
              <Navigate to={getDashboardRedirect()} replace />
            )
          }
        />
        <Route
          path="/register"
          element={
            !isAuthenticated ? (
              <RegisterPage />
            ) : (
              <Navigate to={getDashboardRedirect()} replace />
            )
          }
        />

        {/* Super Admin Protected Routes Layout shell */}
        <Route element={<SuperAdminLayout />}>
          <Route element={<ProtectedRoute module="super_admin_dashboard" />}>
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboardPage />} />
          </Route>
          <Route element={<ProtectedRoute module="super_admin_clinics" />}>
            <Route path="/super-admin/clinics" element={<SuperAdminClinicsPage />} />
          </Route>
          <Route element={<ProtectedRoute module="super_admin_users" />}>
            <Route path="/super-admin/users" element={<SuperAdminUsersPage />} />
          </Route>
          <Route element={<ProtectedRoute module="super_admin_subscriptions" />}>
            <Route path="/super-admin/subscriptions" element={<SuperAdminSubscriptionsPage />} />
          </Route>
          <Route element={<ProtectedRoute module="super_admin_billing" />}>
            <Route path="/super-admin/billing" element={<SuperAdminBillingPage />} />
          </Route>
          <Route element={<ProtectedRoute module="super_admin_ai" />}>
            <Route path="/super-admin/ai" element={<SuperAdminAIPage />} />
          </Route>
          <Route element={<ProtectedRoute module="super_admin_reports" />}>
            <Route path="/super-admin/reports" element={<SuperAdminReportsPage />} />
          </Route>

          {/* 404 Route inside layout */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Clinic Owner Protected Routes Layout shell */}
        <Route element={<ClinicOwnerLayout />}>
          <Route element={<ProtectedRoute module="clinic_dashboard" />}>
            <Route path="/clinic/dashboard" element={<ClinicOwnerDashboardPage />} />
          </Route>
          <Route element={<ProtectedRoute module="clinic_patients" />}>
            <Route path="/clinic/patients" element={<ClinicPatientsPage />} />
          </Route>
          <Route element={<ProtectedRoute module="clinic_clinical" />}>
            <Route path="/clinic/clinical" element={<ClinicClinicalPage />} />
          </Route>
          <Route element={<ProtectedRoute module="clinic_billing" />}>
            <Route path="/clinic/billing" element={<ClinicBillingPage />} />
          </Route>
          <Route element={<ProtectedRoute module="clinic_subscription" />}>
            <Route path="/clinic/subscription" element={<BillingDashboardPage />} />
          </Route>
          <Route element={<ProtectedRoute module="clinic_staff" />}>
            <Route path="/clinic/staff" element={<ClinicStaffPage />} />
          </Route>
          <Route element={<ProtectedRoute module="clinic_reports" />}>
            <Route path="/clinic/reports" element={<ClinicReportsPage />} />
          </Route>
          {/* End Clinic Owner specific routes */}
          <Route element={<ProtectedRoute module="clinic_settings" />}>
            <Route path="/clinic/settings" element={<ClinicSettingsPage />} />
          </Route>
        </Route>

        {/* Dentist Protected Routes Layout shell */}
        <Route element={<DentistLayout />}>
          <Route element={<ProtectedRoute module="dentist_dashboard" />}>
            <Route path="/dentist" element={<Navigate to="/dentist/dashboard" replace />} />
            <Route path="/dentist/dashboard" element={<DentistDashboardPage />} />
          </Route>
          <Route element={<ProtectedRoute module="dentist_appointments" />}>
            <Route path="/dentist/appointments" element={<DentistAppointmentsPage />} />
          </Route>
          <Route element={<ProtectedRoute module="dentist_patients" />}>
            <Route path="/dentist/patients" element={<DentistPatientsPage />} />
            <Route path="/dentist/patients/:id" element={<PatientDetailPage />} />
          </Route>
        </Route>

        {/* Hygienist Protected Routes Layout shell */}
        <Route element={<HygienistLayout />}>
          <Route element={<ProtectedRoute module="hygienist_dashboard" />}>
            <Route path="/hygienist" element={<Navigate to="/hygienist/dashboard" replace />} />
            <Route path="/hygienist/dashboard" element={<HygienistDashboardPage />} />
          </Route>
          <Route element={<ProtectedRoute module="hygienist_patients" />}>
            <Route path="/hygienist/patients" element={<HygienistPatientsPage />} />
            <Route path="/hygienist/patients/:id" element={<HygienistPatientDetailPage />} />
          </Route>
          {/* End Hygienist specific routes */}
        </Route>

        {/* Redirect for /rehygienist/* → Hygienist System */}
        <Route path="/rehygienist/*" element={<Navigate to="/hygienist/dashboard" replace />} />

        {/* Front Desk Protected Routes Layout shell */}
        <Route element={<FrontDeskLayout />}>
          <Route element={<ProtectedRoute module="frontdesk_dashboard" />}>
            <Route path="/frontdesk" element={<Navigate to="/frontdesk/dashboard" replace />} />
            <Route path="/frontdesk/dashboard" element={<FrontDeskDashboardPage />} />
          </Route>
          <Route element={<ProtectedRoute module="frontdesk_appointments" />}>
            <Route path="/frontdesk/appointments" element={<FrontDeskAppointmentsPage />} />
          </Route>
          <Route element={<ProtectedRoute module="frontdesk_registration" />}>
            <Route path="/frontdesk/registration" element={<FrontDeskRegistrationPage />} />
          </Route>
          <Route element={<ProtectedRoute module="frontdesk_insurance" />}>
            <Route path="/frontdesk/insurance" element={<FrontDeskInsurancePage />} />
          </Route>
          <Route element={<ProtectedRoute module="frontdesk_waitlist" />}>
            <Route path="/frontdesk/waitlist" element={<FrontDeskWaitlistPage />} />
          </Route>
        </Route>

        {/* Billing Staff Protected Routes Layout shell */}
        <Route element={<BillingLayout />}>
          <Route element={<ProtectedRoute module="billing_hub" />}>
            <Route path="/billing" element={<BillingPage />} />
          </Route>
        </Route>

        {/* Dental Assistant Protected Routes Layout shell */}
        <Route element={<DentalAssistantLayout />}>
          <Route element={<ProtectedRoute module="assistant_patients" />}>
            <Route path="/assistant" element={<Navigate to="/assistant/dashboard" replace />} />
            <Route path="/assistant/dashboard" element={<TodayPatientsPage view="dashboard" />} />
            <Route path="/assistant/scheduler" element={<TodayPatientsPage view="scheduler" />} />
            <Route path="/assistant/patients" element={<TodayPatientsPage view="patients" />} />
            <Route path="/assistant/patients/:id" element={<AssistantPatientDetailPage />} />
          </Route>
          <Route element={<ProtectedRoute module="assistant_xray" />}>
            <Route path="/assistant/xray" element={<XrayUploadPage />} />
          </Route>
          <Route element={<ProtectedRoute module="assistant_chairside" />}>
            <Route path="/assistant/chairside" element={<ChairsideToolsPage />} />
          </Route>
          <Route element={<ProtectedRoute module="assistant_notes" />}>
            <Route path="/assistant/notes" element={<ClinicalNotesPage />} />
          </Route>
        </Route>

        {/* Lab Coordinator Protected Routes Layout shell */}
        <Route element={<LabCoordinatorLayout />}>
          <Route element={<ProtectedRoute module="lab_cases" />}>
            <Route path="/lab" element={<Navigate to="/lab/cases" replace />} />
            <Route path="/lab/cases" element={<LabCasesPage />} />
          </Route>
          <Route element={<ProtectedRoute module="lab_crown" />}>
            <Route path="/lab/crown" element={<CrownTrackingPage />} />
          </Route>
          <Route element={<ProtectedRoute module="lab_implant" />}>
            <Route path="/lab/implant" element={<ImplantCasesPage />} />
          </Route>
          <Route element={<ProtectedRoute module="lab_status" />}>
            <Route path="/lab/status" element={<StatusBoardPage />} />
          </Route>
        </Route>

        {/* Patient Portal Protected Routes Layout shell */}
        <Route element={<PatientLayout />}>
          <Route element={<ProtectedRoute module="patient_dashboard" />}>
            <Route path="/patient" element={<Navigate to="/patient/dashboard" replace />} />
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
          </Route>
          <Route element={<ProtectedRoute module="patient_appointments" />}>
            <Route path="/patient/appointments" element={<PatientAppointments />} />
          </Route>
          <Route element={<ProtectedRoute module="patient_treatment" />}>
            <Route path="/patient/treatment" element={<PatientTreatmentPlan />} />
          </Route>
          <Route element={<ProtectedRoute module="patient_billing" />}>
            <Route path="/patient/billing" element={<PatientBilling />} />
          </Route>
          <Route element={<ProtectedRoute module="patient_prescriptions" />}>
            <Route path="/patient/prescriptions" element={<PatientPrescriptions />} />
          </Route>
          <Route element={<ProtectedRoute module="patient_reports" />}>
            <Route path="/patient/reports" element={<PatientReports />} />
          </Route>
        </Route>

        {/* Shared Multi-role Scoped Routes (renders in the active role's layout) */}
        <Route element={<RoleLayoutWrapper />}>
          <Route element={<ProtectedRoute module="ai_recall" />}>
            <Route path="/communication/ai-recall" element={<AIRecallDashboard />} />
          </Route>
          <Route element={<ProtectedRoute module="appointments_calendar" />}>
            <Route path="/appointments/calendar" element={<AppointmentsPage />} />
          </Route>
        </Route>
      </Routes>
      <AICopilotWidget />
        </div>
      </div>
    </BrowserRouter>
  );
}
export default AppRoutes;
