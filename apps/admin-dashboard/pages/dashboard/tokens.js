import { useState } from 'react';
import { Box, Typography, Button, Paper, Grid, Card, CardContent, Divider, TextField, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Tooltip, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ShoppingCart as ShoppingCartIcon,
  History as HistoryIcon,
  Token as TokenIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import DashboardLayout from '../../components/DashboardLayout';

// Styled components
const TokenCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '4px',
    backgroundColor: theme.palette.primary.main,
  },
}));

const PlanCard = styled(Card)(({ theme, selected }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: selected ? '0 8px 30px rgba(79, 70, 229, 0.2)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'hidden',
  border: selected ? `2px solid ${theme.palette.primary.main}` : 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.1)',
  },
}));

const PlanHeader = styled(Box)(({ theme, plan }) => ({
  padding: theme.spacing(3),
  backgroundColor: plan === 'basic' ? theme.palette.info.light : 
                  plan === 'pro' ? theme.palette.primary.light : 
                  plan === 'enterprise' ? theme.palette.secondary.light : 
                  theme.palette.grey[100],
  color: plan === 'basic' ? theme.palette.info.dark : 
         plan === 'pro' ? theme.palette.primary.dark : 
         plan === 'enterprise' ? theme.palette.secondary.dark : 
         theme.palette.grey[800],
}));

const TokenProgressWrapper = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1),
}));

const HistoryItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  marginBottom: theme.spacing(1),
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
}));

// Sample token plans
const tokenPlans = [
  {
    id: 1,
    name: 'Basic',
    code: 'basic',
    tokens: 1000,
    price: 9.99,
    features: [
      'Access to basic AI features',
      'Generate up to 50 images per month',
      'Create up to 10 marketing campaigns',
      'Email support',
    ],
  },
  {
    id: 2,
    name: 'Pro',
    code: 'pro',
    tokens: 5000,
    price: 29.99,
    features: [
      'Access to all AI features',
      'Generate up to 200 images per month',
      'Create unlimited marketing campaigns',
      'Priority email support',
      'Advanced analytics',
    ],
    popular: true,
  },
  {
    id: 3,
    name: 'Enterprise',
    code: 'enterprise',
    tokens: 20000,
    price: 99.99,
    features: [
      'Access to all AI features',
      'Generate unlimited images',
      'Create unlimited marketing campaigns',
      'Priority phone & email support',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated account manager',
    ],
  },
];

// Sample token usage history
const initialTokenHistory = [
  {
    id: 1,
    date: '2023-10-15T14:30:00Z',
    amount: -50,
    description: 'Generated 5 social media posts',
    type: 'usage',
  },
  {
    id: 2,
    date: '2023-10-14T10:15:00Z',
    amount: -100,
    description: 'Created email marketing campaign',
    type: 'usage',
  },
  {
    id: 3,
    date: '2023-10-10T09:45:00Z',
    amount: 5000,
    description: 'Purchased Pro plan',
    type: 'purchase',
  },
  {
    id: 4,
    date: '2023-10-05T16:20:00Z',
    amount: -75,
    description: 'Generated 3 AI images',
    type: 'usage',
  },
  {
    id: 5,
    date: '2023-10-01T11:30:00Z',
    amount: -200,
    description: 'Created website content',
    type: 'usage',
  },
];

