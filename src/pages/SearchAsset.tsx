import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Update as UpdateIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

import { useAssetStore, Asset } from '../store/assetStore';

const SearchAsset: React.FC = () => {
  const { getAssetByTag, updateAsset } = useAssetStore();
  
  const [searchTag, setSearchTag] = useState('');
  const [foundAsset, setFoundAsset] = useState<Asset | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  
  // Location update state
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState('');

  const handleSearch = async () => {
    if (!searchTag.trim()) {
      toast.error('Please enter an asset tag to search');
      return;
    }

    setIsSearching(true);
    setNotFound(false);
    setFoundAsset(null);

    try {
      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const asset = getAssetByTag(searchTag.trim());
      
      if (asset) {
        setFoundAsset(asset);
        setNewLocation(asset.location);
        toast.success('Asset found!');
      } else {
        setNotFound(true);
        toast.error('Asset not found in database');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationUpdate = async () => {
    if (!foundAsset || !newLocation.trim()) {
      toast.error('Please enter a new location');
      return;
    }

    if (newLocation.trim() === foundAsset.location) {
      toast.info('Location unchanged');
      return;
    }

    setIsUpdatingLocation(true);

    try {
      updateAsset(foundAsset.id, {
        location: newLocation.trim(),
        last_seen: new Date().toISOString(),
        notes: `Location updated from search page`,
      });

      // Update the found asset display
      setFoundAsset(prev => prev ? {
        ...prev,
        location: newLocation.trim(),
        last_seen: new Date().toISOString(),
      } : null);

      toast.success('Location updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update location. Please try again.');
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const handleClear = () => {
    setSearchTag('');
    setFoundAsset(null);
    setNotFound(false);
    setNewLocation('');
    setIsUpdatingLocation(false);
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

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Search Asset
      </Typography>

      {/* Search Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Asset Tag"
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value.toUpperCase())}
                placeholder="Enter asset tag to search"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                disabled={isSearching || !searchTag.trim()}
                startIcon={<SearchIcon />}
                sx={{ py: 1.5 }}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleClear}
                startIcon={<ClearIcon />}
                sx={{ py: 1.5 }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Search Results */}
      {foundAsset && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h2" color="success.main">
                ✅ Asset Found!
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  label={foundAsset.status}
                  color={getStatusColor(foundAsset.status) as any}
                  variant="outlined"
                />
                <Chip
                  label={foundAsset.condition}
                  color={getConditionColor(foundAsset.condition) as any}
                  variant="filled"
                />
              </Box>
            </Box>

            <Grid container spacing={3}>
              {/* Asset Details */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Asset Details
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Asset Tag
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {foundAsset.asset_tag}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Equipment Type
                    </Typography>
                    <Typography variant="body1">
                      {foundAsset.item_type}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body1">
                      {foundAsset.description || 'No description'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Weight
                    </Typography>
                    <Typography variant="body1">
                      {foundAsset.weight || 'Not specified'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Last Seen
                    </Typography>
                    <Typography variant="body1">
                      {new Date(foundAsset.last_seen).toLocaleString()}
                    </Typography>
                  </Box>

                  {foundAsset.notes && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Notes
                      </Typography>
                      <Typography variant="body1">
                        {foundAsset.notes}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* Location & Update */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Location Management
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LocationIcon color="primary" />
                  <Typography variant="body1" fontWeight="bold">
                    Current Location: {foundAsset.location}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom>
                  Update Location
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="New Location"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Enter new location"
                    helperText="Update the asset's current location"
                  />

                  <Button
                    variant="contained"
                    onClick={handleLocationUpdate}
                    disabled={isUpdatingLocation || !newLocation.trim() || newLocation.trim() === foundAsset.location}
                    startIcon={<UpdateIcon />}
                    fullWidth
                  >
                    {isUpdatingLocation ? 'Updating...' : 'Update Location'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Not Found Message */}
      {notFound && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            ❌ Asset Not Found
          </Typography>
          <Typography variant="body1" gutterBottom>
            Asset tag '{searchTag}' was not found in the database.
          </Typography>
          <Typography variant="body2">
            💡 <strong>Suggestions:</strong>
            <br />
            • Check the asset tag spelling and try again
            • Use the Equipment Scanner to detect and register new assets
            • Visit the Register Asset page to manually add the asset
          </Typography>
        </Alert>
      )}

      {/* Help Information */}
      {!foundAsset && !notFound && (
        <Alert severity="info">
          <Typography variant="h6" gutterBottom>
            🔍 How to Search
          </Typography>
          <Typography variant="body2">
            • Enter the exact asset tag (e.g., DB-001, KB-025)
            • Asset tags are case-insensitive
            • Use the Equipment Scanner to automatically detect asset tags from photos
            • Found assets can have their location updated directly from this page
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default SearchAsset;