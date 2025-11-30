import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import type { ReactElement } from 'react';
import { User, Shield } from 'lucide-react';
import { AttendanceProvider } from './context/AttendanceContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EmployeePage } from './pages/EmployeePage';
import { AdminPage } from './pages/AdminPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import './styles/App.css';

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>กำลังตรวจสอบสิทธิ์...</h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function AppShell() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
            <img src="/logo.svg" alt="ETC Foodbox" className="nav-logo" />
            <h1>ETC HR Cloud</h1>
          </div>
          <div className="nav-links">
            <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <User size={20} />
              พนักงาน
            </NavLink>
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <Shield size={20} />
              ผู้ตรวจสอบ
            </NavLink>
          </div>
          {isAuthenticated && (
            <button className="nav-logout" onClick={logout}>
              ออกจากระบบ
            </button>
          )}
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<EmployeePage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>

        <footer className="footer">
          <p>ETC HR Cloud System © 2025</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AttendanceProvider>
        <AppShell />
      </AttendanceProvider>
    </AuthProvider>
  );
}

export default App;
