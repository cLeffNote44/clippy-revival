/**
 * Advanced AI Features
 *
 * Provides advanced AI capabilities including context memory,
 * conversation history, personas, and intelligent summarization.
 *
 * @module utils/ai-advanced
 */

/**
 * Conversation Message
 */
export class ConversationMessage {
  constructor(role, content, metadata = {}) {
    this.id = metadata.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.role = role; // 'user' or 'assistant'
    this.content = content;
    this.timestamp = metadata.timestamp || Date.now();
    this.tokens = metadata.tokens || null;
    this.metadata = metadata;
  }

  toJSON() {
    return {
      id: this.id,
      role: this.role,
      content: this.content,
      timestamp: this.timestamp,
      tokens: this.tokens,
      metadata: this.metadata,
    };
  }

  static fromJSON(json) {
    return new ConversationMessage(json.role, json.content, {
      id: json.id,
      timestamp: json.timestamp,
      tokens: json.tokens,
      ...json.metadata,
    });
  }
}

/**
 * Context Memory Manager
 *
 * Manages conversation context and memory with intelligent summarization
 */
export class ContextMemoryManager {
  constructor(options = {}) {
    this.maxMessages = options.maxMessages || 50;
    this.maxTokens = options.maxTokens || 4000;
    this.summaryThreshold = options.summaryThreshold || 20;
    this.retentionDays = options.retentionDays || 30;

    this.conversations = new Map();
    this.summaries = new Map();
    this.importance = new Map();
  }

  /**
   * Create new conversation
   */
  createConversation(conversationId, metadata = {}) {
    if (this.conversations.has(conversationId)) {
      throw new Error(`Conversation '${conversationId}' already exists`);
    }

    this.conversations.set(conversationId, {
      id: conversationId,
      messages: [],
      metadata: {
        ...metadata,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    });

    return conversationId;
  }

  /**
   * Add message to conversation
   */
  addMessage(conversationId, role, content, metadata = {}) {
    let conversation = this.conversations.get(conversationId);

    if (!conversation) {
      conversation = {
        id: conversationId,
        messages: [],
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      };
      this.conversations.set(conversationId, conversation);
    }

    const message = new ConversationMessage(role, content, metadata);
    conversation.messages.push(message);
    conversation.metadata.updatedAt = Date.now();

    // Auto-summarize if threshold reached
    if (conversation.messages.length >= this.summaryThreshold) {
      this.summarizeConversation(conversationId);
    }

    // Trim old messages if limit exceeded
    if (conversation.messages.length > this.maxMessages) {
      this.trimMessages(conversationId);
    }

    return message;
  }

  /**
   * Get conversation messages
   */
  getMessages(conversationId, limit = null) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return [];

    const messages = conversation.messages;
    return limit ? messages.slice(-limit) : messages;
  }

  /**
   * Get conversation context for AI
   */
  getContext(conversationId, options = {}) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return { messages: [], summary: null };

    const { includeSystem = true, maxMessages = 10 } = options;

    // Get recent messages
    const recentMessages = conversation.messages.slice(-maxMessages);

    // Get summary if exists
    const summary = this.summaries.get(conversationId);

    // Build context
    const context = {
      messages: recentMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      summary: summary || null,
      messageCount: conversation.messages.length,
      metadata: conversation.metadata,
    };

