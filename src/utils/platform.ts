export const isPlatform = (platformName: 'hybrid' | 'web' | 'mobile' | 'desktop'): boolean => {
    // Simple platform detection for Capacitor apps
    if (platformName === 'hybrid') {
        return !!(window as any).Capacitor;
    }
    if (platformName === 'web') {
        return !(window as any).Capacitor;
    }
    if (platformName === 'mobile') {
        return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }
    if (platformName === 'desktop') {
        return !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }
    return false;
};
