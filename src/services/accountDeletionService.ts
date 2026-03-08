import { db, auth } from './awsService';
import { collection, query, where, getDocs, deleteDoc, doc, writeBatch } from './awsShim';
import { deleteUser } from './awsShim';
import { logAuditEvent } from './auditLogService';

/**
 * Service to handle permanent account deletion.
 * Implements GDPR Right to Erasure and HIPAA data disposal requirements.
 */
export const accountDeletionService = {
    /**
     * Permanently delete a user account and all associated data.
     * @param userId The ID of the authenticated user to delete.
     */
    async deleteUserAccount(userId: string): Promise<void> {
        const currentUser = auth.currentUser;
        if (!currentUser || currentUser.uid !== userId) {
            throw new Error('Unauthorized deletion attempt');
        }

        try {
            // 1. Log the deletion request (audit trail required)
            await logAuditEvent({
                userId,
                action: 'DELETE',
                resourceType: 'ACCOUNT',
                outcome: 'SUCCESS',
                metadata: { reason: 'User requested account deletion' }
            });

            // 2. Delete data from collections (using batching for efficiency/atomicity where possible)
            // Note: For large datasets, this might need cloud functions, but client-side works for typical user scale.

            const batch = writeBatch(db);

            // Delete Profile
            batch.delete(doc(db, 'users', userId));

            // Commit initial batch (profile)
            await batch.commit();

            // Delete collection documents (in chunks if needed)
            await this.deleteCollectionDocs('journal_entries', userId);
            await this.deleteCollectionDocs('chat_sessions', userId);
            await this.deleteCollectionDocs('pro_chat_sessions', userId);
            await this.deleteCollectionDocs('activities', userId);
            await this.deleteCollectionDocs('achievements', userId);

            // Delete Subcollections
            await this.deleteSubcollectionDocs('users', userId, 'checkins');
            await this.deleteSubcollectionDocs('users', userId, 'usage');

            // 3. Delete Authentication User
            await deleteUser(currentUser);

        } catch (error) {
            console.error('Account deletion failed:', error);
            // Log failure in audit log
            await logAuditEvent({
                userId,
                action: 'DELETE',
                resourceType: 'ACCOUNT',
                outcome: 'FAILURE',
                errorMessage: String(error)
            });
            throw new Error('Failed to delete account. You may need to re-login recently.');
        }
    },

    /**
     * Helper to delete documents where userId matches
     */
    async deleteCollectionDocs(collectionName: string, userId: string) {
        const q = query(collection(db, collectionName), where('userId', '==', userId));
        const snapshot = await getDocs(q);

        // Process deletions in batches of 500
        const chunks = this.chunkArray(snapshot.docs as any[], 500);
        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach((d: any) => batch.delete(d.ref));
            await batch.commit();
        }
    },

    /**
     * Helper to delete subcollection documents
     */
    async deleteSubcollectionDocs(parentCol: string, parentId: string, subCol: string) {
        const colRef = collection(db, parentCol, parentId, subCol);
        const snapshot = await getDocs(colRef);

        const chunks = this.chunkArray(snapshot.docs as any[], 500);
        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach((d: any) => batch.delete(d.ref));
            await batch.commit();
        }
    },

    /**
     * Utility to chunk array for batching
     */
    chunkArray<T>(array: T[], size: number): T[][] {
        const result: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    }
};
