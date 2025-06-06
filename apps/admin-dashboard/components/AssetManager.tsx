import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  FileCopy as FileCopyIcon,
  Image as ImageIcon,
  Description as DocumentIcon,
  Movie as VideoIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
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
const UploadCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const DropZone = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'border-color 0.2s ease-in-out, background-color 0.2s ease-in-out',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

// File type icons
const getFileIcon = (contentType: string) => {
  if (contentType.startsWith('image/')) {
    return <ImageIcon />;
  } else if (contentType.startsWith('video/')) {
    return <VideoIcon />;
  } else {
    return <DocumentIcon />;
  }
};

interface AssetManagerProps {}

const AssetManager: React.FC<AssetManagerProps> = () => {
  const { user } = useAuth();
  const [storageService, setStorageService] = useState<StorageService | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Initialize storage service
  useEffect(() => {
    if (user) {
      const service = createStorageService(firebaseConfig);
      setStorageService(service);
      
      // List existing files
      const fetchFiles = async () => {
        try {
          setLoading(true);
          const result = await service.listAllFiles(`users/${user.uid}/assets`);
          
          const filesWithUrls = await Promise.all(
            result.items.map(async (item) => {
              const url = await service.getDownloadUrl(item.fullPath);
              return {
                name: item.name,
                path: item.fullPath,
                url,
                contentType: item.name.endsWith('.jpg') || item.name.endsWith('.jpeg') ? 'image/jpeg' :
                            item.name.endsWith('.png') ? 'image/png' :
                            item.name.endsWith('.gif') ? 'image/gif' :
                            item.name.endsWith('.pdf') ? 'application/pdf' :
                            'application/octet-stream'
              };
            })
          );
          
          setUploadedFiles(filesWithUrls);
        } catch (err: any) {
          console.error('Error fetching files:', err);
          setError(err.message || 'Failed to load files');
        } finally {
          setLoading(false);
        }
      };
      
      fetchFiles();
    }
  }, [user]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files) {
      setFiles(Array.from(event.dataTransfer.files));
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };
  
  const handleUpload = async () => {
    if (!storageService || !user || files.length === 0) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const uploadPromises = files.map(async (file) => {
        const path = `users/${user.uid}/assets/${file.name}`;
        await storageService.uploadFile(path, file);
        const url = await storageService.getDownloadUrl(path);
        
        return {
          name: file.name,
          path,
          url,
          contentType: file.type
        };
      });
      
      const uploadedResults = await Promise.all(uploadPromises);
      
      setUploadedFiles((prev) => [...prev, ...uploadedResults]);
      setSuccess(`Successfully uploaded ${files.length} file(s)!`);
      setFiles([]);
    } catch (err: any) {
      setError(err.message || 'Failed to upload files');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (path: string) => {
    if (!storageService) return;
    
    try {
      await storageService.deleteFile(path);
      setUploadedFiles((prev) => prev.filter((file) => file.path !== path));
      setSuccess('File deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to delete file');
    }
  };
  
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setSuccess('URL copied to clipboard');
  };
  
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Asset Manager
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Upload and manage your marketing assets
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
        <Grid item xs={12} md={5}>
          <UploadCard>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Upload Files
              </Typography>
              
              <DropZone
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                sx={{ mb: 3 }}
              >
                <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" gutterBottom>
                  Drag and drop files here
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  or
                </Typography>
                <Button
                  component="label"
                  variant="contained"
                  sx={{ mt: 2 }}
                  startIcon={<CloudUploadIcon />}
                >
                  Browse Files
                  <VisuallyHiddenInput 
                    type="file" 
                    multiple 
                    onChange={handleFileChange} 
                  />
                </Button>
              </DropZone>
              
              {files.length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Files:
                  </Typography>
                  <List dense>
                    {files.map((file, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={file.name}
                          secondary={`${(file.size / 1024).toFixed(2)} KB`}
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                    onClick={handleUpload}
                    disabled={loading || files.length === 0}
                    sx={{ mt: 2 }}
                  >
                    {loading ? 'Uploading...' : 'Upload Files'}
                  </Button>
                </>
              )}
            </CardContent>
          </UploadCard>
        </Grid>
        
        <Grid item xs={12} md={7}>
          <UploadCard>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Your Assets
              </Typography>
              
              {loading && uploadedFiles.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {uploadedFiles.length > 0 ? (
                    <List>
                      {uploadedFiles.map((file, index) => (
                        <React.Fragment key={file.path}>
                          {index > 0 && <Divider component="li" />}
                          <ListItem>
                            <Box sx={{ mr: 2 }}>
                              {getFileIcon(file.contentType)}
                            </Box>
                            <ListItemText
                              primary={file.name}
                              secondary={
                                file.contentType.startsWith('image/') ? (
                                  <Box 
                                    component="img" 
                                    src={file.url} 
                                    alt={file.name}
                                    sx={{ 
                                      mt: 1, 
                                      maxWidth: '100%', 
                                      maxHeight: 100,
                                      objectFit: 'contain'
                                    }}
                                  />
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    {file.contentType}
                                  </Typography>
                                )
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton 
                                edge="end" 
                                aria-label="copy" 
                                onClick={() => handleCopyUrl(file.url)}
                                sx={{ mr: 1 }}
                              >
                                <FileCopyIcon />
                              </IconButton>
                              <IconButton 
                                edge="end" 
                                aria-label="delete" 
                                onClick={() => handleDelete(file.path)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No assets found. Upload files to get started.
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </UploadCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AssetManager;
