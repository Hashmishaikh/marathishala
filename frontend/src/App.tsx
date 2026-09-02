import { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminDashboardScreen } from './screens/AdminDashboardScreen';
import { AdminScorerScreen } from './screens/AdminScorerScreen';
import { MatchViewerScreen } from './screens/MatchViewerScreen';
import { SeriesHubScreen } from './screens/SeriesHubScreen';
import { TeamsPlayersScreen } from './screens/TeamsPlayersScreen';
import { CreateMatchScreen } from './screens/CreateMatchScreen';
import { getMatches } from './services/api';
import type { Match } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<'viewer' | 'series' | 'teams' | 'scorer' | 'create' | 'admin'>('viewer');
  const [activeMatchId, setActiveMatchId] = useState<string>('');
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);

  // Admin Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('msca_admin_auth') === 'true';
  });
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);
  const [intendedAdminTab, setIntendedAdminTab] = useState<'admin' | 'scorer' | 'create'>('admin');

  const fetchInitialMatch = async () => {
    try {
      const matches = await getMatches();
      if (matches.length > 0) {
        // Pick Live match first, or latest match
        const live = matches.find(m => m.status === 'Live') || matches[0];
        setActiveMatchId(live._id);
        setActiveMatch(live);
      }
    } catch (err) {
      console.error('Error fetching initial match:', err);
    }
  };

  useEffect(() => {
    fetchInitialMatch();
  }, []);

  const handleTabChange = (tab: 'viewer' | 'series' | 'teams' | 'scorer' | 'create' | 'admin') => {
    // Check if trying to access protected admin tabs
    if (['admin', 'scorer', 'create'].includes(tab)) {
      if (!isAdminLoggedIn) {
        setIntendedAdminTab(tab as 'admin' | 'scorer' | 'create');
        setIsAdminLoginModalOpen(true);
        return;
      }
    }
    setCurrentTab(tab);
  };

  const handleLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setCurrentTab(intendedAdminTab);
  };

  const handleLogoutAdmin = () => {
    localStorage.removeItem('msca_admin_auth');
    setIsAdminLoggedIn(false);
    setCurrentTab('viewer');
  };

  const handleMatchCreated = (newMatchId: string) => {
    setActiveMatchId(newMatchId);
    setCurrentTab('scorer');
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      
      {/* Top Navbar */}
      <Header
        currentTab={currentTab}
        onTabChange={handleTabChange}
        activeMatchTitle={activeMatch?.title}
        isLive={activeMatch?.status === 'Live'}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminLogin={() => {
          setIntendedAdminTab('admin');
          setIsAdminLoginModalOpen(true);
        }}
        onLogoutAdmin={handleLogoutAdmin}
      />

      {/* Main Content Area (With extra bottom padding on mobile for sticky nav bar) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8">
        
        {/* PUBLIC SPECTATOR TAB: Live Score & Match Center */}
        {currentTab === 'viewer' && (
          <MatchViewerScreen
            selectedMatchId={activeMatchId}
            onSelectMatch={(id) => setActiveMatchId(id)}
            onNavigate={handleTabChange}
            isAdminLoggedIn={isAdminLoggedIn}
          />
        )}

        {/* PUBLIC SPECTATOR TAB: Tournament Standings & NRR */}
        {currentTab === 'series' && (
          <SeriesHubScreen
            onSelectMatch={(id) => setActiveMatchId(id)}
            onNavigateTab={handleTabChange}
            isAdminLoggedIn={isAdminLoggedIn}
          />
        )}

        {/* PUBLIC SPECTATOR TAB: Roster & Player Stats */}
        {currentTab === 'teams' && (
          <TeamsPlayersScreen 
            isAdminLoggedIn={isAdminLoggedIn}
          />
        )}

        {/* PROTECTED ADMIN SECTION: Admin Operations Hub */}
        {currentTab === 'admin' && (
          <AdminDashboardScreen
            onNavigate={handleTabChange}
            onSelectMatch={(id) => setActiveMatchId(id)}
            onLogout={handleLogoutAdmin}
          />
        )}

        {/* PROTECTED ADMIN SECTION: Touch Scorer Console */}
        {currentTab === 'scorer' && (
          activeMatchId ? (
            <AdminScorerScreen 
              matchId={activeMatchId} 
              onMatchSelect={setActiveMatchId} 
            />
          ) : (
            <div className="max-w-md mx-auto py-8 text-center space-y-4 glass-panel p-8">
              <span className="text-4xl">🏏</span>
              <h2 className="text-xl font-bold text-white">No Match Selected</h2>
              <p className="text-xs text-slate-400">
                Please create or select an active fixture to start scoring.
              </p>
              <button
                onClick={() => setCurrentTab('create')}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-orange-500/20"
              >
                + Create New Fixture
              </button>
            </div>
          )
        )}

        {/* PROTECTED ADMIN SECTION: Match Fixture Creator */}
        {currentTab === 'create' && (
          <CreateMatchScreen onMatchCreated={handleMatchCreated} />
        )}

      </main>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Desktop Footer (Hidden on Mobile) */}
      <footer className="hidden md:block border-t border-white/5 py-4 text-center text-xs text-slate-400 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-white">MSCA</span>
            <span>— Marathishala Cricket Association • Gully Pro Edition</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400 text-[11px]">
            <span>Dynamic Squads (3v3 - 11v11)</span>
            <span>•</span>
            <span>Configurable Extras</span>
            <span>•</span>
            <span>Double Batting & Opposite Hand</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