    return context;
  }

  /**
   * Summarize conversation
   */
  async summarizeConversation(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;

    // In a real implementation, this would call an AI model to generate summary
    // For now, we'll create a simple summary
    const messagesToSummarize = conversation.messages.slice(0, -10); // Keep recent messages

    if (messagesToSummarize.length === 0) return null;

    const summary = {
      id: conversationId,
      text: `Summary of ${messagesToSummarize.length} messages`,
      messageCount: messagesToSummarize.length,
      firstMessage: messagesToSummarize[0].timestamp,
      lastMessage: messagesToSummarize[messagesToSummarize.length - 1].timestamp,
      topics: this.extractTopics(messagesToSummarize),
      createdAt: Date.now(),
    };

    this.summaries.set(conversationId, summary);

    // Remove summarized messages
    conversation.messages = conversation.messages.slice(-10);

    return summary;
  }

  /**
   * Extract topics from messages
   */
  extractTopics(messages) {
    // Simple keyword extraction - in production would use NLP
    const topics = new Set();
    const keywords = [];

    messages.forEach((message) => {
      const words = message.content.toLowerCase().split(/\s+/);
      words.forEach((word) => {
        if (word.length > 5 && !this.isCommonWord(word)) {
          keywords.push(word);
        }
      });
    });

    // Count frequency
    const frequency = {};
    keywords.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Get top keywords
    const sorted = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    sorted.forEach(([word]) => topics.add(word));

    return Array.from(topics);
  }

  /**
   * Check if word is common (stop word)
   */
  isCommonWord(word) {
    const commonWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    ]);
    return commonWords.has(word);
  }

  /**
   * Trim old messages
   */
  trimMessages(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return;

    // Keep only recent messages
    conversation.messages = conversation.messages.slice(-this.maxMessages);
  }

  /**
   * Mark message as important
   */
  markImportant(conversationId, messageId, importance = 5) {
    const key = `${conversationId}:${messageId}`;
    this.importance.set(key, importance);
  }

  /**
   * Get important messages
   */
  getImportantMessages(conversationId, minImportance = 3) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return [];

    return conversation.messages.filter((message) => {
      const key = `${conversationId}:${message.id}`;
      const importance = this.importance.get(key) || 0;
      return importance >= minImportance;
    });
  }

  /**
   * Search conversations
   */
  search(query, options = {}) {
    const { conversationId = null, limit = 10 } = options;
    const results = [];

    const conversationsToSearch = conversationId
      ? [this.conversations.get(conversationId)].filter(Boolean)
      : Array.from(this.conversations.values());

    conversationsToSearch.forEach((conversation) => {
      conversation.messages.forEach((message) => {
        if (message.content.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            conversationId: conversation.id,
            message,
            context: this.getMessageContext(conversation, message),
          });
        }
      });
    });

    // Sort by relevance (simple - just timestamp for now)
    results.sort((a, b) => b.message.timestamp - a.message.timestamp);

    return results.slice(0, limit);
  }

  /**
   * Get context around a message
   */
  getMessageContext(conversation, targetMessage, contextSize = 2) {
    const index = conversation.messages.findIndex((m) => m.id === targetMessage.id);
    if (index === -1) return [];

    const start = Math.max(0, index - contextSize);
    const end = Math.min(conversation.messages.length, index + contextSize + 1);

    return conversation.messages.slice(start, end);
  }

  /**
   * Clean old conversations
   */
  cleanOldConversations() {
    const cutoffDate = Date.now() - this.retentionDays * 24 * 60 * 60 * 1000;

    for (const [id, conversation] of this.conversations.entries()) {
      if (conversation.metadata.updatedAt < cutoffDate) {
        this.conversations.delete(id);
        this.summaries.delete(id);
      }
    }
  }

  /**
   * Export conversation
   */
  exportConversation(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;

    const summary = this.summaries.get(conversationId);

    return {
      id: conversation.id,
      metadata: conversation.metadata,
      messages: conversation.messages.map((m) => m.toJSON()),
      summary,
    };
  }

  /**
   * Import conversation
   */
  importConversation(data) {
    const conversation = {
      id: data.id,
      metadata: data.metadata,
      messages: data.messages.map((m) => ConversationMessage.fromJSON(m)),
    };

    this.conversations.set(data.id, conversation);

    if (data.summary) {
      this.summaries.set(data.id, data.summary);
    }

    return data.id;
  }

  /**
   * Get statistics
   */
  getStats() {
    let totalMessages = 0;
    let totalConversations = this.conversations.size;
    let oldestConversation = Infinity;
    let newestConversation = 0;

    for (const conversation of this.conversations.values()) {
      totalMessages += conversation.messages.length;
      oldestConversation = Math.min(oldestConversation, conversation.metadata.createdAt);
      newestConversation = Math.max(newestConversation, conversation.metadata.updatedAt);
    }

    return {
      totalConversations,
      totalMessages,
      totalSummaries: this.summaries.size,
      oldestConversation: oldestConversation === Infinity ? null : oldestConversation,
      newestConversation: newestConversation || null,
      avgMessagesPerConversation: totalConversations > 0 ? totalMessages / totalConversations : 0,
    };
  }
}

