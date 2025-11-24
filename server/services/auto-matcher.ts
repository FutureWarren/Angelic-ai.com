import { storage } from "../storage";
import { compareIdeas, calculateNewElo } from "./idea-comparer";

/**
 * Automatically schedule matches for a new idea
 * Finds similar-ELO ideas and runs comparisons to establish ranking
 */
export async function autoScheduleMatches(
  newIdeaId: string,
  targetMatches: number = 5
): Promise<void> {
  try {
    // Get the new idea's rating
    const newRating = await storage.getRating(newIdeaId);
    if (!newRating) {
      console.log(`⏭️ Idea ${newIdeaId} not eligible for auto-matching (no rating)`);
      return;
    }

    const newIdea = await storage.getIdea(newIdeaId);
    const newEval = await storage.getEval(newIdeaId);
    
    if (!newIdea || !newEval) {
      console.log(`⏭️ Idea ${newIdeaId} missing data for auto-matching`);
      return;
    }

    let currentElo = parseInt(newRating.eloScore);
    let currentMatchCount = parseInt(newRating.matchCount);

    // Don't over-match
    if (currentMatchCount >= targetMatches) {
      console.log(`✓ Idea ${newIdeaId} already has ${currentMatchCount} matches`);
      return;
    }

    // Get already-matched idea IDs to avoid duplicates
    const existingMatches = await storage.getMatchesForIdea(newIdeaId);
    const excludeIds = [
      newIdeaId,
      ...existingMatches.map(m => m.ideaAId === newIdeaId ? m.ideaBId : m.ideaAId)
    ];

    // Find similar-ELO opponents (cross-category for global ranking)
    const matchesNeeded = targetMatches - currentMatchCount;
    const candidates = await storage.getIdeasNearElo(
      currentElo,
      null, // Allow cross-category comparisons for global ranking
      excludeIds,
      matchesNeeded * 2 // Get extra candidates in case some fail
    );

    if (candidates.length === 0) {
      console.log(`⏭️ No matching candidates found for idea ${newIdeaId}`);
      return;
    }

    console.log(`🎯 Auto-matching idea ${newIdeaId} against ${Math.min(matchesNeeded, candidates.length)} opponents`);

    // Run matches
    let matchesRun = 0;
    for (const candidate of candidates) {
      if (matchesRun >= matchesNeeded) break;

      try {
        const candidateEval = await storage.getEval(candidate.idea.id);
        if (!candidateEval) continue;

        // Run comparison
        const comparison = await compareIdeas(
          { idea: newIdea, eval: newEval },
          { idea: candidate.idea, eval: candidateEval }
        );

        // Determine outcome
        let outcomeA: number;
        if (comparison.winner === 'A') {
          outcomeA = 1;
        } else if (comparison.winner === 'B') {
          outcomeA = 0;
        } else {
          outcomeA = 0.5;
        }

        // Calculate new ELO using CURRENT (updated) ratings
        const candidateElo = parseInt(candidate.rating.eloScore);
        const { newRatingA, newRatingB } = calculateNewElo(currentElo, candidateElo, outcomeA);

        // Update ratings in database
        await Promise.all([
          storage.createOrUpdateRating({
            ideaId: newIdeaId,
            eloScore: String(newRatingA),
            matchCount: String(currentMatchCount + 1)
          }),
          storage.createOrUpdateRating({
            ideaId: candidate.idea.id,
            eloScore: String(newRatingB),
            matchCount: String(parseInt(candidate.rating.matchCount) + 1)
          })
        ]);

        // Record match
        await storage.createMatch({
          ideaAId: newIdeaId,
          ideaBId: candidate.idea.id,
          winner: comparison.winner,
          reasons: comparison.reasons,
          confidence: comparison.confidence
        });

        console.log(`✓ Match ${matchesRun + 1}/${matchesNeeded}: ${newIdeaId} vs ${candidate.idea.id} → ${comparison.winner} (ELO: ${currentElo} → ${newRatingA})`);
        
        // Update local tracking for next iteration
        currentElo = newRatingA;
        currentMatchCount += 1;
        matchesRun++;

      } catch (error) {
        console.error(`❌ Match failed for ${newIdeaId} vs ${candidate.idea.id}:`, error);
        continue;
      }
    }

    console.log(`✅ Auto-matching complete: ${matchesRun} matches run for idea ${newIdeaId}`);

  } catch (error) {
    console.error('Auto-matching error:', error);
  }
}
