import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../store/authStore';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username is too long'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  gender: z.enum(['male', 'female', 'unspecified']),
});

type RegisterSchemaType = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: signup, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      gender: 'unspecified',
    }
  });

  const selectedGender = watch('gender');

  const onSubmit = async (data: RegisterSchemaType) => {
    try {
      await signup(data.username, data.email, data.password, data.gender);
      navigate('/chat');
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    clearError();
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full glass p-8 rounded-3xl relative border border-white/5"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-white mb-2">Create Account</h2>
          <p className="text-gray-400 text-sm">
            Save your interests, specify your gender, and begin chatting.
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <User className="w-5 h-5" />
              </div>
              <input
                {...register('username')}
                type="text"
                className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all text-sm"
                placeholder="Pick a username"
              />
            </div>
            {errors.username && (
              <p className="mt-1.5 text-xs text-rose-400">{errors.username.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <Mail className="w-5 h-5" />
              </div>
              <input
                {...register('email')}
                type="email"
                className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all text-sm"
                placeholder="your.email@example.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs text-rose-400">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <Lock className="w-5 h-5" />
              </div>
              <input
                {...register('password')}
                type="password"
                className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all text-sm"
                placeholder="Choose a password"
              />
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-rose-400">{errors.password.message}</p>
            )}
          </div>

          {/* Gender Selector Chips */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Your Gender
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['male', 'female', 'unspecified'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setValue('gender', g)}
                  className={`py-3 rounded-2xl text-sm font-semibold capitalize border transition-all duration-200 cursor-pointer ${
                    selectedGender === g
                      ? 'bg-accent border-accent text-white shadow-md shadow-accent/25'
                      : 'bg-white/5 border-white/5 hover:border-white/15 text-gray-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-2 rounded-2xl bg-accent hover:bg-accent-hover disabled:bg-accent/40 text-white font-bold shadow-lg shadow-accent/20 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Sign up and Chat</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:text-accent-hover font-semibold transition-colors">
            Log in
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
