import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { X, Send, Bot, User as UserIcon } from 'lucide-react';
import { useState } from 'react';

interface ChatbotAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export default function ChatbotAssistant({ isOpen, onToggle }: ChatbotAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'bot',
      text: "👋 Hi! I'm Healy AI Assistant. I can help you predict patient loads, analyze trends, and provide health advisories. Try asking: 'Predict tomorrow's patient load in Chennai'",
      timestamp: '10:30 AM',
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      sender: 'user',
      text: inputValue,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, userMessage]);

    // Simulate bot response based on input
    setTimeout(() => {
      let botResponse = '';
      const input = inputValue.toLowerCase();

      if (input.includes('predict') || input.includes('patient load')) {
        botResponse = "📊 Based on current data:\n\n• Chennai patient load tomorrow: 340 patients\n• Expected surge: +12% (due to moderate AQI levels)\n• Recommended staff: 45 nurses, 8 doctors\n\nWould you like me to generate a detailed report?";
      } else if (input.includes('aqi') || input.includes('pollution')) {
        botResponse = "🌫️ Current pollution status:\n\n• Chennai AQI: 90 (Satisfactory)\n• Peak forecast: 120 on Nov 21\n• Health impact: Minimal respiratory impact\n\nAir quality is good. Continue regular operations.";
      } else if (input.includes('festival') || input.includes('diwali')) {
        botResponse = "🎆 Diwali Impact Analysis:\n\n• Date: Nov 8, 2026\n• Expected surge: +42%\n• Critical preparations needed:\n  - Deploy +16 nurses\n  - Stock burn treatment kits\n  - Prepare 20 extra beds\n\nPreparation checklist is 65% complete.";
      } else if (input.includes('epidemic') || input.includes('dengue')) {
        botResponse = "⚠️ Epidemic Status:\n\n• Dengue: 1,284 cases (HIGH alert)\n• Weekly change: +18%\n• Affected regions: Maharashtra, Tamil Nadu\n\nRecommendations:\n• Stock platelet units\n• Deploy mosquito control\n• Setup dedicated dengue wards";
      } else if (input.includes('staff') || input.includes('allocation')) {
        botResponse = "👥 Staff Allocation Insights:\n\n• Current staff: 52\n• Required for festival week: 68\n• Shortage: 16 additional staff needed\n\nOptimal deployment:\n• +12 nurses (Emergency & ICU)\n• +4 doctors (Respiratory specialists)";
      } else {
        botResponse = "I can help you with:\n\n• Patient load predictions\n• Pollution and AQI analysis\n• Festival impact forecasting\n• Epidemic tracking\n• Staff allocation recommendations\n\nWhat would you like to know?";
      }

      const botMessage: Message = {
        id: messages.length + 2,
        sender: 'bot',
        text: botResponse,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMessage]);
    }, 1000);

    setInputValue('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] z-50 shadow-2xl">
      <Card className="h-full flex flex-col border-2 border-teal-200">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-teal-600 to-teal-400 text-white rounded-t-xl pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">Healy AI Assistant</CardTitle>
                <div className="text-xs text-teal-100">Online • Ready to help</div>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="w-8 h-8 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>

        {/* Chat Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.sender === 'bot'
                  ? 'bg-gradient-to-br from-teal-600 to-teal-400'
                  : 'bg-gradient-to-br from-blue-600 to-blue-400'
                  }`}
              >
                {message.sender === 'bot' ? (
                  <Bot className="w-5 h-5 text-white" />
                ) : (
                  <UserIcon className="w-5 h-5 text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div className={`flex-1 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                <div
                  className={`inline-block max-w-[85%] px-4 py-2 rounded-2xl ${message.sender === 'bot'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'bg-gradient-to-r from-teal-600 to-teal-500 text-white'
                    }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                </div>
                <div className="text-xs text-gray-500 mt-1 px-2">{message.timestamp}</div>
              </div>
            </div>
          ))}
        </CardContent>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
          <div className="flex gap-2">
            <Input
              placeholder="Ask me anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Suggestions */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setInputValue("Predict tomorrow's patient load in Chennai")}
              className="px-3 py-1 text-xs bg-teal-50 text-teal-700 rounded-full hover:bg-teal-100 transition-colors"
            >
              Predict patient load
            </button>
            <button
              onClick={() => setInputValue('Current AQI status')}
              className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
            >
              AQI status
            </button>
            <button
              onClick={() => setInputValue('Diwali preparation checklist')}
              className="px-3 py-1 text-xs bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
            >
              Festival prep
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* updated */
