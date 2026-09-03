import { useState } from 'react';
import { 
  ShieldCheck, 
  PenLine, 
  BookOpen, 
  Sparkles, 
  BarChart3, 
  LogOut, 
  Menu, 
  X, 
  Lock,
  User as UserIcon
} from 'lucide-react';
import type { DashboardTab, UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile;
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
}

export function Navbar({
  user,
  activeTab,
  onSelectTab,
  onOpenProfile,
  onSignOut,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{ id: DashboardTab; label: string; shortLabel: string; icon: typeof PenLine }> = [
    { id: 'new', label: 'New Journal', shortLabel: 'New', icon: PenLine },
    { id: 'history', label: 'Journal History', shortLabel: 'History', icon: BookOpen },
    { id: 'ai-assistant', label: 'AI Assistant', shortLabel: 'Assistant', icon: Sparkles },
    { id: 'insights', label: 'Reflection Insights', shortLabel: 'Insights', icon: BarChart3 },
  ];

  const handleNavClick = (tab: DashboardTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0F0F12]/95 backdrop-blur-md border-b border-[#27272A] text-[#E4E4E7] w-full max-w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              id="nav-brand-logo"
              type="button"
              onClick={() => onSelectTab('history')}
              className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer shrink-0"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-950/40 group-hover:opacity-90 transition-opacity shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  GeminiVault
                  <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hidden sm:inline">
                    Vault v1
                  </span>
                </span>
                <span className="hidden lg:block text-xs text-[#71717A] font-sans truncate">
                  Secure AI Personal Journal
                </span>
              </div>
            </button>

            {/* Security Isolation Indicator (Desktop) */}
            <div className="hidden 2xl:flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-mono shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
              <span>Isolated UID Security Active</span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#1E1E22] text-white border border-[#27272A] shadow-sm font-semibold'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-[#1E1E22]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-[#71717A]'}`} />
                  <span className="hidden lg:inline">{item.label}</span>
                  <span className="inline lg:hidden">{item.shortLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile & Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
            <button
              id="user-profile-button"
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#27272A] bg-[#141417] hover:bg-[#1E1E22] hover:border-indigo-500/50 transition-colors text-left cursor-pointer"
              title="View Account & Security Details"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full object-cover border border-[#27272A] shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {user.displayName ? user.displayName.slice(0, 2).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                </div>
              )}
              <div className="max-w-[90px] lg:max-w-[130px] min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user.displayName || 'Journaler'}
                </p>
                <p className="hidden lg:block text-[10px] text-[#71717A] truncate">
                  {user.email || 'Google Account'}
                </p>
              </div>
            </button>

            <button
              id="sign-out-button"
              type="button"
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-[#71717A] hover:text-rose-400 hover:bg-[#1E1E22] rounded-lg transition-colors border border-transparent hover:border-[#27272A] cursor-pointer"
              title="Sign Out of GeminiVault"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="hidden xl:inline">Sign Out</span>
            </button>
          </div>

          {/* Mobile Menu Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="mobile-menu-toggle"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#1E1E22] transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div id="mobile-nav-drawer" className="md:hidden border-t border-[#27272A] bg-[#0F0F12] px-4 pt-3 pb-6 space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-[#27272A]">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-9 h-9 rounded-full object-cover border border-[#27272A]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                {user.displayName ? user.displayName.slice(0, 2).toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user.displayName || 'Journaler'}
              </p>
              <p className="text-xs text-[#71717A] truncate">
                {user.email}
              </p>
            </div>
            <button
              id="mobile-profile-details-button"
              type="button"
              onClick={() => {
                onOpenProfile();
                setMobileMenuOpen(false);
              }}
              className="text-xs text-indigo-400 hover:underline px-2 py-1 cursor-pointer"
            >
              Security
            </button>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`mobile-tab-${item.id}`}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#1E1E22] text-white font-semibold border border-[#27272A]'
                      : 'text-[#A1A1AA] hover:bg-[#1E1E22] hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-[#71717A]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#27272A] flex items-center justify-between">
            <span className="text-[11px] text-green-400 flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              Owner Isolated
            </span>
            <button
              id="mobile-sign-out-button"
              type="button"
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
