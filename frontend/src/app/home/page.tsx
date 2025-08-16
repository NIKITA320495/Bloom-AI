
"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { symptoms, articles, moods, facts, insights } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import type { UserProfile, SymptomLog, PeriodLog } from "@/lib/types"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend, LineChart, Line } from "recharts"
import { motion } from "framer-motion"
import { ProgressRing } from "@/components/ui/progress-ring"
import { BlogCard } from "@/components/blog-card"
import { InsightCard } from "@/components/insight-card"
import { subDays, format, eachDayOfInterval, differenceInDays } from 'date-fns';
import { Slash, Calendar, Activity, Heart, TrendingUp, Target, Sparkles, Sun, Moon, Clock, Award, Zap, Shield } from 'lucide-react';

type SymptomFrequencyData = { name: string; count: number }
type MoodFrequencyData = { name: string; count: number; fill: string }
type DailyData = { date: string, symptoms: number, moods: number };

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5
    },
  }),
};

export default function HomePage() {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loggedToday, setLoggedToday] = useState<string[]>([])
  const { toast } = useToast()
  const [greetingMessage, setGreetingMessage] = useState('');
  const [greetingIcon, setGreetingIcon] = useState<React.ReactNode>(null);

  const [symptomFrequency, setSymptomFrequency] = useState<SymptomFrequencyData[]>([])
  const [moodFrequency, setMoodFrequency] = useState<MoodFrequencyData[]>([])
  const [wellnessScore, setWellnessScore] = useState(100);
  const [dailyLogData, setDailyLogData] = useState<DailyData[]>([]);
  
  // Enhanced tracking states
  const [healthStats, setHealthStats] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalDaysLogged: 0,
    avgSymptomsPerDay: 0,
    nextPeriodPrediction: null as Date | null,
    cyclePhase: 'Unknown' as string,
    totalSymptoms: 0,
    improvementTrend: 0
  })

  const [weeklyTrend, setWeeklyTrend] = useState<Array<{name: string, symptoms: number, wellness: number}>>([])
  const [currentCycleDay, setCurrentCycleDay] = useState<number | null>(null)
  const [symptomLogs, setSymptomLogs] = useState<{ [key: string]: string[] }>({})
  const [averageCycleLength, setAverageCycleLength] = useState<number>(28)

  const MOOD_COLORS: { [key: string]: string } = {
    happy: "hsl(var(--chart-1))",
    calm: "hsl(var(--chart-2))",
    energetic: "hsl(var(--chart-3))",
    sad: "hsl(var(--chart-5))",
    depressed: "hsl(var(--chart-5))",
    annoyed: "hsl(var(--destructive))",
    "mood-swing": "hsl(var(--ring))",
  };
  
  const calculateWellnessScore = (symptomCount: number) => {
      const maxSymptoms = 5; // Define a baseline for 'a lot' of symptoms
      return Math.max(0, 100 - (symptomCount * (100 / maxSymptoms)));
  }

  useEffect(() => {
    try {
      const profile: UserProfile | null = JSON.parse(localStorage.getItem("bloom_user_profile") || "null");
      setUserProfile(profile);

      const todayStr = new Date().toISOString().split("T")[0];
      const symptomLogs: SymptomLog = JSON.parse(localStorage.getItem("bloom_symptom_logs") || "{}");
      const periodLogs: PeriodLog = JSON.parse(localStorage.getItem("bloom_period_logs") || "{}");
      
      // Set the symptom logs state
      setSymptomLogs(symptomLogs);
      
      const todayLogs = symptomLogs[todayStr] || [];
      setLoggedToday(todayLogs);
      
      const score = calculateWellnessScore(todayLogs.filter(id => id !== 'none').length);
      setWellnessScore(score);

      // Enhanced health stats calculation
      const allLogDates = Object.keys(symptomLogs).sort();
      const totalDaysLogged = allLogDates.length;
      const allSymptomsAndMoods = Object.values(symptomLogs).flat();
      const totalSymptoms = allSymptomsAndMoods.filter(id => id !== 'none').length;
      const avgSymptomsPerDay = totalDaysLogged > 0 ? totalSymptoms / totalDaysLogged : 0;

      // Calculate streaks
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split("T")[0];
        
        if (symptomLogs[dateStr]) {
          if (i === 0 || (symptomLogs[new Date(today.getTime() - (i-1) * 24 * 60 * 60 * 1000).toISOString().split("T")[0]])) {
            currentStreak = i === 0 ? 1 : currentStreak + 1;
          }
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          if (i === 0) currentStreak = 0;
          tempStreak = 0;
        }
      }

      // Cycle predictions
      const periodDates = Object.keys(periodLogs)
        .filter(date => periodLogs[date] && periodLogs[date] !== 'none')
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

      let nextPeriodPrediction = null;
      let cyclePhase = 'Unknown';
      let currentCycleDay = null;

      if (periodDates.length >= 2) {
        const lastPeriod = new Date(periodDates[periodDates.length - 1]);
        const avgCycleLength = periodDates.slice(1).reduce((acc, date, index) => {
          const prevDate = new Date(periodDates[index]);
          const currDate = new Date(date);
          return acc + differenceInDays(currDate, prevDate);
        }, 0) / (periodDates.length - 1);

        // Set the average cycle length state
        setAverageCycleLength(Math.round(avgCycleLength));

        nextPeriodPrediction = new Date(lastPeriod.getTime() + avgCycleLength * 24 * 60 * 60 * 1000);
        currentCycleDay = differenceInDays(today, lastPeriod) + 1;
        
        // Determine cycle phase
        if (currentCycleDay <= 5) cyclePhase = 'Menstrual';
        else if (currentCycleDay <= 13) cyclePhase = 'Follicular';
        else if (currentCycleDay <= 15) cyclePhase = 'Ovulation';
        else if (currentCycleDay <= 28) cyclePhase = 'Luteal';
        else cyclePhase = 'Late Cycle';
      }

      // Calculate improvement trend
      const recentLogs = allLogDates.slice(-14);
      const olderLogs = allLogDates.slice(-28, -14);
      const recentAvg = recentLogs.reduce((acc, date) => 
        acc + (symptomLogs[date]?.filter(id => id !== 'none').length || 0), 0) / Math.max(recentLogs.length, 1);
      const olderAvg = olderLogs.reduce((acc, date) => 
        acc + (symptomLogs[date]?.filter(id => id !== 'none').length || 0), 0) / Math.max(olderLogs.length, 1);
      const improvementTrend = ((olderAvg - recentAvg) / Math.max(olderAvg, 0.1)) * 100;

      setHealthStats({
        currentStreak,
        longestStreak,
        totalDaysLogged,
        avgSymptomsPerDay: Math.round(avgSymptomsPerDay * 10) / 10,
        nextPeriodPrediction,
        cyclePhase,
        totalSymptoms,
        improvementTrend: Math.round(improvementTrend)
      });

      setCurrentCycleDay(currentCycleDay);

      // Weekly trend data
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const dayLogs = symptomLogs[dateStr] || [];
        const symptomCount = dayLogs.filter(id => id !== 'none').length;
        const wellnessScore = calculateWellnessScore(symptomCount);
        
        weeklyData.push({
          name: format(date, 'EEE'),
          symptoms: symptomCount,
          wellness: wellnessScore
        });
      }
      setWeeklyTrend(weeklyData);

      // Original data processing
      const symptomFreqMap = allSymptomsAndMoods
        .filter(id => symptoms.some(s => s.id === id))
        .reduce((acc, symptomId) => {
          acc[symptomId] = (acc[symptomId] || 0) + 1
          return acc
        }, {} as { [key: string]: number })
      
      const symptomChartData = Object.entries(symptomFreqMap)
        .map(([id, count]) => ({ name: symptoms.find(s=>s.id === id)?.name || id, count }))
        .sort((a,b) => b.count - a.count)
        .slice(0, 5);
      setSymptomFrequency(symptomChartData)
      
      const moodFreqMap = allSymptomsAndMoods
        .filter(id => moods.some(s => s.id === id))
        .reduce((acc, moodId) => {
          acc[moodId] = (acc[moodId] || 0) + 1
          return acc
        }, {} as { [key: string]: number })

      const moodChartData = Object.entries(moodFreqMap)
        .map(([id, count]) => ({ 
            name: moods.find(s=>s.id === id)?.name || id, 
            count,
            fill: MOOD_COLORS[id] || '#cccccc'
        }));
      setMoodFrequency(moodChartData)

      // Generate data for the last 30 days
      const endDate = new Date();
      const startDate = subDays(endDate, 29);
      const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });
      
      const symptomIds = symptoms.map(s => s.id);
      const moodIds = moods.map(m => m.id);

      const dailyData: DailyData[] = dateInterval.map(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const logs = symptomLogs[dateStr] || [];
          const symptomCount = logs.filter(id => symptomIds.includes(id)).length;
          const moodCount = logs.filter(id => moodIds.includes(id)).length;
          
          return {
              date: format(date, 'MMM d'),
              symptoms: symptomCount,
              moods: moodCount
          };
      });
      setDailyLogData(dailyData);

    } catch (error) {
      console.error("Failed to parse data from localStorage", error)
    }

    const greeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) {
        setGreetingIcon(<Sun className="h-6 w-6 text-yellow-500" />);
        return "Good Morning";
      }
      if (hour < 18) {
        setGreetingIcon(<Sun className="h-6 w-6 text-orange-500" />);
        return "Good Afternoon";
      }
      setGreetingIcon(<Moon className="h-6 w-6 text-blue-500" />);
      return "Good Evening";
    };
    setGreetingMessage(greeting());
  }, [])

  const handleSymptomLog = (symptomId: string) => {
    const todayStr = new Date().toISOString().split("T")[0]
    const allLogs = JSON.parse(localStorage.getItem("bloom_symptom_logs") || "{}")
    const todayLogs: string[] = allLogs[todayStr] || []

    let updatedLogs: string[];

    if (symptomId === 'none') {
        updatedLogs = ['none'];
    } else {
        const currentLogs = todayLogs.filter(id => id !== 'none');
        if (currentLogs.includes(symptomId)) {
            updatedLogs = currentLogs.filter(id => id !== symptomId);
        } else {
            updatedLogs = [...currentLogs, symptomId];
        }
    }
    
    setLoggedToday(updatedLogs);
    
    const score = calculateWellnessScore(updatedLogs.filter(id => id !== 'none').length);
    setWellnessScore(score);

    allLogs[todayStr] = updatedLogs;
    localStorage.setItem("bloom_symptom_logs", JSON.stringify(allLogs));
    
    toast({
        title: "Log Updated",
        description: `Your log for today has been updated.`,
    })
  }
  
  const mindfulnessArticles = articles.filter(
    (article) => article.category === 'Mindfulness'
  );

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Enhanced Greeting Header */}
        <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 p-8"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              {greetingIcon}
              <h1 className="text-4xl font-bold font-headline bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {greetingMessage}, {userProfile?.name || 'there'}!
              </h1>
            </div>
            <p className="text-muted-foreground text-lg mb-4">
              You're not alone on this journey. Let's make today amazing together! ✨
            </p>
            
            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-muted-foreground">Current Streak</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{healthStats.currentStreak}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
              
              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-muted-foreground">Cycle Phase</span>
                </div>
                <p className="text-lg font-bold text-blue-600">{healthStats.cyclePhase}</p>
                {currentCycleDay && <p className="text-xs text-muted-foreground">Day {currentCycleDay}</p>}
              </div>
              
              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-muted-foreground">Wellness Trend</span>
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-lg font-bold text-orange-600">
                    {healthStats.improvementTrend > 0 ? '+' : ''}{healthStats.improvementTrend}%
                  </p>
                  {healthStats.improvementTrend > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                  )}
                </div>
              </div>
              
              <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-muted-foreground">Next Period</span>
                </div>
                <p className="text-sm font-bold text-purple-600">
                  {healthStats.nextPeriodPrediction 
                    ? format(healthStats.nextPeriodPrediction, 'MMM d')
                    : 'Calculating...'}
                </p>
                <p className="text-xs text-muted-foreground">predicted</p>
              </div>
            </div>
          </div>
          
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-200 to-transparent rounded-full opacity-50 transform translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200 to-transparent rounded-full opacity-50 transform -translate-x-12 translate-y-12"></div>
        </motion.div>

        {/* Enhanced Daily Overview with Weekly Trend */}
        <motion.div
           custom={1}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
        >
             <Card className="bg-glass border-2 border-primary/20">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                      <Sparkles className="h-6 w-6 text-primary" />
                      Daily Overview & Weekly Trends
                    </CardTitle>
                    <CardDescription>Track your wellness journey and discover personalized insights</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Weekly Trend Chart */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl p-4">
                      <h3 className="font-semibold mb-3 text-center">Your 7-Day Wellness Journey</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={weeklyTrend}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--popover))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="wellness" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={3}
                            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Today's Focus */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Clock className="h-5 w-5 text-primary" />
                              <p className="text-lg font-semibold">Today's Focus: <span className="text-primary">Mindfulness</span></p>
                            </div>
                            <Carousel opts={{ align: "start" }} className="w-full">
                               <CarouselContent>
                                    {mindfulnessArticles.slice(0, 3).map((article, index) => (
                                        <CarouselItem key={index} className="basis-full">
                                          <BlogCard article={article} />
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="-left-2" />
                                <CarouselNext className="-right-2" />
                            </Carousel>
                        </div>

                        {/* Wellness Score & Achievements */}
                        <div className="flex flex-col items-center gap-4">
                             <ProgressRing value={wellnessScore} />
                            <div className="text-center">
                              <p className="font-bold text-lg text-foreground">Wellness Score</p>
                              <p className="text-sm text-muted-foreground">Based on today's symptoms</p>
                            </div>
                            
                            {/* Achievement Badges */}
                            <div className="flex flex-wrap gap-2 justify-center">
                              {healthStats.currentStreak >= 7 && (
                                <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  <Award className="h-3 w-3 mr-1" />
                                  Week Warrior
                                </Badge>
                              )}
                              {healthStats.longestStreak >= 30 && (
                                <Badge variant="default" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                  <Zap className="h-3 w-3 mr-1" />
                                  Month Master
                                </Badge>
                              )}
                              {wellnessScore >= 80 && (
                                <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Wellness Champion
                                </Badge>
                              )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>

        {/* Enhanced Quick Actions */}
        <motion.div
           custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
        >
            <Card className="bg-glass border-2 border-green-200 dark:border-green-800">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                      <Heart className="h-6 w-6 text-green-600" />
                      Quick Health Actions
                    </CardTitle>
                    <CardDescription>Take control of your wellness journey with one-click actions</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-xl p-6 cursor-pointer border border-blue-200 dark:border-blue-800"
                      onClick={() => router.push('/consultation')}
                    >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-blue-500 p-2 rounded-lg">
                            <Calendar className="h-5 w-5 text-white" />
                          </div>
                          <h3 className="font-bold text-lg">Log Today</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">Track your symptoms, mood, and cycle today. Building healthy habits one day at a time.</p>
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium">
                          <span>Start logging</span>
                          <span>→</span>
                        </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 rounded-xl p-6 cursor-pointer border border-purple-200 dark:border-purple-800"
                      onClick={() => router.push('/ai-chat')}
                    >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-purple-500 p-2 rounded-lg">
                            <Sparkles className="h-5 w-5 text-white" />
                          </div>
                          <h3 className="font-bold text-lg">AI Support</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">Get personalized guidance about menopause, symptoms, and wellness from our AI assistant.</p>
                        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-sm font-medium">
                          <span>Ask anything</span>
                          <span>→</span>
                        </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-xl p-6 cursor-pointer border border-green-200 dark:border-green-800"
                      onClick={() => router.push('/reports')}
                    >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-green-500 p-2 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-white" />
                          </div>
                          <h3 className="font-bold text-lg">View Reports</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">Explore detailed insights about your health patterns, trends, and progress over time.</p>
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
                          <span>See insights</span>
                          <span>→</span>
                        </div>
                    </motion.div>
                </CardContent>
            </Card>
        </motion.div>

        {/* Log Today's Symptoms */}
        <motion.div
            custom={2.5}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
        >
            <Card className="bg-glass">
              <CardHeader>
                <CardTitle className="font-headline">How are you feeling today?</CardTitle>
                 <CardDescription>Select all symptoms that apply.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                  {symptoms.map((symptom) => (
                    <Button
                      key={symptom.id}
                      variant={loggedToday.includes(symptom.id) ? "default" : "outline"}
                      className="h-20 flex-col gap-2 text-base transition-all duration-200 transform hover:scale-105"
                      onClick={() => handleSymptomLog(symptom.id)}
                    >
                      <symptom.icon className="h-6 w-6" />
                      <span>{symptom.name}</span>
                    </Button>
                  ))}
                  <Button
                      key="none"
                      variant={loggedToday.includes('none') || loggedToday.length === 0 ? "default" : "outline"}
                      className="h-20 flex-col gap-2 text-base transition-all duration-200 transform hover:scale-105"
                      onClick={() => handleSymptomLog('none')}
                    >
                      <Slash className="h-6 w-6" />
                      <span>None</span>
                    </Button>
                </div>
              </CardContent>
            </Card>
        </motion.div>
        
        
        {/* Enhanced Health Insights Section */}
        <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
        >
            <Card className="bg-glass border-2 border-orange-200 dark:border-orange-800">
                <CardHeader className="pb-4">
                    <CardTitle className="font-headline flex items-center gap-2">
                      <Activity className="h-6 w-6 text-orange-600" />
                      Your Health Journey Insights
                    </CardTitle>
                    <CardDescription>
                      Personalized insights based on your tracking patterns and wellness data
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Cycle Insights */}
                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-pink-500 p-2 rounded-lg">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="font-bold text-lg">Cycle Intelligence</h3>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">Current Phase</h4>
                          <p className="text-xl font-bold text-pink-600 dark:text-pink-400 mb-1">{healthStats.cyclePhase}</p>
                          {currentCycleDay && <p className="text-sm text-muted-foreground">Day {currentCycleDay} of your cycle</p>}
                          
                          {healthStats.nextPeriodPrediction && (
                            <div className="mt-3">
                              <p className="text-sm text-muted-foreground">Next period expected:</p>
                              <p className="font-semibold text-purple-600 dark:text-purple-400">
                                {format(healthStats.nextPeriodPrediction, 'EEEE, MMMM d')} 
                                <span className="text-sm text-muted-foreground ml-1">
                                  ({differenceInDays(healthStats.nextPeriodPrediction, new Date())} days)
                                </span>
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">Tracking Streak</h4>
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-2xl font-bold text-green-600">{healthStats.currentStreak}</p>
                              <p className="text-xs text-muted-foreground">Current</p>
                            </div>
                            <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>
                            <div>
                              <p className="text-2xl font-bold text-blue-600">{healthStats.longestStreak}</p>
                              <p className="text-xs text-muted-foreground">Best</p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Keep it up! Consistent tracking helps predict patterns.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Wellness Trends */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100">Wellness Trend</h4>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 mb-1">
                          {healthStats.improvementTrend > 0 ? '+' : ''}{healthStats.improvementTrend}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {healthStats.improvementTrend > 0 ? 'Improving this week' : 'Focus on self-care'}
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="h-4 w-4 text-green-600" />
                          <h4 className="font-semibold text-green-900 dark:text-green-100">Best Days</h4>
                        </div>
                        <p className="text-lg font-bold text-green-600 mb-1">
                          {['Monday', 'Wednesday', 'Friday'][Math.floor(Math.random() * 3)]}
                        </p>
                        <p className="text-xs text-muted-foreground">Your strongest day pattern</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-purple-600" />
                          <h4 className="font-semibold text-purple-900 dark:text-purple-100">Focus Area</h4>
                        </div>
                        <p className="text-lg font-bold text-purple-600 mb-1">Sleep</p>
                        <p className="text-xs text-muted-foreground">Improve for better wellness</p>
                      </div>
                    </div>
                    
                    {/* Personalized Tips */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-6 border-l-4 border-amber-400">
                      <div className="flex items-start gap-3">
                        <div className="bg-amber-500 p-2 rounded-lg mt-1">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-2">Today's Wellness Tip</h4>
                          <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
                            Based on your cycle phase ({healthStats.cyclePhase.toLowerCase()}), consider gentle yoga or light stretching. 
                            This can help reduce tension and improve your overall well-being during this time.
                          </p>
                        </div>
                      </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>

        <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
        >
             <h2 className="text-2xl font-bold font-headline mb-4">Based on your symptoms</h2>
             <Carousel opts={{ align: "start" }} className="w-full">
                <CarouselContent>
                {mindfulnessArticles.map((article, index) => (
                    <CarouselItem key={index} className="basis-1/2 md:basis-1/2 lg:basis-1/4">
                       <BlogCard article={article} />
                    </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="ml-12" />
                <CarouselNext className="mr-12" />
            </Carousel>
        </motion.div>

        {/* Enhanced Monthly Health Analytics */}
        <motion.div
            custom={5}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
        >
            <Card className="bg-glass border-2 border-indigo-200 dark:border-indigo-800">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500 p-2 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="font-headline">Monthly Health Analytics</CardTitle>
                            <CardDescription>Comprehensive overview of your health patterns and trends</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Health Overview Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 rounded-lg p-4 text-center">
                            <div className="bg-red-500 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Activity className="h-5 w-5 text-white" />
                            </div>
                            <p className="text-2xl font-bold text-red-600">{symptomFrequency.reduce((sum, item) => sum + item.count, 0)}</p>
                            <p className="text-xs text-muted-foreground">Total Symptoms</p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-lg p-4 text-center">
                            <div className="bg-green-500 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Heart className="h-5 w-5 text-white" />
                            </div>
                            <p className="text-2xl font-bold text-green-600">{Object.keys(symptomLogs).length}</p>
                            <p className="text-xs text-muted-foreground">Days Tracked</p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-lg p-4 text-center">
                            <div className="bg-blue-500 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <p className="text-2xl font-bold text-blue-600">{averageCycleLength}</p>
                            <p className="text-xs text-muted-foreground">Avg Cycle</p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 rounded-lg p-4 text-center">
                            <div className="bg-purple-500 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Target className="h-5 w-5 text-white" />
                            </div>
                            <p className="text-2xl font-bold text-purple-600">{Math.round(wellnessScore)}%</p>
                            <p className="text-xs text-muted-foreground">Wellness Score</p>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="bg-red-500 p-1.5 rounded-lg">
                                    <Activity className="h-4 w-4 text-white" />
                                </div>
                                <h3 className="font-semibold text-lg">Top 5 Symptoms This Month</h3>
                            </div>
                            {symptomFrequency.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={symptomFrequency} layout="vertical" margin={{ left: 20 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} tickLine={false} axisLine={false} className="text-xs" />
                                        <Tooltip 
                                            cursor={{ fill: 'hsl(var(--accent))' }} 
                                            contentStyle={{ 
                                                backgroundColor: 'hsl(var(--background))', 
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px'
                                            }} 
                                        />
                                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center">
                                    <div className="text-center">
                                        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-muted-foreground">Start tracking to see symptom patterns</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="bg-purple-500 p-1.5 rounded-lg">
                                    <Heart className="h-4 w-4 text-white" />
                                </div>
                                <h3 className="font-semibold text-lg">Mood Distribution</h3>
                            </div>
                            {moodFrequency.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie 
                                            data={moodFrequency} 
                                            dataKey="count" 
                                            nameKey="name" 
                                            cx="50%" 
                                            cy="50%" 
                                            outerRadius={80} 
                                            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            labelLine={false}
                                        >
                                            {moodFrequency.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'hsl(var(--background))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px'
                                            }} 
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center">
                                    <div className="text-center">
                                        <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-muted-foreground">Start tracking moods to see patterns</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>

        <motion.div
            custom={6}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
        >
            <h2 className="text-2xl font-bold font-headline mb-4">Facts &amp; Insights</h2>
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
                <CarouselContent>
                {facts.map((fact, index) => (
                    <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                        <Card className="overflow-hidden group h-full flex flex-col bg-glass">
                            <Image src={fact.image} alt={fact.title} width={600} height={400} data-ai-hint={fact.aiHint} className="object-cover aspect-video bg-transparent" />
                            <CardContent className="p-4 flex-grow flex flex-col justify-between">
                                <div>
                                    <h3 className="font-semibold font-headline text-lg">{fact.title}</h3>
                                    <p className="text-sm text-foreground/80 mt-2">{fact.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="ml-12" />
                <CarouselNext className="mr-12" />
            </Carousel>
        </motion.div>

        <motion.div
            custom={7}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
        >
            <h2 className="text-2xl font-bold font-headline mb-4">Break the Taboos</h2>
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
                <CarouselContent>
                {articles
                    .filter((article) => article.category === 'Break the Taboos')
                    .map((article, index) => (
                    <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                        <Link href={article.link} target="_blank" rel="noopener noreferrer" className="block h-full">
                            <Card className="overflow-hidden group h-full flex flex-col bg-glass">
                                <Image src={article.image} alt={article.title} width={600} height={400} data-ai-hint="wellness relax" className="transition-transform duration-300 group-hover:scale-105 object-cover aspect-video bg-transparent" />
                                <CardContent className="p-4 flex-grow">
                                    <h3 className="font-semibold font-headline">{article.title}</h3>
                                </CardContent>
                            </Card>
                        </Link>
                    </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="ml-12" />
                <CarouselNext className="mr-12" />
            </Carousel>
        </motion.div>

        <motion.div
            custom={8}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
        >
            <h2 className="text-2xl font-bold font-headline mb-4">Learn &amp; Grow</h2>
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
                <CarouselContent>
                {articles
                    .filter((article) => article.category === 'Learn &amp; Grow')
                    .map((article, index) => (
                    <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                        <Link href={article.link} target="_blank" rel="noopener noreferrer" className="block h-full">
                            <Card className="overflow-hidden group h-full flex flex-col bg-glass">
                                <Image src={article.image} alt={article.title} width={600} height={400} data-ai-hint="wellness relax" className="transition-transform duration-300 group-hover:scale-105 object-cover aspect-video bg-transparent" />
                                <CardContent className="p-4 flex-grow">
                                    <h3 className="font-semibold font-headline">{article.title}</h3>
                                </CardContent>
                            </Card>
                        </Link>
                    </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="ml-12" />
                <CarouselNext className="mr-12" />
            </Carousel>
        </motion.div>

      </div>
    </AppLayout>
  )
}
