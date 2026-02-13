import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './stores/authStore'

// Create a client for React Query
const queryClient = new QueryClient()

// Pages - Public
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PasswordResetPage from './pages/PasswordResetPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsOfServicePage from './pages/TermsOfServicePage'

// Pages - Protected
import DashboardPage from './pages/DashboardPage'
import ProjectsListPage from './pages/ProjectsListPage'
import ProjectFormPage from './pages/ProjectFormPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import ProjectEstimatesPage from './pages/ProjectEstimatesPage'
import CostItemsPage from './pages/CostItemsPage'
import ReportingPage from './pages/ReportingPage'
import CostAnalysisPage from './pages/CostAnalysisPage'
import ProjectActualsPage from './pages/ProjectActualsPage'
import ProjectCostTotalPage from './pages/ProjectCostTotalPage'
import UserManagementPage from './pages/UserManagementPage'
import UserManagementAdminPage from './pages/UserManagementAdminPage'
import ClientsPage from './pages/ClientsPage'
import ContractorsPage from './pages/ContractorsPage'
import PersonalCostDatabaseUploaderPage from './pages/PersonalCostDatabaseUploaderPage'
import InternalRatesBuilderPage from './pages/InternalRatesBuilderPage'
import ProjectCostAssemblyPage from './pages/ProjectCostAssemblyPage'
import ReferralProgramPage from './pages/ReferralProgramPage'
import NRM2ReferencePage from './pages/NRM2ReferencePage'
import ReferenceDocumentsPage from './pages/ReferenceDocumentsPage'
import BoQRepositoryPage from './pages/BoQRepositoryPage'
import BoQAdminImportPage from './pages/BoQAdminImportPage'

// Components
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import AppLayout from './components/layouts/AppLayout'

function App() {
  const { hydrate, user, accessToken } = useAuthStore()

  // Hydrate auth state from localStorage on app load
  useEffect(() => {
    hydrate()
  }, [hydrate])

  const isAuthenticated = !!user && !!accessToken

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/password-reset" element={<PasswordResetPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />

        {/* Protected Routes - App Layout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
            {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsListPage />} />
          <Route path="/projects/new" element={<ProjectFormPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/projects/:id/edit" element={<ProjectFormPage />} />
          <Route path="/projects/:id/estimates" element={<ProjectEstimatesPage />} />
          <Route path="/projects/:id/actuals" element={<ProjectActualsPage />} />
          <Route path="/projects/:id/report" element={<ReportingPage />} />
          <Route path="/boq-repository" element={<BoQRepositoryPage />} />
          <Route path="/admin/boq-import" element={<BoQAdminImportPage />} />
          <Route path="/projects/:id/cost-total" element={<ProjectCostTotalPage />} />
          <Route path="/cost-items" element={<CostItemsPage />} />
          <Route path="/cost-analysis" element={<CostAnalysisPage />} />
          <Route path="/personal-database" element={<PersonalCostDatabaseUploaderPage />} />
          <Route path="/internal-rates" element={<InternalRatesBuilderPage />} />
          <Route path="/cost-assembly" element={<ProjectCostAssemblyPage />} />
          <Route path="/referrals" element={<ReferralProgramPage />} />
          <Route path="/users" element={<UserManagementPage />} />
          <Route path="/admin/users" element={<UserManagementAdminPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/contractors" element={<ContractorsPage />} />
          <Route path="/nrm2" element={<NRM2ReferencePage />} />
          <Route path="/references/documents" element={<ReferenceDocumentsPage />} />
        </Route>

        {/* Redirect unmatched routes */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />}
        />
      </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
