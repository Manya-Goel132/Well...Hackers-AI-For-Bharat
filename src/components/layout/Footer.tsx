import React from 'react';
import { Heart, Shield, Mail, Instagram, Twitter } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-white border-t border-sage-100 py-12 px-4 mt-auto">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">

                {/* Brand Column */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Heart className="w-5 h-5 text-emerald-600 fill-emerald-600" />
                        </div>
                        <span className="font-display font-bold text-xl text-moss-900">ManoSathi</span>
                    </div>
                    <p className="text-moss-600 text-sm leading-relaxed">
                        Your trusted companion for mental wellness. clinically validated, anonymous, and always here for you.
                    </p>
                    <div className="flex gap-4 pt-2">
                        <a href="#" className="p-2 rounded-full bg-sage-50 text-moss-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"><Instagram className="w-4 h-4" /></a>
                        <a href="#" className="p-2 rounded-full bg-sage-50 text-moss-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"><Twitter className="w-4 h-4" /></a>
                        <a href="mailto:support@manosathi.in" className="p-2 rounded-full bg-sage-50 text-moss-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"><Mail className="w-4 h-4" /></a>
                    </div>
                </div>

                {/* Links Column 1 */}
                <div>
                    <h4 className="font-bold text-moss-900 mb-4">Features</h4>
                    <ul className="space-y-3 text-sm text-moss-600">
                        <li><a href="/journal" className="hover:text-emerald-600 transition-colors">AI Journal</a></li>
                        <li><a href="/chat" className="hover:text-emerald-600 transition-colors">Anonymous Chat</a></li>
                        <li><a href="/calm-down" className="hover:text-emerald-600 transition-colors">Breathing Exercises</a></li>
                        <li><a href="/quiz" className="hover:text-emerald-600 transition-colors">Daily Check-in</a></li>
                    </ul>
                </div>

                {/* Links Column 2 */}
                <div>
                    <h4 className="font-bold text-moss-900 mb-4">Resources</h4>
                    <ul className="space-y-3 text-sm text-moss-600">
                        <li><a href="#" className="hover:text-emerald-600 transition-colors">Crisis Support</a></li>
                        <li><a href="#" className="hover:text-emerald-600 transition-colors">Find a Therapist</a></li>
                        <li><a href="#" className="hover:text-emerald-600 transition-colors">Mental Health Guide</a></li>
                        <li><a href="#" className="hover:text-emerald-600 transition-colors">Community Stories</a></li>
                    </ul>
                </div>

                {/* Legal Column */}
                <div>
                    <h4 className="font-bold text-moss-900 mb-4">Legal</h4>
                    <ul className="space-y-3 text-sm text-moss-600">
                        <li><a href="#" className="hover:text-emerald-600 transition-colors">Privacy Policy</a></li>
                        <li><a href="#" className="hover:text-emerald-600 transition-colors">Terms of Service</a></li>
                        <li><a href="#" className="hover:text-emerald-600 transition-colors">Cookie Policy</a></li>
                        <li className="flex items-center gap-2"><Shield className="w-3 h-3 text-emerald-600" /> HIPAA Compliant</li>
                    </ul>
                </div>
            </div>

            <div className="max-w-6xl mx-auto border-t border-sage-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-moss-500">
                <p>© 2024 ManoSathi. All rights reserved.</p>
                <div className="flex gap-8">
                    <span>Made with 💚 for Bharat</span>
                </div>
            </div>
        </footer>
    );
}
