import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { Helmet } from 'react-helmet-async';

import Layout from './components/Layout/Layout';
import EquipmentScanner from './pages/EquipmentScanner';
import RegisterAsset from './pages/RegisterAsset';
import ViewAssets from './pages/ViewAssets';
import SearchAsset from './pages/SearchAsset';
import Reports from './pages/Reports';
import NotFound from './pages/NotFound';

function App() {
  return (
    <>
      <Helmet>
        <title>GymRegister - AI Equipment Tracking</title>
        <meta 
          name="description" 
          content="AI-powered gym equipment tracking system for comprehensive asset management. Scan, register, and track gym equipment with advanced AI detection." 
        />
        <meta name="keywords" content="gym, equipment, tracking, AI, asset management, fitness, inventory" />
        <meta property="og:title" content="GymRegister - AI Equipment Tracking" />
        <meta property="og:description" content="AI-powered gym equipment tracking system for comprehensive asset management" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Layout>
          <Container maxWidth="xl" sx={{ py: 3, flex: 1 }}>
            <Routes>
              {/* Default route redirects to scanner */}
              <Route path="/" element={<Navigate to="/scanner" replace />} />
              
              {/* Main application routes */}
              <Route path="/scanner" element={<EquipmentScanner />} />
              <Route path="/register" element={<RegisterAsset />} />
              <Route path="/assets" element={<ViewAssets />} />
              <Route path="/search" element={<SearchAsset />} />
              <Route path="/reports" element={<Reports />} />
              
              {/* 404 page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Container>
        </Layout>
      </Box>
    </>
  );
}

export default App;