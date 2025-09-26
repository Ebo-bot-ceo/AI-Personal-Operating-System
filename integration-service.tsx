import * as kv from './kv_store.tsx';

interface Integration {
  id: string;
  userId: string;
  service: string;
  status: 'connected' | 'error' | 'syncing';
  credentials: any;
  lastSync: string;
  itemsProcessed: number;
  enabled: boolean;
  settings: any;
}

interface SyncResult {
  success: boolean;
  itemsProcessed: number;
  errors: string[];
  lastSync: string;
}

class IntegrationService {
  private readonly supportedServices = [
    'gmail', 'google-calendar', 'slack', 'github', 'notion', 'trello', 
    'teams', 'zoom', 'figma', 'linear', 'spotify'
  ];

  async getUserIntegrations(userId: string): Promise<Integration[]> {
    try {
      const integrations = await kv.getByPrefix(`user:${userId}:integration:`);
      return integrations.sort((a, b) => a.service.localeCompare(b.service));
    } catch (error) {
      console.log('Get user integrations error:', error);
      throw new Error('Failed to fetch integrations');
    }
  }

  async connectService(userId: string, service: string, credentials: any): Promise<Integration> {
    try {
      if (!this.supportedServices.includes(service)) {
        throw new Error(`Service ${service} is not supported`);
      }

      const integrationId = `${service}-${Date.now()}`;
      const integration: Integration = {
        id: integrationId,
        userId,
        service,
        status: 'connected',
        credentials: this.encryptCredentials(credentials),
        lastSync: new Date().toISOString(),
        itemsProcessed: 0,
        enabled: true,
        settings: this.getDefaultSettings(service)
      };

      // Test the connection
      const testResult = await this.testConnection(service, credentials);
      if (!testResult.success) {
        integration.status = 'error';
      }

      await kv.set(`user:${userId}:integration:${integrationId}`, integration);

      // Perform initial sync
      if (integration.status === 'connected') {
        setTimeout(() => this.syncService(userId, service), 1000);
      }

      return integration;
    } catch (error) {
      console.log('Connect service error:', error);
      throw new Error(`Failed to connect ${service}: ${error.message}`);
    }
  }

  async syncService(userId: string, service: string): Promise<SyncResult> {
    try {
      const integrations = await kv.getByPrefix(`user:${userId}:integration:`);
      const integration = integrations.find(i => i.service === service);
      
      if (!integration || !integration.enabled) {
        throw new Error(`Integration for ${service} not found or disabled`);
      }

      // Update status to syncing
      integration.status = 'syncing';
      await kv.set(`user:${userId}:integration:${integration.id}`, integration);

      const syncResult = await this.performSync(userId, integration);

      // Update integration with sync results
      integration.status = syncResult.success ? 'connected' : 'error';
      integration.lastSync = syncResult.lastSync;
      integration.itemsProcessed += syncResult.itemsProcessed;
      
      await kv.set(`user:${userId}:integration:${integration.id}`, integration);

      return syncResult;
    } catch (error) {
      console.log('Sync service error:', error);
      throw new Error(`Failed to sync ${service}: ${error.message}`);
    }
  }

  async getSyncStatus(userId: string): Promise<{[service: string]: string}> {
    try {
      const integrations = await this.getUserIntegrations(userId);
      const status: {[service: string]: string} = {};
      
      for (const integration of integrations) {
        status[integration.service] = integration.status;
      }
      
      return status;
    } catch (error) {
      console.log('Get sync status error:', error);
      return {};
    }
  }

  private async performSync(userId: string, integration: Integration): Promise<SyncResult> {
    const syncResult: SyncResult = {
      success: false,
      itemsProcessed: 0,
      errors: [],
      lastSync: new Date().toISOString()
    };

    try {
      switch (integration.service) {
        case 'gmail':
          await this.syncGmail(userId, integration, syncResult);
          break;
        case 'google-calendar':
          await this.syncGoogleCalendar(userId, integration, syncResult);
          break;
        case 'slack':
          await this.syncSlack(userId, integration, syncResult);
          break;
        case 'github':
          await this.syncGithub(userId, integration, syncResult);
          break;
        case 'notion':
          await this.syncNotion(userId, integration, syncResult);
          break;
        default:
          syncResult.errors.push(`Sync not implemented for ${integration.service}`);
      }

      syncResult.success = syncResult.errors.length === 0;
    } catch (error) {
      console.log(`Sync error for ${integration.service}:`, error);
      syncResult.errors.push(error.message);
    }

    return syncResult;
  }

