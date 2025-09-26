import * as kv from './kv_store.tsx';

interface CaptureData {
  type: 'email' | 'note' | 'task' | 'idea' | 'link' | 'file' | 'voice';
  content: string;
  source?: string;
  metadata?: any;
  priority?: 'high' | 'medium' | 'low';
}

interface ProcessedCapture {
  id: string;
  userId: string;
  type: string;
  content: string;
  processedContent: {
    summary: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
    suggestedActions: string[];
    extractedEntities: {
      people: string[];
      dates: string[];
      projects: string[];
      tasks: string[];
    };
  };
  timestamp: string;
  processed: boolean;
  tags: string[];
}

class CaptureService {
  async processCapture(userId: string, captureData: CaptureData): Promise<ProcessedCapture> {
    try {
      const captureId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Process the content with AI
      const processedContent = await this.processWithAI(captureData);
      
      const processedCapture: ProcessedCapture = {
        id: captureId,
        userId,
        type: captureData.type,
        content: captureData.content,
        processedContent,
        timestamp: new Date().toISOString(),
        processed: true,
        tags: this.generateTags(captureData.content, processedContent)
      };
      
      // Store the capture
      await kv.set(`user:${userId}:capture:${captureId}`, processedCapture);
      
      // Update user statistics
      await this.updateCaptureStats(userId, captureData.type);
      
      // Create follow-up actions if needed
      await this.createFollowUpActions(userId, processedCapture);
      
      return processedCapture;
    } catch (error) {
      console.log('Capture processing error:', error);
      throw new Error('Failed to process capture');
    }
  }

  private async processWithAI(captureData: CaptureData): Promise<ProcessedCapture['processedContent']> {
    try {
      // Use OpenAI for content analysis
      const analysis = await this.analyzeWithOpenAI(captureData.content);
      
      return {
        summary: analysis.summary || this.generateFallbackSummary(captureData.content),
        category: analysis.category || this.categorizeContent(captureData.content, captureData.type),
        priority: analysis.priority || this.determinePriority(captureData.content),
        suggestedActions: analysis.actions || this.generateSuggestedActions(captureData),
        extractedEntities: {
          people: analysis.people || this.extractPeople(captureData.content),
          dates: analysis.dates || this.extractDates(captureData.content),
          projects: analysis.projects || [],
          tasks: analysis.tasks || this.extractTasks(captureData.content)
        }
      };
    } catch (error) {
      console.log('AI processing error, using fallback:', error);
      return this.getFallbackProcessing(captureData);
    }
  }

