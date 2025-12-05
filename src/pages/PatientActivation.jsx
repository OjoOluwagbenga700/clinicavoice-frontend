import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  LinearProgress,
  Checkbox,
  FormControlLabel,
  Link
} from '@mui/material';
import { post } from 'aws-amplify/api';

/**
 * PatientActivation Component
 * Public page for patients to activate their account
 * Route: /activate?token=xxx
 */
export default function PatientActivation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });

  // Extract token from URL on mount
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Invalid activation link. Please check your email for the correct link.');
    }
  }, [searchParams]);

  /**
   * Calculate password strength
   */
  const calculatePasswordStrength = (pwd) => {
    const feedback = [];
    let score = 0;

    if (pwd.length >= 8) {
      score += 1;
    } else {
      feedback.push('At least 8 characters');
    }

    if (/[a-z]/.test(pwd)) {
      score += 1;
    } else {
      feedback.push('One lowercase letter');
    }

    if (/[A-Z]/.test(pwd)) {
      score += 1;
    } else {
      feedback.push('One uppercase letter');
    }

    if (/[0-9]/.test(pwd)) {
      score += 1;
    } else {
      feedback.push('One number');
    }

    if (/[^A-Za-z0-9]/.test(pwd)) {
      score += 1;
    } else {
      feedback.push('One special character (optional but recommended)');
    }

    return { score, feedback };
  };

  /**
   * Handle password change and update strength indicator
   */
  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setPassword(pwd);
    setPasswordStrength(calculatePasswordStrength(pwd));
  };

  /**
   * Get password strength color
   */
  const getStrengthColor = () => {
    if (passwordStrength.score <= 1) return 'error';
    if (passwordStrength.score <= 2) return 'warning';
    if (passwordStrength.score <= 3) return 'info';
    return 'success';
  };

  /**
   * Get password strength label
   */
  const getStrengthLabel = () => {
    if (passwordStrength.score <= 1) return 'Weak';
    if (passwordStrength.score <= 2) return 'Fair';
    if (passwordStrength.score <= 3) return 'Good';
    return 'Strong';
  };

  /**
   * Validate form
   */
  const validateForm = () => {
    if (!token) {
      setError('Invalid activation token');
      return false;
    }

    if (!password) {
      setError('Password is required');
      return false;
    }

    if (passwordStrength.score < 4) {
      setError('Password does not meet minimum requirements');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (!termsAccepted) {
      setError('You must accept the terms and conditions');
      return false;
    }

    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Call patient activation API (no auth required)
      const restOperation = post({
        apiName: 'ClinicaVoiceAPI',
        path: '/patients/activate',
        options: {
          body: {
            token,
            password
          }
        }
      });

      const response = await restOperation.response;
      const data = await response.body.json();

      if (data.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Account activated successfully! Please log in with your email and password.' 
            } 
          });
        }, 3000);
      } else {
        setError(data.message || 'Failed to activate account');
      }
    } catch (err) {
      console.error('Activation error:', err);
      
      // Parse error message from API response
      let errorMessage = 'Failed to activate account. Please try again.';
      
      try {
        if (err.response) {
          const errorData = await err.response.body.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        }
      } catch (parseError) {
        // Use default error message
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Account Activated Successfully!
            </Typography>
            <Typography variant="body2">
              Your patient portal account has been activated. You will be redirected to the login page shortly.
            </Typography>
          </Alert>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Activate Your Account
        </Typography>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Welcome to ClinicaVoice Patient Portal. Please set your password to activate your account.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={handlePasswordChange}
            disabled={loading}
          />

          {password && (
            <Box sx={{ mt: 1, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" sx={{ mr: 1 }}>
                  Password Strength:
                </Typography>
                <Typography variant="caption" color={getStrengthColor()}>
                  {getStrengthLabel()}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(passwordStrength.score / 5) * 100}
                color={getStrengthColor()}
                sx={{ height: 6, borderRadius: 3 }}
              />
              {passwordStrength.feedback.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Required: {passwordStrength.feedback.join(', ')}
                </Typography>
              )}
            </Box>
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            error={confirmPassword && password !== confirmPassword}
            helperText={
              confirmPassword && password !== confirmPassword
                ? 'Passwords do not match'
                : ''
            }
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                disabled={loading}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                I accept the{' '}
                <Link href="/terms" target="_blank" rel="noopener">
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link href="/privacy" target="_blank" rel="noopener">
                  Privacy Policy
                </Link>
              </Typography>
            }
            sx={{ mt: 2 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading || !token}
          >
            {loading ? 'Activating...' : 'Activate Account'}
          </Button>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link href="/login" underline="hover">
                Log in
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
