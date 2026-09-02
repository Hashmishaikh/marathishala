import { Trophy, Radio, Users, Lock, ShieldCheck, LogOut } from 'lucide-react';

interface HeaderProps {
  currentTab: 'viewer' | 'series' | 'teams' | 'scorer' | 'create' | 'admin';
  onTabChange: (tab: 'viewer' | 'series' | 'teams' | 'scorer' | 'create' | 'admin') => void;
  activeMatchTitle?: string;
  isLive?: boolean;
  isAdminLoggedIn: boolean;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  activeMatchTitle,
  isLive = false,
  isAdminLoggedIn,
  onOpenAdminLogin,
  onLogoutAdmin
}) => {
  return (
    <>
      {/* Desktop & Tablet Top Sticky Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/85 backdrop-blur-xl shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Title */}
            <div 
              className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer select-none" 
              onClick={() => onTabChange('viewer')}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-orange-500 flex items-center justify-center shadow-lg shadow-sky-500/20 text-lg sm:text-xl">
                🏏
              </div>
              <div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-sky-400 via-sky-200 to-orange-400 bg-clip-text text-transparent">
                    MSCA
                  </span>
                  <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    GULLY PRO
                  </span>
                  {isLive && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                      <span className="w-1.5 h-1.5 mr-1 rounded-full bg-rose-500"></span>
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate max-w-[140px] sm:max-w-xs">
                  {activeMatchTitle || 'Marathishala Cricket Association'}
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-2">
              <button
                onClick={() => onTabChange('viewer')}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  currentTab === 'viewer'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Radio className="w-4 h-4 text-indigo-400" />
                <span>Live Match</span>
              </button>

              <button
                onClick={() => onTabChange('series')}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  currentTab === 'series'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Tournaments</span>
              </button>

              <button
                onClick={() => onTabChange('teams')}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  currentTab === 'teams'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Roster</span>
              </button>

              {/* Admin Button in Desktop Header */}
              {isAdminLoggedIn ? (
                <div className="flex items-center space-x-1.5 pl-2 border-l border-white/10">
                  <button
                    onClick={() => onTabChange('admin')}
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      currentTab === 'admin' || currentTab === 'scorer' || currentTab === 'create'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/20'
                        : 'bg-slate-800 text-amber-400 border border-amber-500/30 hover:bg-slate-700'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Admin Hub</span>
                  </button>

                  <button
                    onClick={onLogoutAdmin}
                    title="Lock Admin Session"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenAdminLogin}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs sm:text-sm font-bold shadow-md shadow-amber-950/40 transition-all ml-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin Login</span>
                </button>
              )}
            </nav>

            {/* Mobile Header Quick Admin Lock Indicator */}
            <div className="md:hidden flex items-center space-x-2">
              {isAdminLoggedIn ? (
                <button
                  onClick={() => onTabChange('admin')}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center space-x-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Hub</span>
                </button>
              ) : (
                <button
                  onClick={onOpenAdminLogin}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center space-x-1"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* MOBILE STICKY BOTTOM NAVIGATION BAR (Thumb-friendly on phone) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-2xl border-t border-white/10 px-2 py-1.5 shadow-2xl flex items-center justify-around">
        <button
          onClick={() => onTabChange('viewer')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            currentTab === 'viewer'
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Live</span>
        </button>

        <button
          onClick={() => onTabChange('series')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            currentTab === 'series'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Series</span>
        </button>

        <button
          onClick={() => onTabChange('teams')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            currentTab === 'teams'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Roster</span>
        </button>

        <button
          onClick={() => {
            if (isAdminLoggedIn) {
              onTabChange('admin');
            } else {
              onOpenAdminLogin();
            }
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            currentTab === 'admin' || currentTab === 'scorer' || currentTab === 'create'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {isAdminLoggedIn ? (
            <ShieldCheck className="w-5 h-5 mb-0.5 text-amber-400" />
          ) : (
            <Lock className="w-5 h-5 mb-0.5 text-slate-400" />
          )}
          <span className="text-[10px] tracking-tight">
            {isAdminLoggedIn ? 'Admin Hub' : 'Admin'}
          </span>
        </button>
      </nav>
    </>
  );
};
