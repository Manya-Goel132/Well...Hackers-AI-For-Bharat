import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, User, Calendar, CheckCircle2, Share2, Bookmark } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { getArticleById } from '../../data/articles';
import { toast } from 'sonner';

export default function ArticlePage() {
    const { articleId } = useParams<{ articleId: string }>();
    const navigate = useNavigate();
    const article = articleId ? getArticleById(articleId) : undefined;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [articleId]);

    if (!article) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center px-4">
                <Card className="max-w-md w-full">
                    <CardContent className="p-12 text-center">
                        <h2 className="text-2xl font-bold text-moss-900 mb-4">Article Not Found</h2>
                        <p className="text-moss-600 mb-6">The article you're looking for doesn't exist or has been removed.</p>
                        <Button onClick={() => navigate('/')} className="bg-moss-900 hover:bg-moss-800">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const iconColorMap: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-700',
        indigo: 'bg-indigo-100 text-indigo-700',
        emerald: 'bg-emerald-100 text-emerald-700',
        purple: 'bg-purple-100 text-purple-700'
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: article.title,
                text: article.subtitle,
                url: window.location.href
            }).catch(() => { });
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied to clipboard!');
        }
    };

    const handleBookmark = () => {
        toast.success('Article bookmarked! (Feature coming soon)');
    };

    return (
        <div className="min-h-screen bg-cream pb-20">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-moss-900 to-emerald-900 text-white py-16 px-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <Button
                        onClick={() => navigate('/')}
                        variant="ghost"
                        className="text-emerald-200 hover:text-white hover:bg-white/10 mb-8 -ml-2"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Resources
                    </Button>

                    <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-sm font-semibold mb-6">
                        {article.category}
                    </div>

                    <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 leading-tight">
                        {article.title}
                    </h1>

                    <p className="text-xl text-emerald-100 mb-8 leading-relaxed">
                        {article.subtitle}
                    </p>

                    <div className="flex flex-wrap items-center gap-6 text-emerald-200">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{article.author.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{article.readTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(article.publishDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-10">
                {/* Author Card */}
                <Card className="mb-8 shadow-xl border-none bg-white/95 backdrop-blur">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full ${iconColorMap[article.iconColor]} flex items-center justify-center text-2xl font-bold shrink-0`}>
                            {article.author.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-moss-900">{article.author.name}</h3>
                            <p className="text-sm text-moss-600">{article.author.role}</p>
                            {article.author.credentials && (
                                <p className="text-xs text-moss-500 mt-1">{article.author.credentials}</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={handleShare} className="rounded-full">
                                <Share2 className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={handleBookmark} className="rounded-full">
                                <Bookmark className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Article Content */}
                <Card className="shadow-xl border-none bg-white">
                    <CardContent className="p-8 md:p-12 prose prose-lg max-w-none">
                        {/* Introduction */}
                        <div className="mb-12">
                            <p className="text-lg leading-relaxed text-moss-700 font-medium first-letter:text-6xl first-letter:font-display first-letter:float-left first-letter:mr-3 first-letter:text-emerald-700">
                                {article.content.introduction}
                            </p>
                        </div>

                        {/* Sections */}
                        {article.content.sections.map((section, idx) => (
                            <div key={idx} className="mb-12">
                                <h2 className="text-3xl font-display font-bold text-moss-900 mb-6 flex items-center gap-3">
                                    <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
                                    {section.heading}
                                </h2>

                                <p className="text-moss-700 leading-relaxed mb-6">
                                    {section.content}
                                </p>

                                {section.list && (
                                    <ul className="space-y-3 mb-6">
                                        {section.list.map((item, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                                <span className="text-moss-700">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {section.tips && (
                                    <div className="grid gap-4 mt-8">
                                        {section.tips.map((tip, i) => (
                                            <div key={i} className="bg-sage-50 rounded-2xl p-6 border-l-4 border-emerald-500">
                                                <h4 className="font-bold text-moss-900 mb-2">{tip.title}</h4>
                                                <p className="text-moss-700 text-sm leading-relaxed">{tip.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Conclusion */}
                        <div className="bg-gradient-to-br from-moss-50 to-emerald-50 rounded-3xl p-8 mb-8 border border-emerald-100">
                            <h3 className="text-2xl font-display font-bold text-moss-900 mb-4">Final Thoughts</h3>
                            <p className="text-moss-700 leading-relaxed">
                                {article.content.conclusion}
                            </p>
                        </div>

                        {/* Key Takeaways */}
                        <div className="bg-moss-900 text-white rounded-3xl p-8">
                            <h3 className="text-2xl font-display font-bold mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-lg">✓</span>
                                Key Takeaways
                            </h3>
                            <ul className="space-y-4">
                                {article.content.keyTakeaways.map((takeaway, i) => (
                                    <li key={i} className="flex items-start gap-4">
                                        <span className="text-emerald-400 font-bold text-xl shrink-0">{i + 1}.</span>
                                        <span className="text-emerald-100 leading-relaxed">{takeaway}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* CTA Card */}
                <Card className="mt-8 bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-xl">
                    <CardContent className="p-8 text-center">
                        <h3 className="text-2xl font-display font-bold mb-4">
                            Need More Support?
                        </h3>
                        <p className="text-emerald-100 mb-6 max-w-2xl mx-auto">
                            Our AI companion is available 24/7 to provide personalized support and guidance based on clinical protocols.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                onClick={() => navigate('/chat')}
                                size="lg"
                                className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold"
                            >
                                Chat with ManoSathi AI
                            </Button>
                            <Button
                                onClick={() => navigate('/journal')}
                                size="lg"
                                variant="outline"
                                className="border-white text-white hover:bg-white/10"
                            >
                                Start Journaling
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
