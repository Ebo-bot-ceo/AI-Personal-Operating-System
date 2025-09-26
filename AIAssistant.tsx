import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Alert, AlertDescription } from "./ui/alert";
import { 
  MessageSquare, 
  Send, 
  Brain, 
  Sparkles, 
  Calendar, 
  CheckCircle, 
  FileText, 
  TrendingUp,
  Mic,
  Paperclip,
  Loader2,
  RefreshCw,
  AlertCircle,
  Copy,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { aiAPI, handleAPIError } from '../utils/api';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: Array<{ label: string; type: string }>;
  suggestions?: string[];
  loading?: boolean;
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const quickActions = [
    { icon: Calendar, label: "What's my schedule?", query: "show my schedule for today" },
    { icon: CheckCircle, label: "Task summary", query: "summarize my pending tasks" },
    { icon: FileText, label: "Recent captures", query: "what have I captured recently?" },
    { icon: TrendingUp, label: "Weekly progress", query: "show my weekly progress and insights" }
  ];

  useEffect(() => {
    // Load initial conversation or show welcome message
    loadInitialMessage();
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const loadInitialMessage = async () => {
    try {
      const insights = await aiAPI.getInsights();
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'assistant',
        content: `Good morning! I've been analyzing your workflow and I've found some interesting patterns. ${insights.insights?.[0]?.description || 'Your productivity looks great today!'} 

How can I help you optimize your day?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: [
          { label: "Show Insights", type: "insights" },
          { label: "Optimize Schedule", type: "schedule" }
        ]
      };
      setMessages([welcomeMessage]);
    } catch (err) {
      // Fallback welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'assistant',
        content: "Hello! I'm your AI assistant. I can help you with scheduling, task management, analyzing your productivity patterns, and organizing your captured information. What would you like to know?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: [
          { label: "Get Started", type: "help" }
        ]
      };
      setMessages([welcomeMessage]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsLoading(true);
    setError("");

    try {
      const response = await aiAPI.sendMessage(currentInput, {
        conversationHistory: messages.slice(-5), // Send last 5 messages for context
        source: 'chat_interface'
      });

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: response.message?.content || "I apologize, but I couldn't process that request right now.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: response.actions || [],
        suggestions: response.suggestions || []
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      setError(handleAPIError(err));
      
      // Add fallback response
      const fallbackMessage: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: "I'm having trouble connecting right now, but I can help you with that! Based on your question, here are some suggestions I can offer.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: [
          { label: "Try Again", type: "retry" },
          { label: "View Offline Help", type: "help" }
        ]
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (query: string) => {
    setInputValue(query);
  };

  const handleActionClick = async (action: { label: string; type: string }) => {
    switch (action.type) {
      case 'insights':
        setInputValue("Show me my latest productivity insights and patterns");
        break;
      case 'schedule':
        setInputValue("Help me optimize my schedule for today");
        break;
      case 'retry':
        if (messages.length >= 2) {
          const lastUserMessage = messages[messages.length - 2];
          if (lastUserMessage.type === 'user') {
            setInputValue(lastUserMessage.content);
          }
        }
        break;
      case 'help':
        setInputValue("What can you help me with?");
        break;
      default:
        console.log('Action clicked:', action);
    }
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    
    if (!isListening) {
      // Mock voice recognition
      setTimeout(() => {
        setInputValue("What are my most important tasks for today and when should I work on them?");
        setIsListening(false);
      }, 2000);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const provideFeedback = (messageId: string, type: 'positive' | 'negative') => {
    console.log(`Feedback for ${messageId}: ${type}`);
    // In a real app, this would send feedback to improve the AI
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error} - You can continue chatting, but responses may be limited.
          </AlertDescription>
        </Alert>
      )}

      {/* AI Status */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-full">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="flex items-center gap-2">
                  AI Assistant
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {isLoading ? 'Thinking...' : 'Ready'}
                  </Badge>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Context-aware • Learning your patterns • Natural language processing
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={loadInitialMessage}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Natural Language Interface
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'}>
                      {message.type === 'user' ? 'U' : 'AI'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={`flex-1 max-w-[85%] ${message.type === 'user' ? 'text-right' : ''}`}>
                    <div className={`p-3 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white ml-auto' 
                        : 'bg-gray-100'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    {/* Message Actions and Info */}
                    <div className={`flex items-center gap-2 mt-2 ${message.type === 'user' ? 'justify-end' : ''}`}>
                      <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                      
                      {message.type === 'assistant' && (
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => copyMessage(message.content)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => provideFeedback(message.id, 'positive')}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => provideFeedback(message.id, 'negative')}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {message.actions && message.type === 'assistant' && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {message.actions.map((action, index) => (
                          <Button 
                            key={index} 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs"
                            onClick={() => handleActionClick(action)}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">Suggestions:</p>
                        <div className="flex gap-1 flex-wrap">
                          {message.suggestions.map((suggestion, index) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="cursor-pointer hover:bg-gray-100"
                              onClick={() => setInputValue(suggestion)}
                            >
                              {suggestion}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-purple-500 text-white">AI</AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex gap-2 mb-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={toggleListening}
                className={isListening ? "bg-red-50 border-red-200" : ""}
                disabled={isLoading}
              >
                <Mic className={`h-4 w-4 mr-1 ${isListening ? 'text-red-500' : ''}`} />
                {isListening ? 'Listening...' : 'Voice'}
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Paperclip className="h-4 w-4 mr-1" />
                Attach
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Ask me anything about your work, schedule, or productivity..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                className="flex-1"
                disabled={isLoading || isListening}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!inputValue.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-16 flex-col gap-2 text-left justify-start"
                onClick={() => handleQuickAction(action.query)}
                disabled={isLoading}
              >
                <action.icon className="h-5 w-5" />
                <span className="text-sm">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}