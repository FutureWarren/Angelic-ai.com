export type BadgeType = 
  | "Legendary" 
  | "Platinum" 
  | "Gold" 
  | "Silver" 
  | "Bronze" 
  | "Emerging"
  | null;

export interface BadgeInfo {
  badge: BadgeType;
  color: string;
  description: string;
}

/**
 * Calculate badge based on ELO rating and match count
 * 
 * Badge Tiers:
 * - Legendary: ELO >= 1700, matches >= 10
 * - Platinum: ELO >= 1650, matches >= 8
 * - Gold: ELO >= 1600, matches >= 6
 * - Silver: ELO >= 1550, matches >= 5
 * - Bronze: ELO >= 1500, matches >= 4
 * - Emerging: ELO >= 1450, matches >= 3
 */
export function calculateBadge(eloScore: number, matchCount: number): BadgeInfo {
  if (matchCount < 3) {
    return {
      badge: null,
      color: "gray",
      description: "Not yet ranked"
    };
  }

  if (eloScore >= 1700 && matchCount >= 10) {
    return {
      badge: "Legendary",
      color: "#9333ea", // purple
      description: "Top 1% - Exceptional breakthrough potential"
    };
  }

  if (eloScore >= 1650 && matchCount >= 8) {
    return {
      badge: "Platinum",
      color: "#0891b2", // cyan
      description: "Elite tier - Outstanding market potential"
    };
  }

  if (eloScore >= 1600 && matchCount >= 6) {
    return {
      badge: "Gold",
      color: "#f59e0b", // amber
      description: "Excellent - Strong competitive advantage"
    };
  }

  if (eloScore >= 1550 && matchCount >= 5) {
    return {
      badge: "Silver",
      color: "#6b7280", // gray
      description: "Very Good - Solid execution potential"
    };
  }

  if (eloScore >= 1500 && matchCount >= 4) {
    return {
      badge: "Bronze",
      color: "#b45309", // brown
      description: "Good - Proven viability"
    };
  }

  if (eloScore >= 1450 && matchCount >= 3) {
    return {
      badge: "Emerging",
      color: "#16a34a", // green
      description: "Rising - Shows promise"
    };
  }

  return {
    badge: null,
    color: "gray",
    description: "Needs more evaluation"
  };
}

/**
 * Get percentile rank for an ELO score
 * Assumes normal distribution centered at 1500
 */
export function getPercentileRank(eloScore: number): number {
  // Simple approximation: every 50 ELO points is roughly 1 standard deviation
  const stdDev = 50;
  const mean = 1500;
  const zScore = (eloScore - mean) / stdDev;
  
  // Convert z-score to percentile (rough approximation)
  if (zScore >= 2.5) return 99;
  if (zScore >= 2.0) return 98;
  if (zScore >= 1.5) return 93;
  if (zScore >= 1.0) return 84;
  if (zScore >= 0.5) return 69;
  if (zScore >= 0) return 50;
  if (zScore >= -0.5) return 31;
  if (zScore >= -1.0) return 16;
  if (zScore >= -1.5) return 7;
  if (zScore >= -2.0) return 2;
  return 1;
}
