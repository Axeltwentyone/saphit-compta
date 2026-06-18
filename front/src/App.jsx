import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import Login from './pages/Login'
import Layout from './pages/Layout'
import CommercialDashboard from './pages/dashboard/CommercialDashboard'
import GlobalDashboard from './pages/dashboard/GlobalDashboard'
import PropositionForm from './pages/commercial/PropositionForm'
import PropositionsList from './pages/propositions/PropositionsList'
import PropositionDetail from './pages/propositions/PropositionDetail'
import Clients from './pages/clients/Clients'
import FacturesList from './pages/factures/FacturesList'
import FactureForm from './pages/factures/FactureForm'
import FactureDetail from './pages/factures/FactureDetail'
import FactureImpression from './pages/factures/FactureImpression'
import Creances from './pages/creances/Creances'
import Avances from './pages/avances/Avances'
import Paiements from './pages/paiements/Paiements'
import ProduitsList from './pages/stock/ProduitsList'
import ProduitForm from './pages/stock/ProduitForm'
import ProduitDetail from './pages/stock/ProduitDetail'
import Rapports from './pages/rapports/Rapports'
import Utilisateurs from './pages/utilisateurs/Utilisateurs'
import Parametres from './pages/parametres/Parametres'
import JournalAudit from './pages/audit/JournalAudit'

function Dashboard() {
  const { user } = useAuth()
  return user.role === 'commercial' ? <CommercialDashboard /> : <GlobalDashboard />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute roles={['comptable', 'dg']} />}>
            <Route path="/factures/:id/imprimer" element={<FactureImpression />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/propositions" element={<PropositionsList />} />
              <Route path="/propositions/nouvelle" element={<PropositionForm />} />
              <Route path="/propositions/:id" element={<PropositionDetail />} />

              <Route element={<ProtectedRoute roles={['comptable', 'dg']} />}>
                <Route path="/clients" element={<Clients />} />

                <Route path="/factures" element={<FacturesList />} />
                <Route path="/factures/nouvelle" element={<FactureForm />} />
                <Route path="/factures/:id" element={<FactureDetail />} />

                <Route path="/creances" element={<Creances />} />
                <Route path="/avances" element={<Avances />} />
                <Route path="/paiements" element={<Paiements />} />

                <Route path="/stock" element={<ProduitsList />} />
                <Route path="/stock/nouveau" element={<ProduitForm />} />
                <Route path="/stock/:id" element={<ProduitDetail />} />

                <Route path="/rapports" element={<Rapports />} />
              </Route>

              <Route element={<ProtectedRoute roles={['dg']} />}>
                <Route path="/utilisateurs" element={<Utilisateurs />} />
                <Route path="/parametres" element={<Parametres />} />
                <Route path="/audit" element={<JournalAudit />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
