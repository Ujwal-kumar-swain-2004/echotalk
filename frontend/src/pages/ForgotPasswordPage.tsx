import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import api from '../services/api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await api.post('/auth/forgot-password', { email });
    setSent(true);
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full glass p-8 rounded-3xl">
        <Mail className="w-10 h-10 text-accent mb-5" />
        <h2 className="text-2xl font-bold text-white mb-2">Reset your password</h2>
        <p className="text-sm text-gray-400 mb-6">
          {sent ? 'Check your inbox for a reset link.' : 'Enter your account email and we will send a one-time reset link.'}
        </p>
        {!sent && (
          <form onSubmit={submit} className="space-y-4">
            <input value={email} onChange={event => setEmail(event.target.value)} type="email" required
              placeholder="Email address" className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white" />
            <button className="w-full py-3 rounded-2xl bg-accent text-white font-bold">Send reset link</button>
          </form>
        )}
        <Link to="/login" className="block mt-6 text-sm text-accent font-semibold">Back to login</Link>
      </div>
    </div>
  );
};
