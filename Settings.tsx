import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { Slider } from "./ui/slider";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription } from "./ui/alert";
import { 
  Settings2, 
  Brain, 
  Shield, 
  Bell, 
  Palette, 
  Database, 
  Zap,
  Moon,
  Sun,
  Volume2,
  Globe,
  Lock,
  Eye,
  Download,
  Trash2,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { settingsAPI, handleAPIError } from '../utils/api';

interface SettingsData {
  ai: {
    learningMode: boolean;
    predictiveSuggestions: boolean;
    autoCategorization: boolean;
    smartNotifications: boolean;
    learningIntensity: number;
  };
  privacy: {
    dataEncryption: boolean;
    anonymousAnalytics: boolean;
    localProcessing: boolean;
    thirdPartySharing: boolean;
  };
  notifications: {
    dailySummary: boolean;
    taskReminders: boolean;
    focusBreaks: boolean;
    weeklyInsights: boolean;
  };
  appearance: {
    darkMode: boolean;
    interfaceDensity: 'compact' | 'comfortable' | 'spacious';
    soundEffects: boolean;
  };
  advanced: {
    syncFrequency: number;
    developerMode: boolean;
  };
}

export function Settings() {
  const [settings, setSettings] = useState<SettingsData>({
    ai: {
      learningMode: true,
      predictiveSuggestions: true,
      autoCategorization: true,
      smartNotifications: false,
      learningIntensity: 75
    },
    privacy: {
      dataEncryption: true,
      anonymousAnalytics: true,
      localProcessing: false,
      thirdPartySharing: true
    },
    notifications: {
      dailySummary: true,
      taskReminders: true,
      focusBreaks: false,
      weeklyInsights: true
    },
    appearance: {
      darkMode: false,
      interfaceDensity: 'comfortable',
      soundEffects: true
    },
    advanced: {
      syncFrequency: 60,
      developerMode: false
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const response = await settingsAPI.getSettings();
      if (response.settings) {
        setSettings(prevSettings => ({ ...prevSettings, ...response.settings }));
      }
    } catch (err) {
      setError(handleAPIError(err));
      // Continue with default settings
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccessMessage("");
      
      await settingsAPI.updateSettings(settings);
      setSuccessMessage("Settings saved successfully!");
      setUnsavedChanges(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(handleAPIError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (category: keyof SettingsData, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setUnsavedChanges(true);
  };

  const clearCache = async () => {
    // Mock cache clearing
    setSuccessMessage("Cache cleared successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const exportData = async () => {
    // Mock data export
    const dataUrl = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify({ settings, exportDate: new Date().toISOString() }, null, 2)
    );
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'ai-os-settings.json';
    link.click();
    
    setSuccessMessage("Settings exported successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const aiSettingsConfig = [
    {
      key: 'learningMode',
      title: "Learning Mode",
      description: "Allow AI to learn from your patterns and preferences",
      icon: Brain
    },
    {
      key: 'predictiveSuggestions',
      title: "Predictive Suggestions",
      description: "Show AI-generated suggestions for tasks and scheduling",
      icon: Zap
    },
    {
      key: 'autoCategorization',
      title: "Auto-categorization",
      description: "Automatically categorize captured items",
      icon: Database
    },
    {
      key: 'smartNotifications',
      title: "Smart Notifications",
      description: "AI-optimized notification timing based on your focus patterns",
      icon: Bell
    }
  ];

  const privacySettingsConfig = [
    {
      key: 'dataEncryption',
      title: "Data Encryption",
      description: "All data encrypted at rest and in transit",
      icon: Shield,
      locked: true
    },
    {
      key: 'anonymousAnalytics',
      title: "Anonymous Analytics",
      description: "Share anonymous usage data to improve AI models",
      icon: Eye
    },
    {
      key: 'localProcessing',
      title: "Local Processing",
      description: "Process sensitive data locally when possible",
      icon: Lock
    },
    {
      key: 'thirdPartySharing',
      title: "Third-party Sharing",
      description: "Allow data sharing with integrated services",
      icon: Globe
    }
  ];

  const notificationSettingsConfig = [
    {
      key: 'dailySummary',
      title: "Daily Summary",
      description: "Receive a daily summary of your productivity",
      time: "8:00 AM"
    },
    {
      key: 'taskReminders',
      title: "Task Reminders",
      description: "Get reminders for upcoming deadlines",
      time: "As needed"
    },
    {
      key: 'focusBreaks',
      title: "Focus Breaks",
      description: "Reminders to take breaks during deep work",
      time: "Every 90 min"
    },
    {
      key: 'weeklyInsights',
      title: "Weekly Insights",
      description: "Weekly productivity and pattern analysis",
      time: "Monday 9:00 AM"
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Settings Header */}
      <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-500 rounded-full">
                <Settings2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="mb-1">System Settings</h2>
                <p className="text-muted-foreground">Configure your AI Operating System preferences and privacy settings</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unsavedChanges && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  Unsaved Changes
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={loadSettings}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button onClick={saveSettings} disabled={isSaving || !unsavedChanges}>
                {isSaving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* AI Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {aiSettingsConfig.map((setting) => (
              <div key={setting.key} className="flex items-start gap-4">
                <div className="p-2 bg-blue-50 rounded-lg mt-1">
                  <setting.icon className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{setting.title}</h4>
                    <Switch 
                      checked={settings.ai[setting.key as keyof typeof settings.ai] as boolean}
                      onCheckedChange={(value) => updateSetting('ai', setting.key, value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                </div>
              </div>
            ))}
            
            <Separator />
            
            <div className="space-y-4">
              <h4 className="font-medium">AI Learning Intensity</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Conservative</span>
                  <span>Aggressive</span>
                </div>
                <Slider 
                  value={[settings.ai.learningIntensity]} 
                  onValueChange={(value) => updateSetting('ai', 'learningIntensity', value[0])}
                  max={100} 
                  step={1} 
                  className="w-full" 
                />
                <p className="text-xs text-muted-foreground">
                  Controls how actively the AI learns and adapts to your patterns ({settings.ai.learningIntensity}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {privacySettingsConfig.map((setting) => (
              <div key={setting.key} className="flex items-start gap-4">
                <div className="p-2 bg-green-50 rounded-lg mt-1">
                  <setting.icon className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{setting.title}</h4>
                      {setting.locked && (
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          Required
                        </Badge>
                      )}
                    </div>
                    <Switch 
                      checked={settings.privacy[setting.key as keyof typeof settings.privacy] as boolean}
                      onCheckedChange={(value) => updateSetting('privacy', setting.key, value)}
                      disabled={setting.locked}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                </div>
              </div>
            ))}

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Data Management</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {notificationSettingsConfig.map((setting) => (
              <div key={setting.key} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{setting.title}</h4>
                    <Switch 
                      checked={settings.notifications[setting.key as keyof typeof settings.notifications]}
                      onCheckedChange={(value) => updateSetting('notifications', setting.key, value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{setting.description}</p>
                  <Badge variant="outline" className="text-xs">
                    {setting.time}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Dark Mode</h4>
                <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
              </div>
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <Switch 
                  checked={settings.appearance.darkMode}
                  onCheckedChange={(value) => updateSetting('appearance', 'darkMode', value)}
                />
                <Moon className="h-4 w-4" />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Interface Density</h4>
              <div className="grid grid-cols-3 gap-2">
                {(['compact', 'comfortable', 'spacious'] as const).map((density) => (
                  <Button 
                    key={density}
                    variant={settings.appearance.interfaceDensity === density ? "default" : "outline"} 
                    size="sm"
                    onClick={() => updateSetting('appearance', 'interfaceDensity', density)}
                  >
                    {density.charAt(0).toUpperCase() + density.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Sound Effects</h4>
                <p className="text-sm text-muted-foreground">Play sounds for notifications and actions</p>
              </div>
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                <Switch 
                  checked={settings.appearance.soundEffects}
                  onCheckedChange={(value) => updateSetting('appearance', 'soundEffects', value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Advanced
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">Data Sync Frequency</h4>
              <div className="space-y-2">
                <Slider 
                  value={[settings.advanced.syncFrequency]} 
                  onValueChange={(value) => updateSetting('advanced', 'syncFrequency', value[0])}
                  max={300} 
                  min={10} 
                  step={10} 
                  className="w-full" 
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>10s</span>
                  <span>{settings.advanced.syncFrequency}s</span>
                  <span>5m</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Cache Management</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Storage Used</span>
                  <span>247 MB / 1 GB</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={clearCache}>
                    Clear Cache
                  </Button>
                  <Button variant="outline" size="sm">
                    Optimize
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Developer Mode</h4>
                <p className="text-sm text-muted-foreground">Enable advanced debugging features</p>
              </div>
              <Switch 
                checked={settings.advanced.developerMode}
                onCheckedChange={(value) => updateSetting('advanced', 'developerMode', value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium">Version</h4>
              <p className="text-sm text-muted-foreground">AI OS v2.1.4</p>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                Latest
              </Badge>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Last Sync</h4>
              <p className="text-sm text-muted-foreground">2 minutes ago</p>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                Healthy
              </Badge>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">AI Model</h4>
              <p className="text-sm text-muted-foreground">GPT-4 Optimized</p>
              <Badge variant="outline" className="bg-purple-100 text-purple-800">
                Enterprise
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}