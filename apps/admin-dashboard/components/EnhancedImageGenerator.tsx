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
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Image as ImageIcon,
  Save as SaveIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { createTokenService, TokenService } from '@reachspark/tokens';
import { createStorageService, StorageService } from '@reachspark/storage';

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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`image-tabpanel-${index}`}
      aria-labelledby={`image-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface EnhancedImageGeneratorProps {}

const EnhancedImageGenerator: React.FC<EnhancedImageGeneratorProps> = () => {
  const { user } = useAuth();
  const [tokenService, setTokenService] = useState<TokenService | null>(null);
  const [storageService, setStorageService] = useState<StorageService | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1024x1024');
  const [numImages, setNumImages] = useState(1);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [savedImages, setSavedImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingImage, setSavingImage] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Calculate token cost
  const getTokenCost = () => {
    const sizeObj = imageSizes.find(s => s.value === size);
    return (sizeObj?.tokens || 50) * numImages;
  };
  
  // Initialize services
  useEffect(() => {
    if (user) {
      const tokenSvc = createTokenService(firebaseConfig, user.uid);
      const storageSvc = createStorageService(firebaseConfig);
      
      setTokenService(tokenSvc);
      setStorageService(storageSvc);
      
      // Get token balance
      const fetchTokenBalance = async () => {
        try {
          const balance = await tokenSvc.getTokenBalance(user.uid);
          setTokenBalance(balance);
        } catch (err: any) {
          console.error('Error fetching token balance:', err);
        }
      };
      
      // Get saved images
      const fetchSavedImages = async () => {
        try {
          const result = await storageSvc.listFiles(`users/${user.uid}/generated-images`);
          
          const imagesWithUrls = await Promise.all(
            result.items.map(async (item) => {
              const url = await storageSvc.getDownloadUrl(item.fullPath);
              return {
                name: item.name,
                path: item.fullPath,
                url
              };
            })
          );
          
          setSavedImages(imagesWithUrls);
        } catch (err: any) {
          console.error('Error fetching saved images:', err);
        }
      };
      
      fetchTokenBalance();
      fetchSavedImages();
    }
  }, [user]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
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
        
        // Switch to the generated images tab
        setTabValue(0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveImage = async (imageUrl: string, index: number) => {
    if (!storageService || !user) return;
    
    setSavingImage(index);
    
    try {
      // Fetch the image as a blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Generate a unique filename
      const timestamp = new Date().getTime();
      const filename = `dalle-image-${timestamp}.png`;
      const path = `users/${user.uid}/generated-images/${filename}`;
      
      // Upload to Firebase Storage
      await storageService.uploadFile(path, blob);
      
      // Get the download URL
      const downloadUrl = await storageService.getDownloadUrl(path);
      
      // Add to saved images
      setSavedImages([...savedImages, {
        name: filename,
        path,
        url: downloadUrl
      }]);
      
      setSuccess(`Image saved to your storage!`);
    } catch (err: any) {
      setError(err.message || 'Failed to save image');
    } finally {
      setSavingImage(null);
    }
  };
  
  const handleDeleteSavedImage = async (path: string) => {
    if (!storageService) return;
    
    try {
      await storageService.deleteFile(path);
      setSavedImages(savedImages.filter(img => img.path !== path));
      setSuccess('Image deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to delete image');
    }
  };
  
  // Prompt suggestions
  const promptSuggestions = [
    "A modern marketing dashboard with data visualizations",
    "A professional social media post template for a business",
    "A sleek email newsletter header with abstract shapes",
    "A minimalist logo for a digital marketing agency",
    "A futuristic AI assistant interface with holographic elements"
  ];
  
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          AI Image Generator
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Create custom marketing visuals with DALL-E 3
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
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Suggestions:
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {promptSuggestions.map((suggestion, index) => (
                  <Button 
                    key={index} 
                    variant="outlined" 
                    size="small"
                    onClick={() => setPrompt(suggestion)}
                    sx={{ mb: 1 }}
                  >
                    {suggestion.length > 20 ? suggestion.substring(0, 20) + '...' : suggestion}
                  </Button>
                ))}
              </Box>
              
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
          <Card>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="image tabs">
                  <Tab label="Generated Images" icon={<ImageIcon />} iconPosition="start" />
                  <Tab label="Saved Images" icon={<SaveIcon />} iconPosition="start" />
                </Tabs>
              </Box>
              
              <TabPanel value={tabValue} index={0}>
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
                            <Box sx={{ display: 'flex', gap: 1 }}>
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
                              <Button
                                variant="contained"
                                size="small"
                                fullWidth
                                startIcon={savingImage === index ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                                onClick={() => handleSaveImage(imageUrl, index)}
                                disabled={savingImage !== null}
                              >
                                {savingImage === index ? 'Saving...' : 'Save Image'}
                              </Button>
                            </Box>
                          </CardContent>
                        </ImageCard>
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Box sx={{ textAlign: 'center', p: 3 }}>
                        {loading ? (
                          <CircularProgress />
                        ) : (
                          <>
                            <ImageIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="body1" color="text.secondary">
                              Enter a prompt and click "Generate Image" to create AI-generated images
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </TabPanel>
              
              <TabPanel value={tabValue} index={1}>
                <Grid container spacing={2}>
                  {savedImages.length > 0 ? (
                    savedImages.map((image, index) => (
                      <Grid item xs={12} sm={6} md={4} key={image.path}>
                        <ImageCard>
                          <ImagePreview>
                            <GeneratedImage src={image.url} alt={image.name} />
                          </ImagePreview>
                          <CardContent>
                            <Typography variant="subtitle2" gutterBottom noWrap>
                              {image.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button 
                                variant="outlined" 
                                size="small" 
                                fullWidth
                                component="a"
                                href={image.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Open
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                fullWidth
                                onClick={() => handleDeleteSavedImage(image.path)}
                              >
                                Delete
                              </Button>
                            </Box>
                          </CardContent>
                        </ImageCard>
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Box sx={{ textAlign: 'center', p: 3 }}>
                        <SaveIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                          No saved images yet. Generate and save images to see them here.
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedImageGenerator;
