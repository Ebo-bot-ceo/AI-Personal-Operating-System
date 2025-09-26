import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Alert, AlertDescription } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import { toast } from "sonner@2.0.3";
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Star, 
  RefreshCw,
  AlertCircle,
  Activity,
  Sparkles,
  Target,
  Timer
} from "lucide-react";
import { 
  analyticsAPI, 
  captureAPI, 
  projectsAPI, 
  aiAPI, 
  realtimeAPI,
  handleAPIError,
  realtimeUpdates 
} from '../utils/api';

export function MainDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dashboardData, setDashboardData] = useState<any>({});
  const [recentCaptures, setRecentCaptures] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [realtimeStatus, setRealtimeStatus] = useState<any>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingCapture, setProcessingCapture] = useState<string | null>(null);
  const [newInsightCount, setNewInsightCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates with more frequent polling
    realtimeUpdates.subscribe('dashboard', loadRealtimeData, 5000);
    
    // Auto-refresh dashboard every 30 seconds
    intervalRef.current = setInterval(() => {
      loadRealtimeData();
    }, 30000);
    
    return () => {
      realtimeUpdates.unsubscribe('dashboard');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError('');

      // Load all dashboard data in parallel
      const [analytics, captures, insights, projectsData] = await Promise.all([
        analyticsAPI.getDashboard().catch(() => null),
        captureAPI.getCaptures().catch(() => ({ captures: [] })),
        aiAPI.getInsights().catch(() => ({ insights: [] })),
        projectsAPI.getProjects().catch(() => ({ projects: [] }))
      ]);

      const newData = analytics || getMockAnalytics();
      const newCaptures = captures.captures?.slice(0, 4) || getMockCaptures();
      const newInsights = insights.insights?.slice(0, 3) || getMockInsights();
      const newProjects = projectsData.projects?.filter((p: any) => p.status === 'active').slice(0, 3) || getMockProjects();

      // Animate insight updates
      if (newInsights.length > aiInsights.length) {
        setNewInsightCount(newInsights.length - aiInsights.length);
        setTimeout(() => setNewInsightCount(0), 3000);
      }

      // Ensure data is valid before setting
      setDashboardData(newData);
      setRecentCaptures(Array.isArray(newCaptures) ? newCaptures : []);
      setAiInsights(Array.isArray(newInsights) ? newInsights : []);
      setProjects(Array.isArray(newProjects) ? newProjects : []);

    } catch (err) {
      setError(handleAPIError(err));
      // Load mock data on error
      setDashboardData(getMockAnalytics());
      setRecentCaptures(getMockCaptures());
      setAiInsights(getMockInsights());
      setProjects(getMockProjects());
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadRealtimeData = async () => {
    try {
      const status = await realtimeAPI.getStatus();
      setRealtimeStatus(status);
    } catch (err) {
      console.log('Realtime update error:', err);
      // Set fallback status
      setRealtimeStatus({
        ai_status: 'active',
        lastSync: new Date().toISOString(),
        focus_score: 85,
        integrations_syncing: false
      });
    }
  };

  const processCapture = async (captureId: string) => {
    try {
      setProcessingCapture(captureId);
      const capture = recentCaptures.find(c => c.id === captureId);
      if (!capture) return;

      // Simulate processing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Process the capture
      await captureAPI.processCapture({
        type: capture.type?.toLowerCase() || 'note',
        content: capture.content,
        priority: capture.priority || 'medium'
      });

      // Refresh captures with animation
      const updatedCaptures = await captureAPI.getCaptures();
      setRecentCaptures(updatedCaptures.captures?.slice(0, 4) || []);
      
      // Show success notification
      toast.success("Capture processed successfully!", {
        description: "Your content has been analyzed and organized.",
      });
      
    } catch (err) {
      console.error('Process capture error:', err);
      toast.error("Failed to process capture", {
        description: "Please try again or check your connection.",
      });
    } finally {
      setProcessingCapture(null);
    }
  };

  // Mock data functions
  const getMockAnalytics = () => ({
    summary: {
      todayTasks: Math.floor(Math.random() * 8) + 5,
      weeklyFocus: Math.floor(Math.random() * 15) + 85,
      totalCaptures: Math.floor(Math.random() * 30) + 35,
      activeProjects: Math.floor(Math.random() * 3) + 2
    },
    trends: {
      completionRate: Math.floor(Math.random() * 15) + 80,
      focusTrend: 'up',
      productivityTrend: 'up'
    }
  });

  const getMockCaptures = () => [
    { id: '1', type: 'Email', content: 'Meeting notes from client call about Q1 strategy', timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), processedContent: { priority: 'high' } },
    { id: '2', type: 'Article', content: 'AI trends in productivity software for 2024', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), processedContent: { priority: 'medium' } },
    { id: '3', type: 'Idea', content: 'Integration with voice assistants for hands-free capture', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), processedContent: { priority: 'low' } },
    { id: '4', type: 'Task', content: 'Review prototype feedback and update roadmap', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), processedContent: { priority: 'high' } }
  ];

  const getMockInsights = () => [
    { title: 'High Priority Tasks', description: 'You have 3 high-priority tasks due today. Consider rescheduling your 2 PM meeting to focus.', type: 'schedule', priority: 'high' },
    { title: 'Peak Performance', description: 'Based on your patterns, you\'re most productive on UI work between 9-11 AM.', type: 'pattern', priority: 'medium' },
    { title: 'Project Attention', description: 'Your Q1 strategy project needs attention. 4 related items captured this week suggest urgency.', type: 'productivity', priority: 'high' }
  ];

  const getMockProjects = () => [
    { id: '1', name: 'AI Operating System', progress: 75, tasks: [{ status: 'completed' }, { status: 'completed' }, { status: 'completed' }, { status: 'pending' }], deadline: '2024-12-30', team: ['JD', 'SM', 'AK'] },
    { id: '2', name: 'Market Research', progress: 45, tasks: [{ status: 'completed' }, { status: 'completed' }, { status: 'pending' }, { status: 'pending' }], deadline: '2024-01-15', team: ['MR', 'LT'] },
    { id: '3', name: 'User Testing', progress: 90, tasks: [{ status: 'completed' }, { status: 'completed' }, { status: 'completed' }, { status: 'completed' }, { status: 'completed' }, { status: 'pending' }], deadline: '2024-12-28', team: ['UX', 'QA'] }
  ];

  const formatTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hour${Math.floor(diff / 3600000) === 1 ? '' : 's'} ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Skeleton className={i === 0 ? "h-24 w-full" : "h-48 w-full"} />
          </motion.div>
        ))}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error} - Showing demo data instead.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Status Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                className="p-3 bg-blue-500 rounded-full"
                animate={{ 
                  scale: realtimeStatus.ai_status === 'active' ? [1, 1.05, 1] : 1,
                }}
                transition={{ 
                  duration: 2, 
                  repeat: realtimeStatus.ai_status === 'active' ? Infinity : 0,
                  repeatType: "reverse" 
                }}
              >
                <Brain className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h2 className="mb-1 flex items-center gap-2">
                  AI Operating System
                  {newInsightCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1"
                    >
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                      <Badge variant="outline" className="text-xs bg-yellow-50">
                        +{newInsightCount} new
                      </Badge>
                    </motion.div>
                  )}
                </h2>
                <motion.p 
                  className="text-muted-foreground"
                  key={dashboardData.summary?.totalCaptures}
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 1 }}
                >
                  Monitoring {dashboardData.summary?.totalCaptures || 0} items • 
                  Last sync {realtimeStatus.lastSync ? formatTimeAgo(realtimeStatus.lastSync) : '30 seconds ago'}
                </motion.p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <motion.div 
                  className="w-2 h-2 bg-green-500 rounded-full mr-2"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                {realtimeStatus.ai_status === 'active' ? 'Active' : 'Online'}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => loadDashboardData(true)}
                disabled={isRefreshing}
              >
                <motion.div
                  animate={{ rotate: isRefreshing ? 360 : 0 }}
                  transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
                >
                  <RefreshCw className="h-4 w-4" />
                </motion.div>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Captures */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Recent Captures
              {recentCaptures.length > 0 && (
                <Badge variant="outline">{recentCaptures.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence mode="wait">
              {recentCaptures.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8 text-muted-foreground"
                >
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  </motion.div>
                  <p>No captures yet. Start by adding some content!</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {recentCaptures.map((capture, index) => (
                    <motion.div 
                      key={capture.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:scale-[1.02]"
                    >
                      <Badge 
                        variant={getPriorityColor(capture.processedContent?.priority || capture.priority)}
                        className="mt-1"
                      >
                        {capture.type}
                      </Badge>
                      <div className="flex-1">
                        <p className="mb-1">{capture.content}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(capture.timestamp)}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => processCapture(capture.id)}
                        disabled={processingCapture === capture.id}
                        className="relative"
                      >
                        {processingCapture === capture.id ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Timer className="h-4 w-4" />
                          </motion.div>
                        ) : (
                          <Target className="h-4 w-4" />
                        )}
                        <span className="ml-1">
                          {processingCapture === capture.id ? 'Processing...' : 'Process'}
                        </span>
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
        </motion.div>

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence mode="wait">
              {aiInsights.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8 text-muted-foreground"
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  </motion.div>
                  <p>Analyzing your patterns...</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {aiInsights.map((insight, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:scale-[1.02] transition-transform duration-200"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <motion.div
                          animate={{ 
                            scale: insight.priority === 'high' ? [1, 1.2, 1] : 1,
                            color: insight.priority === 'high' ? ['#2563eb', '#dc2626', '#2563eb'] : '#2563eb'
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: insight.priority === 'high' ? Infinity : 0 
                          }}
                        >
                          <Activity className="h-4 w-4 mt-0.5 text-blue-600" />
                        </motion.div>
                        <div>
                          <h4 className="font-medium text-sm flex items-center gap-1">
                            {insight.title}
                            {insight.priority === 'high' && (
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                              >
                                <Badge variant="destructive" className="text-xs">!</Badge>
                              </motion.div>
                            )}
                          </h4>
                          <p className="text-sm">{insight.description}</p>
                        </div>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </motion.div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Active Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence mode="wait">
              {projects.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8 text-muted-foreground"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  </motion.div>
                  <p>No active projects. Create your first project!</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {projects.map((project, index) => {
                    const completedTasks = project.tasks?.filter((t: any) => t.status === 'completed').length || 0;
                    const totalTasks = project.tasks?.length || 0;
                    const isNearDeadline = new Date(project.deadline).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
                    
                    return (
                      <motion.div 
                        key={project.id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="space-y-2 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {project.name}
                              {isNearDeadline && (
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                >
                                  <Badge variant="destructive" className="text-xs">Due Soon</Badge>
                                </motion.div>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Due {new Date(project.deadline).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex -space-x-2">
                            {project.team?.slice(0, 3).map((member: string, i: number) => (
                              <motion.div
                                key={i}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2 + i * 0.05 }}
                              >
                                <Avatar className="h-6 w-6 border-2 border-white hover:scale-110 transition-transform">
                                  <AvatarFallback className="text-xs">{member}</AvatarFallback>
                                </Avatar>
                              </motion.div>
                            ))}
                            {project.team?.length > 3 && (
                              <Avatar className="h-6 w-6 border-2 border-white">
                                <AvatarFallback className="text-xs">+{project.team.length - 3}</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{completedTasks}/{totalTasks} tasks</span>
                            <motion.span
                              key={project.progress}
                              initial={{ scale: 1.2, color: "#22c55e" }}
                              animate={{ scale: 1, color: "inherit" }}
                              transition={{ duration: 0.3 }}
                            >
                              {project.progress}%
                            </motion.span>
                          </div>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                          >
                            <Progress value={project.progress} className="h-2" />
                          </motion.div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
        </motion.div>

        {/* Productivity Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Today's Focus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video relative rounded-lg overflow-hidden">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1716436329836-208bea5a55e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlJTIwZGFzaGJvYXJkfGVufDF8fHx8MTc1ODYyNTMwN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="AI Dashboard"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center text-white">
                  <h3 className="mb-2">Peak Performance Window</h3>
                  <p className="text-sm opacity-90">
                    {realtimeStatus.focus_score ? `Focus Score: ${realtimeStatus.focus_score}%` : '9:00 AM - 11:30 AM'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                className="text-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div 
                  className="flex items-center justify-center mb-1"
                  animate={{ 
                    rotate: dashboardData.summary?.todayTasks >= 8 ? [0, 360] : 0 
                  }}
                  transition={{ duration: 1 }}
                >
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </motion.div>
                <motion.p 
                  className="font-medium"
                  key={dashboardData.summary?.todayTasks}
                  initial={{ scale: 1.2, color: "#22c55e" }}
                  animate={{ scale: 1, color: "inherit" }}
                  transition={{ duration: 0.5 }}
                >
                  {dashboardData.summary?.todayTasks || 0}/10
                </motion.p>
                <p className="text-sm text-muted-foreground">Tasks Complete</p>
              </motion.div>
              
              <motion.div 
                className="text-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div 
                  className="flex items-center justify-center mb-1"
                  animate={{ 
                    scale: dashboardData.summary?.weeklyFocus >= 90 ? [1, 1.2, 1] : 1 
                  }}
                  transition={{ duration: 2, repeat: dashboardData.summary?.weeklyFocus >= 90 ? Infinity : 0 }}
                >
                  <Brain className="h-5 w-5 text-blue-600" />
                </motion.div>
                <motion.p 
                  className="font-medium"
                  key={dashboardData.summary?.weeklyFocus}
                  initial={{ scale: 1.2, color: "#3b82f6" }}
                  animate={{ scale: 1, color: "inherit" }}
                  transition={{ duration: 0.5 }}
                >
                  {dashboardData.summary?.weeklyFocus || 0}%
                </motion.p>
                <p className="text-sm text-muted-foreground">Focus Score</p>
              </motion.div>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}