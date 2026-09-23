import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Initialize Gemini AI client server-side
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  // API Route for health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", aiEnabled: !!ai });
  });

  // API Route for Cognitive AI Analysis & LLM-assisted Feature Extraction
  app.post("/api/screening/analyze", async (req, res) => {
    try {
      const { user, scores, domainScores, recommendedCompanion, useLLM, responses, questions } = req.body;

      // If user did not request LLM extraction or if AI client is unavailable:
      if (!useLLM || !ai) {
        return res.json({
          scoringMethod: "deterministic",
          scoringFallback: useLLM && !ai,
          researchCategory: req.body?.researchCategory || "ADHD-like Pattern (Inattentive/Hyperactive)",
          researchCategoryExplanation: req.body?.researchCategoryExplanation || "Deterministic transparent rule-based categorization based on 10 section domain scores.",
          recommendedCompanion: recommendedCompanion || "ADHD Companion",
          summary: `Based on your deterministic baseline response profile, the ${recommendedCompanion || "recommended companion"} offers targeted scaffolding for your daily routine and cognitive wellness.`,
          keyTakeaways: [
            "Your domain responses highlight specific areas where structured scaffolding aids daily flow.",
            "Use the recommended companion modules consistently to support focus, memory, and task continuity.",
            "Sharing these self-reflection baseline insights with your physician or specialist can support personalized care."
          ],
          focusTip: "Maintain consistent sleep, hydration, and structured pacing throughout your day for optimal brain vitality.",
          extractedFeatures: [
            "Baseline calculated through deterministic response weighting across 10 structured sections.",
            "High fidelity domain assessment targeting attention, memory retention, and daily functioning."
          ]
        });
      }

      // Format response breakdown for Gemini LLM feature extraction
      const answeredDetails = (questions || []).map((q: any) => {
        const val = responses ? responses[q.id] : undefined;
        return `[${q.sectionTitle} / ${q.domain}] Q${q.id}: "${q.text}" -> Score: ${val ?? 'Unanswered'}/4 (Scale: ${q.scaleType})`;
      }).join('\n');

      const prompt = `You are a clinical-research cognitive wellness AI analyzing a 30-item multidomain screening instrument.
Analyze these 30-item cognitive self-reflection assessment metrics and responses for a user:

User Profile: Age ${user?.age || 'N/A'}, Gender: ${user?.gender || 'N/A'}
Total Baseline Score: ${scores?.totalScore || 0} / ${scores?.maxPossible || 120}
Deterministic Domain Scores: ${JSON.stringify(domainScores || {})}
Algorithmic Baseline Match: ${recommendedCompanion}

Detailed 30 Question Responses across 10 Sections:
${answeredDetails}

Task:
Perform research-extraction LLM feature analysis across the 10 sections:
1. Attention & Focus (Q1–7)
2. Hyperactivity (Q8–9)
3. Impulsivity (Q10–11)
4. Developmental History (Q12–14)
5. Memory (Q15–19)
6. Executive Function (Q20–22)
7. Language (Q23)
8. Orientation (Q24)
9. Cognitive Change (Q25–27)
10. Daily Functioning (Q28–30)

Place the overall pattern into one of five research categories:
1. "ADHD-like Pattern (Inattentive/Hyperactive)" -> suggest 'ADHD Companion'
2. "Subjective Cognitive Complaint (SCC)" -> suggest 'MCI Companion'
3. "Mild Cognitive Impairment-like Pattern (MCI)" -> suggest 'MCI Companion'
4. "Significant Cognitive/Functional Impairment Pattern" -> suggest 'Dementia Companion'
5. "Subclinical / Typical Cognitive Pattern" -> suggest 'ADHD Companion'

Provide a reassuring, compassionate, empowering, non-diagnostic response in strict JSON:
{
  "scoringMethod": "llm",
  "researchCategory": "ADHD-like Pattern (Inattentive/Hyperactive)" | "Subjective Cognitive Complaint (SCC)" | "Mild Cognitive Impairment-like Pattern (MCI)" | "Significant Cognitive/Functional Impairment Pattern" | "Subclinical / Typical Cognitive Pattern",
  "researchCategoryExplanation": "A 1-2 sentence explanation of why this research category fits their response pattern.",
  "recommendedCompanion": "ADHD Companion" | "MCI Companion" | "Dementia Companion",
  "summary": "A 2-3 sentence personalized summary highlighting their strengths and why this companion module fits.",
  "keyTakeaways": ["Actionable strategy 1", "Actionable strategy 2", "Actionable strategy 3"],
  "focusTip": "One daily habit tip for brain wellness",
  "extractedFeatures": [
    "Key extracted feature 1 regarding attention or memory profile",
    "Key extracted feature 2 regarding daily functioning or developmental continuity",
    "Key extracted feature 3 regarding routine scaffolding needs"
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "{}";
      const parsedData = JSON.parse(text);

      // Validate recommendedCompanion
      const validCompanions = ['ADHD Companion', 'MCI Companion', 'Dementia Companion'];
      if (!validCompanions.includes(parsedData.recommendedCompanion)) {
        parsedData.recommendedCompanion = recommendedCompanion || 'ADHD Companion';
      }
      parsedData.scoringMethod = "llm";
      parsedData.scoringFallback = false;

      return res.json(parsedData);
    } catch (err: any) {
      console.error("Error running LLM feature extraction with Gemini:", err);
      // Automatic graceful fallback to deterministic scoring as promised in the UI
      return res.json({
        scoringMethod: "deterministic",
        scoringFallback: true,
        researchCategory: req.body?.researchCategory || "ADHD-like Pattern (Inattentive/Hyperactive)",
        researchCategoryExplanation: req.body?.researchCategoryExplanation || "Deterministic transparent rule-based categorization based on 10 section domain scores.",
        recommendedCompanion: req.body?.recommendedCompanion || "ADHD Companion",
        summary: `Your baseline screening indicates that the ${req.body?.recommendedCompanion || "Recommended Companion"} will provide optimal structured support for your cognitive wellness.`,
        keyTakeaways: [
          "Focus on structured daily routines and memory cues.",
          "Engage in interactive cognitive exercises daily.",
          "Track sleep, hydration, and mood to maintain holistic brain health."
        ],
        focusTip: "Consistency in daily habits strengthens cognitive resilience.",
        extractedFeatures: [
          "Evaluated using deterministic domain algorithms across the 10 assessment sections."
        ]
      });
    }
  });

  // Vite middleware for dev or static serving for prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CogniCare Health server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
