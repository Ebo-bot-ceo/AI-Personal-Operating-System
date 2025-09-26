import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  Home, 
  Zap, 
  MessageSquare, 
  Settings, 
  Search,
  Bell,
  User,
  Brain,
  Layers,
  BarChart3,
  Plus,
  Sparkles,
  Activity
} from "lucide-react";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const [notifications, setNotifications] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activityPulse, setActivityPulse] = useState(false);

  useEffect(() => {
    // Simulate activity updates
    const interval = setInterval(() => {
      setActivityPulse(true);
      setTimeout(() => setActivityPulse(false), 1000);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'capture', label: 'Universal Capture', icon: Zap },
    { id: 'assistant', label: 'AI Assistant', icon: MessageSquare, badge: notifications },
    { id: 'integrations', label: 'Integrations', icon: Layers },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'backend', label: 'Backend Demo', icon: Settings },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <motion.div 
      className="flex flex-col h-full"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <motion.div 
          className="flex items-center gap-3 mb-4"
          whileHover={{ scale: 1.02 }}
        >
          <motion.div 
            className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"
            animate={{ 
              scale: activityPulse ? [1, 1.1, 1] : 1,
              rotate: activityPulse ? [0, 5, -5, 0] : 0
            }}
            transition={{ duration: 0.5 }}
          >
            <Brain className="h-6 w-6 text-white" />
          </motion.div>
          <div>
            <motion.h1 
              className="font-bold flex items-center gap-2"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
            >
              AI OS
              {activityPulse && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <Activity className="h-3 w-3 text-green-500" />
                </motion.div>
              )}
            </motion.h1>
            <p className="text-sm text-muted-foreground">Personal Operating System</p>
          </div>
        </motion.div>
        
        <div className="flex items-center gap-2">
          <motion.div 
            className="flex-1 relative"
            animate={{ 
              scale: isSearchFocused ? 1.02 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              animate={{ 
                scale: searchQuery ? [1, 1.2, 1] : 1,
                color: searchQuery ? "#3b82f6" : "#6b7280"
              }}
              transition={{ duration: 0.3 }}
            >
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            </motion.div>
            <input
              type="text"
              placeholder="Search everything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <AnimatePresence>
              {searchQuery && searchQuery.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                >
                  <div className="p-2">
                    <p className="text-xs text-muted-foreground mb-2">Quick Search</p>
                    <div className="space-y-1">
                      <div className="px-2 py-1 hover:bg-gray-50 rounded text-sm cursor-pointer">
                        🧠 AI suggestions for "{searchQuery}"
                      </div>
                      <div className="px-2 py-1 hover:bg-gray-50 rounded text-sm cursor-pointer">
                        📝 Recent captures containing "{searchQuery}"
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button variant="outline" size="sm" className="relative">
              <Plus className="h-4 w-4" />
              <motion.div
                className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          {navItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 5 }}
            >
              <Button
                variant={activeTab === item.id ? "default" : "ghost"}
                className={`w-full justify-start transition-all duration-200 ${
                  activeTab === item.id 
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700" 
                    : "hover:bg-blue-50"
                }`}
                onClick={() => onTabChange(item.id)}
              >
                <motion.div
                  animate={{ 
                    rotate: activeTab === item.id ? [0, 5, -5, 0] : 0,
                    scale: activeTab === item.id ? 1.1 : 1
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                </motion.div>
                <span className="flex-1 text-left">{item.label}</span>
                <AnimatePresence>
                  {item.badge && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="ml-2"
                    >
                      <Badge variant="destructive" className="animate-pulse">
                        {item.badge}
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
                {activeTab === item.id && (
                  <motion.div
                    className="absolute right-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Sparkles className="h-3 w-3 text-white" />
                  </motion.div>
                )}
              </Button>
            </motion.div>
          ))}
        </nav>
      </div>

      {/* User Profile */}
      <motion.div 
        className="p-4 border-t"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div 
          className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg cursor-pointer"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div 
            className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"
            animate={{ 
              boxShadow: activityPulse 
                ? ["0 0 0 0 rgba(59, 130, 246, 0.7)", "0 0 0 10px rgba(59, 130, 246, 0)"]
                : "0 0 0 0 rgba(59, 130, 246, 0)"
            }}
            transition={{ duration: 1 }}
          >
            <User className="h-4 w-4 text-white" />
          </motion.div>
          <div className="flex-1">
            <motion.p 
              className="font-medium"
              animate={{ color: activityPulse ? "#3b82f6" : "inherit" }}
            >
              John Doe
            </motion.p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              Pro Plan
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-3 w-3 text-yellow-500" />
              </motion.div>
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              {notifications > 0 && (
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {notifications}
                </motion.div>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}