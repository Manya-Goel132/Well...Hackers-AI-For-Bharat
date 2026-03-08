// Admin-Only Route Protection
// Redirects non-admin users to unauthorized page

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { adminService } from '../../services/adminService';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
    children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
    const { currentUser, loading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [checkingAdmin, setCheckingAdmin] = useState(true);

    useEffect(() => {
        const checkAdminStatus = async () => {
            console.log('🔍 AdminRoute: Checking admin status...');
            console.log('🔍 AdminRoute: authLoading:', authLoading);
            console.log('🔍 AdminRoute: currentUser:', currentUser?.uid);

            // Wait for auth to finish loading
            if (authLoading) {
                console.log('⏳ AdminRoute: Waiting for auth to load...');
                return;
            }

            if (!currentUser) {
                console.log('❌ AdminRoute: No current user');
                setIsAdmin(false);
                setCheckingAdmin(false);
                return;
            }

            try {
                console.log('🔍 AdminRoute: Calling adminService.isAdmin()...');
                const adminStatus = await adminService.isAdmin(currentUser.uid);
                console.log('✅ AdminRoute: Admin status result:', adminStatus);
                setIsAdmin(adminStatus);
            } catch (error) {
                console.error('❌ AdminRoute: Error checking admin status:', error);
                setIsAdmin(false);
            } finally {
                setCheckingAdmin(false);
            }
        };

        checkAdminStatus();
    }, [currentUser, authLoading]);

    // Show loading while auth is loading OR while checking admin status
    if (authLoading || checkingAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
                    <p className="text-sm text-gray-600">Verifying access...</p>
                </div>
            </div>
        );
    }

    // If not logged in, redirect to auth page
    if (!currentUser) {
        console.log('🔄 AdminRoute: Not logged in, redirecting to /auth');
        return <Navigate to="/auth" replace />;
    }

    // If logged in but not admin, show unauthorized
    if (isAdmin === false) {
        console.log('🚫 AdminRoute: Logged in but not admin, redirecting to /unauthorized');
        return <Navigate to="/unauthorized" replace />;
    }

    console.log('✅ AdminRoute: Access granted!');
    return <>{children}</>;
}
