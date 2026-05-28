import image_1Gmail_icon__2026__svg from '@/imports/1Gmail_icon__2026_.svg.png'
import image_Gmail_icon__2020__svg_1 from '@/imports/Gmail_icon__2020_.svg-1.png'
import { useState, useEffect } from 'react';
import { Send, File, ChevronDown, FileText, Plus, Mic, ArrowUp, PanelRightClose, PanelRightOpen, Minimize2, Maximize2 } from 'lucide-react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import gmailIcon from '../imports/image.png';
import slackIcon from '../imports/image-1.png';
import githubIcon from '../imports/image-2.png';
import notionIcon from '../imports/image-3.png';
import driveIcon from '../imports/image-4.png';
import chatgptIcon from '../imports/image-6.png';
import claudeIcon from '../imports/image-7.png';
import googleIcon from '../imports/image-8.png';
import logoIcon from '../imports/output-onlinepngtools.png';
import geminiIcon from '../imports/image-10.png';
import qwenIcon from '../imports/image-11.png';

type Message = { id: number; text: string; timestamp: string; type: 'question' | 'answer'; source?: string; model?: string };
type HistoryItem = { id: number; question: string; time: string; messages: Message[]; outOfScope?: boolean; model?: string };

const HISTORY_ITEMS: HistoryItem[] = [
  {
    id: 1,
    question: 'What is the early termination penalty in my rental contract?',
    time: '2 hours ago',
    model: 'Gemini 2.5 Flash-Lite',
    messages: [
      { id: 1, text: 'What is the early termination penalty in my rental contract?', timestamp: '10:23 AM', type: 'question', model: 'Gemini 2.5 Flash-Lite' },
      { id: 2, text: 'Based on your rental contract (Section 8.2), the early termination penalty is calculated as follows:\n\n• If terminating within the first 6 months: 2 months rent\n• If terminating between 6-12 months: 1.5 months rent\n• If terminating after 12 months: 1 month rent\n\nYour current rent is $1,850/month, so depending on when you terminate, the penalty would range from $1,850 to $3,700. The contract also requires 60 days written notice regardless of when you terminate.', timestamp: '10:23 AM', type: 'answer', source: 'Rental contract', model: 'Gemini 2.5 Flash-Lite' },
    ],
  },
  {
    id: 2,
    question: 'Which of my insurance policies covers water damage and up to what amount?',
    time: '5 hours ago',
    model: 'Qwen 2.5',
    messages: [
      { id: 1, text: 'Which of my insurance policies covers water damage and up to what amount?', timestamp: '9:10 AM', type: 'question', model: 'Qwen 2.5' },
      { id: 2, text: 'According to your home insurance policy (Policy #HO-4821), water damage is covered under Section 4 — "Sudden and Accidental Discharge".\n\n• Coverage limit: $25,000 per incident\n• Deductible: $500\n• Excludes: flood damage, gradual leaks, and sewer backup (unless the optional rider is active)\n\nYour current policy does not include the sewer backup rider. If you want that coverage, it can be added for approximately $120/year.', timestamp: '9:11 AM', type: 'answer', source: 'Home insurance policy', model: 'Qwen 2.5' },
    ],
  },
  {
    id: 3,
    question: 'Find the invoice from the electrician. Total and work done?',
    time: 'Yesterday',
    model: 'Gemini 2.5 Flash-Lite',
    messages: [
      { id: 1, text: 'Find the invoice from the electrician. Total and work done?', timestamp: '3:45 PM', type: 'question', model: 'Gemini 2.5 Flash-Lite' },
      { id: 2, text: 'I found invoice #INV-2024-0387 from Sparks Electrical Services, dated November 14, 2024.\n\nWork performed:\n• Panel upgrade from 100A to 200A service\n• Installation of 4 new dedicated circuits (kitchen appliances)\n• Replacement of 6 outdated outlets with GFCI outlets\n• Electrical inspection and code compliance check\n\nTotal: $2,340.00 (paid in full)\nWarranty: 2 years on labor, 5 years on panel.', timestamp: '3:45 PM', type: 'answer', source: 'Sparks Electrical Invoice', model: 'Gemini 2.5 Flash-Lite' },
    ],
  },
  {
    id: 4,
    question: 'What were the action items from the November team meeting?',
    time: '2 days ago',
    model: 'Qwen 2.5',
    messages: [
      { id: 1, text: 'What were the action items from the November team meeting?', timestamp: '11:00 AM', type: 'question', model: 'Qwen 2.5' },
      { id: 2, text: 'From the November 8th Team Meeting notes, the following action items were recorded:\n\n• @Sarah — Finalize Q4 budget proposal by Nov 15\n• @Marcus — Schedule vendor review calls for new CRM options\n• @Team — Complete onboarding survey before next standup\n• @David — Update the project roadmap with revised timelines\n• @Sarah & David — Draft updated SLA document for client review\n\nThe next meeting was scheduled for November 22nd.', timestamp: '11:01 AM', type: 'answer', source: 'November meeting notes', model: 'Qwen 2.5' },
    ],
  },
  {
    id: 6,
    question: 'What is Airbnb?',
    time: '4 days ago',
    outOfScope: true,
    model: 'Gemini 2.5 Flash-Lite',
    messages: [
      { id: 1, text: 'What is Airbnb?', timestamp: '8:00 AM', type: 'question', model: 'Gemini 2.5 Flash-Lite' },
    ],
  },
  {
    id: 5,
    question: 'Compare the two supplier quotes for printed folders. Which is cheaper?',
    time: '3 days ago',
    model: 'Qwen 2.5',
    messages: [
      { id: 1, text: 'Compare the two supplier quotes for printed folders. Which is cheaper?', timestamp: '2:30 PM', type: 'question', model: 'Qwen 2.5' },
      { id: 2, text: 'I found two supplier quotes for printed folders:\n\nSupplier A — PrintPro Solutions\n• 500 units: $1,200 ($2.40/unit)\n• Delivery: 10 business days\n• Full-color, gloss finish\n\nSupplier B — QuickPrint Co.\n• 500 units: $1,050 ($2.10/unit)\n• Delivery: 14 business days\n• Full-color, matte finish\n\nQuickPrint Co. is cheaper by $150 total. However, if delivery time is a priority, PrintPro Solutions delivers 4 days faster.', timestamp: '2:31 PM', type: 'answer', source: 'Supplier quotes', model: 'Qwen 2.5' },
    ],
  },
];

