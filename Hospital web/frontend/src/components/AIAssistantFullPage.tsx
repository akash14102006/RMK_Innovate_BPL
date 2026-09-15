import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Send, Bot, User as UserIcon, Sparkles, Trash2, Plus, MessageSquare, ArrowLeft, Mic, Square, Settings, Volume2, Shield, Smartphone, LogOut, CheckCircle2 } from 'lucide-react';
import { Card } from './ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { toast } from 'sonner';

interface Message {
  id: number;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: number;
  title: string;
  messages: Message[];
  timestamp: Date;
}

interface AIAssistantFullPageProps {
  onBack?: () => void;
}

export default function AIAssistantFullPage({ onBack }: AIAssistantFullPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 1,
      title: 'Welcome to Bharat PulseLink',
      messages: [
        {
          id: 1,
          sender: 'assistant',
          content: `# 👋 Welcome to Bharat PulseLink AI Assistant

I'm your intelligent healthcare prediction assistant. I can help you with:

## 🎯 What I Can Do:

**Patient Predictions:**
- Forecast patient loads for specific dates
- Analyze surge patterns
- Recommend optimal staffing

**Pollution & Health Analysis:**
- Real-time AQI monitoring
- Health impact predictions
- Respiratory case forecasting

**Festival Impact:**
- Festival-related patient surge predictions
- Preparation recommendations
- Resource allocation planning

**Epidemic Tracking:**
- Disease outbreak monitoring
- Alert generation
- Response planning

**Resource Optimization:**
- Staff allocation recommendations
- Bed capacity planning
- Supply chain insights

---

💡 **Try asking me:**
- "Predict patient load for tomorrow in Chennai"
- "What's the current AQI impact on health?"
- "How should I prepare for Diwali?"
- "Show me dengue outbreak trends"
- "Optimize staff allocation for next week"

How can I assist you today?`,
          timestamp: new Date(),
        },
      ],
      timestamp: new Date(),
    },
  ]);

  const [currentConversationId, setCurrentConversationId] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Settings states - Load from localStorage
  const [theme, setTheme] = useState(() => localStorage.getItem('ai-theme') || 'Light');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('ai-accent-color') || 'Default');
  const [language, setLanguage] = useState(() => localStorage.getItem('ai-language') || 'Auto-detect');
  const [spokenLanguage, setSpokenLanguage] = useState(() => localStorage.getItem('ai-spoken-language') || 'Auto-detect');
  const [voice, setVoice] = useState(() => localStorage.getItem('ai-voice') || 'Sol');
  const [mfaEnabled, setMfaEnabled] = useState(() => localStorage.getItem('ai-mfa') === 'true');

  const [availableModels, setAvailableModels] = useState<string[]>(['gpt-oss-safeguard']);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-oss-safeguard');

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/chat/models`);
        if (res.ok) {
          const data = await res.json();
          if (data.models && data.models.length > 0) {
            setAvailableModels(data.models);
            setSelectedModel(prev => data.models.includes(prev) ? prev : data.models[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch Ollama models:', err);
      }
    };
    fetchModels();
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  // Get accent color classes based on selected color
  const getAccentColorClasses = () => {
    const colorMap = {
      'Default': {
        bg: 'bg-teal-600',
        hover: 'hover:bg-teal-700',
        text: 'text-teal-600',
        gradient: 'from-teal-600 to-teal-400',
        border: 'border-teal-600',
      },
      'Blue': {
        bg: 'bg-blue-600',
        hover: 'hover:bg-blue-700',
        text: 'text-blue-600',
        gradient: 'from-blue-600 to-blue-400',
        border: 'border-blue-600',
      },
      'Green': {
        bg: 'bg-green-600',
        hover: 'hover:bg-green-700',
        text: 'text-green-600',
        gradient: 'from-green-600 to-green-400',
        border: 'border-green-600',
      },
      'Purple': {
        bg: 'bg-purple-600',
        hover: 'hover:bg-purple-700',
        text: 'text-purple-600',
        gradient: 'from-purple-600 to-purple-400',
        border: 'border-purple-600',
      },
      'Orange': {
        bg: 'bg-orange-600',
        hover: 'hover:bg-orange-700',
        text: 'text-orange-600',
        gradient: 'from-orange-600 to-orange-400',
        border: 'border-orange-600',
      },
    };
    return colorMap[accentColor as keyof typeof colorMap] || colorMap.Default;
  };

  const accentColors = getAccentColorClasses();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  // Auto-focus textarea
  useEffect(() => {
    textareaRef.current?.focus();
  }, [currentConversationId]);

  // Apply theme changes
  useEffect(() => {
    const rootElement = document.documentElement;

    // Remove all theme classes
    rootElement.classList.remove('dark', 'night');

    if (theme === 'Dark') {
      rootElement.classList.add('dark');
      toast.success('Theme changed to Dark mode', { duration: 2000 });
    } else if (theme === 'Night') {
      rootElement.classList.add('night');
      toast.success('Theme changed to Night mode', { duration: 2000 });
    } else if (theme === 'Light') {
      // Light mode is default, no class needed
      toast.success('Theme changed to Light mode', { duration: 2000 });
    } else if (theme === 'System') {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        rootElement.classList.add('dark');
      }
      toast.success('Theme set to System preference', { duration: 2000 });
    }

    // Save to localStorage
    localStorage.setItem('ai-theme', theme);
  }, [theme]);

  // Save other settings to localStorage with notifications
  useEffect(() => {
    const savedColor = localStorage.getItem('ai-accent-color');
    if (savedColor && savedColor !== accentColor) {
      toast.success(`Accent color changed to ${accentColor}`, { duration: 2000 });
    }
    localStorage.setItem('ai-accent-color', accentColor);
  }, [accentColor]);

  useEffect(() => {
    const savedLang = localStorage.getItem('ai-language');
    if (savedLang && savedLang !== language) {
      toast.success(`Language changed to ${language}`, { duration: 2000 });
    }
    localStorage.setItem('ai-language', language);
  }, [language]);

  useEffect(() => {
    const savedSpokenLang = localStorage.getItem('ai-spoken-language');
    if (savedSpokenLang && savedSpokenLang !== spokenLanguage) {
      toast.success(`Spoken language changed to ${spokenLanguage}`, { duration: 2000 });
    }
    localStorage.setItem('ai-spoken-language', spokenLanguage);
  }, [spokenLanguage]);

  useEffect(() => {
    const savedVoice = localStorage.getItem('ai-voice');
    if (savedVoice && savedVoice !== voice) {
      toast.success(`Voice changed to ${voice}`, { duration: 2000 });
    }
    localStorage.setItem('ai-voice', voice);
  }, [voice]);

  useEffect(() => {
    const savedMfa = localStorage.getItem('ai-mfa');
    if (savedMfa !== null && savedMfa !== mfaEnabled.toString()) {
      if (mfaEnabled) {
        toast.success('Multi-factor authentication enabled', {
          duration: 3000,
          description: 'Your account is now more secure'
        });
      } else {
        toast.warning('Multi-factor authentication disabled', {
          duration: 3000,
          description: 'Consider enabling MFA for better security'
        });
      }
    }
    localStorage.setItem('ai-mfa', mfaEnabled.toString());
  }, [mfaEnabled]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingTime(0);
    }
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  const handleSend = async () => {
    if (!inputValue.trim() || !currentConversation) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setConversations(prev => prev.map(conv =>
      conv.id === currentConversationId
        ? { ...conv, messages: [...conv.messages, userMessage] }
        : conv
    ));

    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentInput, model: selectedModel }),
      });

      if (!response.ok) {
        throw new Error('Failed connecting to AI assistant service.');
      }

      // Add a placeholder message for the assistant
      const assistantMessageId = Date.now() + 1;
      let assistantContent = '';

      setConversations(prev => prev.map(conv =>
        conv.id === currentConversationId
          ? {
            ...conv,
            messages: [...conv.messages, {
              id: assistantMessageId,
              sender: 'assistant',
              content: '',
              timestamp: new Date()
            }],
            title: conv.messages.length === 1 ? currentInput.slice(0, 30) + '...' : conv.title
          }
          : conv
      ));

      setIsTyping(false);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunkText = decoder.decode(value, { stream: true });
          assistantContent += chunkText;

          setConversations(prev => prev.map(conv =>
            conv.id === currentConversationId
              ? {
                ...conv,
                messages: conv.messages.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: assistantContent }
                    : msg
                )
              }
              : conv
          ));
        }
      }
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: 'assistant',
        content: "I'm currently unable to connect to the offline AI model. Please ensure the backend and local Ollama instance are running.",
        timestamp: new Date(),
      };

      setConversations(prev => prev.map(conv =>
        conv.id === currentConversationId
          ? { ...conv, messages: [...conv.messages, errorMessage] }
          : conv
      ));
    } finally {
      setIsTyping(false);
    }
  };

  const generateAIResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();

    // Patient prediction queries
    if (lowerInput.includes('predict') && (lowerInput.includes('patient') || lowerInput.includes('load'))) {
      const city = extractCity(input) || 'Chennai';
      return `# 📊 Patient Load Prediction for ${city}

