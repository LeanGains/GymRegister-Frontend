import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Build as BuildIcon,
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';

import { useAssetStore } from '../store/assetStore';

const COLORS = ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0'];

const Reports: React.FC = () => {
  const { 
    assets, 
    auditLogs, 
    getTotalAssets, 
    getActiveAssets, 
    getMissingAssets, 
    getAssetsNeedingRepair 
  } = useAssetStore();

  // Calculate statistics
  const stats = useMemo(() => {
    const total = getTotalAssets();
    const active = getActiveAssets();
    const missing = getMissingAssets();
    const needsRepair = getAssetsNeedingRepair();
    const outOfService = assets.filter(a => a.status === 'Out of Service').length;

    return {
      total,
      active,
      missing,
      needsRepair,
      outOfService,
      activePercentage: total > 0 ? Math.round((active / total) * 100) : 0,
      missingPercentage: total > 0 ? Math.round((missing / total) * 100) : 0,
    };
  }, [assets, getTotalAssets, getActiveAssets, getMissingAssets, getAssetsNeedingRepair]);

  // Equipment type distribution
  const typeDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    assets.forEach(asset => {
      distribution[asset.item_type] = (distribution[asset.item_type] || 0) + 1;
    });
    
    return Object.entries(distribution)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [assets]);

  // Status distribution for pie chart
  const statusDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    assets.forEach(asset => {
      distribution[asset.status] = (distribution[asset.status] || 0) + 1;
    });
    
    return Object.entries(distribution).map(([status, count]) => ({
      name: status,
      value: count,
    }));
  }, [assets]);

  // Condition distribution
  const conditionDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    assets.forEach(asset => {
      distribution[asset.condition] = (distribution[asset.condition] || 0) + 1;
    });
    
    return Object.entries(distribution)
      .map(([condition, count]) => ({ condition, count }))
      .sort((a, b) => b.count - a.count);
  }, [assets]);

  // Recent activity
  const recentAssets = useMemo(() => {
    return [...assets]
      .sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime())
      .slice(0, 10);
  }, [assets]);

  // Missing assets
  const missingAssets = useMemo(() => {
    return assets.filter(asset => asset.status === 'Missing');
  }, [assets]);

  // Assets needing repair
  const repairAssets = useMemo(() => {
    return assets.filter(asset => asset.condition === 'Needs Repair');
  }, [assets]);

  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      summary: stats,
      assets: assets,
      auditLogs: auditLogs.slice(-50), // Last 50 audit entries
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym_register_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully!');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Asset Reports
        </Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExportReport}
        >
          Export Report
        </Button>
      </Box>

      {/* Summary Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssessmentIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" component="div" color="primary.main">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Assets
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" component="div" color="success.main">
                {stats.active}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active ({stats.activePercentage}%)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ErrorIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" component="div" color="error.main">
                {stats.missing}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Missing ({stats.missingPercentage}%)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <BuildIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" component="div" color="warning.main">
                {stats.needsRepair}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Needs Repair
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Equipment Type Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Equipment by Type
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="type" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Status Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Equipment by Status
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts and Issues */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Missing Assets Alert */}
        {stats.missing > 0 && (
          <Grid item xs={12} md={6}>
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                ⚠️ {stats.missing} Assets Missing
              </Typography>
              <List dense>
                {missingAssets.slice(0, 5).map((asset) => (
                  <ListItem key={asset.id} sx={{ py: 0 }}>
                    <ListItemIcon>
                      <ErrorIcon color="error" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${asset.asset_tag} - ${asset.item_type}`}
                      secondary={`Last seen: ${asset.location}`}
                    />
                  </ListItem>
                ))}
                {missingAssets.length > 5 && (
                  <ListItem>
                    <ListItemText
                      primary={`... and ${missingAssets.length - 5} more`}
                      sx={{ fontStyle: 'italic' }}
                    />
                  </ListItem>
                )}
              </List>
            </Alert>
          </Grid>
        )}

        {/* Repair Needed Alert */}
        {stats.needsRepair > 0 && (
          <Grid item xs={12} md={6}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                🔧 {stats.needsRepair} Assets Need Repair
              </Typography>
              <List dense>
                {repairAssets.slice(0, 5).map((asset) => (
                  <ListItem key={asset.id} sx={{ py: 0 }}>
                    <ListItemIcon>
                      <BuildIcon color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${asset.asset_tag} - ${asset.item_type}`}
                      secondary={asset.location}
                    />
                  </ListItem>
                ))}
                {repairAssets.length > 5 && (
                  <ListItem>
                    <ListItemText
                      primary={`... and ${repairAssets.length - 5} more`}
                      sx={{ fontStyle: 'italic' }}
                    />
                  </ListItem>
                )}
              </List>
            </Alert>
          </Grid>
        )}
      </Grid>

      {/* Recent Activity */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recently Added Assets
          </Typography>
          {recentAssets.length > 0 ? (
            <List>
              {recentAssets.map((asset, index) => (
                <React.Fragment key={asset.id}>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUpIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight="bold">
                            {asset.asset_tag}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {asset.item_type}
                          </Typography>
                          <Chip
                            label={asset.status}
                            size="small"
                            color={asset.status === 'Active' ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Location: {asset.location}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Last seen: {new Date(asset.last_seen).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < recentAssets.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Alert severity="info">
              No assets to display. Start by scanning or registering some equipment!
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* No Data Message */}
      {stats.total === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            📊 No Data Available
          </Typography>
          <Typography variant="body1">
            No assets have been registered yet. Use the Equipment Scanner or Register Asset page to get started!
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default Reports;