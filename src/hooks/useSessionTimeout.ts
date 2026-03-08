import { useEffect, useRef, useCallback } from 'react';
import { awsService } from '../services/awsService';
import { toast } from 'sonner';

const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes
const WARNING_DURATION = 5 * 60 * 1000; // 5 minutes warning

/**
 * Hook to automatically log out inactive users for HIPAA security compliance (§164.312(a)(1)).
 */
export function useSessionTimeout() {
    const timeoutRef = useRef<NodeJS.Timeout>();
    const warningToastRef = useRef<string | number>();
    const lastActivityRef = useRef<number>(Date.now());

    const logoutUser = useCallback(async () => {
        if (awsService.getCurrentUser()) {
            await awsService.signOut();
            toast.error("Session expired due to inactivity. Please log in again.");
            // Navigation handled by auth listener in App.tsx
        }
    }, []);

    const resetTimeout = useCallback(() => {
        // Throttle resets to avoid performance issues (max once per second)
        if (Date.now() - lastActivityRef.current < 1000) return;
        lastActivityRef.current = Date.now();

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // Clear any existing warning toast
        if (warningToastRef.current) {
            toast.dismiss(warningToastRef.current);
            warningToastRef.current = undefined;
        }

        // Set warning timeout (25 mins)
        const warningTime = TIMEOUT_DURATION - WARNING_DURATION;

        timeoutRef.current = setTimeout(() => {
            // Show warning
            warningToastRef.current = toast.warning(
                "Your session will expire in 5 minutes due to inactivity.",
                { duration: WARNING_DURATION }
            );

            // Set final logout timeout (remaining 5 mins)
            timeoutRef.current = setTimeout(logoutUser, WARNING_DURATION);
        }, warningTime);
    }, [logoutUser]);

    useEffect(() => {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

        // Only attach listeners if user is logged in
        const unsubscribe = awsService.onAuthStateChanged((user) => {
            if (user) {
                events.forEach(event => window.addEventListener(event, resetTimeout));
                resetTimeout(); // Start initial timer
            } else {
                events.forEach(event => window.removeEventListener(event, resetTimeout));
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
            }
        });

        // Cleanup
        return () => {
            events.forEach(event => window.removeEventListener(event, resetTimeout));
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            unsubscribe();
        };
    }, [resetTimeout]);
}
