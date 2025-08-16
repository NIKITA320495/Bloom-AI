"use client"

import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function SettingsPage() {
    // In a real app, these states would be managed globally (e.g., via Context or Zustand)
    // and would interact with system settings or a backend.
    
    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Settings</h1>
                    <p className="text-muted-foreground">Manage your app preferences.</p>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                        <CardDescription>Customize the look and feel of the app.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="theme-mode" className="font-semibold">Theme</Label>
                            {/* Theme switching would require more logic, including updating the class on the `html` element */}
                            <RadioGroup defaultValue="light" className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="light" id="r1" />
                                    <Label htmlFor="r1">Light</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="dark" id="r2" />
                                    <Label htmlFor="r2">Dark</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="system" id="r3" />
                                    <Label htmlFor="r3">System</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>Manage how you receive notifications from Bloom.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="cycle-reminders" className="font-semibold">Cycle Reminders</Label>
                            <Switch id="cycle-reminders" defaultChecked />
                        </div>
                         <div className="flex items-center justify-between">
                            <Label htmlFor="symptom-prompts" className="font-semibold">Symptom Logging Prompts</Label>
                            <Switch id="symptom-prompts" defaultChecked />
                        </div>
                         <div className="flex items-center justify-between">
                            <Label htmlFor="community-alerts" className="font-semibold">Community Alerts</Label>
                            <Switch id="community-alerts" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}
