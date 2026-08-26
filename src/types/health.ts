import type { ComponentType, ReactNode } from "react";
import type { DiseaseSuggestion, HealthAssessmentResponse } from "@/types/plant";

/**
 * @file src/types/health.ts
 * Shared types for the plant-health domain (Health Result cards, Health Gauge,
 * General Tips, Insights). Kept outside components so screens stay lean and
 * types remain reusable.
 */

export type IconComponent = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

export type HealthState = "perfect" | "optimization" | "critical";

export interface InterpretedHealth {
  state: HealthState;
  score: number;
  relevantSuggestions: DiseaseSuggestion[];
  hadSuggestions: boolean;
}

export interface StatePalette {
  tint: string;
  trackTint: string;
  bg: string;
  eyebrow: string;
  eyebrowLabel: string;
  title: string;
  subtitle: string;
  icon: IconComponent;
}

export interface GeneralTip {
  icon: IconComponent;
  tint: string;
  title: string;
  body: string;
}

export interface FadeInProps {
  delay?: number;
  children: ReactNode;
}

export interface HealthGaugeProps {
  score: number;
  palette: StatePalette;
}

export interface GeneralTipsCardProps {
  palette: StatePalette;
  score: number;
  hadNoisySuggestions: boolean;
}

export interface HealthResultCardProps {
  response: HealthAssessmentResponse;
  lastCheckedAt: string | null;
}

export type InsightTone = "optimization" | "critical";
