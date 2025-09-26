import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';
import { aiService } from './ai-service.tsx';
import { captureService } from './capture-service.tsx';
import { analyticsService } from './analytics-service.tsx';
import { integrationService } from './integration-service.tsx';
import { projectService } from './project-service.tsx';
import { authMiddleware } from './auth-middleware.tsx';

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', logger(console.log));

// Health check
app.get('/make-server-9e61c00c/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      ai: 'operational',
      database: 'operational',
      analytics: 'operational'
    }
  });
});

// Demo endpoints for unauthenticated access
app.get('/make-server-9e61c00c/demo/dashboard', (c) => {
  return c.json({
    summary: {
      todayTasks: Math.floor(Math.random() * 10) + 5,
      weeklyFocus: Math.floor(Math.random() * 20) + 80,
      totalCaptures: Math.floor(Math.random() * 50) + 20,
      activeProjects: Math.floor(Math.random() * 5) + 2
    },
    trends: {
      completionRate: Math.floor(Math.random() * 20) + 70,
      focusTrend: 'up',
      productivityTrend: 'up'
    }
  });
});

app.get('/make-server-9e61c00c/demo/captures', (c) => {
  const demoCaptures = [
    { id: '1', type: 'Email', content: 'Meeting notes from client call about Q1 strategy', timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), processedContent: { priority: 'high' } },
    { id: '2', type: 'Article', content: 'AI trends in productivity software for 2024', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), processedContent: { priority: 'medium' } },
    { id: '3', type: 'Idea', content: 'Integration with voice assistants for hands-free capture', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), processedContent: { priority: 'low' } },
    { id: '4', type: 'Task', content: 'Review prototype feedback and update roadmap', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), processedContent: { priority: 'high' } }
  ];
  return c.json({ captures: demoCaptures });
});

app.post('/make-server-9e61c00c/demo/insights', (c) => {
  const demoInsights = [
    { title: 'High Priority Tasks', description: 'You have 3 high-priority tasks due today. Consider rescheduling your 2 PM meeting to focus.', type: 'schedule', priority: 'high' },
    { title: 'Peak Performance', description: 'Based on your patterns, you\'re most productive on UI work between 9-11 AM.', type: 'pattern', priority: 'medium' },
    { title: 'Project Attention', description: 'Your Q1 strategy project needs attention. 4 related items captured this week suggest urgency.', type: 'productivity', priority: 'high' }
  ];
  return c.json({ insights: demoInsights });
});

app.get('/make-server-9e61c00c/demo/projects', (c) => {
  const demoProjects = [
    { id: '1', name: 'AI Operating System', progress: 75, tasks: [{ status: 'completed' }, { status: 'completed' }, { status: 'completed' }, { status: 'pending' }], deadline: '2024-12-30', team: ['JD', 'SM', 'AK'], status: 'active' },
    { id: '2', name: 'Market Research', progress: 45, tasks: [{ status: 'completed' }, { status: 'completed' }, { status: 'pending' }, { status: 'pending' }], deadline: '2024-01-15', team: ['MR', 'LT'], status: 'active' },
    { id: '3', name: 'User Testing', progress: 90, tasks: [{ status: 'completed' }, { status: 'completed' }, { status: 'completed' }, { status: 'completed' }, { status: 'completed' }, { status: 'pending' }], deadline: '2024-12-28', team: ['UX', 'QA'], status: 'active' }
  ];
  return c.json({ projects: demoProjects });
});

app.get('/make-server-9e61c00c/demo/status', (c) => {
  return c.json({
    ai_status: 'active',
    lastSync: new Date().toISOString(),
    focus_score: Math.floor(Math.random() * 20) + 80,
    integrations_syncing: false,
    recent_captures: [],
    active_tasks: [],
    notifications: []
  });
});

// Auth routes
app.post('/make-server-9e61c00c/auth/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Initialize user data
    await kv.set(`user:${data.user.id}:profile`, {
      id: data.user.id,
      email,
      name,
      created_at: new Date().toISOString(),
      settings: {
        ai_learning: true,
        notifications: true,
        theme: 'light'
      }
    });

    return c.json({ user: data.user, message: 'User created successfully' });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

// Universal Capture routes
app.post('/make-server-9e61c00c/capture', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const captureData = await c.req.json();
    
    const result = await captureService.processCapture(userId, captureData);
    return c.json(result);
  } catch (error) {
    console.log('Capture processing error:', error);
    return c.json({ error: 'Failed to process capture' }, 500);
  }
});

app.get('/make-server-9e61c00c/captures', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const captures = await captureService.getUserCaptures(userId);
    return c.json({ captures });
  } catch (error) {
    console.log('Get captures error:', error);
    return c.json({ error: 'Failed to fetch captures' }, 500);
  }
});

// AI Assistant routes
app.post('/make-server-9e61c00c/ai/chat', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { message, context } = await c.req.json();
    
    const response = await aiService.processMessage(userId, message, context);
    return c.json(response);
  } catch (error) {
    console.log('AI chat error:', error);
    return c.json({ error: 'Failed to process AI request' }, 500);
  }
});

