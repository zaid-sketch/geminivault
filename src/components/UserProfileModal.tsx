import { 
  X, 
  LogOut, 
  ShieldCheck, 
  Copy, 
  Check, 
  Database, 
  User as UserIcon,
  Key
} from 'lucide-react';
import { useState } from 'react';
import type { UserProfile } from '../types';

interface UserProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
}

export function UserProfileModal({
  user,
  isOpen,
  onClose,
  onSignOut,
}: UserProfileModalProps) {
  const [copiedUid, setCopiedUid] = useState(false);

  if (!isOpen) return null;

  const handleCopyUid = () => {
    if (user.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  return (
    <div 
      id="user-profile-modal"
      className="fixed inset-0 z-50 bg-[#0A0A0B]/85 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-w-md w-full bg-[#141417] border border-[#27272A] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#27272A] flex items-center justify-between bg-[#141417]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Account & Security Audit</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#71717A] hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* User Identity Card */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#0F0F12] border border-[#27272A]">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-12 h-12 rounded-full object-cover border border-[#27272A] shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#1E1E22] flex items-center justify-center text-[#A1A1AA] shrink-0">
                <UserIcon className="w-6 h-6" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white truncate">
                {user.displayName || 'GeminiVault Journaler'}
              </h4>
              <p className="text-xs text-[#A1A1AA] truncate">
                {user.email || 'Google Account'}
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Google OAuth Session Active</span>
              </div>
            </div>
          </div>

          {/* UID & Partition Detail */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider flex items-center justify-between">
              <span>Authenticated Firebase UID</span>
              <button
                type="button"
                onClick={handleCopyUid}
                className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedUid ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUid ? 'Copied' : 'Copy'}</span>
              </button>
            </label>
            <div className="p-2.5 rounded-lg bg-[#0F0F12] border border-[#27272A] font-mono text-xs text-[#E4E4E7] break-all">
              {user.uid}
            </div>
          </div>

          {/* Security Architecture Audit Box */}
          <div className="p-4 rounded-xl bg-[#0F0F12] border border-[#27272A] space-y-2.5 text-xs">
            <div className="flex items-center gap-2 text-white font-semibold border-b border-[#27272A] pb-1.5">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Isolated Firestore Partitioning</span>
            </div>

            <div className="space-y-1 font-mono text-[11px] text-[#E4E4E7]">
              <p className="text-[#A1A1AA]">Owner-Bound Isolated Paths:</p>
              <code className="p-1.5 rounded bg-[#141417] block text-emerald-300 break-all border border-[#27272A] mb-1">
                /users/{user.uid}/entries
              </code>
              <code className="p-1.5 rounded bg-[#141417] block text-indigo-300 break-all border border-[#27272A]">
                /users/{user.uid}/reflections
              </code>
            </div>

            <div className="space-y-1 font-mono text-[11px] text-[#E4E4E7] pt-1">
              <p className="text-[#A1A1AA]">Security Rule Enforcement:</p>
              <code className="p-1.5 rounded bg-[#141417] block text-indigo-300/90 text-[10px] border border-[#27272A]">
                allow read, write: if request.auth.uid == userId;
              </code>
            </div>

            <p className="text-[11px] text-[#71717A] leading-relaxed font-sans pt-1">
              No cross-tenant data leakage is structurally possible. Firestore rules enforce document-level owner isolation at the storage engine level.
            </p>
          </div>

          {/* Sign Out Action */}
          <div className="pt-2">
            <button
              id="modal-sign-out-btn"
              type="button"
              onClick={() => {
                onClose();
                onSignOut();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 font-semibold text-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of GeminiVault</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
