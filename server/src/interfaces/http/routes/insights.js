/**
 * Insights API Routes
 * Self-correction tracking and user sentiment analysis
 */
import { Router } from 'express'
import { calculateCorrectionScore, detectVerbalCorrections } from '../../../domain/services/SelfCorrectionTracker.js'
import { analyzeConversation, calculateFeedbackScore } from '../../../domain/services/SentimentAnalyzer.js'

const router = Router()

/**
 * GET /api/insights/corrections
 * Self-correction analysis
 */
router.get('/corrections', async (req, res) => {
  try {
    const { getSessionData } = req.app.locals
    const data = await getSessionData()
    
    const correctionData = {
      messages: data.messages || [],
      toolCalls: data.toolCalls || [],
      assistantTexts: data.assistantTexts || []
    }
    
    const analysis = calculateCorrectionScore(correctionData)
    
    res.json({
      score: analysis.score,
      interpretation: analysis.interpretation,
      totalCorrections: analysis.totalCorrections,
      byType: analysis.byType,
      recentCorrections: analysis.corrections.slice(0, 10),
      recommendation: getRecommendation(analysis)
    })
  } catch (err) {
    console.error('Corrections API error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/insights/sentiment
 * User sentiment analysis
 */
router.get('/sentiment', async (req, res) => {
  try {
    const { getUserMessages } = req.app.locals
    const messages = await getUserMessages()
    
    const analysis = analyzeConversation(messages)
    const feedbackScore = calculateFeedbackScore(analysis)
    
    res.json({
      overall: analysis.overall,
      feedbackScore,
      trend: analysis.trend,
      satisfactionRate: analysis.satisfactionRate,
      frustrationRate: analysis.frustrationRate,
      recentSentiment: analysis.recentSentiment,
      distribution: analysis.distribution,
      totalMessages: analysis.totalMessages,
      recentDetails: analysis.details.slice(-10),
      recommendation: getSentimentRecommendation(analysis, feedbackScore)
    })
  } catch (err) {
    console.error('Sentiment API error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/insights/summary
 * Combined insights summary
 */
router.get('/summary', async (req, res) => {
  try {
    const { getSessionData, getUserMessages } = req.app.locals
    
    const [sessionData, userMessages] = await Promise.all([
      getSessionData(),
      getUserMessages()
    ])
    
    const corrections = calculateCorrectionScore({
      messages: sessionData.messages || [],
      toolCalls: sessionData.toolCalls || [],
      assistantTexts: sessionData.assistantTexts || []
    })
    
    const sentiment = analyzeConversation(userMessages)
    const feedbackScore = calculateFeedbackScore(sentiment)
    
    // Calculate overall health score
    const correctionPenalty = Math.min(30, corrections.score * 0.3)
    const sentimentBonus = (feedbackScore - 50) * 0.4
    const healthScore = Math.max(0, Math.min(100, 70 - correctionPenalty + sentimentBonus))
    
    res.json({
      healthScore: Math.round(healthScore),
      corrections: {
        score: corrections.score,
        interpretation: corrections.interpretation,
        total: corrections.totalCorrections
      },
      sentiment: {
        overall: sentiment.overall,
        feedbackScore,
        trend: sentiment.trend,
        satisfactionRate: sentiment.satisfactionRate
      },
      status: getHealthStatus(healthScore)
    })
  } catch (err) {
    console.error('Insights summary error:', err)
    res.status(500).json({ error: err.message })
  }
})

function getRecommendation(analysis) {
  if (analysis.score === 0) return 'Excellent! No corrections needed.'
  if (analysis.score < 20) return 'Great performance with minimal corrections.'
  if (analysis.byType.toolRetry > 3) return 'Consider validating tool arguments before execution.'
  if (analysis.byType.fileReedit > 2) return 'Plan file changes more thoroughly before writing.'
  if (analysis.byType.verbal > 5) return 'Take more time to think before responding.'
  return 'Review recent corrections to identify patterns.'
}

function getSentimentRecommendation(analysis, score) {
  if (score >= 80) return 'User is very satisfied! Keep up the great work.'
  if (score >= 60) return 'Good user experience. Look for opportunities to delight.'
  if (analysis.trend === 'declining') return 'Sentiment is declining. Focus on accuracy and clarity.'
  if (analysis.frustrationRate > 30) return 'High frustration detected. Ask clarifying questions.'
  if (score < 40) return 'User may be struggling. Offer more guidance and options.'
  return 'Monitor for patterns in negative feedback.'
}

function getHealthStatus(score) {
  if (score >= 80) return { label: 'Excellent', color: 'green', emoji: '🌟' }
  if (score >= 60) return { label: 'Good', color: 'blue', emoji: '👍' }
  if (score >= 40) return { label: 'Fair', color: 'yellow', emoji: '📊' }
  if (score >= 20) return { label: 'Needs Work', color: 'orange', emoji: '⚠️' }
  return { label: 'Critical', color: 'red', emoji: '🚨' }
}

export default router
