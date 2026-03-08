import React from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, Stethoscope, Star, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function SpecialistCarePage() {
    const navigate = useNavigate();

    const handleBook = (name: string) => {
        toast.success(`Booking request sent to ${name}. They will contact you shortly.`);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <Button variant="ghost" onClick={() => navigate('/pro-mode')} className="mb-8">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Pro Dashboard
                </Button>

                <div className="mb-10 text-center">
                    <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Stethoscope className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-4">
                        Connect with Specialists
                    </h1>
                    <p className="text-slate-600 text-lg max-w-2xl mx-auto">Skip the waiting room. Book a secure, private telehealth appointment with licensed therapists and psychiatrists.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Specialist 1 */}
                    <Card className="hover:shadow-md transition-shadow border-t-4 border-t-amber-500">
                        <CardContent className="p-6">
                            <div className="flex gap-4 mb-4">
                                <div className="w-16 h-16 bg-slate-200 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                                    <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="Dr. Sarah" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 leading-tight">Dr. Sarah Jenkins</h3>
                                    <p className="text-slate-500 text-sm mt-1">Clinical Psychologist, PhD</p>
                                    <div className="flex items-center gap-1 text-amber-500 text-sm mt-1">
                                        <Star className="w-4 h-4 fill-amber-500" />
                                        <span className="font-medium text-slate-700">4.9</span>
                                        <span className="text-slate-400">(120 reviews)</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 mb-6 font-medium">Specializes in cognitive behavioral therapy (CBT), anxiety, and depression.</p>
                            <Button
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-2"
                                onClick={() => handleBook('Dr. Sarah Jenkins')}
                            >
                                <Calendar className="w-4 h-4" /> Check Availability
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Specialist 2 */}
                    <Card className="hover:shadow-md transition-shadow border-t-4 border-t-amber-500">
                        <CardContent className="p-6">
                            <div className="flex gap-4 mb-4">
                                <div className="w-16 h-16 bg-slate-200 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                                    <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Dr. Michael" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 leading-tight">Dr. Michael Chen</h3>
                                    <p className="text-slate-500 text-sm mt-1">Psychiatrist, MD</p>
                                    <div className="flex items-center gap-1 text-amber-500 text-sm mt-1">
                                        <Star className="w-4 h-4 fill-amber-500" />
                                        <span className="font-medium text-slate-700">4.8</span>
                                        <span className="text-slate-400">(85 reviews)</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 mb-6 font-medium">Specializes in medication management, ADHD, and mood disorders.</p>
                            <Button
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-2"
                                onClick={() => handleBook('Dr. Michael Chen')}
                            >
                                <Calendar className="w-4 h-4" /> Check Availability
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