const TokenManagement = () => {
  const [currentTokens, setCurrentTokens] = useState(4575);
  const [totalTokens, setTotalTokens] = useState(5000);
  const [tokenHistory, setTokenHistory] = useState(initialTokenHistory);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [openPurchaseDialog, setOpenPurchaseDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [customTokens, setCustomTokens] = useState(1000);
  const [customPrice, setCustomPrice] = useState(9.99);
  
  // Calculate token usage percentage
  const tokenUsagePercentage = totalTokens > 0 
    ? Math.round(((totalTokens - currentTokens) / totalTokens) * 100) 
    : 0;
  
  // Handle plan selection
  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setOpenPurchaseDialog(true);
  };
  
  // Handle custom token amount change
  const handleCustomTokensChange = (event) => {
    const amount = parseInt(event.target.value);
    setCustomTokens(amount);
    // Calculate price (simplified formula)
    setCustomPrice((amount * 0.01).toFixed(2));
  };
  
  // Handle purchase dialog close
  const handleClosePurchaseDialog = () => {
    setOpenPurchaseDialog(false);
    setSelectedPlan(null);
  };
  
  // Handle history dialog open/close
  const handleOpenHistoryDialog = () => {
    setOpenHistoryDialog(true);
  };
  
  const handleCloseHistoryDialog = () => {
    setOpenHistoryDialog(false);
  };
  
  // Handle token purchase
  const handlePurchaseTokens = () => {
    const newPurchase = {
      id: tokenHistory.length + 1,
      date: new Date().toISOString(),
      amount: selectedPlan ? selectedPlan.tokens : customTokens,
      description: selectedPlan ? `Purchased ${selectedPlan.name} plan` : `Purchased custom token package`,
      type: 'purchase',
    };
    
    setTokenHistory(prev => [newPurchase, ...prev]);
    setTotalTokens(prev => prev + (selectedPlan ? selectedPlan.tokens : customTokens));
    setCurrentTokens(prev => prev + (selectedPlan ? selectedPlan.tokens : customTokens));
    handleClosePurchaseDialog();
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  return (
    <DashboardLayout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Token Management
          </Typography>
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<HistoryIcon />}
              onClick={handleOpenHistoryDialog}
              sx={{ borderRadius: 2, mr: 2 }}
            >
              Usage History
            </Button>
            <Button 
              variant="contained" 
              startIcon={<ShoppingCartIcon />}
              onClick={() => setOpenPurchaseDialog(true)}
              sx={{ borderRadius: 2 }}
            >
              Purchase Tokens
            </Button>
          </Box>
        </Box>
        
        {/* Token stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <TokenCard>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Available Tokens
                    </Typography>
                    <Typography variant="h3" component="div" fontWeight="bold" sx={{ my: 1 }}>
                      {currentTokens.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip 
                        icon={<ArrowDownwardIcon fontSize="small" />} 
                        label={`${tokenUsagePercentage}% used`} 
                        size="small" 
                        color={tokenUsagePercentage > 80 ? "error" : tokenUsagePercentage > 50 ? "warning" : "success"}
                        sx={{ borderRadius: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        of {totalTokens.toLocaleString()} total
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.light',
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <TokenIcon fontSize="large" />
                  </Box>
                </Box>
                
                <TokenProgressWrapper>
                  <LinearProgress 
                    variant="determinate" 
                    value={tokenUsagePercentage} 
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      bgcolor: 'background.paper',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                        bgcolor: tokenUsagePercentage > 80 ? "error.main" : tokenUsagePercentage > 50 ? "warning.main" : "success.main",
                      }
                    }}
                  />
                </TokenProgressWrapper>
                
                <Typography variant="body2" color="text.secondary">
                  Tokens are used for AI-powered features like content generation, image creation, and marketing campaigns.
                </Typography>
              </CardContent>
            </TokenCard>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TokenCard>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                  Recent Token Activity
                </Typography>
                
                {tokenHistory.slice(0, 3).map(item => (
                  <HistoryItem key={item.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {item.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(item.date)}
                        </Typography>
                      </Box>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        color={item.amount > 0 ? 'success.main' : 'error.main'}
                      >
                        {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()}
                      </Typography>
                    </Box>
                  </HistoryItem>
                ))}
                
                <Button 
                  variant="text" 
                  onClick={handleOpenHistoryDialog}
                  sx={{ mt: 1 }}
                >
                  View All Activity
                </Button>
              </CardContent>
            </TokenCard>
          </Grid>
        </Grid>
        
        {/* Token plans */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" fontWeight="bold" sx={{ mb: 3 }}>
            Token Plans
          </Typography>
          
          <Grid container spacing={3}>
            {tokenPlans.map(plan => (
              <Grid item xs={12} sm={6} md={4} key={plan.id}>
                <PlanCard selected={selectedPlan?.id === plan.id}>
                  <PlanHeader plan={plan.code}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" fontWeight="bold">
                        {plan.name}
                      </Typography>
                      {plan.popular && (
                        <Chip 
                          label="Popular" 
                          size="small" 
                          color="primary"
                          sx={{ borderRadius: 1, bgcolor: 'white', color: 'primary.main' }}
                        />
                      )}
                    </Box>
                  </PlanHeader>
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
                      <Typography variant="h4" component="span" fontWeight="bold">
                        ${plan.price}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        /month
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <TokenIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" fontWeight="medium">
                        {plan.tokens.toLocaleString()} tokens
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box>
                      {plan.features.map((feature, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box 
                            component="span" 
                            sx={{ 
                              width: 6, 
                              height: 6, 
                              borderRadius: '50%', 
                              bgcolor: 'primary.main',
                              mr: 1.5
                            }} 
                          />
                          <Typography variant="body2">
                            {feature}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                  
                  <Box sx={{ p: 2 }}>
                    <Button 
                      variant={selectedPlan?.id === plan.id ? "contained" : "outlined"} 
                      color="primary"
                      fullWidth
                      onClick={() => handleSelectPlan(plan)}
                      sx={{ borderRadius: 2 }}
                    >
                      {selectedPlan?.id === plan.id ? "Selected" : "Select Plan"}
                    </Button>
                  </Box>
                </PlanCard>
              </Grid>
            ))}
          </Grid>
        </Box>
        
        {/* Purchase dialog */}
        <Dialog open={openPurchaseDialog} onClose={handleClosePurchaseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedPlan ? `Purchase ${selectedPlan.name} Plan` : 'Purchase Custom Tokens'}
          </DialogTitle>
          <DialogContent dividers>
            {selectedPlan ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Plan Details
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body1">Plan:</Typography>
                  <Typography variant="body1" fontWeight="bold">{selectedPlan.name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body1">Tokens:</Typography>
                  <Typography variant="body1" fontWeight="bold">{selectedPlan.tokens.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="body1">Price:</Typography>
                  <Typography variant="body1" fontWeight="bold">${selectedPlan.price}</Typography>
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  By purchasing this plan, you agree to our Terms of Service and Privacy Policy.
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Custom Token Package
                </Typography>
                <TextField
                  fullWidth
                  label="Number of Tokens"
                  type="number"
                  value={customTokens}
                  onChange={handleCustomTokensChange}
                  InputProps={{
                    inputProps: { min: 100, step: 100 }
                  }}
                  margin="normal"
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 3 }}>
                  <Typography variant="body1">Price:</Typography>
                  <Typography variant="body1" fontWeight="bold">${customPrice}</Typography>
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Custom tokens are one-time purchases and do not renew automatically.
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePurchaseDialog}>
              Cancel
            </Button>
            <Button onClick={handlePurchaseTokens} variant="contained" color="primary">
              Purchase
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* History dialog */}
        <Dialog open={openHistoryDialog} onClose={handleCloseHistoryDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            Token Usage History
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                This is a record of all your token transactions, including purchases and usage.
              </Typography>
            </Box>
            
            {tokenHistory.map(item => (
              <HistoryItem key={item.id}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {item.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(item.date)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip 
                      label={item.type === 'purchase' ? 'Purchase' : 'Usage'} 
                      size="small" 
                      color={item.type === 'purchase' ? 'success' : 'primary'}
                      sx={{ mr: 2, borderRadius: 1 }}
                    />
                    <Typography 
                      variant="body1" 
                      fontWeight="bold"
                      color={item.amount > 0 ? 'success.main' : 'error.main'}
                    >
                      {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </HistoryItem>
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseHistoryDialog}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default TokenManagement;