app.post('/make-server-9e61c00c/ai/insights', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const insights = await aiService.generateInsights(userId);
    return c.json({ insights });
  } catch (error) {
    console.log('AI insights error:', error);
    return c.json({ error: 'Failed to generate insights' }, 500);
  }
});

// Analytics routes
app.get('/make-server-9e61c00c/analytics/dashboard', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const analytics = await analyticsService.getDashboardAnalytics(userId);
    return c.json(analytics);
  } catch (error) {
    console.log('Analytics dashboard error:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

app.get('/make-server-9e61c00c/analytics/productivity', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const productivity = await analyticsService.getProductivityAnalytics(userId);
    return c.json(productivity);
  } catch (error) {
    console.log('Productivity analytics error:', error);
    return c.json({ error: 'Failed to fetch productivity data' }, 500);
  }
});

// Project Management routes
app.get('/make-server-9e61c00c/projects', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const projects = await projectService.getUserProjects(userId);
    return c.json({ projects });
  } catch (error) {
    console.log('Get projects error:', error);
    return c.json({ error: 'Failed to fetch projects' }, 500);
  }
});

app.post('/make-server-9e61c00c/projects', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const projectData = await c.req.json();
    
    const project = await projectService.createProject(userId, projectData);
    return c.json({ project });
  } catch (error) {
    console.log('Create project error:', error);
    return c.json({ error: 'Failed to create project' }, 500);
  }
});

app.put('/make-server-9e61c00c/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('id');
    const updateData = await c.req.json();
    
    const project = await projectService.updateProject(userId, projectId, updateData);
    return c.json({ project });
  } catch (error) {
    console.log('Update project error:', error);
    return c.json({ error: 'Failed to update project' }, 500);
  }
});

// Integration routes
app.get('/make-server-9e61c00c/integrations', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const integrations = await integrationService.getUserIntegrations(userId);
    return c.json({ integrations });
  } catch (error) {
    console.log('Get integrations error:', error);
    return c.json({ error: 'Failed to fetch integrations' }, 500);
  }
});

app.post('/make-server-9e61c00c/integrations/connect', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { service, credentials } = await c.req.json();
    
    const integration = await integrationService.connectService(userId, service, credentials);
    return c.json({ integration });
  } catch (error) {
    console.log('Connect integration error:', error);
    return c.json({ error: 'Failed to connect integration' }, 500);
  }
});

app.post('/make-server-9e61c00c/integrations/sync', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { service } = await c.req.json();
    
    const result = await integrationService.syncService(userId, service);
    return c.json(result);
  } catch (error) {
    console.log('Sync integration error:', error);
    return c.json({ error: 'Failed to sync integration' }, 500);
  }
});

// Settings routes
app.get('/make-server-9e61c00c/settings', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const settings = await kv.get(`user:${userId}:settings`) || {};
    return c.json({ settings });
  } catch (error) {
    console.log('Get settings error:', error);
    return c.json({ error: 'Failed to fetch settings' }, 500);
  }
});

app.put('/make-server-9e61c00c/settings', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const newSettings = await c.req.json();
    
    await kv.set(`user:${userId}:settings`, newSettings);
    return c.json({ settings: newSettings });
  } catch (error) {
    console.log('Update settings error:', error);
    return c.json({ error: 'Failed to update settings' }, 500);
  }
});

// Real-time data route
app.get('/make-server-9e61c00c/realtime/status', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    
    // Get real-time status data
    const status = {
      ai_status: 'active',
      integrations_syncing: await integrationService.getSyncStatus(userId),
      recent_captures: await captureService.getRecentCaptures(userId, 5),
      active_tasks: await projectService.getActiveTasks(userId),
      focus_score: await analyticsService.getCurrentFocusScore(userId),
      notifications: await kv.get(`user:${userId}:notifications`) || []
    };

    return c.json(status);
  } catch (error) {
    console.log('Real-time status error:', error);
    return c.json({ error: 'Failed to fetch real-time status' }, 500);
  }
});

// Batch operations
app.post('/make-server-9e61c00c/batch/process', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { operations } = await c.req.json();
    
    const results = [];
    for (const operation of operations) {
      try {
        let result;
        switch (operation.type) {
          case 'capture':
            result = await captureService.processCapture(userId, operation.data);
            break;
          case 'project_update':
            result = await projectService.updateProject(userId, operation.id, operation.data);
            break;
          default:
            result = { error: `Unknown operation type: ${operation.type}` };
        }
        results.push({ id: operation.id, result });
      } catch (error) {
        results.push({ id: operation.id, error: error.message });
      }
    }
    
    return c.json({ results });
  } catch (error) {
    console.log('Batch process error:', error);
    return c.json({ error: 'Failed to process batch operations' }, 500);
  }
});

// Search functionality
app.post('/make-server-9e61c00c/search', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { query, filters } = await c.req.json();
    
    const results = await aiService.searchUserData(userId, query, filters);
    return c.json(results);
  } catch (error) {
    console.log('Search error:', error);
    return c.json({ error: 'Failed to perform search' }, 500);
  }
});

// Error handling
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Route not found' }, 404);
});

Deno.serve(app.fetch);