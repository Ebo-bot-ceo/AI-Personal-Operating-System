import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster } from "./components/ui/sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MainDashboard } from "./components/MainDashboard";
import { UniversalCapture } from "./components/UniversalCapture";
import { AIAssistant } from "./components/AIAssistant";
import { IntegrationHub } from "./components/IntegrationHub";
import { Analytics } from "./components/Analytics";
import { Settings } from "./components/Settings";
import { BackendDemo } from "./components/BackendDemo";
import { Navigation } from "./components/Navigation";
import { UserStatus } from "./components/UserStatus";
import { healthAPI } from "./utils/api";

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    // Check backend health on startup
    const checkBackendHealth = async () => {
      try {
        await healthAPI.check();
        setBackendStatus('online');
      } catch (error) {
        console.log('Backend health check failed, using demo mode:', error);
        setBackendStatus('offline');
      }
    };

    checkBackendHealth();
  }, []);

  const renderContent = () => {
    const components = {
      'dashboard': MainDashboard,
      'capture': UniversalCapture,
      'assistant': AIAssistant,
      'integrations': IntegrationHub,
      'analytics': Analytics,
      'backend': BackendDemo,
      'settings': Settings,
    };
    
    const Component = components[activeTab as keyof typeof components] || MainDashboard;
    return <Component />;
  };

  return (
    <ErrorBoundary>
      <motion.div 
        className={`min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 ${isAuthenticated ? 'flex' : 'flex items-center justify-center'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {isAuthenticated && (
          <>
            {/* Sidebar Navigation */}
            <motion.div 
              className="w-80 bg-white/95 backdrop-blur-sm border-r border-gray-200 flex-shrink-0 shadow-lg"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
            </motion.div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
              <motion.div 
                className="p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <UserStatus onAuthChange={setIsAuthenticated} />
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    {renderContent()}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>
          </>
        )}

        {!isAuthenticated && (
          <div className="w-full max-w-6xl mx-auto p-8">
            <UserStatus onAuthChange={setIsAuthenticated} />
          </div>
        )}

      {/* Background Elements */}
      <motion.div 
        className="fixed inset-0 pointer-events-none overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
          }}
          transition={{ 
            duration: 25, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
      </motion.div>
      
        <Toaster richColors closeButton />
      </motion.div>
    </ErrorBoundary>
  );
}