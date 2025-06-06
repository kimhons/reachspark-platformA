import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Email as EmailIcon } from '@mui/icons-material';
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
const EmailCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

// Recipient count options
const recipientOptions = [
  { value: 100, label: '100 recipients', baseCost: 40 },
  { value: 500, label: '500 recipients', baseCost: 60 },
  { value: 1000, label: '1,000 recipients', baseCost: 100 },
  { value: 5000, label: '5,000 recipients', baseCost: 200 },
  { value: 10000, label: '10,000 recipients', baseCost: 350 }
];

interface EmailCampaignCreatorProps {}

const EmailCampaignCreator: React.FC<EmailCampaignCreatorProps> = () => {
  const { user } = useAuth();
  const [tokenService, setTokenService] = useState<TokenService | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [recipients, setRecipients] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Calculate token cost
  const getTokenCost = () => {
    const option = recipientOptions.find(o => o.value === recipients);
    const baseCost = option?.baseCost || 40;
    const contentLength = content.length;
    const additionalCost = Math.floor(contentLength / 500) * 5;
    return baseCost + additionalCost;
  };
  
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
  
  const handleSendCampaign = async () => {
    if (!tokenService || !user || !name || !subject || !content) return;
    
    const tokenCost = getTokenCost();
    
    if (tokenBalance !== null && tokenBalance < tokenCost) {
      setError(`Not enough tokens. This operation requires ${tokenCost} tokens, but you only have ${tokenBalance}.`);
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await tokenService.sendEmailCampaign(
        name,
        subject,
        content,
        recipients
      );
      
      if (result.success) {
        setSuccess(`Successfully sent email campaign to ${recipients} recipients!`);
        setTokenBalance(result.remainingTokens);
        
        // Reset form
        setName('');
        setSubject('');
        setContent('');
        setRecipients(100);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send email campaign');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Email Campaign Creator
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Create and send email marketing campaigns
        </Typography>
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
        <Grid item xs={12} md={8}>
          <EmailCard>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Campaign Details
              </Typography>
              
              <TextField
                fullWidth
                label="Campaign Name"
                placeholder="Spring Sale Announcement"
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
                disabled={loading}
              />
              
              <TextField
                fullWidth
                label="Email Subject"
                placeholder="Don't Miss Our Spring Sale!"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                margin="normal"
                disabled={loading}
              />
              
              <TextField
                fullWidth
                label="Email Content"
                placeholder="Write your email content here..."
                multiline
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                margin="normal"
                disabled={loading}
                helperText={`${content.length} characters (${Math.floor(content.length / 500) * 5} additional tokens)`}
              />
            </CardContent>
          </EmailCard>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <EmailCard>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Send Campaign
              </Typography>
              
              <TextField
                select
                fullWidth
                label="Number of Recipients"
                value={recipients}
                onChange={(e) => setRecipients(Number(e.target.value))}
                margin="normal"
                disabled={loading}
              >
                {recipientOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              
              <Divider sx={{ my: 3 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2">
                  Base Cost:
                </Typography>
                <Typography variant="body2">
                  {recipientOptions.find(o => o.value === recipients)?.baseCost || 40} tokens
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2">
                  Content Length:
                </Typography>
                <Typography variant="body2">
                  +{Math.floor(content.length / 500) * 5} tokens
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2">
                  Total Token Cost:
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {getTokenCost()} tokens
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="subtitle2">
                  Your Balance:
                </Typography>
                <Typography 
                  variant="subtitle1" 
                  fontWeight="bold"
                  color={tokenBalance !== null && tokenBalance < getTokenCost() ? 'error.main' : 'inherit'}
                >
                  {tokenBalance !== null ? `${tokenBalance} tokens` : 'Loading...'}
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <EmailIcon />}
                onClick={handleSendCampaign}
                disabled={
                  loading || 
                  !name || 
                  !subject || 
                  !content || 
                  (tokenBalance !== null && tokenBalance < getTokenCost())
                }
              >
                {loading ? 'Sending...' : 'Send Campaign'}
              </Button>
            </CardContent>
          </EmailCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmailCampaignCreator;
