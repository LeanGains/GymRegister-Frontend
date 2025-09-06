import React, { useState, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip,
  LinearProgress,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PhotoCamera as CameraIcon,
  Upload as UploadIcon,
  AutoAwesome as AIIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import CameraCapture from '../components/Camera/CameraCapture';
import ImageUpload from '../components/Upload/ImageUpload';
import { analysisApi } from '../services/api';
import { useAssetStore } from '../store/assetStore';

interface AnalysisResult {
  item_type: string;
  description: string;
  condition: string;
  weight?: string;
  confidence: number;
  suggestions: {
    asset_tag?: string;
    location?: string;
    notes?: string;
  };
}

const EquipmentScanner: React.FC = () => {
  const navigate = useNavigate();
  const { addAnalysisResult } = useAssetStore();
  
  // State management
  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');

  // Handle image analysis
  const analyzeImage = useCallback(async (imageData: string, fileName: string) => {
    setIsAnalyzing(true);
    setError(null);
    setCapturedImage(`data:image/jpeg;base64,${imageData}`);
    setImageFileName(fileName);

    try {
      const result = await analysisApi.analyzeImage(imageData);
      
      // Transform API response to match our interface
      const analysisResult: AnalysisResult = {
        item_type: result.item_type || 'Unknown Equipment',
        description: result.description || 'Equipment detected',
        condition: result.condition || 'Good',
        weight: result.weight,
        confidence: result.confidence || 0.8,
        suggestions: {
          asset_tag: result.suggested_tag,
          location: result.suggested_location,
          notes: result.notes,
        },
      };

      setAnalysisResult(analysisResult);
      
      // Store in global state for potential use
      addAnalysisResult({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        result: analysisResult,
        image: `data:image/jpeg;base64,${imageData}`,
      });

      toast.success('Equipment analyzed successfully!');
      
    } catch (err) {
      console.error('Analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, [addAnalysisResult]);

  // Handle camera capture
  const handleCameraCapture = useCallback((imageData: string) => {
    setShowCamera(false);
    const fileName = `camera_capture_${Date.now()}.jpg`;
    analyzeImage(imageData, fileName);
  }, [analyzeImage]);

  // Handle file upload
  const handleImageUpload = useCallback((imageData: string, fileName: string) => {
    analyzeImage(imageData, fileName);
  }, [analyzeImage]);

  // Open camera
  const openCamera = useCallback(() => {
    setShowCamera(true);
  }, []);

  // Close camera
  const closeCamera = useCallback(() => {
    setShowCamera(false);
  }, []);

  // Reset scanner
  const resetScanner = useCallback(() => {
    setAnalysisResult(null);
    setError(null);
    setCapturedImage(null);
    setImageFileName('');
  }, []);

  // Navigate to register with pre-filled data
  const registerEquipment = useCallback(() => {
    if (!analysisResult) return;

    // Navigate to register page with analysis data
    navigate('/register', {
      state: {
        analysisData: {
          item_type: analysisResult.item_type,
          description: analysisResult.description,
          condition: analysisResult.condition,
          weight: analysisResult.weight,
          suggested_tag: analysisResult.suggestions.asset_tag,
          suggested_location: analysisResult.suggestions.location,
          notes: analysisResult.suggestions.notes,
        },
        capturedImage,
      },
    });
  }, [analysisResult, capturedImage, navigate]);

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          <AIIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          AI Equipment Scanner
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Use AI to automatically identify and catalog gym equipment
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
          action={
            <Button color="inherit" size="small" onClick={resetScanner}>
              Try Again
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Analysis Progress */}
      {isAnalyzing && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box textAlign="center">
            <Typography variant="h6" gutterBottom>
              Analyzing Equipment...
            </Typography>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Our AI is identifying the equipment and its properties
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Analysis Results */}
      {analysisResult && !isAnalyzing && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Typography variant="h6">
              Analysis Results
            </Typography>
            <Box display="flex" gap={1}>
              <Tooltip title="Analyze another image">
                <IconButton size="small" onClick={resetScanner}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* Image Preview */}
            {capturedImage && (
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    width: '100%',
                    height: 200,
                    borderRadius: 1,
                    overflow: 'hidden',
                    bgcolor: 'grey.100',
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
                </Box>
              </Grid>
            )}

            {/* Analysis Details */}
            <Grid item xs={12} md={capturedImage ? 8 : 12}>
              <Box>
                {/* Confidence Score */}
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Confidence:
                  </Typography>
                  <Chip
                    label={`${Math.round(analysisResult.confidence * 100)}%`}
                    color={getConfidenceColor(analysisResult.confidence)}
                    size="small"
                  />
                </Box>

                {/* Equipment Details */}
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Equipment Type
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {analysisResult.item_type}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {analysisResult.description}
                  </Typography>
                </Box>

                <Box display="flex" gap={4} mb={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Condition
                    </Typography>
                    <Chip
                      label={analysisResult.condition}
                      color={
                        analysisResult.condition.toLowerCase() === 'excellent' ? 'success' :
                        analysisResult.condition.toLowerCase() === 'good' ? 'primary' :
                        analysisResult.condition.toLowerCase() === 'fair' ? 'warning' : 'error'
                      }
                      size="small"
                    />
                  </Box>

                  {analysisResult.weight && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Weight
                      </Typography>
                      <Typography variant="body1">
                        {analysisResult.weight}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Suggestions */}
                {(analysisResult.suggestions.asset_tag || 
                  analysisResult.suggestions.location || 
                  analysisResult.suggestions.notes) && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      AI Suggestions
                    </Typography>
                    {analysisResult.suggestions.asset_tag && (
                      <Typography variant="body2" gutterBottom>
                        • Suggested Tag: {analysisResult.suggestions.asset_tag}
                      </Typography>
                    )}
                    {analysisResult.suggestions.location && (
                      <Typography variant="body2" gutterBottom>
                        • Suggested Location: {analysisResult.suggestions.location}
                      </Typography>
                    )}
                    {analysisResult.suggestions.notes && (
                      <Typography variant="body2" gutterBottom>
                        • Notes: {analysisResult.suggestions.notes}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Action Buttons */}
          <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
            <Button
              variant="contained"
              size="large"
              onClick={registerEquipment}
              startIcon={<SaveIcon />}
            >
              Register Equipment
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/register')}
              startIcon={<EditIcon />}
            >
              Manual Entry
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              onClick={resetScanner}
              startIcon={<RefreshIcon />}
            >
              Scan Another
            </Button>
          </Box>
        </Paper>
      )}

      {/* Upload Interface */}
      {!analysisResult && !isAnalyzing && (
        <Paper sx={{ p: 3 }}>
          <ImageUpload
            onImageSelect={handleImageUpload}
            onCameraClick={openCamera}
            isAnalyzing={isAnalyzing}
            maxSize={10}
          />
        </Paper>
      )}

      {/* Quick Actions */}
      {!analysisResult && !isAnalyzing && (
        <Box mt={4} textAlign="center">
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
            <Button
              variant="outlined"
              onClick={openCamera}
              startIcon={<CameraIcon />}
            >
              Open Camera
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/register')}
              startIcon={<EditIcon />}
            >
              Manual Registration
            </Button>
          </Box>
        </Box>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={closeCamera}
          isAnalyzing={isAnalyzing}
        />
      )}
    </Container>
  );
};

export default EquipmentScanner;