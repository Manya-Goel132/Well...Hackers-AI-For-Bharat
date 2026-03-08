import { db } from './awsService';
import { collection, query, where, getDocs, doc, getDoc } from './awsShim';
import { logDataExport } from './auditLogService';

/**
 * Service to export all user data in a JSON format.
 * Implements HIPAA Right of Access requirement (§164.524).
 */
export const dataExportService = {
    /**
     * Export all data associated with a user ID.
     * Returns a Blob containing the JSON data.
     */
    async exportUserData(userId: string): Promise<Blob> {
        try {
            // Log the export request for HIPAA audit
            await logDataExport(userId, 'FULL_ACCOUNT_DATA');

            // Fetch all data in parallel
            const [
                profile,
                journalEntries,
                chatSessions,
                proChatSessions,
                checkins,
                activities,
                achievements
            ] = await Promise.all([
                this.getUserProfile(userId),
                this.getCollectionData('journal_entries', userId),
                this.getCollectionData('chat_sessions', userId),
                this.getCollectionData('pro_chat_sessions', userId),
                this.getSubcollectionData('users', userId, 'checkins'),
                this.getCollectionData('activities', userId),
                this.getCollectionData('achievements', userId)
            ]);

            // Construct the export object
            const exportData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    userId,
                    version: '1.0'
                },
                profile,
                journalEntries,
                chatSessions,
                proChatSessions,
                checkins,
                activities,
                achievements
            };

            // Convert to JSON Blob
            const jsonString = JSON.stringify(exportData, null, 2);
            return new Blob([jsonString], { type: 'application/json' });
        } catch (error) {
            console.error('Data export failed:', error);
            throw new Error('Failed to export user data');
        }
    },

    /**
     * Helper to fetch user profile document
     */
    async getUserProfile(userId: string) {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },

    /**
     * Helper to fetch documents from a top-level collection where userId matches
     */
    async getCollectionData(collectionName: string, userId: string) {
        const q = query(collection(db, collectionName), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },

    /**
     * Helper to fetch documents from a subcollection
     */
    async getSubcollectionData(parentCollection: string, parentId: string, subcollectionName: string) {
        const querySnapshot = await getDocs(collection(db, parentCollection, parentId, subcollectionName));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
};