## Tomorrow's Forecast:
- **Expected patients:** 340
- **Surge percentage:** +12%
- **Peak hours:** 10 AM - 2 PM

## Contributing Factors:
- 🌫️ AQI Level: 185 (Moderate)
- 🌡️ Temperature: 32°C
- 📅 No major festivals

## Recommended Actions:
✅ Deploy **45 nurses** (8 additional)
✅ Ensure **8 doctors** on duty
✅ Prepare **12 extra beds** in general ward
✅ Stock respiratory medications

## Department Breakdown:
- Emergency: 120 patients (35%)
- Respiratory: 85 patients (25%)
- General: 95 patients (28%)
- Pediatrics: 40 patients (12%)

Would you like me to generate a detailed PDF report?`;
    }

    // AQI and pollution queries
    if (lowerInput.includes('aqi') || lowerInput.includes('pollution') || lowerInput.includes('air quality')) {
      return `# 🌫️ Air Quality & Health Impact Analysis

## Current Status:
- **Chennai AQI:** 90 (Satisfactory)
- **Mumbai AQI:** 156 (Moderate)
- **Bangalore AQI:** 87 (Satisfactory)

## 7-Day Forecast:
- Today: 218
- Tomorrow: 245
  - Nov 21: 268 (Peak)
  - Nov 22: 285
  - Nov 23: 295
  - Nov 24: 278
  - Nov 25: 252