/**
 * AI Persona
 */
export class AIPersona {
  constructor(config) {
    this.id = config.id || `persona-${Date.now()}`;
    this.name = config.name || 'Assistant';
    this.description = config.description || '';
    this.avatar = config.avatar || null;
    this.systemPrompt = config.systemPrompt || '';
    this.personality = config.personality || {
      tone: 'helpful',
      formality: 'professional',
      enthusiasm: 'moderate',
    };
    this.knowledge = config.knowledge || [];
    this.capabilities = config.capabilities || [];
    this.constraints = config.constraints || [];
    this.examples = config.examples || [];
    this.temperature = config.temperature || 0.7;
    this.metadata = config.metadata || {};
  }

  /**
   * Generate system prompt
   */
  generateSystemPrompt() {
    let prompt = this.systemPrompt;

    // Add personality traits
    if (this.personality.tone) {
      prompt += `\nYour tone should be ${this.personality.tone}.`;
    }
    if (this.personality.formality) {
      prompt += `\nYour communication style should be ${this.personality.formality}.`;
    }

    // Add knowledge areas
    if (this.knowledge.length > 0) {
      prompt += `\nYou have expertise in: ${this.knowledge.join(', ')}.`;
    }

    // Add capabilities
    if (this.capabilities.length > 0) {
      prompt += `\nYou can: ${this.capabilities.join(', ')}.`;
    }

    // Add constraints
    if (this.constraints.length > 0) {
      prompt += `\nYou should: ${this.constraints.join(', ')}.`;
    }

    return prompt;
  }

  /**
   * Get AI configuration
   */
  getAIConfig() {
    return {
      systemPrompt: this.generateSystemPrompt(),
      temperature: this.temperature,
      persona: {
        name: this.name,
        avatar: this.avatar,
      },
    };
  }

  /**
   * Export persona
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      avatar: this.avatar,
      systemPrompt: this.systemPrompt,
      personality: this.personality,
      knowledge: this.knowledge,
      capabilities: this.capabilities,
      constraints: this.constraints,
      examples: this.examples,
      temperature: this.temperature,
      metadata: this.metadata,
    };
  }

  /**
   * Import persona
   */
  static fromJSON(json) {
    return new AIPersona(json);
  }
}

/**
 * Persona Manager
 */
export class PersonaManager {
  constructor() {
    this.personas = new Map();
    this.activePersona = null;

    // Register default personas
    this.registerDefaultPersonas();
  }

