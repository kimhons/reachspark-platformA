import { useState } from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, Tabs, Tab, TextField, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
  Schedule as ScheduleIcon,
  Analytics as AnalyticsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Token as TokenIcon
} from '@mui/icons-material';
import DashboardLayout from '../../components/DashboardLayout';

// Styled components
const SocialCard = styled(Card)(({ theme }) => ({
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

const SocialHeader = styled(Box)(({ theme, platform }) => ({
  padding: theme.spacing(2),
  backgroundColor: 
    platform === 'facebook' ? 'rgba(66, 103, 178, 0.1)' : 
    platform === 'twitter' ? 'rgba(29, 161, 242, 0.1)' : 
    platform === 'instagram' ? 'rgba(225, 48, 108, 0.1)' : 
    platform === 'linkedin' ? 'rgba(0, 119, 181, 0.1)' : 
    theme.palette.grey[100],
  color: 
    platform === 'facebook' ? '#4267B2' : 
    platform === 'twitter' ? '#1DA1F2' : 
    platform === 'instagram' ? '#E1306C' : 
    platform === 'linkedin' ? '#0077B5' : 
    theme.palette.text.primary,
  borderTopLeftRadius: theme.shape.borderRadius * 2,
  borderTopRightRadius: theme.shape.borderRadius * 2,
  display: 'flex',
  alignItems: 'center',
}));

const SocialIcon = styled(Box)(({ theme, platform }) => ({
  width: 40,
  height: 40,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: theme.spacing(2),
  backgroundColor: 
    platform === 'facebook' ? '#4267B2' : 
    platform === 'twitter' ? '#1DA1F2' : 
    platform === 'instagram' ? '#E1306C' : 
    platform === 'linkedin' ? '#0077B5' : 
    theme.palette.grey[300],
  color: '#FFFFFF',
}));

const PostCard = styled(Card)(({ theme, status }) => ({
  borderRadius: theme.shape.borderRadius * 1.5,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  marginBottom: theme.spacing(2),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '4px',
    height: '100%',
    backgroundColor: 
      status === 'published' ? theme.palette.success.main : 
      status === 'scheduled' ? theme.palette.warning.main : 
      status === 'draft' ? theme.palette.info.main : 
      theme.palette.grey[300],
  },
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  borderRadius: theme.shape.borderRadius,
  fontWeight: 500,
  ...(status === 'published' && {
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

const PlatformChip = styled(Chip)(({ theme, platform }) => ({
  borderRadius: theme.shape.borderRadius,
  fontWeight: 500,
  ...(platform === 'facebook' && {
    backgroundColor: 'rgba(66, 103, 178, 0.1)',
    color: '#4267B2',
  }),
  ...(platform === 'twitter' && {
    backgroundColor: 'rgba(29, 161, 242, 0.1)',
    color: '#1DA1F2',
  }),
  ...(platform === 'instagram' && {
    backgroundColor: 'rgba(225, 48, 108, 0.1)',
    color: '#E1306C',
  }),
  ...(platform === 'linkedin' && {
    backgroundColor: 'rgba(0, 119, 181, 0.1)',
    color: '#0077B5',
  }),
}));

// Sample social media accounts
const socialAccounts = [
  {
    id: 1,
    platform: 'facebook',
    name: 'ReachSpark',
    username: 'reachsparkapp',
    followers: 12500,
    engagement: 3.2,
    connected: true,
  },
  {
    id: 2,
    platform: 'twitter',
    name: 'ReachSpark',
    username: 'reachspark',
    followers: 8700,
    engagement: 2.8,
    connected: true,
  },
  {
    id: 3,
    platform: 'instagram',
    name: 'ReachSpark',
    username: 'reachspark_app',
    followers: 15300,
    engagement: 4.5,
    connected: true,
  },
  {
    id: 4,
    platform: 'linkedin',
    name: 'ReachSpark',
    username: 'reachspark',
    followers: 5200,
    engagement: 2.1,
    connected: false,
  },
];

// Sample social media posts
const initialPosts = [
  {
    id: 1,
    content: 'Exciting news! We just launched our new AI-powered marketing platform. Check it out at reachspark.com #MarketingAI #DigitalMarketing',
    platforms: ['twitter', 'facebook', 'linkedin'],
    status: 'published',
    publishDate: '2023-10-15T14:30:00Z',
    likes: 45,
    comments: 12,
    shares: 8,
    impressions: 1250,
    image: 'https://source.unsplash.com/random/600x400/?marketing',
    tokenCost: 25,
  },
  {
    id: 2,
    content: 'Looking to boost your social media presence? Our AI can help you create engaging content in seconds! #ContentCreation #SocialMedia',
    platforms: ['twitter', 'instagram'],
    status: 'scheduled',
    publishDate: '2023-10-20T10:00:00Z',
    image: 'https://source.unsplash.com/random/600x400/?social',
    tokenCost: 20,
  },
  {
    id: 3,
    content: 'Did you know that businesses using AI for marketing see a 40% increase in productivity? Learn how ReachSpark can help your business grow.',
    platforms: ['facebook', 'linkedin'],
    status: 'draft',
    tokenCost: 15,
  },
  {
    id: 4,
    content: 'Join our webinar next week to learn how to leverage AI for your marketing campaigns. Register now at reachspark.com/webinar',
    platforms: ['twitter', 'facebook', 'linkedin', 'instagram'],
    status: 'published',
    publishDate: '2023-10-12T09:15:00Z',
    likes: 78,
    comments: 23,
    shares: 15,
    impressions: 2300,
    image: 'https://source.unsplash.com/random/600x400/?webinar',
    tokenCost: 30,
  },
];

const SocialMediaManagement = () => {
  const [tabValue, setTabValue] = useState(0);
  const [posts, setPosts] = useState(initialPosts);
  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [openConnectDialog, setOpenConnectDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Open dialog for creating new post
  const handleAddPost = () => {
    setSelectedPost({
      id: posts.length + 1,
      content: '',
      platforms: [],
      status: 'draft',
      tokenCost: 15,
    });
    setEditMode(true);
    setOpenPostDialog(true);
  };
  
  // Open dialog for editing post
  const handleEditPost = (post) => {
    setSelectedPost(post);
    setEditMode(true);
    setOpenPostDialog(true);
  };
  
  // Open dialog for viewing post
  const handleViewPost = (post) => {
    setSelectedPost(post);
    setEditMode(false);
    setOpenPostDialog(true);
  };
  
  // Open dialog for connecting social account
  const handleConnectAccount = (platform) => {
    setSelectedPlatform(platform);
    setOpenConnectDialog(true);
  };
  
  // Handle dialog close
  const handleClosePostDialog = () => {
    setOpenPostDialog(false);
    setSelectedPost(null);
    setEditMode(false);
  };
  
  // Handle connect dialog close
  const handleCloseConnectDialog = () => {
    setOpenConnectDialog(false);
    setSelectedPlatform(null);
  };
  
  // Handle form input change
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setSelectedPost(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Handle platform selection
  const handlePlatformChange = (event) => {
    setSelectedPost(prev => ({
      ...prev,
      platforms: event.target.value,
    }));
    
    // Update token cost based on number of platforms
    const platformCount = event.target.value.length;
    setSelectedPost(prev => ({
      ...prev,
      tokenCost: 15 + (platformCount * 5),
    }));
  };
  
  // Handle save post
  const handleSavePost = () => {
    if (selectedPost.id > posts.length) {
      // Add new post
      setPosts(prev => [...prev, selectedPost]);
    } else {
      // Update existing post
      setPosts(prev => prev.map(post => 
        post.id === selectedPost.id ? selectedPost : post
      ));
    }
    handleClosePostDialog();
  };
  
  // Handle delete post
  const handleDeletePost = (postId) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };
  
  // Handle connect account
  const handleConnectSocialAccount = () => {
    // In a real app, this would handle OAuth flow
    // For now, we'll just simulate connecting the account
    const updatedAccounts = socialAccounts.map(account => {
      if (account.platform === selectedPlatform) {
        return { ...account, connected: true };
      }
      return account;
    });
    
    // Update the accounts (in a real app, this would be in state)
    // For this demo, we'll just close the dialog
    handleCloseConnectDialog();
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
  
  // Get platform icon
  const getPlatformIcon = (platform, size = 'small') => {
    switch (platform) {
      case 'facebook':
        return <FacebookIcon fontSize={size} />;
      case 'twitter':
        return <TwitterIcon fontSize={size} />;
      case 'instagram':
        return <InstagramIcon fontSize={size} />;
      case 'linkedin':
        return <LinkedInIcon fontSize={size} />;
      default:
        return null;
    }
  };
  
  return (
    <DashboardLayout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Social Media Management
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddPost}
            sx={{ borderRadius: 2 }}
          >
            Create Post
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
            <Tab label="Posts" />
            <Tab label="Accounts" />
            <Tab label="Analytics" />
          </Tabs>
          
          {/* Tab content */}
          <Box role="tabpanel" hidden={tabValue !== 0}>
            {tabValue === 0 && (
              <Grid container spacing={3}>
                {/* Social account cards */}
                {socialAccounts.map(account => (
                  <Grid item xs={12} sm={6} md={3} key={account.id}>
                    <SocialCard>
                      <SocialHeader platform={account.platform}>
                        <SocialIcon platform={account.platform}>
                          {getPlatformIcon(account.platform)}
                        </SocialIcon>
                        <Typography variant="h6" fontWeight="medium">
                          {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}
                        </Typography>
                      </SocialHeader>
                      <CardContent>
                        {account.connected ? (
                          <>
                            <Typography variant="body1" fontWeight="medium" sx={{ mb: 1 }}>
                              {account.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              @{account.username}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Followers
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {account.followers.toLocaleString()}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">
                                Engagement
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {account.engagement}%
                              </Typography>
                            </Box>
                          </>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                              Connect your {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)} account
                            </Typography>
                            <Button 
                              variant="outlined" 
                              onClick={() => handleConnectAccount(account.platform)}
                              sx={{ borderRadius: 2 }}
                            >
                              Connect
                            </Button>
                          </Box>
                        )}
                      </CardContent>
                    </SocialCard>
                  </Grid>
                ))}
                
                {/* Recent posts */}
                <Grid item xs={12} sx={{ mt: 3 }}>
                  <Typography variant="h5" component="h2" fontWeight="bold" sx={{ mb: 3 }}>
                    Recent Posts
                  </Typography>
                  
                  {posts.slice(0, 3).map(post => (
                    <PostCard key={post.id} status={post.status}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {post.platforms.map(platform => (
                              <PlatformChip 
                                key={platform}
                                icon={getPlatformIcon(platform)}
                                label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                                platform={platform}
                                size="small"
                              />
                            ))}
                          </Box>
                          <StatusChip 
                            label={post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                            status={post.status}
                            size="small"
                            icon={post.status === 'scheduled' ? <ScheduleIcon fontSize="small" /> : null}
                          />
                        </Box>
                        
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {post.content}
                        </Typography>
                        
                        {post.image && (
                          <Box 
                            component="img"
                            src={post.image}
                            alt="Post image"
                            sx={{ 
                              width: '100%',
                              height: 200,
                              objectFit: 'cover',
                              borderRadius: 2,
                              mb: 2
                            }}
                          />
                        )}
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <TokenIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                            <Typography variant="body2" color="text.secondary">
                              {post.tokenCost} tokens
                            </Typography>
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary">
                            {post.status === 'published' ? 'Published' : post.status === 'scheduled' ? 'Scheduled for' : 'Last edited'}: {formatDate(post.publishDate)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </PostCard>
                  ))}
                  
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Button 
                      variant="outlined"
                      onClick={() => setTabValue(1)}
                    >
                      View All Posts
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            )}
          </Box>
          
          <Box role="tabpanel" hidden={tabValue !== 1}>
            {tabValue === 1 && (
              <Box>
                {posts.map(post => (
                  <PostCard key={post.id} status={post.status}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {post.platforms.map(platform => (
                            <PlatformChip 
                              key={platform}
                              icon={getPlatformIcon(platform)}
                              label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                              platform={platform}
                              size="small"
                            />
                          ))}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <StatusChip 
                            label={post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                            status={post.status}
                            size="small"
                            icon={post.status === 'scheduled' ? <ScheduleIcon fontSize="small" /> : null}
                          />
                          <IconButton size="small" onClick={() => handleViewPost(post)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleEditPost(post)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeletePost(post.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {post.content}
                      </Typography>
                      
                      {post.image && (
                        <Box 
                          component="img"
                          src={post.image}
                          alt="Post image"
                          sx={{ 
                            width: '100%',
                            height: 200,
                            objectFit: 'cover',
                            borderRadius: 2,
                            mb: 2
                          }}
                        />
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TokenIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                          <Typography variant="body2" color="text.secondary">
                            {post.tokenCost} tokens
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary">
                          {post.status === 'published' ? 'Published' : post.status === 'scheduled' ? 'Scheduled for' : 'Last edited'}: {formatDate(post.publishDate)}
                        </Typography>
                      </Box>
                      
                      {post.status === 'published' && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Performance
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={3}>
                              <Typography variant="body2" color="text.secondary">
                                Likes
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {post.likes}
                              </Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="body2" color="text.secondary">
                                Comments
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {post.comments}
                              </Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="body2" color="text.secondary">
                                Shares
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {post.shares}
                              </Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="body2" color="text.secondary">
                                Impressions
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {post.impressions}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      )}
                    </CardContent>
                  </PostCard>
                ))}
              </Box>
            )}
          </Box>
          
          <Box role="tabpanel" hidden={tabValue !== 2}>
            {tabValue === 2 && (
              <Grid container spacing={3}>
                {socialAccounts.map(account => (
                  <Grid item xs={12} sm={6} key={account.id}>
                    <SocialCard>
                      <SocialHeader platform={account.platform}>
                        <SocialIcon platform={account.platform}>
                          {getPlatformIcon(account.platform)}
                        </SocialIcon>
                        <Typography variant="h6" fontWeight="medium">
                          {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}
                        </Typography>
                      </SocialHeader>
                      <CardContent>
                        {account.connected ? (
                          <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                              <Box>
                                <Typography variant="h6" fontWeight="medium">
                                  {account.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  @{account.username}
                                </Typography>
                              </Box>
                              <Chip 
                                label="Connected" 
                                color="success"
                                size="small"
                              />
                            </Box>
                            
                            <Divider sx={{ mb: 3 }} />
                            
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Followers
                                </Typography>
                                <Typography variant="h6" fontWeight="medium">
                                  {account.followers.toLocaleString()}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Engagement Rate
                                </Typography>
                                <Typography variant="h6" fontWeight="medium">
                                  {account.engagement}%
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Posts
                                </Typography>
                                <Typography variant="h6" fontWeight="medium">
                                  {Math.floor(Math.random() * 100) + 50}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Avg. Reach
                                </Typography>
                                <Typography variant="h6" fontWeight="medium">
                                  {Math.floor(account.followers * (Math.random() * 0.3 + 0.1)).toLocaleString()}
                                </Typography>
                              </Grid>
                            </Grid>
                            
                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                              <Button 
                                variant="outlined" 
                                color="primary"
                                startIcon={<AnalyticsIcon />}
                              >
                                View Analytics
                              </Button>
                              <Button 
                                variant="outlined" 
                                color="error"
                                startIcon={<VisibilityOffIcon />}
                              >
                                Disconnect
                              </Button>
                            </Box>
                          </>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                              Not Connected
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                              Connect your {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)} account to manage posts and view analytics.
                            </Typography>
                            <Button 
                              variant="contained" 
                              onClick={() => handleConnectAccount(account.platform)}
                              sx={{ borderRadius: 2 }}
                            >
                              Connect Account
                            </Button>
                          </Box>
                        )}
                      </CardContent>
                    </SocialCard>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
          
          <Box role="tabpanel" hidden={tabValue !== 3}>
            {tabValue === 3 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <AnalyticsIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Analytics Dashboard Coming Soon
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
                  We're working on a comprehensive analytics dashboard to help you track your social media performance across all platforms.
                </Typography>
                <Button variant="contained">
                  Get Notified When Ready
                </Button>
              </Box>
            )}
          </Box>
        </Box>
        
        {/* Post dialog */}
        <Dialog open={openPostDialog} onClose={handleClosePostDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editMode ? (selectedPost?.id > posts.length ? 'Create New Post' : 'Edit Post') : 'View Post'}
          </DialogTitle>
          <DialogContent dividers>
            {selectedPost && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Post Content"
                    name="content"
                    value={selectedPost.content}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                    multiline
                    rows={4}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Platforms</InputLabel>
                    <Select
                      multiple
                      name="platforms"
                      value={selectedPost.platforms}
                      onChange={handlePlatformChange}
                      disabled={!editMode}
                      label="Platforms"
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <PlatformChip 
                              key={value}
                              label={value.charAt(0).toUpperCase() + value.slice(1)}
                              platform={value}
                              size="small"
                              icon={getPlatformIcon(value)}
                            />
                          ))}
                        </Box>
                      )}
                    >
                      <MenuItem value="facebook">Facebook</MenuItem>
                      <MenuItem value="twitter">Twitter</MenuItem>
                      <MenuItem value="instagram">Instagram</MenuItem>
                      <MenuItem value="linkedin">LinkedIn</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={selectedPost.status}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      label="Status"
                    >
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="scheduled">Scheduled</MenuItem>
                      <MenuItem value="published">Published</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {(selectedPost.status === 'scheduled' || selectedPost.status === 'published') && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={selectedPost.status === 'scheduled' ? 'Schedule Date' : 'Publish Date'}
                      name="publishDate"
                      type="datetime-local"
                      value={selectedPost.publishDate ? new Date(selectedPost.publishDate).toISOString().slice(0, 16) : ''}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      variant="outlined"
                      margin="normal"
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Image URL"
                    name="image"
                    value={selectedPost.image || ''}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                    placeholder="https://example.com/image.jpg"
                  />
                </Grid>
                
                {selectedPost.image && (
                  <Grid item xs={12}>
                    <Box 
                      component="img"
                      src={selectedPost.image}
                      alt="Post image"
                      sx={{ 
                        width: '100%',
                        height: 300,
                        objectFit: 'cover',
                        borderRadius: 2,
                        mt: 1
                      }}
                    />
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    <TokenIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      Token Cost: {selectedPost.tokenCost} tokens
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Token cost is calculated based on content length and number of platforms.
                  </Typography>
                </Grid>
                
                {selectedPost.status === 'published' && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Performance Metrics
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Likes
                        </Typography>
                        <Typography variant="h6" fontWeight="medium">
                          {selectedPost.likes || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Comments
                        </Typography>
                        <Typography variant="h6" fontWeight="medium">
                          {selectedPost.comments || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Shares
                        </Typography>
                        <Typography variant="h6" fontWeight="medium">
                          {selectedPost.shares || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Impressions
                        </Typography>
                        <Typography variant="h6" fontWeight="medium">
                          {selectedPost.impressions || 0}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePostDialog}>
              {editMode ? 'Cancel' : 'Close'}
            </Button>
            {editMode && (
              <Button onClick={handleSavePost} variant="contained" color="primary">
                {selectedPost?.id > posts.length ? 'Create Post' : 'Save Changes'}
              </Button>
            )}
          </DialogActions>
        </Dialog>
        
        {/* Connect account dialog */}
        <Dialog open={openConnectDialog} onClose={handleCloseConnectDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            Connect {selectedPlatform && selectedPlatform.charAt(0).toUpperCase() + selectedPlatform?.slice(1)} Account
          </DialogTitle>
          <DialogContent dividers>
            {selectedPlatform && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <SocialIcon platform={selectedPlatform} sx={{ width: 60, height: 60, mx: 'auto', mb: 2 }}>
                  {getPlatformIcon(selectedPlatform, 'medium')}
                </SocialIcon>
                
                <Typography variant="h6" gutterBottom>
                  Connect to {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
                  You'll be redirected to {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} to authorize ReachSpark to access your account.
                </Typography>
                
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleConnectSocialAccount}
                  startIcon={getPlatformIcon(selectedPlatform)}
                  sx={{ 
                    borderRadius: 2,
                    bgcolor: 
                      selectedPlatform === 'facebook' ? '#4267B2' : 
                      selectedPlatform === 'twitter' ? '#1DA1F2' : 
                      selectedPlatform === 'instagram' ? '#E1306C' : 
                      selectedPlatform === 'linkedin' ? '#0077B5' : 
                      'primary.main',
                    '&:hover': {
                      bgcolor: 
                        selectedPlatform === 'facebook' ? '#365899' : 
                        selectedPlatform === 'twitter' ? '#1A91DA' : 
                        selectedPlatform === 'instagram' ? '#C13584' : 
                        selectedPlatform === 'linkedin' ? '#006699' : 
                        'primary.dark',
                    }
                  }}
                >
                  Connect with {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}
                </Button>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConnectDialog}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default SocialMediaManagement;
