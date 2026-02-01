/**
 * SentimentAnalyzer - Analyze user feedback sentiment
 * Tracks positive, negative, and neutral signals from user messages
 */

export const SENTIMENT = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral'
}

// Positive indicators with weights
const POSITIVE_PATTERNS = [
  // Strong positive
  { pattern: /\b(perfect|excellent|amazing|awesome|fantastic|brilliant|love it)\b/i, weight: 1.0 },
  { pattern: /\b(great job|well done|nicely done|good job)\b/i, weight: 1.0 },
  { pattern: /\bthank(s| you)\b/i, weight: 0.7 },
  { pattern: /\b(exactly|precisely) (what i|right)\b/i, weight: 0.9 },
  
  // Moderate positive
  { pattern: /\b(good|nice|cool|neat|sweet)\b/i, weight: 0.5 },
  { pattern: /\b(works?|working)\b/i, weight: 0.3 },
  { pattern: /\b(yes|yeah|yep|yup)\b/i, weight: 0.3 },
  { pattern: /\bok\b/i, weight: 0.2 },
  { pattern: /\b(got it|understood)\b/i, weight: 0.2 },
  
  // Emoji positive
  { pattern: /[👍👏🙏💪🎉✅✓☑️💯🔥❤️😊😄🤩👌]/u, weight: 0.8 },
  { pattern: /:\)|:\-\)|:D|:P/i, weight: 0.5 },
]

