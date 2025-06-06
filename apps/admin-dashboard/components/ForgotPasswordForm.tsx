import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Typography, 
  Alert, 
  CircularProgress,
  Link as MuiLink
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

// Styled components
const AuthCard = styled(Card)(({ theme }) => ({
  maxWidth: 450,
  margin: '0 auto',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
  overflow: 'hidden',
}));

const CardHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  textAlign: 'center',
}));

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSuccess }) => {
  const { resetPassword, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(false);
    
    if (!email) {
      setFormError('Please enter your email address');
      return;
    }
    
    try {
      await resetPassword(email);
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setFormError(err.message || 'Failed to reset password');
    }
  };

  return (
    <AuthCard>
      <CardHeader>
        <Typography variant="h5" component="h1" fontWeight="bold">
          Reset Password
        </Typography>
      </CardHeader>
      <CardContent sx={{ p: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {formError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {formError}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Password reset email sent. Please check your inbox.
          </Alert>
        )}
        
        <Typography variant="body1" sx={{ mb: 3 }}>
          Enter your email address and we'll send you a link to reset your password.
        </Typography>
        
        <Box component="form" onSubmit={handleResetPassword} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Reset Password'}
          </Button>
          
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Remember your password?{' '}
              <Link href="/login" passHref>
                <MuiLink variant="body2" underline="hover">
                  Sign In
                </MuiLink>
              </Link>
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </AuthCard>
  );
};

export default ForgotPasswordForm;
