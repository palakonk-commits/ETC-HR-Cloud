import { useEffect, useState } from 'react';
import { ShieldCheck, LockKeyhole, Mail } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AdminLoginPage() {
  const { login, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const success = await login(username, password);

    if (success) {
      const redirectTo = (location.state as { from?: string })?.from || '/admin';
      navigate(redirectTo, { replace: true });
    } else {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }

    setSubmitting(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-icon">
          <ShieldCheck size={40} />
        </div>
        <h1>เข้าสู่ระบบผู้ตรวจสอบ</h1>
        <p>สำหรับเจ้าหน้าที่ ETC HR Cloud เท่านั้น</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            อีเมล
            <div className="auth-input-wrapper">
              <Mail size={18} />
              <input
                type="email"
                required
                placeholder="admin@etcfoodbox.co"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </label>

          <label>
            รหัสผ่าน
            <div className="auth-input-wrapper">
              <LockKeyhole size={18} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <small className="auth-note">
          ระบบจะบันทึกสถานะการเข้าสู่ระบบไว้ในเครื่องนี้เท่านั้น
        </small>
      </div>
    </div>
  );
}