  /**
   * Register default personas
   */
  registerDefaultPersonas() {
    // General Assistant
    const generalAssistant = new AIPersona({
      id: 'general',
      name: 'General Assistant',
      description: 'A helpful, professional assistant for general tasks',
      systemPrompt: 'You are a helpful, professional assistant.',
      personality: {
        tone: 'helpful',
        formality: 'professional',
        enthusiasm: 'moderate',
      },
      capabilities: [
        'answer questions',
        'provide information',
        'help with tasks',
        'explain concepts',
      ],
    });
    this.registerPersona(generalAssistant);

    // Coding Assistant
    const codingAssistant = new AIPersona({
      id: 'coding',
      name: 'Coding Assistant',
      description: 'A technical assistant specialized in programming',
      systemPrompt: 'You are an expert programming assistant with deep knowledge of software development.',
      personality: {
        tone: 'technical',
        formality: 'professional',
        enthusiasm: 'moderate',
      },
      knowledge: [
        'JavaScript',
        'Python',
        'React',
        'Node.js',
        'software architecture',
        'debugging',
      ],
      capabilities: [
        'write code',
        'debug issues',
        'explain algorithms',
        'review code',
        'suggest improvements',
      ],
      temperature: 0.5,
    });
    this.registerPersona(codingAssistant);

    // Creative Writer
    const creativeWriter = new AIPersona({
      id: 'creative',
      name: 'Creative Writer',
      description: 'A creative assistant for writing and storytelling',
      systemPrompt: 'You are a creative writer with a gift for storytelling and imaginative expression.',
      personality: {
        tone: 'creative',
        formality: 'casual',
        enthusiasm: 'high',
      },
      knowledge: [
        'creative writing',
        'storytelling',
        'poetry',
        'narrative structure',
      ],
      capabilities: [
        'write stories',
        'generate ideas',
        'create characters',
        'edit prose',
      ],
      temperature: 0.9,
    });
    this.registerPersona(creativeWriter);

    // Friendly Companion
    const friendlyCompanion = new AIPersona({
      id: 'friendly',
      name: 'Friendly Companion',
      description: 'A warm, encouraging companion for conversation',
      systemPrompt: 'You are a warm, friendly companion who provides encouragement and support.',
      personality: {
        tone: 'warm',
        formality: 'casual',
        enthusiasm: 'high',
      },
      capabilities: [
        'provide emotional support',
        'have casual conversations',
        'offer encouragement',
        'share positivity',
      ],
      temperature: 0.8,
    });
    this.registerPersona(friendlyCompanion);
  }

  /**
   * Register a persona
   */
  registerPersona(persona) {
    if (!(persona instanceof AIPersona)) {
      throw new Error('Persona must be an instance of AIPersona class');
    }

    this.personas.set(persona.id, persona);
  }

  /**
   * Unregister a persona
   */
  unregisterPersona(personaId) {
    if (this.activePersona?.id === personaId) {
      throw new Error('Cannot unregister active persona');
    }

    this.personas.delete(personaId);
  }

  /**
   * Get persona by ID
   */
  getPersona(personaId) {
    return this.personas.get(personaId);
  }

  /**
   * Get all personas
   */
  getAllPersonas() {
    return Array.from(this.personas.values());
  }

  /**
   * Set active persona
   */
  setActivePersona(personaId) {
    const persona = this.personas.get(personaId);
    if (!persona) {
      throw new Error(`Persona '${personaId}' not found`);
    }

    this.activePersona = persona;
    localStorage.setItem('activePersona', personaId);
  }

  /**
   * Get active persona
   */
  getActivePersona() {
    return this.activePersona;
  }

  /**
   * Import persona
   */
  importPersona(personaData) {
    const persona = AIPersona.fromJSON(personaData);
    this.registerPersona(persona);
    return persona;
  }

  /**
   * Export persona
   */
  exportPersona(personaId) {
    const persona = this.personas.get(personaId);
    if (!persona) {
      throw new Error(`Persona '${personaId}' not found`);
    }

    return persona.toJSON();
  }

  /**
   * Load from storage
   */
  loadFromStorage() {
    const savedPersonaId = localStorage.getItem('activePersona');
    if (savedPersonaId && this.personas.has(savedPersonaId)) {
      this.setActivePersona(savedPersonaId);
    } else {
      this.setActivePersona('general');
    }
  }
}

// Singleton instances
export const contextMemory = new ContextMemoryManager();
export const personaManager = new PersonaManager();

export default {
  ConversationMessage,
  ContextMemoryManager,
  AIPersona,
  PersonaManager,
  contextMemory,
  personaManager,
};
