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
  FormControl,
  InputLabel,
  Select,
  Chip,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Send as SendIcon } from '@mui/icons-material';
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
const SocialCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const platforms = [
  { value: 'twitter', label: 'Twitter', color: '#1DA1F2' },
  { value: 'facebook', label: 'Facebook', color: '#4267B2' },
  { value: 'instagram', label: 'Instagram', color: '#C13584' },
  { value: 'linkedin', label: 'LinkedIn', color: '#0077B5' },
  { value: 'pinterest', label: 'Pinterest', color: '#E60023' }
];

interface SocialMediaSchedulerProps {}

const SocialMediaScheduler: React.FC<SocialMediaSchedulerProps> = () => {
  const { user } = useAuth();
  const [tokenService, setTokenService] = useState<TokenService | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Calculate token cost
  const getTokenCost = () => {
    return 15 + (selectedPlatforms.length * 5);
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
  
  const handleSchedulePost = async () => {
    if (!tokenService || !user || !content || selectedPlatforms.length === 0 || !scheduledDate) return;
    
    const tokenCost = getTokenCost();
    
    if (tokenBalance !== null && tokenBalance < tokenCost) {
      setError(`Not enough tokens. This operation requires ${tokenCost} tokens, but you only have ${tokenBalance}.`);
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await tokenService.scheduleSocialPost(
        content,
        selectedPlatforms,
        scheduledDate
      );
      
      if (result.success) {
        setSuccess(`Successfully scheduled post to ${selectedPlatforms.join(', ')}!`);
        setTokenBalance(result.remainingTokens);
        
        // Reset form
        setContent('');
        setSelectedPlatforms([]);
        setScheduledDate('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to schedule post');
    } finally {
      setLoading(false);
    }
  };
  
  // Get minimum date-time for scheduling (now + 10 minutes)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10);
    return now.toISOString().slice(0, 16);
  };
  
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Social Media Scheduler
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Schedule posts across multiple social media platforms
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
          <SocialCard>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Create Post
              </Typography>
              
              <TextField
                fullWidth
                label="Post Content"
                placeholder="Share your message across social media platforms..."
                multiline
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                margin="normal"
                disabled={loading}
              />
              
              <FormControl fullWidth margin="normal" disabled={loading}>
                <InputLabel id="platforms-label">Select Platforms</InputLabel>
                <Select
                  labelId="platforms-label"
                  multiple
                  value={selectedPlatforms}
                  onChange={(e) => setSelectedPlatforms(e.target.value as string[])}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const platform = platforms.find(p => p.value === value);
                        return (
                          <Chip 
                            key={value} 
                            label={platform?.label} 
                            sx={{ backgroundColor: platform?.color, color: 'white' }}
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {platforms.map((platform) => (
                    <MenuItem key={platform.value} value={platform.value}>
                      {platform.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Schedule Date and Time"
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: getMinDateTime()
                }}
                disabled={loading}
              />
            </CardContent>
          </SocialCard>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <SocialCard>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Schedule Post
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Platforms:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedPlatforms.length > 0 ? (
                    selectedPlatforms.map((value) => {
                      const platform = platforms.find(p => p.value === value);
                      return (
                        <Chip 
                          key={value} 
                          label={platform?.label} 
                          sx={{ backgroundColor: platform?.color, color: 'white' }}
                        />
                      );
                    })
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No platforms selected
                    </Typography>
                  )}
                </Box>
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2">
                  Token Cost:
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
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                onClick={handleSchedulePost}
                disabled={
                  loading || 
                  !content || 
                  selectedPlatforms.length === 0 || 
                  !scheduledDate || 
                  (tokenBalance !== null && tokenBalance < getTokenCost())
                }
              >
                {loading ? 'Scheduling...' : 'Schedule Post'}
              </Button>
            </CardContent>
          </SocialCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SocialMediaScheduler;
