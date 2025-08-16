"use client"

import React, { useState, useEffect, useCallback } from "react"
import { AppLayout } from "@/components/app-layout"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { symptoms as availableSymptoms, moods as availableMoods, periodFlows as availableFlows } from "@/lib/data"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { PeriodLog, SymptomLog } from "@/lib/types"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CalendarCheck2, PlusCircle, Sparkles } from "lucide-react"
import { sendBasicQuery, formatSelfCareTipsQuery } from "@/lib/api"
import ReactMarkdown from "react-markdown"

const today = new Date()
const allSymptomsAndMoods = [...availableSymptoms, ...availableMoods];

export default function CalendarPage() {
  const [periodLogs, setPeriodLogs] = useState<PeriodLog>({})
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog>({})
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selfCareTips, setSelfCareTips] = useState("")
  const [isTipsLoading, setIsTipsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    try {
      const storedPeriodLogs = JSON.parse(localStorage.getItem("bloom_period_logs") || "{}")
      setPeriodLogs(storedPeriodLogs)
      const storedSymptomLogs = JSON.parse(localStorage.getItem("bloom_symptom_logs") || "{}")
      setSymptomLogs(storedSymptomLogs)
    } catch (error) {
      console.error("Failed to parse logs from localStorage", error)
    }
  }, [])
  
  const toISODateString = (date: Date) => date.toISOString().split("T")[0]

  const periodDays = Object.keys(periodLogs)
    .filter(dateStr => periodLogs[dateStr] && periodLogs[dateStr] !== 'none')
    .map(dateStr => new Date(dateStr))
  
  const symptomDays = Object.keys(symptomLogs)
      .filter(dateStr => symptomLogs[dateStr] && symptomLogs[dateStr].length > 0)
      .map(dateStr => new Date(dateStr))

  const handleDayClick = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setIsDialogOpen(true)
    }
  }

  const handlePeriodLog = (flow: "none" | "light" | "medium" | "heavy" | "very_heavy") => {
    if (!selectedDate) return

    const dateStr = toISODateString(selectedDate)
    const newLogs = { ...periodLogs }

    if (flow === 'none') {
      delete newLogs[dateStr]
    } else {
      newLogs[dateStr] = flow
    }
    
    setPeriodLogs(newLogs)
    localStorage.setItem("bloom_period_logs", JSON.stringify(newLogs))
    toast({ title: "Period flow updated" })
  }
  
  const selectedDaySymptomIds = selectedDate ? symptomLogs[toISODateString(selectedDate)] || [] : []

  const handleSymptomLog = (symptomId: string) => {
    if (!selectedDate) return

    const dateStr = toISODateString(selectedDate)
    const newLogs = { ...symptomLogs }
    const dayLogs = newLogs[dateStr] || []

    if (dayLogs.includes(symptomId)) {
        newLogs[dateStr] = dayLogs.filter(id => id !== symptomId)
    } else {
        newLogs[dateStr] = [...dayLogs, symptomId]
    }

    setSymptomLogs(newLogs)
    localStorage.setItem("bloom_symptom_logs", JSON.stringify(newLogs))
    toast({ title: "Symptoms updated" })
  }
  
  const selectedDayPeriodId = selectedDate ? periodLogs[toISODateString(selectedDate)] : 'none'
  const selectedDayPeriod = availableFlows.find(f => f.id === selectedDayPeriodId)
  
  const selectedDaySymptoms = selectedDaySymptomIds
    .map(id => allSymptomsAndMoods.find(s => s.id === id))
    .filter(Boolean);

   useEffect(() => {
    const fetchTips = async () => {
      if (!selectedDate) return;
      
      const symptomNames = selectedDaySymptoms.map(s => s?.name).filter(Boolean) as string[];
      
      setIsTipsLoading(true);
      setSelfCareTips("");
      try {
        const result = await sendBasicQuery(formatSelfCareTipsQuery(symptomNames), 'calendar-user');
        setSelfCareTips(result);
      } catch (error) {
        console.error("Failed to generate self-care tips:", error);
        setSelfCareTips("Could not load tips at this time. Please try again later.");
      } finally {
        setIsTipsLoading(false);
      }
    };

    fetchTips();
  }, [selectedDate, symptomLogs]);


  const logEntryDialog = (
    <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-3 text-lg">Period Flow</h3>
          <RadioGroup 
              value={selectedDayPeriodId || "none"} 
              onValueChange={(value) => handlePeriodLog(value as any)}
              className="flex gap-2 flex-wrap"
          >
              {availableFlows.map(flow => (
                  <Label key={flow.id} htmlFor={`flow-${flow.id}`} className={cn(
                      "flex items-center justify-center rounded-md border-2 p-3 w-24 h-12 cursor-pointer transition-colors",
                      (selectedDayPeriodId || 'none') === flow.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-accent"
                  )}>
                      <RadioGroupItem value={flow.id} id={`flow-${flow.id}`} className="sr-only" />
                      <span>{flow.name}</span>
                  </Label>
              ))}
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <div>
              <h3 className="font-semibold mb-3 text-lg">Symptoms</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableSymptoms.map(s => (
                       <Button
                          key={s.id}
                          variant={selectedDaySymptomIds.includes(s.id) ? "default" : "outline"}
                          className="h-24 flex-col gap-2 text-base"
                          onClick={() => handleSymptomLog(s.id)}
                          size="unset"
                      >
                          <s.icon className="h-7 w-7" />
                          <span>{s.name}</span>
                      </Button>
                  ))}
              </div>
          </div>
          <div>
              <h3 className="font-semibold mb-3 text-lg">Moods</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableMoods.map(s => (
                       <Button
                          key={s.id}
                          variant={selectedDaySymptomIds.includes(s.id) ? "default" : "outline"}
                          className="h-24 flex-col gap-2 text-base"
                          onClick={() => handleSymptomLog(s.id)}
                          size="unset"
                      >
                          <s.icon className="h-7 w-7" />
                          <span>{s.name}</span>
                      </Button>
                  ))}
              </div>
          </div>
        </div>
    </div>
  )
  
  const markdownStyles = {
    ul: (props: any) => <ul className="list-disc pl-5 space-y-1" {...props} />,
    p: (props: any) => <p className="text-foreground/80" {...props} />,
  };

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row gap-8">
        <Card className="flex-grow">
          <CardHeader>
            <CardTitle className="font-headline">Your Cycle & Symptom Calendar</CardTitle>
             <CardDescription>Select a day to log your period, symptoms, and moods.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDayClick}
                modifiers={{ 
                  period: periodDays,
                  symptom: symptomDays
                }}
                modifiersClassNames={{
                  period: 'bg-primary/20 rounded-full',
                  symptom: 'border-2 border-primary/50 rounded-full'
                }}
                className="p-0"
                disabled={(date) => date > new Date() || date < new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
              />
          </CardContent>
        </Card>

        <div className="lg:w-2/5 space-y-4">
            <Card className="min-h-[250px] flex flex-col">
                <CardHeader>
                  <CardTitle className="font-headline text-lg">Log for {selectedDate ? selectedDate.toLocaleDateString('en-US', {month: 'long', day: 'numeric'}) : 'Today'}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex items-center justify-center">
                  {selectedDayPeriodId !== 'none' || selectedDaySymptoms.length > 0 ? (
                    <div className="space-y-4 w-full">
                      {selectedDayPeriodId !== 'none' && selectedDayPeriod && (
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-base w-32">Period Flow:</span> 
                          <Badge variant="secondary" className="text-base px-3 py-1">{selectedDayPeriod.name}</Badge>
                        </div>
                      )}
                      {selectedDaySymptoms.length > 0 && (
                        <div className="flex flex-col gap-3">
                           <span className="font-semibold text-base">Symptoms & Moods:</span>
                           <div className="flex flex-wrap gap-2">
                            {selectedDaySymptoms.map(s => (
                              s && <Badge key={s.id} variant="outline" className="flex items-center gap-2 text-sm px-3 py-1"><s.icon className="h-4 w-4" />{s.name}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground p-4">
                        <CalendarCheck2 className="h-16 w-16 mx-auto mb-4 text-primary/20"/>
                        <p>No entries for this day.</p>
                        <p className="text-sm">Click the button below to add a log.</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={() => setIsDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        {selectedDayPeriodId !== 'none' || selectedDaySymptoms.length > 0 ? 'Edit Log' : 'Add Log'}
                    </Button>
                </CardFooter>
            </Card>

            <Card className="bg-accent/50 border-primary/20">
                <CardHeader>
                    <CardTitle className="font-headline text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" /> Self-Care Corner
                    </CardTitle>
                </CardHeader>
                <CardContent className="min-h-[8rem]">
                  {isTipsLoading ? (
                    <p className="text-muted-foreground animate-pulse">Generating your personalized tips...</p>
                  ) : (
                    <ReactMarkdown components={markdownStyles}>{selfCareTips}</ReactMarkdown>
                  )}
                </CardContent>
            </Card>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Log for {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</DialogTitle>
              <DialogDescription>
                Track your period flow, symptoms, and moods for this day.
              </DialogDescription>
            </DialogHeader>
              <ScrollArea className="h-[65vh] pr-6 -mr-2">
                  {logEntryDialog}
              </ScrollArea>
            <DialogFooter>
                <Button onClick={() => setIsDialogOpen(false)}>Done</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
