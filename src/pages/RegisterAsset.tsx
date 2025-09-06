import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';

import { useAssetStore } from '../store/assetStore';

const equipmentTypes = [
  'Dumbbell',
  'Barbell Plate',
  'Kettle Bell',
  'Resistance Band',
  'Medicine Ball',
  'Cable Attachment',
  'Bench',
  'Jump Rope',
  'Yoga Mat',
  'Foam Roller',
  'Other',
];

const conditions = [
  'Excellent',
  'Good',
  'Fair',
  'Poor',
  'Needs Repair',
];

const statuses = [
  'Active',
  'Out of Service',
  'Missing',
];

const RegisterAsset: React.FC = () => {
  const { addAsset, getAssetByTag, loading } = useAssetStore();
  
  const [formData, setFormData] = useState({
    asset_tag: '',
    item_type: '',
    description: '',
    location: '',
    weight: '',
    condition: 'Good',
    status: 'Active',
    notes: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'asset_tag' ? event.target.value.toUpperCase() : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.asset_tag.trim()) {
      newErrors.asset_tag = 'Asset tag is required';
    }
    
    if (!formData.item_type) {
      newErrors.item_type = 'Equipment type is required';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check for duplicate asset tag
    const existingAsset = getAssetByTag(formData.asset_tag);
    if (existingAsset) {
      setErrors({ asset_tag: 'Asset tag already exists' });
      toast.error(`Asset tag '${formData.asset_tag}' already exists!`);
      return;
    }

    setIsSubmitting(true);

    try {
      const assetData = {
        asset_tag: formData.asset_tag,
        item_type: formData.item_type,
        description: formData.description,
        location: formData.location,
        last_seen: new Date().toISOString(),
        status: formData.status as any,
        weight: formData.weight,
        condition: formData.condition as any,
        notes: formData.notes,
      };

      addAsset(assetData);
      
      toast.success(`Asset ${formData.asset_tag} registered successfully!`);
      
      // Reset form
      setFormData({
        asset_tag: '',
        item_type: '',
        description: '',
        location: '',
        weight: '',
        condition: 'Good',
        status: 'Active',
        notes: '',
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to register asset. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Register New Asset
      </Typography>

      <Card sx={{ maxWidth: 800, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Asset Tag */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Asset Tag"
                  value={formData.asset_tag}
                  onChange={handleInputChange('asset_tag')}
                  error={!!errors.asset_tag}
                  helperText={errors.asset_tag || 'Enter unique asset identifier'}
                  required
                  placeholder="e.g., DB-001"
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Grid>

              {/* Equipment Type */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Equipment Type"
                  value={formData.item_type}
                  onChange={handleInputChange('item_type')}
                  error={!!errors.item_type}
                  helperText={errors.item_type}
                  required
                >
                  {equipmentTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  placeholder="e.g., 25 lb rubber dumbbell"
                  multiline
                  rows={2}
                />
              </Grid>

              {/* Location */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={formData.location}
                  onChange={handleInputChange('location')}
                  error={!!errors.location}
                  helperText={errors.location}
                  required
                  placeholder="e.g., Weight Room - Rack 3"
                />
              </Grid>

              {/* Weight */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Weight"
                  value={formData.weight}
                  onChange={handleInputChange('weight')}
                  placeholder="e.g., 25 lbs"
                />
              </Grid>

              {/* Condition */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Condition"
                  value={formData.condition}
                  onChange={handleInputChange('condition')}
                >
                  {conditions.map((condition) => (
                    <MenuItem key={condition} value={condition}>
                      {condition}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Status */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  value={formData.status}
                  onChange={handleInputChange('status')}
                >
                  {statuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={formData.notes}
                  onChange={handleInputChange('notes')}
                  placeholder="Additional notes or comments"
                  multiline
                  rows={3}
                />
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                  disabled={isSubmitting || loading}
                  sx={{ py: 1.5, mt: 2 }}
                >
                  {isSubmitting ? 'Registering Asset...' : 'Register Asset'}
                </Button>
              </Grid>
            </Grid>
          </form>

          {/* Help Text */}
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Tips:</strong>
              <br />
              • Use consistent naming for asset tags (e.g., DB-001, DB-002 for dumbbells)
              • Include weight and brand in the description when possible
              • Be specific with locations to make equipment easy to find
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterAsset;