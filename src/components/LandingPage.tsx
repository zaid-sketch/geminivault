import { useState } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  Sparkles, 
  KeyRound, 
  BookMarked, 
  ArrowRight,
  Database,
  EyeOff,
  CheckCircle2,
  BrainCircuit,
  FileCheck2,
  AlertCircle
} from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => Promise<void>;
  isLoading: boolean;
  authError: string | null;
}

export function LandingPage({ onSignIn, isLoading, authError }: LandingPageProps) {
  const [activePreviewTab, setActivePreviewTab] = useState<'privacy' | 'reflection' | 'journal'>('journal');

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E4E4E7] flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Top Header Bar */}
      <header className="border-b border-[#27272A] bg-[#0F0F12]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-950/40">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">GeminiVault</span>
              <span className="text-[10px] text-[#71717A] block -mt-1">Private AI Journal</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="header-sign-in-button"
              type="button"
              onClick={onSignIn}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white transition-all disabled:opacity-60 shadow-md shadow-indigo-950/40 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              <span>{isLoading ? (
                <span className="hidden sm:inline">Authenticating...</span>
              ) : (
                <>
                  <span className="hidden sm:inline">Sign In with Google</span>
                  <span className="sm:hidden">Sign In</span>
                </>
              )}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Value Proposition */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex flex-col justify-center min-w-0">
        
        {/* Error Alert if Authentication Fails */}
        {authError && (
          <div 
            id="auth-error-banner"
            className="mb-8 p-4 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 flex items-start gap-3 text-sm"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-rose-100">Sign-in Notice</p>
              <p className="text-xs text-rose-300 mt-0.5 break-words">{authError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Mission & Core Action */}
          <div className="lg:col-span-6 space-y-6 min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono max-w-full">
              <ShieldCheck className="w-3.5 h-3.5 text-green-400 shrink-0" />
              <span className="truncate">Zero-Trust Owner-Bound Firestore Storage</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight break-words">
              A private sanctuary for honest thought and <span className="text-indigo-400">mindful AI reflection</span>.
            </h1>

            <p className="text-[#A1A1AA] text-base sm:text-lg leading-relaxed max-w-xl break-words">
              GeminiVault combines the clarity of personal daily journaling with structured AI reflection. Built with absolute user isolation: your thoughts never cross accounts, are protected by cryptographic Google OAuth, and reside strictly in your authenticated Firestore vault.
            </p>

            {/* Direct Google Sign-In Action Area */}
            <div className="pt-2 space-y-3">
              <button
                id="hero-google-sign-in-btn"
                type="button"
                onClick={onSignIn}
                disabled={isLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-base transition-all transform active:scale-[0.99] disabled:opacity-60 shadow-lg shadow-indigo-950/40 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{isLoading ? 'Connecting to Vault...' : 'Enter GeminiVault with Google'}</span>
                <ArrowRight className="w-4 h-4 ml-1 shrink-0" />
              </button>

              <p className="text-xs text-[#71717A] flex items-center gap-2 flex-wrap">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                <span>No password creation required • Federated Google Sign-In</span>
              </p>
            </div>

            {/* Core Architectural Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#27272A]">
              <div className="p-3.5 rounded-xl bg-[#141417] border border-[#27272A] hover:border-indigo-500/40 transition-colors">
                <Database className="w-4 h-4 text-indigo-400 mb-1.5" />
                <p className="text-xs font-semibold text-white">User UID Scoped</p>
                <p className="text-[11px] text-[#71717A] leading-tight">Every document partitioned by auth identity</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141417] border border-[#27272A] hover:border-indigo-500/40 transition-colors">
                <EyeOff className="w-4 h-4 text-green-400 mb-1.5" />
                <p className="text-xs font-semibold text-white">Zero Open Rules</p>
                <p className="text-[11px] text-[#71717A] leading-tight">Denied by default in Firestore security rules</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141417] border border-[#27272A] hover:border-indigo-500/40 transition-colors">
                <BrainCircuit className="w-4 h-4 text-purple-400 mb-1.5" />
                <p className="text-xs font-semibold text-white">AI Modular Core</p>
                <p className="text-[11px] text-[#71717A] leading-tight">Designed for Gemini 3.6 Flash fallback ladder</p>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Vault Preview */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-[#27272A] bg-[#141417] shadow-2xl overflow-hidden">
              
              {/* Window Titlebar */}
              <div className="px-4 py-3 bg-[#0F0F12] border-b border-[#27272A] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs text-[#71717A] font-mono ml-2">geminivault.internal</span>
                </div>

                <div className="flex items-center gap-1 bg-[#1E1E22] p-0.5 rounded-lg border border-[#27272A] text-xs">
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('journal')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      activePreviewTab === 'journal' 
                        ? 'bg-[#141417] text-white font-medium border border-[#27272A]' 
                        : 'text-[#71717A] hover:text-[#A1A1AA]'
                    }`}
                  >
                    Journal
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('privacy')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      activePreviewTab === 'privacy' 
                        ? 'bg-[#141417] text-white font-medium border border-[#27272A]' 
                        : 'text-[#71717A] hover:text-[#A1A1AA]'
                    }`}
                  >
                    Security Rule
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('reflection')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      activePreviewTab === 'reflection' 
                        ? 'bg-[#141417] text-white font-medium border border-[#27272A]' 
                        : 'text-[#71717A] hover:text-[#A1A1AA]'
                    }`}
                  >
                    AI Companion
                  </button>
                </div>
              </div>

              {/* Interactive Window Content */}
              <div className="p-6 text-sm">
                {activePreviewTab === 'journal' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
                      <div>
                        <span className="text-xs uppercase tracking-wider text-indigo-400 font-mono">Evening Reflection</span>
                        <h3 className="text-base font-semibold text-white">Navigating complexity with steady focus</h3>
                      </div>
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] rounded border border-indigo-500/20">
                        Focused
                      </span>
                    </div>

                    <p className="text-[#A1A1AA] leading-relaxed text-xs sm:text-sm italic">
                      "Today I paused before answering three high-friction inquiries. Giving myself 60 seconds of breathing room shifted the outcome from reactive to intentional..."
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-[#1E1E22] text-[#A1A1AA] font-mono border border-[#27272A]">#clarity</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#1E1E22] text-[#A1A1AA] font-mono border border-[#27272A]">#stoicism</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#1E1E22] text-[#A1A1AA] font-mono border border-[#27272A]">#leadership</span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0F0F12] border border-[#27272A] text-xs text-[#71717A] flex items-center justify-between">
                      <span>432 words • 3 min read</span>
                      <span className="text-green-400 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Synced to Firestore
                      </span>
                    </div>
                  </div>
                )}

                {activePreviewTab === 'privacy' && (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex items-center gap-2 text-[#71717A] pb-2 border-b border-[#27272A]">
                      <FileCheck2 className="w-4 h-4 text-green-400" />
                      <span>firestore.rules • Owner Scoped Enforcement</span>
                    </div>
                    <pre className="p-3 rounded-lg bg-[#0F0F12] border border-[#27272A] text-green-300 overflow-x-auto text-[11px] leading-relaxed">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/entries/{entryId} {
      // STRICT OWNER ISOLATION:
      allow read, write: if request.auth != null 
        && request.auth.uid == userId;
    }
  }
}`}
                    </pre>
                    <p className="text-[#71717A] text-xs font-sans">
                      Any read or write attempt by unauthenticated callers or cross-user requests is rejected at the Firestore engine level.
                    </p>
                  </div>
                )}

                {activePreviewTab === 'reflection' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-indigo-400 pb-2 border-b border-[#27272A] text-xs font-semibold">
                      <Sparkles className="w-4 h-4" />
                      <span>Gemini Reflection Prompt Engine</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#1E1E22] border border-[#27272A] text-[#E4E4E7] text-xs space-y-1">
                      <p className="font-semibold text-indigo-300">Prompt of the Day:</p>
                      <p className="italic text-[#A1A1AA]">
                        "What is one decision you made this week that your future self a year from now will genuinely thank you for?"
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-[#0F0F12] border border-[#27272A]">
                        <p className="font-semibold text-white">Mood Insight</p>
                        <p className="text-[#71717A]">Identifies emotional patterns across journal entries</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#0F0F12] border border-[#27272A]">
                        <p className="font-semibold text-white">Growth Prompts</p>
                        <p className="text-[#71717A]">Contextual inquiry tailored to your written thoughts</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Card Footer */}
              <div className="px-6 py-3 bg-[#0F0F12] border-t border-[#27272A] flex items-center justify-between text-xs text-[#71717A]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                  OWASP Top 10 & LLM01-LLM05 Protected
                </span>
                <span className="font-mono text-[11px] text-indigo-400">Production Ready</span>
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#27272A] bg-[#0F0F12] py-6 text-center text-xs text-[#71717A]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 GeminiVault. Personal Gemini Journal Challenge.</p>
          <div className="flex items-center gap-4 text-xs font-mono text-[#71717A]">
            <span>Firebase Auth</span>
            <span>•</span>
            <span>Cloud Firestore</span>
            <span>•</span>
            <span>Strict UID Isolation</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
