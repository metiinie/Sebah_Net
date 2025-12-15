import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Spinner } from './components/Spinner';
import { EnhancedHeader } from './components/EnhancedHeader';

// Lazy load components for better performance
const Auth = lazy(() => import('./pages/Auth').then(m => ({ default: m.Auth })));
const Choice = lazy(() => import('./pages/Choice').then(m => ({ default: m.Choice })));
const Movies = lazy(() => import('./pages/Movies').then(m => ({ default: m.Movies })));
const Music = lazy(() => import('./pages/Music').then(m => ({ default: m.Music })));
const Upload = lazy(() => import('./pages/Upload'));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const StreamingAdmin = lazy(() => import('./pages/StreamingAdmin').then(m => ({ default: m.StreamingAdmin })));
const SearchAndDiscovery = lazy(() => import('./pages/SearchAndDiscovery').then(m => ({ default: m.SearchAndDiscovery })));
const Personalization = lazy(() => import('./pages/Personalization').then(m => ({ default: m.Personalization })));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
              <Suspense fallback={<Spinner label="Loading app..." />}>
                <EnhancedHeader />
                <main className="relative">
                  <Routes>
                    <Route path="/" element={<Auth />} />
                    <Route
                      path="/choice"
                      element={
                        <ProtectedRoute>
                          <Choice />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/movies"
                      element={
                        <ProtectedRoute>
                          <Movies />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/music"
                      element={
                        <ProtectedRoute>
                          <Music />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/upload"
                      element={
                        <ProtectedRoute>
                          <Upload />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute>
                          <Admin />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/streaming-admin"
                      element={
                        <ProtectedRoute>
                          <StreamingAdmin />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/search"
                      element={
                        <ProtectedRoute>
                          <SearchAndDiscovery />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/personalization"
                      element={
                        <ProtectedRoute>
                          <Personalization />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </Suspense>
            </div>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#1e293b',
                  color: '#fff',
                  border: '1px solid #334155',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
