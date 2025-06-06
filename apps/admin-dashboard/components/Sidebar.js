import { useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, Collapse, IconButton, Typography, Avatar, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Dashboard as DashboardIcon,
  Article as ArticleIcon,
  People as PeopleIcon,
  Campaign as CampaignIcon,
  BarChart as AnalyticsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Notifications as NotificationsIcon,
  Token as TokenIcon,
  Image as ImageIcon,
  Web as WebIcon,
  Email as EmailIcon,
  FormatPaint as DesignIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Styled components
const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 2),
  ...theme.mixins.toolbar,
}));

const SidebarWrapper = styled(Box)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
}));

const UserSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const Sidebar = ({ open, toggleDrawer }) => {
  const router = useRouter();
  const { currentUser, userProfile, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  
  // State for nested menu items
  const [contentOpen, setContentOpen] = useState(false);
  const [marketingOpen, setMarketingOpen] = useState(false);
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };
  
  // Toggle nested menu items
  const handleContentToggle = () => {
    setContentOpen(!contentOpen);
  };
  
  const handleMarketingToggle = () => {
    setMarketingOpen(!marketingOpen);
  };
  
  // Check if a route is active
  const isActive = (path) => {
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };
  
  // Menu items
  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard/overview',
      active: isActive('/dashboard/overview'),
    },
    {
      text: 'Content Management',
      icon: <ArticleIcon />,
      active: isActive('/dashboard/content'),
      hasSubmenu: true,
      open: contentOpen,
      onToggle: handleContentToggle,
      submenu: [
        {
          text: 'Blog Posts',
          path: '/dashboard/content/blog',
          active: isActive('/dashboard/content/blog'),
        },
        {
          text: 'Pages',
          path: '/dashboard/content/pages',
          active: isActive('/dashboard/content/pages'),
        },
        {
          text: 'Media Library',
          path: '/dashboard/content/media',
          active: isActive('/dashboard/content/media'),
        },
      ],
    },
    {
      text: 'Marketing Tools',
      icon: <CampaignIcon />,
      active: isActive('/dashboard/marketing'),
      hasSubmenu: true,
      open: marketingOpen,
      onToggle: handleMarketingToggle,
      submenu: [
        {
          text: 'Social Media',
          path: '/dashboard/marketing/social',
          active: isActive('/dashboard/marketing/social'),
          icon: <WebIcon fontSize="small" />,
        },
        {
          text: 'Email Campaigns',
          path: '/dashboard/marketing/email',
          active: isActive('/dashboard/marketing/email'),
          icon: <EmailIcon fontSize="small" />,
        },
        {
          text: 'Ad Creation',
          path: '/dashboard/marketing/ads',
          active: isActive('/dashboard/marketing/ads'),
          icon: <DesignIcon fontSize="small" />,
        },
        {
          text: 'Image Generation',
          path: '/dashboard/marketing/images',
          active: isActive('/dashboard/marketing/images'),
          icon: <ImageIcon fontSize="small" />,
        },
      ],
    },
    {
      text: 'User Management',
      icon: <PeopleIcon />,
      path: '/dashboard/users',
      active: isActive('/dashboard/users'),
    },
    {
      text: 'Analytics',
      icon: <AnalyticsIcon />,
      path: '/dashboard/analytics',
      active: isActive('/dashboard/analytics'),
    },
    {
      text: 'Token Management',
      icon: <TokenIcon />,
      path: '/dashboard/tokens',
      active: isActive('/dashboard/tokens'),
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      path: '/dashboard/settings',
      active: isActive('/dashboard/settings'),
    },
  ];
  
  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? 240 : 72,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? 240 : 72,
          boxSizing: 'border-box',
          transition: theme => theme.transitions.create(['width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
        },
      }}
    >
      <SidebarWrapper>
        <Box>
          <DrawerHeader>
            {open ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar 
                    src="/logo.svg" 
                    variant="rounded"
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: 'primary.main',
                      mr: 1
                    }}
                  >
                    RS
                  </Avatar>
                  <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
                    ReachSpark
                  </Typography>
                </Box>
                <IconButton onClick={toggleDrawer}>
                  <ChevronLeftIcon />
                </IconButton>
              </>
            ) : (
              <>
                <Avatar 
                  src="/logo.svg" 
                  variant="rounded"
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: 'primary.main',
                    mx: 'auto'
                  }}
                >
                  RS
                </Avatar>
                <IconButton onClick={toggleDrawer} sx={{ position: 'absolute', right: 4 }}>
                  <ChevronRightIcon />
                </IconButton>
              </>
            )}
          </DrawerHeader>
          <Divider />
          <List>
            {menuItems.map((item) => (
              <Box key={item.text}>
                {item.hasSubmenu ? (
                  <>
                    <ListItem 
                      button 
                      onClick={item.onToggle}
                      sx={{
                        backgroundColor: item.active ? 'primary.light' : 'transparent',
                        color: item.active ? 'primary.main' : 'inherit',
                        borderRadius: open ? 1 : 0,
                        mx: open ? 1 : 0,
                        pl: open ? 2 : 3,
                        '&:hover': {
                          backgroundColor: item.active ? 'primary.light' : 'action.hover',
                        },
                      }}
                    >
                      <Tooltip title={open ? '' : item.text} placement="right">
                        <ListItemIcon 
                          sx={{ 
                            color: item.active ? 'primary.main' : 'inherit',
                            minWidth: open ? 40 : 'auto',
                            mr: open ? 'auto' : 'auto',
                            justifyContent: 'center',
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                      </Tooltip>
                      {open && (
                        <>
                          <ListItemText primary={item.text} />
                          {item.open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </>
                      )}
                    </ListItem>
                    {open && (
                      <Collapse in={item.open} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          {item.submenu.map((subItem) => (
                            <ListItem
                              button
                              key={subItem.text}
                              onClick={() => router.push(subItem.path)}
                              sx={{
                                pl: 4,
                                backgroundColor: subItem.active ? 'primary.light' : 'transparent',
                                color: subItem.active ? 'primary.main' : 'inherit',
                                borderRadius: 1,
                                mx: 1,
                                '&:hover': {
                                  backgroundColor: subItem.active ? 'primary.light' : 'action.hover',
                                },
                              }}
                            >
                              {subItem.icon && (
                                <ListItemIcon 
                                  sx={{ 
                                    color: subItem.active ? 'primary.main' : 'inherit',
                                    minWidth: 36,
                                  }}
                                >
                                  {subItem.icon}
                                </ListItemIcon>
                              )}
                              <ListItemText primary={subItem.text} />
                            </ListItem>
                          ))}
                        </List>
                      </Collapse>
                    )}
                  </>
                ) : (
                  <ListItem
                    button
                    onClick={() => router.push(item.path)}
                    sx={{
                      backgroundColor: item.active ? 'primary.light' : 'transparent',
                      color: item.active ? 'primary.main' : 'inherit',
                      borderRadius: open ? 1 : 0,
                      mx: open ? 1 : 0,
                      pl: open ? 2 : 3,
                      '&:hover': {
                        backgroundColor: item.active ? 'primary.light' : 'action.hover',
                      },
                    }}
                  >
                    <Tooltip title={open ? '' : item.text} placement="right">
                      <ListItemIcon 
                        sx={{ 
                          color: item.active ? 'primary.main' : 'inherit',
                          minWidth: open ? 40 : 'auto',
                          mr: open ? 'auto' : 'auto',
                          justifyContent: 'center',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                    </Tooltip>
                    {open && <ListItemText primary={item.text} />}
                  </ListItem>
                )}
              </Box>
            ))}
          </List>
        </Box>
        
        <Box>
          <Divider />
          <List>
            <ListItem 
              button 
              onClick={handleLogout}
              sx={{
                borderRadius: open ? 1 : 0,
                mx: open ? 1 : 0,
                pl: open ? 2 : 3,
              }}
            >
              <Tooltip title={open ? '' : 'Logout'} placement="right">
                <ListItemIcon 
                  sx={{ 
                    minWidth: open ? 40 : 'auto',
                    mr: open ? 'auto' : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  <LogoutIcon />
                </ListItemIcon>
              </Tooltip>
              {open && <ListItemText primary="Logout" />}
            </ListItem>
          </List>
          
          {open && userProfile && (
            <UserSection>
              <Avatar 
                src={userProfile.photoURL || ''}
                alt={userProfile.displayName || 'User'}
                sx={{ width: 40, height: 40, mr: 2 }}
              >
                {userProfile.displayName?.charAt(0) || 'U'}
              </Avatar>
              <Box sx={{ overflow: 'hidden' }}>
                <Typography variant="subtitle2" noWrap>
                  {userProfile.displayName || 'User'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TokenIcon sx={{ fontSize: 16, color: 'primary.main', mr: 0.5 }} />
                  <Typography variant="caption" color="text.secondary">
                    {userProfile.tokens || 0} Tokens
                  </Typography>
                </Box>
              </Box>
            </UserSection>
          )}
        </Box>
      </SidebarWrapper>
    </Drawer>
  );
};

export default Sidebar;
