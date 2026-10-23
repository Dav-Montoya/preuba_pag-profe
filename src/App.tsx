import { useEffect, useState } from "react";
import { useAuth } from "./hooks/useAuth";

// ==========================================
// Subcomponentes
// ==========================================

function Header() {
  return (
    <div className="flex flex-col items-center mb-6">
      <div className="w-16 h-16 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
            d="M12 14l9-5-9-5-9 5 9 5z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
            d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight">Cursos App</h1>
    </div>
  );
}

interface LoginFormProps {
  credentials: { email: string; password: string };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogin: (creds: { email: string; password: string }) => void;
}

function LoginForm({ credentials, onChange, onLogin }: LoginFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(credentials);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-sm mt-2">
      <p className="text-sm text-zinc-400 font-medium text-center">
        Por favor, inicia sesión
      </p>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-zinc-800"></div>
        <span className="flex-shrink mx-4 text-xs text-zinc-500 uppercase tracking-wider">
          o prueba con tus datos
        </span>
        <div className="flex-grow border-t border-zinc-800"></div>
      </div>

      <input
        type="email"
        name="email"
        value={credentials.email}
        onChange={onChange}
        placeholder="Correo electrónico"
        required
        className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
      />
      <input
        type="password"
        name="password"
        value={credentials.password}
        onChange={onChange}
        placeholder="Contraseña"
        required
        className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
      />
      <button
        type="submit"
        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-200 cursor-pointer active:scale-95"
      >
        Iniciar sesión
      </button>
    </form>
  );
}

interface UserDashboardProps {
  userEmail?: string;
  onLogout: () => void;
}

function UserDashboard({ userEmail, onLogout }: UserDashboardProps) {
  return (
    <div className="flex flex-col items-center gap-4 mt-2 w-full">
      <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-300">
        Bienvenido,{" "}
        <span className="font-semibold text-zinc-100">{userEmail}</span>
      </div>
      <button
        type="button"
        className="py-2 px-5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 font-medium rounded-xl transition-all duration-200 cursor-pointer active:scale-95 text-sm"
        onClick={onLogout}
      >
        Cerrar sesión
      </button>
    </div>
  );
}

// ==========================================
// Componente Principal (App)
// ==========================================

export default function App() {
  const { user, isAuthenticated, isLoading, login, logout, checkSession } =
    useAuth();
  const [credentials, setCredentials] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6">
        <section className="flex flex-col items-center text-center max-w-sm w-full">
          <Header />
          <p className="text-zinc-400 text-sm animate-pulse">
            Iniciando sesión...
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
      <section className="flex flex-col items-center text-center max-w-md w-full py-12">
        <Header />

        {isAuthenticated ? (
          <UserDashboard userEmail={user?.email} onLogout={logout} />
        ) : (
          <LoginForm
            credentials={credentials}
            onChange={handleChange}
            onLogin={login}
          />
        )}
      </section>
    </main>
  );
}