import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Check as CheckIcon, Star as StarIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { createTokenService, TokenService } from '@reachspark/tokens';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Styled components
const PlanCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)',
  },
}));

const PopularPlanCard = styled(PlanCard)(({ theme }) => ({
  border: `2px solid ${theme.palette.primary.main}`,
  position: 'relative',
}));

const PopularBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(0.5, 2),
  borderBottomLeftRadius: theme.shape.borderRadius,
  fontWeight: 'bold',
  fontSize: '0.875rem',
}));

// Plan data
const plans = [
  {
    id: 'basic',
    name: 'Basic',
    tokens: 500,
    price: 29,
    popular: false,
    features: [
      'Social media post scheduling',
      'Email campaign creation',
      'Basic analytics',
      'Up to 5 AI image generations',
      '30-day token validity'
    ]
  },
  {
    id: 'pro',
    name: 'Professional',
    tokens: 1500,
    price: 79,
    popular: true,
    features: [
      'All Basic features',
      'Advanced analytics',
      'Up to 20 AI image generations',
      'Priority support',
      'Custom branding',
      '60-day token validity'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tokens: 5000,
    price: 199,
    popular: false,
    features: [
      'All Professional features',
      'Unlimited AI image generations',
      'API access',
      'Dedicated account manager',
      'Custom integrations',
      '90-day token validity'
    ]
  }
];

interface TokenPlansProps {}

const TokenPlans: React.FC<TokenPlansProps> = () => {
  const { user } = useAuth();
  const [tokenService, setTokenService] = useState<TokenService | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Initialize token service
  useEffect(() => {
    if (user) {
      const service = createTokenService(firebaseConfig, user.uid);
      setTokenService(service);
      
      // Get token balance
      const fetchTokenBalance = async () => {
        try {
          const balance = await service.getTokenBalance(user.uid);
          setTokenBalance(balance);
        } catch (err: any) {
          console.error('Error fetching token balance:', err);
        }
      };
      
      fetchTokenBalance();
    }
  }, [user]);
  
  const handlePurchase = async (planId: string) => {
    if (!tokenService || !user) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // In a real implementation, you would collect payment method information
      // For this demo, we'll use a placeholder payment method ID
      const paymentMethodId = 'pm_card_visa';
      
      const result = await tokenService.purchaseTokens(planId, paymentMethodId);
      
      if (result.success) {
        setSuccess(`Successfully purchased ${result.tokens} tokens!`);
        setTokenBalance((prev) => (prev || 0) + result.tokens);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to purchase tokens');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Token Plans
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Purchase tokens to use for various features on the ReachSpark platform
        </Typography>
        
        {tokenBalance !== null && (
          <Chip
            label={`Current Balance: ${tokenBalance} tokens`}
            color="primary"
            sx={{ mt: 2, px: 2, py: 3, fontSize: '1rem' }}
          />
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 4 }}>
          {success}
        </Alert>
      )}
      
      <Grid container spacing={4}>
        {plans.map((plan) => (
          <Grid item xs={12} md={4} key={plan.id}>
            {plan.popular ? (
              <PopularPlanCard>
                <PopularBadge>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StarIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Most Popular
                  </Box>
                </PopularBadge>
                <CardContent sx={{ p: 3, flexGrow: 1 }}>
                  <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
                    {plan.name}
                  </Typography>
                  <Typography variant="h3" component="div" fontWeight="bold" sx={{ mb: 2 }}>
                    ${plan.price}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    {plan.tokens} tokens
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <List sx={{ mb: 2 }}>
                    {plan.features.map((feature, index) => (
                      <ListItem key={index} disableGutters sx={{ py: 1 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={feature} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
                <Box sx={{ p: 3, pt: 0 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={() => handlePurchase(plan.id)}
                    disabled={loading || !user}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Purchase Now'}
                  </Button>
                </Box>
              </PopularPlanCard>
            ) : (
              <PlanCard>
                <CardContent sx={{ p: 3, flexGrow: 1 }}>
                  <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
                    {plan.name}
                  </Typography>
                  <Typography variant="h3" component="div" fontWeight="bold" sx={{ mb: 2 }}>
                    ${plan.price}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    {plan.tokens} tokens
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <List sx={{ mb: 2 }}>
                    {plan.features.map((feature, index) => (
                      <ListItem key={index} disableGutters sx={{ py: 1 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={feature} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
                <Box sx={{ p: 3, pt: 0 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="large"
                    onClick={() => handlePurchase(plan.id)}
                    disabled={loading || !user}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Purchase Now'}
                  </Button>
                </Box>
              </PlanCard>
            )}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TokenPlans;
