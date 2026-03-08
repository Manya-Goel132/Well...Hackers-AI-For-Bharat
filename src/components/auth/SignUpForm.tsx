import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Eye, EyeOff, Mail, Lock, User, Heart, AlertCircle, ArrowRight, Shield } from 'lucide-react';
import { AuthButton } from './AuthButton';
import { useAuth } from './AuthProvider';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { toast } from 'sonner';
import { betaAnalyticsService } from '../../services/betaAnalyticsService';
import './animations.css';

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
  onSuccess: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToSignIn, onSuccess }) => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  });
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [emailError, setEmailError] = useState('');

  const { signUp, signInWithGoogle } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Check password strength
    if (field === 'password') {
      setPasswordStrength({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value)
      });
    }
  };

  const isPasswordStrong = Object.values(passwordStrength).every(Boolean);
  const passwordsMatch = formData.password === formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');

    // Validation
    if (!formData.displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (!isPasswordStrong) {
      setError('Please choose a stronger password');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 SignUpForm: Starting signup...');
      const userProfile = await signUp(formData.email, formData.password, formData.displayName);
      console.log('🔐 SignUpForm: Signup successful, userProfile:', userProfile);

      // Initialize beta analytics for new user
      console.log('📊 SignUpForm: Checking if should initialize analytics...');
      console.log('📊 SignUpForm: userProfile?.uid:', userProfile?.uid);

      if (userProfile?.uid) {
        console.log('📊 SignUpForm: Calling betaAnalyticsService.initializeUser...');
        await betaAnalyticsService.initializeUser(userProfile.uid, {
          email: userProfile.email,
          displayName: userProfile.displayName,
          preferredLanguage: 'en',
          acquisitionSource: 'organic'
        });
        console.log('📊 SignUpForm: Analytics initialization completed');
      } else {
        console.warn('⚠️ SignUpForm: No UID available, skipping analytics');
      }

      toast.success('Account created successfully!');

      // Add delay to see console logs before redirect
      console.log('⏳ Waiting 2 seconds before redirect to see logs...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      onSuccess();
    } catch (error: any) {
      console.error('❌ SignUpForm: Error during signup:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      toast.success('Successfully signed up with Google!');
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
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20"></div>
        {/* Floating Orbs */}
        <div className="absolute top-32 left-32 w-80 h-80 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 right-32 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-gradient-to-r from-blue-500/25 to-indigo-500/25 rounded-full blur-2xl animate-pulse delay-500"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      {/* Left Side - Compact Branding */}
      <div className="hidden lg:flex lg:w-2/5 relative">
        <div className="w-full flex flex-col justify-center px-12 py-8 relative overflow-hidden">
          {/* Glowing Border */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-3xl border-r border-white/10"></div>

          <div className="relative z-10">
            {/* Compact Logo */}
            <div className="mb-8 group">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/25 group-hover:shadow-indigo-500/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 overflow-hidden bg-white/10 backdrop-blur-sm">
                <img
                  src="/logo.png"
                  alt="ManoSathi Logo"
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <h1 className="text-4xl font-black text-white mb-3 tracking-tight animate-fade-in">
                Join ManoSathi
              </h1>
              <p className="text-lg text-gray-200 mb-6 font-light animate-fade-in delay-200">
                मानसिक स्वास्थ्य की शुरुआत यहाँ से
              </p>
            </div>

            {/* Compact Description */}
            <div className="mb-8 animate-fade-in delay-300">
              <p className="text-base text-gray-400 leading-relaxed mb-6 font-light">
                Begin your transformative mental wellness journey with cutting-edge AI technology.
              </p>
            </div>

            {/* Compact Features */}
            <div className="space-y-4">
              {[
                { icon: "🔒", text: "100% Private & Secure", delay: "delay-500" },
                { icon: "🧠", text: "Culturally Sensitive AI", delay: "delay-700" },
                { icon: "⚡", text: "Professional Support", delay: "delay-900" },
                { icon: "🎯", text: "For Indian Youth", delay: "delay-1000" }
              ].map((feature, index) => (
                <div key={index} className={`flex items-center space-x-3 animate-slide-in-left ${feature.delay} group hover:translate-x-2 transition-transform duration-300`}>
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/10 group-hover:border-indigo-400/50 transition-all duration-300">
                    <span className="text-sm">{feature.icon}</span>
                  </div>
                  <span className="text-gray-200 text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Compact Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md animate-fade-in delay-300">
          <Card className="p-8 bg-[#1e293b]/70 backdrop-blur-3xl shadow-2xl border border-white/15 rounded-3xl hover:border-indigo-400/50 transition-all duration-500 hover:shadow-indigo-500/25">
            {/* Mobile Header */}
            <div className="text-center mb-6 lg:hidden">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-indigo-500/25 animate-bounce overflow-hidden bg-white/10 backdrop-blur-sm">
                <img
                  src="/logo.png"
                  alt="ManoSathi Logo"
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <h1 className="text-3xl font-black text-white mb-2">Join ManoSathi</h1>
              <p className="text-gray-200 text-sm">Your mental wellness companion</p>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block text-center mb-6">
              <h2 className="text-3xl font-black text-white mb-3 animate-fade-in">
                Create Account
              </h2>
              <p className="text-gray-200 text-base animate-fade-in delay-200">
                Start your wellness journey
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3 backdrop-blur-sm animate-shake">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-red-300 font-medium">Sign Up Error</p>
                  <p className="text-xs text-red-200">{error}</p>
                </div>
              </div>
            )}

            {/* Compact Sign Up Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-labelledby="signup-title">
              {/* Name Field */}
              <div className="group">
                <label htmlFor="displayName" className="block text-xs font-bold text-gray-300 mb-2 group-focus-within:text-indigo-300 transition-colors">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-indigo-300 group-focus-within:text-white transition-colors" />
                  <Input
                    id="displayName"
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    placeholder="Your name"
                    className="auth-input pl-10 pr-3 py-3 bg-gray-900 border-2 border-white/30 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/30 rounded-xl transition-all duration-300 text-white placeholder-gray-500 backdrop-blur-sm hover:bg-black/20 focus:bg-black/20 font-medium text-sm"
                    required
                    disabled={loading}
                    data-auth-input="true"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="group">
                <label htmlFor="email" className="block text-xs font-bold text-gray-300 mb-2 group-focus-within:text-indigo-300 transition-colors">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-indigo-300 group-focus-within:text-white transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      handleInputChange('email', e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    placeholder="your.email@example.com"
                    className={`auth-input pl-10 pr-3 py-3 bg-gray-900 border-2 ${emailError ? 'border-red-400 focus:border-red-500 focus:ring-red-400/30' : 'border-white/30 focus:border-indigo-400 focus:ring-indigo-400/30'} focus:ring-4 rounded-xl transition-all duration-300 text-white placeholder-gray-500 backdrop-blur-sm hover:bg-black/20 focus:bg-black/20 font-medium text-sm`}
                    required
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'signup-email-error' : undefined}
                    disabled={loading}
                    data-auth-input="true"
                  />
                </div>
                {emailError && (
                  <p id="signup-email-error" className="mt-1 text-xs font-semibold text-red-300">{emailError}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="group">
                <label htmlFor="password" className="block text-xs font-bold text-gray-300 mb-2 group-focus-within:text-indigo-300 transition-colors">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-indigo-300 group-focus-within:text-white transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Strong password"
                    className="auth-input pl-10 pr-10 py-3 bg-gray-900 border-2 border-white/30 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/30 rounded-xl transition-all duration-300 text-white placeholder-gray-500 backdrop-blur-sm hover:bg-black/20 focus:bg-black/20 font-medium text-sm"
                    required
                    onKeyUp={(e) => setCapsLockOn((e as any).getModifierState && (e as any).getModifierState('CapsLock'))}
                    disabled={loading}
                    data-auth-input="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-300 hover:text-indigo-200 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Compact Password Strength Indicator */}
                <PasswordStrengthIndicator password={formData.password} />
                {capsLockOn && (
                  <p className="mt-1 text-xs font-semibold text-amber-300">⚠️ Caps Lock is on</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="group">
                <label htmlFor="confirmPassword" className="block text-xs font-bold text-gray-300 mb-2 group-focus-within:text-indigo-300 transition-colors">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-indigo-300 group-focus-within:text-white transition-colors" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Re-enter password"
                    className={`auth-input pl-10 pr-10 py-3 bg-gray-900 border-2 rounded-xl transition-all duration-300 text-white placeholder-gray-500 backdrop-blur-sm hover:bg-black/20 focus:bg-black/20 font-medium text-sm ${formData.confirmPassword && !passwordsMatch
                      ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-400/30'
                      : 'border-white/30 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/30'
                      }`}
                    required
                    disabled={loading}
                    data-auth-input="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-300 hover:text-indigo-200 transition-colors"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.confirmPassword && !passwordsMatch && (
                  <p className="mt-1 text-xs font-semibold text-red-300">❌ Passwords do not match</p>
                )}
              </div>

              {/* Sign Up Button */}
              <AuthButton
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading || !formData.displayName || !formData.email || !isPasswordStrong || !passwordsMatch}
              >
                {loading ? 'Creating account...' : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </AuthButton>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-white/20" />
              <span className="px-4 text-xs text-gray-200 bg-black/20 rounded-full py-1">or continue with</span>
              <div className="flex-1 border-t border-white/20" />
            </div>

            {/* Google Sign Up */}
            <AuthButton
              onClick={handleGoogleSignUp}
              variant="secondary"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Connecting...' : (
                <>
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </AuthButton>

            {/* Switch to Sign In */}
            <div className="mt-6 text-center">
              <p className="text-white font-medium text-sm">
                Already have an account?{' '}
                <button
                  onClick={onSwitchToSignIn}
                  className="text-indigo-300 hover:text-indigo-200 font-black hover:underline transition-all duration-300 hover:scale-105 inline-block"
                  disabled={loading}
                >
                  Sign In
                </button>
              </p>
            </div>

            {/* Privacy Notice */}
            <div className="mt-4 p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl backdrop-blur-sm">
              <div className="flex items-start space-x-2">
                <Shield className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-indigo-200">
                  <strong>100% Secure & Private:</strong> Your data is encrypted and protected.
                </p>
              </div>
            </div>

            {/* Terms & Privacy */}
            <p className="mt-4 text-center text-[10px] text-gray-200">
              By creating an account, you agree to our <span className="text-indigo-300 hover:text-indigo-200 cursor-pointer">Terms</span> and <span className="text-indigo-300 hover:text-indigo-200 cursor-pointer">Privacy Policy</span>.
            </p>

            {/* Crisis Support */}
            <div className="mt-4 text-center">
              <p className="text-[10px] text-gray-200">
                Need immediate help? Call:{' '}
                <span className="font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer">9152987821</span> (24/7)
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};