
"use client"

import React, { useState, useRef, useEffect } from "react"
import { AppLayout } from "@/components/app-layout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SendHorizonal, Bot, User, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { sendChatMessage, checkBackendHealth, testConnection } from "@/lib/api"
import type { UserProfile } from "@/lib/types"

type Message = {
  id: number
  sender: "user" | "ai"
  text: string
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([
      { id: 1, sender: 'ai', text:` 🌸 Hello! I am Bloom, your Personal Healthcare Assistant! 🌸 \nHow can I help you today?`}
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<Partial<UserProfile> | null>(null)
  const [symptoms, setSymptoms] = useState<string>('not logged')
  const [periodFlow, setPeriodFlow] = useState<string>('not logged');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const testBackendConnection = async () => {
    setBackendStatus('checking');
    try {
      await testConnection();
      setBackendStatus('connected');
      const successMessage: Message = { 
        id: Date.now(), 
        sender: 'ai', 
        text: "✅ Backend connection test successful! I'm ready to help you." 
      };
      setMessages(prev => [...prev, successMessage]);
    } catch (error) {
      setBackendStatus('disconnected');
      const errorMessage: Message = { 
        id: Date.now(), 
        sender: 'ai', 
        text: "❌ Backend connection test failed. Please ensure the backend server is running on http://localhost:5000" 
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }

  useEffect(() => {
    // Check backend connectivity
    const checkBackend = async () => {
      try {
        const isHealthy = await checkBackendHealth();
        setBackendStatus(isHealthy ? 'connected' : 'disconnected');
      } catch (error) {
        setBackendStatus('disconnected');
      }
    };
    
    checkBackend();

    try {
      const profile = JSON.parse(localStorage.getItem("bloom_user_profile") || "null")
      setUserProfile(profile)
      
      const symptomLogs = JSON.parse(localStorage.getItem("bloom_symptom_logs") || "{}")
      const recentSymptomLogs = Object.entries(symptomLogs)
        .slice(-7) // last 7 days
      
      const recentSymptoms = recentSymptomLogs.flatMap(([, syms]) => syms as string[])
      if (recentSymptoms.length > 0) {
        setSymptoms([...new Set(recentSymptoms)].join(", "))
      }

      const periodLogs = JSON.parse(localStorage.getItem("bloom_period_logs") || "{}");
      const recentPeriodLogs = Object.entries(periodLogs)
        .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
        .slice(0, 1);
      
      if (recentPeriodLogs.length > 0) {
        setPeriodFlow(recentPeriodLogs[0][1] as string);
      }

    } catch (error) {
      console.error("Failed to load user data", error)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (input.trim() === "" || isLoading) return
    
    const userMessage: Message = { id: Date.now(), sender: "user", text: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)

    try {
        // Create a context-aware query with user information
        const contextQuery = `User Profile:
        - Name: ${userProfile?.name || userProfile?.fullName || 'User'}
        - Recent symptoms: ${symptoms}
        - Recent period flow: ${periodFlow}
        
        User Question: ${input}
        
        Please provide a helpful, personalized response considering the user's health context.`
        
        const aiResponse = await sendChatMessage(contextQuery, userProfile?.id || 'anonymous')
        const aiMessage: Message = { id: Date.now() + 1, sender: "ai", text: aiResponse };
        setMessages((prev) => [...prev, aiMessage]);
        
        // Update backend status to connected since we got a response
        setBackendStatus('connected');
    } catch (error) {
        console.error("AI response error:", error);
        setBackendStatus('disconnected');
        
        let errorText = "Sorry, I'm having trouble connecting to my servers right now. Please try again in a moment.";
        
        if (error instanceof Error) {
          if (error.message.includes('Unable to connect')) {
            errorText = "I can't reach my backend services right now. Please ensure the backend server is running and try again.";
          } else if (error.message.includes('fetch')) {
            errorText = "There's a network connectivity issue. Please check your internet connection and try again.";
          }
        }
        
        const errorMessage: Message = { id: Date.now() + 1, sender: 'ai', text: errorText };
        setMessages((prev) => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] flex flex-col">
        <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold font-headline">Bloom AI</h1>
                <p className="text-sm text-muted-foreground">Your personal wellness assistant</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  backendStatus === 'connected' ? 'bg-green-500' : 
                  backendStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
                )} />
                <span className="text-xs text-muted-foreground">
                  {backendStatus === 'connected' ? 'Connected' : 
                   backendStatus === 'disconnected' ? 'Disconnected' : 'Checking...'}
                </span>
                {backendStatus === 'disconnected' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={testBackendConnection}
                    className="text-xs h-6 px-2"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Test
                  </Button>
                )}
              </div>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-3 w-full",
                  message.sender === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.sender === "ai" && (
                  <Avatar className="w-8 h-8 bg-primary text-primary-foreground">
                    <AvatarFallback><Bot className="w-5 h-5"/></AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                    "max-w-sm md:max-w-md lg:max-w-lg p-3 rounded-2xl",
                    message.sender === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'
                )}>
                    <p className="whitespace-pre-wrap text-sm">{message.text}</p>
                </div>
                 {message.sender === "user" && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback><User className="w-5 h-5"/></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {isLoading && (
                <div className="flex items-start gap-3 justify-start">
                    <Avatar className="w-8 h-8 bg-primary text-primary-foreground">
                        <AvatarFallback><Bot className="w-5 h-5"/></AvatarFallback>
                    </Avatar>
                    <div className="max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl bg-muted rounded-bl-none">
                        <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-0"></span>
                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-150"></span>
                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-300"></span>
                        </div>
                    </div>
                </div>
            )}
             <div ref={messagesEndRef} />
          </div>
        <div className="p-4 border-t bg-background">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about menopause..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || input.trim() === ""}>
              <SendHorizonal className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}
