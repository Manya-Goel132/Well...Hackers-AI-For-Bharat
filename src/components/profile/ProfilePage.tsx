import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useTranslation } from 'react-i18next';
import { awsService } from '../../services/awsService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Loader2, User, Save, Camera, Locate, Calendar, AtSign, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
    const { userProfile, updateUserProfile, refreshUserProfile } = useAuth();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        photoURL: '',
        age: '',
        gender: '',
        location: '',
        language: 'mixed' as 'hindi' | 'english' | 'mixed',
        interests: '' // Comma separated
    });

    useEffect(() => {
        if (userProfile) {
            setFormData({
                displayName: userProfile.displayName || '',
                bio: userProfile.bio || '',
                photoURL: userProfile.photoURL || '',
                age: userProfile.age ? userProfile.age.toString() : '',
                gender: userProfile.gender || '',
                location: userProfile.location || '',
                language: userProfile.preferences?.language || 'mixed',
                interests: userProfile.interests ? userProfile.interests.join(', ') : ''
            });
        }
    }, [userProfile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const interestsArray = formData.interests
                .split(',')
                .map(i => i.trim())
                .filter(i => i.length > 0);

            const ageNum = formData.age ? parseInt(formData.age) : undefined;

            await updateUserProfile({
                displayName: formData.displayName,
                bio: formData.bio,
                photoURL: formData.photoURL,
                age: ageNum,
                gender: formData.gender,
                location: formData.location,
                interests: interestsArray,
                preferences: {
                    language: formData.language,
                    communicationStyle: userProfile?.preferences?.communicationStyle || 'casual'
                }
            });

            await refreshUserProfile();
            toast.success(t('profile.success_msg') || 'Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(t('profile.error_msg') || 'Failed to update. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!userProfile) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    const initials = formData.displayName
        ? formData.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'U';

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20 px-4 md:px-0">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-moss-900">{t('profile.title') || 'Your Profile'}</h1>
                    <p className="text-moss-600">Manage your personal information and preferences.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Left Column - Avatar */}
                    <div className="md:col-span-1 space-y-6">
                        <Card className="border-none shadow-soft overflow-hidden bg-white rounded-3xl">
                            <div className="h-24 bg-sage-100/50"></div>
                            <CardContent className="-mt-12 flex flex-col items-center gap-4 relative z-10">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center border-4 border-white shadow-xl">
                                        {formData.photoURL ? (
                                            <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-4xl font-bold text-emerald-700 font-display">{initials}</span>
                                        )}
                                        <div
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer"
                                            onClick={() => document.getElementById('file-upload')?.click()}
                                        >
                                            <Camera className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md border border-sage-100">
                                        <Camera className="w-4 h-4 text-moss-600" />
                                    </div>
                                </div>

                                <div className="text-center w-full space-y-1">
                                    <h3 className="text-xl font-bold text-moss-900">{formData.displayName || 'User'}</h3>
                                    <p className="text-sm text-moss-500">{userProfile.email}</p>
                                </div>

                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        if (file.size > 10 * 1024 * 1024) {
                                            toast.error("Image size should be less than 10MB");
                                            return;
                                        }
                                        setIsLoading(true);
                                        try {
                                            if (userProfile?.uid && file) {
                                                // Read as data URL for local preview (S3 upload coming soon)
                                                const reader = new FileReader();
                                                reader.onload = async (ev) => {
                                                    const url = ev.target?.result as string;
                                                    setFormData(prev => ({ ...prev, photoURL: url }));
                                                    await updateUserProfile({ photoURL: url });
                                                    await refreshUserProfile();
                                                    toast.success("Profile photo updated!");
                                                    setIsLoading(false);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        } catch (error) {
                                            console.error(error);
                                            toast.error("Failed to upload image.");
                                            setIsLoading(false);
                                        }
                                    }}
                                />
                            </CardContent>
                            <CardFooter className="bg-sage-50/30 p-4 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-xs text-moss-500 w-full">
                                    <AtSign className="w-3 h-3" />
                                    <span className="truncate flex-1">{userProfile.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-moss-500 w-full">
                                    <Calendar className="w-3 h-3" />
                                    <span>Joined {userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Recently'}</span>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* Right Column - Details Form */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="border-none shadow-soft bg-white rounded-3xl">
                            <CardHeader>
                                <CardTitle className="text-xl font-display text-moss-900">Personal Details</CardTitle>
                                <CardDescription className="text-moss-500">Update your information to personalize your experience.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-moss-700 font-semibold">Display Name</Label>
                                    <Input
                                        name="displayName"
                                        value={formData.displayName}
                                        onChange={handleChange}
                                        className="h-11 bg-sage-50 border-sage-200 focus:border-emerald-500 rounded-xl"
                                        placeholder="Your Name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-moss-700 font-semibold">About Me</Label>
                                    <Textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        className="min-h-[100px] bg-sage-50 border-sage-200 focus:border-emerald-500 rounded-xl resize-none"
                                        placeholder="Briefly describe yourself..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-moss-700 font-semibold">Age</Label>
                                        <Input
                                            name="age"
                                            type="number"
                                            value={formData.age}
                                            onChange={handleChange}
                                            className="h-11 bg-sage-50 border-sage-200 focus:border-emerald-500 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-moss-700 font-semibold">Gender</Label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            className="h-11 w-full px-3 bg-sage-50 border border-sage-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                                        >
                                            <option value="">Prefer not to say</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="non-binary">Non-binary</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-moss-700 font-semibold">Location</Label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Locate className="absolute left-3 top-3.5 h-4 w-4 text-moss-400" />
                                            <Input
                                                name="location"
                                                value={formData.location}
                                                onChange={handleChange}
                                                className="pl-9 h-11 bg-sage-50 border-sage-200 focus:border-emerald-500 rounded-xl"
                                                placeholder="City, State"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-11 border-sage-200 hover:bg-sage-50 text-moss-700"
                                            onClick={() => {
                                                if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
                                                setIsLoading(true);
                                                navigator.geolocation.getCurrentPosition(async (pos) => {
                                                    try {
                                                        const { latitude, longitude } = pos.coords;
                                                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                                                        const data = await response.json();
                                                        const loc = [data.address.city || data.address.town, data.address.state].filter(Boolean).join(', ');
                                                        if (loc) { setFormData(prev => ({ ...prev, location: loc })); toast.success("Location detected!"); }
                                                    } catch (e) { toast.error("Failed to detect location"); }
                                                    finally { setIsLoading(false); }
                                                });
                                            }}
                                        >
                                            <Locate className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-moss-700 font-semibold">AI Language Preference</Label>
                                    <select
                                        name="language"
                                        value={formData.language}
                                        onChange={handleChange}
                                        className="h-11 w-full px-3 bg-sage-50 border border-sage-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="mixed">Hinglish / Mixed (Default)</option>
                                        <option value="english">English Only</option>
                                        <option value="hindi">Hindi Only</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-moss-700 font-semibold">Interests</Label>
                                    <Input
                                        name="interests"
                                        value={formData.interests}
                                        onChange={handleChange}
                                        className="h-11 bg-sage-50 border-sage-200 focus:border-emerald-500 rounded-xl"
                                        placeholder="e.g. Cricket, Reading, Music"
                                    />
                                </div>

                            </CardContent>
                            <CardFooter className="flex justify-end pt-4 pb-8 px-6">
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-moss-900 hover:bg-moss-800 text-white shadow-soft rounded-full h-11 px-8"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    );
}
