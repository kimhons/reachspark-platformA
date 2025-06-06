/**
 * API Management Admin Panel
 * 
 * This component provides a secure, user-friendly interface for managing
 * all external API credentials used by the ReachSpark platform.
 * 
 * Features:
 * - Secure storage and display of API credentials
 * - Role-based access control
 * - Usage monitoring and analytics
 * - Alert logging and visualization
 * - Credential rotation and revocation
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CircularProgress, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useFirestore, useFirestoreCollectionData } from 'reactfire';
import { collection, doc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Line, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

// Styled components
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

const StatusIndicator = styled('div')(({ theme, status }) => ({
  width: 12,
  height: 12,
  borderRadius: '50%',
  backgroundColor: 
    status === 'active' ? theme.palette.success.main :
    status === 'warning' ? theme.palette.warning.main :
    status === 'error' ? theme.palette.error.main :
    theme.palette.grey[400],
  marginRight: theme.spacing(1),
}));

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`api-tabpanel-${index}`}
      aria-labelledby={`api-tab-${index}`}
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
 * API Management Admin Panel Component
 */
const ApiManagementPanel = () => {
  const { user, userRoles } = useAuth();
  const firestore = useFirestore();
  const functions = getFunctions();
  
  // State variables
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedApi, setSelectedApi] = useState(null);
  const [showSecret, setShowSecret] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null, apiId: null });
  const [alertsFilter, setAlertsFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');
  const [editForm, setEditForm] = useState({
    name: '',
    provider: '',
    key: '',
    isActive: true,
    environment: 'production',
    description: '',
    rateLimit: '',
    owner: '',
    expiryDate: '',
  });
  
  // Check if user has admin access
  const hasAdminAccess = userRoles?.includes('admin') || userRoles?.includes('superadmin');
  
  // Firestore queries
  const apiKeysCollection = collection(firestore, 'apiCredentials');
  const apiKeysQuery = query(apiKeysCollection, orderBy('provider'));
  const apiUsageCollection = collection(firestore, 'apiUsageLogs');
  const apiAlertsCollection = collection(firestore, 'apiAlerts');
  
  // Get alerts based on filter
  const alertsQuery = alertsFilter === 'all' 
    ? query(apiAlertsCollection, orderBy('timestamp', 'desc')) 
    : query(apiAlertsCollection, where('severity', '==', alertsFilter), orderBy('timestamp', 'desc'));
  
  // Fetch data from Firestore
  const { status: apiKeysStatus, data: apiKeys } = useFirestoreCollectionData(apiKeysQuery, {
    idField: 'id',
  });
  
  const { status: alertsStatus, data: alerts } = useFirestoreCollectionData(alertsQuery, {
    idField: 'id',
  });
  
  // Get usage data based on time range
  const getTimeRangeFilter = () => {
    const now = new Date();
    switch(timeRange) {
      case '24h':
        return new Date(now.setDate(now.getDate() - 1));
      case '7d':
        return new Date(now.setDate(now.getDate() - 7));
      case '30d':
        return new Date(now.setDate(now.getDate() - 30));
      case '90d':
        return new Date(now.setDate(now.getDate() - 90));
      default:
        return new Date(now.setDate(now.getDate() - 7));
    }
  };
  
  const usageQuery = query(
    apiUsageCollection, 
    where('timestamp', '>=', getTimeRangeFilter()),
    orderBy('timestamp', 'desc')
  );
  
  const { status: usageStatus, data: usageData } = useFirestoreCollectionData(usageQuery, {
    idField: 'id',
  });
  
  // Effect to update loading state
  useEffect(() => {
    if (apiKeysStatus === 'success' && alertsStatus === 'success' && usageStatus === 'success') {
      setLoading(false);
    }
  }, [apiKeysStatus, alertsStatus, usageStatus]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Toggle visibility of API key
  const toggleShowSecret = (id) => {
    setShowSecret(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Open edit dialog for API
  const handleEditApi = (api) => {
    setSelectedApi(api);
    setEditForm({
      name: api.name || '',
      provider: api.provider || '',
      key: api.key || '',
      isActive: api.isActive !== false,
      environment: api.environment || 'production',
      description: api.description || '',
      rateLimit: api.rateLimit || '',
      owner: api.owner || user.email,
      expiryDate: api.expiryDate ? new Date(api.expiryDate.seconds * 1000).toISOString().split('T')[0] : '',
    });
    setEditMode(true);
  };
  
  // Open dialog for adding new API
  const handleAddNewApi = () => {
    setSelectedApi(null);
    setEditForm({
      name: '',
      provider: '',
      key: '',
      isActive: true,
      environment: 'production',
      description: '',
      rateLimit: '',
      owner: user.email,
      expiryDate: '',
    });
    setEditMode(true);
  };
  
  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'isActive' ? checked : value
    }));
  };
  
  // Save API key changes
  const handleSaveApi = async () => {
    try {
      setLoading(true);
      
      // Call Firebase function to encrypt the API key
      const encryptApiKey = httpsCallable(functions, 'encryptApiKey');
      const encryptResult = await encryptApiKey({ key: editForm.key });
      const encryptedKey = encryptResult.data.encryptedKey;
      
      const apiData = {
        name: editForm.name,
        provider: editForm.provider,
        key: encryptedKey,
        isActive: editForm.isActive,
        environment: editForm.environment,
        description: editForm.description,
        rateLimit: editForm.rateLimit ? parseInt(editForm.rateLimit, 10) : null,
        owner: editForm.owner,
        expiryDate: editForm.expiryDate ? new Date(editForm.expiryDate) : null,
        lastUpdated: serverTimestamp(),
        updatedBy: user.email,
      };
      
      if (selectedApi) {
        // Update existing API
        await updateDoc(doc(firestore, 'apiCredentials', selectedApi.id), apiData);
      } else {
        // Add new API
        apiData.createdAt = serverTimestamp();
        apiData.createdBy = user.email;
        await setDoc(doc(collection(firestore, 'apiCredentials')), apiData);
      }
      
      // Test the API key
      const testApiKey = httpsCallable(functions, 'testApiKey');
      await testApiKey({ 
        provider: editForm.provider, 
        key: editForm.key 
      });
      
      setEditMode(false);
      setLoading(false);
    } catch (error) {
      console.error('Error saving API key:', error);
      alert(`Error saving API key: ${error.message}`);
      setLoading(false);
    }
  };
  
  // Open confirmation dialog for API key deletion
  const handleDeleteConfirm = (apiId) => {
    setConfirmDialog({
      open: true,
      action: 'delete',
      apiId
    });
  };
  
  // Open confirmation dialog for API key rotation
  const handleRotateConfirm = (apiId) => {
    setConfirmDialog({
      open: true,
      action: 'rotate',
      apiId
    });
  };
  
  // Handle confirmation dialog actions
  const handleConfirmAction = async () => {
    try {
      setLoading(true);
      
      if (confirmDialog.action === 'delete') {
        await deleteDoc(doc(firestore, 'apiCredentials', confirmDialog.apiId));
      } else if (confirmDialog.action === 'rotate') {
        // Call API key rotation function
        const rotateApiKey = httpsCallable(functions, 'rotateApiKey');
        await rotateApiKey({ apiId: confirmDialog.apiId, newKey: newApiKey });
        setNewApiKey('');
      }
      
      setConfirmDialog({ open: false, action: null, apiId: null });
      setLoading(false);
    } catch (error) {
      console.error(`Error during ${confirmDialog.action} operation:`, error);
      alert(`Error: ${error.message}`);
      setLoading(false);
    }
  };
  
  // Close confirmation dialog
  const handleCloseConfirm = () => {
    setConfirmDialog({ open: false, action: null, apiId: null });
    setNewApiKey('');
  };
  
  // Test API connection
  const handleTestConnection = async (apiId) => {
    try {
      setLoading(true);
      const testApiConnection = httpsCallable(functions, 'testApiConnection');
      const result = await testApiConnection({ apiId });
      
      if (result.data.success) {
        alert(`Connection successful! Response: ${result.data.message}`);
      } else {
        alert(`Connection failed: ${result.data.error}`);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error testing API connection:', error);
      alert(`Error testing connection: ${error.message}`);
      setLoading(false);
    }
  };
  
  // Prepare usage data for charts
  const prepareUsageChartData = () => {
    if (!usageData || usageData.length === 0) return null;
    
    // Group by provider and date
    const groupedByProvider = {};
    const groupedByDate = {};
    
    usageData.forEach(log => {
      const provider = log.provider || 'unknown';
      const date = new Date(log.timestamp.seconds * 1000).toISOString().split('T')[0];
      
      // Group by provider
      if (!groupedByProvider[provider]) {
        groupedByProvider[provider] = 0;
      }
      groupedByProvider[provider]++;
      
      // Group by date
      if (!groupedByDate[date]) {
        groupedByDate[date] = {};
      }
      if (!groupedByDate[date][provider]) {
        groupedByDate[date][provider] = 0;
      }
      groupedByDate[date][provider]++;
    });
    
    // Prepare data for provider distribution chart
    const providerData = {
      labels: Object.keys(groupedByProvider),
      datasets: [
        {
          label: 'API Calls by Provider',
          data: Object.values(groupedByProvider),
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
          ],
          borderWidth: 1,
        },
      ],
    };
    
    // Prepare data for usage over time chart
    const sortedDates = Object.keys(groupedByDate).sort();
    const providers = [...new Set(usageData.map(log => log.provider || 'unknown'))];
    
    const timeSeriesData = {
      labels: sortedDates,
      datasets: providers.map((provider, index) => {
        const colors = [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ];
        
        return {
          label: provider,
          data: sortedDates.map(date => groupedByDate[date][provider] || 0),
          borderColor: colors[index % colors.length].replace('0.6', '1'),
          backgroundColor: colors[index % colors.length],
          tension: 0.4,
        };
      }),
    };
    
    return { providerData, timeSeriesData };
  };
  
  // Prepare alert severity counts for chart
  const prepareAlertChartData = () => {
    if (!alerts || alerts.length === 0) return null;
    
    const severityCounts = {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    };
    
    alerts.forEach(alert => {
      const severity = alert.severity || 'info';
      severityCounts[severity]++;
    });
    
    return {
      labels: Object.keys(severityCounts),
      datasets: [
        {
          label: 'Alerts by Severity',
          data: Object.values(severityCounts),
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(153, 102, 255, 0.6)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };
  
  // Get chart data
  const usageChartData = prepareUsageChartData();
  const alertChartData = prepareAlertChartData();
  
  // Get severity icon
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'info':
        return <InfoIcon color="info" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'critical':
        return <ErrorIcon color="error" sx={{ color: 'darkred' }} />;
      default:
        return <InfoIcon color="info" />;
    }
  };
  
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };
  
  // Check if user has permission to view this panel
  if (!hasAdminAccess) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          Access Denied
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          You do not have permission to access the API Management Panel.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        API Management Admin Panel
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="API Credentials" />
          <Tab label="Usage Analytics" />
          <Tab label="Alerts & Logs" />
        </Tabs>
        
        {/* API Credentials Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddNewApi}
              disabled={loading}
            >
              Add New API Key
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {apiKeys && apiKeys.map((api) => (
                <Grid item xs={12} md={6} lg={4} key={api.id}>
                  <StyledCard>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <StatusIndicator status={api.isActive ? 'active' : 'error'} />
                        <Typography variant="h6" component="div">
                          {api.name}
                        </Typography>
                      </Box>
                      
                      <Typography color="textSecondary" gutterBottom>
                        Provider: {api.provider}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Environment: {api.environment || 'production'}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          API Key:
                        </Typography>
                        <TextField
                          size="small"
                          variant="outlined"
                          value={showSecret[api.id] ? api.key : '••••••••••••••••'}
                          InputProps={{
                            readOnly: true,
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => toggleShowSecret(api.id)}
                                  edge="end"
                                >
                                  {showSecret[api.id] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{ flexGrow: 1 }}
                        />
                      </Box>
                      
                      {api.expiryDate && (
                        <Typography variant="body2" color={
                          new Date(api.expiryDate.seconds * 1000) < new Date() ? 'error' : 
                          new Date(api.expiryDate.seconds * 1000) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'warning.main' : 
                          'textSecondary'
                        }>
                          Expires: {new Date(api.expiryDate.seconds * 1000).toLocaleDateString()}
                        </Typography>
                      )}
                      
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Last Updated: {formatDate(api.lastUpdated)}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditApi(api)}
                        >
                          Edit
                        </Button>
                        
                        <Button
                          size="small"
                          color="secondary"
                          startIcon={<RefreshIcon />}
                          onClick={() => handleRotateConfirm(api.id)}
                        >
                          Rotate
                        </Button>
                        
                        <Button
                          size="small"
                          color="primary"
                          onClick={() => handleTestConnection(api.id)}
                        >
                          Test
                        </Button>
                        
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDeleteConfirm(api.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </StyledCard>
                </Grid>
              ))}
              
              {apiKeys && apiKeys.length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body1" align="center" sx={{ p: 4 }}>
                    No API credentials found. Click "Add New API Key" to create one.
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </TabPanel>
        
        {/* Usage Analytics Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="time-range-label">Time Range</InputLabel>
              <Select
                labelId="time-range-label"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="Time Range"
              >
                <MenuItem value="24h">Last 24 Hours</MenuItem>
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
                <MenuItem value="90d">Last 90 Days</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    API Calls by Provider
                  </Typography>
                  {usageChartData ? (
                    <Bar 
                      data={usageChartData.providerData} 
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                        },
                      }}
                    />
                  ) : (
                    <Typography variant="body1" align="center" sx={{ p: 4 }}>
                      No usage data available for the selected time range.
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    API Usage Over Time
                  </Typography>
                  {usageChartData ? (
                    <Line 
                      data={usageChartData.timeSeriesData} 
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                        },
                        scales: {
                          x: {
                            type: 'time',
                            time: {
                              unit: timeRange === '24h' ? 'hour' : 'day',
                            },
                          },
                        },
                      }}
                    />
                  ) : (
                    <Typography variant="body1" align="center" sx={{ p: 4 }}>
                      No usage data available for the selected time range.
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Recent API Calls
                  </Typography>
                  {usageData && usageData.length > 0 ? (
                    <Box sx={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Timestamp</th>
                            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Provider</th>
                            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Model</th>
                            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Feature</th>
                            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Operation</th>
                            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Status</th>
                            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Input Tokens</th>
                            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>Output Tokens</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usageData.slice(0, 20).map((log) => (
                            <tr key={log.id}>
                              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{formatDate(log.timestamp)}</td>
                              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{log.provider}</td>
                              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{log.model || 'N/A'}</td>
                              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{log.feature}</td>
                              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{log.operation}</td>
                              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                                {log.status === 'success' ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                                    Success
                                  </Box>
                                ) : (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <ErrorIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                                    Error
                                  </Box>
                                )}
                              </td>
                              <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{log.inputTokens || 0}</td>
                              <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ddd' }}>{log.outputTokens || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Box>
                  ) : (
                    <Typography variant="body1" align="center" sx={{ p: 4 }}>
                      No usage data available for the selected time range.
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </TabPanel>
        
        {/* Alerts & Logs Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              API Alerts & Logs
            </Typography>
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="alerts-filter-label">Filter</InputLabel>
              <Select
                labelId="alerts-filter-label"
                value={alertsFilter}
                onChange={(e) => setAlertsFilter(e.target.value)}
                label="Filter"
              >
                <MenuItem value="all">All Alerts</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Alerts by Severity
                  </Typography>
                  {alertChartData ? (
                    <Bar 
                      data={alertChartData} 
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                      }}
                    />
                  ) : (
                    <Typography variant="body1" align="center" sx={{ p: 4 }}>
                      No alert data available.
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Recent Alerts
                  </Typography>
                  {alerts && alerts.length > 0 ? (
                    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                      {alerts.map((alert) => (
                        <Box 
                          key={alert.id} 
                          sx={{ 
                            p: 2, 
                            mb: 1, 
                            borderRadius: 1,
                            backgroundColor: 
                              alert.severity === 'critical' ? 'rgba(244, 67, 54, 0.1)' :
                              alert.severity === 'error' ? 'rgba(244, 67, 54, 0.05)' :
                              alert.severity === 'warning' ? 'rgba(255, 152, 0, 0.05)' :
                              'rgba(33, 150, 243, 0.05)',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {getSeverityIcon(alert.severity)}
                            <Typography variant="subtitle1" sx={{ ml: 1 }}>
                              {alert.title}
                            </Typography>
                            <Typography variant="caption" sx={{ ml: 'auto' }}>
                              {formatDate(alert.timestamp)}
                            </Typography>
                          </Box>
                          
                          <Typography variant="body2">
                            {alert.message}
                          </Typography>
                          
                          {alert.provider && (
                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                              Provider: {alert.provider}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body1" align="center" sx={{ p: 4 }}>
                      No alerts found.
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </TabPanel>
      </Paper>
      
      {/* Edit API Dialog */}
      <Dialog open={editMode} onClose={() => setEditMode(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedApi ? 'Edit API Credentials' : 'Add New API Credentials'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="API Name"
                value={editForm.name}
                onChange={handleFormChange}
                fullWidth
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="provider"
                label="Provider"
                value={editForm.provider}
                onChange={handleFormChange}
                fullWidth
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="key"
                label="API Key"
                value={editForm.key}
                onChange={handleFormChange}
                fullWidth
                required
                type={showSecret.editForm ? 'text' : 'password'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowSecret(prev => ({ ...prev, editForm: !prev.editForm }))}
                        edge="end"
                      >
                        {showSecret.editForm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="environment"
                label="Environment"
                value={editForm.environment}
                onChange={handleFormChange}
                select
                fullWidth
              >
                <MenuItem value="development">Development</MenuItem>
                <MenuItem value="staging">Staging</MenuItem>
                <MenuItem value="production">Production</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="rateLimit"
                label="Rate Limit (calls/min)"
                value={editForm.rateLimit}
                onChange={handleFormChange}
                type="number"
                fullWidth
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="owner"
                label="Owner"
                value={editForm.owner}
                onChange={handleFormChange}
                fullWidth
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="expiryDate"
                label="Expiry Date"
                type="date"
                value={editForm.expiryDate}
                onChange={handleFormChange}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={editForm.description}
                onChange={handleFormChange}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editForm.isActive}
                    onChange={handleFormChange}
                    name="isActive"
                    color="primary"
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMode(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveApi} color="primary" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={handleCloseConfirm}>
        <DialogTitle>
          {confirmDialog.action === 'delete' ? 'Delete API Key' : 'Rotate API Key'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.action === 'delete' 
              ? 'Are you sure you want to delete this API key? This action cannot be undone.'
              : 'Are you sure you want to rotate this API key? The old key will be invalidated.'}
          </DialogContentText>
          
          {confirmDialog.action === 'rotate' && (
            <TextField
              autoFocus
              margin="dense"
              label="New API Key"
              type="password"
              fullWidth
              variant="outlined"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              sx={{ mt: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowSecret(prev => ({ ...prev, newKey: !prev.newKey }))}
                      edge="end"
                    >
                      {showSecret.newKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmAction} 
            color={confirmDialog.action === 'delete' ? 'error' : 'primary'} 
            variant="contained"
            disabled={confirmDialog.action === 'rotate' && !newApiKey}
          >
            {confirmDialog.action === 'delete' ? 'Delete' : 'Rotate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApiManagementPanel;
