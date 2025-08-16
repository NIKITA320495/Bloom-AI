
import { Flame, Waves, BatteryCharging, Annoyed, Smile, Frown, Pill, HeartPulse, Shield, Leaf, Slash, FileQuestion, Wind, Brain, PersonStanding, Feather, Zap, Sunrise, Sun, Sunset, Stethoscope, Droplets, Apple, Dumbbell, CalendarDays, Beer, Cigarette, Scale, Ruler, Bot, AreaChart, BookOpen, Lightbulb } from 'lucide-react';
import type { Symptom, Article, Doctor, SelectableItem, PeriodFlow, Fact, Insight } from './types';

export const symptoms: Symptom[] = [
  { id: 'hot-flash', name: 'Hot Flash', icon: Flame },
  { id: 'bloating', name: 'Bloating', icon: Annoyed },
  { id: 'cramps', name: 'Cramps', icon: Wind },
  { id: 'anxiety', name: 'Anxiety', icon: Brain },
  { id: 'back-pain', name: 'Back Pain', icon: PersonStanding },
  { id: 'fatigue', name: 'Fatigue', icon: BatteryCharging },
  { id: 'headache', name: 'Headache', icon: Sun },
];

export const moods: Symptom[] = [
    { id: 'happy', name: 'Happy', icon: Smile },
    { id: 'sad', name: 'Sad', icon: Frown },
    { id: 'annoyed', name: 'Annoyed', icon: Annoyed },
    { id: 'mood-swing', name: 'Mood Swing', icon: Waves },
    { id: 'depressed', name: 'Depressed', icon: Frown },
    { id: 'calm', name: 'Calm', icon: Feather },
    { id: 'energetic', name: 'Energetic', icon: Zap },
]

export const periodFlows: PeriodFlow[] = [
  { id: 'none', name: 'None' },
  { id: 'light', name: 'Light' },
  { id: 'medium', name: 'Medium' },
  { id: 'heavy', name: 'Heavy' },
  { id: 'very_heavy', name: 'Very Heavy' },
];

export const periodRegularity: SelectableItem[] = [
    { id: 'regular', name: 'Yes', icon: CalendarDays },
    { id: 'occasionally-irregular', name: 'No', icon: CalendarDays },
    { id: 'irregular', name: "Don't Know", icon: CalendarDays },
];

export const healthConditions: SelectableItem[] = [
    { id: 'pcos-pcod', name: 'PCOS/PCOD', icon: Droplets },
    { id: 'endometriosis', name: 'Endometriosis', icon: Droplets },
    { id: 'thyroid', name: 'Thyroid', icon: Shield },
    { id: 'diabetes', name: 'Diabetes', icon: HeartPulse },
    { id: 'hypertension', name: 'Hypertension', icon: HeartPulse },
    { id: 'other', name: 'Other', icon: FileQuestion },
    { id: 'none', name: 'None', icon: Slash },
];

export const medications: SelectableItem[] = [
    { id: 'iron', name: 'Iron', icon: Pill },
    { id: 'calcium', name: 'Calcium', icon: Pill },
    { id: 'vitamin-d', name: 'Vitamin D', icon: Sun },
    { id: 'multivitamin', name: 'Multivitamin', icon: Pill },
    { id: 'thyroid-med', name: 'Thyroid', icon: Pill },
    { id: 'metformin', name: 'Metformin', icon: Pill },
    { id: 'other', name: 'Other', icon: Leaf },
    { id: 'none', name: 'None', icon: Slash },
];

export const lifestyle: SelectableItem[] = [
    { id: 'smoker', name: 'Smoker', icon: Cigarette },
    { id: 'alcohol', name: 'Drink Alcohol', icon: Beer },
    { id: 'exercise', name: 'Exercise ≥3/week', icon: Dumbbell },
    { id: 'none', name: 'None of the above', icon: Slash },
]

export const facts: Fact[] = [
  {
    title: "You're Not Alone",
    description: "75% of women experience hot flashes. You are part of a large community.",
    image: "https://i.pinimg.com/736x/4d/a1/bf/4da1bf86a081d06e459a8c371814c294.jpg",
    aiHint: "group of supportive women",
  },
  {
    title: "Knowledge is Power",
    description: "94% of women say they received no education about menopause in school. Learning about it now is a proactive step.",
    image: "https://i.pinimg.com/1200x/d1/f3/e7/d1f3e789cb5ebd42c9fe267de05c6763.jpg",
    aiHint: "woman reading book",
  },
   {
    title: "It's Okay to Ask for Help",
    description: "Over half of women wait six months or more before seeking care for life-disrupting symptoms. Early consultation can make a huge difference.",
    image: "https://i.pinimg.com/736x/b7/12/96/b712963862becac3f0240503fc2c05d3.jpg",
    aiHint: "doctor patient consultation",
  },
  {
    title: "The Transition Varies",
    description: "Perimenopause typically starts in your mid-40s and lasts 4 years on average, but can last up to 10 years.",
    image: "https://i.pinimg.com/1200x/cf/4a/ca/cf4aca3f1e1977e5e9803be171020d55.jpg",
    aiHint: "calendar turning pages",
  },
];

