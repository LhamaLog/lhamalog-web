import { Navigate, Route, Routes } from 'react-router-dom'
import { App } from '../App'
import { CompanyWorkspace } from '../layouts/CompanyWorkspace'
import { ProtectedRoute } from '../../features/auth/components/ProtectedRoute'
import { SignInPage } from '../../features/auth/components/SignInPage'
import { SignUpPage } from '../../features/auth/components/SignUpPage'
import { CreateOrganizationPage } from '../../features/auth/components/CreateOrganizationPage'
import { ChooseOrganizationTask } from '../../features/auth/components/ChooseOrganizationTask'
import { SetupMfaTask } from '../../features/auth/components/SetupMfaTask'
import { ResetPasswordTask } from '../../features/auth/components/ResetPasswordTask'

// Rotas da autenticação. O /* no fim é necessário nos componentes da Clerk,
// que usam sub-rotas (ex.: /sign-in/factor-one).
export function AppRoutes() {
  return (
    <Routes>
      {/* Demonstração atual, só para sessão ativa */}
      <Route path="/" element={<Navigate to="/empresa" replace />} />
      <Route path="/componentes" element={<ProtectedRoute><App /></ProtectedRoute>} />
      <Route path="/empresa" element={<ProtectedRoute><CompanyWorkspace /></ProtectedRoute>} />
      <Route path="/produtos" element={<ProtectedRoute><CompanyWorkspace /></ProtectedRoute>} />
      <Route path="/perfil" element={<ProtectedRoute><CompanyWorkspace /></ProtectedRoute>} />
      <Route path="/equipe" element={<ProtectedRoute><CompanyWorkspace /></ProtectedRoute>} />

      {/* Telas de autenticação: layout dividido (painel da marca + card) */}
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />
      <Route path="/organizacoes/nova/*" element={<ProtectedRoute><CreateOrganizationPage /></ProtectedRoute>} />

      {/* Etapas pós-login (sessão "pending"): não usam ProtectedRoute */}
      <Route path="/tarefas/escolher-organizacao/*" element={<ChooseOrganizationTask />} />
      <Route path="/tarefas/configurar-mfa/*" element={<SetupMfaTask />} />
      <Route path="/tarefas/redefinir-senha/*" element={<ResetPasswordTask />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