## Health Impact Prediction:
- **Respiratory cases:** +42% increase expected
- **Asthma emergencies:** +35%
- **COPD admissions:** +28%

## Critical Recommendations:
🔴 **Immediate Actions:**
- Stock extra oxygen cylinders (20+ units)
- Prepare ICU beds for severe cases
- Deploy 3 additional pulmonologists
- Setup air purifiers in respiratory wards

🟡 **Preventive Measures:**
- Issue health advisories to high-risk patients
- Postpone non-urgent outdoor activities
- Prepare N95 masks for distribution

The worst pollution is expected on **Nov 23**. Prepare accordingly!`;
    }

    // Festival impact queries
    if (lowerInput.includes('festival') || lowerInput.includes('diwali') || lowerInput.includes('holiday')) {
      return `# 🎆 Festival Impact Analysis - Diwali 2026

## Festival Details:
- **Date:** November 8, 2026 (Sunday)
- **Expected surge:** +42%
- **Critical preparation period:** Nov 5-10

## Predicted Patient Surge:
📈 **Total increase:** 220 additional patients/day

### By Department:
- 🚑 **Emergency:** +35% (Burns, injuries)
- 🫁 **Respiratory:** +65% (Pollution spikes)
- 👶 **Pediatrics:** +28% (Firecracker injuries)
- 🏥 **General Ward:** +25%

## Resource Requirements:

### Staffing:
- ✅ +16 nurses (across all departments)
- ✅ +4 doctors (Emergency + Respiratory)
- ✅ Double night shift staff (Oct 29-30)

### Supplies:
- 🔥 **Burn treatment kits:** 30 units
- 💊 **Respiratory medications:** 2x stock
- 🛏️ **Extra beds:** Prepare 20 additional
- 💉 **IV fluids:** 50% increase
- 😷 **N95 masks:** 500 units

### Equipment:
- Nebulizers: Ensure all functional
- Oxygen concentrators: Test and calibrate
- Cardiac monitors: 5 additional on standby

