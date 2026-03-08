import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import {
    MessageCircle,
    BookOpen,
    Home,
    Menu,
    X,
    LogOut,
    User,
    Activity,
    ChevronDown,
    Zap,
    Settings,
    Shield,
    ArrowRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export const Navbar = () => {
    const { t } = useTranslation();
    const { currentUser, userProfile, signOut } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/auth');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navItems = [
        { name: t('nav.home'), path: '/', icon: Home },
        { name: t('nav.chat'), path: '/chat', icon: MessageCircle },
        { name: t('nav.journal'), path: '/journal', icon: BookOpen },
        { name: 'Pulse', path: '/pulse', icon: Activity },
    ];

    // Helper for initials
    const initials = userProfile?.displayName
        ? userProfile.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : currentUser?.displayName
            ? currentUser.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : 'U';

    return (
        <>
            <nav className="sticky top-0 z-50 w-full border-b border-sage-200 bg-cream/90 backdrop-blur-md shadow-sm transition-all duration-300">
                <div className="container mx-auto px-4 h-20 sm:h-24 flex items-center justify-between">

                    {/* Logo Area */}
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')} role="button">
                        <div className="relative">
                            <div className="absolute inset-0 bg-sage-200 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                            <img src="/logo.png" alt="ManoSathi" className="relative w-10 h-10 object-contain rounded-full border border-white shadow-sm" />
                        </div>
                        <span className="font-display font-bold text-xl md:text-2xl tracking-tight text-moss-900 group-hover:text-emerald-700 transition-colors">
                            {t('app_name')}
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1.5">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={(e) => {
                                    if ((item.path === '/chat' || item.path === '/journal') && !currentUser) {
                                        e.preventDefault();
                                        toast.info(`Please log in or sign up to use the ${item.name} feature.`);
                                        navigate('/auth');
                                    }
                                }}
                                className={({ isActive }) => `
                                    flex items-center gap-2 px-4 py-2 rounded-full text-base font-bold transition-all duration-300
                                    ${isActive
                                        ? 'bg-sage-100 text-moss-900 shadow-sm'
                                        : 'text-moss-600 hover:bg-sage-50 hover:text-moss-800'}
                                `}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.name}
                            </NavLink>
                        ))}

                        <div className="h-6 w-px bg-sage-200 mx-2" />

                        <button
                            onClick={() => {
                                if (!currentUser) {
                                    toast.info("Please log in or sign up to access Pro Mode and personalized features.");
                                    navigate('/auth');
                                    return;
                                }
                                navigate('/pro-mode');
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-base font-bold bg-moss-900 text-white hover:bg-moss-800 shadow-soft hover:shadow-glow transition-all hover:scale-105"
                        >
                            <Shield className="w-5 h-5" />
                            Pro Mode
                        </button>
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-3">
                        {/* SOS Button (Always Visible) */}
                        <button
                            onClick={() => {
                                alert('🚧 SOS/Crisis Support is under development and will be available soon! For immediate help, please call 14416 (Tele-MANAS)');
                            }}
                            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200 transition-colors"
                        >
                            <Zap className="w-4 h-4 fill-orange-700" />
                            SOS
                        </button>

                        {/* User Profile or Login (Desktop Only) */}
                        <div className="relative hidden md:block" ref={profileRef}>
                            {currentUser ? (
                                <>
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="flex items-center gap-2 p-1.5 pl-4 rounded-full hover:bg-sage-50 transition-colors border border-transparent hover:border-sage-100"
                                    >
                                        <span className="text-lg font-bold text-moss-800 max-w-[120px] truncate">
                                            {userProfile?.displayName?.split(' ')[0] || 'User'}
                                        </span>
                                        <div className="h-10 w-10 rounded-full bg-sage-200 flex items-center justify-center text-moss-800 font-bold border-2 border-white shadow-sm overflow-hidden">
                                            {userProfile?.photoURL ? (
                                                <img src={userProfile.photoURL} alt="User" className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{initials}</span>
                                            )}
                                        </div>
                                        <ChevronDown className={`w-6 h-6 text-sage-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Dropdown Content */}
                                    {isProfileOpen && (
                                        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-sage-100 py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                            <div className="px-5 py-4 border-b border-sage-50 bg-sage-50/30">
                                                <p className="text-sm font-bold text-moss-900">{userProfile?.displayName || currentUser?.displayName || 'User'}</p>
                                                <p className="text-xs text-moss-600 truncate">{currentUser?.email}</p>
                                            </div>
                                            <div className="py-2 space-y-1 px-2">
                                                <button onClick={() => navigate('/profile')} className="w-full text-left px-3 py-2.5 text-sm text-moss-700 hover:bg-sage-50 rounded-lg flex items-center gap-3 transition-colors">
                                                    <User className="w-4 h-4 text-sage-500" /> {t('nav.profile')}
                                                </button>
                                                <button onClick={() => navigate('/settings')} className="w-full text-left px-3 py-2.5 text-sm text-moss-700 hover:bg-sage-50 rounded-lg flex items-center gap-3 transition-colors">
                                                    <Settings className="w-4 h-4 text-sage-500" /> {t('nav.settings')}
                                                </button>
                                            </div>
                                            <div className="border-t border-sage-50 mt-1 py-2 px-2">
                                                <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-3 font-medium transition-colors">
                                                    <LogOut className="w-4 h-4" /> {t('nav.logout')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Button
                                    onClick={() => navigate('/auth')}
                                    className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 transition-all shadow-sm hover:shadow-md"
                                >
                                    Log In / Sign Up
                                </Button>
                            )}
                        </div>

                        {/* Mobile Menu Toggle */}
                        <div className="md:hidden">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-moss-800 hover:bg-sage-100 rounded-full"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </nav >

            {/* Mobile Navigation Menu */}
            {
                isMobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 z-40 bg-cream/95 backdrop-blur-xl flex flex-col pt-24 px-6 animate-in slide-in-from-top-10 duration-300">
                        <div className="flex flex-col gap-6">
                            {/* User Card Mobile or Sign In */}
                            {currentUser ? (
                                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-sage-100" onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}>
                                    <div className="h-12 w-12 rounded-full bg-sage-200 flex items-center justify-center text-moss-800 font-bold border-2 border-white shadow-sm overflow-hidden">
                                        {userProfile?.photoURL ? (
                                            <img src={userProfile.photoURL} alt="User" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-lg">{initials}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-bold text-moss-900 truncate">{userProfile?.displayName || 'Hello!'}</p>
                                        <p className="text-xs text-moss-600 truncate">{currentUser?.email}</p>
                                    </div>
                                    <User className="w-5 h-5 text-sage-400" />
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl shadow-sm border border-emerald-100 cursor-pointer" onClick={() => { navigate('/auth'); setIsMobileMenuOpen(false); }}>
                                    <div className="h-12 w-12 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-800 font-bold border-2 border-white shadow-sm">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-lg font-bold text-emerald-900">Sign In</p>
                                        <p className="text-sm text-emerald-700">Access all features</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-emerald-600" />
                                </div>
                            )}

                            <div className="space-y-2">
                                {navItems.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={(e) => {
                                            if ((item.path === '/chat' || item.path === '/journal') && !currentUser) {
                                                e.preventDefault();
                                                setIsMobileMenuOpen(false);
                                                toast.info(`Please log in or sign up to use the ${item.name} feature.`);
                                                navigate('/auth');
                                            } else {
                                                setIsMobileMenuOpen(false);
                                            }
                                        }}
                                        className={({ isActive }) => `
                                        flex items-center gap-4 px-4 py-4 rounded-xl transition-all
                                        ${isActive
                                                ? 'bg-sage-100 text-moss-900 font-bold shadow-sm'
                                                : 'text-moss-600 hover:bg-sage-50'}
                                    `}
                                    >
                                        <item.icon className="w-6 h-6" />
                                        <span className="text-lg">{item.name}</span>
                                    </NavLink>
                                ))}

                                {currentUser && (
                                    <NavLink
                                        to="/settings"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={({ isActive }) => `
                                        flex items-center gap-4 px-4 py-4 rounded-xl transition-all
                                        ${isActive
                                                ? 'bg-sage-100 text-moss-900 font-bold shadow-sm'
                                                : 'text-moss-600 hover:bg-sage-50'}
                                    `}
                                    >
                                        <Settings className="w-6 h-6" />
                                        <span className="text-lg">{t('nav.settings')}</span>
                                    </NavLink>
                                )}
                            </div>

                            <div className="h-px bg-sage-200" />

                            <div className="space-y-2">
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        if (!currentUser) {
                                            toast.info("Please log in or sign up to access Pro Mode and personalized features.");
                                            navigate('/auth');
                                            return;
                                        }
                                        navigate('/pro-mode');
                                    }}
                                    className="flex items-center gap-4 px-4 py-4 rounded-xl bg-moss-900 text-white w-full text-left shadow-soft"
                                >
                                    <Shield className="w-6 h-6" />
                                    <span className="text-lg font-bold">Access Pro Mode</span>
                                </button>

                                {currentUser && (
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-4 px-4 py-4 rounded-xl text-red-600 hover:bg-red-50 w-full text-left"
                                    >
                                        <LogOut className="w-6 h-6" />
                                        <span className="text-lg font-medium">Log Out</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};
