export type FitPlan = 'basic' | 'market' | 'enterprise';
export const FIT_CONSENT_TEXT = 'Send me LotScout news and marketing emails. I can unsubscribe at any time.';
export const FIT_CONSENT_VERSION = '2026-11-10';
export function validFitAnswers(value: unknown): value is string[] {
  return Array.isArray(value) && value.length === 3 &&
    ['national', 'local', 'deep'].includes(value[0]) &&
    ['standard', 'custom'].includes(value[1]) &&
    ['national', 'markets', 'special'].includes(value[2]);
}
export function recommendFit(answers: string[]): FitPlan {
  return answers[0] === 'deep' || answers[1] === 'custom' || answers[2] === 'special'
    ? 'enterprise' : answers[0] === 'local' || answers[2] === 'markets' ? 'market' : 'basic';
}
