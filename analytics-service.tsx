import * as kv from './kv_store.tsx';

interface ProductivityMetrics {
  tasksCompleted: number;
  tasksCreated: number;
  focusScore: number;
  captureCount: number;
  activeProjects: number;
  meetingTime: number;
  deepWorkTime: number;
}

interface AnalyticsData {
  daily: Record<string, ProductivityMetrics>;
  weekly: Record<string, ProductivityMetrics>;
  monthly: Record<string, ProductivityMetrics>;
  patterns: {
    peakHours: string[];
    productiveDays: string[];
    commonTasks: Array<{task: string, frequency: number}>;
    integrationUsage: Record<string, number>;
  };
}

class AnalyticsService {
  async getDashboardAnalytics(userId: string): Promise<any> {
    try {
      const analytics = await this.getAnalyticsData(userId);
      const insights = await this.generateInsights(userId);
      
      return {
        summary: {
          todayTasks: analytics.daily[this.getTodayKey()]?.tasksCompleted || 0,
          weeklyFocus: this.calculateWeeklyFocusScore(analytics),
          totalCaptures: await this.getTotalCaptures(userId),
          activeProjects: await this.getActiveProjectsCount(userId)
        },
        trends: this.calculateTrends(analytics),
        insights: insights.slice(0, 3),
        recentActivity: await this.getRecentActivity(userId)
      };
    } catch (error) {
      console.log('Dashboard analytics error:', error);
      throw new Error('Failed to generate dashboard analytics');
    }
  }

  async getProductivityAnalytics(userId: string): Promise<any> {
    try {
      const analytics = await this.getAnalyticsData(userId);
      const weekData = this.getWeekData(analytics);
      
      return {
        weeklyData: weekData,
        patterns: analytics.patterns,
        comparisons: await this.getComparisons(userId, analytics),
        recommendations: await this.generateRecommendations(userId, analytics)
      };
    } catch (error) {
      console.log('Productivity analytics error:', error);
      throw new Error('Failed to generate productivity analytics');
    }
  }

  async recordActivity(userId: string, activity: {
    type: 'task_complete' | 'capture' | 'focus_session' | 'meeting' | 'integration_sync';
    metadata?: any;
    timestamp?: string;
  }): Promise<void> {
    try {
      const timestamp = activity.timestamp || new Date().toISOString();
      const date = new Date(timestamp);
      const dayKey = date.toDateString();
      const hour = date.getHours();
      
      // Update daily metrics
      await this.updateDailyMetrics(userId, dayKey, activity);
      
      // Update hourly patterns
      await this.updateHourlyPatterns(userId, hour, activity);
      
      // Update weekly/monthly aggregates
      await this.updatePeriodMetrics(userId, date, activity);
      
    } catch (error) {
      console.log('Record activity error:', error);
    }
  }

  private async getAnalyticsData(userId: string): Promise<AnalyticsData> {
    try {
      const analyticsKey = `user:${userId}:analytics`;
      const data = await kv.get(analyticsKey);
      
      if (!data) {
        return this.initializeAnalyticsData();
      }
      
      return data;
    } catch (error) {
      console.log('Get analytics data error:', error);
      return this.initializeAnalyticsData();
    }
  }

  private initializeAnalyticsData(): AnalyticsData {
    return {
      daily: {},
      weekly: {},
      monthly: {},
      patterns: {
        peakHours: [],
        productiveDays: [],
        commonTasks: [],
        integrationUsage: {}
      }
    };
  }

  private async updateDailyMetrics(userId: string, dayKey: string, activity: any): Promise<void> {
    try {
      const metricsKey = `user:${userId}:metrics:${dayKey}`;
      const metrics = await kv.get(metricsKey) || {
        tasksCompleted: 0,
        tasksCreated: 0,
        focusScore: 0,
        captureCount: 0,
        activeProjects: 0,
        meetingTime: 0,
        deepWorkTime: 0
      };

      switch (activity.type) {
        case 'task_complete':
          metrics.tasksCompleted += 1;
          break;
        case 'capture':
          metrics.captureCount += 1;
          break;
        case 'focus_session':
          metrics.deepWorkTime += activity.metadata?.duration || 0;
          metrics.focusScore = this.calculateFocusScore(metrics);
          break;
        case 'meeting':
          metrics.meetingTime += activity.metadata?.duration || 0;
          break;
      }

      await kv.set(metricsKey, metrics);
    } catch (error) {
      console.log('Update daily metrics error:', error);
    }
  }

