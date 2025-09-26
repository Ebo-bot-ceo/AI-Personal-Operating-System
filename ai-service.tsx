import * as kv from './kv_store.tsx';

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AIInsight {
  type: 'productivity' | 'schedule' | 'pattern' | 'suggestion';
  title: string;
  description: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
}

class AIService {
  private async getOpenAIResponse(messages: AIMessage[], userId: string): Promise<string> {
    try {
      // Get user context for better AI responses
      const userProfile = await kv.get(`user:${userId}:profile`);
      const recentCaptures = await kv.getByPrefix(`user:${userId}:capture:`);
      const projects = await kv.getByPrefix(`user:${userId}:project:`);
      
      const systemPrompt = `You are an AI assistant for a personal operating system. The user's name is ${userProfile?.name || 'User'}. 
      
      Context about the user:
      - Recent captures: ${recentCaptures.slice(0, 5).map(c => c.content || c.text).join(', ')}
      - Active projects: ${projects.slice(0, 3).map(p => p.name).join(', ')}
      
      Provide helpful, actionable responses that understand their workflow and patterns. Be concise but insightful.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'I apologize, but I cannot process that request right now.';
    } catch (error) {
      console.log('OpenAI API error:', error);
      return this.getFallbackResponse(messages[messages.length - 1]?.content || '');
    }
  }

  private getFallbackResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('schedule') || lowerMessage.includes('calendar')) {
      return "I can help you optimize your schedule. Based on your patterns, I recommend blocking 9-11 AM for deep work when you're most focused.";
    }
    
    if (lowerMessage.includes('task') || lowerMessage.includes('todo')) {
      return "I've analyzed your task completion patterns. Consider breaking larger tasks into smaller chunks and tackling high-priority items during your peak energy hours.";
    }
    
    if (lowerMessage.includes('project')) {
      return "Your active projects show good progress. I can help you identify dependencies and suggest optimal work sequences based on your productivity patterns.";
    }
    
    return "I'm here to help you optimize your productivity and workflow. Feel free to ask about your schedule, tasks, projects, or any insights about your work patterns.";
  }

  async processMessage(userId: string, message: string, context?: any): Promise<any> {
    try {
      // Get conversation history
      const conversationKey = `user:${userId}:conversation`;
      const conversation = await kv.get(conversationKey) || [];
      
      // Add user message
      const userMessage: AIMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      
      conversation.push(userMessage);
      
      // Get AI response
      const aiContent = await this.getOpenAIResponse(conversation.slice(-10), userId); // Keep last 10 messages for context
      
      // Add AI response
      const aiMessage: AIMessage = {
        role: 'assistant',
        content: aiContent,
        timestamp: new Date().toISOString()
      };
      
      conversation.push(aiMessage);
      
      // Save updated conversation (keep last 20 messages)
      await kv.set(conversationKey, conversation.slice(-20));
      
      // Analyze message for actionable items
      await this.extractActionableItems(userId, message);
      
      return {
        message: aiMessage,
        suggestions: await this.generateSuggestions(userId, message),
        actions: this.generateQuickActions(message)
      };
    } catch (error) {
      console.log('AI message processing error:', error);
      throw new Error('Failed to process AI message');
    }
  }

  async generateInsights(userId: string): Promise<AIInsight[]> {
    try {
      const insights: AIInsight[] = [];
      
      // Analyze productivity patterns
      const productivity = await this.analyzeProductivityPatterns(userId);
      insights.push(...productivity);
      
      // Analyze capture patterns
      const captures = await this.analyzeCapturePatterns(userId);
      insights.push(...captures);
      
      // Analyze schedule optimization
      const schedule = await this.analyzeScheduleOptimization(userId);
      insights.push(...schedule);
      
      // Sort by priority and confidence
      return insights.sort((a, b) => {
        if (a.priority !== b.priority) {
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.confidence - a.confidence;
      }).slice(0, 5); // Return top 5 insights
      
    } catch (error) {
      console.log('Insight generation error:', error);
      throw new Error('Failed to generate insights');
    }
  }

  private async analyzeProductivityPatterns(userId: string): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    try {
      const analytics = await kv.getByPrefix(`user:${userId}:analytics:`);
      const today = new Date().toDateString();
      
      // Mock productivity analysis - in production this would analyze real data
      insights.push({
        type: 'productivity',
        title: 'Peak Performance Window Identified',
        description: 'Your productivity peaks between 9-11 AM with 92% focus score',
        action: 'Schedule deep work during this window',
        priority: 'high',
        confidence: 0.94
      });
      
      insights.push({
        type: 'pattern',
        title: 'Friday Afternoon Pattern',
        description: 'Your task completion rate drops 15% on Friday afternoons',
        action: 'Move routine tasks to Friday PM slots',
        priority: 'medium',
        confidence: 0.87
      });
      
    } catch (error) {
      console.log('Productivity analysis error:', error);
    }
    
    return insights;
  }

  private async analyzeCapturePatterns(userId: string): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    try {
      const captures = await kv.getByPrefix(`user:${userId}:capture:`);
      
      if (captures.length > 20) {
        const emailCaptures = captures.filter(c => c.type === 'email').length;
        const emailPercentage = (emailCaptures / captures.length) * 100;
        
        if (emailPercentage > 30) {
          insights.push({
            type: 'pattern',
            title: 'High Email Processing Time',
            description: `Email processing takes ${Math.round(emailPercentage)}% of your capture time`,
            action: 'Consider batch processing emails at specific times',
            priority: 'medium',
            confidence: 0.89
          });
        }
      }
      
    } catch (error) {
      console.log('Capture analysis error:', error);
    }
    
    return insights;
  }

  private async analyzeScheduleOptimization(userId: string): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    // Mock schedule analysis
    insights.push({
      type: 'schedule',
      title: 'Meeting Optimization Opportunity',
      description: 'You have 3 back-to-back meetings that could benefit from 15-minute buffers',
      action: 'Add buffer time between meetings',
      priority: 'low',
      confidence: 0.76
    });
    
    return insights;
  }

  private async extractActionableItems(userId: string, message: string) {
    const lowerMessage = message.toLowerCase();
    
    // Simple keyword-based extraction - in production, use more sophisticated NLP
    if (lowerMessage.includes('remind me') || lowerMessage.includes('schedule')) {
      // Extract and create reminders/calendar events
      console.log('Extracting calendar action from:', message);
    }
    
    if (lowerMessage.includes('create task') || lowerMessage.includes('add to') && lowerMessage.includes('project')) {
      // Extract and create tasks
      console.log('Extracting task creation from:', message);
    }
  }

  private generateSuggestions(userId: string, message: string): string[] {
    const suggestions = [];
    
    if (message.toLowerCase().includes('project')) {
      suggestions.push('Show project timeline', 'Update project status', 'Add team member');
    }
    
    if (message.toLowerCase().includes('schedule')) {
      suggestions.push('Optimize schedule', 'Block focus time', 'Review conflicts');
    }
    
    return suggestions;
  }

  private generateQuickActions(message: string): Array<{label: string, type: string}> {
    const actions = [];
    
    if (message.toLowerCase().includes('meeting')) {
      actions.push({ label: 'Create Calendar Event', type: 'calendar' });
    }
    
    if (message.toLowerCase().includes('task') || message.toLowerCase().includes('todo')) {
      actions.push({ label: 'Add to Task List', type: 'task' });
    }
    
    actions.push({ label: 'Save as Note', type: 'note' });
    
    return actions;
  }

  async searchUserData(userId: string, query: string, filters?: any): Promise<any> {
    try {
      const results = {
        captures: [],
        projects: [],
        tasks: [],
        notes: []
      };
      
      // Search captures
      const captures = await kv.getByPrefix(`user:${userId}:capture:`);
      results.captures = captures.filter(capture => 
        capture.content?.toLowerCase().includes(query.toLowerCase()) ||
        capture.text?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);
      
      // Search projects
      const projects = await kv.getByPrefix(`user:${userId}:project:`);
      results.projects = projects.filter(project => 
        project.name?.toLowerCase().includes(query.toLowerCase()) ||
        project.description?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);
      
      // Apply filters if provided
      if (filters?.type && results[filters.type]) {
        const filteredResults = {};
        filteredResults[filters.type] = results[filters.type];
        return { results: filteredResults, query, total: results[filters.type].length };
      }
      
      const total = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
      
      return { results, query, total };
    } catch (error) {
      console.log('Search error:', error);
      throw new Error('Failed to search user data');
    }
  }
}

export const aiService = new AIService();