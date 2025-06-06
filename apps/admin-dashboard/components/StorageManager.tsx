import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  CloudUpload as CloudUploadIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import AssetManager from './AssetManager';
import FolderBrowser from './FolderBrowser';

// Styled components
const StorageCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

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
      id={`storage-tabpanel-${index}`}
      aria-labelledby={`storage-tab-${index}`}
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

interface StorageManagerProps {}

const StorageManager: React.FC<StorageManagerProps> = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Storage Manager
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Upload, organize, and manage your marketing assets
        </Typography>
      </Box>
      
      <StorageCard>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="storage tabs">
              <Tab label="Upload Assets" icon={<CloudUploadIcon />} iconPosition="start" />
              <Tab label="Browse Folders" icon={<FolderIcon />} iconPosition="start" />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            <AssetManager />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <FolderBrowser />
          </TabPanel>
        </CardContent>
      </StorageCard>
    </Box>
  );
};

export default StorageManager;
