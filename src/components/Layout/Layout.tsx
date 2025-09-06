import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  CameraAlt as CameraIcon,
  Add as AddIcon,
  ViewList as ViewListIcon,
  Search as SearchIcon,
  Assessment as ReportsIcon,
  FitnessCenter as GymIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

import { useAssetStore } from '../../store/assetStore';

const drawerWidth = 280;

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  badge?: number;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get store data for badges
  const { getMissingAssets, getAssetsNeedingRepair, getTotalAssets } = useAssetStore();
  
  const missingCount = getMissingAssets();
  const repairCount = getAssetsNeedingRepair();
  const totalAssets = getTotalAssets();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const navItems: NavItem[] = [
    {
      text: 'Equipment Scanner',
      icon: <CameraIcon />,
      path: '/scanner',
    },
    {
      text: 'Register Asset',
      icon: <AddIcon />,
      path: '/register',
    },
    {
      text: 'View Assets',
      icon: <ViewListIcon />,
      path: '/assets',
      badge: totalAssets,
    },
    {
      text: 'Search Asset',
      icon: <SearchIcon />,
      path: '/search',
    },
    {
      text: 'Reports',
      icon: <ReportsIcon />,
      path: '/reports',
      badge: missingCount + repairCount,
    },
  ];

  const drawer = (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GymIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              GymRegister
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              AI Equipment Tracking
            </Typography>
          </Box>
        </Box>
        {isMobile && (
          <IconButton
            color="inherit"
            onClick={handleDrawerToggle}
            sx={{ ml: 1 }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* Navigation Items */}
      <List sx={{ px: 1, py: 2 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={item.text} placement="right" arrow>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    backgroundColor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'white' : 'inherit',
                    '&:hover': {
                      backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? 'white' : 'primary.main',
                      minWidth: 40,
                    }}
                  >
                    {item.badge && item.badge > 0 ? (
                      <Badge
                        badgeContent={item.badge}
                        color={item.path === '/reports' && (missingCount > 0 || repairCount > 0) ? 'error' : 'secondary'}
                        max={99}
                      >
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.95rem',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      {/* Footer Info */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Powered by AI
        </Typography>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          v1.0.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <GymIcon sx={{ display: { xs: 'block', md: 'none' } }} />
            <Typography variant="h6" noWrap component="div">
              {navItems.find(item => item.path === location.pathname)?.text || 'GymRegister'}
            </Typography>
          </Box>

          {/* Status indicators */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {missingCount > 0 && (
              <Tooltip title={`${missingCount} missing assets`}>
                <Badge badgeContent={missingCount} color="error">
                  <Typography variant="body2" sx={{ px: 1 }}>
                    Missing
                  </Typography>
                </Badge>
              </Tooltip>
            )}
            {repairCount > 0 && (
              <Tooltip title={`${repairCount} assets need repair`}>
                <Badge badgeContent={repairCount} color="warning">
                  <Typography variant="body2" sx={{ px: 1 }}>
                    Repair
                  </Typography>
                </Badge>
              </Tooltip>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="navigation menu"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: 1,
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar /> {/* Spacer for fixed app bar */}
        {children}
      </Box>
    </Box>
  );
};

export default Layout;