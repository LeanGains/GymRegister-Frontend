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
    Fade,
    Zoom,
} from '@mui/material';
import {
    CameraAlt as CameraIcon,
    FlipCameraIos as FlipIcon,
    Close as CloseIcon,
    Refresh as RefreshIcon,
    FlashOn as FlashIcon,
    FlashOff as FlashOffIcon,
    GridOn as GridIcon,
    GridOff as GridOffIcon,
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
    const [showGrid, setShowGrid] = useState(true);
    const [captureFlash, setCaptureFlash] = useState(false);
    const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
    const [videoReady, setVideoReady] = useState(false);

    // Enumerate available cameras
    const enumerateCameras = useCallback(async () => {
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const cameras = devices.filter(device => device.kind === 'videoinput');
                setAvailableCameras(cameras);
                console.log('Available cameras:', cameras.length);
            }
        } catch (err) {
            console.warn('Could not enumerate cameras:', err);
        }
    }, []);

    // Start camera with enhanced error handling
    const startCamera = useCallback(async () => {
        console.log('Starting camera with facingMode:', facingMode);
        setIsLoading(true);
        setError(null);
        setVideoReady(false);

        try {
            // Stop existing stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
            }

            // Enumerate cameras first
            await enumerateCameras();

            console.log('Requesting camera permission...');

            // Enhanced constraints for better quality
            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1920, max: 1920 },
                    height: { ideal: 1080, max: 1080 },
                    frameRate: { ideal: 30, max: 60 },
                    focusMode: 'continuous',
                    whiteBalanceMode: 'auto',
                    exposureMode: 'continuous',
                },
                audio: false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Camera permission granted');

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                
                // Wait for video metadata to load
                videoRef.current.onloadedmetadata = () => {
                    console.log('Video metadata loaded:', {
                        width: videoRef.current?.videoWidth,
                        height: videoRef.current?.videoHeight,
                    });
                    setVideoReady(true);
                    setIsLoading(false);
                };

                await videoRef.current.play();
            }

            setHasPermission(true);

        } catch (err: any) {
            console.error('Camera error:', err);
            setHasPermission(false);
            setIsLoading(false);
            setVideoReady(false);

            // Enhanced error messages
            if (err.name === 'NotAllowedError') {
                setError('Camera access denied. Please click the camera icon in your browser\'s address bar and allow camera access, then try again.');
            } else if (err.name === 'NotFoundError') {
                setError('No camera found on this device. Please connect a camera and refresh the page.');
            } else if (err.name === 'NotReadableError') {
                setError('Camera is already in use by another application. Please close other camera apps and try again.');
            } else if (err.name === 'OverconstrainedError') {
                setError('Camera settings not supported. Trying with basic settings...');
                // Try with fallback constraints
                setTimeout(() => startCameraFallback(), 1000);
                return;
            } else if (err.name === 'TypeError') {
                setError('Camera API not available. Please ensure you\'re using HTTPS or localhost.');
            } else {
                setError(`Camera error: ${err.message || err.name || 'Unknown error'}. Please refresh and try again.`);
            }
        }
    }, [facingMode, enumerateCameras]);

    // Fallback camera start with basic constraints
    const startCameraFallback = useCallback(async () => {
        console.log('Trying camera fallback...');
        setIsLoading(true);
        setError(null);

        try {
            const basicConstraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            const stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    setVideoReady(true);
                    setIsLoading(false);
                };
                await videoRef.current.play();
            }

            setHasPermission(true);
        } catch (err) {
            console.error('Camera fallback error:', err);
            setHasPermission(false);
            setIsLoading(false);
            setError('Unable to access camera even with basic settings. Please check your camera permissions.');
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

    // Enhanced capture photo with flash effect
    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || !videoReady) {
            setError('Camera not ready. Please wait a moment and try again.');
            return;
        }

        setIsCapturing(true);
        setError(null);

        // Flash effect
        setCaptureFlash(true);
        setTimeout(() => setCaptureFlash(false), 150);

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (!context) {
                throw new Error('Could not get canvas context');
            }

            // Set canvas dimensions to match video with high quality
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;
            
            console.log('Capturing at resolution:', videoWidth, 'x', videoHeight);
            
            canvas.width = videoWidth;
            canvas.height = videoHeight;

            // Clear canvas and draw video frame
            context.clearRect(0, 0, videoWidth, videoHeight);
            context.drawImage(video, 0, 0, videoWidth, videoHeight);

            // Convert to base64 with high quality
            const dataURL = canvas.toDataURL('image/jpeg', 0.9);
            const base64Data = dataURL.split(',')[1];

            if (base64Data && base64Data.length > 0) {
                console.log('Capture successful, data size:', Math.round(base64Data.length / 1024), 'KB');
                onCapture(base64Data);
            } else {
                throw new Error('No image data captured');
            }
        } catch (err) {
            console.error('Capture error:', err);
            setError('Failed to capture image. Please try again or check your camera connection.');
        } finally {
            setTimeout(() => setIsCapturing(false), 500); // Slight delay for better UX
        }
    }, [onCapture, videoReady]);

    // Toggle camera (front/back)
    const toggleCamera = useCallback(() => {
        if (availableCameras.length > 1) {
            setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
        }
    }, [availableCameras.length]);

    // Toggle grid
    const toggleGrid = useCallback(() => {
        setShowGrid(prev => !prev);
    }, []);

    // Retry camera access
    const retryCamera = useCallback(() => {
        setError(null);
        setHasPermission(null);
        setVideoReady(false);
        startCamera();
    }, [startCamera]);

    // Grid overlay component
    const GridOverlay = React.memo(() => (
        <Box
            sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                opacity: showGrid ? 0.3 : 0,
                transition: 'opacity 0.2s ease',
            }}
        >
            {/* Rule of thirds grid */}
            <svg width="100%" height="100%" style={{ position: 'absolute' }}>
                <defs>
                    <pattern id="grid" width="33.333%" height="33.333%" patternUnits="objectBoundingBox">
                        <rect width="100%" height="100%" fill="none" stroke="white" strokeWidth="1" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                {/* Vertical lines */}
                <line x1="33.333%" y1="0" x2="33.333%" y2="100%" stroke="white" strokeWidth="1" />
                <line x1="66.666%" y1="0" x2="66.666%" y2="100%" stroke="white" strokeWidth="1" />
                {/* Horizontal lines */}
                <line x1="0" y1="33.333%" x2="100%" y2="33.333%" stroke="white" strokeWidth="1" />
                <line x1="0" y1="66.666%" x2="100%" y2="66.666%" stroke="white" strokeWidth="1" />
            </svg>
        </Box>
    ));

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