import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Typography, 
  Divider, 
  Alert, 
  CircularProgress,
  Link as MuiLink
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Google as GoogleIcon, GitHub as GitHubIcon } from '@mui/icons-material';
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

const SocialButton = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
  justifyContent: 'flex-start',
  '& .MuiButton-startIcon': {
    marginRight: theme.spacing(2),
  },
}));

const GoogleButton = styled(SocialButton)(({ theme }) => ({
  backgroundColor: '#ffffff',
  color: theme.palette.text.primary,
  border: '1px solid',
  borderColor: theme.palette.divider,
  '&:hover': {
    backgroundColor: '#f5f5f5',
  },
}));

const GitHubButton = styled(SocialButton)(({ theme }) => ({
  backgroundColor: '#24292e',
  color: '#ffffff',
  '&:hover': {
    backgroundColor: '#1b1f23',
  },
}));

interface SignUpFormProps {
  onSuccess?: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess }) => {
  const { signUp, signInWithGoogle, signInWithGithub, loading, error } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!displayName || !email || !password || !confirmPassword) {
      setFormError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    
    try {
      await signUp(email, password, displayName);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setFormError(err.message || 'Failed to sign up');
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setFormError(err.message || 'Failed to sign in with Google');
    }
  };

  const handleGithubSignIn = async () => {
    setFormError(null);
    try {
      await signInWithGithub();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setFormError(err.message || 'Failed to sign in with GitHub');
    }
  };

  return (
    <AuthCard>
      <CardHeader>
        <Typography variant="h5" component="h1" fontWeight="bold">
          Create an Account
        </Typography>
      </CardHeader>
      <CardContent sx={{ p: 4 }}>
        {(error || formError) && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || formError}
          </Alert>
        )}
        
        <GoogleButton
          fullWidth
          variant="contained"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          Sign up with Google
        </GoogleButton>
        
        <GitHubButton
          fullWidth
          variant="contained"
          startIcon={<GitHubIcon />}
          onClick={handleGithubSignIn}
          disabled={loading}
        >
          Sign up with GitHub
        </GitHubButton>
        
        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>
        
        <Box component="form" onSubmit={handleEmailSignUp} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="displayName"
            label="Full Name"
            name="displayName"
            autoComplete="name"
            autoFocus
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
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
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
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
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign Up'}
          </Button>
          
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
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

export default SignUpForm;
