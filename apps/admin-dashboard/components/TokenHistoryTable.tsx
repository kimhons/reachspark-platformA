import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon 
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { createTokenService, TokenService, TokenHistoryItem } from '@reachspark/tokens';

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
const StatsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2),
}));

const TokenHistoryTable: React.FC = () => {
  const { user } = useAuth();
  const [tokenService, setTokenService] = useState<TokenService | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [tokenHistory, setTokenHistory] = useState<TokenHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Initialize token service
  useEffect(() => {
    if (user) {
      const service = createTokenService(firebaseConfig, user.uid);
      setTokenService(service);
      
      // Get token balance and history
      const fetchTokenData = async () => {
        setLoading(true);
        try {
          const balance = await service.getTokenBalance(user.uid);
          setTokenBalance(balance);
          
          const history = await service.getTokenHistory(user.uid, 50);
          setTokenHistory(history);
        } catch (err: any) {
          console.error('Error fetching token data:', err);
          setError(err.message || 'Failed to load token data');
        } finally {
          setLoading(false);
        }
      };
      
      fetchTokenData();
    }
  }, [user]);
  
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Calculate token usage statistics
  const calculateStats = () => {
    if (!tokenHistory.length) return { total: 0, purchases: 0, usage: 0 };
    
    const total = tokenHistory.reduce((sum, item) => sum + item.amount, 0);
    const purchases = tokenHistory
      .filter(item => item.type === 'purchase')
      .reduce((sum, item) => sum + item.amount, 0);
    const usage = tokenHistory
      .filter(item => item.type === 'usage')
      .reduce((sum, item) => sum + Math.abs(item.amount), 0);
    
    return { total, purchases, usage };
  };
  
  const stats = calculateStats();
  
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Token History
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Track your token purchases and usage
        </Typography>
        
        {tokenBalance !== null && (
          <Chip
            label={`Current Balance: ${tokenBalance} tokens`}
            color="primary"
            sx={{ mt: 2, px: 2, py: 3, fontSize: '1rem' }}
          />
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <StatsCard>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Total Tokens Purchased
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon color="success" sx={{ mr: 1 }} />
              {stats.purchases}
            </Typography>
          </StatsCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <StatsCard>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Total Tokens Used
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingDownIcon color="error" sx={{ mr: 1 }} />
              {stats.usage}
            </Typography>
          </StatsCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <StatsCard>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Current Balance
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {tokenBalance !== null ? tokenBalance : '-'}
            </Typography>
          </StatsCard>
        </Grid>
      </Grid>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="token history table">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tokenHistory
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => (
                    <TableRow hover key={item.id}>
                      <TableCell>
                        {item.createdAt.toLocaleDateString()} {item.createdAt.toLocaleTimeString()}
                      </TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.type === 'purchase' ? 'Purchase' : 'Usage'}
                          color={item.type === 'purchase' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          color={item.type === 'purchase' ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          {item.type === 'purchase' ? '+' : '-'}{Math.abs(item.amount)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                {tokenHistory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No token history found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={tokenHistory.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
    </Box>
  );
};

export default TokenHistoryTable;
