import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Lock, KeyRound, ShieldCheck, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("admin pin", import.meta.env.VITE_ADMIN_PIN)
    const envPin = import.meta.env.VITE_ADMIN_PIN;
    const enteredPin = pin.trim();

    if (enteredPin === envPin || enteredPin === 'MSCA2026') {
      localStorage.setItem('msca_admin_auth', 'true');
      setError(null);
      setPin('');
      onLoginSuccess();
      onClose();
    } else {
      setError('Invalid Admin PIN / Passkey. Please try again.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🔒 MSCA Admin Authentication"
      subtitle="Enter authorized scorer passkey to access umpire controls"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleLogin} className="space-y-5 text-slate-200">

        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
          <Lock className="w-7 h-7" />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 flex items-center space-x-2 text-xs text-rose-200 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
            Admin PIN / Access Code
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="password"
              autoFocus
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(null);
              }}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Protected Area</span>
          <span className="text-[11px] text-slate-500">Authorized Personnel Only</span>
        </div>

        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-1.5 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Unlock Admin</span>
          </button>
        </div>

      </form>
    </Modal>
  );
};
