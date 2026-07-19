// ── Auth Page (Login / Register) ─────────────────────────────────────
// Unified authentication screen with toggle between Login and Register
// modes. Includes social OAuth button placeholders.

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { Youtube, Linkedin, Facebook } from "@/components/icons/BrandIcons";
import ApsmLogo from "@/assets/images/apsm-logo.svg";

// Helper: check if path is signup (handles trailing slashes)
const isSignupPath = (path) => {
  return path.replace(/\/$/, "") === "/signup";
};

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, user, loading: authLoading } = useAuth();

  // ── State management ──────────────────────────────────────────────
  const [isLogin, setIsLogin] = useState(!isSignupPath(location.pathname));
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  // ── Sync login/signup mode with path changes ─────────────────────
  useEffect(() => {
    setIsLogin(!isSignupPath(location.pathname));
  }, [location.pathname]);

  // ── Redirect authenticated users away from auth pages ───────────
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/dashboard/youtube", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // ── Form input handler ────────────────────────────────────────────
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  // ── Form submission handler ───────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      navigate("/dashboard/youtube");
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // ── Session verification state ────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center flex-col">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-500/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-purple-500 rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-slate-400 font-medium animate-pulse">Verifying Session...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* ── Background Gradient Orbs ──────────────────────────────────── */}
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl" />

      <Card className="relative w-full max-w-md border-border/50 shadow-2xl shadow-violet-500/5">
        {/* ── Card Header / Branding ──────────────────────────────────── */}
        <CardHeader className="text-center">
          <img src={ApsmLogo} alt="APSM Logo" className="h-12 w-auto object-contain mx-auto mb-4" />
          <CardTitle className="text-2xl">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? "Sign in to access your analytics dashboard"
              : "Get started with APSM"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* ── Error Alert ──────────────────────────────────────────────── */}
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* ── Auth Form ────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ── Name Field (Register only) ────────────────────────────── */}
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="auth-name" className="text-sm font-medium">
                  Full Name
                </label>
                <input
                  id="auth-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required={!isLogin}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            )}

            {/* ── Email Field ────────────────────────────────────────────── */}
            <div className="space-y-2">
              <label htmlFor="auth-email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="auth-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            {/* ── Password Field ──────────────────────────────────────────── */}
            <div className="space-y-2">
              <label htmlFor="auth-password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* ── Submit Button ──────────────────────────────────────────── */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              id="auth-submit-btn"
            >
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          {/* ── Divider ──────────────────────────────────────────────────── */}
          {/* 
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">OR CONTINUE WITH</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          */}

          {/* ── Social OAuth Buttons ─────────────────────────────────────── */}
          {/* 
          <div className="grid grid-cols-3 gap-3">
            <Button variant="outline" className="gap-2" id="auth-google-btn">
              <Youtube className="h-4 w-4 text-red-500" />
            </Button>
            <Button variant="outline" className="gap-2" id="auth-linkedin-btn">
              <Linkedin className="h-4 w-4 text-blue-600" />
            </Button>
            <Button variant="outline" className="gap-2" id="auth-facebook-btn">
              <Facebook className="h-4 w-4 text-blue-500" />
            </Button>
          </div>
          */}

          {/* ── Toggle Login/Register ────────────────────────────────────── */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                const nextMode = !isLogin;
                setIsLogin(nextMode);
                setError("");
                navigate(nextMode ? "/login" : "/signup");
              }}
              className="font-medium text-primary underline-offset-4 hover:underline"
              id="auth-toggle-mode"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