  private async analyzeWithOpenAI(content: string): Promise<any> {
    try {
      const prompt = `Analyze this content and return a JSON object with the following structure:
      {
        "summary": "Brief summary in 1-2 sentences",
        "category": "email|meeting|task|idea|research|planning|communication",
        "priority": "high|medium|low",
        "actions": ["action1", "action2"],
        "people": ["name1", "name2"],
        "dates": ["date1", "date2"],
        "projects": ["project1"],
        "tasks": ["task1", "task2"]
      }
      
      Content: ${content}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 400,
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return JSON.parse(data.choices[0]?.message?.content || '{}');
      }
    } catch (error) {
      console.log('OpenAI analysis error:', error);
    }
    
    return {};
  }

  private getFallbackProcessing(captureData: CaptureData): ProcessedCapture['processedContent'] {
    return {
      summary: this.generateFallbackSummary(captureData.content),
      category: this.categorizeContent(captureData.content, captureData.type),
      priority: this.determinePriority(captureData.content),
      suggestedActions: this.generateSuggestedActions(captureData),
      extractedEntities: {
        people: this.extractPeople(captureData.content),
        dates: this.extractDates(captureData.content),
        projects: [],
        tasks: this.extractTasks(captureData.content)
      }
    };
  }

  private generateFallbackSummary(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return content.substring(0, 100) + '...';
    return sentences[0].trim() + (sentences.length > 1 ? '...' : '');
  }

  private categorizeContent(content: string, type: string): string {
    const lowerContent = content.toLowerCase();
    
    if (type === 'email') return 'communication';
    if (type === 'task') return 'task';
    if (type === 'idea') return 'idea';
    
    if (lowerContent.includes('meeting') || lowerContent.includes('call')) return 'meeting';
    if (lowerContent.includes('research') || lowerContent.includes('study')) return 'research';
    if (lowerContent.includes('plan') || lowerContent.includes('strategy')) return 'planning';
    
    return 'general';
  }

  private determinePriority(content: string): 'high' | 'medium' | 'low' {
    const lowerContent = content.toLowerCase();
    const urgentWords = ['urgent', 'asap', 'deadline', 'critical', 'important', 'priority'];
    const highPriorityWords = ['meeting', 'client', 'project', 'due'];
    
    if (urgentWords.some(word => lowerContent.includes(word))) return 'high';
    if (highPriorityWords.some(word => lowerContent.includes(word))) return 'medium';
    return 'low';
  }

  private generateSuggestedActions(captureData: CaptureData): string[] {
    const actions = [];
    const content = captureData.content.toLowerCase();
    
    if (captureData.type === 'email') {
      actions.push('Reply to email', 'Add to calendar', 'Create task');
    } else if (captureData.type === 'idea') {
      actions.push('Create project', 'Add to research list', 'Schedule brainstorm');
    } else if (captureData.type === 'task') {
      actions.push('Set deadline', 'Assign priority', 'Add to project');
    }
    
    if (content.includes('meeting')) actions.push('Schedule meeting');
    if (content.includes('research')) actions.push('Create research project');
    if (content.includes('follow up')) actions.push('Set reminder');
    
    return actions.slice(0, 3); // Return max 3 actions
  }

  private extractPeople(content: string): string[] {
    // Simple name extraction - in production use more sophisticated NLP
    const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    const matches = content.match(namePattern) || [];
    return [...new Set(matches)].slice(0, 5);
  }

  private extractDates(content: string): string[] {
    // Simple date extraction
    const datePatterns = [
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      /\b\d{1,2}-\d{1,2}-\d{4}\b/g,
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\b/gi,
      /\b(today|tomorrow|next week|next month)\b/gi
    ];
    
    const dates = [];
    for (const pattern of datePatterns) {
      const matches = content.match(pattern) || [];
      dates.push(...matches);
    }
    
    return [...new Set(dates)].slice(0, 3);
  }

  private extractTasks(content: string): string[] {
    const taskPattern = /(todo|task|need to|should|must|have to)[\s:]+([^.!?]+)/gi;
    const matches = content.match(taskPattern) || [];
    return matches.map(match => match.replace(/(todo|task|need to|should|must|have to)[\s:]+/gi, '').trim()).slice(0, 3);
  }

  private generateTags(content: string, processedContent: any): string[] {
    const tags = new Set<string>();
    
    // Add category as tag
    tags.add(processedContent.category);
    
    // Add priority as tag
    tags.add(processedContent.priority);
    
    // Add content-based tags
    const lowerContent = content.toLowerCase();
    const tagWords = ['work', 'personal', 'urgent', 'project', 'meeting', 'research', 'idea', 'follow-up'];
    
    for (const word of tagWords) {
      if (lowerContent.includes(word)) {
        tags.add(word);
      }
    }
    
    return Array.from(tags).slice(0, 5);
  }

  private async updateCaptureStats(userId: string, type: string) {
    try {
      const statsKey = `user:${userId}:stats:captures`;
      const stats = await kv.get(statsKey) || { total: 0, byType: {}, byDay: {} };
      
      stats.total += 1;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      
      const today = new Date().toDateString();
      stats.byDay[today] = (stats.byDay[today] || 0) + 1;
      
      await kv.set(statsKey, stats);
    } catch (error) {
      console.log('Stats update error:', error);
    }
  }

  private async createFollowUpActions(userId: string, capture: ProcessedCapture) {
    try {
      // Create calendar events for meetings
      if (capture.processedContent.category === 'meeting' && capture.processedContent.extractedEntities.dates.length > 0) {
        await this.createCalendarEvent(userId, capture);
      }
      
      // Create tasks for actionable items
      if (capture.processedContent.extractedEntities.tasks.length > 0) {
        await this.createTasksFromCapture(userId, capture);
      }
      
      // Add to relevant projects
      if (capture.processedContent.extractedEntities.projects.length > 0) {
        await this.linkToProjects(userId, capture);
      }
    } catch (error) {
      console.log('Follow-up actions error:', error);
    }
  }

  private async createCalendarEvent(userId: string, capture: ProcessedCapture) {
    // This would integrate with calendar services
    console.log('Creating calendar event for capture:', capture.id);
  }

  private async createTasksFromCapture(userId: string, capture: ProcessedCapture) {
    for (const task of capture.processedContent.extractedEntities.tasks) {
      const taskId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await kv.set(`user:${userId}:task:${taskId}`, {
        id: taskId,
        title: task,
        source: `capture:${capture.id}`,
        priority: capture.processedContent.priority,
        created: new Date().toISOString(),
        completed: false
      });
    }
  }

  private async linkToProjects(userId: string, capture: ProcessedCapture) {
    // Link capture to relevant projects
    console.log('Linking capture to projects:', capture.processedContent.extractedEntities.projects);
  }

  async getUserCaptures(userId: string, limit: number = 50): Promise<ProcessedCapture[]> {
    try {
      const captures = await kv.getByPrefix(`user:${userId}:capture:`);
      return captures
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.log('Get user captures error:', error);
      throw new Error('Failed to fetch user captures');
    }
  }

  async getRecentCaptures(userId: string, limit: number = 10): Promise<ProcessedCapture[]> {
    return this.getUserCaptures(userId, limit);
  }

  async getCaptureById(userId: string, captureId: string): Promise<ProcessedCapture | null> {
    try {
      return await kv.get(`user:${userId}:capture:${captureId}`);
    } catch (error) {
      console.log('Get capture by ID error:', error);
      return null;
    }
  }

  async updateCapture(userId: string, captureId: string, updates: Partial<ProcessedCapture>): Promise<ProcessedCapture> {
    try {
      const existing = await this.getCaptureById(userId, captureId);
      if (!existing) {
        throw new Error('Capture not found');
      }
      
      const updated = { ...existing, ...updates };
      await kv.set(`user:${userId}:capture:${captureId}`, updated);
      
      return updated;
    } catch (error) {
      console.log('Update capture error:', error);
      throw new Error('Failed to update capture');
    }
  }

  async deleteCapture(userId: string, captureId: string): Promise<boolean> {
    try {
      await kv.del(`user:${userId}:capture:${captureId}`);
      return true;
    } catch (error) {
      console.log('Delete capture error:', error);
      return false;
    }
  }
}

export const captureService = new CaptureService();