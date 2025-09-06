import React, { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import {
  Box,
  Button,
  Paper,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  FlipCameraIos as FlipIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
  isAnalyzing?: boolean;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onClose,
  isAnalyzing = false,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Video constraints for better quality
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: facingMode,
  };

  // Handle camera permission
  const handleUserMedia = useCallback(() => {
    setHasPermission(true);
    setError(null);
  }, []);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    console.error('Camera error:', error);
    setHasPermission(false);
    
    if (typeof error === 'string') {
      setError(error);
    } else if (error.name === 'NotAllowedError') {
      setError('Camera access denied. Please allow camera permissions and try again.');
    } else if (error.name === 'NotFoundError') {
      setError('No camera found. Please connect a camera and try again.');
    } else if (error.name === 'NotReadableError') {
      setError('Camera is already in use by another application.');
    } else {
      setError('Failed to access camera. Please check your camera settings.');
    }
  }, []);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!webcamRef.current) return;
    
    setIsCapturing(true);
    
    try {
      const imageSrc = webcamRef.current.getScreenshot({
        width: 1280,
        height: 720,
        format: 'image/jpeg',
        quality: 0.8,
      });
      
      if (imageSrc) {
        // Remove data:image/jpeg;base64, prefix for API
        const base64Data = imageSrc.split(',')[1];
        onCapture(base64Data);
      } else {
        setError('Failed to capture image. Please try again.');
      }
    } catch (err) {
      console.error('Capture error:', err);
      setError('Failed to capture image. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  }, [onCapture]);

  // Toggle camera (front/back)
  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // Retry camera access
  const retryCamera = useCallback(() => {
    setError(null);
    setHasPermission(null);
  }, []);

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: '800px',
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Equipment Scanner</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ m: 2 }}
            action={
              <Button color="inherit" size="small" onClick={retryCamera}>
                <RefreshIcon sx={{ mr: 1 }} />
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'black',
            position: 'relative',
            minHeight: 400,
          }}
        >
          {hasPermission === null && !error && (
            <Box textAlign="center" color="white">
              <CircularProgress color="primary" sx={{ mb: 2 }} />
              <Typography>Requesting camera access...</Typography>
            </Box>
          )}

          {hasPermission === false && !error && (
            <Box textAlign="center" color="white" p={3}>
              <CameraIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom>
                Camera Access Required
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Please allow camera access to scan equipment
              </Typography>
              <Button variant="contained" onClick={retryCamera}>
                Try Again
              </Button>
            </Box>
          )}

          {hasPermission && !error && (
            <>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                onUserMedia={handleUserMedia}
                onUserMediaError={handleUserMediaError}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />

              {/* Camera overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  p: 2,
                  pointerEvents: 'none',
                }}
              >
                {/* Top controls */}
                <Box display="flex" justifyContent="flex-end">
                  <IconButton
                    onClick={toggleCamera}
                    sx={{
                      color: 'white',
                      bgcolor: 'rgba(0,0,0,0.5)',
                      pointerEvents: 'auto',
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.7)',
                      },
                    }}
                  >
                    <FlipIcon />
                  </IconButton>
                </Box>

                {/* Center guide */}
                <Box
                  sx={{
                    alignSelf: 'center',
                    width: 250,
                    height: 250,
                    border: '2px solid rgba(255,255,255,0.8)',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'white',
                      textAlign: 'center',
                      bgcolor: 'rgba(0,0,0,0.5)',
                      p: 1,
                      borderRadius: 1,
                    }}
                  >
                    Position equipment in frame
                  </Typography>
                </Box>

                {/* Bottom space for controls */}
                <Box height={80} />
              </Box>
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
        {hasPermission && !error && (
          <Button
            variant="contained"
            size="large"
            onClick={capturePhoto}
            disabled={isCapturing || isAnalyzing}
            startIcon={
              isCapturing || isAnalyzing ? (
                <CircularProgress size={20} />
              ) : (
                <CameraIcon />
              )
            }
            sx={{
              minWidth: 200,
              height: 56,
              fontSize: '1.1rem',
            }}
          >
            {isCapturing
              ? 'Capturing...'
              : isAnalyzing
              ? 'Analyzing...'
              : 'Capture Photo'
            }
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CameraCapture;