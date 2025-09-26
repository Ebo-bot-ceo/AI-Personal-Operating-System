import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  Mic, 
  Camera, 
  Link, 
  FileText, 
  Brain, 
  Zap, 
  Plus,
  Image,
  Mail,
  Calendar,
  Lightbulb,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
  RefreshCw
} from "lucide-react";
import { captureAPI, handleAPIError } from '../utils/api';

export function UniversalCapture() {
  const [inputValue, setInputValue] = useState("");
  const [captureType, setCaptureType] = useState("note");
  const [priority, setPriority] = useState("medium");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [recentCaptures, setRecentCaptures] = useState<any[]>([]);
  const [aiPreview, setAiPreview] = useState<any>(null);
  const [suggestions, setSuggestions] = useState([
    { type: "Task", text: "Review Q4 performance metrics", category: "work" },
    { type: "Idea", text: "AI-powered email categorization feature", category: "product" },
    { type: "Meeting", text: "Schedule follow-up with design team", category: "work" },
    { type: "Research", text: "Competitive analysis of productivity tools", category: "research" }
  ]);

  const captureTypes = [
    { value: "note", icon: FileText, label: "Note", color: "bg-blue-500" },
    { value: "idea", icon: Lightbulb, label: "Idea", color: "bg-yellow-500" },
    { value: "task", icon: Calendar, label: "Task", color: "bg-green-500" },
    { value: "email", icon: Mail, label: "Email", color: "bg-purple-500" },
    { value: "link", icon: Link, label: "Link", color: "bg-orange-500" },
    { value: "file", icon: Image, label: "Media", color: "bg-pink-500" }
  ];

  useEffect(() => {
    loadRecentCaptures();
  }, []);

  useEffect(() => {
    // Generate AI preview when content changes
    if (inputValue.trim() && inputValue.length > 10) {
      const timeoutId = setTimeout(() => {
        generateAIPreview();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setAiPreview(null);
    }
  }, [inputValue]);

  const generateAIPreview = () => {
    // Mock AI analysis based on content
    const content = inputValue.toLowerCase();
    let detectedType = captureType;
    let detectedPriority = priority;
    let actions = [];
    let relatedItems = [];

    // Simple content analysis
    if (content.includes('meeting') || content.includes('call')) {
      detectedType = 'task';
      actions.push('Create calendar event');
    }
    if (content.includes('urgent') || content.includes('asap') || content.includes('deadline')) {
      detectedPriority = 'high';
    }
    if (content.includes('idea') || content.includes('feature')) {
      detectedType = 'idea';
      actions.push('Add to product backlog');
    }
    if (content.includes('research') || content.includes('analyze')) {
      actions.push('Create research project');
    }
    if (content.includes('email') || content.includes('@')) {
      detectedType = 'email';
      actions.push('Reply to email', 'Add to follow-up list');
    }

    // Add default actions
    if (actions.length === 0) {
      actions.push('Create task', 'Add to notes');
    }

    // Related items (mock)
    if (content.includes('ai') || content.includes('artificial intelligence')) {
      relatedItems.push('AI OS Project');
    }
    if (content.includes('design') || content.includes('ui')) {
      relatedItems.push('Design System');
    }

    setAiPreview({
      detectedType,
      detectedPriority,
      actions: actions.slice(0, 3),
      relatedItems: relatedItems.slice(0, 2),
      entities: extractEntities(inputValue)
    });
  };

  const extractEntities = (text: string) => {
    const entities = {
      people: [],
      dates: [],
      keywords: []
    };

    // Simple entity extraction
    const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    const names = text.match(namePattern) || [];
    entities.people = [...new Set(names)].slice(0, 3);

    const datePattern = /\b(today|tomorrow|next week|monday|tuesday|wednesday|thursday|friday)\b/gi;
    const dates = text.match(datePattern) || [];
    entities.dates = [...new Set(dates)].slice(0, 2);

    const keywordPattern = /\b(project|meeting|deadline|urgent|important|research|design|development)\b/gi;
    const keywords = text.match(keywordPattern) || [];
    entities.keywords = [...new Set(keywords)].slice(0, 3);

    return entities;
  };

  const loadRecentCaptures = async () => {
    try {
      const response = await captureAPI.getCaptures();
      setRecentCaptures(response.captures?.slice(0, 5) || []);
    } catch (err) {
      console.log('Load captures error:', err);
      // Use mock data on error
      setRecentCaptures([
        { id: '1', type: 'note', content: 'Team meeting insights about AI integration roadmap', timestamp: new Date(Date.now() - 30000).toISOString(), processed: true },
        { id: '2', type: 'link', content: 'https://research.ai/productivity-trends-2024', timestamp: new Date(Date.now() - 120000).toISOString(), processed: true },
        { id: '3', type: 'idea', content: 'Voice-to-task conversion with context awareness', timestamp: new Date(Date.now() - 300000).toISOString(), processed: false },
        { id: '4', type: 'email', content: 'Client feedback on prototype demo', timestamp: new Date(Date.now() - 600000).toISOString(), processed: true }
      ]);
    }
  };

  const handleCapture = async () => {
    if (!inputValue.trim()) return;

    setIsProcessing(true);
    setError("");
    setSuccess("");

    try {
      const result = await captureAPI.processCapture({
        type: captureType,
        content: inputValue,
        priority: priority,
        metadata: {
          source: 'universal_capture',
          aiPreview: aiPreview
        }
      });

      setSuccess(`Successfully captured and processed! Generated ${result.processedContent?.suggestedActions?.length || 0} action suggestions.`);
      setInputValue("");
      setAiPreview(null);
      
      // Refresh recent captures
      await loadRecentCaptures();

    } catch (err) {
      setError(handleAPIError(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    
    if (!isListening) {
      // Mock voice recognition
      setTimeout(() => {
        setInputValue("Meeting with John about the new AI features for next quarter. Need to prioritize the universal capture system and discuss integration timeline.");
        setIsListening(false);
      }, 2000);
    } else {
      setInputValue("");
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const handleQuickCapture = (type: any) => {
    setCaptureType(type.value);
    setInputValue(`[${type.label}] `);
  };

  const handleSuggestionClick = (suggestion: any) => {
    setInputValue(suggestion.text);
    setCaptureType(suggestion.type.toLowerCase());
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Main Capture Interface */}
      <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Universal Capture
          </CardTitle>
          <p className="text-muted-foreground">Capture anything from anywhere. AI will intelligently categorize and process it.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input Controls */}
          <div className="flex gap-2 mb-4">
            <Select value={captureType} onValueChange={setCaptureType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {captureTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Textarea
              placeholder="Type, paste, or speak anything... emails, ideas, tasks, links, notes..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={isListening}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={isListening ? "destructive" : "outline"}
                size="sm"
                onClick={toggleListening}
                className={isListening ? "animate-pulse" : ""}
                disabled={isProcessing}
              >
                <Mic className="h-4 w-4 mr-1" />
                {isListening ? "Listening..." : "Voice"}
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Camera className="h-4 w-4 mr-1" />
                Scan
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </Button>
            </div>
            
            <Button 
              onClick={handleCapture} 
              disabled={!inputValue.trim() || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Brain className="h-4 w-4 mr-1" />
              )}
              {isProcessing ? "Processing..." : "Capture & Process"}
            </Button>
          </div>

          {/* AI Processing Preview */}
          {aiPreview && (
            <div className="p-4 bg-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">AI Analysis Preview</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p><strong>Detected Type:</strong> {aiPreview.detectedType}</p>
                  <p><strong>Priority:</strong> {aiPreview.detectedPriority}</p>
                  {aiPreview.entities.people.length > 0 && (
                    <p><strong>People:</strong> {aiPreview.entities.people.join(', ')}</p>
                  )}
                  {aiPreview.entities.dates.length > 0 && (
                    <p><strong>Dates:</strong> {aiPreview.entities.dates.join(', ')}</p>
                  )}
                </div>
                <div className="space-y-2">
                  {aiPreview.actions.length > 0 && (
                    <p><strong>Suggested Actions:</strong> {aiPreview.actions.join(', ')}</p>
                  )}
                  {aiPreview.relatedItems.length > 0 && (
                    <p><strong>Related Items:</strong> {aiPreview.relatedItems.join(', ')}</p>
                  )}
                  {aiPreview.entities.keywords.length > 0 && (
                    <p><strong>Keywords:</strong> {aiPreview.entities.keywords.join(', ')}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Capture Types */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Capture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {captureTypes.map((type, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-20 flex-col gap-2 hover:bg-gray-50"
                  onClick={() => handleQuickCapture(type)}
                >
                  <div className={`p-2 rounded-lg ${type.color}`}>
                    <type.icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm">{type.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Smart Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <Badge variant="outline">{suggestion.type}</Badge>
                <div className="flex-1">
                  <p className="text-sm">{suggestion.text}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Captures */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Captures</CardTitle>
            <Button variant="ghost" size="sm" onClick={loadRecentCaptures}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentCaptures.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No captures yet. Try capturing something above!</p>
              </div>
            ) : (
              recentCaptures.map((capture) => (
                <div key={capture.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <Badge variant={getPriorityColor(capture.processedContent?.priority || 'medium')}>
                    {capture.type}
                  </Badge>
                  <div className="flex-1">
                    <p className="line-clamp-2">{capture.content}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(capture.timestamp)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {capture.processed ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Processed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Processing...
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}