// Negative indicators with weights
const NEGATIVE_PATTERNS = [
  // Strong negative
  { pattern: /\b(wrong|incorrect|error|mistake|fail(ed)?|broken)\b/i, weight: 0.9 },
  { pattern: /\b(doesn'?t|didn'?t|won'?t|can'?t) (work|run|compile|load)\b/i, weight: 1.0 },
  { pattern: /\bthat'?s? not (right|correct|what i)\b/i, weight: 1.0 },
  { pattern: /\btry again\b/i, weight: 0.8 },
  
  // Moderate negative
  { pattern: /\bno\b/i, weight: 0.4 },
  { pattern: /\bnot (quite|exactly|really)\b/i, weight: 0.6 },
  { pattern: /\bstill (not|doesn'?t|broken)\b/i, weight: 0.9 },
  { pattern: /\b(ugh|argh|hmm)\b/i, weight: 0.5 },
  { pattern: /\bwhy (is|does|didn'?t)\b/i, weight: 0.3 },
  
  // Frustration signals
  { pattern: /\?{2,}/i, weight: 0.4 }, // Multiple question marks
  { pattern: /!{2,}/i, weight: 0.3 }, // Multiple exclamation marks
  { pattern: /\b(again|already told you|i said)\b/i, weight: 0.7 },
  
  // Emoji negative
  { pattern: /[👎😞😤😡🙄❌✗✘]/u, weight: 0.8 },
  { pattern: /:\(|:\-\(|:\/|:\-\//i, weight: 0.5 },
]

/**
 * Analyze sentiment of a single message
 * @param {string} text - User message
 * @returns {Object} Sentiment analysis result
 */
export function analyzeMessage(text) {
  if (!text || typeof text !== 'string') {
    return { sentiment: SENTIMENT.NEUTRAL, score: 0, confidence: 0, signals: [] }
  }

  const signals = []
  let positiveScore = 0
  let negativeScore = 0

  // Check positive patterns
  for (const { pattern, weight } of POSITIVE_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      positiveScore += weight
      signals.push({
        type: SENTIMENT.POSITIVE,
        match: match[0],
        weight
      })
    }
  }

  // Check negative patterns
  for (const { pattern, weight } of NEGATIVE_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      negativeScore += weight
      signals.push({
        type: SENTIMENT.NEGATIVE,
        match: match[0],
        weight
      })
    }
  }

  // Calculate net sentiment
  const netScore = positiveScore - negativeScore
  const totalSignals = positiveScore + negativeScore
  const confidence = Math.min(1, totalSignals / 2) // More signals = higher confidence

  let sentiment
  if (Math.abs(netScore) < 0.3) {
    sentiment = SENTIMENT.NEUTRAL
  } else if (netScore > 0) {
    sentiment = SENTIMENT.POSITIVE
  } else {
    sentiment = SENTIMENT.NEGATIVE
  }

  return {
    sentiment,
    score: Math.round(netScore * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    positiveScore: Math.round(positiveScore * 100) / 100,
    negativeScore: Math.round(negativeScore * 100) / 100,
    signals
  }
}

/**
 * Analyze sentiment across multiple messages
 * @param {Array} messages - Array of user messages (strings or objects with text)
 * @returns {Object} Aggregated sentiment analysis
 */
export function analyzeConversation(messages) {
  if (!messages || messages.length === 0) {
    return {
      overall: SENTIMENT.NEUTRAL,
      averageScore: 0,
      trend: 'stable',
      distribution: { positive: 0, negative: 0, neutral: 0 },
      totalMessages: 0,
      recentSentiment: null,
      details: []
    }
  }

  const analyses = messages.map(msg => {
    const text = typeof msg === 'string' ? msg : (msg.text || msg.content || '')
    return {
      ...analyzeMessage(text),
      timestamp: msg.timestamp
    }
  })

  // Count distribution
  const distribution = {
    positive: analyses.filter(a => a.sentiment === SENTIMENT.POSITIVE).length,
    negative: analyses.filter(a => a.sentiment === SENTIMENT.NEGATIVE).length,
    neutral: analyses.filter(a => a.sentiment === SENTIMENT.NEUTRAL).length
  }

  // Calculate average score
  const totalScore = analyses.reduce((sum, a) => sum + a.score, 0)
  const averageScore = totalScore / analyses.length

  // Determine overall sentiment
  let overall
  if (distribution.positive > distribution.negative * 1.5) {
    overall = SENTIMENT.POSITIVE
  } else if (distribution.negative > distribution.positive * 1.5) {
    overall = SENTIMENT.NEGATIVE
  } else {
    overall = SENTIMENT.NEUTRAL
  }

  // Calculate trend (comparing first half to second half)
  const trend = calculateTrend(analyses)

  // Get recent sentiment (last 5 messages)
  const recent = analyses.slice(-5)
  const recentScore = recent.reduce((sum, a) => sum + a.score, 0) / recent.length

  return {
    overall,
    averageScore: Math.round(averageScore * 100) / 100,
    trend,
    distribution,
    totalMessages: messages.length,
    recentSentiment: recentScore > 0.3 ? SENTIMENT.POSITIVE : 
                      recentScore < -0.3 ? SENTIMENT.NEGATIVE : SENTIMENT.NEUTRAL,
    recentScore: Math.round(recentScore * 100) / 100,
    satisfactionRate: Math.round((distribution.positive / messages.length) * 100),
    frustrationRate: Math.round((distribution.negative / messages.length) * 100),
    details: analyses.slice(-20) // Last 20 for details
  }
}

/**
 * Calculate sentiment trend over time
 * @param {Array} analyses - Array of sentiment analyses
 * @returns {string} Trend direction
 */
function calculateTrend(analyses) {
  if (analyses.length < 4) return 'insufficient_data'

  const midpoint = Math.floor(analyses.length / 2)
  const firstHalf = analyses.slice(0, midpoint)
  const secondHalf = analyses.slice(midpoint)

  const firstAvg = firstHalf.reduce((sum, a) => sum + a.score, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, a) => sum + a.score, 0) / secondHalf.length

  const diff = secondAvg - firstAvg

  if (diff > 0.3) return 'improving'
  if (diff < -0.3) return 'declining'
  return 'stable'
}

/**
 * Get feedback quality score (0-100)
 * Higher = better user experience
 * @param {Object} analysis - Conversation analysis result
 * @returns {number} Quality score
 */
export function calculateFeedbackScore(analysis) {
  if (!analysis || analysis.totalMessages === 0) return 50 // Neutral default

  // Base score from satisfaction rate
  let score = analysis.satisfactionRate

  // Adjust for trend
  if (analysis.trend === 'improving') score += 10
  if (analysis.trend === 'declining') score -= 10

  // Adjust for recent sentiment
  if (analysis.recentSentiment === SENTIMENT.POSITIVE) score += 5
  if (analysis.recentSentiment === SENTIMENT.NEGATIVE) score -= 5

  // Penalize high frustration
  if (analysis.frustrationRate > 30) score -= 15

  return Math.max(0, Math.min(100, Math.round(score)))
}
