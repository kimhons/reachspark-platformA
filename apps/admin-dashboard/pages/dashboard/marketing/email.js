import { useState } from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, Tabs, Tab, TextField, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Divider, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
  Analytics as AnalyticsIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon,
  Visibility as VisibilityIcon,
  Token as TokenIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import DashboardLayout from '../../components/DashboardLayout';
import dynamic from 'next/dynamic';

// Dynamically import charts to avoid SSR issues
const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

// Styled components
const EmailCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
  },
}));

const StatsCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
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

const StatusChip = styled(Chip)(({ theme, status }) => ({
  borderRadius: theme.shape.borderRadius,
  fontWeight: 500,
  ...(status === 'sent' && {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.dark,
  }),
  ...(status === 'scheduled' && {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.dark,
  }),
  ...(status === 'draft' && {
    backgroundColor: theme.palette.info.light,
    color: theme.palette.info.dark,
  }),
}));

// Sample email campaigns
const initialCampaigns = [
  {
    id: 1,
    name: 'October Newsletter',
    subject: 'Your October Newsletter: Latest Updates and Tips',
    content: '<h1>October Newsletter</h1><p>Hello {{name}},</p><p>We hope you\'re having a great month! Here are the latest updates and tips from ReachSpark.</p><h2>New Features</h2><p>We\'ve added several new features to help you boost your marketing efforts:</p><ul><li>AI-powered content suggestions</li><li>Enhanced analytics dashboard</li><li>Improved social media integration</li></ul><p>Check out our <a href="#">blog</a> for more details.</p><p>Best regards,<br>The ReachSpark Team</p>',
    status: 'sent',
    sendDate: '2023-10-15T14:30:00Z',
    recipients: 1250,
    opens: 875,
    clicks: 320,
    unsubscribes: 5,
    tokenCost: 50,
  },
  {
    id: 2,
    name: 'Black Friday Promotion',
    subject: 'Exclusive Black Friday Deals Inside!',
    content: '<h1>Black Friday Deals</h1><p>Hello {{name}},</p><p>Get ready for our biggest sale of the year! This Black Friday, we\'re offering exclusive deals on all our plans.</p><h2>Limited Time Offers</h2><p>For a limited time only:</p><ul><li>50% off Pro Plan</li><li>30% off Enterprise Plan</li><li>Free 1-month trial for new users</li></ul><p>Don\'t miss out! These offers expire on November 27th.</p><p>Best regards,<br>The ReachSpark Team</p>',
    status: 'scheduled',
    sendDate: '2023-11-20T10:00:00Z',
    recipients: 2500,
    tokenCost: 75,
  },
  {
    id: 3,
    name: 'Welcome Series - Email 1',
    subject: 'Welcome to ReachSpark! Here\'s how to get started',
    content: '<h1>Welcome to ReachSpark!</h1><p>Hello {{name}},</p><p>We\'re thrilled to have you on board! Here\'s how to get started with ReachSpark and make the most of our platform.</p><h2>Quick Start Guide</h2><ol><li>Set up your profile</li><li>Connect your social media accounts</li><li>Create your first campaign</li><li>Explore our AI-powered tools</li></ol><p>If you need any help, our support team is always here for you.</p><p>Best regards,<br>The ReachSpark Team</p>',
    status: 'draft',
    recipients: 0,
    tokenCost: 40,
  },
  {
    id: 4,
    name: 'Product Update Announcement',
    subject: 'Exciting New Features Just Released!',
    content: '<h1>New Features Alert!</h1><p>Hello {{name}},</p><p>We\'re excited to announce several new features that will help you take your marketing to the next level!</p><h2>What\'s New</h2><ul><li>AI Image Generation: Create stunning visuals with our new AI tool</li><li>Advanced Analytics: Get deeper insights into your campaign performance</li><li>Improved Email Editor: More templates and customization options</li></ul><p>Log in to your account to try these new features today!</p><p>Best regards,<br>The ReachSpark Team</p>',
    status: 'sent',
    sendDate: '2023-10-05T09:15:00Z',
    recipients: 1850,
    opens: 1200,
    clicks: 450,
    unsubscribes: 3,
    tokenCost: 60,
  },
];