  private async syncGmail(userId: string, integration: Integration, result: SyncResult): Promise<void> {
    try {
      // Mock Gmail sync - in production, use Gmail API
      const mockEmails = [
        {
          id: 'email1',
          subject: 'Project Update Meeting',
          from: 'john@company.com',
          content: 'Can we schedule a meeting to discuss the Q1 project updates?',
          timestamp: new Date().toISOString()
        },
        {
          id: 'email2',
          subject: 'Design Review Feedback',
          from: 'sarah@company.com',
          content: 'The new design looks great! A few minor suggestions attached.',
          timestamp: new Date().toISOString()
        }
      ];

      for (const email of mockEmails) {
        // Process email as capture
        const captureData = {
          type: 'email' as const,
          content: `From: ${email.from}\nSubject: ${email.subject}\n\n${email.content}`,
          source: 'gmail',
          metadata: {
            emailId: email.id,
            from: email.from,
            subject: email.subject
          }
        };

        // Import capture service to process
        const { captureService } = await import('./capture-service.tsx');
        await captureService.processCapture(userId, captureData);
        result.itemsProcessed++;
      }
    } catch (error) {
      result.errors.push(`Gmail sync error: ${error.message}`);
    }
  }

  private async syncGoogleCalendar(userId: string, integration: Integration, result: SyncResult): Promise<void> {
    try {
      // Mock Calendar sync
      const mockEvents = [
        {
          id: 'event1',
          title: 'Team Standup',
          start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          duration: 30
        },
        {
          id: 'event2',
          title: 'Client Presentation',
          start: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          duration: 60
        }
      ];

      for (const event of mockEvents) {
        const captureData = {
          type: 'note' as const,
          content: `Upcoming meeting: ${event.title} at ${new Date(event.start).toLocaleTimeString()}`,
          source: 'google-calendar',
          metadata: {
            eventId: event.id,
            start: event.start,
            duration: event.duration
          }
        };

        const { captureService } = await import('./capture-service.tsx');
        await captureService.processCapture(userId, captureData);
        result.itemsProcessed++;
      }
    } catch (error) {
      result.errors.push(`Google Calendar sync error: ${error.message}`);
    }
  }

  private async syncSlack(userId: string, integration: Integration, result: SyncResult): Promise<void> {
    try {
      // Mock Slack sync
      const mockMessages = [
        {
          id: 'msg1',
          channel: '#general',
          user: 'alice',
          content: 'The new feature deployment is scheduled for tomorrow',
          timestamp: new Date().toISOString()
        },
        {
          id: 'msg2',
          channel: '#design',
          user: 'bob',
          content: 'Can someone review the latest mockups in Figma?',
          timestamp: new Date().toISOString()
        }
      ];

      for (const message of mockMessages) {
        if (this.shouldProcessSlackMessage(message.content)) {
          const captureData = {
            type: 'note' as const,
            content: `Slack ${message.channel}: ${message.content}`,
            source: 'slack',
            metadata: {
              messageId: message.id,
              channel: message.channel,
              user: message.user
            }
          };

          const { captureService } = await import('./capture-service.tsx');
          await captureService.processCapture(userId, captureData);
          result.itemsProcessed++;
        }
      }
    } catch (error) {
      result.errors.push(`Slack sync error: ${error.message}`);
    }
  }

  private async syncGithub(userId: string, integration: Integration, result: SyncResult): Promise<void> {
    try {
      // Mock GitHub sync
      const mockCommits = [
        {
          id: 'commit1',
          message: 'Add AI assistant chat interface',
          repository: 'ai-os',
          author: 'developer',
          timestamp: new Date().toISOString()
        },
        {
          id: 'commit2',
          message: 'Fix universal capture processing bug',
          repository: 'ai-os',
          author: 'developer',
          timestamp: new Date().toISOString()
        }
      ];

      for (const commit of mockCommits) {
        const captureData = {
          type: 'note' as const,
          content: `GitHub commit in ${commit.repository}: ${commit.message}`,
          source: 'github',
          metadata: {
            commitId: commit.id,
            repository: commit.repository,
            author: commit.author
          }
        };

        const { captureService } = await import('./capture-service.tsx');
        await captureService.processCapture(userId, captureData);
        result.itemsProcessed++;
      }
    } catch (error) {
      result.errors.push(`GitHub sync error: ${error.message}`);
    }
  }