## Preparation Checklist:
- [x] Staff roster confirmed
- [x] Emergency supplies ordered
- [ ] Burn unit deep cleaned
- [ ] Additional ICU beds prepared
- [ ] Blood bank notified
- [ ] Ambulances on standby

**Current Progress:** 65% complete

Should I create a detailed preparation timeline?`;
    }

    // Epidemic and disease queries
    if (lowerInput.includes('epidemic') || lowerInput.includes('dengue') || lowerInput.includes('disease') || lowerInput.includes('outbreak')) {
      return `# ⚠️ Epidemic Monitoring Dashboard

## Current Outbreaks:

### 🦟 Dengue Fever - HIGH ALERT
- **Total cases:** 1,284
- **Weekly change:** +18% ↑
- **Mortality rate:** 0.8%
- **Peak months:** Aug-Nov

**Affected Regions:**
- Maharashtra: 456 cases
- Delhi: 328 cases
- Tamil Nadu: 210 cases
- Karnataka: 178 cases
- Others: 112 cases

**Critical Actions Required:**
🔴 Immediate:
- Stock platelet concentrates (50+ units)
- Deploy vector control teams
- Setup dedicated dengue wards (15 beds)
- NS1 antigen test kits (200 units)

### 🫁 Respiratory Infections - MODERATE
- **Cases:** 856
- **Trend:** Stable
- **Primary cause:** Air pollution

### 🤒 Seasonal Flu - LOW
- **Cases:** 324
- **Trend:** Declining (-8%)

## Predictive Analysis:
📊 Next 2 weeks forecast:
- Dengue cases expected to reach **1,500**
- Respiratory cases may increase **15%** due to pollution
- Peak expected: **Nov 5-10**

## Recommended Response Plan:

**Phase 1 (Immediate - 48hrs):**
- Activate epidemic response team
- Setup isolation wards
- Brief all staff on protocols

**Phase 2 (Week 1):**
- Mass awareness campaign
- Community health screenings
- Mosquito fogging in affected areas

**Phase 3 (Week 2-4):**
- Monitor case trends
- Adjust resource allocation
- Evaluate response effectiveness

Would you like detailed protocol guidelines?`;
    }

    // Staff allocation queries
    if (lowerInput.includes('staff') || lowerInput.includes('allocation') || lowerInput.includes('nurse') || lowerInput.includes('doctor')) {
      return `# 👥 Staff Allocation Optimization

## Current Status:
- **Total staff:** 52
- **Required for next week:** 68
- **Shortage:** 16 additional staff needed

## Department-wise Analysis:

### Emergency Department
- Current: 12 staff
- Required: 18 staff
- Shortage: **6 staff** ❗
- Recommendation: Deploy from general ward

### ICU
- Current: 8 staff
- Required: 10 staff
- Shortage: **2 staff**
- Specialization needed: Critical care nurses

### Respiratory Ward
- Current: 10 staff
- Required: 15 staff
- Shortage: **5 staff** ❗
- Urgency: HIGH (due to pollution)

### General Ward
- Current: 15 staff
- Required: 18 staff
- Shortage: **3 staff**
- Can absorb from other departments

### Pediatrics
- Current: 7 staff
- Adequate for current load

## Optimization Strategy:

### Immediate (24-48 hours):
✅ **Redeploy 3 nurses** from Pediatrics to Emergency
✅ **Call in 6 part-time staff** for weekend
✅ **Extend shifts** for 4 senior nurses (with compensation)

### Short-term (1 week):
📋 **Hire temporary staff:** 10 nurses
📋 **Schedule overtime:** 6 existing staff

### Long-term (1 month):
📈 **Permanent recruitment:** 16 positions
📈 **Cross-training program:** 20 staff members

## Shift Schedule Optimization:

**Peak Hours Coverage (10 AM - 2 PM):**
- Emergency: 8 staff
- Respiratory: 6 staff
- ICU: 4 staff

**Night Shift (10 PM - 6 AM):**
- Minimum 50% staffing
- Senior staff on-call

## Cost Analysis:
- Additional staff cost: ₹4.8L/week
- Overtime cost: ₹1.2L/week
- **Total:** ₹6L/week
- **vs Patient care quality:** Worth the investment ✅

