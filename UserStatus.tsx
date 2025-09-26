import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { AuthModal } from "./AuthModal";
import { toast } from "sonner@2.0.3";
import { 
  CheckCircle,
  Sparkles
} from "lucide-react";
import { authAPI } from '../utils/api';

interface UserStatusProps {
  onAuthChange?: (isAuthenticated: boolean) => void;
}

export function UserStatus({ onAuthChange }: UserStatusProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data } = await authAPI.getSession();
      const isAuth = !!data.session?.user;
      setIsAuthenticated(isAuth);
      setUser(data.session?.user || null);
      onAuthChange?.(isAuth);
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      onAuthChange?.(false);
    }
  };

  const handleAuthChange = (authenticated: boolean) => {
    if (authenticated) {
      checkAuthStatus();
    }
  };

  const handleSignOut = async () => {
    try {
      await authAPI.signOut();
      toast.success("Signed out successfully", {
        description: "You've been switched back to demo mode.",
      });
    } catch (error) {
      console.log('Sign out error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      onAuthChange?.(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex justify-center"
      >
        <AuthModal onAuthChange={handleAuthChange} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Alert className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium text-green-800 flex items-center gap-2">
                Welcome back, {user?.user_metadata?.name || user?.email}!
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="h-3 w-3 text-yellow-500" />
                </motion.div>
              </p>
              <p className="text-sm text-green-700">
                Your AI operating system is learning from your patterns.
              </p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Pro Plan
            </Badge>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSignOut}
            className="border-green-300 hover:bg-green-100"
          >
            Sign Out
          </Button>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}