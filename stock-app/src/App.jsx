import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './components/Profile/ThemeProvider';
import { ToastProvider } from './context/ToastContext';
import { WebSocketProvider } from './context/WebSocketContext';
import PageTransition from './components/ui/PageTransition';

import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Stocks from './pages/Stocks';
import Profile from './pages/Profile';
import TradingGoals from './pages/Trading Goals';
import Portfolio from "./pages/Portfolio"
import StockAnalysis from './pages/StockAnalysis';
import Watchlist from './pages/Watchlist';
import Transactions from './pages/Transactions';

const queryClient = new QueryClient();

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen app-bg" />;
  }

  return user ? children : <Navigate to="/login" replace />;
}

// AnimatePresence needs to track location changes
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout>
                <PageTransition><Dashboard /></PageTransition>
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/Stocks"
          element={
            <PrivateRoute>
              <Layout>
                <PageTransition><Stocks /></PageTransition>
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/portfolio"
          element={
            <PrivateRoute>
              <Layout>
                <PageTransition><Portfolio /></PageTransition>
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Layout>
                <PageTransition><Profile /></PageTransition>
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/trading"
          element={
            <PrivateRoute>
              <Layout>
                <PageTransition><TradingGoals /></PageTransition>
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/analysis"
          element={
            <PrivateRoute>
              <Layout>
                <PageTransition><StockAnalysis /></PageTransition>
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/watchlist"
          element={
            <PrivateRoute>
              <Layout>
                <PageTransition><Watchlist /></PageTransition>
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <PrivateRoute>
              <Layout>
                <PageTransition><Transactions /></PageTransition>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
        <AuthProvider>
          <WebSocketProvider>
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
          </WebSocketProvider>
        </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
