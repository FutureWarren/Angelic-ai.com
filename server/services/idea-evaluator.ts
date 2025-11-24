import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface EvaluationResult {
  viability: {
    score: number; // 0-100
  };
  excellence: {
    score: number; // 0-100
  };
  decision: "Go" | "Conditional Go" | "Drop";
  uncertainty: "Low" | "Med" | "High";
  top_risks: string[];
  key_enablers: string[];
}

export async function evaluateIdea(
  ideaText: string,
  category?: string,
  stage?: string
): Promise<EvaluationResult> {
  const systemPrompt = `You are an expert startup evaluator. 

**IMPORTANT: Use the full 0-100 scoring range.**
- Only the top 5% of startup ideas should score 90+
- Average ideas should cluster around 50
- Ideas lacking feasibility or innovation should score below 30
- Do NOT normalize or average scores across different evaluations

**Baseline Reference (80 points):**
"An online platform for renting private parking spaces in cities."
When evaluating other ideas:
- Better than this baseline → score above 80
- Worse than this baseline → score below 80

Evaluate ideas on two dimensions:

1. VIABILITY (0-100): Technical + commercial feasibility
   - Can it be built with current technology?
   - Is there a clear path to market?
   - Are unit economics plausible?
   
2. EXCELLENCE (0-100): Long-term potential & impact
   - Market size and growth potential
   - Defensibility (moats, network effects)
   - Expected value (probability × magnitude)

Be STRICT and objective. Use the full range: exceptional ideas 90+, good ideas 70-85, average 45-60, poor <30.

Return JSON only with this structure:
{
  "viability_score": 0-100,
  "excellence_score": 0-100,
  "decision": "Go" | "Conditional Go" | "Drop",
  "uncertainty": "Low" | "Med" | "High",
  "top_risks": ["risk1", "risk2", "risk3"],
  "key_enablers": ["enabler1", "enabler2", "enabler3"]
}

Decision criteria:
- "Drop": Viability < 40 OR Excellence < 30
- "Conditional Go": Viability 40-59 OR major risks
- "Go": Viability ≥ 60 AND Excellence ≥ 50

Uncertainty:
- "High": Unproven market, novel tech, unclear monetization
- "Med": Some validation exists but gaps remain
- "Low": Clear path with precedents`;

  const userPrompt = `Evaluate this startup idea:

Idea: ${ideaText}
${category ? `Category: ${category}` : ''}
${stage ? `Stage: ${stage}` : ''}

Provide strict, objective evaluation.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 800
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const result = JSON.parse(content);

    return {
      viability: { score: result.viability_score },
      excellence: { score: result.excellence_score },
      decision: result.decision,
      uncertainty: result.uncertainty,
      top_risks: result.top_risks || [],
      key_enablers: result.key_enablers || []
    };
  } catch (error) {
    console.error('Idea evaluation error:', error);
    throw new Error('Failed to evaluate idea');
  }
}
