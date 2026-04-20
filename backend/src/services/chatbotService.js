const mlClient = require('./mlClient');
const Scheme = require('../models/Scheme');
const ChatHistory = require('../models/ChatHistory');
const { logger } = require('../utils/logger');
const fs = require('fs');
const path = require('path');

class ChatbotService {
  constructor() {
    this.trainingData = this.loadTrainingData();
  }

  loadTrainingData() {
    try {
      const trainingPath = path.join(__dirname, '../../..', 'data', 'training_data.json');
      if (fs.existsSync(trainingPath)) {
        const data = fs.readFileSync(trainingPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      logger.warn('Could not load training data:', error.message);
    }
    return { intents: [], scheme_mappings: {}, contextual_responses: {} };
  }

  async processUserQuery(userId, query, sessionId = null) {
    try {
      // Detect intent and check if clarification needed
      const intent = this.detectIntent(query);
      const clarificationNeeded = this.checkClarificationNeeded(query, intent);

      // Try ML service first
      let recommendations = await mlClient.search(query, 5, 0.3);
      
      // If ML service fails, use fallback
      let usedFallback = false;
      if (!recommendations) {
        usedFallback = true;
        recommendations = await this.fallbackSearch(query);
      }

      // Generate contextual response
      let responseText;
      if (clarificationNeeded.needed) {
        responseText = this.generateClarificationResponse(query, clarificationNeeded.type, recommendations);
      } else {
        responseText = this.generateResponse(query, recommendations, usedFallback, intent);
      }
      
      // Prepare response
      const response = {
        message: responseText,
        schemes: recommendations.map(scheme => ({
          id: scheme.slug || scheme._id,
          name: scheme.scheme_name || scheme.schemeName,
          description: scheme.description,
          category: scheme.category || scheme.categories?.[0],
          level: scheme.level,
          matchScore: scheme.similarity_score || 0.5
        })),
        usedFallback: usedFallback,
        intent: intent,
        clarificationAsked: clarificationNeeded.needed,
        confidence: recommendations.length > 0 ? (recommendations[0].similarity_score || 0.5) : 0.5
      };
      
      // Save conversation
      await this.saveConversation(userId, sessionId, query, response);
      
      return response;
    } catch (error) {
      logger.error('Chatbot processing error:', error);
      return {
        message: "I'm having trouble processing your query. Please try again or rephrase your question.",
        schemes: [],
        intent: 'error',
        confidence: 0
      };
    }
  }

  checkClarificationNeeded(query, intent) {
    const lowerQuery = query.toLowerCase();
    
    // Check for eligibility without providing category/income
    if (intent === 'eligibility' && !this.hasEligibilityDetails(query)) {
      return { needed: true, type: 'eligibility_details' };
    }
    
    // Check for income-related queries without context
    if ((lowerQuery.includes('income') || lowerQuery.includes('how much')) && 
        !this.hasIncomeContext(query)) {
      return { needed: true, type: 'income_context' };
    }

    // Check for general scheme queries without category
    if (intent === 'general' && this.isGeneralSchemeQuery(query) && 
        !this.hasUserCategory(query)) {
      return { needed: true, type: 'user_category' };
    }

    return { needed: false, type: null };
  }

  hasEligibilityDetails(query) {
    const keywords = ['farmer', 'student', 'women', 'sc/st', 'senior', 'disabled', 
                     'business', 'entrepreneur', 'mother', 'girl', 'poor', 'bpl'];
    return keywords.some(kw => query.toLowerCase().includes(kw));
  }

  hasIncomeContext(query) {
    const incomePatterns = ['₹', 'rs', 'rupees', 'lakh', 'thousand', 'income', 'earn'];
    return incomePatterns.some(pattern => query.toLowerCase().includes(pattern));
  }

  hasUserCategory(query) {
    const categories = ['general', 'obc', 'sc', 'st', 'bpl', 'apl', 'ebc'];
    return categories.some(cat => query.toLowerCase().includes(cat));
  }

  isGeneralSchemeQuery(query) {
    const schemeKeywords = ['scheme', 'yojana', 'help', 'benefit', 'financial', 'support', 'assistance'];
    return schemeKeywords.some(kw => query.toLowerCase().includes(kw));
  }

  generateClarificationResponse(query, clarificationType, schemes) {
    const responses = {
      eligibility_details: 
        "To help you find suitable schemes, could you tell me: What's your main occupation or status? (e.g., farmer, student, homemaker, business owner, senior citizen, etc.)",
      
      income_context: 
        "To check income-related benefits, it helps to know your approximate family income. Is it: Below ₹1 lakh/year, ₹1-3 lakh/year, ₹3-5 lakh/year, or above ₹5 lakh/year?",
      
      user_category: 
        "Different schemes have different eligibility based on social category. What's your social category? (General, OBC, SC, ST, or prefer not to say)"
    };

    let response = responses[clarificationType] || "Could you provide more details about what you're looking for?";

    // Add suggestion if schemes found
    if (schemes && schemes.length > 0) {
      response += `\n\nMeanwhile, here are some general schemes that might interest you:\n`;
      schemes.slice(0, 2).forEach((s, i) => {
        response += `${i + 1}. **${s.scheme_name || s.schemeName}**\n`;
      });
    }

    return response;
  }

  generateResponse(query, recommendations, usedFallback, intent) {
    if (recommendations.length === 0) {
      const contextualMsg = this.trainingData.contextual_responses?.if_no_scheme_found || 
        "I couldn't find specific schemes matching your query. Could you provide more details?";
      return contextualMsg;
    }
    
    const topScheme = recommendations[0];
    const schemeList = recommendations.slice(0, 3).map((s, i) => 
      `${i + 1}. **${s.scheme_name || s.schemeName}** - ${(s.similarity_score || 0.5 * 100).toFixed(0)}% match`
    ).join('\n');
    
    let response = `Based on your query, here are the most relevant schemes:\n\n${schemeList}\n\n`;
    
    // Add follow-up suggestions based on intent
    if (intent === 'eligibility') {
      response += "💡 Would you like to know eligibility criteria for any of these schemes?\n";
    } else if (intent === 'benefits') {
      response += "💡 Want to know the exact benefit amounts or details?\n";
    } else if (intent === 'application') {
      response += "💡 Need help with the application process or required documents?\n";
    } else if (intent === 'documents') {
      response += "💡 Would you like a detailed list of documents needed?\n";
    }
    
    if (usedFallback) {
      response += "\n⚠️ *Note: Using basic search. Results will improve when ML service is fully loaded.*";
    }
    
    return response;
  }

  detectIntent(query) {
    const lowerQuery = query.toLowerCase();
    const intents = this.trainingData.intents || [];
    
    // Try to match against training data patterns
    for (const intent of intents) {
      if (intent.patterns && Array.isArray(intent.patterns)) {
        for (const pattern of intent.patterns) {
          if (lowerQuery.includes(pattern.toLowerCase().split(' ')[0])) {
            return intent.tag;
          }
        }
      }
    }
    
    // Fallback intent detection
    if (lowerQuery.includes('eligib') || lowerQuery.includes('who can') || lowerQuery.includes('qualify')) {
      return 'eligibility_check';
    }
    if (lowerQuery.includes('benefit') || lowerQuery.includes('get') || lowerQuery.includes('amount')) {
      return 'benefits_amount';
    }
    if (lowerQuery.includes('apply') || lowerQuery.includes('process') || lowerQuery.includes('how to')) {
      return 'application_process';
    }
    if (lowerQuery.includes('document') || lowerQuery.includes('need') || lowerQuery.includes('certificate')) {
      return 'documents_required';
    }
    if (lowerQuery.includes('income') || lowerQuery.includes('calculation')) {
      return 'clarify_income';
    }
    
    return 'general';
  }

  async fallbackSearch(query) {
    // Simple MongoDB text search
    const schemes = await Scheme.find({
      $or: [
        { schemeName: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
        { categories: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).limit(5).lean();
    
    return schemes.map(s => ({
      scheme_name: s.schemeName,
      slug: s.slug,
      description: s.description.substring(0, 500),
      benefits: s.benefits,
      eligibility: s.eligibility,
      category: s.categories?.[0],
      level: s.level,
      similarity_score: 0.5
    }));
  }

  async saveConversation(userId, sessionId, userQuery, botResponse) {
    try {
      let chatSession;
      
      if (sessionId) {
        chatSession = await ChatHistory.findOne({ sessionId, userId });
      }
      
      if (!chatSession) {
        chatSession = new ChatHistory({
          userId,
          sessionId: sessionId || this.generateSessionId(),
          messages: [],
        });
      }
      
      chatSession.messages.push({
        role: 'user',
        content: userQuery,
        timestamp: new Date(),
      });
      
      chatSession.messages.push({
        role: 'bot',
        content: botResponse.message,
        timestamp: new Date(),
        intent: botResponse.intent,
        confidence: botResponse.confidence,
        relevantSchemes: botResponse.schemes.map(s => ({
          schemeId: s.id,
          relevanceScore: s.matchScore,
        })),
      });
      
      chatSession.status = 'active';
      await chatSession.save();
      
      return chatSession;
    } catch (error) {
      logger.error('Save conversation error:', error);
      return null;
    }
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = ChatbotService;