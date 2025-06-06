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

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { signIn, signInWithGoogle, signInWithGithub, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!email || !password) {
      setFormError('Please enter both email and password');
      return;
    }
    
    try {
      await signIn(email, password);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setFormError(err.message || 'Failed to sign in');
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
          Sign In to ReachSpark
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
          Sign in with Google
        </GoogleButton>
        
        <GitHubButton
          fullWidth
          variant="contained"
          startIcon={<GitHubIcon />}
          onClick={handleGithubSignIn}
          disabled={loading}
        >
          Sign in with GitHub
        </GitHubButton>
        
        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>
        
        <Box component="form" onSubmit={handleEmailSignIn} noValidate>
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
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
          
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link href="/forgot-password" passHref>
              <MuiLink variant="body2" underline="hover">
                Forgot password?
              </MuiLink>
            </Link>
          </Box>
          
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link href="/signup" passHref>
                <MuiLink variant="body2" underline="hover">
                  Sign Up
                </MuiLink>
              </Link>
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </AuthCard>
  );
};

export default LoginForm;
