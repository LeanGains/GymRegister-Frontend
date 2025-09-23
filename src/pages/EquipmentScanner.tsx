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
import ImageAnalysisUtils, { ImageQualityMetrics } from '../utils/imageAnalysisUtils';

interface AnalysisJobResponse {
  job_id: string;
  status: string;
  message: string;
}

interface EquipmentItem {
  type: string;
  weight?: string;
  description: string;
  condition: string;
  suggested_asset_tag: string;
  location_in_image: string;
}

interface AnalysisResultResponse {
  id: string;
  asset_tag: string | null;
  original_filename: string;
  status: string;
  result: {
    asset_tags: string[];
    equipment: EquipmentItem[];
    image_quality: string;
    total_items: number;
    recommendations: string;
    confidence_score: number;
  };
  error_message: string | null;
  confidence_score: number;
  created_at: string;
  completed_at: string;
  processing_time: number;
}

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

  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
  const [analysisMetadata, setAnalysisMetadata] = useState<{
    imageQuality: string;
    totalItems: number;
    recommendations: string;
    confidenceScore: number;
    processingTime: number;
  } | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const [imageQualityMetrics, setImageQualityMetrics] = useState<ImageQualityMetrics | null>(null);
  const [preAnalysisTime, setPreAnalysisTime] = useState<number>(0);

  // Poll for analysis results
  const pollAnalysisResult = useCallback(async (jobId: string): Promise<void> => {
    const maxRetries = 30; // 30 retries with 2-second intervals = 1 minute max
    let retries = 0;

    const checkStatus = async (): Promise<void> => {
      try {
        const result: AnalysisResultResponse = await analysisApi.getAnalysisResult(jobId);
        
        setAnalysisStatus(result.status);

        if (result.status === 'completed') {
          // Analysis completed successfully
          setEquipmentItems(result.result.equipment);
          setAnalysisMetadata({
            imageQuality: result.result.image_quality,
            totalItems: result.result.total_items,
            recommendations: result.result.recommendations,
            confidenceScore: result.result.confidence_score,
            processingTime: result.processing_time,
          });

          // Store in global state for history
          addAnalysisResult({
            id: result.id,
            timestamp: result.created_at,
            result: {
              item_type: `${result.result.total_items} Equipment Items`,
              description: `Detected ${result.result.equipment.length} equipment items`,
              condition: 'Analysis Complete',
              confidence: result.result.confidence_score,
              suggestions: {
                notes: result.result.recommendations,
              },
            },
            image: capturedImage || '',
          });

          toast.success('Equipment analysis completed!');
          setIsAnalyzing(false);
          setCurrentJobId(null);
        } else if (result.status === 'failed') {
          // Analysis failed
          throw new Error(result.error_message || 'Analysis failed');
        } else if (result.status === 'pending' || result.status === 'processing') {
          // Still processing, continue polling
          if (retries < maxRetries) {
            retries++;
            setTimeout(checkStatus, 2000); // Check again in 2 seconds
          } else {
            throw new Error('Analysis timed out. Please try again.');
          }
        }
      } catch (err) {
        console.error('Error checking analysis status:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to check analysis status';
        setError(errorMessage);
        toast.error(errorMessage);
        setIsAnalyzing(false);
        setCurrentJobId(null);
      }
    };

    await checkStatus();
  }, [addAnalysisResult, capturedImage]);

  // Handle image analysis with quality assessment
  const analyzeImage = useCallback(async (imageData: string, fileName: string) => {
    const startTime = performance.now();
    setPreAnalysisTime(startTime);
    setIsAnalyzing(true);
    setError(null);
    setEquipmentItems([]);
    setAnalysisMetadata(null);
    setAnalysisResult(null);
    setCapturedImage(`data:image/jpeg;base64,${imageData}`);
    setImageFileName(fileName);
    setAnalysisStatus('pending');
    setImageQualityMetrics(null);

    try {
      // Perform client-side image quality analysis
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = async () => {
          try {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);

            // Analyze image quality
            const qualityMetrics = ImageAnalysisUtils.analyzeImageQuality(canvas);
            setImageQualityMetrics(qualityMetrics);

            // Show quality feedback to user
            if (qualityMetrics.quality === 'poor') {
              toast.error(`Image quality is ${qualityMetrics.quality}. Consider retaking for better results.`);
            } else if (qualityMetrics.quality === 'fair') {
              toast.warning(`Image quality is ${qualityMetrics.quality}. Results may vary.`);
            } else {
              toast.success(`Image quality is ${qualityMetrics.quality}! Proceeding with analysis.`);
            }

            resolve(true);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = reject;
        img.src = `data:image/jpeg;base64,${imageData}`;
      });

      // Start analysis job
      const jobResponse: AnalysisJobResponse = await analysisApi.analyzeImage(imageData);
      
      setCurrentJobId(jobResponse.job_id);
      toast.success('Analysis job created. Processing image...');

      // Start polling for results
      await pollAnalysisResult(jobResponse.job_id);
      
    } catch (err) {
      console.error('Analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsAnalyzing(false);
      setCurrentJobId(null);
      setImageQualityMetrics(null);
    }
  }, [pollAnalysisResult]);

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

  // Reset scanner
  const resetScannerComplete = useCallback(() => {
    setAnalysisResult(null);
    setEquipmentItems([]);
    setAnalysisMetadata(null);
    setError(null);
    setCapturedImage(null);
    setImageFileName('');
    setCurrentJobId(null);
    setAnalysisStatus('');
  }, []);

  // Navigate to register with pre-filled data for a specific equipment item
  const registerSingleEquipment = useCallback((equipment: EquipmentItem) => {
    navigate('/register', {
      state: {
        analysisData: {
          item_type: equipment.type,
          description: equipment.description,
          condition: equipment.condition,
          weight: equipment.weight,
          suggested_tag: equipment.suggested_asset_tag,
          suggested_location: equipment.location_in_image,
          notes: `Location in image: ${equipment.location_in_image}`,
        },
        capturedImage,
      },
    });
  }, [capturedImage, navigate]);

  // Navigate to register with pre-filled data (legacy function for backward compatibility)
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
            <Button color="inherit" size="small" onClick={resetScannerComplete}>
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

      {/* Analysis Progress with Status */}
      {isAnalyzing && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box textAlign="center">
            <Typography variant="h6" gutterBottom>
              {analysisStatus === 'pending' ? 'Starting Analysis...' :
               analysisStatus === 'processing' ? 'Processing Image...' :
               'Analyzing Equipment...'}
            </Typography>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              {currentJobId && (
                <>Job ID: {currentJobId}<br /></>
              )}
              Our AI is identifying the equipment and analyzing their properties
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Equipment Analysis Results */}
      {equipmentItems.length > 0 && !isAnalyzing && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Typography variant="h6">
              Equipment Analysis Results
            </Typography>
            <Box display="flex" gap={1}>
              <Tooltip title="Analyze another image">
                <IconButton size="small" onClick={resetScannerComplete}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Analysis Metadata */}
          {analysisMetadata && (
            <Box mb={3}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Total Items
                  </Typography>
                  <Typography variant="h6">
                    {analysisMetadata.totalItems}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Image Quality
                  </Typography>
                  <Chip
                    label={analysisMetadata.imageQuality}
                    color={
                      analysisMetadata.imageQuality.toLowerCase() === 'excellent' ? 'success' :
                      analysisMetadata.imageQuality.toLowerCase() === 'good' ? 'primary' :
                      'warning'
                    }
                    size="small"
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Confidence
                  </Typography>
                  <Chip
                    label={`${Math.round(analysisMetadata.confidenceScore * 100)}%`}
                    color={getConfidenceColor(analysisMetadata.confidenceScore)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Processing Time
                  </Typography>
                  <Typography variant="body1">
                    {analysisMetadata.processingTime.toFixed(1)}s
                  </Typography>
                </Grid>
              </Grid>

              {analysisMetadata.recommendations && (
                <Box mt={2}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    AI Recommendations
                  </Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {analysisMetadata.recommendations}
                  </Alert>
                </Box>
              )}
            </Box>
          )}

          <Divider sx={{ mb: 3 }} />

          {/* Image Preview */}
          {capturedImage && (
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom>
                Analyzed Image
              </Typography>
              <Box
                sx={{
                  width: '100%',
                  maxWidth: 400,
                  height: 250,
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
              </Box>
            </Box>
          )}

          {/* Equipment Items List */}
          <Typography variant="h6" gutterBottom>
            Detected Equipment ({equipmentItems.length} items)
          </Typography>
          
          <Grid container spacing={2}>
            {equipmentItems.map((equipment, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 2,
                      transform: 'translateY(-2px)',
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {equipment.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {equipment.description}
                    </Typography>

                    {equipment.weight && (
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="body2" fontWeight="bold">
                          Weight:
                        </Typography>
                        <Typography variant="body2">
                          {equipment.weight}
                        </Typography>
                      </Box>
                    )}

                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Typography variant="body2" fontWeight="bold">
                        Condition:
                      </Typography>
                      <Chip
                        label={equipment.condition}
                        color={
                          equipment.condition.toLowerCase() === 'excellent' ? 'success' :
                          equipment.condition.toLowerCase() === 'good' ? 'primary' :
                          equipment.condition.toLowerCase() === 'fair' ? 'warning' : 'error'
                        }
                        size="small"
                      />
                    </Box>

                    <Box mb={1}>
                      <Typography variant="body2" fontWeight="bold" gutterBottom>
                        Location in Image:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {equipment.location_in_image}
                      </Typography>
                    </Box>

                    <Box mb={2}>
                      <Typography variant="body2" fontWeight="bold" gutterBottom>
                        Suggested Asset Tag:
                      </Typography>
                      <Typography variant="body2" color="primary" fontFamily="monospace">
                        {equipment.suggested_asset_tag}
                      </Typography>
                    </Box>
                  </CardContent>

                  <Box p={2} pt={0}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => registerSingleEquipment(equipment)}
                      startIcon={<SaveIcon />}
                      sx={{
                        backgroundColor: 'primary.main',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
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
              onClick={resetScannerComplete}
              startIcon={<RefreshIcon />}
            >
              Scan Another
            </Button>
          </Box>
        </Paper>
      )}

      {/* Upload Interface */}
      {equipmentItems.length === 0 && !isAnalyzing && (
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
      {equipmentItems.length === 0 && !isAnalyzing && (
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