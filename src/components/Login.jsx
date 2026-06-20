import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Disc3, LogIn, Server, User, KeyRound } from 'lucide-react';

export default function Login() {
  const { login, isLoading, error, clearError } = useAuthStore((state) => ({
    login: state.login,
    isLoading: state.isLoading,
    error: state.error,
    clearError: state.clearError
  }));
  
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serverUrl || !username || !password) return;
    if (error) clearError();
    await login(serverUrl, username, password, rememberMe);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0d0e12] relative overflow-hidden selection:bg-primary/30">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] -z-10 pointer-events-none" />

      <div className="w-full max-w-md p-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-[0_0_30px_rgba(170,59,255,0.4)] mb-6">
            <Disc3 className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome to Pulsar</h1>
          <p className="text-white/50 text-sm text-center">Connect to your Navidrome or OpenSubsonic server</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider pl-1">Server URL</label>
            <div className="relative group">
              <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-primary transition-colors" />
              <input
                type="url"
                required
                placeholder="https://music.yourdomain.com"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:bg-black/40 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider pl-1">Username</label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                required
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:bg-black/40 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider pl-1">Password</label>
            <div className="relative group">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-primary transition-colors" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:bg-black/40 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 pb-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5 bg-black/20 border border-white/20 rounded group-hover:border-primary/50 transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer absolute opacity-0 w-full h-full cursor-pointer"
                />
                <div className="hidden peer-checked:block w-3 h-3 bg-primary rounded-sm" />
              </div>
              <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-primary to-purple-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {isLoading ? 'Connecting...' : 'Connect Server'}
          </button>
        </form>
      </div>
    </div>
  );
}
