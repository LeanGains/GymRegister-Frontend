// Image Analysis Utilities for Equipment Scanner
export interface ImageQualityMetrics {
  resolution: {
    width: number;
    height: number;
    megapixels: number;
  };
  brightness: number;
  contrast: number;
  sharpness: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
}

export interface ProcessedImageData {
  base64: string;
  quality: ImageQualityMetrics;
  fileSize: number;
  processingTime: number;
}

export class ImageAnalysisUtils {
  // Analyze image quality metrics
  static analyzeImageQuality(canvas: HTMLCanvasElement): ImageQualityMetrics {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Calculate basic metrics
    const brightness = this.calculateBrightness(data);
    const contrast = this.calculateContrast(data);
    const sharpness = this.calculateSharpness(data, width, height);

    // Determine overall quality
    const quality = this.determineQuality(brightness, contrast, sharpness, width * height);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(brightness, contrast, sharpness, width * height);

    return {
      resolution: {
        width,
        height,
        megapixels: Math.round((width * height) / 1000000 * 10) / 10,
      },
      brightness,
      contrast,
      sharpness,
      quality,
      recommendations,
    };
  }

  // Calculate average brightness (0-255)
  private static calculateBrightness(data: Uint8ClampedArray): number {
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      // Calculate luminance using standard formula
      sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    return Math.round(sum / (data.length / 4));
  }

  // Calculate contrast using standard deviation
  private static calculateContrast(data: Uint8ClampedArray): number {
    const brightness = this.calculateBrightness(data);
    let variance = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      variance += Math.pow(luminance - brightness, 2);
    }
    
