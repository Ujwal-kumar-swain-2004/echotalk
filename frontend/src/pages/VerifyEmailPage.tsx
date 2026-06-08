import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, Mail } from 'lucide-react';
import api from '../services/api';

export const VerifyEmailPage: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'waiting' | 'loading' | 'success' | 'error'>(
    token ? 'loading' : 'waiting'
  );
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(params.get('sent') === '1');

  useEffect(() => {
    if (!token) return;
    api.post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  const resend = async (event: React.FormEvent) => {
    event.preventDefault();
    await api.post('/auth/resend-verification', { email });
    setSent(true);
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full glass p-8 rounded-3xl text-center">
        {status === 'loading' && <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto mb-5" />}
        {status === 'success' && <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-5" />}
        {(status === 'waiting' || status === 'error') && <Mail className="w-12 h-12 text-accent mx-auto mb-5" />}
        <h2 className="text-2xl font-bold text-white mb-3">
          {status === 'success' ? 'Email verified' : status === 'error' ? 'Verification link expired' : 'Check your email'}
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          {status === 'success'
            ? 'Your EchoTalk account is verified and ready.'
            : sent ? 'A verification link has been sent if that account exists.' : 'Use the link in your inbox to verify your account.'}
        </p>
        {status !== 'success' && (
          <form onSubmit={resend} className="flex gap-2 mb-5">
            <input value={email} onChange={event => setEmail(event.target.value)} type="email" required
              placeholder="Email address" className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white" />
            <button className="px-4 rounded-2xl bg-accent text-white font-semibold">Resend</button>
          </form>
        )}
        <Link to="/login" className="text-accent font-semibold">Continue to login</Link>
      </div>
    </div>
  );
};
