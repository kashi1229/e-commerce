// src/components/auth/AuthModal.jsx
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Check,
  ChevronLeft,
  Shield,
  Zap,
  Heart
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

// ============================================
// ✅ FIXED: Move components OUTSIDE to prevent re-creation
// ============================================

// Reusable Input Field Component
const InputField = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  error, 
  placeholder, 
  icon: Icon, 
  showPassword, 
  onTogglePassword,
  autoComplete,
  required = false 
}) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-semibold text-[#26323B]">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="relative group">
      {Icon && (
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B0BEC5] group-focus-within:text-[#26323B] transition-colors pointer-events-none z-10" />
      )}
      <input
        type={showPassword !== undefined ? (showPassword ? 'text' : 'password') : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={cn(
          "w-full px-4 py-3.5 rounded-xl border-2 bg-white text-[#26323B] placeholder-[#B0BEC5] transition-all duration-200",
          "focus:outline-none focus:ring-4 focus:border-[#26323B]",
          Icon && "pl-12",
          (type === 'password' || showPassword !== undefined) && "pr-12",
          error 
            ? "border-red-500 bg-red-50/30 focus:ring-red-500/20" 
            : "border-[#E0E0E0] hover:border-[#B0BEC5] focus:ring-[#26323B]/10"
        )}
      />
      {showPassword !== undefined && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B0BEC5] hover:text-[#26323B] transition-colors p-1 z-10"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      )}
    </div>
    <AnimatePresence>
      {error && (
        <motion.p 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="text-sm text-red-600 flex items-center gap-1.5 font-medium"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

// Custom Checkbox Component
const Checkbox = ({ checked, onChange, label, error, children }) => (
  <div className="space-y-1">
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <div className={cn(
          "w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center",
          checked 
            ? "bg-[#26323B] border-[#26323B] shadow-sm" 
            : "border-[#B0BEC5] group-hover:border-[#26323B] bg-white",
          error && !checked && "border-red-500"
        )}>
          {checked && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
            </motion.div>
          )}
        </div>
      </div>
      <span className="text-sm text-[#455A64] leading-tight">
        {children || label}
      </span>
    </label>
    <AnimatePresence>
      {error && (
        <motion.p 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="text-sm text-red-600 flex items-center gap-1.5 ml-8 font-medium"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

// Social Login Buttons
const SocialButtons = () => (
  <div className="space-y-4">
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t-2 border-[#E0E0E0]" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-white text-[#B0BEC5] font-medium">Or continue with</span>
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#E0E0E0] rounded-xl hover:bg-[#F7F7F7] hover:border-[#B0BEC5] transition-all duration-200 group"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span className="text-sm font-semibold text-[#26323B]">Google</span>
      </button>
      
      <button
        type="button"
        className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#E0E0E0] rounded-xl hover:bg-[#F7F7F7] hover:border-[#B0BEC5] transition-all duration-200 group"
      >
        <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        <span className="text-sm font-semibold text-[#26323B]">Facebook</span>
      </button>
    </div>
  </div>
);

// Features Section
const Features = () => (
  <div className="grid grid-cols-3 gap-4 py-6 border-y-2 border-[#F7F7F7]">
    <div className="text-center">
      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
        <Shield className="w-6 h-6 text-blue-600" />
      </div>
      <p className="text-xs font-medium text-[#455A64]">Secure</p>
    </div>
    <div className="text-center">
      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
        <Zap className="w-6 h-6 text-purple-600" />
      </div>
      <p className="text-xs font-medium text-[#455A64]">Fast Checkout</p>
    </div>
    <div className="text-center">
      <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-2">
        <Heart className="w-6 h-6 text-pink-600" />
      </div>
      <p className="text-xs font-medium text-[#455A64]">Save Favorites</p>
    </div>
  </div>
);

// ============================================
// Main Component
// ============================================
export default function AuthModal() {
  const { isAuthModalOpen, authModalView, setAuthModalOpen } = useUIStore();
  const { login, register } = useAuthStore();
  const { fetchCart } = useCartStore();
  const { fetchWishlist } = useWishlistStore();

  const [view, setView] = useState(authModalView);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Register state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Update view when authModalView changes
  useEffect(() => {
    setView(authModalView);
  }, [authModalView]);

  // Calculate password strength
  useEffect(() => {
    let strength = 0;
    if (registerPassword.length >= 8) strength++;
    if (/[a-z]/.test(registerPassword) && /[A-Z]/.test(registerPassword)) strength++;
    if (/\d/.test(registerPassword)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(registerPassword)) strength++;
    setPasswordStrength(strength);
  }, [registerPassword]);

  // ✅ Use useCallback to create stable functions
  const resetForm = useCallback(() => {
    setLoginEmail('');
    setLoginPassword('');
    setFirstName('');
    setLastName('');
    setRegisterEmail('');
    setRegisterPassword('');
    setConfirmPassword('');
    setForgotEmail('');
    setAgreeTerms(false);
    setRememberMe(false);
    setErrors({});
    setEmailSent(false);
    setShowLoginPassword(false);
    setShowRegisterPassword(false);
    setShowConfirmPassword(false);
  }, []);

  const handleClose = useCallback(() => {
    setAuthModalOpen(false);
    setTimeout(resetForm, 300);
  }, [setAuthModalOpen, resetForm]);

  const switchView = useCallback((newView) => {
    setErrors({});
    setView(newView);
  }, []);

  const validateLogin = useCallback(() => {
    const newErrors = {};
    if (!loginEmail.trim()) {
      newErrors.loginEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) {
      newErrors.loginEmail = 'Please enter a valid email';
    }
    if (!loginPassword) {
      newErrors.loginPassword = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [loginEmail, loginPassword]);

  const validateRegister = useCallback(() => {
    const newErrors = {};
    
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (firstName.trim().length < 2) {
      newErrors.firstName = 'At least 2 characters';
    }
    
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (lastName.trim().length < 2) {
      newErrors.lastName = 'At least 2 characters';
    }
    
    if (!registerEmail.trim()) {
      newErrors.registerEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerEmail)) {
      newErrors.registerEmail = 'Please enter a valid email';
    }
    
    if (!registerPassword) {
      newErrors.registerPassword = 'Password is required';
    } else if (registerPassword.length < 8) {
      newErrors.registerPassword = 'Must be at least 8 characters';
    } else if (passwordStrength < 2) {
      newErrors.registerPassword = 'Please use a stronger password';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (registerPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!agreeTerms) {
      newErrors.agreeTerms = 'You must agree to continue';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [firstName, lastName, registerEmail, registerPassword, confirmPassword, passwordStrength, agreeTerms]);

  const validateForgotPassword = useCallback(() => {
    const newErrors = {};
    if (!forgotEmail.trim()) {
      newErrors.forgotEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      newErrors.forgotEmail = 'Please enter a valid email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [forgotEmail]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setIsLoading(true);
    try {
      const result = await login(loginEmail.trim(), loginPassword);
      if (result.success) {
        toast.success('Welcome back! 👋');
        const user = useAuthStore.getState().user;
        if (user?.$id) {
          fetchCart(user.$id);
          fetchWishlist(user.$id);
        }
        handleClose();
      } else {
        const errorMessage = result.error || 'Invalid credentials';
        toast.error(errorMessage);
        if (errorMessage.toLowerCase().includes('email')) {
          setErrors({ loginEmail: errorMessage });
        } else {
          setErrors({ loginPassword: errorMessage });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateRegister()) return;

    setIsLoading(true);
    try {
      const result = await register(
        registerEmail.trim(), 
        registerPassword, 
        firstName.trim(), 
        lastName.trim()
      );
      
      if (result.success) {
        toast.success('Welcome to Elegance! 🎉');
        const user = useAuthStore.getState().user;
        if (user?.$id) {
          fetchCart(user.$id);
          fetchWishlist(user.$id);
        }
        handleClose();
      } else {
        const errorMessage = result.error || 'Registration failed';
        toast.error(errorMessage);
        if (errorMessage.toLowerCase().includes('email')) {
          setErrors({ registerEmail: errorMessage });
        }
      }
    } catch (error) {
      console.error('Register error:', error);
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!validateForgotPassword()) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setEmailSent(true);
      toast.success('Password reset email sent!');
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Stable handler functions with useCallback
  const handleLoginEmailChange = useCallback((e) => {
    setLoginEmail(e.target.value);
    if (errors.loginEmail) {
      setErrors(prev => ({ ...prev, loginEmail: '' }));
    }
  }, [errors.loginEmail]);

  const handleLoginPasswordChange = useCallback((e) => {
    setLoginPassword(e.target.value);
    if (errors.loginPassword) {
      setErrors(prev => ({ ...prev, loginPassword: '' }));
    }
  }, [errors.loginPassword]);

  const handleFirstNameChange = useCallback((e) => {
    setFirstName(e.target.value);
    if (errors.firstName) {
      setErrors(prev => ({ ...prev, firstName: '' }));
    }
  }, [errors.firstName]);

  const handleLastNameChange = useCallback((e) => {
    setLastName(e.target.value);
    if (errors.lastName) {
      setErrors(prev => ({ ...prev, lastName: '' }));
    }
  }, [errors.lastName]);

  const handleRegisterEmailChange = useCallback((e) => {
    setRegisterEmail(e.target.value);
    if (errors.registerEmail) {
      setErrors(prev => ({ ...prev, registerEmail: '' }));
    }
  }, [errors.registerEmail]);

  const handleRegisterPasswordChange = useCallback((e) => {
    setRegisterPassword(e.target.value);
    if (errors.registerPassword) {
      setErrors(prev => ({ ...prev, registerPassword: '' }));
    }
  }, [errors.registerPassword]);

  const handleConfirmPasswordChange = useCallback((e) => {
    setConfirmPassword(e.target.value);
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  }, [errors.confirmPassword]);

  const handleForgotEmailChange = useCallback((e) => {
    setForgotEmail(e.target.value);
    if (errors.forgotEmail) {
      setErrors(prev => ({ ...prev, forgotEmail: '' }));
    }
  }, [errors.forgotEmail]);

  const handleAgreeTermsChange = useCallback((e) => {
    setAgreeTerms(e.target.checked);
    if (errors.agreeTerms) {
      setErrors(prev => ({ ...prev, agreeTerms: '' }));
    }
  }, [errors.agreeTerms]);

  const handleRememberMeChange = useCallback((e) => {
    setRememberMe(e.target.checked);
  }, []);

  // Password strength helpers
  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return 'bg-gray-200';
      case 1: return 'bg-red-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-blue-500';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-200';
    }
  };

  const getPasswordStrengthLabel = () => {
    switch (passwordStrength) {
      case 0: return '';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={handleClose}
      size="md"
      showClose={false}
    >
      <div className="relative bg-gradient-to-br from-white to-gray-50/30">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2.5 rounded-xl hover:bg-gray-100 transition-colors z-10 group"
        >
          <X className="w-5 h-5 text-[#455A64] group-hover:text-[#26323B]" />
        </button>

        <div className="p-6 md:p-10">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="w-20 h-20 bg-gradient-to-br from-[#26323B] via-[#455A64] to-[#26323B] rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-[#26323B]/20"
            >
              <span className="text-white font-bold text-3xl">KS</span>
            </motion.div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {view === 'forgot' && (
                  <button
                    onClick={() => switchView('login')}
                    className="inline-flex items-center gap-1 text-sm text-[#455A64] hover:text-[#26323B] mb-3 transition-colors font-medium"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to login
                  </button>
                )}
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#26323B] to-[#455A64] bg-clip-text text-transparent mb-3">
                  {view === 'login' && 'Welcome Back'}
                  {view === 'register' && 'Join Elegance'}
                  {view === 'forgot' && 'Reset Password'}
                </h2>
                <p className="text-[#455A64] text-sm md:text-base max-w-sm mx-auto leading-relaxed">
                  {view === 'login' && 'Sign in to continue your shopping journey'}
                  {view === 'register' && 'Create an account to unlock exclusive perks'}
                  {view === 'forgot' && "We'll send you a link to reset your password"}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Features (only for register view) */}
          {view === 'register' && <Features />}

          {/* Forms */}
          <AnimatePresence mode="wait">
            {/* Login Form */}
            {view === 'login' && (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLogin}
                className="space-y-5"
              >
                <InputField
                  label="Email Address"
                  type="email"
                  value={loginEmail}
                  onChange={handleLoginEmailChange}
                  error={errors.loginEmail}
                  placeholder="you@example.com"
                  icon={Mail}
                  autoComplete="email"
                  required
                />

                <InputField
                  label="Password"
                  type="password"
                  value={loginPassword}
                  onChange={handleLoginPasswordChange}
                  error={errors.loginPassword}
                  placeholder="••••••••"
                  icon={Lock}
                  showPassword={showLoginPassword}
                  onTogglePassword={() => setShowLoginPassword(!showLoginPassword)}
                  autoComplete="current-password"
                  required
                />

                <div className="flex items-center justify-between">
                  <Checkbox
                    checked={rememberMe}
                    onChange={handleRememberMeChange}
                    label="Remember me"
                  />
                  <button
                    type="button"
                    onClick={() => switchView('forgot')}
                    className="text-sm font-semibold text-[#26323B] hover:underline transition-all"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full shadow-lg shadow-[#26323B]/20 hover:shadow-xl hover:shadow-[#26323B]/30"
                  size="lg"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                <SocialButtons />

                <p className="text-center text-sm text-[#455A64]">
                  New to Elegance?{' '}
                  <button
                    type="button"
                    onClick={() => switchView('register')}
                    className="font-bold text-[#26323B] hover:underline"
                  >
                    Create an account
                  </button>
                </p>
              </motion.form>
            )}

            {/* Register Form */}
            {view === 'register' && (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRegister}
                className="space-y-5"
              >
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="First Name"
                    type="text"
                    value={firstName}
                    onChange={handleFirstNameChange}
                    error={errors.firstName}
                    placeholder="John"
                    icon={User}
                    autoComplete="given-name"
                    required
                  />

                  <InputField
                    label="Last Name"
                    type="text"
                    value={lastName}
                    onChange={handleLastNameChange}
                    error={errors.lastName}
                    placeholder="Doe"
                    autoComplete="family-name"
                    required
                  />
                </div>

                <InputField
                  label="Email Address"
                  type="email"
                  value={registerEmail}
                  onChange={handleRegisterEmailChange}
                  error={errors.registerEmail}
                  placeholder="you@example.com"
                  icon={Mail}
                  autoComplete="email"
                  required
                />

                <div>
                  <InputField
                    label="Password"
                    type="password"
                    value={registerPassword}
                    onChange={handleRegisterPasswordChange}
                    error={errors.registerPassword}
                    placeholder="••••••••"
                    icon={Lock}
                    showPassword={showRegisterPassword}
                    onTogglePassword={() => setShowRegisterPassword(!showRegisterPassword)}
                    autoComplete="new-password"
                    required
                  />
                  
                  {registerPassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3"
                    >
                      <div className="flex gap-1.5 mb-2">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={cn(
                              "h-2 flex-1 rounded-full transition-all duration-300",
                              level <= passwordStrength ? getPasswordStrengthColor() : "bg-gray-200"
                            )}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={cn(
                          "text-xs font-bold",
                          passwordStrength <= 1 ? "text-red-500" :
                          passwordStrength === 2 ? "text-yellow-600" :
                          passwordStrength === 3 ? "text-blue-500" :
                          "text-green-500"
                        )}>
                          {getPasswordStrengthLabel()}
                        </span>
                        <span className="text-xs text-[#B0BEC5] font-medium">
                          Min. 8 characters
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>

                <InputField
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  error={errors.confirmPassword}
                  placeholder="••••••••"
                  icon={Lock}
                  showPassword={showConfirmPassword}
                  onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                  autoComplete="new-password"
                  required
                />

                <Checkbox
                  checked={agreeTerms}
                  onChange={handleAgreeTermsChange}
                  error={errors.agreeTerms}
                >
                  I agree to the{' '}
                  <a href="/terms" className="text-[#26323B] font-bold hover:underline" target="_blank" rel="noopener noreferrer">
                    Terms
                  </a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-[#26323B] font-bold hover:underline" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </a>
                </Checkbox>

                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full shadow-lg shadow-[#26323B]/20 hover:shadow-xl hover:shadow-[#26323B]/30"
                  size="lg"
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>

                <SocialButtons />

                <p className="text-center text-sm text-[#455A64]">
                  Already a member?{' '}
                  <button
                    type="button"
                    onClick={() => switchView('login')}
                    className="font-bold text-[#26323B] hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </motion.form>
            )}

            {/* Forgot Password Form */}
            {view === 'forgot' && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {!emailSent ? (
                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <InputField
                      label="Email Address"
                      type="email"
                      value={forgotEmail}
                      onChange={handleForgotEmailChange}
                      error={errors.forgotEmail}
                      placeholder="you@example.com"
                      icon={Mail}
                      autoComplete="email"
                      required
                    />

                    <Button
                      type="submit"
                      isLoading={isLoading}
                      className="w-full shadow-lg shadow-[#26323B]/20 hover:shadow-xl hover:shadow-[#26323B]/30"
                      size="lg"
                    >
                      {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>

                    <p className="text-center text-sm text-[#455A64]">
                      Remember your password?{' '}
                      <button
                        type="button"
                        onClick={() => switchView('login')}
                        className="font-bold text-[#26323B] hover:underline"
                      >
                        Sign in
                      </button>
                    </p>
                  </form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/30">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                      >
                        <Check className="w-12 h-12 text-white stroke-[3]" />
                      </motion.div>
                    </div>
                    <h3 className="text-2xl font-bold text-[#26323B] mb-3">
                      Check Your Email
                    </h3>
                    <p className="text-[#455A64] mb-6 max-w-sm mx-auto leading-relaxed">
                      We've sent a password reset link to{' '}
                      <span className="font-bold text-[#26323B] block mt-1">{forgotEmail}</span>
                    </p>
                    <div className="space-y-3">
                      <Button
                        onClick={() => {
                          setEmailSent(false);
                          setForgotEmail('');
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        Try a different email
                      </Button>
                      <button
                        onClick={() => switchView('login')}
                        className="text-sm font-bold text-[#26323B] hover:underline"
                      >
                        Back to login
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Trust Badge */}
        <div className="px-6 pb-6 pt-2">
          <div className="text-center">
            <p className="text-xs text-[#B0BEC5] flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" />
              Your data is encrypted and secure
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}