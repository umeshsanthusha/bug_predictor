import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ChatProvider } from './chat/ChatContext'
import { RedirectIfAuthed, RequireAuth } from './components/ProtectedRoute'
import ChatView from './pages/ChatView'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Predictor from './pages/Predictor'
import Profile from './pages/Profile'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'
import Settings from './pages/Settings'

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/login"
            element={
              <RedirectIfAuthed>
                <Login />
              </RedirectIfAuthed>
            }
          />
          <Route
            path="/register"
            element={
              <RedirectIfAuthed>
                <Register />
              </RedirectIfAuthed>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <RedirectIfAuthed>
                <ForgotPassword />
              </RedirectIfAuthed>
            }
          />
          {/* Not guarded: a recovery link creates a session, and the user must
              still be allowed to land here to pick a new password. */}
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          >
            <Route index element={<Predictor />} />
            <Route path="chat/:chatId" element={<ChatView />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </ChatProvider>
    </AuthProvider>
  )
}
