// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/client";
import { Field, Input } from "../components/ui/Input";
import Button from "../components/ui/Button";
import logo from "../assets/logo.png";

export default function Login() {
  const { login, coach } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (coach) {
    navigate("/", { replace: true });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, white 0, transparent 40%), radial-gradient(circle at 80% 80%, white 0, transparent 40%)",
        }}
      />
      <div className="relative w-full max-w-sm">
        <div className="bg-cream-card notch-tr rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <img src={logo} alt="Elite Fitness Academy" className="h-20 w-20 rounded-full mb-4" />
            <h1 className="font-display font-extrabold text-xl text-ink">Elite Fitness Academy</h1>
            <p className="text-sm text-muted mt-1">نظام إدارة الجيم واللاعبين</p>
            <div className="h-[3px] w-12 bg-red rounded-full mt-4" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="اسم المستخدم" required>
              <Input
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                autoComplete="username"
                required
              />
            </Field>
            <Field label="كلمة المرور" required>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </Field>

            {error && (
              <div className="bg-danger-soft text-red text-sm rounded-lg px-3.5 py-2.5">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              تسجيل الدخول
            </Button>
          </form>
        </div>
        <p className="text-center text-cream/40 text-xs mt-5">
          Since 2009 — مخصص للمدرب فقط
        </p>
      </div>
    </div>
  );
}
