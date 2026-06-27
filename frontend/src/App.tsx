import { Navigate, Route, Routes } from 'react-router-dom'

import Layout from './components/Layout'
import { RequireAuth } from './auth/RequireAuth'
import Dashboard from './pages/Dashboard'
import Demo from './pages/Demo'
import Help from './pages/Help'
import Home from './pages/Home'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Signup from './pages/Signup'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/help" element={<Help />} />
      <Route path="/demo" element={<Demo />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
