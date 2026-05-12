import { useState } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { BookOpen, CalendarDays, Sparkles, Menu, X, ListChecks, HelpCircle, LogOut, UserCircle, LayoutDashboard, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const nav = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/proyectos', label: 'Proyectos', icon: BookOpen, end: true },
  { to: '/secuencias', label: 'Secuencias', icon: ListChecks, end: false },
  { to: '/planificacion', label: 'Plan. Anual', icon: CalendarDays, end: false },
  { to: '/asistente', label: 'Asistente IA', icon: Sparkles, end: false },
];

// Solo 4 items en mobile bottom nav (sin Plan. Anual)
const mobileNav = nav.filter(n => n.to !== '/planificacion');

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm no-print sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-base font-bold select-none shrink-0">🌱</div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-none">Planificador Jardín</h1>
              <p className="text-xs text-slate-400 leading-none mt-0.5 hidden sm:block">Nivel Inicial</p>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Help + perfil + dark mode + logout */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/efemerides" title="Efemérides" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 dark:text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors">
              <CalendarDays size={15} />
            </Link>
            <Link to="/guia" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <HelpCircle size={15} />
              Ayuda
            </Link>
            <Link to="/perfil" title="Mi perfil" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors">
              <UserCircle size={15} />
            </Link>
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              onClick={signOut}
              title={user?.email}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden btn-ghost p-2"
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 flex flex-col gap-1">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
            <Link
              to="/efemerides"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <CalendarDays size={18} className="text-amber-500" />
              Efemérides
            </Link>
            <Link
              to="/perfil"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <UserCircle size={18} />
              Mi perfil
            </Link>
            <Link
              to="/guia"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <HelpCircle size={18} />
              Ayuda
            </Link>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors w-full text-left"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            </button>
            <button
              onClick={() => { setMenuOpen(false); signOut(); }}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors w-full text-left"
            >
              <LogOut size={18} />
              Cerrar sesión
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex no-print z-40">
        {mobileNav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                isActive ? 'text-emerald-600' : 'text-slate-400'
              }`
            }
          >
            <Icon size={19} />
            <span className="text-[10px]">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="md:hidden h-16 no-print" />
    </div>
  );
}
