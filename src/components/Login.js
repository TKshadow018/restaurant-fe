import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, signInWithGoogle, currentUser } = useAuth();

  // Handle navigation when user becomes authenticated
  useEffect(() => {
    if (currentUser) {
      const isAdmin = currentUser?.email === process.env.REACT_APP_ADMIN_EMAIL;
      console.log('User authenticated, navigating to dashboard', currentUser.email );
      if(isAdmin){
        console.log('User is admin, navigating to admin dashboard');
        navigate('/admin', { replace: true });
        return;
      } else{
        console.log('User is user, navigating to admin dashboard', currentUser);
        navigate('/dashboard', { replace: true });
      }
    }
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Incorrect email or password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        default:
          errorMessage = error.message || 'An unexpected error occurred.';
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrors({});
    
    try {
      const result = await signInWithGoogle();
      console.log('Google sign-in successful:', result);
      console.log('Current user:', result.user);
      console.log('Attempting to navigate to dashboard...');
      
      // Add a small delay to ensure state is updated
      setTimeout(() => {
        if(result.user.email === 'tushartk018@gmail.com'){
          navigate('/admin', { replace: true });
          console.log('Current user is admin, navigating to admin dashboard');
        } else {
          navigate('/dashboard', { replace: true });
          console.log('Current user is user, navigating to dashboard');
        }
        console.log('Navigation attempted');
        return;
      }, 100);
      
    } catch (error) {
      console.error('Google sign-in error:', error);
      let errorMessage = 'Google sign-in failed. Please try again.';
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-in cancelled.';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Popup was blocked. Please allow popups and try again.';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Sign-in cancelled.';
          break;
        default:
          errorMessage = error.message || 'Google sign-in failed.';
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigate('/register');
  };

  const navigateToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-primary bg-gradient">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-lg border-0 rounded-3">
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold text-dark mb-2">Welcome Back</h2>
                  <p className="text-muted">Please sign in to your account</p>
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-semibold">Email Address</label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      disabled={isLoading}
                      autoComplete="email"
                      required
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="form-label fw-semibold">Password</label>
                    <input
                      type="password"
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      disabled={isLoading}
                      autoComplete="current-password"
                      required
                    />
                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                  </div>

                  {errors.submit && (
                    <div className="alert alert-danger" role="alert">
                      {errors.submit}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg w-100 mb-3"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                <div className="text-center mb-3">
                  <div className="d-flex align-items-center">
                    <hr className="flex-grow-1" />
                    <span className="mx-3 text-muted">or</span>
                    <hr className="flex-grow-1" />
                  </div>
                </div>

                <button 
                  type="button" 
                  className="btn btn-outline-danger btn-lg w-100 mb-3 d-flex align-items-center justify-content-center"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg className="me-2" width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {isLoading ? 'Signing in...' : 'Continue with Google'}
                </button>

                <div className="text-center">
                  <p className="mb-2">
                    Don't have an account?{' '}
                    <button 
                      type="button" 
                      className="btn btn-link p-0 text-decoration-none"
                      onClick={navigateToRegister}
                    >
                      Sign up here
                    </button>
                  </p>
                  <button 
                    type="button" 
                    className="btn btn-link p-0 text-decoration-none"
                    onClick={navigateToHome}
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;