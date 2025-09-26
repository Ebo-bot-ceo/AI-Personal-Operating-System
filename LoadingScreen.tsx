import { motion } from "motion/react";
import { Brain, Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          className="mb-6 p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-20 h-20 mx-auto flex items-center justify-center"
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1] 
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Brain className="h-8 w-8 text-white" />
        </motion.div>
        
        <motion.h1 
          className="text-2xl font-medium mb-2"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          AI Operating System
        </motion.h1>
        
        <motion.p className="text-muted-foreground mb-4">
          Initializing your personal productivity platform...
        </motion.p>
        
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="inline-block"
        >
          <Loader2 className="h-5 w-5 text-blue-500" />
        </motion.div>
      </motion.div>
    </div>
  );
}