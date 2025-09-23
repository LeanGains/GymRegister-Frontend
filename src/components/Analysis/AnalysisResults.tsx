import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Card,
  CardContent,
  Button,
  Divider,
  Alert,
  LinearProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoIcon,
  Analytics as AnalyticsIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface EquipmentItem {
  type: string;
  weight?: string;
  description: string;
  condition: string;
  suggested_asset_tag: string;
  location_in_image: string;
  confidence?: number;
  bounding_box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface AnalysisMetadata {
  imageQuality: string;
  totalItems: number;
  recommendations: string;
  confidenceScore: number;
  processingTime: number;
  imageResolution?: string;
  detectionMethod?: string;
  model_version?: string;
}

interface AnalysisResultsProps {
  equipmentItems: EquipmentItem[];
  analysisMetadata: AnalysisMetadata;
  capturedImage: string | null;
  imageFileName: string;
  onRegisterSingle: (equipment: EquipmentItem) => void;
  onRegisterAll: () => void;
  onAnalyzeAnother: () => void;
  onEditManually: () => void;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  equipmentItems,
  analysisMetadata,
  capturedImage,
  imageFileName,
  onRegisterSingle,
  onRegisterAll,
  onAnalyzeAnother,
  onEditManually,
}) => {
  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  // Get condition color
  const getConditionColor = (condition: string) => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower === 'excellent') return 'success';
    if (conditionLower === 'good') return 'primary';
    if (conditionLower === 'fair') return 'warning';
    return 'error';
  };

  // Format equipment type
  const formatEquipmentType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Calculate overall confidence
  const overallConfidence = equipmentItems.length > 0 
    ? equipmentItems.reduce((sum, item) => sum + (item.confidence || analysisMetadata.confidenceScore), 0) / equipmentItems.length
    : analysisMetadata.confidenceScore;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h6" display="flex" alignItems="center" gap={1}>
            <AnalyticsIcon color="primary" />
            Equipment Analysis Results
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {imageFileName} • {equipmentItems.length} items detected
          </Typography>
        </Box>
        
        <Box display="flex" gap={1}>
          <Tooltip title="Analyze another image">
            <IconButton size="small" onClick={onAnalyzeAnother}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Analysis information">
            <IconButton size="small">
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Analysis Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="primary.main">
              {analysisMetadata.totalItems}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Items Found
            </Typography>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
            <Chip
              label={analysisMetadata.imageQuality}
              color={
                analysisMetadata.imageQuality.toLowerCase() === 'excellent' ? 'success' :
                analysisMetadata.imageQuality.toLowerCase() === 'good' ? 'primary' :
                'warning'
              }
              size="small"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Image Quality
            </Typography>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
            <Box display="flex" flexDirection="column" alignItems="center">
              <Typography variant="h6" color={overallConfidence >= 0.8 ? 'success.main' : overallConfidence >= 0.6 ? 'warning.main' : 'error.main'}>
                {Math.round(overallConfidence * 100)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={overallConfidence * 100}
                color={getConfidenceColor(overallConfidence)}
                sx={{ width: '100%', mt: 1, mb: 1 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Confidence
            </Typography>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h6">
              {analysisMetadata.processingTime.toFixed(1)}s
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Processing Time
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* AI Recommendations */}
      {analysisMetadata.recommendations && (
        <Alert 
          severity="info" 
          icon={<AnalyticsIcon />}
          sx={{ mb: 3 }}
        >
          <Typography variant="subtitle2" gutterBottom>
            AI Analysis Insights
          </Typography>
          {analysisMetadata.recommendations}
        </Alert>
      )}

      {/* Image Preview with Analysis Overlay */}
      {capturedImage && (
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Analyzed Image
          </Typography>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              maxWidth: 500,
              height: 300,
              borderRadius: 1,
              overflow: 'hidden',
              bgcolor: 'grey.100',
              mx: 'auto',
            }}
          >
            <img
              src={capturedImage}
              alt="Analyzed equipment"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            
            {/* Analysis overlay indicators */}
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                display: 'flex',
                gap: 1,
              }}
            >
              <Chip
                icon={<PhotoIcon />}
                label={`${equipmentItems.length} items`}
                size="small"
                sx={{ bgcolor: 'rgba(0,0,0,0.7)', color: 'white' }}
              />
            </Box>
          </Box>
        </Box>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Equipment Items Grid */}
      <Typography variant="h6" gutterBottom>
        Detected Equipment ({equipmentItems.length} items)
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {equipmentItems.map((equipment, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card 
              variant="outlined" 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: 3,
                  transform: 'translateY(-2px)',
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                {/* Equipment Type & Confidence */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                    {formatEquipmentType(equipment.type)}
                  </Typography>
                  {equipment.confidence && (
                    <Chip
                      label={`${Math.round(equipment.confidence * 100)}%`}
                      size="small"
                      color={getConfidenceColor(equipment.confidence)}
                    />
                  )}
                </Box>
                
                {/* Description */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  {equipment.description}
                </Typography>

                {/* Details Grid */}
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  {equipment.weight && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Weight
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {equipment.weight}
                      </Typography>
                    </Grid>
                  )}
                  
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Condition
                    </Typography>
                    <Chip
                      label={equipment.condition}
                      size="small"
                      color={getConditionColor(equipment.condition)}
                    />
                  </Grid>
                </Grid>

                {/* Location */}
                <Box mb={2}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Location in Image
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    {equipment.location_in_image}
                  </Typography>
                </Box>

                {/* Suggested Asset Tag */}
                <Box mb={2}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Suggested Asset Tag
                  </Typography>
                  <Typography variant="body2" color="primary.main" fontFamily="monospace" fontWeight="medium">
                    {equipment.suggested_asset_tag}
                  </Typography>
                </Box>
              </CardContent>

              {/* Action Button */}
              <Box p={2} pt={0}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => onRegisterSingle(equipment)}
                  startIcon={<SaveIcon />}
                  sx={{
                    bgcolor: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    }
                  }}
                >
                  Add to Register
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Action Buttons */}
      <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
        <Button
          variant="contained"
          size="large"
          onClick={onRegisterAll}
          startIcon={<SaveIcon />}
          color="success"
        >
          Register All Equipment
        </Button>
        
        <Button
          variant="outlined"
          size="large"
          onClick={onEditManually}
          startIcon={<EditIcon />}
        >
          Manual Entry
        </Button>
        
        <Button
          variant="outlined"
          size="large"
          onClick={onAnalyzeAnother}
          startIcon={<RefreshIcon />}
        >
          Analyze Another
        </Button>
      </Box>
    </Paper>
  );
};

export default AnalysisResults;