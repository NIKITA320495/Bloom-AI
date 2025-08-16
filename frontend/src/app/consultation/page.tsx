
"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { doctors, symptoms, moods } from "@/lib/data"
import { Stethoscope, Bot, Star, CalendarDays } from "lucide-react"
import { sendConsultationQuery, formatConsultationQuery } from "@/lib/api"
import type { SymptomLog, UserProfile, Symptom } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

// Define a simple type for our consultation response
type ConsultationResponse = {
  consultation: string
  dietPlan: {
    title: string
    description: string
    items: string[]
  }
  exercisePlan: {
    title: string
    description: string
    items: string[]
  }
}

type SymptomInfo = {
  id: string
  name: string
  icon: React.ElementType
}

type LoggedSymptomInfo = {
    date: string;
    symptoms: SymptomInfo[];
}

export default function ConsultationPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentSymptom, setCurrentSymptom] = useState<SymptomInfo | null>(null)
  const [aiResponse, setAiResponse] = useState<ConsultationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [topSymptoms, setTopSymptoms] = useState<SymptomInfo[]>([])
  const [monthlyLog, setMonthlyLog] = useState<LoggedSymptomInfo[]>([])
  const [userName, setUserName] = useState("User")
  
  const renderIcon = (IconComponent: React.ElementType, className: string) => {
    const Component = IconComponent as React.ComponentType<{ className?: string }>
    return <Component className={className} />
  }
  
  const allSymptomsAndMoods = [...symptoms, ...moods];

  useEffect(() => {
    try {
      const userProfile: UserProfile | null = JSON.parse(localStorage.getItem("bloom_user_profile") || "null")
      if (userProfile?.name) {
        setUserName(userProfile.name)
      }

      const symptomLogs: SymptomLog = JSON.parse(localStorage.getItem("bloom_symptom_logs") || "{}")
      const today = new Date()
      const currentMonth = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0')

      const monthlySymptomEntries = Object.entries(symptomLogs)
        .filter(([date]) => date.startsWith(currentMonth))
        .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime());

      // For the timeline view
      const detailedLogs: LoggedSymptomInfo[] = monthlySymptomEntries.map(([date, symIds]) => ({
          date,
          symptoms: symIds.map(id => {
              const details = allSymptomsAndMoods.find(s => s.id === id);
              return { id, name: details?.name || "Unknown", icon: details?.icon || Bot };
          })
      }));
      setMonthlyLog(detailedLogs);

      // For the top 3 symptoms carousel
      const allMonthlySymptoms = monthlySymptomEntries.flatMap(([, syms]) => syms as string[])

      if (allMonthlySymptoms.length > 0) {
        const frequencyMap = allMonthlySymptoms.reduce((acc, symptomId) => {
          acc[symptomId] = (acc[symptomId] || 0) + 1
          return acc
        }, {} as { [key: string]: number })

        const topThreeIds = Object.entries(frequencyMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(entry => entry[0]);
        
        const topSymptomsDetails = topThreeIds.map(id => {
            const details = allSymptomsAndMoods.find(s => s.id === id);
            return { id, name: details?.name || "Unknown", icon: details?.icon || Bot };
        });

        setTopSymptoms(topSymptomsDetails);
      }

    } catch (error) {
      console.error("Failed to process symptom data:", error)
    }
  }, [])

  const handleGenerateConsultation = async (symptom: SymptomInfo) => {
    setCurrentSymptom(symptom)
    setIsDialogOpen(true)
    setIsLoading(true)
    setAiResponse(null)
    try {
      // Enhanced query with more context
      const userProfile: UserProfile | null = JSON.parse(localStorage.getItem("bloom_user_profile") || "null")
      const age = userProfile?.dob ? new Date().getFullYear() - new Date(userProfile.dob).getFullYear() : 'unknown'
      const healthConditions = userProfile?.healthConditions?.join(', ') || 'none'
      const medications = userProfile?.medications?.join(', ') || 'none'
      
      const enhancedQuery = `Generate a comprehensive consultation for ${userName} (age: ${age}) focusing on their primary symptom: ${symptom.name}.
      
      User context:
      - Health conditions: ${healthConditions}
      - Current medications: ${medications}
      - Recent symptoms: ${symptoms}
      
      Please provide:
      1. A personalized consultation paragraph addressing their specific concern
      2. Detailed dietary recommendations with specific foods and meal suggestions
      3. Appropriate exercise recommendations considering their condition
      
      Format the response as structured advice that is practical and actionable.`
      
      const responseText = await sendConsultationQuery(enhancedQuery);
      
      // Try to parse a structured response or create a comprehensive one
      try {
        const parsedResponse = JSON.parse(responseText);
        setAiResponse(parsedResponse);
      } catch {
        // Create a more detailed structured response from the text
        const lines = responseText.split('\n').filter(line => line.trim());
        const consultation = lines.slice(0, Math.ceil(lines.length * 0.4)).join(' ');
        
        setAiResponse({
          consultation: consultation || responseText,
          dietPlan: {
            title: `Dietary Recommendations for ${symptom.name}`,
            description: "Personalized nutrition advice to support your wellness journey",
            items: [
              "Include anti-inflammatory foods like leafy greens and berries",
              "Stay well-hydrated with 8-10 glasses of water daily", 
              "Consider omega-3 rich foods like salmon and walnuts",
              "Limit processed foods and refined sugars",
              "Incorporate calcium-rich foods for bone health"
            ]
          },
          exercisePlan: {
            title: `Exercise Plan for ${symptom.name}`,
            description: "Gentle, effective activities to support your health goals",
            items: [
              "Start with 10-15 minutes of daily walking",
              "Try gentle yoga or stretching routines",
              "Include strength training 2-3 times per week",
              "Practice deep breathing exercises for stress relief",
              "Consider low-impact activities like swimming or cycling"
            ]
          }
        });
      }
    } catch (error) {
      console.error("AI Consultation Error:", error)
      setAiResponse({
        consultation: "I apologize, but I'm having trouble connecting to provide your consultation right now. Please try again in a moment, or consider speaking with one of our healthcare professionals.",
        dietPlan: {
          title: "General Wellness Tips",
          description: "Basic recommendations while we resolve the connection",
          items: ["Stay hydrated", "Eat balanced meals", "Get adequate rest"]
        },
        exercisePlan: {
          title: "Gentle Movement",
          description: "Simple activities you can do while we reconnect",
          items: ["Take short walks", "Try gentle stretching", "Practice deep breathing"]
        }
      });
    } finally {
      setIsLoading(false)
    }
  }

  const renderPlan = (plan: {title: string, description: string, items: string[]}) => (
     <div className="p-1 h-full">
        <Card className="h-full flex flex-col bg-accent/50">
            <CardHeader>
                <CardTitle className="font-headline text-xl">{plan.title}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <ul className="list-disc pl-5 space-y-2">
                    {plan.items.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            </CardContent>
        </Card>
     </div>
  )

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Consultation Hub</h1>
          <p className="text-muted-foreground">AI-powered insights and professional support.</p>
        </div>
        
        <Card className="bg-card">
            <CardHeader>
                <CardTitle className="font-headline">Your AI Health Focus</CardTitle>
                <CardDescription>Get personalized advice for your top health concerns this month.</CardDescription>
            </CardHeader>
            <CardContent>
                {topSymptoms.length > 0 ? (
                    <Carousel opts={{ align: "start" }} className="w-full">
                        <CarouselContent>
                            {topSymptoms.map((symptom) => (
                                <CarouselItem key={symptom.id} className="md:basis-1/2 lg:basis-1/3">
                                    <div className="p-1 h-full">
                                        <Card className="flex flex-col justify-between h-full bg-accent/50 border-primary/20">
                                            <CardHeader>
                                                {renderIcon(symptom.icon, "w-10 h-10 text-primary mb-2")}
                                                <CardTitle className="font-headline">{symptom.name}</CardTitle>
                                                <CardDescription>Your most logged item.</CardDescription>
                                            </CardHeader>
                                            <CardFooter>
                                                <Button onClick={() => handleGenerateConsultation(symptom)}>
                                                    <Bot className="mr-2 h-4 w-4" /> Get AI Consultation
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="ml-12" />
                        <CarouselNext className="mr-12" />
                    </Carousel>
                ) : (
                     <p className="text-muted-foreground text-center py-8">Log your symptoms and moods daily to unlock personalized insights!</p>
                )}
            </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Your AI-Generated Consultation for {currentSymptom?.name}</DialogTitle>
                    <DialogDescription>Personalized advice based on your focus area of "{currentSymptom?.name}".</DialogDescription>
                </DialogHeader>
                {isLoading && <div className="flex justify-center items-center h-60"><p>Generating your plan...</p></div>}
                {aiResponse && (
                    <div className="space-y-6 pt-4">
                        <p className="font-headline text-lg italic bg-accent/50 p-4 rounded-lg">"{aiResponse.consultation}"</p>
                        <Carousel>
                            <CarouselContent className="-ml-2">
                                <CarouselItem className="pl-2">{renderPlan(aiResponse.dietPlan)}</CarouselItem>
                                <CarouselItem className="pl-2">{renderPlan(aiResponse.exercisePlan)}</CarouselItem>
                            </CarouselContent>
                            <CarouselPrevious className="-left-4" />
                            <CarouselNext className="-right-4" />
                        </Carousel>
                            <p className="text-xs text-muted-foreground text-center pt-2">

                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
        
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <CalendarDays className="text-primary"/> Monthly Log
                </CardTitle>
                <CardDescription>A timeline of your logged symptoms and moods this month.</CardDescription>
            </CardHeader>
            <CardContent>
                {monthlyLog.length > 0 ? (
                    <div className="space-y-4">
                        {monthlyLog.map(log => (
                            <div key={log.date} className="flex items-start gap-4">
                                <div className="text-center w-20">
                                    <p className="font-bold text-primary">{new Date(log.date).toLocaleDateString('en-US', { day: 'numeric' })}</p>
                                    <p className="text-sm text-muted-foreground">{new Date(log.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                                </div>
                                <div className="flex-1 border-l-2 border-primary/20 pl-4 py-2">
                                     <div className="flex flex-wrap gap-2">
                                        {log.symptoms.map(s => (
                                            <Badge key={s.id} variant="secondary" className="flex items-center gap-1.5">
                                                {renderIcon(s.icon, "h-3 w-3")}
                                                {s.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">No symptoms or moods logged this month yet.</p>
                )}
            </CardContent>
        </Card>

        <div>
            <h2 className="text-2xl font-bold font-headline mb-4">Connect with an Expert</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor, index) => (
                <Card key={index} className="flex flex-col">
                <CardHeader>
                    <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={doctor.image} alt={doctor.name} data-ai-hint="professional portrait" className="bg-transparent" />
                        <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="font-headline">{doctor.name}</CardTitle>
                        <p className="text-primary">{doctor.specialization}</p>
                    </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-2">
                    <p className="text-muted-foreground">{doctor.experience} years of experience</p>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < doctor.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`} />
                        ))}
                         <span className="text-sm text-muted-foreground ml-1">({doctor.rating.toFixed(1)})</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full font-headline">
                    <Stethoscope className="mr-2 h-4 w-4" />
                    Book a Consultation
                    </Button>
                </CardFooter>
                </Card>
            ))}
            </div>
        </div>

      </div>
    </AppLayout>
  )
}
