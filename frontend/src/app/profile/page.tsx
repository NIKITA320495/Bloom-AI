
"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { UserProfile } from "@/lib/types"
import { healthConditions, medications } from "@/lib/data"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Please enter a valid date."}),
  irregularPeriods: z.enum(["regular", "occasionally-irregular", "irregular"]),
  healthConditions: z.array(z.string()),
  medications: z.array(z.string()),
});

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userProfile, setUserProfile] = useState<Partial<UserProfile> | null>(null)
  
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      dob: "",
      irregularPeriods: "regular",
      healthConditions: [],
      medications: [],
    },
  })

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem("bloom_user_profile")
      if (storedProfile) {
        const profileData = JSON.parse(storedProfile)
        setUserProfile(profileData)
        form.reset({
          name: profileData.name || profileData.fullName || "", // 'fullName' from register page
          dob: profileData.dob || "",
          irregularPeriods: profileData.irregularPeriods || profileData.periodRegularity || "regular",
          healthConditions: profileData.healthConditions || [],
          medications: profileData.medications || [],
        })
      }
    } catch (error) {
      console.error("Failed to load user profile", error)
    }
  }, [form])

  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    try {
        const fullProfile = {
            ...userProfile,
            ...data,
            name: data.name, // ensure name is updated
            periodRegularity: data.irregularPeriods,
        };
      localStorage.setItem("bloom_user_profile", JSON.stringify(fullProfile))
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      })
      router.push("/home")
    } catch (error) {
      console.error("Failed to save profile", error)
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  const { control } = form;

  if (!userProfile) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-full">
          <p>Loading profile...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">Edit Profile</h1>
          <p className="text-muted-foreground">Update your personal and health information.</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="dob"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                            <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                <FormField
                  name="irregularPeriods"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period Regularity</FormLabel>
                      <FormControl>
                        <div className="flex gap-4">
                          <Button type="button" variant={field.value === "regular" ? "default" : "outline"} onClick={() => field.onChange("regular")}>Regular</Button>
                          <Button type="button" variant={field.value === "occasionally-irregular" ? "default" : "outline"} onClick={() => field.onChange("occasionally-irregular")}>Occasionally Irregular</Button>
                          <Button type="button" variant={field.value === "irregular" ? "default" : "outline"} onClick={() => field.onChange("irregular")}>Irregular</Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="healthConditions"
                  render={() => (
                    <FormItem>
                        <FormLabel>Pre-existing Health Conditions</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {healthConditions.map((item) => (
                          <FormField
                            key={item.id}
                            control={control}
                            name="healthConditions"
                            render={({ field }) => {
                              return (
                                <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Card
                                      onClick={() => {
                                        const currentValue = field.value || [];
                                        if (item.id === 'none') {
                                            field.onChange(['none']);
                                        } else {
                                            let newValue = [...currentValue.filter(id => id !== 'none')];
                                            if (newValue.includes(item.id)) {
                                                newValue = newValue.filter((id) => id !== item.id);
                                            } else {
                                                newValue.push(item.id);
                                            }
                                            field.onChange(newValue.length > 0 ? newValue : []);
                                        }
                                      }}
                                      className={cn(
                                        "p-4 cursor-pointer transition-colors w-full h-full",
                                        field.value?.includes(item.id) ? "bg-primary text-primary-foreground border-primary" : "bg-card"
                                      )}
                                    >
                                        <div className="flex justify-between items-center">
                                            <item.icon className="h-6 w-6" />
                                            {field.value?.includes(item.id) && <Check className="h-5 w-5" />}
                                        </div>
                                        <p className="font-semibold mt-2">{item.name}</p>
                                    </Card>
                                  </FormControl>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="medications"
                  render={() => (
                    <FormItem>
                        <FormLabel>Current Medications</FormLabel>
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {medications.map((item) => (
                          <FormField
                            key={item.id}
                            control={control}
                            name="medications"
                            render={({ field }) => {
                              return (
                                <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Card
                                      onClick={() => {
                                        const currentValue = field.value || [];
                                        const isChecked = currentValue.includes(item.id);
                                        if (isChecked) {
                                          field.onChange(currentValue.filter((id) => id !== item.id));
                                        } else {
                                          field.onChange([...currentValue, item.id]);
                                        }
                                      }}
                                      className={cn(
                                        "p-4 cursor-pointer transition-colors w-full h-full",
                                        field.value?.includes(item.id) ? "bg-primary text-primary-foreground border-primary" : "bg-card"
                                      )}
                                    >
                                        <div className="flex justify-between items-center">
                                            <item.icon className="h-6 w-6" />
                                            {field.value?.includes(item.id) && <Check className="h-5 w-5" />}
                                        </div>
                                        <p className="font-semibold mt-2">{item.name}</p>
                                    </Card>
                                  </FormControl>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

    