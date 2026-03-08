// Unauthorized Access Page
// Shown to non-admin users who attempt to access admin routes

import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../ui/button';

export function UnauthorizedPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full text-center">
                <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-600 mb-6">
                    You don't have permission to access this page.
                </p>
                <Button
                    onClick={() => navigate('/')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                    Go to Home
                </Button>
            </div>
        </div>
    );
}
