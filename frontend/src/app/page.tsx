
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/types';

const LeafIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M17.61,3.47A8.75,8.75,0,0,0,3.5,12.39c0,4.24,3,8.44,3.5,9.11a1,1,0,0,0,1.6-.2l1.37-2.84A5.43,5.43,0,0,1,12,14.65a5.76,5.76,0,0,1,3.41-1.12l1.3-1.3A8.75,8.75,0,0,0,17.61,3.47Z" />
  </svg>
);

export default function WelcomePage() {
  const router = useRouter();
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in with local profile
    if (localStorage.getItem('bloom_user_profile')) {
      router.replace('/register');
    }
  }, [router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError(null);
    
    if (!email || !password) {
        setAuthError("Please enter both email and password.");
        setIsSubmitting(false);
        return;
    }

    try {
        // Simulate login by creating a dummy profile
        const simulatedUserProfile: Partial<UserProfile> = {
            email: email,
            name: email.split('@')[0], // Use part of email as name
        };
        localStorage.setItem('bloom_user_profile', JSON.stringify(simulatedUserProfile));
        
        // Redirect to registration/onboarding
        router.replace('/register');

    } catch (error) {
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  };

  // Hide page content if a profile exists in local storage to prevent flicker before redirect.
  if (typeof window !== "undefined" && window.localStorage.getItem('bloom_user_profile')) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex items-center space-x-4 text-2xl font-semibold">
          <LeafIcon className="h-8 w-8 animate-spin text-primary" />
          <span>Redirecting...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center bg-background p-8 text-center overflow-hidden">
      <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-purple-100 to-rose-100 opacity-50"></div>
          <div className="absolute bottom-0 left-[-20%] right-[-20%] top-[20%] h-[500px] w-[500px] rounded-full bg-rose-200/50 blur-[120px] filter" />
          <div className="absolute bottom-[20%] right-[20%] top-[-10%] h-[300px] w-[300px] rounded-full bg-purple-200/50 blur-[100px] filter" />
      </div>

      <div className="relative flex w-full max-w-sm flex-col items-center justify-center rounded-2xl border bg-card/60 p-8 shadow-lg backdrop-blur-lg">
        <div className="mb-6">
            <div className="flex items-center justify-center gap-3">
                 <LeafIcon className="h-12 w-12 text-primary" />
                <h1 className="font-headline text-6xl font-bold tracking-tight text-gray-800">
                    Bloom
                </h1>
            </div>
             <p className="mt-2 text-lg text-foreground/80">
                Your personal guide through menopause.
            </p>
        </div>
       
        <form onSubmit={handleEmailAuth} className="w-full space-y-4">
            <div className="space-y-1 text-left">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div className="space-y-1 text-left">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
             {authError && <p className="text-sm text-destructive">{authError}</p>}
             <Button
                type="submit"
                size="lg"
                className="w-full font-headline text-lg"
                disabled={isSubmitting}
            >
                <LogIn className="mr-3 h-5 w-5" />
                {isSubmitting ? 'Processing...' : (isLoginView ? 'Continue with Email' : 'Sign Up with Email')}
            </Button>
        </form>

        <div className="my-4 flex items-center w-full">
            <div className="flex-grow border-t border-muted"></div>
            <span className="flex-shrink mx-4 text-muted-foreground text-sm">Create Account</span>
            <div className="flex-grow border-t border-muted"></div>
        </div>

         <p className="mt-6 text-sm text-muted-foreground">
            {isLoginView ? "Don't have an account?" : "Already have an account?"}
            <Button variant="link" onClick={() => { setIsLoginView(!isLoginView); setAuthError(null); }} className="font-semibold">
                {isLoginView ? 'Sign Up' : 'Log In'}
            </Button>
        </p>
      </div>
    </div>
  );
}
