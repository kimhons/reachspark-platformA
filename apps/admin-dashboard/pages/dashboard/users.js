import { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Grid, Avatar, Card, CardContent, CardActions, IconButton, Chip, Divider, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import DashboardLayout from '../../components/DashboardLayout';

// Styled components
const UserCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
  },
}));

const RoleChip = styled(Chip)(({ theme, role }) => ({
  borderRadius: theme.shape.borderRadius,
  fontWeight: 500,
  ...(role === 'admin' && {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.dark,
  }),
  ...(role === 'editor' && {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.dark,
  }),
  ...(role === 'user' && {
    backgroundColor: theme.palette.info.light,
    color: theme.palette.info.dark,
  }),
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  borderRadius: theme.shape.borderRadius,
  fontWeight: 500,
  ...(status === 'active' && {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.dark,
  }),
  ...(status === 'inactive' && {
    backgroundColor: theme.palette.grey[300],
    color: theme.palette.grey[700],
  }),
  ...(status === 'suspended' && {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.dark,
  }),
}));

const SearchBar = styled(Paper)(({ theme }) => ({
  padding: '2px 4px',
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: 'none',
  border: `1px solid ${theme.palette.divider}`,
}));

// Sample user data
const initialUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'admin',
    status: 'active',
    tokens: 5000,
    tokensUsed: 2500,
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    lastActive: '2023-10-15T14:30:00Z',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'editor',
    status: 'active',
    tokens: 2000,
    tokensUsed: 1200,
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    lastActive: '2023-10-14T09:45:00Z',
  },
  {
    id: 3,
    name: 'Robert Johnson',
    email: 'robert.johnson@example.com',
    role: 'user',
    status: 'inactive',
    tokens: 1000,
    tokensUsed: 800,
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    lastActive: '2023-10-10T16:20:00Z',
  },
  {
    id: 4,
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    role: 'user',
    status: 'active',
    tokens: 1500,
    tokensUsed: 500,
    avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
    lastActive: '2023-10-15T11:15:00Z',
  },
  {
    id: 5,
    name: 'Michael Wilson',
    email: 'michael.wilson@example.com',
    role: 'editor',
    status: 'suspended',
    tokens: 2500,
    tokensUsed: 2000,
    avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
    lastActive: '2023-10-05T08:30:00Z',
  },
  {
    id: 6,
    name: 'Sarah Brown',
    email: 'sarah.brown@example.com',
    role: 'user',
    status: 'active',
    tokens: 1000,
    tokensUsed: 300,
    avatar: 'https://randomuser.me/api/portraits/women/6.jpg',
    lastActive: '2023-10-14T13:45:00Z',
  },
  {
    id: 7,
    name: 'David Miller',
    email: 'david.miller@example.com',
    role: 'user',
    status: 'active',
    tokens: 1000,
    tokensUsed: 600,
    avatar: 'https://randomuser.me/api/portraits/men/7.jpg',
    lastActive: '2023-10-13T15:20:00Z',
  },
  {
    id: 8,
    name: 'Jennifer Taylor',
    email: 'jennifer.taylor@example.com',
    role: 'user',
    status: 'inactive',
    tokens: 1000,
    tokensUsed: 100,
    avatar: 'https://randomuser.me/api/portraits/women/8.jpg',
    lastActive: '2023-10-01T10:10:00Z',
  },
];

