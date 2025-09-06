# GymRegister Frontend 🏋️‍♂️

Modern React frontend for GymRegister - AI-powered gym equipment tracking system with comprehensive asset management capabilities.

## 🚀 Features

### Core Functionality
- **🤖 AI Equipment Scanner** - Advanced image analysis using GPT-4o for equipment detection
- **📱 Camera Integration** - Native camera support for mobile and desktop
- **📋 Asset Management** - Complete CRUD operations for gym equipment
- **🔍 Smart Search** - Quick asset lookup with real-time filtering
- **📊 Analytics Dashboard** - Comprehensive reports and statistics
- **📱 Mobile-First Design** - Responsive UI optimized for all devices

### Technical Features
- **⚡ React 18** with TypeScript for type safety
- **🎨 Material-UI** for consistent, accessible design
- **🗄️ Zustand** for lightweight state management
- **📡 React Query** for efficient data fetching
- **🔄 PWA Ready** - Installable web app with offline capabilities
- **🐳 Docker Support** - Containerized deployment
- **🔒 Security First** - HTTPS, CSP headers, and secure defaults

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Docker** (optional, for containerized deployment)
- **Backend API** - GymRegister backend service
- **OpenAI API Key** - For AI equipment detection

## 🛠️ Installation

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/gh-leangains/GymRegister-Frontend.git
   cd GymRegister-Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

### Production Deployment

#### Using Docker

1. **Build the image**
   ```bash
   docker build -t gymregister-frontend .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:80 gymregister-frontend
   ```

#### Using Docker Compose

1. **Start all services**
   ```bash
   docker-compose up -d
   ```

2. **Access the application**
   ```
   http://localhost:3000
   ```

## 🏗️ Architecture

### Project Structure
```
src/
├── components/          # Reusable UI components
│   └── Layout/         # Main layout component
├── pages/              # Page components
│   ├── EquipmentScanner.tsx
│   ├── RegisterAsset.tsx
│   ├── ViewAssets.tsx
│   ├── SearchAsset.tsx
│   ├── Reports.tsx
│   └── NotFound.tsx
├── services/           # API and external services
│   └── api.ts         # Backend API integration
├── store/             # State management
│   └── assetStore.ts  # Zustand store
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

### State Management
- **Zustand** for global state (assets, UI state)
- **React Query** for server state and caching
- **Local Storage** persistence for offline capability

### API Integration
- RESTful API communication with backend
- Automatic retry and error handling
- Image compression and optimization
- Real-time data synchronization

## 🎯 Usage Guide

### Equipment Scanner
1. **Take Photo** - Use camera or upload image
2. **AI Analysis** - Automatic equipment and asset tag detection
3. **Register Assets** - One-click registration from detected items
4. **Location Tracking** - Update asset locations in real-time

### Asset Management
- **Register New Assets** - Manual asset registration form
- **View All Assets** - Filterable data grid with export
- **Search Assets** - Quick lookup by asset tag
- **Update Locations** - Real-time location management

### Reports & Analytics
- **Dashboard Overview** - Key metrics and statistics
- **Equipment Distribution** - Visual charts and graphs
- **Missing Assets** - Alerts and tracking
- **Audit Logs** - Complete activity history

## 🔧 Configuration

### Environment Variables

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:8000

# App Configuration
REACT_APP_APP_NAME=GymRegister
REACT_APP_VERSION=1.0.0

# Development
NODE_ENV=development
GENERATE_SOURCEMAP=true
```

### Backend Integration

The frontend expects the backend API to provide these endpoints:

```
GET    /api/assets              # Get all assets
GET    /api/assets/:tag         # Get asset by tag
POST   /api/assets              # Create new asset
PUT    /api/assets/:tag         # Update asset
DELETE /api/assets/:tag         # Delete asset
POST   /api/analyze             # Analyze image with AI
GET    /api/reports/statistics  # Get statistics
GET    /api/reports/audit-logs  # Get audit logs
```

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm test

# Coverage report
npm test -- --coverage

# E2E tests (if configured)
npm run test:e2e
```

### Test Structure
- **Unit Tests** - Component and utility testing
- **Integration Tests** - API and store integration
- **E2E Tests** - Full user workflow testing

## 📱 Mobile Support

### PWA Features
- **Installable** - Add to home screen
- **Offline Capable** - Works without internet
- **Camera Access** - Native camera integration
- **Push Notifications** - Asset alerts and updates

### Responsive Design
- **Mobile-First** - Optimized for touch interfaces
- **Tablet Support** - Enhanced layouts for larger screens
- **Desktop** - Full-featured experience

## 🔒 Security

### Frontend Security
- **Content Security Policy** - XSS protection
- **HTTPS Enforcement** - Secure communication
- **Input Validation** - Client-side validation
- **Secure Headers** - Security-focused HTTP headers

### Data Protection
- **Local Storage Encryption** - Sensitive data protection
- **API Token Management** - Secure authentication
- **Image Processing** - Client-side image compression

## 🚀 Performance

### Optimization Features
- **Code Splitting** - Lazy loading of routes
- **Image Compression** - Automatic image optimization
- **Caching Strategy** - Efficient data caching
- **Bundle Analysis** - Optimized build size

### Performance Metrics
- **Lighthouse Score** - 90+ across all categories
- **Core Web Vitals** - Optimized loading and interaction
- **Mobile Performance** - Fast on low-end devices

## 🔄 CI/CD

### GitHub Actions
```yaml
# Automated workflows
- Build and test on push
- Deploy to staging/production
- Security scanning
- Dependency updates
```

### Deployment Options
- **Vercel** - Automatic deployments
- **Netlify** - JAMstack deployment
- **Docker** - Containerized deployment
- **AWS S3** - Static site hosting

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** feature branch
3. **Implement** changes with tests
4. **Submit** pull request

### Code Standards
- **TypeScript** - Strict type checking
- **ESLint** - Code quality enforcement
- **Prettier** - Consistent formatting
- **Conventional Commits** - Standardized commit messages

## 📚 API Documentation

### Asset Management
```typescript
// Create asset
const asset = await assetApi.createAsset({
  asset_tag: 'DB-001',
  item_type: 'Dumbbell',
  description: '25 lb rubber dumbbell',
  location: 'Weight Room - Rack 3',
  condition: 'Good'
});

// Analyze image
const result = await analysisApi.analyzeImage(base64Image);
```

### State Management
```typescript
// Use asset store
const { assets, addAsset, updateAsset } = useAssetStore();

// Add new asset
addAsset({
  asset_tag: 'KB-001',
  item_type: 'Kettle Bell',
  location: 'Functional Area',
  // ... other properties
});
```

## 🐛 Troubleshooting

### Common Issues

**Camera not working**
- Check browser permissions
- Ensure HTTPS connection
- Verify camera hardware

**API connection failed**
- Check backend service status
- Verify API URL configuration
- Check network connectivity

**Build errors**
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify environment variables

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Material-UI** - Component library
- **OpenAI** - AI-powered equipment detection
- **React Team** - Framework and ecosystem
- **TypeScript** - Type safety and developer experience

## 📞 Support

- **Issues** - [GitHub Issues](../../issues)
- **Discussions** - [GitHub Discussions](../../discussions)
- **Documentation** - [Wiki](../../wiki)

---

**GymRegister Frontend** - Modern, AI-powered gym equipment tracking made simple. 🏋️‍♂️✨