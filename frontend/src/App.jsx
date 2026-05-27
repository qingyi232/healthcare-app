import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import PatientHome from './pages/patient/Home'
import PatientRecords from './pages/patient/Records'
import PatientConsultation from './pages/patient/Consultation'
import PatientProfile from './pages/patient/Profile'
import PatientChat from './pages/patient/Chat'
import PatientArchive from './pages/patient/Archive'
import NurseHome from './pages/nurse/Home'
import NursePatients from './pages/nurse/Patients'
import NursePatientDetail from './pages/nurse/PatientDetail'
import NurseMessages from './pages/nurse/Messages'
import NurseChat from './pages/nurse/Chat'
import NurseProfile from './pages/nurse/Profile'
import PatientRecovery from './pages/patient/Recovery'
import NurseAlerts from './pages/nurse/Alerts'
import NurseStats from './pages/nurse/Stats'
import NursePainPlans from './pages/nurse/PainPlans'
import NurseSettings from './pages/nurse/Settings'

function ProtectedRoute({ children, role }) {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const token = localStorage.getItem('token')
  if (!token || !user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* 患者端 */}
      <Route path="/patient" element={<ProtectedRoute role="patient"><PatientHome /></ProtectedRoute>} />
      <Route path="/patient/records" element={<ProtectedRoute role="patient"><PatientRecords /></ProtectedRoute>} />
      <Route path="/patient/consultation" element={<ProtectedRoute role="patient"><PatientConsultation /></ProtectedRoute>} />
      <Route path="/patient/profile" element={<ProtectedRoute role="patient"><PatientProfile /></ProtectedRoute>} />
      <Route path="/patient/chat/:otherId" element={<ProtectedRoute role="patient"><PatientChat /></ProtectedRoute>} />
      <Route path="/patient/archive" element={<ProtectedRoute role="patient"><PatientArchive /></ProtectedRoute>} />
      <Route path="/patient/recovery" element={<ProtectedRoute role="patient"><PatientRecovery /></ProtectedRoute>} />

      {/* 医护端 */}
      <Route path="/nurse" element={<ProtectedRoute role="nurse"><NurseHome /></ProtectedRoute>} />
      <Route path="/nurse/patients" element={<ProtectedRoute role="nurse"><NursePatients /></ProtectedRoute>} />
      <Route path="/nurse/patient/:patientId" element={<ProtectedRoute role="nurse"><NursePatientDetail /></ProtectedRoute>} />
      <Route path="/nurse/messages" element={<ProtectedRoute role="nurse"><NurseMessages /></ProtectedRoute>} />
      <Route path="/nurse/chat/:otherId" element={<ProtectedRoute role="nurse"><NurseChat /></ProtectedRoute>} />
      <Route path="/nurse/profile" element={<ProtectedRoute role="nurse"><NurseProfile /></ProtectedRoute>} />
      <Route path="/nurse/alerts" element={<ProtectedRoute role="nurse"><NurseAlerts /></ProtectedRoute>} />
      <Route path="/nurse/stats" element={<ProtectedRoute role="nurse"><NurseStats /></ProtectedRoute>} />
      <Route path="/nurse/pain-plans" element={<ProtectedRoute role="nurse"><NursePainPlans /></ProtectedRoute>} />
      <Route path="/nurse/settings" element={<ProtectedRoute role="nurse"><NurseSettings /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
