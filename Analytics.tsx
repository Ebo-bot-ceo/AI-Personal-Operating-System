import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Brain, 
  Zap,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  AlertCircle,
  Calendar,
  Activity
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { analyticsAPI, handleAPIError } from '../utils/api';

export function Analytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [analyticsData, setAnalyticsData] = useState<any>({});
  const [productivityData, setProductivityData] = useState<any>({});

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError("");

      const [dashboard, productivity] = await Promise.all([
        analyticsAPI.getDashboard().catch(() => null),
        analyticsAPI.getProductivity().catch(() => null)
      ]);

      setAnalyticsData(dashboard || getMockDashboard());
      setProductivityData(productivity || getMockProductivity());

    } catch (err) {
      setError(handleAPIError(err));
      // Load mock data on error
      setAnalyticsData(getMockDashboard());
      setProductivityData(getMockProductivity());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockDashboard = () => ({
    summary: {
      todayTasks: 11,
      weeklyFocus: 86,
      totalCaptures: 447,
      activeProjects: 4
    },
    trends: {
      completionRate: 89,
      focusTrend: "up",
      productivityTrend: "up"
    },
    insights: [
      {
        title: "Peak Performance Window",
        description: "Your productivity peaks between 9-11 AM with 92% focus score",
        action: "Schedule deep work during this window",
        priority: "high"
      },
      {
        title: "Email Processing Time",
        description: "Email processing takes 23% of your time - consider batch processing",
        action: "Set specific email times",
        priority: "medium"
      },
      {
        title: "Friday Pattern",
        description: "Friday afternoons show 15% lower task completion",
        action: "Move routine tasks to Friday PM",
        priority: "medium"
      },
      {
        title: "Idea Growth",
        description: "Your idea capture has increased 45% this month",
        action: "Consider weekly idea review sessions",
        priority: "low"
      }
    ]
  });

  const getMockProductivity = () => ({
    weeklyData: [
      { day: 'Mon', tasks: 12, completed: 10, focus: 85 },
      { day: 'Tue', tasks: 8, completed: 8, focus: 92 },
      { day: 'Wed', tasks: 15, completed: 12, focus: 78 },
      { day: 'Thu', tasks: 10, completed: 9, focus: 88 },
      { day: 'Fri', tasks: 14, completed: 13, focus: 91 },
      { day: 'Sat', tasks: 6, completed: 5, focus: 75 },
      { day: 'Sun', tasks: 4, completed: 4, focus: 95 }
    ],
    patterns: {
      peakHours: ['9-11 AM'],
      productiveDays: ['Tuesday', 'Friday'],
      commonTasks: [
        { task: 'Email Processing', frequency: 156 },
        { task: 'Project Planning', frequency: 89 },
        { task: 'Design Work', frequency: 78 }
      ]
    },
    comparisons: {
      weekOverWeek: {
        current: 11,
        previous: 10,
        change: 10
      }
    }
  });

  const calculateStats = () => {
    const weeklyData = productivityData.weeklyData || [];
    const totalCompleted = weeklyData.reduce((sum: number, day: any) => sum + (day.completed || 0), 0);
    const avgFocus = weeklyData.reduce((sum: number, day: any) => sum + (day.focus || 0), 0) / Math.max(weeklyData.length, 1);
    
    return [
      {
        title: "Daily Average",
        value: Math.round(totalCompleted / 7).toString(),
        unit: "tasks completed",
        change: `+${productivityData.comparisons?.weekOverWeek?.change || 0}%`,
        trend: "up",
        icon: CheckCircle,
        color: "text-green-600"
      },
      {
        title: "Focus Score",
        value: `${Math.round(avgFocus)}%`,
        unit: "weekly average",
        change: "+5%",
        trend: analyticsData.trends?.focusTrend === 'up' ? "up" : "down",
        icon: Target,
        color: "text-blue-600"
      },
      {
        title: "Capture Rate",
        value: analyticsData.summary?.totalCaptures?.toString() || "0",
        unit: "items total",
        change: "-3%",
        trend: "down",
        icon: Zap,
        color: "text-purple-600"
      },
      {
        title: "Completion Rate",
        value: `${analyticsData.trends?.completionRate || 0}%`,
        unit: "tasks finished",
        change: "+18%",
        trend: analyticsData.trends?.productivityTrend === 'up' ? "up" : "down",
        icon: Clock,
        color: "text-orange-600"
      }
    ];
  };

  const getCaptureBreakdown = () => {
    // Mock capture data based on common patterns
    return [
      { category: 'Email', count: 156, percentage: 35 },
      { category: 'Notes', count: 89, percentage: 20 },
      { category: 'Tasks', count: 78, percentage: 18 },
      { category: 'Ideas', count: 67, percentage: 15 },
      { category: 'Links', count: 54, percentage: 12 }
    ];
  };

  const getIntegrationStats = () => {
    return [
      { service: "Gmail", processed: 156, accuracy: 94, status: "excellent" },
      { service: "Calendar", processed: 48, accuracy: 89, status: "good" },
      { service: "Slack", processed: 87, accuracy: 91, status: "excellent" },
      { service: "GitHub", processed: 23, accuracy: 76, status: "learning" },
      { service: "Notion", processed: 12, accuracy: 88, status: "good" }
    ];
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  const stats = calculateStats();
  const captureData = getCaptureBreakdown();
  const integrationStats = getIntegrationStats();

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error} - Showing demo analytics data.
          </AlertDescription>
        </Alert>
      )}

      {/* Analytics Header */}
      <Card className="bg-gradient-to-r from-indigo-50 to-cyan-50 border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500 rounded-full">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="mb-1">Productivity Analytics</h2>
                <p className="text-muted-foreground">AI-powered insights into your work patterns and efficiency</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Brain className="h-3 w-3 mr-1" />
                Learning Active
              </Badge>
              <Button variant="ghost" size="sm" onClick={loadAnalyticsData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <div className={`flex items-center gap-1 text-sm ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {stat.change}
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.unit}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Productivity Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly Productivity Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productivityData.weeklyData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={productivityData.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="focus" stroke="#8884d8" strokeWidth={2} name="Focus Score" />
                  <Line type="monotone" dataKey="completed" stroke="#82ca9d" strokeWidth={2} name="Tasks Completed" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No productivity data available yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Capture Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Capture Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={captureData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                  >
                    {captureData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="space-y-3">
                {captureData.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <div className="flex-1">
                      <p className="font-medium">{item.category}</p>
                      <p className="text-sm text-muted-foreground">{item.count} items</p>
                    </div>
                    <Badge variant="outline">{item.percentage}%</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Generated Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analyticsData.insights?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analyticsData.insights.map((item: any, index: number) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border-l-4 ${
                    item.priority === 'high' 
                      ? 'bg-red-50 border-red-400' 
                      : item.priority === 'medium' 
                      ? 'bg-yellow-50 border-yellow-400' 
                      : 'bg-blue-50 border-blue-400'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge 
                      variant="outline" 
                      className={
                        item.priority === 'high' 
                          ? 'bg-red-100 text-red-800' 
                          : item.priority === 'medium' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-blue-100 text-blue-800'
                      }
                    >
                      {item.priority} priority
                    </Badge>
                  </div>
                  <h4 className="font-medium mb-1">{item.title}</h4>
                  <p className="text-sm mb-2">{item.description}</p>
                  <p className="text-sm font-medium text-blue-600">{item.action}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>AI is analyzing your patterns to generate insights...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Integration Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrationStats.map((service, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{service.service}</h4>
                    <Badge 
                      variant="outline" 
                      className={
                        service.status === 'excellent' 
                          ? 'bg-green-100 text-green-800' 
                          : service.status === 'good' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {service.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {service.processed} items processed this week
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>AI Accuracy</span>
                      <span>{service.accuracy}%</span>
                    </div>
                    <Progress value={service.accuracy} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            This Week's Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">Most Productive Day</h4>
              <p className="text-2xl font-bold text-blue-600">
                {productivityData.patterns?.productiveDays?.[0] || 'Tuesday'}
              </p>
              <p className="text-sm text-muted-foreground">Based on completion rate</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium mb-2">Peak Hours</h4>
              <p className="text-2xl font-bold text-green-600">
                {productivityData.patterns?.peakHours?.[0] || '9-11 AM'}
              </p>
              <p className="text-sm text-muted-foreground">Highest focus score</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium mb-2">Top Task Type</h4>
              <p className="text-2xl font-bold text-purple-600">
                {productivityData.patterns?.commonTasks?.[0]?.task?.split(' ')[0] || 'Email'}
              </p>
              <p className="text-sm text-muted-foreground">Most frequent activity</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}