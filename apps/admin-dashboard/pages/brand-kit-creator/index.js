# Brand Kit Creator Implementation

/**
 * Brand Kit Creator Component
 * 
 * This component provides an automated system for extracting and managing brand identity
 * elements from a website URL, including colors, fonts, logo, and brand voice.
 * 
 * Features:
 * - Automatic extraction of brand elements from website URL
 * - Manual customization options for all brand elements
 * - Brand voice analysis and definition
 * - Secure storage of brand kits in Firestore
 * - Preview of generated content with brand styling
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CircularProgress, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
  Chip,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  ColorLens as ColorLensIcon,
  TextFields as TextFieldsIcon,
  Image as ImageIcon,
  RecordVoiceOver as VoiceIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Link as LinkIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useFirestore, useFirestoreCollectionData, useStorage } from 'reactfire';
import { collection, doc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { SketchPicker } from 'react-color';
import { debounce } from 'lodash';

// Styled components
const ColorBox = styled(Box)(({ bgcolor, theme }) => ({
  width: 40,
  height: 40,
  backgroundColor: bgcolor,
  borderRadius: 4,
  border: `1px solid ${theme.palette.divider}`,
  cursor: 'pointer',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.1)',
  },
}));

const FontPreview = styled(Typography)(({ fontFamily }) => ({
  fontFamily: fontFamily || 'inherit',
  minHeight: 40,
  display: 'flex',
  alignItems: 'center',
}));

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[10],
  },
}));

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`brand-tabpanel-${index}`}
      aria-labelledby={`brand-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

/**
 * Brand Kit Creator Component
 */
