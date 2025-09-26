import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { 
  Zap, 
  Mail, 
  Calendar, 
  Github, 
  Slack, 
  Trello, 
  FileText, 
  Globe, 
  Smartphone,
  Cloud,
  Database,
  Wifi,
  CheckCircle,
  AlertCircle,
  Plus,
  Settings,
  RefreshCw,
  Loader2,
  Activity,
  Users,
  BarChart3
} from "lucide-react";
import { integrationsAPI, handleAPIError } from '../utils/api';

interface Integration {
  id: string;
  service: string;
  status: 'connected' | 'error' | 'syncing';
  lastSync: string;
  itemsProcessed: number;
  enabled: boolean;
}

export function IntegrationHub() {
  const [connectedServices, setConnectedServices] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectingService, setConnectingService] = useState("");
  const [syncingService, setSyncingService] = useState("");

  const serviceInfo = {
    gmail: { 
      name: "Gmail", 
      icon: Mail, 
      category: "Email",
      description: "Email capture and intelligent categorization",
      fields: [
        { key: "email", label: "Email Address", type: "email", placeholder: "your-email@gmail.com" },
        { key: "password", label: "App Password", type: "password", placeholder: "Your app-specific password" }
      ]
    },
    'google-calendar': { 
      name: "Google Calendar", 
      icon: Calendar, 
      category: "Calendar",
      description: "Schedule optimization and meeting insights",
      fields: [
        { key: "email", label: "Google Email", type: "email", placeholder: "your-email@gmail.com" },
        { key: "apiKey", label: "API Key", type: "password", placeholder: "Your Google Calendar API key" }
      ]
    },
    slack: { 
      name: "Slack", 
      icon: Slack, 
      category: "Communication",
      description: "Message analysis and task extraction",
      fields: [
        { key: "botToken", label: "Bot Token", type: "password", placeholder: "xoxb-your-bot-token" },
        { key: "workspace", label: "Workspace", type: "text", placeholder: "your-workspace" }
      ]
    },
    github: { 
      name: "GitHub", 
      icon: Github, 
      category: "Development",
      description: "Code commits and project tracking",
      fields: [
        { key: "username", label: "Username", type: "text", placeholder: "your-username" },
        { key: "token", label: "Personal Access Token", type: "password", placeholder: "ghp_xxxxxxxxxxxx" }
      ]
    },
    notion: { 
      name: "Notion", 
      icon: FileText, 
      category: "Notes",
      description: "Knowledge base synchronization",
      fields: [
        { key: "token", label: "Integration Token", type: "password", placeholder: "secret_xxxxxxxxxxxx" },
        { key: "databaseId", label: "Database ID", type: "text", placeholder: "Database ID (optional)" }
      ]
    },
    trello: { 
      name: "Trello", 
      icon: Trello, 
      category: "Project Management",
      description: "Board and card management",
      fields: [
        { key: "apiKey", label: "API Key", type: "text", placeholder: "Your Trello API key" },
        { key: "token", label: "Token", type: "password", placeholder: "Your Trello token" }
      ]
    }
  };

  const availableIntegrations = [
    { service: "teams", name: "Microsoft Teams", icon: Users, category: "Communication" },
    { service: "zoom", name: "Zoom", icon: Globe, category: "Video" },
    { service: "figma", name: "Figma", icon: Globe, category: "Design" },
    { service: "linear", name: "Linear", icon: BarChart3, category: "Project Management" },
    { service: "spotify", name: "Spotify", icon: Globe, category: "Productivity" }
  ];

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await integrationsAPI.getIntegrations();
      setConnectedServices(response.integrations || []);
    } catch (err) {
      setError(handleAPIError(err));
      // Load mock data on error
      setConnectedServices([
        {
          id: "gmail-1",
          service: "gmail",
          status: "connected",
          lastSync: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          itemsProcessed: 247,
          enabled: true
        },
        {
          id: "slack-1",
          service: "slack",
          status: "connected",
          lastSync: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
          itemsProcessed: 156,
          enabled: true
        },
        {
          id: "github-1",
          service: "github",
          status: "connected",
          lastSync: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          itemsProcessed: 89,
          enabled: true
        },
        {
          id: "notion-1",
          service: "notion",
          status: "connected",
          lastSync: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          itemsProcessed: 23,
          enabled: false
        },
        {
          id: "trello-1",
          service: "trello",
          status: "error",
          lastSync: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          itemsProcessed: 0,
          enabled: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const connectService = async (service: string, credentials: any) => {
    try {
      setConnectingService(service);
      setError("");
      
      const response = await integrationsAPI.connectService(service, credentials);
      
      // Refresh integrations list
      await loadIntegrations();
      
      setConnectingService("");
      return true;
    } catch (err) {
      setError(handleAPIError(err));
      setConnectingService("");
      return false;
    }
  };

  const syncService = async (service: string) => {
    try {
      setSyncingService(service);
      setError("");
      
      await integrationsAPI.syncService(service);
      
      // Update the service status in the list
      setConnectedServices(prev => 
        prev.map(s => 
          s.service === service 
            ? { ...s, status: 'connected' as const, lastSync: new Date().toISOString() }
            : s
        )
      );
      
      setSyncingService("");
    } catch (err) {
      setError(handleAPIError(err));
      setSyncingService("");
    }
  };

  const toggleService = async (serviceId: string, enabled: boolean) => {
    setConnectedServices(prev =>
      prev.map(s => s.id === serviceId ? { ...s, enabled } : s)
    );
    // In a real app, this would make an API call to update the service status
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'syncing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'syncing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hour${Math.floor(diff / 3600000) === 1 ? '' : 's'} ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const ConnectDialog = ({ service }: { service: any }) => {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
      setIsSubmitting(true);
      const success = await connectService(service.service, formData);
      if (success) {
        // Close dialog - in a real implementation, you'd handle this with dialog state
        setFormData({});
      }
      setIsSubmitting(false);
    };

    const serviceConfig = serviceInfo[service.service as keyof typeof serviceInfo];
    if (!serviceConfig) return null;

    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <service.icon className="h-5 w-5" />
            Connect {service.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {serviceConfig.description}
          </p>
          
          {serviceConfig.fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                type={field.type}
                placeholder={field.placeholder}
                value={formData[field.key] || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
              />
            </div>
          ))}
          
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {isSubmitting ? 'Connecting...' : 'Connect Service'}
            </Button>
          </div>
        </div>
      </DialogContent>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 h-96 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  const totalItemsProcessed = connectedServices.reduce((sum, service) => sum + service.itemsProcessed, 0);
  const connectedCount = connectedServices.filter(s => s.status === 'connected').length;

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error} - Showing demo data.
          </AlertDescription>
        </Alert>
      )}

      {/* Integration Overview */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-full">
                <Cloud className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="mb-1">Integration Network</h2>
                <p className="text-muted-foreground">
                  {connectedCount} services connected • Processing {totalItemsProcessed} items total
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">{Math.round((connectedCount / Math.max(connectedServices.length, 1)) * 100)}% Connected</p>
              <p className="text-sm text-muted-foreground">Services active</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Connected Services */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Connected Services
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={loadIntegrations}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {connectedServices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Cloud className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No services connected yet. Add your first integration!</p>
              </div>
            ) : (
              connectedServices.map((service) => {
                const ServiceIcon = serviceInfo[service.service as keyof typeof serviceInfo]?.icon || Globe;
                const serviceName = serviceInfo[service.service as keyof typeof serviceInfo]?.name || service.service;
                const serviceDescription = serviceInfo[service.service as keyof typeof serviceInfo]?.description || 'Service integration';
                
                return (
                  <div key={service.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <ServiceIcon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{serviceName}</h4>
                        {getStatusIcon(service.status)}
                        <Badge variant="outline" className={getStatusColor(service.status)}>
                          {service.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{serviceDescription}</p>
                      <p className="text-xs text-muted-foreground">
                        Last sync: {formatTimeAgo(service.lastSync)} • {service.itemsProcessed} items processed
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={service.enabled} 
                        onCheckedChange={(enabled) => toggleService(service.id, enabled)}
                      />
                      {service.status === 'error' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => syncService(service.service)}
                          disabled={syncingService === service.service}
                        >
                          {syncingService === service.service ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Available Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableIntegrations.map((integration, index) => (
              <Dialog key={index}>
                <DialogTrigger asChild>
                  <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <integration.icon className="h-5 w-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium">{integration.name}</p>
                      <p className="text-sm text-muted-foreground">{integration.category}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      {connectingService === integration.service ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Connect'
                      )}
                    </Button>
                  </div>
                </DialogTrigger>
                <ConnectDialog service={integration} />
              </Dialog>
            ))}
            
            <Button variant="outline" className="w-full mt-4" disabled>
              <Plus className="h-4 w-4 mr-2" />
              Browse All Integrations
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Data Flow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Data Processing Pipeline
          </CardTitle>
          <p className="text-muted-foreground">How your data flows through the AI Operating System</p>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Globe className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h4 className="font-medium mb-1">Data Sources</h4>
                <p className="text-sm text-muted-foreground">{connectedServices.length} connected services</p>
                <p className="text-xs text-blue-600 mt-1">{totalItemsProcessed} items total</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <Zap className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h4 className="font-medium mb-1">AI Processing</h4>
                <p className="text-sm text-muted-foreground">Real-time analysis</p>
                <p className="text-xs text-purple-600 mt-1">98.2% accuracy</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <Database className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h4 className="font-medium mb-1">Knowledge Base</h4>
                <p className="text-sm text-muted-foreground">Structured storage</p>
                <p className="text-xs text-green-600 mt-1">Searchable index</p>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <h4 className="font-medium mb-1">Smart Actions</h4>
                <p className="text-sm text-muted-foreground">Automated workflows</p>
                <p className="text-xs text-orange-600 mt-1">Context-aware</p>
              </div>
            </div>
            
            {/* Connection lines */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-300 via-purple-300 via-green-300 to-orange-300 -translate-y-0.5 opacity-60"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}