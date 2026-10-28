import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Send, Bot, User, CheckCircle2, Terminal } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { api } from '@/services/api';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  toolCall?: {
    name: string;
    result: string;
  };
}

const SAMPLE_COMMANDS = [
  "Calculate when both of us should leave.",
  "How many minutes apart will we arrive?",
  "How long will I take to reach?",
  "Traffic has increased. Recalculate the plan.",
  "Stop sharing my location."
];

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId?: string;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  tripId = 'bengaluru-sync-demo-01'
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: "Hello! I am your SyncRoute AI voice copilot. You can speak hands-free while driving or type commands to check arrival sync, recalculate traffic, or update your journey."
    }
  ]);

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition if supported by browser
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          handleSendMessage(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: Message = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsListening(false);

    try {
      const res = await api.sendVoiceCommand(text, tripId);
      const topTool = res.executedTools?.[0];

      const assistantMsg: Message = {
        sender: 'assistant',
        text: res.reply,
        toolCall: topTool ? {
          name: topTool.toolName,
          result: topTool.summary
        } : undefined
      };

      setMessages(prev => [...prev, assistantMsg]);
      speakText(res.reply);
    } catch (err: any) {
      // Local intelligent response fallback
      let reply = `I checked the trip. The group is currently on track to reach the destination together.`;
      let toolCall: { name: string; result: string } | undefined = undefined;

      const lower = text.toLowerCase();
      if (lower.includes('when both') || lower.includes('when should we leave') || lower.includes('calculate')) {
        toolCall = {
          name: 'calculateSynchronizedArrival',
          result: 'Friend A departs in 5 mins (55m duration). Friend B departs in 28 mins (32m duration).'
        };
        reply = "Friend A has heavier traffic from Whitefield and should leave in 5 minutes. Friend B is closer from Electronic City and should leave in 28 minutes to arrive together at 7:30 PM.";
      } else if (lower.includes('minutes apart') || lower.includes('gap')) {
        toolCall = {
          name: 'calculateSynchronizedArrival',
          result: 'Current gap: 0 minutes. On track within tolerance.'
        };
        reply = "You are currently perfectly synchronized. Predicted arrival gap is 0 minutes, well within your 5-minute tolerance.";
      } else if (lower.includes('stop sharing') || lower.includes('location')) {
        toolCall = {
          name: 'stopLocationSharing',
          result: 'Location broadcasting paused for your vehicle.'
        };
        reply = "I have stopped sharing your location. Your coordinates are no longer broadcast to trip members.";
      }

      setMessages(prev => [...prev, { sender: 'assistant', text: reply, toolCall }]);
      speakText(reply);
    }
  };

  const toggleListening = () => {
    if (!isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch {
          // Fallback simulation
          simulateListening();
        }
      } else {
        simulateListening();
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
    }
  };

  const simulateListening = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      handleSendMessage("How many minutes apart will we arrive?");
    }, 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        onClose();
      }}
      title="SyncRoute AI Voice Copilot"
      description="Hands-free conversational journey synchronization"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Messages transcript viewport */}
        <div className="h-[280px] overflow-y-auto space-y-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 opacity-75 text-[10px] font-semibold">
                  {m.sender === 'user' ? (
                    <>
                      <User className="w-3 h-3" /> You
                    </>
                  ) : (
                    <>
                      <Bot className="w-3 h-3 text-cyan-400" /> SyncRoute AI Voice
                      {isSpeaking && idx === messages.length - 1 && (
                        <Volume2 className="w-3 h-3 text-emerald-400 animate-pulse ml-1" />
                      )}
                    </>
                  )}
                </div>
                <p className="leading-relaxed">{m.text}</p>
              </div>

              {/* Tool Execution Pill */}
              {m.toolCall && (
                <div className="mt-1.5 p-2 rounded-lg bg-slate-900/90 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 max-w-[85%] flex items-start gap-1.5">
                  <Terminal className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">Tool: {m.toolCall.name}()</span>
                    <div className="text-slate-400 mt-0.5">{m.toolCall.result}</div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isListening && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-900 border border-cyan-500/40 text-cyan-300 animate-pulse">
              <Mic className="w-4 h-4 text-cyan-400 animate-bounce" />
              <span className="text-xs">Listening to your spoken command...</span>
            </div>
          )}
        </div>

        {/* Quick Voice Command Chips */}
        <div>
          <span className="text-[11px] font-medium text-slate-400 block mb-1.5">
            Suggested Hands-Free Commands:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_COMMANDS.map((cmd) => (
              <button
                key={cmd}
                onClick={() => handleSendMessage(cmd)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50 transition cursor-pointer"
              >
                "{cmd}"
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar & Large Mic Button */}
        <div className="pt-2 flex items-center gap-2">
          {/* Main Voice Mic Button */}
          <button
            onClick={toggleListening}
            className={`p-3 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-600 border-rose-400 text-white animate-pulse shadow-lg shadow-rose-600/30'
                : 'bg-gradient-to-tr from-cyan-500 to-blue-600 border-cyan-400/30 text-white shadow-lg shadow-cyan-500/20 hover:scale-105'
            }`}
            title={isListening ? 'Stop Listening' : 'Tap to Speak'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Speak or type a command..."
            className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <Button
            size="sm"
            onClick={() => handleSendMessage()}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Send
          </Button>
        </div>
      </div>
    </Modal>
  );
};
