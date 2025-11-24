import OpenAI from "openai";
import type { Idea, Eval } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface ComparisonResult {
  winner: "A" | "B" | "Tie";
  reasons: string[];
  confidence: "High" | "Med" | "Low";
}

export async function compareIdeas(
  ideaA: { idea: Idea; eval: Eval },
  ideaB: { idea: Idea; eval: Eval }
): Promise<ComparisonResult> {
  const systemPrompt = `You are an expert startup evaluator comparing two ideas. Consider:

1. VIABILITY: Can it be built? Clear path to market?
2. EXCELLENCE: Market potential, defensibility, expected value
3. EXECUTION CLARITY: How well-defined is the plan?
4. BREAKTHROUGH POTENTIAL: Could this be a category leader?

Be objective and decisive. Consider both quantitative scores and qualitative factors.

Return JSON only with this structure:
{
  "winner": "A" | "B" | "Tie",
  "reasons": ["reason1", "reason2", "reason3"],
  "confidence": "High" | "Med" | "Low"
}

Winner logic:
- "A" or "B": Clear superior idea
- "Tie": Too close to call or both have major flaws

Confidence:
- "High": Decisive advantage in multiple dimensions
- "Med": Moderate advantage or trade-offs exist
- "Low": Marginal differences or high uncertainty`;

  const userPrompt = `Compare these two startup ideas:

IDEA A:
Text: ${ideaA.idea.text}
Category: ${ideaA.idea.category || 'N/A'}
Stage: ${ideaA.idea.stage || 'N/A'}
Viability Score: ${ideaA.eval.viabilityScore}/100
Excellence Score: ${ideaA.eval.excellenceScore}/100
Decision: ${ideaA.eval.decision}
Uncertainty: ${ideaA.eval.uncertainty}
Top Risks: ${ideaA.eval.topRisks.join(', ')}
Key Enablers: ${ideaA.eval.keyEnablers.join(', ')}

IDEA B:
Text: ${ideaB.idea.text}
Category: ${ideaB.idea.category || 'N/A'}
Stage: ${ideaB.idea.stage || 'N/A'}
Viability Score: ${ideaB.eval.viabilityScore}/100
Excellence Score: ${ideaB.eval.excellenceScore}/100
Decision: ${ideaB.eval.decision}
Uncertainty: ${ideaB.eval.uncertainty}
Top Risks: ${ideaB.eval.topRisks.join(', ')}
Key Enablers: ${ideaB.eval.keyEnablers.join(', ')}

Which idea is better overall? Provide clear reasoning.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 600
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const result = JSON.parse(content);

    return {
      winner: result.winner,
      reasons: result.reasons || [],
      confidence: result.confidence
    };
  } catch (error) {
    console.error('Idea comparison error:', error);
    throw new Error('Failed to compare ideas');
  }
}

// ELO calculation using standard formula
export function calculateNewElo(
  ratingA: number,
  ratingB: number,
  outcomeA: number, // 1 for win, 0.5 for tie, 0 for loss
  K: number = 24
): { newRatingA: number; newRatingB: number } {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 / (1 + Math.pow(10, (ratingA - ratingB) / 400));
  
  const newRatingA = ratingA + K * (outcomeA - expectedA);
  const newRatingB = ratingB + K * ((1 - outcomeA) - expectedB);
  
  return {
    newRatingA: Math.round(newRatingA),
    newRatingB: Math.round(newRatingB)
  };
}