const UserManagement = () => {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.status.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Open dialog for adding new user
  const handleAddUser = () => {
    setSelectedUser({
      id: users.length + 1,
      name: '',
      email: '',
      role: 'user',
      status: 'active',
      tokens: 1000,
      tokensUsed: 0,
      avatar: '',
      lastActive: new Date().toISOString(),
    });
    setEditMode(true);
    setOpenDialog(true);
  };
  
  // Open dialog for editing user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditMode(true);
    setOpenDialog(true);
  };
  
  // Open dialog for viewing user details
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setEditMode(false);
    setOpenDialog(true);
  };
  
  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setEditMode(false);
  };
  
  // Handle form input change
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setSelectedUser(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Handle save user
  const handleSaveUser = () => {
    if (selectedUser.id > users.length) {
      // Add new user
      setUsers(prev => [...prev, selectedUser]);
    } else {
      // Update existing user
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id ? selectedUser : user
      ));
    }
    handleCloseDialog();
  };
  
  // Handle delete user
  const handleDeleteUser = (userId) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  };
  
  // Handle toggle user status
  const handleToggleStatus = (userId) => {
    setUsers(prev => prev.map(user => {
      if (user.id === userId) {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        return { ...user, status: newStatus };
      }
      return user;
    }));
  };
  
  // Format date
  const formatDate = (dateString) => {
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
            User Management
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddUser}
            sx={{ borderRadius: 2 }}
          >
            Add User
          </Button>
        </Box>
        
        {/* Search and filters */}
        <Box sx={{ mb: 4 }}>
          <SearchBar>
            <IconButton sx={{ p: 1 }}>
              <SearchIcon />
            </IconButton>
            <TextField
              fullWidth
              placeholder="Search users by name, email, role, or status"
              variant="standard"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                disableUnderline: true,
              }}
            />
          </SearchBar>
        </Box>
        
        {/* User cards */}
        <Grid container spacing={3}>
          {filteredUsers.map(user => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
              <UserCard>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar 
                      src={user.avatar} 
                      alt={user.name}
                      sx={{ width: 64, height: 64 }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <RoleChip 
                        label={user.role} 
                        role={user.role}
                        size="small"
                        icon={user.role === 'admin' ? <AdminIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
                      />
                      <StatusChip 
                        label={user.status} 
                        status={user.status}
                        size="small"
                      />
                    </Box>
                  </Box>
                  
                  <Typography variant="h6" component="div" noWrap>
                    {user.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 2 }}>
                    {user.email}
                  </Typography>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Tokens
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {user.tokens.toLocaleString()}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Used
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {user.tokensUsed.toLocaleString()} ({Math.round((user.tokensUsed / user.tokens) * 100)}%)
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Last Active
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatDate(user.lastActive)}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Box>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleViewUser(user)}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="secondary"
                      onClick={() => handleEditUser(user)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box>
                    <IconButton 
                      size="small" 
                      color={user.status === 'active' ? 'error' : 'success'}
                      onClick={() => handleToggleStatus(user.id)}
                    >
                      {user.status === 'active' ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardActions>
              </UserCard>
            </Grid>
          ))}
        </Grid>
        
        {/* User dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editMode ? (selectedUser?.id > users.length ? 'Add User' : 'Edit User') : 'User Details'}
          </DialogTitle>
          <DialogContent dividers>
            {selectedUser && (
              <Grid container spacing={2}>
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Avatar 
                    src={selectedUser.avatar} 
                    alt={selectedUser.name}
                    sx={{ width: 100, height: 100 }}
                  >
                    {selectedUser.name.charAt(0)}
                  </Avatar>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={selectedUser.name}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={selectedUser.email}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Role</InputLabel>
                    <Select
                      name="role"
                      value={selectedUser.role}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      label="Role"
                    >
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="editor">Editor</MenuItem>
                      <MenuItem value="user">User</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={selectedUser.status}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      label="Status"
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="suspended">Suspended</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tokens"
                    name="tokens"
                    type="number"
                    value={selectedUser.tokens}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tokens Used"
                    name="tokensUsed"
                    type="number"
                    value={selectedUser.tokensUsed}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Avatar URL"
                    name="avatar"
                    value={selectedUser.avatar}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                
                {!editMode && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Last Active"
                      value={formatDate(selectedUser.lastActive)}
                      disabled
                      variant="outlined"
                      margin="normal"
                    />
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              {editMode ? 'Cancel' : 'Close'}
            </Button>
            {editMode && (
              <Button onClick={handleSaveUser} variant="contained" color="primary">
                Save
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default UserManagement;
