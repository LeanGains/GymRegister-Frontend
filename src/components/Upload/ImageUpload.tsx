import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  LinearProgress,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  Delete as DeleteIcon,
  PhotoCamera as CameraIcon,
} from '@mui/icons-material';
import { imageUtils } from '../../services/api';

interface ImageUploadProps {
  onImageSelect: (imageData: string, fileName: string) => void;
  onCameraClick: () => void;
  isAnalyzing?: boolean;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  onCameraClick,
  isAnalyzing = false,
  maxSize = 10,
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Process selected file
  const processFile = useCallback(async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      // Validate file type
      if (!acceptedFormats.includes(file.type)) {
        throw new Error(`Unsupported file type. Please use: ${acceptedFormats.join(', ')}`);
      }

      // Validate file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSize) {
        throw new Error(`File too large. Maximum size is ${maxSize}MB`);
      }

      // Compress image if needed
      const compressedFile = await imageUtils.compressImage(file, 1280, 0.8);
      
      // Convert to base64
      const base64Data = await imageUtils.fileToBase64(compressedFile);
      
      // Create preview
      const previewUrl = URL.createObjectURL(compressedFile);
      
      setSelectedFile(compressedFile);
      setPreview(previewUrl);
      
      // Notify parent component
      onImageSelect(base64Data, file.name);
      
    } catch (err) {
      console.error('File processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process image');
      setSelectedFile(null);
      setPreview(null);
    } finally {
      setIsProcessing(false);
    }
  }, [acceptedFormats, maxSize, onImageSelect]);

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const onDropRejected = useCallback((rejectedFiles: any[]) => {
    const rejection = rejectedFiles[0];
    if (rejection?.errors?.[0]) {
      const error = rejection.errors[0];
      if (error.code === 'file-too-large') {
        setError(`File too large. Maximum size is ${maxSize}MB`);
      } else if (error.code === 'file-invalid-type') {
        setError(`Invalid file type. Please use: ${acceptedFormats.join(', ')}`);
      } else {
        setError('File rejected. Please try another image.');
      }
    }
  }, [maxSize, acceptedFormats]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'image/*': acceptedFormats.map(format => format.replace('image/', '.')),
    },
    maxSize: maxSize * 1024 * 1024,
    multiple: false,
    disabled: isAnalyzing || isProcessing,
  });

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    setError(null);
  }, [preview]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!selectedFile ? (
        <Paper
          {...getRootProps()}
          sx={{
            p: 4,
            textAlign: 'center',
            cursor: isAnalyzing || isProcessing ? 'not-allowed' : 'pointer',
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            bgcolor: isDragActive ? 'action.hover' : 'background.paper',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderColor: isAnalyzing || isProcessing ? 'grey.300' : 'primary.main',
              bgcolor: isAnalyzing || isProcessing ? 'background.paper' : 'action.hover',
            },
            opacity: isAnalyzing || isProcessing ? 0.6 : 1,
          }}
        >
          <input {...getInputProps()} />
          
          {isProcessing ? (
            <Box>
              <LinearProgress sx={{ mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Processing image...
              </Typography>
            </Box>
          ) : (
            <>
              <UploadIcon
                sx={{
                  fontSize: 64,
                  color: isDragActive ? 'primary.main' : 'text.secondary',
                  mb: 2,
                }}
              />
              
              <Typography variant="h6" gutterBottom>
                {isDragActive ? 'Drop image here' : 'Upload Equipment Image'}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Drag and drop an image here, or click to select
              </Typography>
              
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
                Supported formats: JPEG, PNG, WebP • Max size: {maxSize}MB
              </Typography>

              <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  disabled={isAnalyzing || isProcessing}
                >
                  Choose File
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<CameraIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCameraClick();
                  }}
                  disabled={isAnalyzing || isProcessing}
                >
                  Use Camera
                </Button>
              </Box>
            </>
          )}
        </Paper>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" alignItems="flex-start" gap={2}>
            {/* Image preview */}
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: 1,
                overflow: 'hidden',
                bgcolor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <ImageIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
              )}
            </Box>

            {/* File info */}
            <Box flex={1}>
              <Typography variant="subtitle1" gutterBottom>
                {selectedFile.name}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {formatFileSize(selectedFile.size)} • {selectedFile.type}
              </Typography>
              
              <Typography variant="body2" color="success.main" gutterBottom>
                ✓ Ready for analysis
              </Typography>

              <Box display="flex" gap={1} mt={2}>
                <Button
                  size="small"
                  onClick={clearSelection}
                  startIcon={<DeleteIcon />}
                  disabled={isAnalyzing}
                >
                  Remove
                </Button>
                
                <Button
                  size="small"
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCameraClick();
                  }}
                  startIcon={<CameraIcon />}
                  disabled={isAnalyzing}
                >
                  Use Camera Instead
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default ImageUpload;