  private async updateHourlyPatterns(userId: string, hour: number, activity: any): Promise<void> {
    try {
      const patternsKey = `user:${userId}:patterns:hourly`;
      const patterns = await kv.get(patternsKey) || {};
      
      if (!patterns[hour]) {
        patterns[hour] = { count: 0, types: {} };
      }
      
      patterns[hour].count += 1;
      patterns[hour].types[activity.type] = (patterns[hour].types[activity.type] || 0) + 1;
      
      await kv.set(patternsKey, patterns);
    } catch (error) {
      console.log('Update hourly patterns error:', error);
    }
  }

  private async updatePeriodMetrics(userId: string, date: Date, activity: any): Promise<void> {
    try {
      const weekKey = this.getWeekKey(date);
      const monthKey = this.getMonthKey(date);
      
      // Update weekly metrics
      await this.updatePeriodMetric(userId, 'weekly', weekKey, activity);
      
      // Update monthly metrics
      await this.updatePeriodMetric(userId, 'monthly', monthKey, activity);
    } catch (error) {
      console.log('Update period metrics error:', error);
    }
  }

  private async updatePeriodMetric(userId: string, period: string, key: string, activity: any): Promise<void> {
    const metricsKey = `user:${userId}:metrics:${period}:${key}`;
    const metrics = await kv.get(metricsKey) || {
      tasksCompleted: 0,
      tasksCreated: 0,
      focusScore: 0,
      captureCount: 0,
      activeProjects: 0,
      meetingTime: 0,
      deepWorkTime: 0
    };

    // Update based on activity type (same logic as daily)
    switch (activity.type) {
      case 'task_complete':
        metrics.tasksCompleted += 1;
        break;
      case 'capture':
        metrics.captureCount += 1;
        break;
      // ... other cases
    }

    await kv.set(metricsKey, metrics);
  }

  private calculateFocusScore(metrics: ProductivityMetrics): number {
    // Simple focus score calculation
    const totalTime = metrics.deepWorkTime + metrics.meetingTime;
    if (totalTime === 0) return 0;
    
    const focusRatio = metrics.deepWorkTime / totalTime;
    const taskRatio = metrics.tasksCompleted / Math.max(metrics.tasksCreated, 1);
    
    return Math.round((focusRatio * 0.6 + taskRatio * 0.4) * 100);
  }

  async getCurrentFocusScore(userId: string): Promise<number> {
    try {
      const today = this.getTodayKey();
      const metrics = await kv.get(`user:${userId}:metrics:${today}`);
      return metrics?.focusScore || 0;
    } catch (error) {
      console.log('Get current focus score error:', error);
      return 0;
    }
  }

  private calculateWeeklyFocusScore(analytics: AnalyticsData): number {
    const weekData = this.getWeekData(analytics);
    const scores = weekData.map(day => day.focus || 0);
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private getWeekData(analytics: AnalyticsData): Array<{day: string, tasks: number, completed: number, focus: number}> {
    const weekData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayKey = date.toDateString();
      const metrics = analytics.daily[dayKey];
      
      weekData.push({
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        tasks: metrics?.tasksCreated || 0,
        completed: metrics?.tasksCompleted || 0,
        focus: metrics?.focusScore || 0
      });
    }
    
    return weekData;
  }

  private async getTotalCaptures(userId: string): Promise<number> {
    try {
      const captures = await kv.getByPrefix(`user:${userId}:capture:`);
      return captures.length;
    } catch (error) {
      console.log('Get total captures error:', error);
      return 0;
    }
  }

  private async getActiveProjectsCount(userId: string): Promise<number> {
    try {
      const projects = await kv.getByPrefix(`user:${userId}:project:`);
      return projects.filter(p => p.status === 'active').length;
    } catch (error) {
      console.log('Get active projects count error:', error);
      return 0;
    }
  }

