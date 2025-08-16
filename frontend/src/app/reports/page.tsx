"use client"

import React, { useState, useEffect, useMemo } from "react"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, Area, AreaChart } from "recharts"
import { Download, BrainCircuit, Leaf, Calendar, TrendingUp, Activity, Heart, Target, AlertCircle, CheckCircle2 } from "lucide-react"
import { sendBasicQuery, formatDietaryRecommendationQuery, formatReportSummaryQuery } from "@/lib/api"
import type { PeriodLog, SymptomLog } from "@/lib/types"
import { symptoms as allSymptoms } from "@/lib/data"
import ReactMarkdown from 'react-markdown'
import { Badge } from "@/components/ui/badge"

type SymptomFrequencyData = {
  name: string
  count: number
}

type CycleLengthData = {
  name: string
  days: number
}

type SymptomTrendData = {
  date: string
  count: number
}

type PeriodFlowData = {
  name: string
  value: number
  color: string
}

export default function ReportsPage() {
  const [symptomData, setSymptomData] = useState<SymptomFrequencyData[]>([])
  const [cycleData, setCycleData] = useState<CycleLengthData[]>([])
  const [symptomTrendData, setSymptomTrendData] = useState<SymptomTrendData[]>([])
  const [periodFlowData, setPeriodFlowData] = useState<PeriodFlowData[]>([])
  const [aiSummary, setAiSummary] = useState<string>("")
  const [dietarySummary, setDietarySummary] = useState<string>("")
  const [isSummaryLoading, setIsSummaryLoading] = useState(true)
  const [isDietaryLoading, setIsDietaryLoading] = useState(true)
  const [healthStats, setHealthStats] = useState({
    totalSymptoms: 0,
    totalCycles: 0,
    loggingStreak: 0,
    avgSymptomsPerDay: 0,
    mostActiveLoggingMonth: '',
    healthScore: 0
  })

  const symptomMap = useMemo(() => new Map(allSymptoms.map(s => [s.id, s.name])), []);

  useEffect(() => {
    try {
      const symptomLogs: SymptomLog = JSON.parse(localStorage.getItem("bloom_symptom_logs") || "{}")
      const periodLogs: PeriodLog = JSON.parse(localStorage.getItem("bloom_period_logs") || "{}")

      // Symptom frequency
      const allLoggedSymptoms = Object.values(symptomLogs).flat()
      const frequencyMap = allLoggedSymptoms.reduce((acc, symptomId) => {
        acc[symptomId] = (acc[symptomId] || 0) + 1
        return acc
      }, {} as { [key: string]: number })
      
      const symptomChartData = Object.entries(frequencyMap)
        .map(([id, count]) => ({ name: symptomMap.get(id) || id, count }))
        .sort((a, b) => b.count - a.count);
      setSymptomData(symptomChartData)

      // Symptom trends over time
      const symptomTrends: { [date: string]: number } = {}
      Object.entries(symptomLogs).forEach(([date, symptoms]) => {
        symptomTrends[date] = symptoms.length
      })
      
      const trendData = Object.entries(symptomTrends)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .slice(-30) // Last 30 days
        .map(([date, count]) => ({
          date: new Date(date).toLocaleDateString(),
          count
        }))
      setSymptomTrendData(trendData)

      // Period flow distribution
      const flowCounts = { light: 0, medium: 0, heavy: 0 }
      Object.values(periodLogs).forEach(flow => {
        if (flow && flow !== 'none') {
          flowCounts[flow as keyof typeof flowCounts] = (flowCounts[flow as keyof typeof flowCounts] || 0) + 1
        }
      })
      
      const flowData: PeriodFlowData[] = [
        { name: 'Light', value: flowCounts.light, color: '#3B82F6' },
        { name: 'Medium', value: flowCounts.medium, color: '#8B5CF6' },
        { name: 'Heavy', value: flowCounts.heavy, color: '#EF4444' }
      ].filter(item => item.value > 0)
      setPeriodFlowData(flowData)

      // Cycle length calculation
      const periodDays = Object.keys(periodLogs)
        .filter(d => periodLogs[d] && periodLogs[d] !== 'none')
        .sort((a,b) => new Date(a).getTime() - new Date(b).getTime());

      if (periodDays.length > 1) {
        const cycleStarts: string[] = [periodDays[0]];
        for (let i = 1; i < periodDays.length; i++) {
          const prevDate = new Date(periodDays[i-1]);
          const currDate = new Date(periodDays[i]);
          const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays > 1) {
            cycleStarts.push(periodDays[i]);
          }
        }
        
        const cycleLengths: CycleLengthData[] = []
        for (let i = 0; i < cycleStarts.length - 1; i++) {
          const start1 = new Date(cycleStarts[i])
          const start2 = new Date(cycleStarts[i+1])
          const diffTime = Math.abs(start2.getTime() - start1.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          cycleLengths.push({ name: `Cycle ${i + 1}`, days: diffDays })
        }
        setCycleData(cycleLengths)
      }

      // Calculate health stats
      const totalDaysLogged = Object.keys(symptomLogs).length
      const totalSymptoms = allLoggedSymptoms.length
      const avgSymptomsPerDay = totalDaysLogged > 0 ? totalSymptoms / totalDaysLogged : 0
      
      // Calculate logging streak
      const sortedDates = Object.keys(symptomLogs).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      let streak = 0
      let currentDate = new Date()
      for (const dateStr of sortedDates) {
        const logDate = new Date(dateStr)
        const diffDays = Math.floor((currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays <= streak + 1) {
          streak++
          currentDate = logDate
        } else {
          break
        }
      }
      
      // Health score calculation (0-100)
      const consistencyScore = Math.min((totalDaysLogged / 30) * 100, 100)
      const regularityScore = cycleData.length > 1 ? 
        Math.max(0, 100 - (Math.abs(cycleData[cycleData.length - 1]?.days - 28) * 5)) : 50
      const healthScore = Math.round((consistencyScore + regularityScore) / 2)

      setHealthStats({
        totalSymptoms,
        totalCycles: cycleData.length,
        loggingStreak: streak,
        avgSymptomsPerDay: Math.round(avgSymptomsPerDay * 10) / 10,
        mostActiveLoggingMonth: 'This Month', // Simplified for now
        healthScore
      })

    } catch (error) {
      console.error("Failed to process report data", error)
    }
  }, [symptomMap])

  useEffect(() => {
    async function fetchAiSummaries() {
      if (symptomData.length === 0 && cycleData.length === 0) {
        setIsSummaryLoading(false)
        setIsDietaryLoading(false)
        return
      }
      
      // Generate Overall Summary
      setIsSummaryLoading(true);
      try {
          const cycleLengthVariation = cycleData.length > 0
              ? `Cycle lengths have varied between ${Math.min(...cycleData.map(d => d.days))} and ${Math.max(...cycleData.map(d => d.days))} days.`
              : "Not enough cycle data to determine length variation.";
          
          const mostFrequentSymptom = symptomData.length > 0
              ? symptomData[0].name
              : "no specific symptom";
          
          const symptomFrequency = `The most frequently reported symptom was ${mostFrequentSymptom}.`;

          const result = await sendBasicQuery(formatReportSummaryQuery({
              cycleLengthVariation,
              symptomFrequency
          }), 'report-user');
          setAiSummary(result);
      } catch (error) {
          console.error("AI summary error:", error);
          setAiSummary("Could not generate summary at this time.");
      } finally {
          setIsSummaryLoading(false);
      }
      
      // Generate Dietary Recs
      setIsDietaryLoading(true);
      try {
        const frequentSymptomNames = symptomData.slice(0, 5).map(s => s.name);
        const result = await sendBasicQuery(formatDietaryRecommendationQuery(frequentSymptomNames), 'report-user');
        setDietarySummary(result);
      } catch (error) {
        console.error("AI dietary recommendation error:", error);
        setDietarySummary("Could not generate dietary recommendations at this time.");
      } finally {
        setIsDietaryLoading(false);
      }
    }

    fetchAiSummaries();
  }, [symptomData, cycleData])
  
  const markdownStyles = {
    ul: (props: any) => <ul className="list-disc pl-6 space-y-2 text-sm" {...props} />,
    ol: (props: any) => <ol className="list-decimal pl-6 space-y-2 text-sm" {...props} />,
    li: (props: any) => <li className="text-foreground/90 leading-relaxed" {...props} />,
    p: (props: any) => <p className="text-foreground/80 leading-relaxed mb-3" {...props} />,
    h3: (props: any) => <h3 className="font-semibold text-lg text-foreground mb-2 mt-4" {...props} />,
    h4: (props: any) => <h4 className="font-medium text-base text-foreground mb-2 mt-3" {...props} />,
    strong: (props: any) => <strong className="font-semibold text-foreground" {...props} />,
    em: (props: any) => <em className="italic text-primary" {...props} />,
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-4xl font-bold font-headline bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Your Health Report
                </h1>
                <p className="text-muted-foreground text-lg">Comprehensive insights into your menstrual health journey</p>
            </div>
          <Button onClick={() => window.print()} className="no-print shadow-lg">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>

        {/* Health Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Symptoms</p>
                  <p className="text-2xl font-bold">{healthStats.totalSymptoms}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cycles Tracked</p>
                  <p className="text-2xl font-bold">{healthStats.totalCycles}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Logging Streak</p>
                  <p className="text-2xl font-bold">{healthStats.loggingStreak} days</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Daily Symptoms</p>
                  <p className="text-2xl font-bold">{healthStats.avgSymptomsPerDay}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Health Score</p>
                  <div className="flex items-center space-x-1">
                    <p className="text-2xl font-bold">{healthStats.healthScore}</p>
                    <Badge variant={healthStats.healthScore >= 70 ? "default" : "secondary"} className="text-xs">
                      {healthStats.healthScore >= 70 ? "Good" : "Improving"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-pink-500">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                {healthStats.loggingStreak > 7 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-sm font-bold">
                    {healthStats.loggingStreak > 7 ? "Consistent" : "Building Habit"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Symptom Frequency Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center gap-2">
                  <Activity className="h-6 w-6 text-primary" />
                  Symptom Frequency Analysis
                </CardTitle>
                <CardDescription>Your most logged symptoms - identifying patterns in your health journey</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
                {symptomData.length > 0 ? (
                    <div className="w-full">
                        <ResponsiveContainer width="100%" height={Math.max(400, symptomData.slice(0, 8).length * 60)}>
                            <BarChart 
                                data={symptomData.slice(0, 8)} 
                                layout="vertical" 
                                margin={{ top: 20, right: 40, left: 140, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="2 2" stroke="hsl(var(--muted))" opacity={0.3} />
                                <XAxis 
                                    type="number" 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={130}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: 'hsl(var(--foreground))', textAnchor: 'end' }}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'hsl(var(--popover))', 
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                    labelStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: '500' }}
                                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                                />
                                <Bar 
                                    dataKey="count" 
                                    fill="hsl(var(--primary))" 
                                    name="Times Logged" 
                                    radius={[0, 8, 8, 0]}
                                    opacity={0.9}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                        {symptomData.length > 8 && (
                            <div className="text-center mt-3">
                                <p className="text-xs text-muted-foreground">
                                    Showing top 8 most frequent symptoms. Total logged: {symptomData.length}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No symptom data logged yet</p>
                        <p className="text-sm text-muted-foreground mt-2">Start tracking your symptoms to see patterns here</p>
                    </div>
                )}
            </CardContent>
          </Card>

          {/* Symptom Trends Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                Symptom Trends
              </CardTitle>
              <CardDescription>Daily symptom logging patterns over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {symptomTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={symptomTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="2 2" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No trend data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Period Flow Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center gap-2">
                <Heart className="h-6 w-6 text-red-500" />
                Period Flow Distribution
              </CardTitle>
              <CardDescription>Breakdown of your menstrual flow patterns</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              {periodFlowData.length > 0 ? (
                <div className="w-full">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={periodFlowData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {periodFlowData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center space-x-4 mt-4">
                    {periodFlowData.map((entry, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm">{entry.name}: {entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No period flow data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Insights Section */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2 text-xl">
                    <BrainCircuit className="text-primary h-6 w-6" /> AI-Powered Health Insights
                </CardTitle>
                <CardDescription>Personalized analysis of your health patterns and trends based on your data</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[8rem]">
                {isSummaryLoading ? (
                   <div className="flex items-center justify-center space-x-3 py-8">
                       <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                       <p className="text-muted-foreground">Analyzing your health data with AI...</p>
                   </div>
                ) : aiSummary ? (
                    <div className="prose prose-sm max-w-none">
                        <ReactMarkdown components={markdownStyles}>{aiSummary}</ReactMarkdown>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <BrainCircuit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Not enough data to generate insights</p>
                        <p className="text-sm text-muted-foreground mt-2">Log your symptoms and cycles regularly to unlock AI insights</p>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Cycle Analysis Section */}
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-purple-600" />
                  Menstrual Cycle Analysis
                </CardTitle>
                <CardDescription>Track the consistency and patterns of your menstrual cycles</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
                 {cycleData.length > 0 ? (
                    <div className="w-full">
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart 
                                data={cycleData} 
                                margin={{ top: 30, right: 40, left: 40, bottom: 40 }}
                            >
                                <CartesianGrid 
                                    strokeDasharray="2 2" 
                                    stroke="hsl(var(--muted))" 
                                    opacity={0.3}
                                    horizontal={true}
                                    vertical={false}
                                />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                />
                                <YAxis 
                                    domain={['dataMin - 3', 'dataMax + 3']} 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                    label={{ 
                                        value: 'Cycle Length (Days)', 
                                        angle: -90, 
                                        position: 'insideLeft',
                                        style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' }
                                    }}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'hsl(var(--popover))', 
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                    labelStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: '500' }}
                                    formatter={(value, name) => [`${value} days`, 'Cycle Length']}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="days" 
                                    stroke="hsl(var(--primary))" 
                                    strokeWidth={3}
                                    dot={{ 
                                        fill: 'hsl(var(--primary))', 
                                        strokeWidth: 2, 
                                        r: 6,
                                        stroke: 'hsl(var(--background))'
                                    }}
                                    activeDot={{ 
                                        r: 8, 
                                        stroke: 'hsl(var(--primary))', 
                                        strokeWidth: 3,
                                        fill: 'hsl(var(--background))'
                                    }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                        {cycleData.length > 1 && (
                            <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-xl border">
                                <h4 className="font-semibold text-center mb-4 text-lg">Cycle Statistics</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                                        <p className="font-medium text-muted-foreground mb-2">Average Length</p>
                                        <p className="text-3xl font-bold text-primary">
                                            {Math.round(cycleData.reduce((sum, item) => sum + item.days, 0) / cycleData.length)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">days</p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                                        <p className="font-medium text-muted-foreground mb-2">Shortest Cycle</p>
                                        <p className="text-3xl font-bold text-blue-600">{Math.min(...cycleData.map(d => d.days))}</p>
                                        <p className="text-sm text-muted-foreground">days</p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                                        <p className="font-medium text-muted-foreground mb-2">Longest Cycle</p>
                                        <p className="text-3xl font-bold text-orange-600">{Math.max(...cycleData.map(d => d.days))}</p>
                                        <p className="text-sm text-muted-foreground">days</p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                                        <p className="font-medium text-muted-foreground mb-2">Variation</p>
                                        <p className="text-3xl font-bold text-purple-600">
                                            ±{Math.round((Math.max(...cycleData.map(d => d.days)) - Math.min(...cycleData.map(d => d.days))) / 2)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">days</p>
                                    </div>
                                </div>
                                <div className="mt-4 text-center">
                                  <Badge variant={
                                    Math.abs(Math.round(cycleData.reduce((sum, item) => sum + item.days, 0) / cycleData.length) - 28) <= 3 
                                      ? "default" : "secondary"
                                  }>
                                    {Math.abs(Math.round(cycleData.reduce((sum, item) => sum + item.days, 0) / cycleData.length) - 28) <= 3 
                                      ? "Regular Cycles" : "Irregular Cycles"}
                                  </Badge>
                                </div>
                            </div>
                        )}
                    </div>
                 ) : (
                    <div className="text-center py-12">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Not enough cycle data to show analysis</p>
                        <p className="text-sm text-muted-foreground mt-2">Track your periods for at least 2 cycles to see patterns</p>
                    </div>
                 )}
            </CardContent>
        </Card>

        {/* AI Dietary Recommendations */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2 text-xl">
                    <Leaf className="text-green-600 h-6 w-6" /> Personalized Nutrition Guidance
                </CardTitle>
                <CardDescription>AI-generated dietary recommendations tailored to your symptom patterns</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[8rem]">
               {isDietaryLoading ? (
                    <div className="flex items-center justify-center space-x-3 py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                        <p className="text-muted-foreground">Generating personalized nutrition advice...</p>
                    </div>
                ) : dietarySummary ? (
                    <div className="prose prose-sm max-w-none">
                        <ReactMarkdown components={markdownStyles}>{dietarySummary}</ReactMarkdown>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Leaf className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Not enough symptom data for dietary recommendations</p>
                        <p className="text-sm text-muted-foreground mt-2">Log your symptoms regularly to get personalized nutrition guidance</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