export default function App() {
  const [inputValue, setInputValue] = useState('');
  const [followUpValue, setFollowUpValue] = useState('');
  const [selectedModel, setSelectedModel] = useState('Qwen 2.5');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showScopeDialog, setShowScopeDialog] = useState(false);
  const [showInternetOptions, setShowInternetOptions] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [clickedTool, setClickedTool] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getModelIcon = (model: string) => {
    return model === 'Qwen 2.5' ? geminiIcon : qwenIcon;
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && clickedTool) {
        const toolName = clickedTool;
        setShowScopeDialog(false);
        setShowInternetOptions(false);
        setMessages(prev => {
          const already = prev.find(m => m.type === 'answer');
          if (already) return prev;
          return [...prev, {
            id: 2,
            text: `Conversation finished in ${toolName}.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'answer'
          }];
        });
        setClickedTool(null);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clickedTool]);

  const handleSend = () => {
    if (inputValue.trim()) {
      const newQuestion: Message = {
        id: Date.now(),
        text: inputValue,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'question',
        model: selectedModel
      };
      setMessages([newQuestion]);
      setActiveHistoryId(null);
      setInputValue('');
      if (isFirstTime) {
        setIsFirstTime(false);
        setSidebarOpen(true);
      }
    }
  };

  const handleFollowUp = () => {
    if (followUpValue.trim()) {
      const newMessage: Message = {
        id: Date.now(),
        text: followUpValue,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'question',
        model: selectedModel
      };
      setMessages(prev => [...prev, newMessage]);
      setFollowUpValue('');
    }
  };

  const handleHistoryClick = (item: HistoryItem) => {
    setMessages(item.messages);
    setActiveHistoryId(item.id);
    setShowScopeDialog(false);
    setShowInternetOptions(false);
    if (item.model) {
      setSelectedModel(item.model);
    }
    if (isFirstTime) {
      setIsFirstTime(false);
      setSidebarOpen(true);
    }
    if (item.outOfScope) {
      setShowScopeDialog(true);
    }
  };

  const handleScopeYes = () => {
    setShowInternetOptions(true);
  };

  const handleScopeNo = () => {
    setShowScopeDialog(false);
    setShowInternetOptions(false);
    setMessages(prev => {
      const already = prev.find(m => m.type === 'answer');
      if (already) return prev;
      return [...prev, { id: 2, text: 'This conversation has ended.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'answer' }];
    });
  };

  return (
    <div className="w-full h-[50vh] flex bg-gray-50 relative">
      {isCollapsed ? (
        /* Collapsed View - Small 1/4 screen square */
        <div className="w-1/4 h-1/4 flex flex-col min-h-0 shadow-lg rounded-lg overflow-hidden relative">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200">
            <ImageWithFallback src={logoIcon} alt="Logo" className="w-6 h-6" />
            <span className="text-xs text-gray-700 font-bold truncate flex-1">{messages.find(m => m.type === 'question')?.text ?? ''}</span>
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-1.5 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors shadow-sm flex-shrink-0"
              title="Expand"
            >
              <Maximize2 className="w-4 h-4 text-teal-600" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-lg px-3 py-2 text-xs ${
                  message.type === 'question'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-white border border-gray-200 shadow-sm text-gray-800'
                }`}
              >
                <p className="whitespace-pre-line leading-snug">{message.text}</p>
                {message.type === 'answer' && (
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-gray-400" style={{ fontSize: '10px' }}>{message.timestamp}</span>
                    {message.source && (
                      <button className="flex items-center gap-1 text-gray-400 hover:text-teal-600 hover:bg-teal-50 px-1.5 py-0.5 rounded transition-colors" style={{ fontSize: '10px' }}>
                        <FileText className="w-3 h-3" />
                        {message.source}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
      {/* Collapse Button - Top Left (only when not collapsed) */}
      {!isFirstTime && (
        <button
          onClick={() => setIsCollapsed(true)}
          className="absolute top-4 left-4 z-30 p-2 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors shadow-sm"
          title="Collapse"
        >
          <Minimize2 className="w-4 h-4 text-teal-600" />
        </button>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {isFirstTime ? (
          /* First Time Welcome View */
          <div className="flex-1 flex items-center justify-center py-4">
            <div className="max-w-2xl w-full px-6">
              <div className="text-center mb-4">
                <div className="mb-2">
                  <ImageWithFallback src={logoIcon} alt="Logo" className="w-12 h-12 mx-auto" />
                </div>
                <h1 className="text-2xl text-gray-800">Fire away!</h1>
              </div>

              <div className="bg-white border border-gray-300 rounded-2xl shadow-sm p-4 mb-4">
                <textarea
                  placeholder="I want to know..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={2}
                  className="w-full px-1 py-1 text-sm bg-transparent border-none focus:outline-none resize-none overflow-y-auto mb-3"
                />
                <div className="flex items-center justify-between">
                  <div className="relative">
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-6 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer"
                      style={{
                        backgroundImage: `url(${getModelIcon(selectedModel)})`,
                        backgroundPosition: '7px center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '16px 16px'
                      }}
                    >
                      <option value="Qwen 2.5">Qwen 2.5</option>
                      <option value="Gemini 2.5 Flash-Lite">Gemini 2.5 Flash-Lite</option>
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowComingSoon(true)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                      <Mic className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={handleSend}
                      className="w-8 h-8 flex items-center justify-center bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <span className="text-sm text-gray-600 mb-2 block">Add your connectors</span>
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => setShowComingSoon(true)} className="w-9 h-9 rounded hover:bg-gray-100 transition-colors p-1">
                    <ImageWithFallback src={notionIcon} alt="Notion" className="w-full h-full object-contain" />
                  </button>
                  <button onClick={() => setShowComingSoon(true)} className="w-9 h-9 rounded hover:bg-gray-100 transition-colors p-1">
                    <ImageWithFallback src={githubIcon} alt="GitHub" className="w-full h-full object-contain" />
                  </button>
                  <button onClick={() => setShowComingSoon(true)} className="w-9 h-9 rounded hover:bg-gray-100 transition-colors p-1">
                    <ImageWithFallback src={slackIcon} alt="Slack" className="w-full h-full object-contain" />
                  </button>
                  <button onClick={() => setShowComingSoon(true)} className="w-9 h-9 rounded hover:bg-gray-100 transition-colors p-1">
                    <ImageWithFallback src={image_1Gmail_icon__2026__svg} alt="Gmail" className="w-full h-full object-contain" />
                  </button>
                  <button onClick={() => setShowComingSoon(true)} className="w-9 h-9 rounded hover:bg-gray-100 transition-colors p-1">
                    <ImageWithFallback src={driveIcon} alt="Google Drive" className="w-full h-full object-contain" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header with Start New Chat Button */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="max-w-4xl mx-auto flex justify-end">
                <button
                  onClick={() => {
                    setIsFirstTime(true);
                    setMessages([]);
                    setActiveHistoryId(null);
                    setSidebarOpen(false);
                    setInputValue('');
                    setFollowUpValue('');
                  }}
                  className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Start new chat
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-auto relative">
          <div className="max-w-4xl mx-auto p-8">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                <div className="text-teal-500 mb-3">
                  <span className="text-xl">●</span>
                </div>
                <div className="inline-block px-4 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm mb-6">
                  Respuesta Actual
                </div>
                <p className="text-gray-400">Las respuestas aparecerán aquí...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`rounded-lg p-4 ${
                    message.type === 'question'
                      ? 'bg-gray-100'
                      : 'bg-white shadow-sm border border-gray-200'
                  }`}>
                    <p className="text-gray-800 whitespace-pre-line">{message.text}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{message.timestamp}</span>
                        {message.model && (
                          <div className="flex items-center gap-1">
                            <img src={getModelIcon(message.model)} alt="" className="w-3.5 h-3.5" />
                            <span className="text-xs text-gray-400">{message.model}</span>
                          </div>
                        )}
                      </div>
                      {message.type === 'answer' && message.source && (
                        <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-600 hover:bg-teal-50 px-2 py-1 rounded transition-colors cursor-pointer">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{message.source}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Out-of-scope dialog */}
          {showScopeDialog && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
              <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-5 w-72">
                {!showInternetOptions ? (
                  <>
                    <p className="text-sm text-gray-800 mb-4">
                      This is not part of your knowledge base. Do you want to access the internet?
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={handleScopeNo}
                        className="px-4 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        No
                      </button>
                      <button
                        onClick={handleScopeYes}
                        className="px-4 py-1.5 text-sm rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                      >
                        Yes
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-700 mb-3">Search with:</p>
                    <div className="flex flex-col gap-2">
                      {[
                        { label: 'Google Browser', url: 'https://www.google.com/search?q=What+is+Airbnb', icon: googleIcon },
                        { label: 'ChatGPT', url: 'https://chat.openai.com/', icon: chatgptIcon },
                        { label: 'Claude', url: 'https://claude.ai/', icon: claudeIcon },
                      ].map(({ label, url, icon }) => (
                        <a
                          key={label}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            setClickedTool(label);
                          }}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 hover:bg-teal-50 hover:border-teal-300 text-sm text-gray-800 transition-colors"
                        >
                          <img src={icon} alt={label} className="w-5 h-5 object-contain" />
                          {label}
                        </a>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setShowScopeDialog(false);
                        setShowInternetOptions(false);
                        setMessages(prev => {
                          const already = prev.find(m => m.type === 'answer');
                          if (already) return prev;
                          return [...prev, { id: 2, text: 'This conversation has ended.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'answer' }];
                        });
                      }}
                      className="mt-3 w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
            </div>

            {/* Footer - Follow-up Input */}
            {messages.length > 0 && (
              <div className="bg-white border-t border-gray-200 p-3">
                <div className="max-w-4xl mx-auto flex items-center gap-2">
                  <textarea
                    placeholder="Follow-up question..."
                    value={followUpValue}
                    onChange={(e) => setFollowUpValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleFollowUp();
                      }
                    }}
                    rows={1}
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none overflow-y-auto"
                    style={{ maxHeight: '80px' }}
                  />
                  <button
                    onClick={() => setShowComingSoon(true)}
                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                  >
                    <Mic className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={handleFollowUp}
                    className="w-8 h-8 flex items-center justify-center bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex-shrink-0"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

        {/* Coming Soon dialog */}
        {showComingSoon && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-64 text-center">
              <p className="text-sm text-gray-800 mb-4">Coming soon!</p>
              <button
                onClick={() => setShowComingSoon(false)}
                className="px-5 py-1.5 text-sm rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        )}
        </>
      )}

      {/* Right Sidebar - only show when not first time and not collapsed */}
      {!isFirstTime && !isCollapsed && (
      <div className={`${sidebarOpen ? 'w-80' : 'w-10'} bg-white border-l border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
        {/* Collapse Toggle */}
        <div className={`flex ${sidebarOpen ? 'justify-end' : 'justify-center'} p-2 border-b border-gray-200`}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-500 hover:text-teal-600"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
          </button>
        </div>

        {sidebarOpen && (
        <>
        {/* File Access Section */}
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">File Access</h3>
          <button className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm">
            <div className="flex items-center gap-2">
              <File className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">Local files</span>
            </div>
            <span className="text-xs text-gray-400">Sync here</span>
          </button>
        </div>

        {/* History Section */}
        <div className="flex-1 p-4 overflow-hidden flex flex-col">
          <h3 className="text-sm font-medium text-gray-700 mb-3">History</h3>
          <div className="space-y-3 overflow-auto flex-1">
            {HISTORY_ITEMS.map((item) => (
              <div
                key={item.id}
                onClick={() => handleHistoryClick(item)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  activeHistoryId === item.id
                    ? 'bg-teal-50 border border-teal-200'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start gap-2 mb-1">
                  {item.model && <img src={getModelIcon(item.model)} alt="" className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                  <p className="text-sm text-gray-800 flex-1">{item.question}</p>
                </div>
                <p className="text-xs text-gray-400 ml-6">{item.time}</p>
              </div>
            ))}
          </div>
        </div>
        </>
        )}
      </div>
      )}
    </div>
  );
}
