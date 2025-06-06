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
  InputAdornment,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Image as ImageIcon } from '@mui/icons-material';
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
const ImageCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

const ImagePreview = styled(Box)(({ theme }) => ({
  width: '100%',
  height: 300,
  backgroundColor: theme.palette.grey[100],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
}));

const GeneratedImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
});

const imageSizes = [
  {
    value: '256x256',
    label: '256x256',
    tokens: 15
  },
  {
    value: '512x512',
    label: '512x512',
    tokens: 25
  },
  {
    value: '1024x1024',
    label: '1024x1024',
    tokens: 50
  }
];

interface ImageGeneratorProps {}

const ImageGenerator: React.FC<ImageGeneratorProps> = () => {
  const { user } = useAuth();
  const [tokenService, setTokenService] = useState<TokenService | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1024x1024');
  const [numImages, setNumImages] = useState(1);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Calculate token cost
  const getTokenCost = () => {
    const sizeObj = imageSizes.find(s => s.value === size);
    return (sizeObj?.tokens || 50) * numImages;
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
  
  const handleGenerateImage = async () => {
    if (!tokenService || !user || !prompt) return;
    
    const tokenCost = getTokenCost();
    
    if (tokenBalance !== null && tokenBalance < tokenCost) {
      setError(`Not enough tokens. This operation requires ${tokenCost} tokens, but you only have ${tokenBalance}.`);
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    setGeneratedImages([]);
    
    try {
      const result = await tokenService.generateImage(prompt, size, numImages);
      
      if (result.success) {
        setGeneratedImages(result.images);
        setSuccess(`Successfully generated ${numImages} image${numImages > 1 ? 's' : ''}!`);
        setTokenBalance(result.remainingTokens);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          AI Image Generator
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Generate AI images using DALL-E 3
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
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Generate Image
              </Typography>
              
              <TextField
                fullWidth
                label="Image Description"
                placeholder="A futuristic marketing dashboard with holographic displays"
                multiline
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                margin="normal"
                disabled={loading}
              />
              
              <TextField
                select
                fullWidth
                label="Image Size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                margin="normal"
                disabled={loading}
              >
                {imageSizes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label} ({option.tokens} tokens)
                  </MenuItem>
                ))}
              </TextField>
              
              <TextField
                fullWidth
                label="Number of Images"
                type="number"
                value={numImages}
                onChange={(e) => setNumImages(Math.max(1, Math.min(4, parseInt(e.target.value) || 1)))}
                margin="normal"
                inputProps={{ min: 1, max: 4 }}
                disabled={loading}
                helperText="Generate up to 4 images at once"
              />
              
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
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ImageIcon />}
                onClick={handleGenerateImage}
                disabled={loading || !prompt || (tokenBalance !== null && tokenBalance < getTokenCost())}
              >
                {loading ? 'Generating...' : 'Generate Image'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {generatedImages.length > 0 ? (
              generatedImages.map((imageUrl, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <ImageCard>
                    <ImagePreview>
                      <GeneratedImage src={imageUrl} alt={`Generated image ${index + 1}`} />
                    </ImagePreview>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Image {index + 1}
                      </Typography>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        fullWidth
                        component="a"
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open Full Size
                      </Button>
                    </CardContent>
                  </ImageCard>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <ImageCard>
                  <ImagePreview>
                    {loading ? (
                      <CircularProgress />
                    ) : (
                      <Box sx={{ textAlign: 'center', p: 3 }}>
                        <ImageIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                          Enter a prompt and click "Generate Image" to create AI-generated images
                        </Typography>
                      </Box>
                    )}
                  </ImagePreview>
                </ImageCard>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ImageGenerator;