Shall I generate detailed shift rosters?`;
    }

    // Help and general queries
    if (lowerInput.includes('help') || lowerInput.includes('what can you') || lowerInput.includes('how to')) {
      return `# 💡 How to Use Bharat PulseLink AI Assistant

## Quick Commands:

### Patient Predictions
- "Predict patient load for [city] [date]"
- "Show me tomorrow's patient forecast"
- "What's the expected surge next week?"

### Pollution Analysis
- "What's the current AQI?"
- "Show pollution forecast"
- "Health impact of today's AQI"

### Festival Planning
- "Diwali preparation needed"
- "Festival impact analysis"
- "How to prepare for [festival]?"

### Epidemic Monitoring
- "Show dengue outbreak status"
- "Current epidemic alerts"
- "Disease surveillance report"

### Resource Management
- "Staff allocation recommendations"
- "Bed occupancy status"
- "Inventory levels"
- "Resource requirements"

## Tips for Better Results:

✅ **Be specific:** "Predict patients for Chennai tomorrow"
❌ **Too vague:** "Tell me about patients"

✅ **Include context:** "Staff needed for festival week"
❌ **Too broad:** "Staff info"

✅ **Ask follow-ups:** "Show detailed breakdown"
✅ **Request customization:** "Focus on respiratory cases"

## Advanced Features:

- 🔄 **Real-time data:** Connected to live APIs
- 📊 **Trend analysis:** Historical pattern recognition
- 🎯 **Predictive models:** AI-powered forecasting
- 📈 **Custom reports:** Tailored to your needs

What would you like to explore?`;
    }

    // Default response
    return `I understand you're asking about "${input}". 

I can provide detailed insights on:

- 📊 Patient load predictions
- 🌫️ Pollution and AQI analysis
- 🎆 Festival impact forecasting
- ⚠️ Epidemic tracking
- 👥 Staff optimization
- 🛏️ Bed capacity management
- 📦 Resource allocation

Could you please be more specific about what you'd like to know? For example:
- "Predict patient load for tomorrow"
- "Show current AQI impact"
- "Analyze Diwali preparations"
- "Staff requirements for next week"

