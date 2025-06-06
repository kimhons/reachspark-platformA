import { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, Button, Chip, LinearProgress, Card, CardContent, IconButton, Tooltip, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Token as TokenIcon,
  People as PeopleIcon,
  Campaign as CampaignIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
import dynamic from 'next/dynamic';
import { useAuth } from '../../context/AuthContext';

// Dynamically import charts to avoid SSR issues
const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

// Styled components
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

const GlassCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  backdropFilter: 'blur(10px)',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const ChartCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const TokenProgressWrapper = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1),
}));

const Dashboard = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTokens: 0,
    tokensUsed: 0,
    campaigns: 0,
    activeCampaigns: 0,
    content: 0,
    publishedContent: 0,
  });
  
  // Simulated data for charts
  const [chartData, setChartData] = useState({
    userGrowth: [],
    tokenUsage: [],
    campaignPerformance: [],
    contentEngagement: [],
  });
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Simulate API call with timeout
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulated data
        setStats({
          totalUsers: 1254,
          activeUsers: 876,
          totalTokens: 125000,
          tokensUsed: 78500,
          campaigns: 45,
          activeCampaigns: 12,
          content: 230,
          publishedContent: 187,
        });
        
        // Simulated chart data
        setChartData({
          userGrowth: [
            { name: 'Total Users', data: [150, 220, 310, 480, 650, 820, 950, 1050, 1150, 1254] },
            { name: 'Active Users', data: [120, 170, 250, 320, 450, 580, 680, 750, 810, 876] },
          ],
          tokenUsage: [
            { name: 'Tokens Used', data: [5000, 12000, 25000, 35000, 48000, 59000, 68000, 78500] },
          ],
          campaignPerformance: [
            { name: 'Social Media', data: [30, 40, 45, 50, 49, 60, 70, 91] },
            { name: 'Email', data: [20, 30, 40, 35, 45, 40, 50, 60] },
            { name: 'Ads', data: [10, 15, 20, 25, 30, 35, 40, 45] },
          ],
          contentEngagement: [
            { name: 'Blog Posts', data: [44, 55, 57, 56, 61, 58, 63, 60, 66] },
            { name: 'Social Posts', data: [76, 85, 101, 98, 87, 105, 91, 114, 94] },
            { name: 'Email Content', data: [35, 41, 36, 26, 45, 48, 52, 53, 41] },
          ],
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Chart options
  const userGrowthOptions = {
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
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
    },
    tooltip: {
      x: {
        format: 'MMM',
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 90, 100],
      },
    },
    colors: ['#4F46E5', '#10B981'],
  };
  
  const tokenUsageOptions = {
    chart: {
      type: 'bar',
      toolbar: {
        show: false,
      },
      fontFamily: 'Inter, sans-serif',
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '60%',
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
    },
    colors: ['#4F46E5'],
  };
  
  const campaignPerformanceOptions = {
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
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
    },
    colors: ['#4F46E5', '#10B981', '#F59E0B'],
  };
  
  const contentEngagementOptions = {
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: {
        show: false,
      },
      fontFamily: 'Inter, sans-serif',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 4,
        columnWidth: '60%',
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    },
    colors: ['#4F46E5', '#10B981', '#F59E0B'],
  };
  
  // Calculate token usage percentage
  const tokenUsagePercentage = stats.totalTokens > 0 
    ? Math.round((stats.tokensUsed / stats.totalTokens) * 100) 
    : 0;
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Dashboard Overview
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<RefreshIcon />}
          onClick={() => setLoading(true)}
          sx={{ borderRadius: 2 }}
        >
          Refresh Data
        </Button>
      </Box>
      
      {loading ? (
        <LinearProgress sx={{ mb: 4 }} />
      ) : (
        <>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Users
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold" sx={{ my: 1 }}>
                      {stats.totalUsers.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip 
                        icon={<ArrowUpwardIcon fontSize="small" />} 
                        label="12% ↑" 
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
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Active Users
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {stats.activeUsers.toLocaleString()} ({Math.round((stats.activeUsers / stats.totalUsers) * 100)}%)
                  </Typography>
                </Box>
              </StatsCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Token Usage
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold" sx={{ my: 1 }}>
                      {stats.tokensUsed.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip 
                        icon={<ArrowUpwardIcon fontSize="small" />} 
                        label="8% ↑" 
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
                    bgcolor: 'secondary.light',
                    color: 'secondary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <TokenIcon />
                  </Box>
                </Box>
                <TokenProgressWrapper>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Tokens
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {tokenUsagePercentage}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={tokenUsagePercentage} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: 'background.paper',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        bgcolor: 'secondary.main',
                      }
                    }}
                  />
                </TokenProgressWrapper>
                <Typography variant="caption" color="text.secondary">
                  {stats.totalTokens.toLocaleString()} total tokens available
                </Typography>
              </StatsCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Campaigns
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold" sx={{ my: 1 }}>
                      {stats.campaigns}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip 
                        icon={<ArrowUpwardIcon fontSize="small" />} 
                        label="5% ↑" 
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
                    <CampaignIcon />
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Active Campaigns
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {stats.activeCampaigns} ({Math.round((stats.activeCampaigns / stats.campaigns) * 100)}%)
                  </Typography>
                </Box>
              </StatsCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Content
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold" sx={{ my: 1 }}>
                      {stats.content}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip 
                        icon={<ArrowUpwardIcon fontSize="small" />} 
                        label="15% ↑" 
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
                    <ArticleIcon />
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Published
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {stats.publishedContent} ({Math.round((stats.publishedContent / stats.content) * 100)}%)
                  </Typography>
                </Box>
              </StatsCard>
            </Grid>
          </Grid>
          
          {/* Charts */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ChartCard>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="medium">
                    User Growth
                  </Typography>
                  <Tooltip title="More options">
                    <IconButton size="small">
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ height: 300 }}>
                  <ApexChart
                    options={userGrowthOptions}
                    series={chartData.userGrowth}
                    type="area"
                    height="100%"
                  />
                </Box>
              </ChartCard>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <ChartCard>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="medium">
                    Token Usage
                  </Typography>
                  <Tooltip title="More options">
                    <IconButton size="small">
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ height: 300 }}>
                  <ApexChart
                    options={tokenUsageOptions}
                    series={chartData.tokenUsage}
                    type="bar"
                    height="100%"
                  />
                </Box>
              </ChartCard>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <ChartCard>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="medium">
                    Campaign Performance
                  </Typography>
                  <Tooltip title="More options">
                    <IconButton size="small">
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ height: 300 }}>
                  <ApexChart
                    options={campaignPerformanceOptions}
                    series={chartData.campaignPerformance}
                    type="line"
                    height="100%"
                  />
                </Box>
              </ChartCard>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <ChartCard>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="medium">
                    Content Engagement
                  </Typography>
                  <Tooltip title="More options">
                    <IconButton size="small">
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ height: 300 }}>
                  <ApexChart
                    options={contentEngagementOptions}
                    series={chartData.contentEngagement}
                    type="bar"
                    height="100%"
                  />
                </Box>
              </ChartCard>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Dashboard;
