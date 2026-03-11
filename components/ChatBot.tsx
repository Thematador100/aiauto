import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { voiceToTextService } from '../services/voiceToTextService';
import { textToSpeechService } from '../services/textToSpeechService';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  fallback?: boolean;
}

/**
 * AI Chat Assistant with voice input/output
 * - Multi-provider backend (Gemini -> DeepSeek -> OpenAI)
 * - Voice dictation via Web Speech API (mic button)
 * - Text-to-speech for AI responses (listen button)
 * - Self-healing with fallback messages
 */
export const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([{
    id: Date.now(),
    role: 'assistant',
    content: "Hello! I'm your AI automotive assistant. I can help with:\n\n\u2022 Vehicle maintenance questions\n\u2022 Diagnostic code explanations (OBD-II & J1939)\n\u2022 Repair recommendations\n\u2022 Inspection guidance\n\nTap the mic to speak, or type your question below."
  }]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [voiceSupported] = useState(() => voiceToTextService.isSupported());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: text.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);
    inputRef.current?.focus();

    try {
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const { response, fallback } = await sendChatMessage(userMessage.content, history);

      const aiMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response,
        fallback
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: "I encountered an unexpected error. Please try:\n\n1. Refreshing the page\n2. Checking your internet connection\n3. Using the other tools in the app\n\nYour inspection data is safe and auto-saved.",
        fallback: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(userInput);
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      voiceToTextService.stopListening();
      setIsListening(false);
      if (userInput.trim()) {
        setTimeout(() => sendMessage(userInput), 150);
      }
    } else {
      const started = voiceToTextService.startListening(
        (result) => {
          setUserInput(result.transcript);
          if (result.isFinal) {
            voiceToTextService.stopListening();
            setIsListening(false);
            setTimeout(() => sendMessage(result.transcript), 150);
          }
        },
        (error) => {
          console.error('Voice error:', error);
          setIsListening(false);
        }
      );
      setIsListening(started);
    }
  };

  const speakMessage = (messageId: number, text: string) => {
    if (speakingId === messageId) {
      textToSpeechService.stop();
      setSpeakingId(null);
    } else {
      textToSpeechService.stop();
      setSpeakingId(messageId);
      textToSpeechService.speakWithAPI(text, { voice: 'echo' }).finally(() => {
        setSpeakingId(null);
      });
    }
  };

  return (
    <div className="flex flex-col bg-dark-bg text-light-text" style={{ minHeight: '70vh' }}>
      {/* Header */}
      <div className="bg-dark-card border-b border-dark-border p-4">
        <h2 className="text-xl font-semibold flex items-center gap-2 flex-wrap">
          <span>🤖</span>
          <span>AI Assistant</span>
          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Multi-AI</span>
          {voiceSupported && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Voice</span>
          )}
        </h2>
        <p className="text-sm text-medium-text mt-1">
          Powered by Gemini, DeepSeek & OpenAI — Voice input & output enabled
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary text-white'
                  : message.fallback
                  ? 'bg-yellow-900/30 border border-yellow-500/50 text-yellow-100'
                  : 'bg-dark-card text-light-text'
              }`}
            >
              {message.fallback && (
                <div className="text-xs text-yellow-300 mb-2 flex items-center gap-1">
                  <span>&#9888;&#65039;</span>
                  <span>Fallback Mode</span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.role === 'assistant' && (
                <button
                  onClick={() => speakMessage(message.id, message.content)}
                  className="mt-2 text-xs text-medium-text hover:text-primary transition-colors flex items-center gap-1"
                  title="Read aloud"
                >
                  {speakingId === message.id ? '\u23F9 Stop' : '\uD83D\uDD0A Listen'}
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-dark-card rounded-lg p-3 flex items-center gap-2">
              <LoadingSpinner />
              <span className="text-medium-text">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-dark-card border-t border-dark-border">
        <div className="flex gap-2">
          {voiceSupported && (
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`px-3 py-2 rounded-lg font-semibold transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-dark-bg text-medium-text hover:text-light-text hover:bg-dark-border'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              🎤
            </button>
          )}
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={isListening ? 'Listening... speak now' : 'Ask about your vehicle...'}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-light-text placeholder-medium-text focus:outline-none focus:border-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !userInput.trim()}
            className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-medium-text mt-2">
          {isListening
            ? '🔴 Listening... tap mic to stop and send'
            : '🎤 Tap mic for voice \u00B7 🔊 Tap listen on any reply \u00B7 Multi-AI fallback enabled'}
        </p>
      </form>
    </div>
  );
};