    const standardDeviation = Math.sqrt(variance / (data.length / 4));
    return Math.round(standardDeviation);
  }

  // Calculate sharpness using edge detection
  private static calculateSharpness(data: Uint8ClampedArray, width: number, height: number): number {
    let sharpnessSum = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Calculate gradients using Sobel operator
        const gx = 
          -1 * this.getGrayscale(data, idx - width * 4 - 4) +
          1 * this.getGrayscale(data, idx - width * 4 + 4) +
          -2 * this.getGrayscale(data, idx - 4) +
          2 * this.getGrayscale(data, idx + 4) +
          -1 * this.getGrayscale(data, idx + width * 4 - 4) +
          1 * this.getGrayscale(data, idx + width * 4 + 4);

        const gy = 
          -1 * this.getGrayscale(data, idx - width * 4 - 4) +
          -2 * this.getGrayscale(data, idx - width * 4) +
          -1 * this.getGrayscale(data, idx - width * 4 + 4) +
          1 * this.getGrayscale(data, idx + width * 4 - 4) +
          2 * this.getGrayscale(data, idx + width * 4) +
          1 * this.getGrayscale(data, idx + width * 4 + 4);

        sharpnessSum += Math.sqrt(gx * gx + gy * gy);
        count++;
      }
    }

    return Math.round(count > 0 ? sharpnessSum / count : 0);
  }

  // Helper function to get grayscale value
  private static getGrayscale(data: Uint8ClampedArray, idx: number): number {
    if (idx < 0 || idx >= data.length) return 0;
    return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  // Determine overall image quality
  private static determineQuality(
    brightness: number, 
    contrast: number, 
    sharpness: number, 
    pixels: number
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    let score = 0;

    // Brightness score (optimal range: 120-180)
    if (brightness >= 120 && brightness <= 180) score += 3;
    else if (brightness >= 100 && brightness <= 200) score += 2;
    else if (brightness >= 80 && brightness <= 220) score += 1;

    // Contrast score (higher is generally better, but not too high)
    if (contrast >= 50 && contrast <= 80) score += 3;
    else if (contrast >= 30 && contrast <= 100) score += 2;
    else if (contrast >= 20 && contrast <= 120) score += 1;

    // Sharpness score (higher is better)
    if (sharpness >= 15) score += 3;
    else if (sharpness >= 10) score += 2;
    else if (sharpness >= 5) score += 1;

    // Resolution score
    if (pixels >= 2073600) score += 3; // 1920x1080+
    else if (pixels >= 921600) score += 2; // 1280x720+
    else if (pixels >= 307200) score += 1; // 640x480+

    // Determine quality based on total score
    if (score >= 10) return 'excellent';
    if (score >= 7) return 'good';
    if (score >= 4) return 'fair';
    return 'poor';
  }

  // Generate recommendations based on analysis
  private static generateRecommendations(
    brightness: number, 
    contrast: number, 
    sharpness: number, 
    pixels: number
  ): string[] {
    const recommendations: string[] = [];

    // Brightness recommendations
    if (brightness < 80) {
      recommendations.push('📡 Increase lighting or move to a brighter area');
    } else if (brightness > 220) {
      recommendations.push('☀️ Reduce lighting or avoid direct sunlight');
    }

    // Contrast recommendations
    if (contrast < 20) {
      recommendations.push('🎨 Improve contrast by adjusting lighting or background');
    }

    // Sharpness recommendations
    if (sharpness < 5) {
      recommendations.push('🎯 Hold camera steady and ensure equipment is in focus');
    }

    // Resolution recommendations
    if (pixels < 307200) {
      recommendations.push('📱 Move closer to equipment or use higher camera resolution');
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('✨ Image quality is optimal for analysis!');
    }

    return recommendations;
  }

  // Process and optimize image for analysis
  static async processImageForAnalysis(
    canvas: HTMLCanvasElement,
    quality: number = 0.9
  ): Promise<ProcessedImageData> {
    const startTime = performance.now();

    // Analyze quality
    const qualityMetrics = this.analyzeImageQuality(canvas);

    // Convert to base64
    const dataURL = canvas.toDataURL('image/jpeg', quality);
    const base64 = dataURL.split(',')[1];

    // Calculate file size (approximate)
    const fileSize = Math.round((base64.length * 3) / 4);

    const processingTime = performance.now() - startTime;

    return {
      base64,
      quality: qualityMetrics,
      fileSize,
      processingTime,
    };
  }

  // Enhance image before analysis (basic filters)
  static enhanceImage(canvas: HTMLCanvasElement, options: {
    brightness?: number;
    contrast?: number;
    sharpen?: boolean;
  } = {}): HTMLCanvasElement {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply brightness adjustment
    if (options.brightness !== undefined) {
      const brightnessFactor = options.brightness;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, data[i] + brightnessFactor));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightnessFactor));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightnessFactor));
      }
    }

    // Apply contrast adjustment
    if (options.contrast !== undefined) {
      const contrastFactor = (259 * (options.contrast + 255)) / (255 * (259 - options.contrast));
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, contrastFactor * (data[i] - 128) + 128));
        data[i + 1] = Math.min(255, Math.max(0, contrastFactor * (data[i + 1] - 128) + 128));
        data[i + 2] = Math.min(255, Math.max(0, contrastFactor * (data[i + 2] - 128) + 128));
      }
    }

    // Apply sharpening filter
    if (options.sharpen) {
      this.applySharpenFilter(data, canvas.width, canvas.height);
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  // Apply sharpening filter using convolution
  private static applySharpenFilter(data: Uint8ClampedArray, width: number, height: number): void {
    const sharpenKernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];

    const newData = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) { // RGB channels only
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              const kernelIdx = (ky + 1) * 3 + (kx + 1);
              sum += data[idx] * sharpenKernel[kernelIdx];
            }
          }
          const newIdx = (y * width + x) * 4 + c;
          newData[newIdx] = Math.min(255, Math.max(0, sum));
        }
      }
    }

    data.set(newData);
  }

  // Generate analysis tips based on equipment type
  static getEquipmentSpecificTips(equipmentType?: string): string[] {
    const generalTips = [
      '📋 Ensure equipment serial numbers and labels are visible',
      '🔍 Capture equipment from multiple angles if needed',
      '⚡ Check that all cables and attachments are visible',
      '📏 Include reference objects for size estimation',
    ];

    const specificTips: { [key: string]: string[] } = {
      'treadmill': [
        '🏃‍♂️ Capture the control panel and display clearly',
        '⚙️ Show the belt condition and motor housing',
        '📊 Include any usage or maintenance indicators',
      ],
      'weights': [
        '🏋️‍♂️ Ensure weight markings are clearly visible',
        '🔢 Show weight stack or individual weight values',
        '🔧 Capture any adjustment mechanisms',
      ],
      'bike': [
        '🚲 Show the resistance mechanism and display',
        '🪑 Capture seat and handlebar adjustment points',
        '⚙️ Include pedal and flywheel condition',
      ],
    };

    const typeKey = equipmentType?.toLowerCase();
    return [...generalTips, ...(specificTips[typeKey || ''] || [])];
  }
}

export default ImageAnalysisUtils;