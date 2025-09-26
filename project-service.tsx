import * as kv from './kv_store.tsx';

interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'paused' | 'archived';
  priority: 'high' | 'medium' | 'low';
  progress: number;
  tasks: Task[];
  team: string[];
  deadline?: string;
  created: string;
  updated: string;
  tags: string[];
  metadata: any;
}

interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  assignee?: string;
  due_date?: string;
  created: string;
  updated: string;
  estimatedHours?: number;
  actualHours?: number;
  dependencies: string[];
  tags: string[];
}

class ProjectService {
  async getUserProjects(userId: string): Promise<Project[]> {
    try {
      const projects = await kv.getByPrefix(`user:${userId}:project:`);
      return projects.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());
    } catch (error) {
      console.log('Get user projects error:', error);
      throw new Error('Failed to fetch projects');
    }
  }

  async createProject(userId: string, projectData: Partial<Project>): Promise<Project> {
    try {
      const projectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const project: Project = {
        id: projectId,
        userId,
        name: projectData.name || 'Untitled Project',
        description: projectData.description || '',
        status: projectData.status || 'active',
        priority: projectData.priority || 'medium',
        progress: 0,
        tasks: [],
        team: projectData.team || [],
        deadline: projectData.deadline,
        created: now,
        updated: now,
        tags: projectData.tags || [],
        metadata: projectData.metadata || {}
      };

      await kv.set(`user:${userId}:project:${projectId}`, project);

      // Create initial analytics entry
      await this.updateProjectAnalytics(userId, projectId, 'created');

      return project;
    } catch (error) {
      console.log('Create project error:', error);
      throw new Error('Failed to create project');
    }
  }

  async updateProject(userId: string, projectId: string, updates: Partial<Project>): Promise<Project> {
    try {
      const existing = await kv.get(`user:${userId}:project:${projectId}`);
      if (!existing) {
        throw new Error('Project not found');
      }

      const updated: Project = {
        ...existing,
        ...updates,
        id: projectId, // Ensure ID doesn't change
        userId, // Ensure userId doesn't change
        updated: new Date().toISOString()
      };

      // Recalculate progress if tasks were updated
      if (updates.tasks) {
        updated.progress = this.calculateProgress(updated.tasks);
      }

      await kv.set(`user:${userId}:project:${projectId}`, updated);

      // Update analytics
      await this.updateProjectAnalytics(userId, projectId, 'updated');

      return updated;
    } catch (error) {
      console.log('Update project error:', error);
      throw new Error('Failed to update project');
    }
  }

  async getProjectById(userId: string, projectId: string): Promise<Project | null> {
    try {
      return await kv.get(`user:${userId}:project:${projectId}`);
    } catch (error) {
      console.log('Get project by ID error:', error);
      return null;
    }
  }

  async deleteProject(userId: string, projectId: string): Promise<boolean> {
    try {
      const project = await this.getProjectById(userId, projectId);
      if (!project) {
        return false;
      }

      // Archive instead of delete to preserve data
      project.status = 'archived';
      project.updated = new Date().toISOString();
      await kv.set(`user:${userId}:project:${projectId}`, project);

      return true;
    } catch (error) {
      console.log('Delete project error:', error);
      return false;
    }
  }

  // Task Management
  async createTask(userId: string, projectId: string, taskData: Partial<Task>): Promise<Task> {
    try {
      const project = await this.getProjectById(userId, projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const task: Task = {
        id: taskId,
        projectId,
        title: taskData.title || 'Untitled Task',
        description: taskData.description,
        status: taskData.status || 'pending',
        priority: taskData.priority || 'medium',
        assignee: taskData.assignee,
        due_date: taskData.due_date,
        created: now,
        updated: now,
        estimatedHours: taskData.estimatedHours,
        actualHours: taskData.actualHours || 0,
        dependencies: taskData.dependencies || [],
        tags: taskData.tags || []
      };

      // Add task to project
      project.tasks.push(task);
      project.progress = this.calculateProgress(project.tasks);
      project.updated = now;

      await kv.set(`user:${userId}:project:${projectId}`, project);

      // Also store task separately for easier querying
      await kv.set(`user:${userId}:task:${taskId}`, task);

      return task;
    } catch (error) {
      console.log('Create task error:', error);
      throw new Error('Failed to create task');
    }
  }

  async updateTask(userId: string, projectId: string, taskId: string, updates: Partial<Task>): Promise<Task> {
    try {
      const project = await this.getProjectById(userId, projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const taskIndex = project.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      const updatedTask: Task = {
        ...project.tasks[taskIndex],
        ...updates,
        id: taskId, // Ensure ID doesn't change
        projectId, // Ensure projectId doesn't change
        updated: new Date().toISOString()
      };

      project.tasks[taskIndex] = updatedTask;
      project.progress = this.calculateProgress(project.tasks);
      project.updated = new Date().toISOString();

      await kv.set(`user:${userId}:project:${projectId}`, project);
      await kv.set(`user:${userId}:task:${taskId}`, updatedTask);

      // Record analytics if task was completed
      if (updates.status === 'completed' && project.tasks[taskIndex].status !== 'completed') {
        const { analyticsService } = await import('./analytics-service.tsx');
        await analyticsService.recordActivity(userId, {
          type: 'task_complete',
          metadata: { taskId, projectId, priority: updatedTask.priority }
        });
      }

      return updatedTask;
    } catch (error) {
      console.log('Update task error:', error);
      throw new Error('Failed to update task');
    }
  }

  async getActiveTasks(userId: string, limit: number = 10): Promise<Task[]> {
    try {
      const tasks = await kv.getByPrefix(`user:${userId}:task:`);
      return tasks
        .filter(task => task.status !== 'completed')
        .sort((a, b) => {
          // Sort by priority, then by due date
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }
          if (a.due_date && b.due_date) {
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          }
          return new Date(a.created).getTime() - new Date(b.created).getTime();
        })
        .slice(0, limit);
    } catch (error) {
      console.log('Get active tasks error:', error);
      return [];
    }
  }

  async getOverdueTasks(userId: string): Promise<Task[]> {
    try {
      const tasks = await kv.getByPrefix(`user:${userId}:task:`);
      const now = new Date();
      
      return tasks.filter(task => 
        task.status !== 'completed' && 
        task.due_date && 
        new Date(task.due_date) < now
      );
    } catch (error) {
      console.log('Get overdue tasks error:', error);
      return [];
    }
  }

  private calculateProgress(tasks: Task[]): number {
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / tasks.length) * 100);
  }

  private async updateProjectAnalytics(userId: string, projectId: string, action: string): Promise<void> {
    try {
      const analyticsKey = `user:${userId}:project_analytics:${projectId}`;
      const analytics = await kv.get(analyticsKey) || {
        projectId,
        created: new Date().toISOString(),
        actions: [],
        metrics: {
          totalTasks: 0,
          completedTasks: 0,
          timeSpent: 0,
          teamSize: 0
        }
      };

      analytics.actions.push({
        action,
        timestamp: new Date().toISOString()
      });

      // Keep only last 100 actions
      analytics.actions = analytics.actions.slice(-100);

      await kv.set(analyticsKey, analytics);
    } catch (error) {
      console.log('Update project analytics error:', error);
    }
  }

  // Project Templates
  async createProjectFromTemplate(userId: string, templateName: string, customization: any): Promise<Project> {
    try {
      const template = this.getProjectTemplate(templateName);
      if (!template) {
        throw new Error('Template not found');
      }

      const projectData = {
        ...template,
        ...customization,
        name: customization.name || template.name
      };

      const project = await this.createProject(userId, projectData);

      // Create tasks from template
      for (const taskTemplate of template.taskTemplates || []) {
        await this.createTask(userId, project.id, taskTemplate);
      }

      return project;
    } catch (error) {
      console.log('Create project from template error:', error);
      throw new Error('Failed to create project from template');
    }
  }

  private getProjectTemplate(templateName: string): any {
    const templates = {
      'ai-project': {
        name: 'AI Project Template',
        description: 'Template for AI/ML projects',
        tags: ['ai', 'machine-learning'],
        taskTemplates: [
          { title: 'Data Collection', priority: 'high', estimatedHours: 16 },
          { title: 'Model Training', priority: 'high', estimatedHours: 24 },
          { title: 'Testing & Validation', priority: 'medium', estimatedHours: 8 },
          { title: 'Deployment', priority: 'high', estimatedHours: 12 }
        ]
      },
      'web-app': {
        name: 'Web Application Template',
        description: 'Template for web application development',
        tags: ['web', 'development'],
        taskTemplates: [
          { title: 'UI/UX Design', priority: 'high', estimatedHours: 20 },
          { title: 'Frontend Development', priority: 'high', estimatedHours: 40 },
          { title: 'Backend Development', priority: 'high', estimatedHours: 32 },
          { title: 'Testing', priority: 'medium', estimatedHours: 16 },
          { title: 'Deployment', priority: 'high', estimatedHours: 8 }
        ]
      },
      'research': {
        name: 'Research Project Template',
        description: 'Template for research projects',
        tags: ['research', 'analysis'],
        taskTemplates: [
          { title: 'Literature Review', priority: 'high', estimatedHours: 24 },
          { title: 'Data Gathering', priority: 'high', estimatedHours: 16 },
          { title: 'Analysis', priority: 'high', estimatedHours: 32 },
          { title: 'Report Writing', priority: 'medium', estimatedHours: 20 }
        ]
      }
    };

    return templates[templateName];
  }

  // Project Insights
  async getProjectInsights(userId: string, projectId: string): Promise<any> {
    try {
      const project = await this.getProjectById(userId, projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const analytics = await kv.get(`user:${userId}:project_analytics:${projectId}`);
      
      const insights = {
        progress: {
          percentage: project.progress,
          tasksCompleted: project.tasks.filter(t => t.status === 'completed').length,
          totalTasks: project.tasks.length,
          tasksInProgress: project.tasks.filter(t => t.status === 'in_progress').length
        },
        timeline: {
          created: project.created,
          deadline: project.deadline,
          daysRemaining: project.deadline ? Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
        },
        team: {
          size: project.team.length,
          taskDistribution: this.getTaskDistribution(project.tasks)
        },
        risks: this.identifyProjectRisks(project),
        recommendations: this.generateProjectRecommendations(project)
      };

      return insights;
    } catch (error) {
      console.log('Get project insights error:', error);
      throw new Error('Failed to generate project insights');
    }
  }

  private getTaskDistribution(tasks: Task[]): any {
    const distribution = {};
    for (const task of tasks) {
      if (task.assignee) {
        distribution[task.assignee] = (distribution[task.assignee] || 0) + 1;
      }
    }
    return distribution;
  }

  private identifyProjectRisks(project: Project): string[] {
    const risks = [];
    
    if (project.deadline) {
      const daysRemaining = Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysRemaining < 7 && project.progress < 80) {
        risks.push('Project may miss deadline due to low completion rate');
      }
    }

    const overdueTasks = project.tasks.filter(task => 
      task.due_date && 
      new Date(task.due_date) < new Date() && 
      task.status !== 'completed'
    );
    
    if (overdueTasks.length > 0) {
      risks.push(`${overdueTasks.length} tasks are overdue`);
    }

    const blockedTasks = project.tasks.filter(task => task.status === 'blocked');
    if (blockedTasks.length > 0) {
      risks.push(`${blockedTasks.length} tasks are blocked`);
    }

    return risks;
  }

  private generateProjectRecommendations(project: Project): string[] {
    const recommendations = [];
    
    if (project.progress < 25 && project.tasks.length > 10) {
      recommendations.push('Consider breaking down large tasks into smaller, manageable chunks');
    }

    const highPriorityTasks = project.tasks.filter(t => t.priority === 'high' && t.status !== 'completed');
    if (highPriorityTasks.length > 3) {
      recommendations.push('Focus on completing high-priority tasks first');
    }

    if (project.team.length > 1) {
      const unassignedTasks = project.tasks.filter(t => !t.assignee && t.status !== 'completed');
      if (unassignedTasks.length > 0) {
        recommendations.push('Assign ownership to unassigned tasks');
      }
    }

    return recommendations;
  }
}

export const projectService = new ProjectService();