// Sample subscriber lists
const subscriberLists = [
  {
    id: 1,
    name: 'All Subscribers',
    count: 2500,
    description: 'All active subscribers',
  },
  {
    id: 2,
    name: 'Newsletter Subscribers',
    count: 1800,
    description: 'Users who opted in for the newsletter',
  },
  {
    id: 3,
    name: 'Product Updates',
    count: 2100,
    description: 'Users interested in product updates',
  },
  {
    id: 4,
    name: 'New Users',
    count: 450,
    description: 'Users who signed up in the last 30 days',
  },
];

const EmailMarketing = () => {
  const [tabValue, setTabValue] = useState(0);
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [openCampaignDialog, setOpenCampaignDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  // Chart data
  const emailPerformanceData = {
    series: [
      {
        name: 'Open Rate',
        data: [68, 72, 65, 74, 70, 72, 69],
      },
      {
        name: 'Click Rate',
        data: [28, 32, 25, 34, 30, 32, 29],
      },
    ],
    options: {
      chart: {
        type: 'line',
        toolbar: {
          show: false,
        },
        fontFamily: 'Inter, sans-serif',
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: 2,
        curve: 'smooth',
      },
      xaxis: {
        categories: ['Sep 1', 'Sep 15', 'Oct 1', 'Oct 15', 'Nov 1', 'Nov 15', 'Dec 1'],
      },
      yaxis: {
        labels: {
          formatter: function(val) {
            return val + '%';
          },
        },
      },
      colors: ['#4F46E5', '#10B981'],
      legend: {
        position: 'top',
      },
    },
  };
  
  const subscriberGrowthData = {
    series: [
      {
        name: 'Subscribers',
        data: [1200, 1350, 1500, 1750, 1950, 2200, 2500],
      },
    ],
    options: {
      chart: {
        type: 'area',
        toolbar: {
          show: false,
        },
        fontFamily: 'Inter, sans-serif',
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        width: 2,
      },
      xaxis: {
        categories: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      },
      colors: ['#4F46E5'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2,
          stops: [0, 90, 100],
        },
      },
    },
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Open dialog for creating new campaign
  const handleAddCampaign = () => {
    setSelectedCampaign({
      id: campaigns.length + 1,
      name: '',
      subject: '',
      content: '',
      status: 'draft',
      recipients: 0,
      tokenCost: 40,
    });
    setEditMode(true);
    setOpenCampaignDialog(true);
  };
  
  // Open dialog for editing campaign
  const handleEditCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setEditMode(true);
    setOpenCampaignDialog(true);
  };
  
  // Open dialog for viewing campaign
  const handleViewCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setEditMode(false);
    setOpenCampaignDialog(true);
  };
  
  // Handle dialog close
  const handleCloseCampaignDialog = () => {
    setOpenCampaignDialog(false);
    setSelectedCampaign(null);
    setEditMode(false);
  };
  
  // Handle form input change
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setSelectedCampaign(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Update token cost based on content length and recipients
    if (name === 'content') {
      const contentLength = value.length;
      const baseTokenCost = 40;
      const additionalCost = Math.floor(contentLength / 500) * 5;
      setSelectedCampaign(prev => ({
        ...prev,
        tokenCost: baseTokenCost + additionalCost,
      }));
    }
  };
  
  // Handle save campaign
  const handleSaveCampaign = () => {
    if (selectedCampaign.id > campaigns.length) {
      // Add new campaign
      setCampaigns(prev => [...prev, selectedCampaign]);
    } else {
      // Update existing campaign
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === selectedCampaign.id ? selectedCampaign : campaign
      ));
    }
    handleCloseCampaignDialog();
  };
  
  // Handle delete campaign
  const handleDeleteCampaign = (campaignId) => {
    setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    
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
            Email Marketing
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddCampaign}
            sx={{ borderRadius: 2 }}
          >
            Create Campaign
          </Button>
        </Box>
        
        {/* Tabs */}
        <Box sx={{ mb: 4 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              mb: 3,
              '& .MuiTab-root': {
                minWidth: 120,
                borderRadius: 2,
                mx: 0.5,
              },
              '& .Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'primary.main',
              },
            }}
          >
            <Tab label="Overview" />
            <Tab label="Campaigns" />
            <Tab label="Subscribers" />
            <Tab label="Templates" />
          </Tabs>
          
          {/* Tab content */}
          <Box role="tabpanel" hidden={tabValue !== 0}>
            {tabValue === 0 && (
              <Box>
                {/* Stats cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Total Subscribers
                          </Typography>
                          <Typography variant="h4" component="div" fontWeight="bold" sx={{ my: 1 }}>
                            2,500
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip 
                              icon={<ArrowUpwardIcon fontSize="small" />} 
                              label="14% ↑" 
                              size="small" 
                              color="success"
                              sx={{ borderRadius: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              vs last month
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
                          <PeopleIcon />
                        </Box>
                      </Box>
                    </StatsCard>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Avg. Open Rate
                          </Typography>
                          <Typography variant="h4" component="div" fontWeight="bold" sx={{ my: 1 }}>
                            70.2%
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip 
                              icon={<ArrowUpwardIcon fontSize="small" />} 
                              label="2.5% ↑" 
                              size="small" 
                              color="success"
                              sx={{ borderRadius: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              vs last month
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ 
                          p: 1.5, 
                          borderRadius: '50%', 
                          bgcolor: 'success.light',
                          color: 'success.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <VisibilityIcon />
                        </Box>
                      </Box>
                    </StatsCard>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Avg. Click Rate
                          </Typography>
                          <Typography variant="h4" component="div" fontWeight="bold" sx={{ my: 1 }}>
                            28.6%
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip 
                              icon={<ArrowUpwardIcon fontSize="small" />} 
                              label="1.8% ↑" 
                              size="small" 
                              color="success"
                              sx={{ borderRadius: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              vs last month
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ 
                          p: 1.5, 
                          borderRadius: '50%', 
                          bgcolor: 'info.light',
                          color: 'info.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <BarChartIcon />
                        </Box>
                      </Box>
                    </StatsCard>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Campaigns Sent
                          </Typography>
                          <Typography variant="h4" component="div" fontWeight="bold" sx={{ my: 1 }}>
                            12
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip 
                              icon={<ArrowUpwardIcon fontSize="small" />} 
                              label="20% ↑" 
                              size="small" 
                              color="success"
                              sx={{ borderRadius: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              vs last month
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ 
                          p: 1.5, 
                          borderRadius: '50%', 
                          bgcolor: 'warning.light',
                          color: 'warning.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <EmailIcon />
                        </Box>
                      </Box>
                    </StatsCard>
                  </Grid>
                </Grid>
                
                {/* Charts */}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                      <CardContent>
                        <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                          Email Performance
                        </Typography>
                        <Box sx={{ height: 300 }}>
                          <ApexChart
                            options={emailPerformanceData.options}
                            series={emailPerformanceData.series}
                            type="line"
                            height="100%"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                      <CardContent>
                        <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                          Subscriber Growth
                        </Typography>
                        <Box sx={{ height: 300 }}>
                          <ApexChart
                            options={subscriberGrowthData.options}
                            series={subscriberGrowthData.series}
                            type="area"
                            height="100%"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                {/* Recent campaigns */}
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h5" component="h2" fontWeight="bold" sx={{ mb: 3 }}>
                    Recent Campaigns
                  </Typography>
                  
                  <Grid container spacing={3}>
                    {campaigns.slice(0, 3).map(campaign => (
                      <Grid item xs={12} md={4} key={campaign.id}>
                        <EmailCard>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Typography variant="h6" fontWeight="medium">
                                {campaign.name}
                              </Typography>
                              <StatusChip 
                                label={campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                                status={campaign.status}
                                size="small"
                                icon={campaign.status === 'scheduled' ? <ScheduleIcon fontSize="small" /> : null}
                              />
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Subject: {campaign.subject}
                            </Typography>
                            
                            <Divider sx={{ my: 2 }} />
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Recipients
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {campaign.recipients.toLocaleString()}
                              </Typography>
                            </Box>
                            
                            {campaign.status === 'sent' && (
                              <>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Open Rate
                                  </Typography>
                                  <Typography variant="body2" fontWeight="medium">
                                    {Math.round((campaign.opens / campaign.recipients) * 100)}%
                                  </Typography>
                                </Box>
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Click Rate
                                  </Typography>
                                  <Typography variant="body2" fontWeight="medium">
                                    {Math.round((campaign.clicks / campaign.recipients) * 100)}%
                                  </Typography>
                                </Box>
                              </>
                            )}
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                {campaign.status === 'sent' ? 'Sent' : campaign.status === 'scheduled' ? 'Scheduled' : 'Created'}
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {formatDate(campaign.sendDate)}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                              <TokenIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                              <Typography variant="body2" color="text.secondary">
                                {campaign.tokenCost} tokens
                              </Typography>
                            </Box>
                          </CardContent>
                          
                          <Box sx={{ p: 2, pt: 0, mt: 'auto' }}>
                            <Button 
                              variant="outlined" 
                              fullWidth
                              onClick={() => handleViewCampaign(campaign)}
                              sx={{ borderRadius: 2 }}
                            >
                              View Details
                            </Button>
                          </Box>
                        </EmailCard>
                      </Grid>
                    ))}
                  </Grid>
                  
                  <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Button 
                      variant="outlined"
                      onClick={() => setTabValue(1)}
                    >
                      View All Campaigns
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
          
          <Box role="tabpanel" hidden={tabValue !== 1}>
            {tabValue === 1 && (
              <Box>
                <Grid container spacing={3}>
                  {campaigns.map(campaign => (
                    <Grid item xs={12} md={4} key={campaign.id}>
                      <EmailCard>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Typography variant="h6" fontWeight="medium">
                              {campaign.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <StatusChip 
                                label={campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                                status={campaign.status}
                                size="small"
                                icon={campaign.status === 'scheduled' ? <ScheduleIcon fontSize="small" /> : null}
                              />
                            </Box>
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Subject: {campaign.subject}
                          </Typography>
                          
                          <Divider sx={{ my: 2 }} />
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Recipients
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {campaign.recipients.toLocaleString()}
                            </Typography>
                          </Box>
                          
                          {campaign.status === 'sent' && (
                            <>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Open Rate
                                </Typography>
                                <Typography variant="body2" fontWeight="medium">
                                  {Math.round((campaign.opens / campaign.recipients) * 100)}%
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Click Rate
                                </Typography>
                                <Typography variant="body2" fontWeight="medium">
                                  {Math.round((campaign.clicks / campaign.recipients) * 100)}%
                                </Typography>
                              </Box>
                            </>
                          )}
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {campaign.status === 'sent' ? 'Sent' : campaign.status === 'scheduled' ? 'Scheduled' : 'Created'}
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {formatDate(campaign.sendDate)}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                            <TokenIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                            <Typography variant="body2" color="text.secondary">
                              {campaign.tokenCost} tokens
                            </Typography>
                          </Box>
                        </CardContent>
                        
                        <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                          <Button 
                            variant="outlined" 
                            fullWidth
                            onClick={() => handleViewCampaign(campaign)}
                            sx={{ borderRadius: 2 }}
                          >
                            View
                          </Button>
                          <Button 
                            variant="outlined" 
                            color="secondary"
                            fullWidth
                            onClick={() => handleEditCampaign(campaign)}
                            sx={{ borderRadius: 2 }}
                            disabled={campaign.status === 'sent'}
                          >
                            Edit
                          </Button>
                          <IconButton 
                            color="error"
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            disabled={campaign.status === 'sent'}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </EmailCard>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
          
          <Box role="tabpanel" hidden={tabValue !== 2}>
            {tabValue === 2 && (
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                      <CardContent>
                        <Typography variant="h6" fontWeight="medium" sx={{ mb: 3 }}>
                          Subscriber Lists
                        </Typography>
                        
                        {subscriberLists.map(list => (
                          <Box 
                            key={list.id} 
                            sx={{ 
                              p: 2, 
                              mb: 2, 
                              borderRadius: 2, 
                              border: '1px solid', 
                              borderColor: 'divider',
                              '&:hover': {
                                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {list.name}
                              </Typography>
                              <Chip 
                                label={`${list.count.toLocaleString()} subscribers`}
                                size="small"
                                color="primary"
                                sx={{ borderRadius: 1 }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {list.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                              <Button 
                                variant="outlined" 
                                size="small"
                                startIcon={<VisibilityIcon />}
                                sx={{ borderRadius: 2 }}
                              >
                                View
                              </Button>
                              <Button 
                                variant="outlined" 
                                size="small"
                                startIcon={<EditIcon />}
                                sx={{ borderRadius: 2 }}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outlined" 
                                size="small"
                                startIcon={<SendIcon />}
                                sx={{ borderRadius: 2 }}
                              >
                                Send Campaign
                              </Button>
                            </Box>
                          </Box>
                        ))}
                        
                        <Button 
                          variant="contained" 
                          startIcon={<AddIcon />}
                          sx={{ mt: 2, borderRadius: 2 }}
                        >
                          Create New List
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', mb: 3 }}>
                      <CardContent>
                        <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                          Import Subscribers
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Import subscribers from a CSV file or by connecting to external services.
                        </Typography>
                        <Button 
                          variant="outlined" 
                          fullWidth
                          sx={{ borderRadius: 2, mb: 2 }}
                        >
                          Upload CSV
                        </Button>
                        <Button 
                          variant="outlined" 
                          fullWidth
                          sx={{ borderRadius: 2 }}
                        >
                          Connect Service
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                      <CardContent>
                        <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                          Subscriber Growth
                        </Typography>
                        <Box sx={{ height: 200 }}>
                          <ApexChart
                            options={subscriberGrowthData.options}
                            series={subscriberGrowthData.series}
                            type="area"
                            height="100%"
                          />
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            New This Month
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            300
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Unsubscribed
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            12
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Growth Rate
                          </Typography>
                          <Typography variant="body2" fontWeight="medium" color="success.main">
                            +13.8%
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
          
          <Box role="tabpanel" hidden={tabValue !== 3}>
            {tabValue === 3 && (
              <Box>
                <Typography variant="h5" component="h2" fontWeight="bold" sx={{ mb: 3 }}>
                  Email Templates
                </Typography>
                
                <Grid container spacing={3}>
                  {/* Template cards */}
                  <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                      <Box 
                        component="img"
                        src="https://source.unsplash.com/random/600x400/?email,newsletter"
                        alt="Newsletter template"
                        sx={{ 
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                        }}
                      />
                      <CardContent>
                        <Typography variant="h6" fontWeight="medium">
                          Newsletter
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          A clean, modern newsletter template with sections for featured content, articles, and updates.
                        </Typography>
                        <Button 
                          variant="outlined" 
                          fullWidth
                          sx={{ borderRadius: 2 }}
                        >
                          Use Template
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                      <Box 
                        component="img"
                        src="https://source.unsplash.com/random/600x400/?email,promotion"
                        alt="Promotional template"
                        sx={{ 
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                        }}
                      />
                      <CardContent>
                        <Typography variant="h6" fontWeight="medium">
                          Promotional
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          A bold, attention-grabbing template perfect for sales, special offers, and product launches.
                        </Typography>
                        <Button 
                          variant="outlined" 
                          fullWidth
                          sx={{ borderRadius: 2 }}
                        >
                          Use Template
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                      <Box 
                        component="img"
                        src="https://source.unsplash.com/random/600x400/?email,welcome"
                        alt="Welcome template"
                        sx={{ 
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                        }}
                      />
                      <CardContent>
                        <Typography variant="h6" fontWeight="medium">
                          Welcome Series
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          A friendly, informative template for welcoming new subscribers and introducing your brand.
                        </Typography>
                        <Button 
                          variant="outlined" 
                          fullWidth
                          sx={{ borderRadius: 2 }}
                        >
                          Use Template
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                      <Box 
                        component="img"
                        src="https://source.unsplash.com/random/600x400/?email,announcement"
                        alt="Announcement template"
                        sx={{ 
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                        }}
                      />
                      <CardContent>
                        <Typography variant="h6" fontWeight="medium">
                          Announcement
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          A simple, focused template for announcing new features, updates, or important news.
                        </Typography>
                        <Button 
                          variant="outlined" 
                          fullWidth
                          sx={{ borderRadius: 2 }}
                        >
                          Use Template
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                      <Box 
                        component="img"
                        src="https://source.unsplash.com/random/600x400/?email,event"
                        alt="Event template"
                        sx={{ 
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                        }}
                      />
                      <CardContent>
                        <Typography variant="h6" fontWeight="medium">
                          Event Invitation
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          An elegant template for inviting subscribers to webinars, workshops, or other events.
                        </Typography>
                        <Button 
                          variant="outlined" 
                          fullWidth
                          sx={{ borderRadius: 2 }}
                        >
                          Use Template
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ 
                      borderRadius: 3, 
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      p: 3,
                      border: '2px dashed',
                      borderColor: 'divider',
                    }}>
                      <AddIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                      <Typography variant="h6" fontWeight="medium" sx={{ mb: 1 }}>
                        Create Custom Template
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                        Design your own email template from scratch or import an existing one.
                      </Typography>
                      <Button 
                        variant="contained" 
                        sx={{ borderRadius: 2 }}
                      >
                        Create New
                      </Button>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        </Box>
        
        {/* Campaign dialog */}
        <Dialog open={openCampaignDialog} onClose={handleCloseCampaignDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editMode ? (selectedCampaign?.id > campaigns.length ? 'Create New Campaign' : 'Edit Campaign') : 'Campaign Details'}
          </DialogTitle>
          <DialogContent dividers>
            {selectedCampaign && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Campaign Name"
                    name="name"
                    value={selectedCampaign.name}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subject Line"
                    name="subject"
                    value={selectedCampaign.subject}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Content (HTML)"
                    name="content"
                    value={selectedCampaign.content}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                    multiline
                    rows={10}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={selectedCampaign.status}
                      onChange={handleInputChange}
                      disabled={!editMode || selectedCampaign.status === 'sent'}
                      label="Status"
                    >
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="scheduled">Scheduled</MenuItem>
                      {selectedCampaign.status === 'sent' && (
                        <MenuItem value="sent">Sent</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Grid>
                
                {(selectedCampaign.status === 'scheduled' || selectedCampaign.status === 'sent') && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={selectedCampaign.status === 'scheduled' ? 'Schedule Date' : 'Send Date'}
                      name="sendDate"
                      type="datetime-local"
                      value={selectedCampaign.sendDate ? new Date(selectedCampaign.sendDate).toISOString().slice(0, 16) : ''}
                      onChange={handleInputChange}
                      disabled={!editMode || selectedCampaign.status === 'sent'}
                      variant="outlined"
                      margin="normal"
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Recipients"
                    name="recipients"
                    type="number"
                    value={selectedCampaign.recipients}
                    onChange={handleInputChange}
                    disabled={!editMode || selectedCampaign.status === 'sent'}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 4 }}>
                    <TokenIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      Token Cost: {selectedCampaign.tokenCost} tokens
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Token cost is calculated based on content length and number of recipients.
                  </Typography>
                </Grid>
                
                {selectedCampaign.status === 'sent' && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Performance Metrics
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Opens
                        </Typography>
                        <Typography variant="h6" fontWeight="medium">
                          {selectedCampaign.opens || 0} ({Math.round((selectedCampaign.opens / selectedCampaign.recipients) * 100)}%)
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Clicks
                        </Typography>
                        <Typography variant="h6" fontWeight="medium">
                          {selectedCampaign.clicks || 0} ({Math.round((selectedCampaign.clicks / selectedCampaign.recipients) * 100)}%)
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Unsubscribes
                        </Typography>
                        <Typography variant="h6" fontWeight="medium">
                          {selectedCampaign.unsubscribes || 0} ({Math.round((selectedCampaign.unsubscribes / selectedCampaign.recipients) * 100)}%)
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Sent Date
                        </Typography>
                        <Typography variant="h6" fontWeight="medium">
                          {formatDate(selectedCampaign.sendDate)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCampaignDialog}>
              {editMode ? 'Cancel' : 'Close'}
            </Button>
            {editMode && (
              <Button onClick={handleSaveCampaign} variant="contained" color="primary">
                {selectedCampaign?.id > campaigns.length ? 'Create Campaign' : 'Save Changes'}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default EmailMarketing;
