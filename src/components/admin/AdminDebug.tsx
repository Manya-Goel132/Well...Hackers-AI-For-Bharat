// Debug Admin Access
// Temporary component to check admin status

import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { adminService } from '../../services/adminService';
import { doc, getDoc } from '../../services/awsShim';
import { db } from '../../services/awsService';

export function AdminDebug() {
    const { currentUser } = useAuth();
    const [debugInfo, setDebugInfo] = useState<any>({});

    useEffect(() => {
        const checkAdmin = async () => {
            if (!currentUser) {
                setDebugInfo({ error: 'No current user' });
                return;
            }

            try {
                // 1. Check current user UID
                const currentUID = currentUser.uid;

                // 2. Fetch admin config from Firestore
                const configRef = doc(db, 'config', 'admins');
                const configDoc = await getDoc(configRef);

                if (!configDoc.exists()) {
                    setDebugInfo({
                        currentUID,
                        error: 'Admin config document does not exist',
                        path: 'config/admins'
                    });
                    return;
                }

                const data = configDoc.data();
                const allowedUIDs = data?.allowedAdminUIDs || [];

                // 3. Check if UID is in array
                const isInArray = allowedUIDs.includes(currentUID);

                // 4. Check admin service
                const isAdminCheck = await adminService.isAdmin(currentUID);

                setDebugInfo({
                    currentUID,
                    allowedUIDs,
                    isInArray,
                    isAdminCheck,
                    configData: data
                });
            } catch (error: any) {
                setDebugInfo({
                    currentUID: currentUser.uid,
                    error: error.message,
                    stack: error.stack
                });
            }
        };

        checkAdmin();
    }, [currentUser]);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">Admin Access Debug</h1>
                <div className="bg-white rounded-lg shadow p-6">
                    <pre className="text-xs overflow-auto">
                        {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                </div>

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h2 className="font-semibold text-blue-900 mb-2">Instructions:</h2>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Check if <code className="bg-blue-100 px-1 rounded">currentUID</code> matches your Firebase Auth UID</li>
                        <li>Verify <code className="bg-blue-100 px-1 rounded">allowedUIDs</code> array contains your UID</li>
                        <li>Check if <code className="bg-blue-100 px-1 rounded">isInArray</code> is <code className="bg-green-100 px-1 rounded">true</code></li>
                        <li>Check if <code className="bg-blue-100 px-1 rounded">isAdminCheck</code> is <code className="bg-green-100 px-1 rounded">true</code></li>
                    </ol>
                </div>

                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-900 mb-2">Common Issues:</h3>
                    <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                        <li><strong>UID mismatch:</strong> Copy UID from above and paste into Firestore</li>
                        <li><strong>Wrong field type:</strong> Ensure <code className="bg-yellow-100 px-1 rounded">allowedAdminUIDs</code> is an <strong>array</strong>, not a string</li>
                        <li><strong>Typo in UID:</strong> UIDs are case-sensitive</li>
                        <li><strong>Cache issue:</strong> Clear browser cache and reload</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
