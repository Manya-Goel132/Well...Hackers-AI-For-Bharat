import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-cream flex flex-col font-sans text-moss-900 selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden relative">
            <Navbar />
            <main className="flex-1 w-full animate-in fade-in duration-500 relative pt-16">
                {children}
            </main>
            <Footer />
        </div>
    );
};
