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
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  FileCopy as FileCopyIcon,
  Image as ImageIcon,
  Description as DocumentIcon,
  Movie as VideoIcon,
  Folder as FolderIcon,
  CreateNewFolder as CreateNewFolderIcon
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
const FolderCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  cursor: 'pointer',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const FolderIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.contrastText,
  borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
}));

interface FolderBrowserProps {}

const FolderBrowser: React.FC<FolderBrowserProps> = () => {
  const { user } = useAuth();
  const [storageService, setStorageService] = useState<StorageService | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [folders, setFolders] = useState<string[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Initialize storage service
  useEffect(() => {
    if (user) {
      const service = createStorageService(firebaseConfig);
      setStorageService(service);
      
      // Set initial path to user's assets folder
      const initialPath = `users/${user.uid}/assets`;
      setCurrentPath(initialPath);
    }
  }, [user]);
  
  // Load folders and files when path changes
  useEffect(() => {
    if (!storageService || !currentPath) return;
    
    const fetchFoldersAndFiles = async () => {
      try {
        setLoading(true);
        
        // In Firebase Storage, folders are virtual and don't actually exist as objects
        // We need to list all files and infer folders from their paths
        const result = await storageService.listAllFiles(currentPath);
        
        // Extract folders from file paths
        const folderSet = new Set<string>();
        result.prefixes.forEach(prefix => {
          const folderName = prefix.fullPath.split('/').pop();
          if (folderName) {
            folderSet.add(folderName);
          }
        });
        
        // Get file details
        const filesWithUrls = await Promise.all(
          result.items.map(async (item) => {
            const url = await storageService.getDownloadUrl(item.fullPath);
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
        
        setFolders(Array.from(folderSet));
        setFiles(filesWithUrls);
      } catch (err: any) {
        console.error('Error fetching folders and files:', err);
        setError(err.message || 'Failed to load folders and files');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFoldersAndFiles();
  }, [storageService, currentPath]);
  
  const handleNavigateToFolder = (folderName: string) => {
    setCurrentPath(`${currentPath}/${folderName}`);
  };
  
  const handleNavigateUp = () => {
    const pathParts = currentPath.split('/');
    if (pathParts.length > 3) { // Don't go above user's assets folder
      pathParts.pop();
      setCurrentPath(pathParts.join('/'));
    }
  };
  
  const handleCreateFolder = async () => {
    if (!storageService || !newFolderName) return;
    
    try {
      // In Firebase Storage, folders are created by uploading a placeholder file
      const placeholderPath = `${currentPath}/${newFolderName}/.placeholder`;
      const placeholderBlob = new Blob([''], { type: 'text/plain' });
      await storageService.uploadFile(placeholderPath, placeholderBlob);
      
      // Add the new folder to the list
      setFolders([...folders, newFolderName]);
      setSuccess(`Folder "${newFolderName}" created successfully`);
      setNewFolderDialogOpen(false);
      setNewFolderName('');
    } catch (err: any) {
      setError(err.message || 'Failed to create folder');
    }
  };
  
  const handleDeleteFile = async (path: string) => {
    if (!storageService) return;
    
    try {
      await storageService.deleteFile(path);
      setFiles(files.filter(file => file.path !== path));
      setSuccess('File deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to delete file');
    }
  };
  
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setSuccess('URL copied to clipboard');
  };
  
  // Get breadcrumbs from current path
  const getBreadcrumbs = () => {
    const pathParts = currentPath.split('/');
    return pathParts.map((part, index) => {
      const path = pathParts.slice(0, index + 1).join('/');
      return { name: part, path };
    });
  };
  
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Storage Browser
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Browse and manage your files and folders
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
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button 
                variant="outlined" 
                onClick={handleNavigateUp}
                disabled={currentPath.split('/').length <= 3}
                sx={{ mr: 2 }}
              >
                Up
              </Button>
              
              <Typography variant="body1">
                {getBreadcrumbs().map((crumb, index) => (
                  <React.Fragment key={crumb.path}>
                    {index > 0 && ' / '}
                    <Box component="span" sx={{ fontWeight: index === getBreadcrumbs().length - 1 ? 'bold' : 'normal' }}>
                      {crumb.name}
                    </Box>
                  </React.Fragment>
                ))}
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              startIcon={<CreateNewFolderIcon />}
              onClick={() => setNewFolderDialogOpen(true)}
            >
              New Folder
            </Button>
          </Box>
        </CardContent>
      </Card>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {folders.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Folders
              </Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {folders.map((folder) => (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={folder}>
                    <FolderCard onClick={() => handleNavigateToFolder(folder)}>
                      <FolderIcon>
                        <FolderIcon fontSize="large" />
                      </FolderIcon>
                      <CardContent sx={{ flexGrow: 1, p: 2 }}>
                        <Typography variant="body2" noWrap>
                          {folder}
                        </Typography>
                      </CardContent>
                    </FolderCard>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
          
          {files.length > 0 ? (
            <>
              <Typography variant="h6" gutterBottom>
                Files
              </Typography>
              <List>
                {files.map((file) => (
                  <React.Fragment key={file.path}>
                    <ListItem>
                      <Box sx={{ mr: 2 }}>
                        {file.contentType.startsWith('image/') ? (
                          <ImageIcon color="primary" />
                        ) : file.contentType.startsWith('video/') ? (
                          <VideoIcon color="secondary" />
                        ) : (
                          <DocumentIcon color="action" />
                        )}
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
                          onClick={() => handleDeleteFile(file.path)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </>
          ) : folders.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                This folder is empty.
              </Typography>
            </Box>
          ) : null}
        </>
      )}
      
      {/* New Folder Dialog */}
      <Dialog open={newFolderDialogOpen} onClose={() => setNewFolderDialogOpen(false)}>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewFolderDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateFolder} 
            variant="contained"
            disabled={!newFolderName}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FolderBrowser;
