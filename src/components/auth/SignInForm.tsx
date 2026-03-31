import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Heart,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { AuthButton } from './AuthButton';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';
import './animations.css';

interface SignInFormProps {
  onSwitchToSignUp: () => void;
  onSuccess: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({
  onSwitchToSignUp,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [capsLockOn, setCapsLockOn] = useState(false);

  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');
    setLoading(true);

    try {
      // lightweight client-side validation for clarity
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setEmailError('Please enter a valid email address');
        throw new Error('Invalid email');
      }
      if (password.length < 6) {
        setPasswordError('Password should be at least 6 characters');
        throw new Error('Weak password');
      }
      await signIn(email, password);
      toast.success('स्वागत है! / Welcome back!');
      onSuccess();
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-black text-white flex relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20"></div>
        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-500/25 to-purple-500/25 rounded-full blur-2xl animate-pulse delay-500"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      {/* Left Side - Compact Branding */}
      <div className="hidden lg:flex lg:w-2/5 relative">
        <div className="w-full flex flex-col justify-center px-12 py-8 relative overflow-hidden">
          {/* Glowing Border */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-indigo-500/10 backdrop-blur-3xl border-r border-white/10"></div>

          <div className="relative z-10">
            {/* Compact Logo */}
            <div className="mb-8 group">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-purple-500/25 group-hover:shadow-purple-500/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 overflow-hidden bg-white/10 backdrop-blur-sm">
                <img
                  src="/logo.png"
                  alt="ManoSathi Logo"
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <h1 className="text-4xl font-black text-white mb-3 tracking-tight animate-fade-in">
                ManoSathi
              </h1>
              <p className="text-lg text-gray-200 mb-6 font-light animate-fade-in delay-200">
                आपका मानसिक स्वास्थ्य साथी
              </p>
            </div>

            {/* Compact Description */}
            <div className="mb-8 animate-fade-in delay-300">
              <p className="text-base text-gray-400 leading-relaxed mb-6 font-light">
                AI-powered mental wellness companion designed for Indian youth.
              </p>
            </div>

            {/* Compact Features */}
            <div className="space-y-4">
              {[
                { icon: "🤖", text: "24/7 AI Support", delay: "delay-500" },
                { icon: "🚨", text: "Crisis Detection", delay: "delay-700" },
                { icon: "🗣️", text: "Multi-language", delay: "delay-900" },
                { icon: "📊", text: "Analytics", delay: "delay-1000" }
              ].map((feature, index) => (
                <div key={index} className={`flex items-center space-x-3 animate-slide-in-left ${feature.delay} group hover:translate-x-2 transition-transform duration-300`}>
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/10 group-hover:border-purple-400/50 transition-all duration-300">
                    <span className="text-sm">{feature.icon}</span>
                  </div>
                  <span className="text-gray-200 text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Right Side - Compact Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md animate-fade-in delay-300">
          <Card className="p-8 bg-[#1e293b]/70 backdrop-blur-3xl shadow-2xl border border-white/15 rounded-3xl hover:border-purple-400/50 transition-all duration-500 hover:shadow-purple-500/25">
            {/* Mobile Header */}
            <div className="text-center mb-6 lg:hidden">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-purple-500/25 animate-bounce overflow-hidden bg-white/10 backdrop-blur-sm">
                <img
                  src="/logo.png"
                  alt="ManoSathi Logo"
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <h1 className="text-3xl font-black text-white mb-2">ManoSathi</h1>
              <p className="text-gray-200 text-sm">Your mental wellness companion</p>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block text-center mb-6">
              <h2 className="text-3xl font-black text-white mb-3 animate-fade-in">
                Welcome Back
              </h2>
              <p className="text-gray-200 text-base animate-fade-in delay-200">
                Sign in to continue
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3 backdrop-blur-sm animate-shake">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-red-300 font-medium">Sign In Error</p>
                  <p className="text-xs text-red-200">{error}</p>
                </div>
              </div>
            )}

            {/* Compact Sign In Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-labelledby="signin-title">
              {/* Email Field */}
              <div className="group">
                <label htmlFor="email" className="block text-xs font-bold text-gray-300 mb-2 group-focus-within:text-purple-300 transition-colors">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-300 group-focus-within:text-white transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    placeholder="your.email@example.com"
                    className={`auth-input pl-10 pr-3 py-3 bg-gray-900 border-2 ${emailError ? 'border-red-400 focus:border-red-500 focus:ring-red-400/30' : 'border-white/30 focus:border-purple-400 focus:ring-purple-400/30'} focus:ring-4 rounded-xl transition-all duration-300 text-white placeholder-gray-500 backdrop-blur-sm hover:bg-black/20 focus:bg-black/20 font-medium text-sm`}
                    required
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'email-error' : undefined}
                    disabled={loading}
                    data-auth-input="true"
                  />
                </div>
                {emailError && (
                  <p id="email-error" className="mt-1 text-xs font-semibold text-red-300">{emailError}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="group">
                <label htmlFor="password" className="block text-xs font-bold text-gray-300 mb-2 group-focus-within:text-purple-300 transition-colors">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-300 group-focus-within:text-white transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Your password"
                    className={`auth-input pl-10 pr-10 py-3 bg-gray-900 border-2 ${passwordError ? 'border-red-400 focus:border-red-500 focus:ring-red-400/30' : 'border-white/30 focus:border-purple-400 focus:ring-purple-400/30'} focus:ring-4 rounded-xl transition-all duration-300 text-white placeholder-gray-500 backdrop-blur-sm hover:bg-black/20 focus:bg-black/20 font-medium text-sm`}
                    required
                    onKeyUp={(e) => setCapsLockOn((e as any).getModifierState && (e as any).getModifierState('CapsLock'))}
                    aria-invalid={!!passwordError}
                    aria-describedby={passwordError ? 'password-error' : undefined}
                    disabled={loading}
                    data-auth-input="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-white transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {capsLockOn && (
                  <p className="mt-1 text-xs font-semibold text-amber-300">⚠️ Caps Lock is on</p>
                )}
                {passwordError && (
                  <p id="password-error" className="mt-1 text-xs font-semibold text-red-300">{passwordError}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-purple-500 bg-white/20 border-white/50 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-xs font-semibold text-white group-hover:text-purple-200 transition-colors">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-xs text-purple-300 hover:text-purple-200 font-bold hover:underline transition-colors"
                  onClick={() => toast.info('Password reset feature coming soon!')}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Sign In Button */}
              <AuthButton
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading || !email || !password}
              >
                {loading ? 'Signing in...' : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </AuthButton>
            </form>



            {/* Switch to Sign Up */}
            <div className="mt-6 text-center">
              <p className="text-white font-medium text-sm">
                New to ManoSathi?{' '}
                <button
                  onClick={onSwitchToSignUp}
                  className="text-purple-300 hover:text-purple-200 font-black hover:underline transition-all duration-300 hover:scale-105 inline-block"
                  disabled={loading}
                >
                  Create Account
                </button>
              </p>
            </div>

            {/* Terms & Privacy */}
            <p className="mt-4 text-center text-[10px] text-gray-200">
              By signing in, you agree to our <span className="text-purple-300 hover:text-purple-200 cursor-pointer">Terms</span> and <span className="text-purple-300 hover:text-purple-200 cursor-pointer">Privacy Policy</span>.
            </p>

            {/* Crisis Support */}
            <div className="mt-4 text-center">
              <p className="text-[10px] text-gray-200">
                In crisis? Call:{' '}
                <span className="font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer">9152987821</span> (24/7)
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};