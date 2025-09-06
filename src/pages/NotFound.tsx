import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
} from '@mui/material';
import {
  Home as HomeIcon,
  Search as SearchIcon,
  FitnessCenter as GymIcon,
} from '@mui/icons-material';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
        }}
      >
        <Card sx={{ p: 4, maxWidth: 500, width: '100%' }}>
          <CardContent>
            {/* Large 404 with gym icon */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h1"
                component="div"
                sx={{
                  fontSize: { xs: '4rem', sm: '6rem' },
                  fontWeight: 'bold',
                  color: 'primary.main',
                  lineHeight: 1,
                }}
              >
                4
                <GymIcon sx={{ fontSize: { xs: '4rem', sm: '6rem' }, mx: 1 }} />
                4
              </Typography>
            </Box>

            <Typography variant="h4" component="h1" gutterBottom color="text.primary">
              Page Not Found
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Oops! The page you're looking for doesn't exist. It might have been moved, 
              deleted, or you entered the wrong URL.
            </Typography>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<HomeIcon />}
                onClick={() => navigate('/')}
                fullWidth
              >
                Go to Equipment Scanner
              </Button>

              <Button
                variant="outlined"
                size="large"
                startIcon={<SearchIcon />}
                onClick={() => navigate('/search')}
                fullWidth
              >
                Search Assets
              </Button>
            </Box>

            {/* Help text */}
            <Box sx={{ mt: 4, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Quick Navigation:</strong>
                <br />
                • Use the Equipment Scanner to detect and register new assets
                <br />
                • Search for specific assets by their tag
                <br />
                • View all registered assets and generate reports
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default NotFound;