
import type { LucideIcon } from "lucide-react";

export interface UserProfile {
  id?: string; // Add ID field for backend communication
  name: string;
  fullName?: string; // from register page
  email?: string;
  photoURL?: string | null;
  dob: string;
  height?: number;
  heightUnit?: 'cm' | 'in';
  weight?: number;
  weightUnit?: 'kg' | 'lb';
  periodRegularity?: "yes" | "no" | "not-sure";
  healthConditions: string[];
  medications: string[];
  lifestyle?: string[];
  smokingFrequency?: string;
  alcoholFrequency?: string;
  onboardingComplete?: boolean;
}


export interface SymptomLog {
  [date: string]: string[];
}

export interface PeriodLog {
  [date: string]: "none" | "light" | "medium" | "heavy" | "very_heavy";
}

export type Symptom = {
  id: string;
  name: string;
  icon: React.ElementType;
};

export type PeriodFlow = {
  id: "none" | "light" | "medium" | "heavy" | "very_heavy";
  name: string;
}

export type SelectableItem = {
  id: string;
  name: string;
  icon: LucideIcon;
}

export type Article = {
  title: string;
  category: string;
  image: string;
  link: string;
};

export type Fact = {
  title: string;
  description: string;
  image: string;
  aiHint: string;
};

export type Doctor = {
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  image: string;
};

export type ProgressRingProps = {
  value: number;
  radius?: number;
  stroke?: number;
  className?: string;
};

export type Insight = {
  title: string;
  description: string;
  icon: LucideIcon;
  link: string;
  color: string;
};


    