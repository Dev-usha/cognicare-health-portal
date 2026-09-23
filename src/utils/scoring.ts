import { CompanionType, DomainCategory, ResearchCategory, ScreeningQuestion, ScreeningResult } from '../types';

export function calculateScreeningResult(
  responses: Record<number, number>,
  questions: ScreeningQuestion[]
): ScreeningResult {
  const domainTotals: Record<string, { total: number; count: number }> = {
    'Attention & Focus': { total: 0, count: 0 },
    'Hyperactivity': { total: 0, count: 0 },
    'Impulsivity': { total: 0, count: 0 },
    'Developmental History': { total: 0, count: 0 },
    'Memory': { total: 0, count: 0 },
    'Executive Function': { total: 0, count: 0 },
    'Language': { total: 0, count: 0 },
    'Orientation': { total: 0, count: 0 },
    'Cognitive Change': { total: 0, count: 0 },
    'Daily Functioning': { total: 0, count: 0 },
  };

  const domainKeyTotals: Record<string, { total: number; count: number }> = {
    attention: { total: 0, count: 0 },
    hyperactivity: { total: 0, count: 0 },
    impulsivity: { total: 0, count: 0 },
    childhood_history: { total: 0, count: 0 },
    memory: { total: 0, count: 0 },
    executive: { total: 0, count: 0 },
    language: { total: 0, count: 0 },
    orientation: { total: 0, count: 0 },
    cognitive_decline: { total: 0, count: 0 },
    functional_impairment: { total: 0, count: 0 },
  };

  let grandTotal = 0;
  const maxPossible = questions.length * 4;

  questions.forEach((q) => {
    const val = responses[q.id] ?? 0;
    grandTotal += val;

    if (domainTotals[q.category]) {
      domainTotals[q.category].total += val;
      domainTotals[q.category].count += 1;
    }

    if (q.domain && domainKeyTotals[q.domain]) {
      domainKeyTotals[q.domain].total += val;
      domainKeyTotals[q.domain].count += 1;
    }
  });

  const domainScores: Record<string, { total: number; count: number; avg: number }> = {};

  Object.entries(domainTotals).forEach(([cat, item]) => {
    const avg = item.count > 0 ? item.total / item.count : 0;
    domainScores[cat] = {
      total: item.total,
      count: item.count,
      avg: Number(avg.toFixed(2)),
    };
  });

  const getAvg = (domainKey: string, fallbackCategory?: string): number => {
    if (domainKeyTotals[domainKey] && domainKeyTotals[domainKey].count > 0) {
      return domainKeyTotals[domainKey].total / domainKeyTotals[domainKey].count;
    }
    if (fallbackCategory && domainScores[fallbackCategory]) {
      return domainScores[fallbackCategory].avg;
    }
    return 0;
  };

  const attentionAvg = getAvg('attention', 'Attention & Focus');
  const hyperactivityAvg = getAvg('hyperactivity', 'Hyperactivity');
  const impulsivityAvg = getAvg('impulsivity', 'Impulsivity');
  const childhoodAvg = getAvg('childhood_history', 'Developmental History');
  const memoryAvg = getAvg('memory', 'Memory');
  const executiveAvg = getAvg('executive', 'Executive Function');
  const languageAvg = getAvg('language', 'Language');
  const orientationAvg = getAvg('orientation', 'Orientation');
  const cognitiveDeclineAvg = getAvg('cognitive_decline', 'Cognitive Change');
  const functionalImpairmentAvg = getAvg('functional_impairment', 'Daily Functioning');

  // ADHD Cluster calculation
  const adhdWeightSum = 2.0 + 1.4 + 1.4 + 1.8;
  const adhdScoreRaw =
    attentionAvg * 2.0 +
    hyperactivityAvg * 1.4 +
    impulsivityAvg * 1.4 +
    childhoodAvg * 1.8;
  const adhdNorm = adhdScoreRaw / adhdWeightSum;

  // MCI Cluster calculation (noticeable memory & cognitive change, preserved daily independence)
  const mciWeightSum = 2.0 + 1.8 + 1.4 + 1.0;
  const mciScoreRaw =
    memoryAvg * 2.0 +
    cognitiveDeclineAvg * 1.8 +
    executiveAvg * 1.4 +
    languageAvg * 1.0;
  const mciNorm = mciScoreRaw / mciWeightSum;

  // Dementia / Significant Impairment Cluster calculation
  const dementiaWeightSum = 2.2 + 1.8 + 1.8 + 1.4 + 1.0;
  const dementiaScoreRaw =
    functionalImpairmentAvg * 2.2 +
    orientationAvg * 1.8 +
    cognitiveDeclineAvg * 1.8 +
    memoryAvg * 1.4 +
    executiveAvg * 1.0;
  const dementiaNorm = dementiaScoreRaw / dementiaWeightSum;

  // Transparent Rule-Based Classifier into 5 Research Categories:
  // 1. Significant Cognitive/Functional Impairment Pattern -> Dementia Companion
  // 2. Mild Cognitive Impairment-like Pattern (MCI) -> MCI Companion
  // 3. ADHD-like Pattern (Inattentive/Hyperactive) -> ADHD Companion
  // 4. Subjective Cognitive Complaint (SCC) -> MCI Companion (or ADHD based on dominant symptoms)
  // 5. Subclinical / Typical Cognitive Pattern -> ADHD Companion / Wellness maintenance
  let researchCategory: ResearchCategory;
  let researchCategoryExplanation = '';
  let recommendedCompanion: CompanionType = 'ADHD Companion';

  const hasFunctionalImpairment = functionalImpairmentAvg >= 1.5;
  const hasHighDeclineOrDisorientation = (cognitiveDeclineAvg >= 2.0 && orientationAvg >= 1.5);

  if (hasFunctionalImpairment || (dementiaNorm >= 1.8 && hasHighDeclineOrDisorientation)) {
    researchCategory = 'Significant Cognitive/Functional Impairment Pattern';
    researchCategoryExplanation =
      'Elevated ratings in daily activity management (finances, medications, or navigation) with progressive cognitive changes. Best supported with caregiver coordination and daily routine scaffolding.';
    recommendedCompanion = 'Dementia Companion';
  } else if ((memoryAvg >= 1.5 || cognitiveDeclineAvg >= 1.5) && functionalImpairmentAvg < 1.5 && (memoryAvg >= attentionAvg || mciNorm >= adhdNorm)) {
    researchCategory = 'Mild Cognitive Impairment-like Pattern (MCI)';
    researchCategoryExplanation =
      'Noticeable memory retrieval friction or perceived decline over time, while daily living independence remains largely preserved. Best supported with spaced recall exercises and memory cues.';
    recommendedCompanion = 'MCI Companion';
  } else if (adhdNorm >= 1.2 || (attentionAvg >= 1.5 && (hyperactivityAvg >= 1.0 || impulsivityAvg >= 1.0 || childhoodAvg >= 1.0))) {
    researchCategory = 'ADHD-like Pattern (Inattentive/Hyperactive)';
    researchCategoryExplanation =
      'Prominent attention maintenance challenges, task initiation friction, restlessness, or childhood developmental continuity. Best supported with focus timers, pacing, and distraction filters.';
    recommendedCompanion = 'ADHD Companion';
  } else if (cognitiveDeclineAvg >= 1.0 || memoryAvg >= 1.0) {
    researchCategory = 'Subjective Cognitive Complaint (SCC)';
    researchCategoryExplanation =
      'Mild self-perceived cognitive friction or mental fatigue without significant clinical functional disruption. Supported with preventative memory hygiene and cognitive wellness habits.';
    recommendedCompanion = 'MCI Companion';
  } else {
    researchCategory = 'Subclinical / Typical Cognitive Pattern';
    researchCategoryExplanation =
      'Overall responses fall within a typical, subclinical baseline range. Focus tools are recommended for productivity maintenance and cognitive vitality.';
    recommendedCompanion = 'ADHD Companion';
  }

  const percentage = Math.round((grandTotal / Math.max(1, maxPossible)) * 100);

  return {
    totalScore: grandTotal,
    maxPossible,
    percentage,
    domainScores,
    researchCategory,
    researchCategoryExplanation,
    recommendedCompanion,
    scoringMethod: 'deterministic',
    timestamp: new Date().toISOString().split('T')[0],
  };
}
