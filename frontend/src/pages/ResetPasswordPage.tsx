import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import api from '../services/api';

export const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post('/auth/reset-password', { token: params.get('token'), password });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full glass p-8 rounded-3xl">
        <Lock className="w-10 h-10 text-accent mb-5" />
        <h2 className="text-2xl font-bold text-white mb-2">Choose a new password</h2>
        {status === 'success' ? (
          <Link to="/login" className="text-emerald-400 font-semibold">Password updated. Sign in</Link>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {status === 'error' && <p className="text-sm text-rose-400">This reset link is invalid or expired.</p>}
            <input value={password} onChange={event => setPassword(event.target.value)}
              type="password" minLength={8} required placeholder="At least 8 characters"
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white" />
            <button className="w-full py-3 rounded-2xl bg-accent text-white font-bold">Update password</button>
          </form>
        )}
      </div>
    </div>
  );
};