  private async syncNotion(userId: string, integration: Integration, result: SyncResult): Promise<void> {
    try {
      // Mock Notion sync
      const mockPages = [
        {
          id: 'page1',
          title: 'Product Roadmap Q1 2024',
          content: 'Key features planned for Q1 include AI assistant improvements...',
          lastModified: new Date().toISOString()
        }
      ];

      for (const page of mockPages) {
        const captureData = {
          type: 'note' as const,
          content: `Notion page: ${page.title}\n${page.content}`,
          source: 'notion',
          metadata: {
            pageId: page.id,
            title: page.title,
            lastModified: page.lastModified
          }
        };

        const { captureService } = await import('./capture-service.tsx');
        await captureService.processCapture(userId, captureData);
        result.itemsProcessed++;
      }
    } catch (error) {
      result.errors.push(`Notion sync error: ${error.message}`);
    }
  }

  private shouldProcessSlackMessage(content: string): boolean {
    // Filter out noise - only process messages that might be actionable
    const keywords = ['task', 'todo', 'deadline', 'meeting', 'review', 'help', 'question', 'urgent'];
    return keywords.some(keyword => content.toLowerCase().includes(keyword));
  }

  private async testConnection(service: string, credentials: any): Promise<{success: boolean, error?: string}> {
    try {
      // Mock connection testing - in production, make actual API calls
      if (!credentials || Object.keys(credentials).length === 0) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock some failures for demo
      if (service === 'trello' && Math.random() > 0.7) {
        return { success: false, error: 'Connection timeout' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private encryptCredentials(credentials: any): any {
    // In production, properly encrypt sensitive data
    return { ...credentials, encrypted: true };
  }

  private getDefaultSettings(service: string): any {
    const commonSettings = {
      syncFrequency: 'hourly',
      autoProcess: true,
      notifications: true
    };

    switch (service) {
      case 'gmail':
        return {
          ...commonSettings,
          folders: ['inbox', 'sent'],
          excludeSpam: true
        };
      case 'slack':
        return {
          ...commonSettings,
          channels: ['#general', '#work'],
          directMessages: true
        };
      case 'github':
        return {
          ...commonSettings,
          repositories: ['all'],
          events: ['push', 'pull_request', 'issues']
        };
      default:
        return commonSettings;
    }
  }

  async updateIntegrationSettings(userId: string, integrationId: string, settings: any): Promise<Integration> {
    try {
      const integration = await kv.get(`user:${userId}:integration:${integrationId}`);
      if (!integration) {
        throw new Error('Integration not found');
      }

      integration.settings = { ...integration.settings, ...settings };
      await kv.set(`user:${userId}:integration:${integrationId}`, integration);

      return integration;
    } catch (error) {
      console.log('Update integration settings error:', error);
      throw new Error('Failed to update integration settings');
    }
  }

  async toggleIntegration(userId: string, integrationId: string, enabled: boolean): Promise<Integration> {
    try {
      const integration = await kv.get(`user:${userId}:integration:${integrationId}`);
      if (!integration) {
        throw new Error('Integration not found');
      }

      integration.enabled = enabled;
      await kv.set(`user:${userId}:integration:${integrationId}`, integration);

      return integration;
    } catch (error) {
      console.log('Toggle integration error:', error);
      throw new Error('Failed to toggle integration');
    }
  }

  async disconnectService(userId: string, integrationId: string): Promise<boolean> {
    try {
      await kv.del(`user:${userId}:integration:${integrationId}`);
      return true;
    } catch (error) {
      console.log('Disconnect service error:', error);
      return false;
    }
  }

  async getIntegrationStats(userId: string): Promise<any> {
    try {
      const integrations = await this.getUserIntegrations(userId);
      
      return {
        total: integrations.length,
        connected: integrations.filter(i => i.status === 'connected').length,
        errors: integrations.filter(i => i.status === 'error').length,
        totalItemsProcessed: integrations.reduce((sum, i) => sum + i.itemsProcessed, 0),
        lastSyncTime: integrations.reduce((latest, i) => {
          return new Date(i.lastSync) > new Date(latest) ? i.lastSync : latest;
        }, '1970-01-01T00:00:00.000Z')
      };
    } catch (error) {
      console.log('Get integration stats error:', error);
      return {
        total: 0,
        connected: 0,
        errors: 0,
        totalItemsProcessed: 0,
        lastSyncTime: new Date().toISOString()
      };
    }
  }
}

export const integrationService = new IntegrationService();