const BrandKitCreator = () => {
  const { user } = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const functions = getFunctions();
  const theme = useTheme();
  
  // State variables
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [extractionStatus, setExtractionStatus] = useState('idle');
  const [brandKits, setBrandKits] = useState([]);
  const [selectedBrandKit, setSelectedBrandKit] = useState(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  // Brand kit data
  const [brandData, setBrandData] = useState({
    name: '',
    websiteUrl: '',
    colors: ['#FFFFFF', '#000000', '#4285F4', '#FBBC05'],
    fonts: {
      heading: '',
      body: ''
    },
    logo: null,
    logoUrl: '',
    voice: {
      purpose: '',
      audience: '',
      tone: [],
      emotions: [],
      character: [],
      syntax: [],
      language: []
    },
    createdAt: null,
    updatedAt: null
  });
  
  // Preview content
  const [previewContent, setPreviewContent] = useState({
    heading: 'Your Brand Heading',
    subheading: 'Your Brand Subheading',
    paragraph: 'This is how your content will look with your brand styling applied. The fonts, colors, and overall style reflect your brand identity as defined in your brand kit.',
    ctaText: 'Call to Action'
  });
  
  // Firestore queries
  const brandKitsCollection = collection(firestore, 'brandKits');
  const brandKitsQuery = query(
    brandKitsCollection, 
    where('userId', '==', user?.uid || 'anonymous'),
    orderBy('updatedAt', 'desc')
  );
  
  // Fetch brand kits from Firestore
  const { status: brandKitsStatus, data: brandKitsData } = useFirestoreCollectionData(brandKitsQuery, {
    idField: 'id',
  });
  
  // Update brandKits state when data is fetched
  useEffect(() => {
    if (brandKitsStatus === 'success' && brandKitsData) {
      setBrandKits(brandKitsData);
    }
  }, [brandKitsStatus, brandKitsData]);
  
  // Effect to update loading state
  useEffect(() => {
    if (brandKitsStatus === 'loading') {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [brandKitsStatus]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle website URL change
  const handleWebsiteUrlChange = (e) => {
    setWebsiteUrl(e.target.value);
  };
  
  // Extract brand elements from website
  const extractBrandElements = async () => {
    if (!websiteUrl) {
      setSnackbar({
        open: true,
        message: 'Please enter a website URL',
        severity: 'error'
      });
      return;
    }
    
    try {
      setExtractionStatus('extracting');
      setLoading(true);
      
      // Call Firebase function to extract brand elements
      const extractBrand = httpsCallable(functions, 'extractBrandElements');
      const result = await extractBrand({ url: websiteUrl });
      
      if (result.data.success) {
        // Update brand data with extracted elements
        setBrandData({
          ...brandData,
          name: result.data.name || 'My Brand Kit',
          websiteUrl: websiteUrl,
          colors: result.data.colors || brandData.colors,
          fonts: {
            heading: result.data.fonts?.heading || '',
            body: result.data.fonts?.body || ''
          },
          logoUrl: result.data.logoUrl || '',
          voice: {
            ...brandData.voice,
            purpose: result.data.voice?.purpose || '',
            audience: result.data.voice?.audience || '',
            tone: result.data.voice?.tone || [],
            character: result.data.voice?.character || []
          }
        });
        
        setExtractionStatus('success');
        setSnackbar({
          open: true,
          message: 'Brand elements extracted successfully',
          severity: 'success'
        });
        
        // Move to next step
        setActiveStep(1);
      } else {
        throw new Error(result.data.error || 'Failed to extract brand elements');
      }
    } catch (error) {
      console.error('Error extracting brand elements:', error);
      setExtractionStatus('error');
      setSnackbar({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle brand data change
  const handleBrandDataChange = (field, value) => {
    setBrandData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle nested brand data change
  const handleNestedDataChange = (parent, field, value) => {
    setBrandData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };
  
  // Handle array field change (add/remove items)
  const handleArrayFieldChange = (parent, field, value, action) => {
    if (action === 'add') {
      if (!value || brandData[parent][field].includes(value)) return;
      
      setBrandData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [field]: [...prev[parent][field], value]
        }
      }));
    } else if (action === 'remove') {
      setBrandData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [field]: prev[parent][field].filter(item => item !== value)
        }
      }));
    }
  };
  
  // Handle color change
  const handleColorChange = (color, index) => {
    const newColors = [...brandData.colors];
    newColors[index] = color.hex;
    handleBrandDataChange('colors', newColors);
  };
  
  // Add new color
  const handleAddColor = () => {
    if (brandData.colors.length >= 8) {
      setSnackbar({
        open: true,
        message: 'Maximum 8 colors allowed',
        severity: 'warning'
      });
      return;
    }
    
    handleBrandDataChange('colors', [...brandData.colors, '#CCCCCC']);
  };
  
  // Remove color
  const handleRemoveColor = (index) => {
    if (brandData.colors.length <= 2) {
      setSnackbar({
        open: true,
        message: 'Minimum 2 colors required',
        severity: 'warning'
      });
      return;
    }
    
    const newColors = [...brandData.colors];
    newColors.splice(index, 1);
    handleBrandDataChange('colors', newColors);
  };
  
  // Open color picker
  const handleOpenColorPicker = (index) => {
    setSelectedColorIndex(index);
    setColorPickerOpen(true);
  };
  
  // Close color picker
  const handleCloseColorPicker = () => {
    setColorPickerOpen(false);
    setSelectedColorIndex(null);
  };
  
  // Handle logo upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setSnackbar({
        open: true,
        message: 'Invalid file type. Please upload JPEG, PNG, SVG, or WebP',
        severity: 'error'
      });
      return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setSnackbar({
        open: true,
        message: 'File too large. Maximum size is 2MB',
        severity: 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Upload logo to Firebase Storage
      const storageRef = ref(storage, `brandKits/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Update brand data
      setBrandData(prev => ({
        ...prev,
        logo: file,
        logoUrl: downloadUrl
      }));
      
      setSnackbar({
        open: true,
        message: 'Logo uploaded successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      setSnackbar({
        open: true,
        message: `Error uploading logo: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Save brand kit
  const saveBrandKit = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!brandData.name) {
        throw new Error('Brand name is required');
      }
      
      // Prepare data for Firestore
      const brandKitData = {
        ...brandData,
        userId: user.uid,
        updatedAt: serverTimestamp(),
      };
      
      if (!selectedBrandKit) {
        // Create new brand kit
        brandKitData.createdAt = serverTimestamp();
        const docRef = doc(collection(firestore, 'brandKits'));
        await setDoc(docRef, brandKitData);
        
        setSnackbar({
          open: true,
          message: 'Brand kit created successfully',
          severity: 'success'
        });
      } else {
        // Update existing brand kit
        await updateDoc(doc(firestore, 'brandKits', selectedBrandKit.id), brandKitData);
        
        setSnackbar({
          open: true,
          message: 'Brand kit updated successfully',
          severity: 'success'
        });
      }
      
      // Reset form and go back to list view
      setTabValue(0);
      setSelectedBrandKit(null);
      setBrandData({
        name: '',
        websiteUrl: '',
        colors: ['#FFFFFF', '#000000', '#4285F4', '#FBBC05'],
        fonts: {
          heading: '',
          body: ''
        },
        logo: null,
        logoUrl: '',
        voice: {
          purpose: '',
          audience: '',
          tone: [],
          emotions: [],
          character: [],
          syntax: [],
          language: []
        },
        createdAt: null,
        updatedAt: null
      });
      setActiveStep(0);
    } catch (error) {
      console.error('Error saving brand kit:', error);
      setSnackbar({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Delete brand kit
  const deleteBrandKit = async (id) => {
    try {
      setLoading(true);
      await deleteDoc(doc(firestore, 'brandKits', id));
      
      setSnackbar({
        open: true,
        message: 'Brand kit deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting brand kit:', error);
      setSnackbar({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Edit brand kit
  const editBrandKit = (brandKit) => {
    setSelectedBrandKit(brandKit);
    setBrandData({
      name: brandKit.name || '',
      websiteUrl: brandKit.websiteUrl || '',
      colors: brandKit.colors || ['#FFFFFF', '#000000', '#4285F4', '#FBBC05'],
      fonts: {
        heading: brandKit.fonts?.heading || '',
        body: brandKit.fonts?.body || ''
      },
      logo: null,
      logoUrl: brandKit.logoUrl || '',
      voice: {
        purpose: brandKit.voice?.purpose || '',
        audience: brandKit.voice?.audience || '',
        tone: brandKit.voice?.tone || [],
        emotions: brandKit.voice?.emotions || [],
        character: brandKit.voice?.character || [],
        syntax: brandKit.voice?.syntax || [],
        language: brandKit.voice?.language || []
      },
      createdAt: brandKit.createdAt,
      updatedAt: brandKit.updatedAt
    });
    setTabValue(1);
    setActiveStep(1);
  };
  
  // Create new brand kit
  const createNewBrandKit = () => {
    setSelectedBrandKit(null);
    setBrandData({
      name: '',
      websiteUrl: '',
      colors: ['#FFFFFF', '#000000', '#4285F4', '#FBBC05'],
      fonts: {
        heading: '',
        body: ''
      },
      logo: null,
      logoUrl: '',
      voice: {
        purpose: '',
        audience: '',
        tone: [],
        emotions: [],
        character: [],
        syntax: [],
        language: []
      },
      createdAt: null,
      updatedAt: null
    });
    setWebsiteUrl('');
    setExtractionStatus('idle');
    setTabValue(1);
    setActiveStep(0);
  };
  
  // Handle next step
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  // Generate preview content
  const generatePreviewContent = useCallback(debounce(async () => {
    try {
      // Call Firebase function to generate preview content
      const generateContent = httpsCallable(functions, 'generateBrandedContent');
      const result = await generateContent({ 
        brandKit: brandData,
        contentType: 'preview'
      });
      
      if (result.data.success) {
        setPreviewContent({
          heading: result.data.content.heading || 'Your Brand Heading',
          subheading: result.data.content.subheading || 'Your Brand Subheading',
          paragraph: result.data.content.paragraph || 'This is how your content will look with your brand styling applied.',
          ctaText: result.data.content.ctaText || 'Call to Action'
        });
      }
    } catch (error) {
      console.error('Error generating preview content:', error);
    }
  }, 1000), [brandData]);
  
  // Update preview content when brand data changes
  useEffect(() => {
    if (activeStep === 3) {
      generatePreviewContent();
    }
  }, [activeStep, generatePreviewContent]);
  
  // Open preview dialog
  const handleOpenPreview = () => {
    generatePreviewContent();
    setPreviewDialogOpen(true);
  };
  
  // Close preview dialog
  const handleClosePreview = () => {
    setPreviewDialogOpen(false);
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Steps for the stepper
  const steps = [
    'Extract Brand Elements',
    'Customize Colors & Fonts',
    'Define Brand Voice',
    'Review & Save'
  ];
  
  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Extract Brand Elements from Website
            </Typography>
            <Typography variant="body1" paragraph>
              Enter your website URL and we'll automatically analyze your brand voice, pull your logo, colors, and fonts.
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Website URL"
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={handleWebsiteUrlChange}
                  InputProps={{
                    startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={extractBrandElements}
                  disabled={loading || !websiteUrl}
                  startIcon={extractionStatus === 'extracting' ? <CircularProgress size={20} /> : <RefreshIcon />}
                >
                  {extractionStatus === 'extracting' ? 'Extracting...' : 'Extract Brand Elements'}
                </Button>
              </Grid>
            </Grid>
            
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              Alternatively, you can manually create your brand kit by clicking "Next" and filling in the details.
            </Typography>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 4 }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Brand Information
                </Typography>
                
                <TextField
                  fullWidth
                  label="Brand Name"
                  value={brandData.name}
                  onChange={(e) => handleBrandDataChange('name', e.target.value)}
                  margin="normal"
                  required
                />
                
                <TextField
                  fullWidth
                  label="Website URL"
                  value={brandData.websiteUrl}
                  onChange={(e) => handleBrandDataChange('websiteUrl', e.target.value)}
                  margin="normal"
                />
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Brand Logo
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {brandData.logoUrl ? (
                      <Box sx={{ mr: 2, position: 'relative' }}>
                        <img 
                          src={brandData.logoUrl} 
                          alt="Brand Logo" 
                          style={{ 
                            maxWidth: 100, 
                            maxHeight: 100, 
                            objectFit: 'contain',
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 4,
                            padding: 8
                          }} 
                        />
                        <IconButton 
                          size="small" 
                          sx={{ 
                            position: 'absolute', 
                            top: -10, 
                            right: -10,
                            backgroundColor: theme.palette.background.paper,
                            '&:hover': {
                              backgroundColor: theme.palette.background.default,
                            }
                          }}
                          onClick={() => handleBrandDataChange('logoUrl', '')}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      <Box 
                        sx={{ 
                          width: 100, 
                          height: 100, 
                          border: `1px dashed ${theme.palette.divider}`,
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2
                        }}
                      >
                        <ImageIcon color="disabled" />
                      </Box>
                    )}
                    
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadIcon />}
                    >
                      Upload Logo
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                    </Button>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Brand Colors
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                  {brandData.colors.map((color, index) => (
                    <Box key={index} sx={{ position: 'relative' }}>
                      <ColorBox 
                        bgcolor={color} 
                        onClick={() => handleOpenColorPicker(index)}
                      />
                      {brandData.colors.length > 2 && (
                        <IconButton 
                          size="small" 
                          sx={{ 
                            position: 'absolute', 
                            top: -8, 
                            right: -8,
                            backgroundColor: theme.palette.background.paper,
                            '&:hover': {
                              backgroundColor: theme.palette.background.default,
                            },
                            width: 16,
                            height: 16
                          }}
                          onClick={() => handleRemoveColor(index)}
                        >
                          <CloseIcon fontSize="small" sx={{ fontSize: 12 }} />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                  
                  {brandData.colors.length < 8 && (
                    <Box 
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        border: `1px dashed ${theme.palette.divider}`,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                        }
                      }}
                      onClick={handleAddColor}
                    >
                      <AddIcon fontSize="small" />
                    </Box>
                  )}
                </Box>
                
                <Typography variant="h6" gutterBottom>
                  Brand Fonts
                </Typography>
                
                <TextField
                  fullWidth
                  label="Heading Font"
                  value={brandData.fonts.heading}
                  onChange={(e) => handleNestedDataChange('fonts', 'heading', e.target.value)}
                  margin="normal"
                  placeholder="e.g., Roboto, Arial, sans-serif"
                />
                
                <Box sx={{ mt: 1, mb: 2 }}>
                  <FontPreview 
                    variant="h5" 
                    fontFamily={brandData.fonts.heading}
                  >
                    Heading Font Preview
                  </FontPreview>
                </Box>
                
                <TextField
                  fullWidth
                  label="Body Font"
                  value={brandData.fonts.body}
                  onChange={(e) => handleNestedDataChange('fonts', 'body', e.target.value)}
                  margin="normal"
                  placeholder="e.g., Open Sans, Helvetica, sans-serif"
                />
                
                <Box sx={{ mt: 1 }}>
                  <FontPreview 
                    variant="body1" 
                    fontFamily={brandData.fonts.body}
                  >
                    Body font preview. This is how your regular text will appear.
                  </FontPreview>
                </Box>
              </Grid>
            </Grid>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Define Your Brand Voice
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Brand Purpose"
                  value={brandData.voice.purpose}
                  onChange={(e) => handleNestedDataChange('voice', 'purpose', e.target.value)}
                  margin="normal"
                  multiline
                  rows={2}
                  placeholder="The 'why' of your communication and content"
                />
                
                <TextField
                  fullWidth
                  label="Target Audience"
                  value={brandData.voice.audience}
                  onChange={(e) => handleNestedDataChange('voice', 'audience', e.target.value)}
                  margin="normal"
                  multiline
                  rows={2}
                  placeholder="The primary people you speak to and serve"
                />
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Tone
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    The personality of how your brand sounds and feels
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {brandData.voice.tone.map((tone, index) => (
                      <Chip 
                        key={index}
                        label={tone}
                        onDelete={() => handleArrayFieldChange('voice', 'tone', tone, 'remove')}
                      />
                    ))}
                    
                    <TextField
                      size="small"
                      placeholder="Add tone..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value) {
                          handleArrayFieldChange('voice', 'tone', e.target.value, 'add');
                          e.target.value = '';
                        }
                      }}
                      sx={{ minWidth: 150 }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Emotions
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    The feelings you aim to inspire
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {brandData.voice.emotions.map((emotion, index) => (
                      <Chip 
                        key={index}
                        label={emotion}
                        onDelete={() => handleArrayFieldChange('voice', 'emotions', emotion, 'remove')}
                      />
                    ))}
                    
                    <TextField
                      size="small"
                      placeholder="Add emotion..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value) {
                          handleArrayFieldChange('voice', 'emotions', e.target.value, 'add');
                          e.target.value = '';
                        }
                      }}
                      sx={{ minWidth: 150 }}
                    />
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Character
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    The role your brand takes on in interactions
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {brandData.voice.character.map((character, index) => (
                      <Chip 
                        key={index}
                        label={character}
                        onDelete={() => handleArrayFieldChange('voice', 'character', character, 'remove')}
                      />
                    ))}
                    
                    <TextField
                      size="small"
                      placeholder="Add character trait..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value) {
                          handleArrayFieldChange('voice', 'character', e.target.value, 'add');
                          e.target.value = '';
                        }
                      }}
                      sx={{ minWidth: 150 }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Syntax
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    The structural and stylistic choices that shape your writing
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {brandData.voice.syntax.map((syntax, index) => (
                      <Chip 
                        key={index}
                        label={syntax}
                        onDelete={() => handleArrayFieldChange('voice', 'syntax', syntax, 'remove')}
                      />
                    ))}
                    
                    <TextField
                      size="small"
                      placeholder="Add syntax style..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value) {
                          handleArrayFieldChange('voice', 'syntax', e.target.value, 'add');
                          e.target.value = '';
                        }
                      }}
                      sx={{ minWidth: 150 }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Language
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    The level of complexity, formality, and clarity used
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {brandData.voice.language.map((language, index) => (
                      <Chip 
                        key={index}
                        label={language}
                        onDelete={() => handleArrayFieldChange('voice', 'language', language, 'remove')}
                      />
                    ))}
                    
                    <TextField
                      size="small"
                      placeholder="Add language style..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value) {
                          handleArrayFieldChange('voice', 'language', e.target.value, 'add');
                          e.target.value = '';
                        }
                      }}
                      sx={{ minWidth: 150 }}
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Review Your Brand Kit
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Brand Information
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Brand Name
                    </Typography>
                    <Typography variant="body1">
                      {brandData.name || 'Not specified'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Website
                    </Typography>
                    <Typography variant="body1">
                      {brandData.websiteUrl || 'Not specified'}
                    </Typography>
                  </Box>
                  
                  {brandData.logoUrl && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Logo
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <img 
                          src={brandData.logoUrl} 
                          alt="Brand Logo" 
                          style={{ 
                            maxWidth: 100, 
                            maxHeight: 100, 
                            objectFit: 'contain',
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 4,
                            padding: 8
                          }} 
                        />
                      </Box>
                    </Box>
                  )}
                </Paper>
                
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Brand Voice
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Purpose
                    </Typography>
                    <Typography variant="body1">
                      {brandData.voice.purpose || 'Not specified'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Audience
                    </Typography>
                    <Typography variant="body1">
                      {brandData.voice.audience || 'Not specified'}
                    </Typography>
                  </Box>
                  
                  {brandData.voice.tone.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Tone
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {brandData.voice.tone.map((tone, index) => (
                          <Chip 
                            key={index}
                            label={tone}
                            size="small"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {brandData.voice.emotions.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Emotions
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {brandData.voice.emotions.map((emotion, index) => (
                          <Chip 
                            key={index}
                            label={emotion}
                            size="small"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {brandData.voice.character.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Character
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {brandData.voice.character.map((character, index) => (
                          <Chip 
                            key={index}
                            label={character}
                            size="small"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Brand Colors
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {brandData.colors.map((color, index) => (
                      <Tooltip key={index} title={color}>
                        <ColorBox bgcolor={color} />
                      </Tooltip>
                    ))}
                  </Box>
                </Paper>
                
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Brand Fonts
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Heading Font
                    </Typography>
                    <FontPreview 
                      variant="h5" 
                      fontFamily={brandData.fonts.heading}
                    >
                      {brandData.fonts.heading || 'Not specified'}
                    </FontPreview>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Body Font
                    </Typography>
                    <FontPreview 
                      variant="body1" 
                      fontFamily={brandData.fonts.body}
                    >
                      {brandData.fonts.body || 'Not specified'}
                    </FontPreview>
                  </Box>
                </Paper>
                
                <Paper 
                  sx={{ 
                    p: 3, 
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: theme.shadows[8],
                      transform: 'translateY(-4px)'
                    }
                  }}
                  onClick={handleOpenPreview}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1">
                      Content Preview
                    </Typography>
                    <PreviewIcon />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    Click to see how your content will look with your brand styling applied
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Brand Kit Creator
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="My Brand Kits" />
          <Tab label="Create Brand Kit" />
        </Tabs>
        
        {/* My Brand Kits Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={createNewBrandKit}
            >
              Create New Brand Kit
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {brandKits && brandKits.map((brandKit) => (
                <Grid item xs={12} sm={6} md={4} key={brandKit.id}>
                  <StyledCard>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {brandKit.logoUrl ? (
                          <img 
                            src={brandKit.logoUrl} 
                            alt={brandKit.name} 
                            style={{ 
                              width: 40, 
                              height: 40, 
                              objectFit: 'contain',
                              marginRight: 12
                            }} 
                          />
                        ) : (
                          <ColorLensIcon sx={{ mr: 1.5, color: brandKit.colors?.[0] || 'primary.main' }} />
                        )}
                        <Typography variant="h6" component="div">
                          {brandKit.name}
                        </Typography>
                      </Box>
                      
                      {brandKit.websiteUrl && (
                        <Typography color="text.secondary" gutterBottom>
                          {brandKit.websiteUrl}
                        </Typography>
                      )}
                      
                      <Box sx={{ display: 'flex', gap: 0.5, mb: 2, mt: 1 }}>
                        {brandKit.colors && brandKit.colors.slice(0, 5).map((color, index) => (
                          <ColorBox key={index} bgcolor={color} sx={{ width: 24, height: 24 }} />
                        ))}
                      </Box>
                      
                      {brandKit.voice?.tone && brandKit.voice.tone.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Tone:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {brandKit.voice.tone.slice(0, 3).map((tone, index) => (
                              <Chip 
                                key={index}
                                label={tone}
                                size="small"
                              />
                            ))}
                            {brandKit.voice.tone.length > 3 && (
                              <Chip 
                                label={`+${brandKit.voice.tone.length - 3}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                      )}
                      
                      <Typography variant="body2" color="text.secondary">
                        Last Updated: {brandKit.updatedAt ? new Date(brandKit.updatedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => editBrandKit(brandKit)}
                        >
                          Edit
                        </Button>
                        
                        <Button
                          size="small"
                          color="primary"
                          startIcon={<PreviewIcon />}
                          onClick={() => {
                            editBrandKit(brandKit);
                            handleOpenPreview();
                          }}
                        >
                          Preview
                        </Button>
                        
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => deleteBrandKit(brandKit.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </StyledCard>
                </Grid>
              ))}
              
              {brandKits && brandKits.length === 0 && (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      No Brand Kits Found
                    </Typography>
                    <Typography variant="body1" paragraph>
                      Create your first brand kit to start generating on-brand content.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={createNewBrandKit}
                    >
                      Create New Brand Kit
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </TabPanel>
        
        {/* Create Brand Kit Tab */}
        <TabPanel value={tabValue} index={1}>
          <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {getStepContent(activeStep)}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              color="inherit"
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={saveBrandKit}
                  startIcon={<SaveIcon />}
                  disabled={!brandData.name}
                >
                  {selectedBrandKit ? 'Update Brand Kit' : 'Save Brand Kit'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={activeStep === 0 && extractionStatus === 'extracting'}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </TabPanel>
      </Paper>
      
      {/* Color Picker Dialog */}
      {colorPickerOpen && selectedColorIndex !== null && (
        <Dialog
          open={colorPickerOpen}
          onClose={handleCloseColorPicker}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>
            Choose Color
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <SketchPicker
                color={brandData.colors[selectedColorIndex]}
                onChange={(color) => handleColorChange(color, selectedColorIndex)}
                disableAlpha
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseColorPicker} color="primary">
              Done
            </Button>
          </DialogActions>
        </Dialog>
      )}
      
      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Content Preview with Brand Styling
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            p: 3, 
            backgroundColor: brandData.colors[0] || '#ffffff',
            color: brandData.colors[1] || '#000000',
            borderRadius: 1,
            position: 'relative',
            overflow: 'hidden'
          }}>
            {brandData.logoUrl && (
              <Box sx={{ mb: 3, maxWidth: 120 }}>
                <img 
                  src={brandData.logoUrl} 
                  alt="Brand Logo" 
                  style={{ 
                    maxWidth: '100%', 
                    height: 'auto'
                  }} 
                />
              </Box>
            )}
            
            <Typography 
              variant="h4" 
              gutterBottom
              sx={{ 
                fontFamily: brandData.fonts.heading || 'inherit',
                color: brandData.colors[2] || 'inherit'
              }}
            >
              {previewContent.heading}
            </Typography>
            
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                fontFamily: brandData.fonts.heading || 'inherit',
                color: brandData.colors[1] || 'inherit',
                mb: 3
              }}
            >
              {previewContent.subheading}
            </Typography>
            
            <Typography 
              variant="body1" 
              paragraph
              sx={{ 
                fontFamily: brandData.fonts.body || 'inherit',
                mb: 4
              }}
            >
              {previewContent.paragraph}
            </Typography>
            
            <Button
              variant="contained"
              sx={{
                backgroundColor: brandData.colors[2] || theme.palette.primary.main,
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: brandData.colors[3] || theme.palette.primary.dark,
                }
              }}
            >
              {previewContent.ctaText}
            </Button>
            
            {brandData.colors.length > 3 && (
              <Box 
                sx={{ 
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  backgroundColor: brandData.colors[3],
                  opacity: 0.2,
                  zIndex: 0
                }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BrandKitCreator;
