import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbar,
} from '@mui/x-data-grid';
import {
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

import { useAssetStore, Asset } from '../store/assetStore';
import { assetApi } from '../services/api';

const ViewAssets: React.FC = () => {
  const { updateAsset, deleteAsset, loading, setLoading, error, setError } = useAssetStore();
  
  // Local state for API-fetched assets
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [filters, setFilters] = useState({
    type: 'All',
    status: 'All',
    location: '',
    condition: 'All',
  });

  // Fetch assets from API
  const fetchAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedAssets = await assetApi.getAssets();
      setAssets(fetchedAssets);
    } catch (err: any) {
      console.error('Error fetching assets:', err);
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Failed to fetch assets from API';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Initialize component and fetch assets
  useEffect(() => {
    if (!isInitialized) {
      fetchAssets();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const types = ['All', ...Array.from(new Set(assets.map(a => a.item_type)))];
    const statuses = ['All', ...Array.from(new Set(assets.map(a => a.status)))];
    const conditions = ['All', ...Array.from(new Set(assets.map(a => a.condition)))];
    
    return { types, statuses, conditions };
  }, [assets]);

  // Filter assets based on current filters
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      if (filters.type !== 'All' && asset.item_type !== filters.type) return false;
      if (filters.status !== 'All' && asset.status !== filters.status) return false;
      if (filters.condition !== 'All' && asset.condition !== filters.condition) return false;
      if (filters.location && !asset.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
      return true;
    });
  }, [assets, filters]);

  const handleFilterChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleExport = () => {
    const csvContent = [
      // Header
      ['Asset Tag', 'Type', 'Description', 'Location', 'Weight', 'Last Seen', 'Status', 'Condition', 'Notes'].join(','),
      // Data rows
      ...filteredAssets.map(asset => [
        asset.asset_tag,
        asset.item_type,
        asset.description || '',
        asset.location,
        asset.weight || '',
        new Date(asset.last_seen).toLocaleDateString(),
        asset.status,
        asset.condition,
        asset.notes || '',
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym_assets_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Assets exported successfully!');
  };

  const handleDelete = async (asset: Asset) => {
    if (window.confirm(`Are you sure you want to delete asset ${asset.asset_tag}?`)) {
      setLoading(true);
      try {
        await assetApi.deleteAsset(asset.asset_tag);
        // Remove from local state
        setAssets(prev => prev.filter(a => a.id !== asset.id));
        // Also remove from store for consistency
        deleteAsset(asset.id);
        toast.success(`Asset ${asset.asset_tag} deleted successfully!`);
      } catch (err: any) {
        console.error('Error deleting asset:', err);
        const errorMessage = err.response?.data?.message || 
                            err.message || 
                            'Failed to delete asset';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    fetchAssets();
    toast.success('Assets refreshed!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Missing': return 'error';
      case 'Out of Service': return 'warning';
      default: return 'default';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Excellent': return 'success';
      case 'Good': return 'info';
      case 'Fair': return 'warning';
      case 'Poor': return 'error';
      case 'Needs Repair': return 'error';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'asset_tag',
      headerName: 'Asset Tag',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ fontWeight: 'bold' }}>
          {params.value}
        </Box>
      ),
    },
    {
      field: 'item_type',
      headerName: 'Type',
      width: 140,
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 200,
      flex: 1,
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <LocationIcon fontSize="small" color="action" />
          {params.value}
        </Box>
      ),
    },
    {
      field: 'weight',
      headerName: 'Weight',
      width: 100,
    },
    {
      field: 'last_seen',
      headerName: 'Last Seen',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        new Date(params.value).toLocaleDateString()
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value) as any}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'condition',
      headerName: 'Condition',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          color={getConditionColor(params.value) as any}
          size="small"
          variant="filled"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="Edit Asset">
            <IconButton
              size="small"
              onClick={() => {
                // TODO: Implement edit functionality
                toast('Edit functionality coming soon!', { icon: 'ℹ️' });
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Asset">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(params.row as Asset)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          All Assets
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={filteredAssets.length === 0 || loading}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleRefresh}
              disabled={loading}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && !assets.length && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Loading assets from API...
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Equipment Type"
                value={filters.type}
                onChange={handleFilterChange('type')}
                size="small"
              >
                {filterOptions.types.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Status"
                value={filters.status}
                onChange={handleFilterChange('status')}
                size="small"
              >
                {filterOptions.statuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Condition"
                value={filters.condition}
                onChange={handleFilterChange('condition')}
                size="small"
              >
                {filterOptions.conditions.map((condition) => (
                  <MenuItem key={condition} value={condition}>
                    {condition}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Location contains"
                value={filters.location}
                onChange={handleFilterChange('location')}
                placeholder="Search location..."
                size="small"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Alert severity="info" sx={{ mb: 2 }}>
        Showing {filteredAssets.length} of {assets.length} assets
      </Alert>

      {/* Data Grid */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <DataGrid
            rows={filteredAssets}
            columns={columns}
            loading={loading}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 25 },
              },
              sorting: {
                sortModel: [{ field: 'last_seen', sort: 'desc' }],
              },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            checkboxSelection
            disableRowSelectionOnClick
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            sx={{
              border: 0,
              minHeight: 400,
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          />
        </CardContent>
      </Card>

      {assets.length === 0 && !loading && !error && (
        <Alert severity="info" sx={{ mt: 3 }}>
          No assets found. Use the Equipment Scanner or Register Asset page to add some!
        </Alert>
      )}
    </Box>
  );
};

export default ViewAssets;