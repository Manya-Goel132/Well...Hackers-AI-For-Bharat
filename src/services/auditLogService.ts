/**
 * HIPAA-Compliant Audit Logging Service
 * 
 * This service logs all access to Protected Health Information (PHI)
 * as required by HIPAA § 164.312(b) - Audit Controls
 * 
 * Requirements:
 * - Log all PHI access (read, write, delete)
 * - Include timestamp, user, action, resource
 * - Immutable logs (append-only)
 * - Retain for 6 years (HIPAA requirement)
 * - No PHI in log entries (only metadata)
 */

import { db } from './awsService';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from './awsShim';

export interface AuditLogEntry {
    timestamp: any; // Firestore ServerTimestamp
    userId: string; // Who performed the action
    action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED';
    resourceType: 'USER_PROFILE' | 'JOURNAL_ENTRY' | 'CHAT_SESSION' | 'CHECK_IN' | 'ASSESSMENT' | 'ACCOUNT';
    resourceId?: string; // ID of the resource accessed (not the content)
    ipAddress?: string; // User's IP (if available)
    userAgent?: string; // Browser/device info
    outcome: 'SUCCESS' | 'FAILURE';
    errorMessage?: string; // If failure, why
    metadata?: Record<string, any>; // Additional context (no PHI!)
}

/**
 * Log an audit event
 */
export async function logAuditEvent(params: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    try {
        const auditLogEntry: AuditLogEntry = {
            ...params,
            timestamp: serverTimestamp(),
        };

        // Store in audit_logs collection
        await addDoc(collection(db, 'audit_logs'), auditLogEntry);

        // Note: Firestore rules should make this collection append-only
        // Admin-only read access for compliance reviews
    } catch (error) {
        // Critical: Audit log failures should not block user actions
        // but should be reported to monitoring system
        console.error('[AUDIT] Failed to log audit event:', error);

        // In production, send to error monitoring service (e.g., Sentry)
        // DO NOT throw error - audit failures shouldn't break user experience
    }
}

/**
 * Log PHI access (journal read, chat view, etc.)
 */
export async function logPHIAccess(
    userId: string,
    resourceType: AuditLogEntry['resourceType'],
    resourceId: string,
    action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE'
): Promise<void> {
    await logAuditEvent({
        userId,
        action,
        resourceType,
        resourceId,
        outcome: 'SUCCESS',
        ipAddress: await getUserIP(),
        userAgent: navigator.userAgent,
    });
}

/**
 * Log authentication events
 */
export async function logAuthEvent(
    userId: string | null,
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED',
    errorMessage?: string
): Promise<void> {
    await logAuditEvent({
        userId: userId || 'UNKNOWN',
        action,
        resourceType: 'ACCOUNT',
        outcome: action === 'LOGIN_FAILED' ? 'FAILURE' : 'SUCCESS',
        errorMessage,
        ipAddress: await getUserIP(),
        userAgent: navigator.userAgent,
    });
}

/**
 * Log data export (HIPAA Right to Access)
 */
export async function logDataExport(userId: string, exportType: string): Promise<void> {
    await logAuditEvent({
        userId,
        action: 'EXPORT',
        resourceType: 'USER_PROFILE',
        outcome: 'SUCCESS',
        metadata: { exportType },
        ipAddress: await getUserIP(),
        userAgent: navigator.userAgent,
    });
}

/**
 * Get audit logs for a specific user (admin function)
 * Used for compliance reviews and breach investigations
 */
export async function getUserAuditLogs(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    limitCount: number = 100
): Promise<AuditLogEntry[]> {
    try {
        let q = query(
            collection(db, 'audit_logs'),
            where('userId', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        // Note: Date range filtering requires composite indexes
        // Configure in Firestore console if needed

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as AuditLogEntry);
    } catch (error) {
        console.error('[AUDIT] Failed to retrieve audit logs:', error);
        return [];
    }
}

/**
 * Get failed login attempts (security monitoring)
 */
export async function getFailedLoginAttempts(
    userId: string,
    hours: number = 24
): Promise<number> {
    try {
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - hours);

        const q = query(
            collection(db, 'audit_logs'),
            where('userId', '==', userId),
            where('action', '==', 'LOGIN_FAILED')
            // Add timestamp filter if needed (requires index)
        );

        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error('[AUDIT] Failed to get failed login attempts:', error);
        return 0;
    }
}

/**
 * Helper: Get user's IP address
 * Note: This requires a third-party service or API
 * For HIPAA compliance, consider using server-side logging
 */
async function getUserIP(): Promise<string | undefined> {
    try {
        // Option 1: Use a free IP lookup service
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        // IP lookup failed - not critical
        return undefined;
    }
}

/**
 * Export audit logs for compliance review (admin function)
 * Exports last 6 years of logs as required by HIPAA
 */
export async function exportAuditLogsForCompliance(
    userId?: string
): Promise<AuditLogEntry[]> {
    try {
        // Note: This should be admin-only
        // Implement proper authorization checks

        let q = query(
            collection(db, 'audit_logs'),
            orderBy('timestamp', 'desc')
        );

        if (userId) {
            q = query(q, where('userId', '==', userId));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            ...doc.data() as AuditLogEntry,
            _id: doc.id
        }));
    } catch (error) {
        console.error('[AUDIT] Failed to export audit logs:', error);
        return [];
    }
}

/**
 * USAGE EXAMPLES:
 * 
 * // Log journal entry creation
 * await logPHIAccess(userId, 'JOURNAL_ENTRY', entryId, 'CREATE');
 * 
 * // Log journal entry read
 * await logPHIAccess(userId, 'JOURNAL_ENTRY', entryId, 'READ');
 * 
 * // Log successful login
 * await logAuthEvent(userId, 'LOGIN');
 * 
 * // Log failed login
 * await logAuthEvent(null, 'LOGIN_FAILED', 'Invalid password');
 * 
 * // Log data export
 * await logDataExport(userId, 'FULL_ACCOUNT_DATA');
 */
