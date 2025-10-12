import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./style/input.css";
import { MyContextProvider } from "./context/MyContext";
import config from "../public/config.json";

// ---------------------------
// Helper: parse JWT payload safely
// ---------------------------
const parseJwt = (token) => {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch (e) {
    return null;
  }
};

// ---------------------------
// Client-side password validation (matches backend rules)
// >8 and <24, at least one lowercase, one uppercase, one digit, one special char
// ---------------------------
const isPasswordValid = (password) => {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{9,23}$/;
  return re.test(password);
};

// ---------------------------
// Auth context
// ---------------------------
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const API_ROOT = `http://${localStorage.getItem("host")}:4000/api/auth`;

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(
    () => localStorage.getItem("refreshToken") || null
  );
  const [loading, setLoading] = useState(true);

  // IMPORTANT: In production prefer httpOnly secure cookies for tokens. LocalStorage has XSS risks.

  // Attach tokens when available
  useEffect(() => {
    if (accessToken) {
      const payload = parseJwt(accessToken);
      if (payload)
        setUser({ id: payload.userId, email: payload.email, username: payload.username });
    } else {
      setUser(null);
    }
  }, [accessToken]);

  // Initialize from localStorage (if refresh token exists, try to refresh automatically)
  useEffect(() => {
    const init = async () => {
      if (refreshToken) {
        try {
          await refreshAccessToken(refreshToken);
        } catch (e) {
          // ignored; user will see login
          console.warn("refresh failed at init", e);
          localStorage.removeItem("refreshToken");
          setRefreshToken(null);
          setAccessToken(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  // Automatic background refresh: refresh 2 minutes before expiry
  useEffect(() => {
    if (!accessToken) return;
    const payload = parseJwt(accessToken);
    if (!payload || !payload.exp) return;
    const expiresAt = payload.exp * 1000;
    const now = Date.now();
    const msUntilRefresh = expiresAt - now - 2 * 60 * 1000; // 2 minutes before expiry
    const timer =
      msUntilRefresh > 0
        ? setTimeout(() => refreshWithStoredToken(), msUntilRefresh)
        : refreshWithStoredToken();
    return () => clearTimeout(timer);
  }, [accessToken]);

  const refreshWithStoredToken = useCallback(async () => {
    if (!refreshToken) return;
    try {
      await refreshAccessToken(refreshToken);
    } catch (e) {
      console.warn("refreshWithStoredToken failed", e);
      // on failure, force logout client-side
      await logout();
    }
  }, [refreshToken]);

  // Core network helpers
  const post = async (path, body, auth = false) => {
    const headers = { "Content-Type": "application/json" };
    if (auth && accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    const res = await fetch(`${API_ROOT}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(json?.message || res.statusText || "Network error");
      err.status = res.status;
      err.payload = json;
      throw err;
    }
    return json;
  };

  // Signup
  const signup = async ({ email, username, password, firstName, lastName }) => {
    // client-side validation

    // call backend
    const data = await post("/signup", { email, username, password, firstName, lastName }, false);

    // set tokens if returned
    if (data?.data?.accessToken) setAccessToken(data.data.accessToken);
    if (data?.data?.refreshToken) {
      setRefreshToken(data.data.refreshToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      localStorage.setItem("userId", data.data.user.id);
      localStorage.setItem("accessToken", data.data.accessToken);
    }

    return data;
  };

  // Login
  const login = async ({ identifier, password }) => {
    // allow same password rules at client-side

    const data = await post("/login", { identifier, password }, false);

    if (data?.data?.accessToken) setAccessToken(data.data.accessToken);
    if (data?.data?.refreshToken) {
      setRefreshToken(data.data.refreshToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);
    }
    if (data?.data?.accessToken) {
      localStorage.setItem("accessToken", data.data.accessToken);
    }
    if (data?.data?.refreshToken) {
      localStorage.setItem("refreshToken", data.data.refreshToken);
    }
    if (data?.data?.user) {
      localStorage.setItem("userId", data.data.user.id);
    }

    return data;
  };

  // Refresh access token using refresh token
  const refreshAccessToken = async (rToken) => {
    // endpoint assumed /refresh (if different, change)
    const res = await fetch(`${API_ROOT}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rToken }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(json?.message || res.statusText || "Refresh failed");
      err.status = res.status;
      err.payload = json;
      throw err;
    }

    if (json?.data?.accessToken) setAccessToken(json.data.accessToken);
    if (json?.data?.refreshToken) {
      setRefreshToken(json.data.refreshToken);
      localStorage.setItem("refreshToken", json.data.refreshToken);
    }

    return json;
  };

  // Logout
  const logout = async () => {
    try {
      // call backend to invalidate tokens
      await post("/logout", { refreshToken }, true);
    } catch (e) {
      // ignore network errors but continue clearing client
      console.warn("logout request failed", e);
    }
    // clear client state
    setAccessToken(null);
    setUser(null);
    setRefreshToken(null);
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("isLoggedIn");
  };

  const value = {
    user,
    loading,
    accessToken,
    isAuthenticated: !!accessToken,
    login,
    signup,
    logout,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ---------------------------
// Login UI component (refactored)
// ---------------------------
const Login = ({ onLoginSuccess, switchToSignup }) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const auth = useAuth();

  useEffect(() => {
    if (config?.username) setIdentifier(config.username);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    setLoading(true);
    try {
      await auth.login({ identifier, password });
      localStorage.setItem("isLoggedIn", "true");
      onLoginSuccess?.();
      location.reload();
    } catch (err) {
      if (err?.payload?.error === "INVALID_CREDENTIALS")
        setError("نام کاربری یا رمز عبور اشتباه است.");
      else if (err?.payload?.error === "VALIDATION_ERROR") {
        const messages = Object.values(err.payload.errors || {}).join(" - ");
        setError(messages || "خطای اعتبارسنجی");
      } else setError(err.message || "خطا در ورود");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="flex flex-col justify-center items-center h-screen bg-slate-200">
      <Network />
      <div className="max-w-md mx-auto relative overflow-hidden z-10 bg-white p-8 rounded-lg shadow-md before:w-24 before:h-24 before:absolute before:bg-purple-500 before:rounded-full before:-z-10 before:blur-2xl after:w-32 after:h-32 after:absolute after:bg-sky-400 after:rounded-full after:-z-10 after:blur-xl after:top-24 after:-right-12">
        <h2 className="text-2xl text-sky-900 font-bold mb-6">ورود به نرم‌افزار</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600">نام کاربری یا ایمیل</label>
            <input
              dir="ltr"
              name="identifier"
              className="mt-1 p-2 w-full border rounded-md"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600">رمز عبور</label>
            <input
              dir="ltr"
              className="mt-1 p-2 w-full border rounded-md"
              name="password"
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}

          <div className="flex justify-between items-center gap-3 mt-6">
            <button
              type="button"
              onClick={switchToSignup}
              className="text-sm underline text-sky-700"
            >
              ثبت‌نام
            </button>

            <button
              disabled={loading}
              className="[background:linear-gradient(144deg,#af40ff,#5b42f3_50%,#00ddeb)] text-white w-full px-4 py-2 font-bold rounded-md hover:opacity-80 disabled:opacity-50"
              type="submit"
            >
              {loading ? "در حال پردازش..." : "ورود"}
            </button>
          </div>
        </form>
      </div>
      <div className="text-slate-400 text-xs mt-3">تولید شده توسط شرکت مبنا رایانه کیان</div>
      <div className="text-slate-400 text-xs mt-3"> www.mrk.co.ir</div>
    </div>
  );
};

const Network = () => {
  const host = window.location.hostname;
  const [form, setForm] = useState(() => localStorage.getItem("host") || host);

  // اگر خواستی هنگام mount هر بار از localStorage تازه بخوانی:
  useEffect(() => {
    const stored = localStorage.getItem("host") || host;
    if (stored !== form) setForm(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // فقط یکبار on mount

  const handleChange = (e) => {
    const v = e.target.value;
    setForm(v);
    // ذخیره بلافاصله در localStorage
    localStorage.setItem("host", v);
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    // اگر لازم باشه کاری فراتر از ذخیره محلی انجام بدی، اینجا انجام بده
    // مثلاً فراخوانی API، اعتبارسنجی، یا ارسال event به بالا
    // console.log("Saved host:", form);
    location.reload();
  };

  return (
    <div dir="rtl" className="flex flex-col justify-center items-center bg-slate-200">
      <div className="mb-3 w-full max-w-md">
        <label className="block text-sm font-medium text-gray-600">اتصال به شبکه</label>
        <input
          dir="ltr"
          name="host"
          className="mt-1 p-2 w-full border rounded-md"
          type="text"
          value={form}
          onChange={handleChange}
          placeholder="192.168.1.100"
          autoComplete="off"
        />
        <div className="mt-2 flex gap-2">
          <button className="text-sm underline text-sky-700" onClick={handleSaveClick}>
            ثبت شبکه
          </button>
          <button
            className="text-sm underline text-gray-600"
            onClick={() => {
              setForm("");
              localStorage.removeItem("host");
            }}
          >
            پاک کردن
          </button>
        </div>
      </div>
    </div>
  );
};

export default Network;

// ---------------------------
// Signup UI component
// ---------------------------
const Signup = ({ onSignupSuccess, switchToLogin }) => {
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const auth = useAuth();

  const handleChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    setLoading(true);
    try {
      await auth.signup(form);
      localStorage.setItem("isLoggedIn", "true");
      onSignupSuccess?.();
    } catch (err) {
      if (err?.payload?.error === "VALIDATION_ERROR") {
        const messages = Object.values(err.payload.errors || {}).join(" - ");
        setError(messages || "خطای اعتبارسنجی");
      } else setError(err.message || "خطا در ثبت‌نام");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="flex flex-col justify-center items-center h-screen bg-slate-200">
      <Network />
      <div className="max-w-md mx-auto relative overflow-hidden z-10 bg-white p-8 rounded-lg shadow-md before:w-24 before:h-24 before:absolute before:bg-purple-500 before:rounded-full before:-z-10 before:blur-2xl after:w-32 after:h-32 after:absolute after:bg-sky-400 after:rounded-full after:-z-10 after:blur-xl after:top-24 after:-right-12">
        <h2 className="text-2xl text-sky-900 font-bold mb-6">ثبت‌نام</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-600">ایمیل</label>
            <input
              dir="ltr"
              name="email"
              className="mt-1 p-2 w-full border rounded-md"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-600">نام کاربری</label>
            <input
              dir="ltr"
              name="username"
              className="mt-1 p-2 w-full border rounded-md"
              type="text"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-600">نام</label>
            <input
              dir="ltr"
              name="firstName"
              className="mt-1 p-2 w-full border rounded-md"
              type="text"
              value={form.firstName}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-600">نام خانوادگی</label>
            <input
              dir="ltr"
              name="lastName"
              className="mt-1 p-2 w-full border rounded-md"
              type="text"
              value={form.lastName}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600">رمز عبور</label>
            <input
              dir="ltr"
              name="password"
              id="password"
              className="mt-1 p-2 w-full border rounded-md"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}

          <div className="flex justify-between items-center gap-3 mt-6">
            <button
              type="button"
              onClick={switchToLogin}
              className="text-sm underline text-sky-700"
            >
              ورود
            </button>

            <button
              disabled={loading}
              className="[background:linear-gradient(144deg,#af40ff,#5b42f3_50%,#00ddeb)] text-white w-full px-4 py-2 font-bold rounded-md hover:opacity-80 disabled:opacity-50"
              type="submit"
            >
              {loading ? "در حال پردازش..." : "ثبت‌نام"}
            </button>
          </div>
        </form>
      </div>
      <div className="text-slate-400 text-xs mt-3">تولید شده توسط شرکت مبنا رایانه کیان</div>
      <div className="text-slate-400 text-xs mt-3"> www.mrk.co.ir</div>
    </div>
  );
};

// ---------------------------
// AuthForm: switch between Login and Signup
// ---------------------------
const AuthForm = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'

  return mode === "login" ? (
    <Login onLoginSuccess={onAuthSuccess} switchToSignup={() => setMode("signup")} />
  ) : (
    <Signup onSignupSuccess={onAuthSuccess} switchToLogin={() => setMode("login")} />
  );
};

// ---------------------------
// Main app entry: mounts App or AuthForm based on auth
// ---------------------------
const root = ReactDOM.createRoot(document.getElementById("root"));

const Main = () => {
  const [checkLogin, setCheckLogin] = useState(() => localStorage.getItem("isLoggedIn") === "true");

  return (
    <AuthProvider>
      <MyContextProvider>
        <AppEntry checkLogin={checkLogin} setCheckLogin={setCheckLogin} />
      </MyContextProvider>
    </AuthProvider>
  );
};

const AppEntry = ({ checkLogin, setCheckLogin }) => {
  const auth = useAuth();

  useEffect(() => {
    if (auth.isAuthenticated) setCheckLogin(true);
  }, [auth.isAuthenticated]);

  if (auth.loading)
    return <div className="h-screen flex items-center justify-center">در حال بارگذاری...</div>;

  return auth.isAuthenticated ? (
    <App />
  ) : (
    <AuthForm
      onAuthSuccess={() => {
        setCheckLogin(true);
      }}
    />
  );
};

root.render(<Main />);

// ---------------------------
// Notes (درون فایل):
// 1) این پیاده‌سازی فرض می‌کند مسیرهای backend به صورت زیر هستند:
//    POST /auth/login
//    POST /auth/signup
//    POST /auth/logout
//    POST /auth/refresh   (برای تمدید با refreshToken)
//    اگر مسیرها یا فرمت پاسخ متفاوت است، فقط توابع post/refreshAccessToken را مطابق تنظیمات سرور تغییر دهید.
// 2) در عمل امنیتی، توصیه می‌شود refresh token را در httpOnly secure cookie قرار دهید تا از XSS محافظت شود.
// 3) این نسخه شامل اعتبارسنجی کلاینتی پسورد مطابق قوانین ذکر شده، مدیریت خودکار تمدید توکن و امکان سوئیچ بین صفحه ورود و ثبت‌نام است.
// ---------------------------
