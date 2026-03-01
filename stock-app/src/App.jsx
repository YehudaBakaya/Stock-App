import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './components/Profile/ThemeProvider';
import { ToastProvider } from './context/ToastContext';

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
    return <div className="min-h-screen bg-gray-950" />;
  }

  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </PrivateRoute>
                }
              />

              <Route
                path="/Stocks"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Stocks />
                    </Layout>
                  </PrivateRoute>
                }
              />

              <Route
                path="/portfolio"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Portfolio />
                    </Layout>
                  </PrivateRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Profile />
                    </Layout>
                  </PrivateRoute>
                }
              />

            <Route
              path="/trading"
              element={
                <PrivateRoute>
                  <Layout>
                    <TradingGoals />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/analysis"
              element={
                <PrivateRoute>
                  <Layout>
                    <StockAnalysis />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/watchlist"
              element={
                <PrivateRoute>
                  <Layout>
                    <Watchlist />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/transactions"
              element={
                <PrivateRoute>
                  <Layout>
                    <Transactions />
                  </Layout>
                </PrivateRoute>
              }
            />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
