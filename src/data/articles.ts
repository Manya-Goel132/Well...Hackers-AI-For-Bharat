export interface Article {
    id: string;
    title: string;
    subtitle: string;
    readTime: string;
    category: string;
    author: {
        name: string;
        role: string;
        credentials?: string;
    };
    publishDate: string;
    iconColor: string;
    content: {
        introduction: string;
        sections: {
            heading: string;
            content: string;
            list?: string[];
            tips?: { title: string; description: string }[];
        }[];
        conclusion: string;
        keyTakeaways: string[];
    };
}

export const articles: Record<string, Article> = {
    'understanding-anxiety': {
        id: 'understanding-anxiety',
        title: 'Understanding Anxiety',
        subtitle: 'Learn the science behind anxiety and practical tools to manage overwhelming feelings',
        readTime: '5 min read',
        category: 'Mental Health Basics',
        author: {
            name: 'Dr. Priya Sharma',
            role: 'Clinical Psychologist',
            credentials: 'Ph.D., M.Phil. Clinical Psychology'
        },
        publishDate: '2024-02-10',
        iconColor: 'blue',
        content: {
            introduction: 'Anxiety is one of the most common mental health challenges affecting millions worldwide. While feeling anxious before important events is normal, persistent anxiety can significantly impact your quality of life. Understanding what anxiety is and how it works is the first step toward managing it effectively.',
            sections: [
                {
                    heading: 'What is Anxiety?',
                    content: 'Anxiety is your body\'s natural response to stress—a feeling of fear or apprehension about what\'s to come. It\'s part of our evolutionary "fight or flight" response designed to protect us from danger. However, when anxiety becomes excessive or disproportionate to the situation, it can become a disorder.',
                    list: [
                        'Normal anxiety: Helps you stay alert and focused',
                        'Anxiety disorder: Interferes with daily activities and relationships',
                        'Physical symptoms: Racing heart, sweating, trembling, fatigue',
                        'Mental symptoms: Excessive worry, difficulty concentrating, irritability'
                    ]
                },
                {
                    heading: 'The Science Behind Anxiety',
                    content: 'When you perceive a threat, your amygdala (the brain\'s alarm system) triggers a cascade of responses. Your body releases stress hormones like cortisol and adrenaline, preparing you for action. In people with anxiety disorders, this system can be overactive, triggering false alarms even in safe situations.',
                },
                {
                    heading: 'Common Types of Anxiety Disorders',
                    content: 'Understanding your specific type of anxiety can help you find the right treatment approach.',
                    tips: [
                        {
                            title: 'Generalized Anxiety Disorder (GAD)',
                            description: 'Persistent and excessive worry about various aspects of daily life, lasting 6+ months'
                        },
                        {
                            title: 'Social Anxiety Disorder',
                            description: 'Intense fear of social situations and being judged or embarrassed by others'
                        },
                        {
                            title: 'Panic Disorder',
                            description: 'Recurrent unexpected panic attacks with physical symptoms like chest pain and shortness of breath'
                        },
                        {
                            title: 'Specific Phobias',
                            description: 'Excessive fear of specific objects or situations (heights, flying, spiders, etc.)'
                        }
                    ]
                },
                {
                    heading: 'Evidence-Based Management Techniques',
                    content: 'Research shows that several approaches can effectively reduce anxiety symptoms:',
                    tips: [
                        {
                            title: 'Cognitive Behavioral Therapy (CBT)',
                            description: 'The gold standard treatment helps you identify and challenge anxious thoughts and behaviors'
                        },
                        {
                            title: 'Mindfulness & Meditation',
                            description: 'Regular practice can reduce anxiety by training your mind to stay present rather than worrying about the future'
                        },
                        {
                            title: 'Progressive Muscle Relaxation',
                            description: 'Systematically tensing and relaxing muscle groups to reduce physical tension'
                        },
                        {
                            title: 'Breathing Exercises',
                            description: 'Deep, controlled breathing activates your parasympathetic nervous system, countering the stress response'
                        }
                    ]
                }
            ],
            conclusion: 'Remember, experiencing anxiety doesn\'t mean you\'re weak or broken. Your brain is simply being overprotective. With the right tools and support, you can learn to manage anxiety effectively. If your anxiety is significantly impacting your life, don\'t hesitate to seek professional help. ManoSathi is here to support you on this journey.',
            keyTakeaways: [
                'Anxiety is a normal protective response that can become problematic when excessive',
                'Understanding the biological basis helps reduce self-blame and stigma',
                'Multiple evidence-based treatments are available and effective',
                'Professional help is recommended if anxiety interferes with daily functioning',
                'Self-help tools like breathing exercises and mindfulness can provide immediate relief'
            ]
        }
    },
    'sleep-hygiene-101': {
        id: 'sleep-hygiene-101',
        title: 'Sleep Hygiene 101',
        subtitle: 'Simple habits to improve your sleep quality and wake up feeling refreshed',
        readTime: '7 min read',
        category: 'Wellness',
        author: {
            name: 'Dr. Anjali Desai',
            role: 'Sleep Specialist & Psychiatrist',
            credentials: 'MD Psychiatry, Sleep Medicine Fellow'
        },
        publishDate: '2024-02-08',
        iconColor: 'indigo',
        content: {
            introduction: 'Quality sleep is foundational to mental health, yet over 60% of Indians report sleep difficulties. Poor sleep doesn\'t just make you tired—it significantly impacts mood, cognitive function, and emotional regulation. Sleep hygiene refers to the habits and practices that promote consistent, uninterrupted sleep.',
            sections: [
                {
                    heading: 'Why Sleep Hygiene Matters',
                    content: 'During sleep, your brain consolidates memories, processes emotions, and removes toxins. Chronic sleep deprivation has been linked to increased risk of depression, anxiety, and other mental health conditions. Good sleep hygiene can improve both the quantity and quality of your rest.',
                    list: [
                        'Adults need 7-9 hours of sleep per night',
                        'Consistent sleep schedule regulates your circadian rhythm',
                        'Sleep quality is as important as sleep quantity',
                        'Poor sleep amplifies emotional reactivity and stress'
                    ]
                },
                {
                    heading: 'The Perfect Sleep Environment',
                    content: 'Your bedroom should be a sanctuary dedicated to rest and relaxation.',
                    tips: [
                        {
                            title: 'Optimize Temperature',
                            description: 'Keep your room cool (18-20°C / 65-68°F). A drop in core body temperature signals your brain it\'s time to sleep'
                        },
                        {
                            title: 'Control Light Exposure',
                            description: 'Use blackout curtains or eye masks. Even small amounts of light can disrupt melatonin production'
                        },
                        {
                            title: 'Minimize Noise',
                            description: 'Use earplugs or white noise machines to block disruptive sounds'
                        },
                        {
                            title: 'Invest in Comfort',
                            description: 'A quality mattress and pillows that support your sleeping position make a significant difference'
                        }
                    ]
                },
                {
                    heading: 'Pre-Sleep Routine That Works',
                    content: 'Developing a consistent wind-down routine signals your body it\'s time to transition to sleep.',
                    tips: [
                        {
                            title: '60 Minutes Before Bed: Digital Sunset',
                            description: 'Stop using phones, tablets, and computers. Blue light suppresses melatonin and keeps you alert'
                        },
                        {
                            title: '45 Minutes: Light Physical Activity',
                            description: 'Gentle stretching or yoga can help release physical tension from the day'
                        },
                        {
                            title: '30 Minutes: Dim the Lights',
                            description: 'Lower lighting throughout your home to encourage melatonin production'
                        },
                        {
                            title: '15 Minutes: Calming Activity',
                            description: 'Read a book, journal, or practice meditation. Avoid stimulating or stressful content'
                        }
                    ]
                },
                {
                    heading: 'Daytime Habits for Better Sleep',
                    content: 'What you do during the day significantly impacts your night\'s rest.',
                    list: [
                        'Get morning sunlight within 30 minutes of waking to set your circadian rhythm',
                        'Exercise regularly, but not within 3 hours of bedtime',
                        'Limit caffeine after 2 PM—it has a half-life of 5-6 hours',
                        'Avoid long daytime naps (limit to 20-30 minutes before 3 PM)',
                        'Eat your last heavy meal 3 hours before bed',
                        'Limit alcohol—while it may help you fall asleep, it disrupts sleep quality'
                    ]
                },
                {
                    heading: 'When You Can\'t Sleep',
                    content: 'If you\'ve been lying awake for 20+ minutes, get up and do a calm activity in dim light until you feel sleepy. This prevents your brain from associating your bed with wakefulness.',
                }
            ],
            conclusion: 'Improving sleep hygiene is one of the most impactful changes you can make for your mental health. While it may take 2-3 weeks to see full results, the benefits are profound. If sleep problems persist despite good hygiene, consult a healthcare provider—you may have an underlying sleep disorder that requires specific treatment.',
            keyTakeaways: [
                'Consistency is key—maintain the same sleep and wake times, even on weekends',
                'Your bedroom environment should be cool, dark, and quiet',
                'Develop a relaxing pre-sleep routine and stick to it',
                'Daytime habits (exercise, light exposure, caffeine) impact nighttime sleep',
                'If problems persist, seek professional evaluation for sleep disorders'
            ]
        }
    },
    'grounding-techniques': {
        id: 'grounding-techniques',
        title: 'Grounding Techniques for Anxiety & Panic',
        subtitle: 'Quick exercises to regain focus when you feel panic or dissociation',
        readTime: '3 min read',
        category: 'Coping Skills',
        author: {
            name: 'Meera Iyer',
            role: 'Trauma-Informed Therapist',
            credentials: 'MSW, Certified EMDR Therapist'
        },
        publishDate: '2024-02-12',
        iconColor: 'emerald',
        content: {
            introduction: 'Grounding techniques are powerful tools to help you stay present when you\'re experiencing overwhelming anxiety, panic, or dissociation. They work by redirecting your attention from distressing thoughts to your immediate physical reality, interrupting the cycle of escalating panic.',
            sections: [
                {
                    heading: 'What is Grounding?',
                    content: 'Grounding is a practice that helps you connect with the present moment through your five senses. When anxiety takes over, your mind often races to the future (what if?) or past (what happened?). Grounding anchors you firmly in the now, where you\'re actually safe.',
                },
                {
                    heading: 'The 5-4-3-2-1 Technique',
                    content: 'This is the most popular grounding exercise because it\'s easy to remember and highly effective during panic attacks.',
                    tips: [
                        {
                            title: '5 Things You Can See',
                            description: 'Look around and name 5 things you can see. Be specific: "a blue pen," "a crack in the ceiling," "a green plant"'
                        },
                        {
                            title: '4 Things You Can Touch',
                            description: 'Notice the texture of your clothes, the chair you\'re sitting on, the floor beneath your feet, or your own hands'
                        },
                        {
                            title: '3 Things You Can Hear',
                            description: 'Identify sounds in your environment: traffic, birds, air conditioning, your own breathing'
                        },
                        {
                            title: '2 Things You Can Smell',
                            description: 'Notice any scents around you, or carry a small bottle of essential oil for this purpose'
                        },
                        {
                            title: '1 Thing You Can Taste',
                            description: 'Notice the current taste in your mouth, or eat/drink something mindfully'
                        }
                    ]
                },
                {
                    heading: 'Physical Grounding Techniques',
                    content: 'These exercises use physical sensations to interrupt the panic response.',
                    tips: [
                        {
                            title: 'Cold Water Immersion',
                            description: 'Splash cold water on your face or hold ice cubes. The shock activates your parasympathetic nervous system'
                        },
                        {
                            title: 'Feet on the Floor',
                            description: 'Press your feet firmly into the ground. Wiggle your toes. Feel the connection to the earth supporting you'
                        },
                        {
                            title: 'Progressive Muscle Relaxation',
                            description: 'Tense and release each muscle group from toes to head, noticing the difference between tension and relaxation'
                        },
                        {
                            title: 'Physical Movement',
                            description: 'Jump up and down, do 10 jumping jacks, or go for a brisk walk to discharge anxiety energy'
                        }
                    ]
                },
                {
                    heading: 'Mental Grounding Techniques',
                    content: 'These engage your mind to break the cycle of anxious thoughts.',
                    tips: [
                        {
                            title: 'Category Listing',
                            description: 'Name as many items as you can in a category (fruits, countries, movies). This occupies your working memory'
                        },
                        {
                            title: 'Counting Backwards',
                            description: 'Count down from 100 by 7s (100, 93, 86...). The mental effort interrupts panic thoughts'
                        },
                        {
                            title: 'Describe Your Surroundings',
                            description: 'Describe an object in extreme detail as if to someone who can\'t see it'
                        },
                        {
                            title: 'Safe Place Visualization',
                            description: 'Imagine a place where you feel completely safe and calm. Engage all five senses in this imagery'
                        }
                    ]
                },
                {
                    heading: 'When to Use Grounding',
                    content: 'Grounding is particularly helpful for:',
                    list: [
                        'Panic attacks or intense anxiety',
                        'Dissociative episodes or feeling "unreal"',
                        'Flashbacks or intrusive memories (PTSD)',
                        'Overwhelming emotions that feel out of control',
                        'Before/during exposure to anxiety triggers'
                    ]
                }
            ],
            conclusion: 'Grounding techniques are skills that improve with practice. Don\'t wait for a crisis to try them—practice when you\'re calm so they become second nature. Keep a grounding "toolkit" with items like stress balls, scented oils, mints, or a textured object you can carry with you. Remember: The goal isn\'t to make anxiety disappear instantly, but to bring it down to a manageable level.',
            keyTakeaways: [
                'Grounding redirects attention from anxious thoughts to present-moment sensory experience',
                'The 5-4-3-2-1 technique is easy to remember and highly effective',
                'Physical grounding (cold water, movement) can quickly interrupt panic',
                'Mental grounding (counting, categories) occupies your working memory',
                'Practice regularly when calm so techniques are accessible during crises'
            ]
        }
    }
};

export const getArticleById = (id: string): Article | undefined => {
    return articles[id];
};

export const getAllArticles = (): Article[] => {
    return Object.values(articles);
};
