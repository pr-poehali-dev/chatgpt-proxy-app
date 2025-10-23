import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('https://functions.poehali.dev/ff770441-fe4b-414a-8fd3-952a5110c656', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input })
      });

      let errorMessage = 'Ошибка при отправке сообщения';
      
      if (response.status === 402) {
        errorMessage = 'Достигнут лимит вызовов. Обновите подписку на poehali.dev/p/pay';
      }

      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { error: text || errorMessage };
      }

      if (!response.ok) {
        throw new Error(data.error || errorMessage);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось отправить сообщение',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Icon name="MessageSquare" size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">ChatGPT Proxy</h1>
            <p className="text-sm text-slate-500">Общение с AI через прокси</p>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
                <Icon name="Sparkles" size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Начните общение</h2>
              <p className="text-slate-500">Задайте любой вопрос ChatGPT</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 animate-fade-in ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <Avatar className="w-9 h-9 flex-shrink-0">
                  <div
                    className={`w-full h-full flex items-center justify-center ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-slate-600 to-slate-700'
                        : 'bg-gradient-to-br from-blue-500 to-blue-600'
                    }`}
                  >
                    <Icon
                      name={message.role === 'user' ? 'User' : 'Bot'}
                      size={18}
                      className="text-white"
                    />
                  </div>
                </Avatar>
                <Card
                  className={`px-4 py-3 max-w-[75%] ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-slate-900 border-slate-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <span
                    className={`text-xs mt-2 block ${
                      message.role === 'user' ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </Card>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3 animate-fade-in">
              <Avatar className="w-9 h-9 flex-shrink-0">
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
                  <Icon name="Bot" size={18} className="text-white" />
                </div>
              </Avatar>
              <Card className="px-4 py-3 bg-white border-slate-200">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 px-4 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введите сообщение..."
            disabled={isLoading}
            className="flex-1 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6"
          >
            <Icon name="Send" size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;