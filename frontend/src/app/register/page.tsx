
"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { AnimatePresence, motion } from "framer-motion"


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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Check, Edit2, Scale, Ruler } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UserProfile, SelectableItem } from "@/lib/types"
import { healthConditions, medications, periodRegularity, lifestyle } from "@/lib/data"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"


const formSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email(),
  photoURL: z.string().url().optional().nullable(),
  dob: z.string().refine((val) => {
    if (!val) return false;
    const today = new Date();
    const birthDate = new Date(val);
    if (isNaN(birthDate.getTime())) return false;
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 13;
  }, { message: "You must be at least 13 years old and enter a valid date." }),
  height: z.coerce.number().positive({ message: "Please enter a valid height." }).optional(),
  heightUnit: z.enum(['cm', 'in']).default('cm'),
  weight: z.coerce.number().positive({ message: "Please enter a valid weight." }).optional(),
  weightUnit: z.enum(['kg', 'lb']).default('kg'),
  periodRegularity: z.string({ required_error: "Please select an option."}),
  medications: z.array(z.string()),
  otherMedication: z.string().optional(),
  healthConditions: z.array(z.string()),
  otherCondition: z.string().optional(),
  lifestyle: z.array(z.string()),
  smokingFrequency: z.string().optional(),
  alcoholFrequency: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number}) => {
    return (
        <div className="flex justify-center my-8">
            {Array.from({ length: totalSteps }).map((_, index) => (
                <div key={index} className={cn(
                    "h-2 w-8 mx-1 rounded-full",
                    currentStep > index ? "bg-primary" : "bg-secondary"
                )} />
            ))}
        </div>
    )
}

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        fullName: "",
        email: "",
        photoURL: "",
        dob: "",
        height: '' as any,
        weight: '' as any,
        medications: [],
        otherMedication: "",
        healthConditions: [],
        otherCondition: "",
        lifestyle: [],
        smokingFrequency: "",
        alcoholFrequency: "",
        heightUnit: 'cm',
        weightUnit: 'kg',
    },
    shouldUnregister: false,
  })

  useEffect(() => {
    const checkOnboarding = async () => {
      let localProfile: Partial<UserProfile> | null = null;
      try {
        localProfile = JSON.parse(localStorage.getItem("bloom_user_profile") || "null");
      } catch (e) {
        // issue parsing, treat as no profile
      }

      if (localProfile) { // User logged in with local storage
          if (localProfile.onboardingComplete) {
              router.replace('/home');
          } else {
              form.reset({
                fullName: localProfile.name || localProfile.fullName || "",
                email: localProfile.email || "",
                photoURL: localProfile.photoURL || "",
                dob: localProfile.dob || "",
                height: localProfile.height || ('' as any),
                heightUnit: localProfile.heightUnit || 'cm',
                weight: localProfile.weight || ('' as any),
                weightUnit: localProfile.weightUnit || 'kg',
                periodRegularity: localProfile.periodRegularity || undefined,
                medications: localProfile.medications || [],
                healthConditions: localProfile.healthConditions || [],
                lifestyle: localProfile.lifestyle || [],
            });
            if (!form.getValues('fullName')) setStep(2);
            else if (!form.getValues('dob')) setStep(3);
            else if (!form.getValues('height') || !form.getValues('weight')) setStep(4);
            else setStep(5);
          }
      } else {
        router.replace('/');
      }
    };
    checkOnboarding();
  }, [router, form]);


  const onSubmit = async (data: FormData) => {
    try {
        const profileData = {
            ...data,
            name: data.fullName, // Ensure compatibility with existing code
            onboardingComplete: true,
        }
        localStorage.setItem('bloom_user_profile', JSON.stringify(profileData));
        console.log("Profile saved successfully, redirecting to home...");
        
        toast({
            title: "Registration Complete! 🎉",
            description: "Welcome to Bloom! You're all set up.",
        });
        
        // Small delay to let the toast show before navigation
        setTimeout(() => {
            router.push('/home');
        }, 1000);
        
    } catch (error) {
        console.error("Failed to save profile", error);
        
        toast({
            title: "Registration Complete",
            description: "Welcome to Bloom! Taking you to the home page.",
            variant: "default"
        });
        
        // Still redirect to home even if there's an error saving profile
        setTimeout(() => {
            router.push('/home');
        }, 1000);
    }
  }

  const handleNext = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    switch (step) {
        case 2: fieldsToValidate = ['fullName']; break;
        case 3: fieldsToValidate = ['dob']; break;
        case 4: fieldsToValidate = ['height', 'weight']; break;
        case 5: fieldsToValidate = ['periodRegularity']; break;
        case 6: fieldsToValidate = ['medications', 'otherMedication']; break;
        case 7: fieldsToValidate = ['healthConditions', 'otherCondition']; break;
        case 8: fieldsToValidate = ['lifestyle', 'smokingFrequency', 'alcoholFrequency']; break;
    }
    
    const isValid = await form.trigger(fieldsToValidate);
    if(isValid) {
      if (step === 9) {
          console.log("Final step - submitting form...");
          
          toast({
              title: "Finishing registration...",
              description: "Almost there! Setting up your profile.",
          });
          
          const formData = form.getValues();
          await onSubmit(formData);
      } else {
          setStep(s => s + 1);
      }
    }
  }

  const handleBack = () => setStep(s => s > 1 ? s - 1 : 1);
  
  const renderMultiSelect = (
      items: SelectableItem[],
      fieldName: "medications" | "healthConditions",
      otherFieldName: "otherMedication" | "otherCondition"
  ) => (
       <FormField
          control={form.control}
          name={fieldName}
          render={({ field }) => {
            const hasOther = field.value?.includes('other');
            return (
                <FormItem>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {items.map((item) => (
                    <Card
                        key={item.id}
                        onClick={() => {
                            const currentValue = field.value || [];
                            const isChecked = currentValue.includes(item.id);
                            if (isChecked) {
                                field.onChange(currentValue.filter((id) => id !== item.id));
                            } else {
                                if (item.id === 'none') {
                                    field.onChange(['none']);
                                } else {
                                    field.onChange([...currentValue.filter(id => id !== 'none'), item.id]);
                                }
                            }
                        }}
                        className={cn(
                            "p-4 cursor-pointer transition-colors w-full h-full flex flex-col justify-center items-center text-center",
                            field.value?.includes(item.id) ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent"
                        )}
                        >
                            <div className="flex justify-between items-center w-full">
                                <item.icon className="h-6 w-6" />
                                {field.value?.includes(item.id) && <Check className="h-5 w-5" />}
                            </div>
                            <p className="font-semibold mt-2">{item.name}</p>
                        </Card>
                    ))}
                </div>
                 {hasOther && (
                    <FormField
                        control={form.control}
                        name={otherFieldName}
                        render={({ field: otherField }) => (
                            <FormItem className="mt-4">
                                <FormLabel>Please specify "Other"</FormLabel>
                                <FormControl>
                                    <Input {...otherField} placeholder="Type here..." />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                 )}
                <FormMessage />
                </FormItem>
            )
          }}
        />
  )

  const getSummaryList = (field: "medications" | "healthConditions", source: SelectableItem[]) => {
    const values = form.getValues(field);
    if (!values || values.length === 0) return "None specified";
    if (values.includes("none")) return "None";

    const otherField = field === "medications" ? "otherMedication" : "otherCondition";
    const otherValue = form.getValues(otherField);
    
    const names = values.map(v => {
        if (v === 'other' && otherValue) return `Other: ${otherValue}`;
        if (v === 'other') return 'Other';
        return source.find(i => i.id === v)?.name;
    }).filter(Boolean);
    return names.join(', ');
  }

  const getLifestyleSummary = () => {
    const lifestyleValues = form.getValues('lifestyle') || [];
    if (lifestyleValues.includes('none')) return 'None';
    if (lifestyleValues.length === 0) return 'Not specified';
    
    const summary: string[] = [];
    if(lifestyleValues.includes('smoker')) {
        const freq = form.getValues('smokingFrequency');
        summary.push(`Smoker (${freq || 'not specified'})`);
    }
    if(lifestyleValues.includes('alcohol')) {
        const freq = form.getValues('alcoholFrequency');
        summary.push(`Drinks alcohol (${freq || 'not specified'})`);
    }
    if(lifestyleValues.includes('exercise')) {
        summary.push('Exercises Regularly');
    }
    return summary.join(', ');
  }

  const steps = [
    { step: 1, title: "Welcome!", content: <div>Loading profile...</div>},
    { step: 2, title: "What should we call you?",
        content: (
            <FormField name="fullName" control={form.control} render={({ field }) => (
                <FormItem>
                    <FormControl>
                        <Input placeholder="Enter your full name" {...field} className="w-80 h-12 text-lg text-center" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        )
    },
    { step: 3, title: `What's your date of birth, ${form.watch('fullName')?.split(' ')[0]}?`, 
        content: (
            <FormField name="dob" control={form.control} render={({ field }) => (
              <FormItem className="flex flex-col items-center space-y-4">
                <FormControl>
                    <Input 
                        type="date" 
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-[280px] h-12 text-lg"
                    />
                </FormControl>
                <div className="flex items-center w-full">
                    <div className="flex-grow border-t"></div>
                    <span className="flex-shrink mx-4 text-muted-foreground">OR</span>
                    <div className="flex-grow border-t"></div>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-[280px] justify-start text-left font-normal h-12 text-lg", !field.value && "text-muted-foreground")}>
                            {field.value ? format(new Date(field.value), "PPP") : <span>Pick from calendar</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                            disabled={(date) => {
                                const today = new Date();
                                const thirteenYearsAgo = new Date();
                                thirteenYearsAgo.setFullYear(today.getFullYear() - 13);
                                return date > thirteenYearsAgo || date < new Date("1920-01-01");
                            }}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )} />
        )
    },
    {
      step: 4, title: "What's your height & weight?",
      content: (
        <div className="space-y-4 w-full max-w-xs">
            <FormField
              control={form.control}
              name="height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Ruler/> Height</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input type="number" placeholder="e.g. 165" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} className="h-12 text-lg" />
                    </FormControl>
                    <FormField
                      control={form.control}
                      name="heightUnit"
                      render={({ field: unitField }) => (
                        <Select onValueChange={unitField.onChange} defaultValue={unitField.value}>
                            <FormControl>
                                <SelectTrigger className="w-28 h-12">
                                    <SelectValue placeholder="Unit" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="cm">cm</SelectItem>
                                <SelectItem value="in">in</SelectItem>
                            </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                   <FormLabel className="flex items-center gap-2"><Scale/> Weight</FormLabel>
                   <div className="flex gap-2">
                    <FormControl>
                      <Input type="number" placeholder="e.g. 60" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} className="h-12 text-lg" />
                    </FormControl>
                     <FormField
                      control={form.control}
                      name="weightUnit"
                      render={({ field: unitField }) => (
                        <Select onValueChange={unitField.onChange} defaultValue={unitField.value}>
                            <FormControl>
                                <SelectTrigger className="w-28 h-12">
                                    <SelectValue placeholder="Unit" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="kg">kg</SelectItem>
                                <SelectItem value="lb">lb</SelectItem>
                            </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
      )
    },
    { step: 5, title: "Have you experienced irregular periods?",
        content: (
             <FormField name="periodRegularity" control={form.control} render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {periodRegularity.map(item => (
                         <Button
                            type="button"
                            key={item.id}
                            variant={field.value === item.id ? "default" : "outline"}
                            onClick={() => field.onChange(item.id)}
                            className="w-48 h-12 text-lg"
                        >
                            {item.name}
                        </Button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
        )
    },
    { step: 6, title: "Are you on any medication?", content: renderMultiSelect(medications, "medications", "otherMedication") },
    { step: 7, title: "Any pre-existing health conditions?", content: renderMultiSelect(healthConditions, "healthConditions", "otherCondition") },
    { step: 8, title: "Tell us about your lifestyle",
        content: (
             <FormField
                control={form.control}
                name="lifestyle"
                render={({ field }) => (
                    <FormItem>
                         <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {lifestyle.map(item => (
                                    <Card
                                        key={item.id}
                                        onClick={() => {
                                            const currentValue = field.value || [];
                                            const isChecked = currentValue.includes(item.id);
                                            if (item.id === 'none') {
                                                field.onChange(isChecked ? [] : ['none']);
                                            } else {
                                                let newValue = [...currentValue.filter(id => id !== 'none')];
                                                if (isChecked) {
                                                    newValue = newValue.filter(id => id !== item.id);
                                                } else {
                                                    newValue.push(item.id);
                                                }
                                                field.onChange(newValue);
                                            }
                                        }}
                                        className={cn(
                                            "p-4 cursor-pointer transition-colors w-40 h-full flex flex-col justify-center items-center text-center",
                                            field.value?.includes(item.id) ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent"
                                        )}
                                    >
                                        <div className="flex justify-between items-center w-full">
                                            <item.icon className="h-6 w-6" />
                                            {field.value?.includes(item.id) && <Check className="h-5 w-5" />}
                                        </div>
                                        <p className="font-semibold mt-2">{item.name}</p>
                                    </Card>
                                ))}
                            </div>
                             {field.value?.includes('smoker') && (
                                <FormField
                                    control={form.control}
                                    name="smokingFrequency"
                                    render={({ field: smokeField }) => (
                                        <FormItem className="space-y-3 p-4 border rounded-lg">
                                            <FormLabel>How often do you smoke?</FormLabel>
                                            <FormControl>
                                                <RadioGroup onValueChange={smokeField.onChange} defaultValue={smokeField.value} className="flex gap-4">
                                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="regularly" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">Regularly</FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                                        <FormControl>
                                                             <RadioGroupItem value="occasionally" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">Occasionally</FormLabel>
                                                    </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            {field.value?.includes('alcohol') && (
                                <FormField
                                    control={form.control}
                                    name="alcoholFrequency"
                                    render={({ field: alcoholField }) => (
                                        <FormItem className="space-y-3 p-4 border rounded-lg">
                                            <FormLabel>How often do you drink alcohol?</FormLabel>
                                            <FormControl>
                                                <RadioGroup onValueChange={alcoholField.onChange} defaultValue={alcoholField.value} className="flex gap-4">
                                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="regularly" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">Regularly</FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                                        <FormControl>
                                                             <RadioGroupItem value="occasionally" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">Occasionally</FormLabel>
                                                    </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                         </div>
                    </FormItem>
                )}
             />
        )
    },
    { step: 9, title: "Review your information",
      content: (
        <div className="text-left w-full max-w-md space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={form.getValues('photoURL') || undefined} />
                    <AvatarFallback>{form.getValues('fullName')?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-bold text-lg">{form.getValues('fullName')}</p>
                    <p className="text-muted-foreground">{form.getValues('email')}</p>
                </div>
                 <Button variant="ghost" size="icon" onClick={() => setStep(2)}><Edit2 className="h-4 w-4" /></Button>
            </div>
             <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
                <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p>{form.getValues('dob') ? format(new Date(form.getValues('dob')), "PPP") : 'Not set'}</p>
                </div>
                 <Button variant="ghost" size="icon" onClick={() => setStep(3)}><Edit2 className="h-4 w-4" /></Button>
             </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
                <div>
                    <p className="text-sm text-muted-foreground">Height & Weight</p>
                    <p>
                        {form.getValues('height') || 'N/A'} {form.getValues('heightUnit')} / {form.getValues('weight') || 'N/A'} {form.getValues('weightUnit')}
                    </p>
                </div>
                 <Button variant="ghost" size="icon" onClick={() => setStep(4)}><Edit2 className="h-4 w-4" /></Button>
             </div>
             <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
                <p><strong>Irregular Periods:</strong> {periodRegularity.find(p => p.id === form.getValues('periodRegularity'))?.name || 'Not set'}</p>
                <p><strong>Medications:</strong> {getSummaryList("medications", medications)}</p>
                <p><strong>Health Conditions:</strong> {getSummaryList("healthConditions", healthConditions)}</p>
                <p><strong>Lifestyle:</strong> {getLifestyleSummary()}</p>
             </div>
        </div>
      )
    }
  ]

  if(false) { // Remove loading check since we no longer use Firebase
       return (
          <div className="flex h-screen w-full items-center justify-center bg-white">
            <div className="flex items-center space-x-4 text-2xl font-semibold">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <span>Loading...</span>
            </div>
          </div>
        );
  }

  const currentStepDetails = steps.find(s => s.step === step) || steps[0];

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-2xl">
          <Form {...form}>
            <form onSubmit={e => e.preventDefault()} className="w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center text-center space-y-4"
                >
                    <Card className="p-8 md:p-12 rounded-2xl shadow-xl w-full">
                        <h2 className="font-headline text-3xl md:text-4xl font-bold text-foreground mb-2">{currentStepDetails.title}</h2>
                        <p className="text-muted-foreground mb-8">Let's get to know you better.</p>
                        <div className="min-h-[200px] flex items-center justify-center w-full">
                            {currentStepDetails.content}
                        </div>
                    </Card>
                </motion.div>
              </AnimatePresence>
              
              <StepIndicator currentStep={step} totalSteps={steps.length} />

              <div className="mt-8 flex w-full justify-between">
                {step > 2 ? (
                  <Button type="button" variant="ghost" onClick={handleBack} size="lg">
                    <ChevronLeft className="h-5 w-5 mr-2" /> Back
                  </Button>
                ) : <div />}
                <Button type="button" onClick={handleNext} size="lg">
                  {step === steps.length ? "Finish" : "Next"}
                  {step < steps.length && <ChevronRight className="h-5 w-5 ml-2" />}
                </Button>
              </div>
            </form>
          </Form>
        </div>
    </div>
  )
}

    