import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
    Box,
    Button,
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
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Start camera
    const startCamera = useCallback(async () => {
        console.log('Starting camera with facingMode:', facingMode);
        setIsLoading(true);
        setError(null);

        try {
            // Stop existing stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported in this browser');
            }

            console.log('Requesting camera permission...');

            // Request camera access
            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Camera permission granted');

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            setHasPermission(true);
            setIsLoading(false);

        } catch (err: any) {
            console.error('Camera error:', err);
            setHasPermission(false);
            setIsLoading(false);

            if (err.name === 'NotAllowedError') {
                setError('Camera access denied. Please allow camera permissions and try again.');
            } else if (err.name === 'NotFoundError') {
                setError('No camera found. Please connect a camera and try again.');
            } else if (err.name === 'NotReadableError') {
                setError('Camera is already in use by another application.');
            } else if (err.name === 'OverconstrainedError') {
                setError('Camera constraints not supported. Trying with different settings...');
            } else {
                setError(`Failed to access camera: ${err.message || err.name || 'Unknown error'}`);
            }
        }
    }, [facingMode]);

    // Stop camera
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    // Capture photo
    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) {
            setError('Camera not ready. Please try again.');
            return;
        }

        setIsCapturing(true);
        setError(null);

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (!context) {
                throw new Error('Could not get canvas context');
            }

            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw video frame to canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to base64
            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            const base64Data = dataURL.split(',')[1];

            if (base64Data) {
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
        startCamera();
    }, [startCamera]);

    // Start camera when component mounts or facingMode changes
    useEffect(() => {
        startCamera();

        return () => {
            stopCamera();
        };
    }, [startCamera, stopCamera]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    // Check secure context
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isSecureContext = window.isSecureContext ||
                window.location.protocol === 'https:' ||
                window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1';

            console.log('Secure context:', isSecureContext);
            console.log('Location:', window.location.href);

            if (!isSecureContext) {
                setError('Camera access requires HTTPS or localhost. Please use a secure connection.');
                setHasPermission(false);
                setIsLoading(false);
            }
        }
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
                    {/* Loading state */}
                    {(hasPermission === null || isLoading) && !error && (
                        <Box textAlign="center" color="white">
                            <CircularProgress color="primary" sx={{ mb: 2 }} />
                            <Typography>Requesting camera access...</Typography>
                            <Typography variant="body2" sx={{ mt: 1, opacity: 0.7 }}>
                                Please allow camera permissions in your browser
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1, opacity: 0.5 }}>
                                Look for permission popup at the top of your browser
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={retryCamera}
                                sx={{ mt: 2, color: 'white', borderColor: 'white' }}
                            >
                                Cancel & Retry
                            </Button>
                        </Box>
                    )}

                    {/* Permission denied state */}
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

                    {/* Camera active state */}
                    {hasPermission && !error && !isLoading && (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />

                            {/* Hidden canvas for capture */}
                            <canvas
                                ref={canvasRef}
                                style={{ display: 'none' }}
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
                {hasPermission && !error && !isLoading && (
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

                {/* Show retry button when there's an error */}
                {error && (
                    <Button
                        variant="outlined"
                        size="large"
                        onClick={retryCamera}
                        startIcon={<RefreshIcon />}
                        sx={{
                            minWidth: 200,
                            height: 56,
                            fontSize: '1.1rem',
                        }}
                    >
                        Try Again
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default CameraCapture;