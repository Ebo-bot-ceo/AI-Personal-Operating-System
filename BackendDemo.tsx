import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  Server, 
  Database, 
  Zap, 
  MessageSquare, 
  BarChart3, 
  Layers, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Play,
  Brain,
  Settings
} from "lucide-react";
import { 
  healthAPI, 
  captureAPI, 
  aiAPI, 
  analyticsAPI, 
  integrationsAPI, 
  handleAPIError 
} from '../utils/api';

export function BackendDemo() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [activeDemo, setActiveDemo] = useState<string>('health');
  const [demoResults, setDemoResults] = useState<any>({});
  const [error, setError] = useState<string>('');

  // Test data
  const [captureText, setCaptureText] = useState("Meeting with John about the AI OS project roadmap for Q1. Need to prioritize the universal capture feature and integrate with Gmail by end of month.");
  const [aiMessage, setAiMessage] = useState("What are my most important tasks for today?");

  useEffect(() => {
    checkServerHealth();
  }, []);

  const checkServerHealth = async () => {
    try {
      setIsLoading(true);
      const health = await healthAPI.check();
      setServerStatus(health);
      setError('');
    } catch (err) {
      setError(handleAPIError(err));
      setServerStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const runDemo = async (demoType: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      let result;
      
      switch (demoType) {
        case 'capture':
          result = await captureAPI.processCapture({
            type: 'note',
            content: captureText,
            priority: 'high'
          });
          break;
          
        case 'ai':
          result = await aiAPI.sendMessage(aiMessage, { source: 'demo' });
          break;
          
        case 'analytics':
          result = await analyticsAPI.getDashboard();
          break;
          
        case 'integrations':
          result = {
            demo: 'Integration demo',
            services: ['Gmail', 'Slack', 'GitHub'],
            status: 'This would connect to real services with proper credentials'
          };
          break;
          
        default:
          result = { error: 'Unknown demo type' };
      }
      
      setDemoResults({ ...demoResults, [demoType]: result });
      setActiveDemo(demoType);
    } catch (err) {
      setError(handleAPIError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Backend Status */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-full">
                <Server className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="mb-1 flex items-center gap-2">
                  Powerful Backend Server
                  {serverStatus && getStatusIcon(serverStatus.status)}
                </h2>
                <p className="text-muted-foreground">
                  {serverStatus 
                    ? `Status: ${serverStatus.status} • Services: ${Object.keys(serverStatus.services || {}).length} active`
                    : 'Checking server status...'
                  }
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={checkServerHealth} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Backend Services Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: 'AI Service', icon: Brain, status: serverStatus?.services?.ai || 'unknown', desc: 'OpenAI Integration' },
          { name: 'Database', icon: Database, status: serverStatus?.services?.database || 'unknown', desc: 'Supabase KV Store' },
          { name: 'Analytics', icon: BarChart3, status: serverStatus?.services?.analytics || 'unknown', desc: 'Real-time Metrics' },
          { name: 'Integrations', icon: Layers, status: 'operational', desc: 'Third-party APIs' }
        ].map((service, index) => (
          <Card key={index}>
            <CardContent className="p-4 text-center">
              <service.icon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-medium mb-1">{service.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{service.desc}</p>
              <Badge variant={service.status === 'operational' ? 'default' : 'secondary'}>
                {service.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Interactive Backend Demos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Backend Functionality Demos
          </CardTitle>
          <p className="text-muted-foreground">
            Test the backend services and see real AI processing in action
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeDemo} onValueChange={setActiveDemo}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="capture">
                <Zap className="h-4 w-4 mr-1" />
                Capture
              </TabsTrigger>
              <TabsTrigger value="ai">
                <MessageSquare className="h-4 w-4 mr-1" />
                AI Chat
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-1" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="integrations">
                <Layers className="h-4 w-4 mr-1" />
                Integrations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="capture" className="space-y-4">
              <div>
                <h3 className="mb-2">Universal Capture Processing</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Test the AI-powered capture system that processes any text input
                </p>
                <Textarea
                  placeholder="Enter any text to capture and process..."
                  value={captureText}
                  onChange={(e) => setCaptureText(e.target.value)}
                  className="mb-4"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={() => runDemo('capture')} 
                    disabled={isLoading || !captureText.trim()}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                    Process Capture
                  </Button>
                </div>
              </div>
              
              {demoResults.capture && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Processing Result:</h4>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(demoResults.capture, null, 2)}
                  </pre>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <div>
                <h3 className="mb-2">AI Assistant Integration</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Chat with the AI assistant that understands your context
                </p>
                <Input
                  placeholder="Ask the AI assistant anything..."
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  className="mb-4"
                />
                <Button 
                  onClick={() => runDemo('ai')} 
                  disabled={isLoading || !aiMessage.trim()}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                  Send Message
                </Button>
              </div>

              {demoResults.ai && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">AI Response:</h4>
                  <p className="mb-3">{demoResults.ai.message?.content}</p>
                  {demoResults.ai.suggestions?.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-1">Suggestions:</h5>
                      <div className="flex gap-2 flex-wrap">
                        {demoResults.ai.suggestions.map((suggestion: string, index: number) => (
                          <Badge key={index} variant="outline">{suggestion}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div>
                <h3 className="mb-2">Real-time Analytics</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get insights from your productivity data and patterns
                </p>
                <Button onClick={() => runDemo('analytics')} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}
                  Generate Analytics
                </Button>
              </div>

              {demoResults.analytics && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium mb-2">Analytics Dashboard:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Today's Tasks</p>
                      <p className="text-2xl font-bold">{demoResults.analytics.summary?.todayTasks || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Focus Score</p>
                      <p className="text-2xl font-bold">{demoResults.analytics.summary?.weeklyFocus || 0}%</p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="integrations" className="space-y-4">
              <div>
                <h3 className="mb-2">Service Integrations</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect with external services for data synchronization
                </p>
                <Button onClick={() => runDemo('integrations')} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Layers className="h-4 w-4 mr-2" />}
                  Test Integrations
                </Button>
              </div>

              {demoResults.integrations && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium mb-2">Integration Status:</h4>
                  <p className="mb-2">{demoResults.integrations.status}</p>
                  <div className="flex gap-2 flex-wrap">
                    {demoResults.integrations.services?.map((service: string, index: number) => (
                      <Badge key={index} variant="outline">{service}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Backend Architecture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Backend Architecture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <Server className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h4 className="font-medium mb-2">Supabase Edge Functions</h4>
              <p className="text-sm text-muted-foreground">
                Serverless TypeScript functions with global edge deployment
              </p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Database className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h4 className="font-medium mb-2">Key-Value Store</h4>
              <p className="text-sm text-muted-foreground">
                Flexible data storage with real-time capabilities
              </p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Brain className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h4 className="font-medium mb-2">AI Processing</h4>
              <p className="text-sm text-muted-foreground">
                OpenAI integration for intelligent content analysis
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Key Features:</h4>
            <ul className="text-sm space-y-1">
              <li>• Authentication & authorization with Supabase Auth</li>
              <li>• Real-time data synchronization</li>
              <li>• AI-powered content processing and insights</li>
              <li>• Third-party service integrations (Gmail, Slack, GitHub, etc.)</li>
              <li>• Advanced analytics and pattern recognition</li>
              <li>• Scalable project and task management</li>
              <li>• Universal capture with intelligent categorization</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}