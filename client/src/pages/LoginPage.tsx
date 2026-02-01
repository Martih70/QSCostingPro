import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, error, clearError, isLoading } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!username.trim()) {
      errors.username = 'Username is required';
    }
    if (!password) {
      errors.password = 'Password is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await login(username, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      // Error is handled by authStore
    }
  };

  const handleInputChange = () => {
    if (error) {
      clearError();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-khc-primary to-khc-secondary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">QSCostingPro</h1>
          <p className="text-khc-light">Professional Cost Estimation for Quantity Surveyors</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg p-8" style={{boxShadow: '0 30px 80px 10px rgba(0, 0, 0, 0.35), 0 15px 40px 5px rgba(0, 0, 0, 0.2), 0 0 60px rgba(0, 0, 0, 0.2)', transform: 'translateY(-12px)'}}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-khc-primary flex-1 text-center">Login</h2>
            <Link
              to="/"
              className="text-gray-500 hover:text-gray-700 transition text-lg font-semibold"
              title="Back to home"
            >
              ←
            </Link>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-khc-neutral mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  handleInputChange();
                }}
                placeholder="Enter your username"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary ${
                  validationErrors.username ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {validationErrors.username && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.username}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-khc-neutral mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  handleInputChange();
                }}
                placeholder="Enter your password"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-khc-primary ${
                  validationErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {validationErrors.password && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 rounded-lg font-medium text-white transition-all ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-khc-primary hover:bg-khc-secondary active:scale-95'
              }`}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center text-sm text-khc-neutral">
            Don't have an account?{' '}
            <Link to="/register" className="text-khc-primary hover:underline font-medium">
              Register here
            </Link>
          </div>

          {/* Forgot Password Link */}
          <div className="mt-3 text-center text-sm text-khc-neutral">
            <Link to="/password-reset" className="text-khc-primary hover:underline font-medium">
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-white/10 rounded-lg text-khc-light text-sm">
          <p className="font-semibold mb-2">Demo Credentials:</p>
          <p className="text-xs">Admin: username: admin | password: admin123456</p>
          <p className="text-xs">Try creating a new account to get started!</p>
        </div>
      </div>
    </div>
  );
}