How can I assist you?`;
  };

  const extractCity = (input: string): string | null => {
    const cities = ['delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'ahmedabad'];
    const lowerInput = input.toLowerCase();
    for (const city of cities) {
      if (lowerInput.includes(city)) {
        return city.charAt(0).toUpperCase() + city.slice(1);
      }
    }
    return null;
  };

  const newConversation = () => {
    const newId = Date.now();
    const newConv: Conversation = {
      id: newId,
      title: 'New Chat',
      messages: [
        {
          id: 1,
          sender: 'assistant',
          content: "Hello! I'm ready to assist you with healthcare predictions and analysis. What would you like to know?",
          timestamp: new Date(),
        },
      ],
      timestamp: new Date(),
    };
    setConversations([...conversations, newConv]);
    setCurrentConversationId(newId);
  };

  const deleteConversation = (id: number) => {
    if (conversations.length === 1) return; // Keep at least one conversation

    const filtered = conversations.filter(c => c.id !== id);
    setConversations(filtered);

    if (currentConversationId === id) {
      setCurrentConversationId(filtered[0].id);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        // Simulate voice to text conversion
        const transcription = "Voice message recorded: This is a simulated transcription of your voice message.";
        setInputValue(transcription);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      // Silent fail - user denied permission or microphone not available
      // In production, this would show a toast notification instead of console error
      if (error instanceof Error && error.name !== 'NotAllowedError') {
        console.error('Error accessing microphone:', error);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playVoiceSample = () => {
    // Simulate playing voice sample with current voice
    const voiceDescriptions = {
      'Sol': 'a warm, professional female voice',
      'Luna': 'a gentle, calming female voice',
      'Nova': 'an energetic, clear male voice',
      'Echo': 'a deep, authoritative male voice',
    };
    const description = voiceDescriptions[voice as keyof typeof voiceDescriptions] || 'the selected voice';
    alert(`🔊 Playing sample of ${voice} - ${description}\n\n"Hello, I'm your Bharat PulseLink Assistant. I'm here to help you with healthcare predictions and analysis."`);
  };

  const handleLogout = () => {
    alert('Logging out from current device...');
  };

  const handleLogoutAll = () => {
    if (confirm('Are you sure you want to log out from all devices? This may take up to 30 minutes.')) {
      alert('Logging out from all devices...');
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border space-y-2">
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          )}
          <Button
            onClick={newConversation}
            className={`w-full ${accentColors.bg} ${accentColors.hover}`}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => setCurrentConversationId(conv.id)}
              className={`w-full text-left p-3 rounded-lg mb-2 transition-colors group ${conv.id === currentConversationId
                ? `${accentColors.bg} text-white`
                : 'hover:bg-secondary'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm truncate">{conv.title}</span>
                </div>
                {conversations.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className={`p-1 rounded hover:bg-red-500 hover:text-white transition-colors ${conv.id === currentConversationId ? 'text-white' : 'text-gray-400'
                      } opacity-0 group-hover:opacity-100`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className={`text-xs mt-1 ${conv.id === currentConversationId ? 'text-white opacity-75' : 'text-gray-500'
                }`}>
                {conv.timestamp.toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${accentColors.gradient} rounded-full flex items-center justify-center`}>
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-sm">Bharat PulseLink</div>
              <div className="text-xs text-gray-500">Always online</div>
            </div>
          </div>

          <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Chatbot Settings</SheetTitle>
                <SheetDescription>
                  Customize your AI Assistant preferences and security settings
                </SheetDescription>
              </SheetHeader>

              <Tabs defaultValue="general" className="mt-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6 mt-6">
                  {/* Theme */}
                  <div className="space-y-3">
                    <Label>Theme</Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="System">System</SelectItem>
                        <SelectItem value="Light">Light</SelectItem>
                        <SelectItem value="Dark">Dark</SelectItem>
                        <SelectItem value="Night">Night</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Accent Color */}
                  <div className="space-y-3">
                    <Label>Accent color</Label>
                    <Select value={accentColor} onValueChange={setAccentColor}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Default">Default</SelectItem>
                        <SelectItem value="Blue">Blue</SelectItem>
                        <SelectItem value="Green">Green</SelectItem>
                        <SelectItem value="Purple">Purple</SelectItem>
                        <SelectItem value="Orange">Orange</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Language */}
                  <div className="space-y-3">
                    <Label>Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Auto-detect">Auto-detect</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Hindi">Hindi</SelectItem>
                        <SelectItem value="Spanish">Spanish</SelectItem>
                        <SelectItem value="French">French</SelectItem>
                        <SelectItem value="German">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Spoken Language */}
                  <div className="space-y-3">
                    <Label>Spoken language</Label>
                    <p className="text-xs text-muted-foreground">
                      For best results, select the language you mainly speak. If it's not listed, it may still be supported via auto-detection.
                    </p>
                    <Select value={spokenLanguage} onValueChange={setSpokenLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Auto-detect">Auto-detect</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Hindi">Hindi</SelectItem>
                        <SelectItem value="Spanish">Spanish</SelectItem>
                        <SelectItem value="French">French</SelectItem>
                        <SelectItem value="Mandarin">Mandarin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Voice */}
                  <div className="space-y-3">
                    <Label>Voice</Label>
                    <div className="flex gap-2">
                      <Select value={voice} onValueChange={setVoice}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sol">Sol</SelectItem>
                          <SelectItem value="Luna">Luna</SelectItem>
                          <SelectItem value="Nova">Nova</SelectItem>
                          <SelectItem value="Echo">Echo</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={playVoiceSample} variant="outline" size="icon">
                        <Volume2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-6 mt-6">
                  {/* Multi-factor Authentication */}
                  <div className="space-y-3">
                    <Label>Multi-factor authentication</Label>
                    <p className="text-xs text-muted-foreground">
                      Require an extra security challenge when logging in. If you are unable to pass this challenge, you will have the option to recover your account via email.
                    </p>
                    <div className="flex items-center justify-between bg-secondary p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className={`w-4 h-4 ${accentColors.text}`} />
                        <span className="text-sm">Enable MFA</span>
                      </div>
                      <Switch checked={mfaEnabled} onCheckedChange={setMfaEnabled} />
                    </div>
                  </div>

                  <Separator />

                  {/* Trusted Devices */}
                  <div className="space-y-3">
                    <Label>Trusted Devices</Label>
                    <p className="text-xs text-muted-foreground">
                      When you sign in on another device, it will be added here and can automatically receive device prompts for signing in.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 bg-secondary p-3 rounded-lg">
                        <Smartphone className={`w-5 h-5 ${accentColors.text}`} />
                        <div className="flex-1">
                          <div className="text-sm">Current Device</div>
                          <div className="text-xs text-muted-foreground">Last active: Just now</div>
                        </div>
                        <Button onClick={handleLogout} variant="destructive" size="sm">
                          Log out
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Log out of all devices */}
                  <div className="space-y-3">
                    <Label>Log out of all devices</Label>
                    <p className="text-xs text-muted-foreground">
                      Log out of all active sessions across all devices, including your current session. It may take up to 30 minutes for other devices to be logged out.
                    </p>
                    <Button
                      onClick={handleLogoutAll}
                      variant="destructive"
                      className="w-full"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Log out all
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${accentColors.gradient} rounded-full flex items-center justify-center`}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg">Bharat PulseLink AI Assistant</h1>
                <p className="text-sm text-gray-500">Intelligent Healthcare Prediction System</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 hidden sm:inline-block">Ollama Model:</span>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-[180px] h-9 text-xs">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map(model => (
                    <SelectItem key={model} value={model} className="text-xs">
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentConversation?.messages.map(message => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'assistant' && (
                <div className={`w-8 h-8 bg-gradient-to-br ${accentColors.gradient} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <Card className={`max-w-3xl p-4 ${message.sender === 'user'
                ? `${accentColors.bg} text-white`
                : 'bg-card'
                }`}>
                <div className={`prose prose-sm max-w-none ${message.sender === 'user' ? 'prose-invert' : ''
                  }`}>
                  {message.content.split('\n').map((line, i) => {
                    // Handle markdown-style formatting
                    if (line.startsWith('# ')) {
                      return <h2 key={i} className="text-lg mt-4 mb-2">{line.slice(2)}</h2>;
                    } else if (line.startsWith('## ')) {
                      return <h3 key={i} className="text-base mt-3 mb-1">{line.slice(3)}</h3>;
                    } else if (line.startsWith('### ')) {
                      return <h4 key={i} className="text-sm mt-2 mb-1">{line.slice(4)}</h4>;
                    } else if (line.startsWith('- ')) {
                      return <li key={i} className="ml-4">{line.slice(2)}</li>;
                    } else if (line.startsWith('```')) {
                      return null; // Skip code fence markers
                    } else if (line === '---') {
                      return <hr key={i} className="my-4 border-border" />;
                    } else if (line.trim()) {
                      return <p key={i} className="mb-2">{line}</p>;
                    }
                    return <br key={i} />;
                  })}
                </div>
                <div className={`text-xs mt-2 ${message.sender === 'user' ? 'text-teal-100' : 'text-gray-500'
                  }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </Card>

              {message.sender === 'user' && (
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-teal-400 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <Card className="p-4">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-card p-4">
          <div className="max-w-4xl mx-auto">
            {/* Recording indicator */}
            {isRecording && (
              <div className="mb-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-red-700 dark:text-red-300">Recording...</span>
                    <span className="text-sm text-red-600 dark:text-red-400">{formatRecordingTime(recordingTime)}</span>
                  </div>
                  <Button
                    onClick={stopRecording}
                    size="sm"
                    variant="destructive"
                  >
                    <Square className="w-4 h-4 mr-1" />
                    Stop
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-3 items-end">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about patient predictions, AQI analysis, festival planning, or resource management..."
                className="min-h-[60px] max-h-[200px] resize-none"
                rows={2}
                disabled={isRecording}
              />
              <div className="flex gap-2">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`h-[60px] px-4 ${isRecording
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  title={isRecording ? 'Stop recording' : 'Start voice message'}
                >
                  {isRecording ? (
                    <Square className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping || isRecording}
                  className={`${accentColors.bg} ${accentColors.hover} h-[60px] px-6`}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send • Shift+Enter for new line • Click mic for voice message
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
/* updated */
