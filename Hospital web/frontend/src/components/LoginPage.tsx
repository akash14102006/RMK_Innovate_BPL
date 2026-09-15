import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Activity, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import loginBackground from '../assets/56b990d0abb99ded41df3cae8349b1a1c73a75e6.png';
import logoImage from '../assets/32a5a413977d943e579cd3371923d955b6e0b7e9.png';
import { signUpWithEmail, signInWithEmail, completeGoogleSignIn } from '../services/authService';
import { initializeGoogleAuth, renderGoogleButton, decodeJwt } from '../services/googleAuthService';
import { toast } from 'sonner';

interface LoginPageProps {
  onNavigate: (page: 'landing' | 'login' | 'dashboard') => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  // Initialize Google Sign-In
  useEffect(() => {
    const handleGoogleResponse = (response: any) => {
      console.log('Google Sign-In Response:', response);

      if (response.credential) {
        // 1. Decode token to get user info (Real data)
        const gUser = decodeJwt(response.credential);

        if (gUser) {
          // 2. Persist real user data to auth service
          const result = completeGoogleSignIn({
            email: gUser.email,
            name: gUser.name,
            picture: gUser.picture,
            uid: gUser.sub
          });

          if (result.success) {
            toast.success('Google Sign-In successful!', {
              description: `Logged in as ${gUser.email}`,
            });

            if (result.isFirstLogin) {
              toast.success('System Initialized & APIs Locked 🔒', {
                description: 'First login detected. System API configuration generated.',
                duration: 5000,
              });
            }

            onNavigate('dashboard');
          }
        } else {
          toast.error('Failed to decode Google token');
        }
      }
    };

    // Initialize and render button
    initializeGoogleAuth(handleGoogleResponse);
    renderGoogleButton('google-signin-button');
  }, [onNavigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;

      if (isLogin) {
        // Sign in
        result = await signInWithEmail(formData.email, formData.password);
      } else {
        // Sign up
        result = await signUpWithEmail(formData.email, formData.password, formData.name);
      }

      if (result.success) {
        if (result.isFirstLogin) {
          toast.success('System Initialized & APIs Locked 🔒', {
            description: 'First login detected. API configuration has been generated and permanently fixed.',
            duration: 5000,
          });
        } else {
          toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!', {
            description: `Signed in as ${result.user?.email}`,
          });
        }
        onNavigate('dashboard');
      } else {
        toast.error(isLogin ? 'Sign in failed' : 'Sign up failed', {
          description: result.error || 'Please try again',
        });
      }
    } catch (error) {
      toast.error('Authentication error', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
      {/* Full Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBackground})` }}
      >
        {/* Overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/40 via-teal-800/30 to-blue-900/40"></div>
      </div>

      {/* Floating liquid blobs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-teal-400/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md relative z-10">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 text-white hover:bg-white/20 backdrop-blur-sm border border-white/30"
          onClick={() => onNavigate('landing')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Login Card with Glass Morphism */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-8 space-y-6">
          {/* Gradient overlay for glass effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl pointer-events-none"></div>

          <div className="relative">
            {/* Logo */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-white shadow-2xl p-3">
                <img
                  src={logoImage}
                  alt="Bharat PulseLink Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-2xl text-teal-300 font-bold drop-shadow-lg">Bharat PulseLink</h1>
              <p className="text-white/90 text-center drop-shadow">
                {isLogin ? 'Sign in to your account' : 'Create your account'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white/90">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Dr. John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={loading}
                    className="h-12 bg-white/20 backdrop-blur-md border-white/30 text-white placeholder:text-white/60 focus:bg-white/25 focus:border-white/50"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@hospital.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={loading}
                    className="h-12 pl-11 bg-white/20 backdrop-blur-md border-white/30 text-white placeholder:text-white/60 focus:bg-white/25 focus:border-white/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={loading}
                    className="h-12 pl-11 bg-white/20 backdrop-blur-md border-white/30 text-white placeholder:text-white/60 focus:bg-white/25 focus:border-white/50"
                  />
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-white/80">
                    <input type="checkbox" className="rounded border-white/30 bg-white/20" />
                    Remember me
                  </label>
                  <a href="#" className="text-teal-300 hover:text-teal-200">
                    Forgot password?
                  </a>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white shadow-xl border border-white/20 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isLogin ? 'Signing In...' : 'Creating Account...'}
                  </>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-white/80">Or continue with</span>
              </div>
            </div>

            {/* Google Login Container */}
            <div className="w-full h-12 flex justify-center">
              <div id="google-signin-button" className="w-full"></div>
            </div>

            {/* Toggle Login/Signup */}
            <div className="text-center text-sm text-white/80 mt-4">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                className="text-teal-300 hover:text-teal-200"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-white/70 drop-shadow">
          © 2026 Bharat PulseLink — Connecting Every Pulse to Better Health
        </div>
      </div>
    </div>
  );
}
/* updated */
