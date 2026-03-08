// Admin Access Control Service
// Validates admin UIDs against Firestore whitelist

import { doc, getDoc } from './awsShim';
import { db } from './awsService';

export interface AdminConfig {
    allowedAdminUIDs: string[];
    lastUpdated: Date;
}

class AdminService {
    private adminCache: Set<string> | null = null;
    private cacheExpiry: number = 0;
    private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

    /**
     * Check if a user is an admin
     * Uses cached whitelist for performance
     */
    async isAdmin(uid: string): Promise<boolean> {
        try {
            // Check cache first
            if (this.adminCache && Date.now() < this.cacheExpiry) {
                return this.adminCache.has(uid);
            }

            // Fetch from Firestore
            const configRef = doc(db, 'config', 'admins');
            const configDoc = await getDoc(configRef);

            if (!configDoc.exists()) {
                console.warn('⚠️ Admin config not found in Firestore');
                return false;
            }

            const data = configDoc.data() as AdminConfig;
            const allowedUIDs = data.allowedAdminUIDs || [];

            // Update cache
            this.adminCache = new Set(allowedUIDs);
            this.cacheExpiry = Date.now() + this.CACHE_DURATION_MS;

            return this.adminCache.has(uid);
        } catch (error) {
            console.error('❌ Error checking admin status:', error);
            return false;
        }
    }

    /**
     * Clear admin cache (useful after config updates)
     */
    clearCache(): void {
        this.adminCache = null;
        this.cacheExpiry = 0;
    }

    /**
     * Get list of admin UIDs (admin-only)
     */
    async getAdminUIDs(): Promise<string[]> {
        try {
            const configRef = doc(db, 'config', 'admins');
            const configDoc = await getDoc(configRef);

            if (!configDoc.exists()) {
                return [];
            }

            const data = configDoc.data() as AdminConfig;
            return data.allowedAdminUIDs || [];
        } catch (error) {
            console.error('❌ Error fetching admin UIDs:', error);
            return [];
        }
    }
}

export const adminService = new AdminService();