  private calculateTrends(analytics: AnalyticsData): any {
    const weekData = this.getWeekData(analytics);
    const completionRate = weekData.reduce((sum, day) => sum + (day.completed / Math.max(day.tasks, 1)), 0) / weekData.length;
    
    return {
      completionRate: Math.round(completionRate * 100),
      focusTrend: this.calculateTrend(weekData.map(d => d.focus)),
      productivityTrend: this.calculateTrend(weekData.map(d => d.completed))
    };
  }

  private calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-3).reduce((sum, val) => sum + val, 0) / 3;
    const previous = values.slice(-6, -3).reduce((sum, val) => sum + val, 0) / 3;
    
    if (recent > previous * 1.1) return 'up';
    if (recent < previous * 0.9) return 'down';
    return 'stable';
  }

  private async getRecentActivity(userId: string): Promise<any[]> {
    try {
      // Get recent captures, tasks, etc.
      const captures = await kv.getByPrefix(`user:${userId}:capture:`);
      const tasks = await kv.getByPrefix(`user:${userId}:task:`);
      
      const activities = [
        ...captures.slice(0, 5).map(c => ({
          type: 'capture',
          title: c.processedContent?.summary || c.content?.substring(0, 50) + '...',
          timestamp: c.timestamp
        })),
        ...tasks.slice(0, 5).map(t => ({
          type: 'task',
          title: t.title,
          timestamp: t.created
        }))
      ];
      
      return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
    } catch (error) {
      console.log('Get recent activity error:', error);
      return [];
    }
  }

  private async getComparisons(userId: string, analytics: AnalyticsData): Promise<any> {
    const thisWeek = this.getWeekData(analytics);
    const thisWeekAvg = thisWeek.reduce((sum, day) => sum + day.completed, 0) / thisWeek.length;
    
    // Mock previous week data for comparison
    const lastWeekAvg = thisWeekAvg * 0.9; // Simulate improvement
    
    return {
      weekOverWeek: {
        current: Math.round(thisWeekAvg),
        previous: Math.round(lastWeekAvg),
        change: Math.round(((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100)
      }
    };
  }

  private async generateRecommendations(userId: string, analytics: AnalyticsData): Promise<string[]> {
    const recommendations = [];
    const weekData = this.getWeekData(analytics);
    const avgFocus = weekData.reduce((sum, day) => sum + day.focus, 0) / weekData.length;
    
    if (avgFocus < 70) {
      recommendations.push('Consider blocking more time for deep work to improve focus');
    }
    
    const completionRate = weekData.reduce((sum, day) => sum + (day.completed / Math.max(day.tasks, 1)), 0) / weekData.length;
    if (completionRate < 0.8) {
      recommendations.push('Break down larger tasks into smaller, manageable chunks');
    }
    
    // Add more recommendations based on patterns
    recommendations.push('Schedule your most important tasks during 9-11 AM when you\'re most focused');
    
    return recommendations;
  }

  private async generateInsights(userId: string): Promise<Array<{title: string, description: string, type: string}>> {
    const insights = [];
    
    // Sample insights - in production, these would be based on real data analysis
    insights.push({
      title: 'Peak Performance Window',
      description: 'You complete 40% more tasks between 9-11 AM',
      type: 'pattern'
    });
    
    insights.push({
      title: 'Email Processing Time',
      description: 'Email processing takes 23% of your capture time',
      type: 'efficiency'
    });
    
    insights.push({
      title: 'Project Momentum',
      description: 'Your AI OS project has 75% completion rate',
      type: 'progress'
    });
    
    return insights;
  }

  // Utility methods
  private getTodayKey(): string {
    return new Date().toDateString();
  }

  private getWeekKey(date: Date): string {
    const week = Math.ceil(date.getDate() / 7);
    return `${date.getFullYear()}-${date.getMonth()}-W${week}`;
  }

  private getMonthKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}`;
  }
}

export const analyticsService = new AnalyticsService();