export const insights: Insight[] = [
  {
    title: "Ask Bloom AI",
    description: "Get answers to your health questions.",
    icon: Bot,
    link: "/ai-chat",
    color: "bg-blue-100",
  },
  {
    title: "View Reports",
    description: "See your monthly health trends.",
    icon: AreaChart,
    link: "/reports",
    color: "bg-green-100",
  },
  {
    title: "AI Consultation",
    description: "Get a personalized health plan.",
    icon: Lightbulb,
    link: "/consultation",
    color: "bg-yellow-100",
  },
  {
    title: "Learn More",
    description: "Read articles about menopause.",
    icon: BookOpen,
    link: "#learn-and-grow",
    color: "bg-purple-100",
  },
];


export const articles: Article[] = [
  {
    title: "Menopause is Not the End, It's a New Beginning",
    category: "Break the Taboos",
    image: "https://i.pinimg.com/736x/0e/b6/1b/0eb61bcecfb7511d7860ff5f16a66519.jpg",
    link: "https://www.google.com",
  },
  {
    title: "Talking to Your Family About Menopause",
    category: "Break the Taboos",
    image: "https://i.pinimg.com/1200x/19/90/41/19904102f68309036da412fbc0e73ece.jpg",
    link: "https://www.google.com",
  },
  {
    title: "Myth vs. Fact: Hot Flashes",
    category: "Break the Taboos",
    image: "https://i.pinimg.com/736x/a9/cd/40/a9cd40483461513d9842208c2031d527.jpg",
    link: "https://www.google.com",
  },
  {
    title: "What Is Perimenopause? Signs, Stages &amp; What to Do",
    category: "Learn &amp; Grow",
    image: "https://i.pinimg.com/1200x/e1/0a/20/e10a20bcb13e756b1514bd92eb9f6f7b.jpg",
    link: "https://drannacabeca.com/blogs/menopause/what-is-perimenopause-signs-stages",
  },
  {
    title: "Menopause Myths &amp; Truths",
    category: "Learn &amp; Grow",
    image: "https://i.pinimg.com/736x/0b/ce/f2/0bcef2fd328354d581e759f9b9751062.jpg",
    link: "https://drannacabeca.com/blogs/menopause/menopause-myths-truths",
  },
  {
    title: "Magic Menopause - Is It For You?",
    category: "Learn &amp; Grow",
    image: "https://i.pinimg.com/1200x/77/7a/62/777a62bb58b98297b21014acb6253e89.jpg",
    link: "https://drannacabeca.com/blogs/menopause/magic-menopause",
  },
  {
    title: "Sudden, Crashing Fatigue in Females",
    category: "Learn &amp; Grow",
    image: "https://i.pinimg.com/736x/f9/fe/aa/f9feaa3cf5a6883805aa4312f41766af.jpg",
    link: "https://drannacabeca.com/blogs/hormones/sudden-crashing-fatigue-female",
  },
  {
    title: "Mindful Moments for Stressful Days",
    category: "Mindfulness",
    image: "https://i.pinimg.com/736x/ca/3b/ef/ca3befcf046c35546b39b044d6ca5684.jpg",
    link: "https://www.google.com",
  },
  {
    title: "Beginner's Guide to Meditation",
    category: "Mindfulness",
    image: "https://i.pinimg.com/1200x/77/5d/06/775d06006c353495a3fe29056339e2b1.jpg",
    link: "https://www.google.com",
  },
  {
    title: "How Breathwork Can Calm Anxiety",
    category: "Mindfulness",
    image: "https://i.pinimg.com/1200x/a6/51/99/a651999de96b69e15570c1f395eaa3a1.jpg",
    link: "https://www.google.com",
  },
];

export const doctors: Doctor[] = [
    {
        name: "Dr. Anjali Sharma",
        specialization: "Gynecologist",
        experience: 15,
        rating: 4.8,
        image: "https://i.pinimg.com/736x/ad/6c/b0/ad6cb07e44a5e63ffc89d7723b181052.jpg"
    },
    {
        name: "Dr. Priya Desai",
        specialization: "Nutritionist",
        experience: 10,
        rating: 4.9,
        image: "https://i.pinimg.com/736x/f3/6e/22/f36e224d917d34f56d5f6d9e3124734a.jpg"
    },
    {
        name: "Dr. Meera Gupta",
        specialization: "Endocrinologist",
        experience: 20,
        rating: 4.7,
        image: "https://i.pinimg.com/1200x/d7/2d/ef/d72def8b4cae0c43ccf0aa80e63b3b4f.jpg"
    },
    {
        name: "Dr. Sunita Patel",
        specialization: "Mental Health Counselor",
        experience: 12,
        rating: 5.0,
        image: "https://i.pinimg.com/736x/cb/b1/c5/cbb1c59ced3d357105a665782ba8dfd0.jpg"
    }
]


    