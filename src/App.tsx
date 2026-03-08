import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { SignInForm } from './components/auth/SignInForm';
import { SignUpForm } from './components/auth/SignUpForm';
import { Layout } from './components/layout/Layout';
import { Loader2 } from 'lucide-react';
import './i18n'; // Initialize i18n
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { WellnessProvider } from './contexts/WellnessContext';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./components/HomePage'));
const Journal = lazy(() => import('./components/Journal').then(module => ({ default: module.Journal })));
const Chat = lazy(() => import('./components/Chat').then(module => ({ default: module.Chat })));
const SettingsPage = lazy(() => import('./components/settings/SettingsPage'));
const ProfilePage = lazy(() => import('./components/profile/ProfilePage'));
const CheckIn = lazy(() => import('./components/checkin/CheckIn'));
const Breathe = lazy(() => import('./components/breathe/Breathe'));
const OnboardingPage = lazy(() => import('./components/onboarding/OnboardingPage'));
const ProDashboard = lazy(() => import('./components/pro/ProDashboard').then(module => ({ default: module.ProDashboard })));
const DiagnosticPage = lazy(() => import('./components/pro/features/DiagnosticPage'));
const TreatmentPlanPage = lazy(() => import('./components/pro/features/TreatmentPlanPage'));
const SpecialistCarePage = lazy(() => import('./components/pro/features/SpecialistCarePage'));
const WellnessDashboard = lazy(() => import('./components/WellnessDashboard').then(module => ({ default: module.WellnessDashboard })));

// Admin components (lazy loaded)
const BetaDashboard = lazy(() => import('./components/admin/BetaDashboard').then(module => ({ default: module.BetaDashboard })));
const AdminRoute = lazy(() => import('./components/admin/AdminRoute').then(module => ({ default: module.AdminRoute })));
const UnauthorizedPage = lazy(() => import('./components/admin/UnauthorizedPage').then(module => ({ default: module.UnauthorizedPage })));
const AdminDebug = lazy(() => import('./components/admin/AdminDebug').then(module => ({ default: module.AdminDebug })));
const ClinicalValidationPage = lazy(() => import('./pages/ClinicalValidationPage'));
const ArticlePage = lazy(() => import('./components/articles/ArticlePage'));



// Loading component
const LoadingScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50/30 to-emerald-50/20">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
            <p className="text-green-700 font-medium">Loading...</p>
        </div>
    </div>
);

// Auth wrapper component
const AuthWrapper: React.FC = () => {
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
    const { currentUser, loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    if (currentUser) {
        return <Navigate to="/" replace />;
    }

    if (authMode === 'signin') {
        return (
            <SignInForm
                onSwitchToSignUp={() => setAuthMode('signup')}
                onSuccess={() => {
                    // Navigation handled by auth state change
                }}
            />
        );
    }

    return (
        <SignUpForm
            onSwitchToSignIn={() => setAuthMode('signin')}
            onSuccess={() => {
                // Navigation handled by auth state change
            }}
        />
    );
};

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; requireOnboarding?: boolean }> = ({
    children,
    requireOnboarding = true
}) => {
    const { currentUser, userProfile, loading } = useAuth();
    const [isProfileLoaded, setIsProfileLoaded] = useState(false);

    // Effect to handle slight delay in profile loading after auth
    React.useEffect(() => {
        if (!loading && userProfile !== undefined) {
            setIsProfileLoaded(true);
        }
    }, [loading, userProfile]);

    if (loading || !isProfileLoaded) {
        return <LoadingScreen />;
    }

    if (!currentUser) {
        return <Navigate to="/auth" replace />;
    }

    // If user is logged in but hasn't completed onboarding, and this route requires it
    if (requireOnboarding && userProfile && !userProfile.onboardingComplete) {
        return <Navigate to="/onboarding" replace />;
    }

    // If user is on onboarding page but already completed it
    if (!requireOnboarding && userProfile && userProfile.onboardingComplete) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};



// Main App Router
const AppRouter: React.FC = () => {
    // Enable HIPAA-compliant session timeout
    useSessionTimeout();

    return (
        <Suspense fallback={<LoadingScreen />}>
            <Routes>
                <Route path="/auth" element={<AuthWrapper />} />

                <Route
                    path="/onboarding"
                    element={
                        <ProtectedRoute requireOnboarding={false}>
                            <OnboardingPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/"
                    element={
                        <Layout>
                            <HomePage />
                        </Layout>
                    }
                />
                <Route
                    path="/pulse"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <WellnessDashboard />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/journal"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Journal />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/pro-mode"
                    element={
                        <ProtectedRoute>
                            <Outlet />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<ProDashboard />} />
                    <Route path="diagnostics" element={<DiagnosticPage />} />
                    <Route path="treatment" element={<TreatmentPlanPage />} />
                    <Route path="specialist" element={<SpecialistCarePage />} />
                </Route>
                <Route
                    path="/chat"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Chat />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <ProfilePage />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/quiz"
                    element={
                        <Layout>
                            <CheckIn />
                        </Layout>
                    }
                />
                <Route
                    path="/calm-down"
                    element={
                        <Layout>
                            <Breathe />
                        </Layout>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <SettingsPage />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                {/* <Route
                    path="/pricing"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <PricingPage />
                            </Layout>
                        </ProtectedRoute>
                    }
                /> */}

                {/* Clinical Validation Page - Public */}
                <Route
                    path="/clinical-validation"
                    element={<ClinicalValidationPage />}
                />

                {/* Article Pages - Public */}
                <Route
                    path="/article/:articleId"
                    element={
                        <Layout>
                            <ArticlePage />
                        </Layout>
                    }
                />

                {/* Admin-only routes (hidden from navigation) */}
                <Route
                    path="/internal/beta-dashboard"
                    element={
                        <AdminRoute>
                            <BetaDashboard />
                        </AdminRoute>
                    }
                />

                {/* Debug route (no protection - for troubleshooting) */}
                <Route
                    path="/internal/admin-debug"
                    element={
                        <ProtectedRoute>
                            <AdminDebug />
                        </ProtectedRoute>
                    }
                />

                <Route path="/unauthorized" element={<UnauthorizedPage />} />


                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
};

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <WellnessProvider>
                    <AppRouter />
                    <Toaster position="top-right" richColors />
                </WellnessProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
