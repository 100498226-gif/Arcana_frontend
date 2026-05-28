import image_1Gmail_icon__2026__svg from '@/imports/1Gmail_icon__2026_.svg.png'
import { useState, useEffect, useRef, useCallback } from 'react';
import { File, ChevronDown, FileText, Mic, ArrowUp, X, PanelRightClose, PanelRightOpen, Minimize2, Maximize2, Loader2, MoreVertical, Pin, PinOff, Trash2 } from 'lucide-react';
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
import {
  streamQuery,
  getConversations,
  getConversation,
  uploadFile,
  revealFile,
} from '../api/client';
import type { ConversationSummary, HistoryEntry } from '../api/client';

// Detect Electron overlay — preload.js exposes window.electronAPI
declare global {
  interface Window {
    electronAPI?: { isElectron: boolean; collapseWindow: () => void; expandWindow: () => void };
  }
}
const isElectron = typeof window !== 'undefined' && !!window.electronAPI?.isElectron;

type Message = { id: number; text: string; timestamp: string; type: 'question' | 'answer'; source?: string; sourceAbsPath?: string; model?: string };
type HistoryItem = { id: number; question: string; time: string; messages: Message[]; outOfScope?: boolean; model?: string };

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs === 1 ? '1 hour ago' : `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

function summaryToHistoryItem(c: ConversationSummary): HistoryItem {
  return {
    id: c.id,
    question: c.title,
    time: relativeTime(c.created_at),
    messages: [],
    outOfScope: c.out_of_scope,
    model: c.model,
  };
}

export default function App() {
  const [inputValue, setInputValue] = useState('');
  const [followUpValue, setFollowUpValue] = useState('');
  const [selectedModel, setSelectedModel] = useState('Qwen 3');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<number | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [showScopeDialog, setShowScopeDialog] = useState(false);
  const [showInternetOptions, setShowInternetOptions] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [clickedTool, setClickedTool] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [pinnedIds, setPinnedIds] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('arcana-pinned-ids') || '[]'); }
    catch { return []; }
  });
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getModelIcon = (model: string) => {
    return model === 'Qwen 3' ? geminiIcon : qwenIcon;
  };

  const loadHistory = useCallback(async () => {
    try {
      const convs = await getConversations();
      setHistoryItems(convs.map(summaryToHistoryItem));
    } catch {
      // ignore — history sidebar stays empty if backend unreachable
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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
            id: Date.now(),
            text: `Conversation finished in ${toolName}.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'answer'
          }];
        });
        setClickedTool(null);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [clickedTool]);

  const sendMessage = async (text: string, isFollowUp: boolean) => {
    if (!text.trim() || isStreaming) return;

    const newQuestion: Message = {
      id: Date.now(),
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'question',
      model: selectedModel,
    };

    if (!isFollowUp) {
      setMessages([newQuestion]);
      setActiveHistoryId(null);
      if (isFirstTime) {
        setIsFirstTime(false);
        setSidebarOpen(true);
      }
    } else {
      setMessages(prev => [...prev, newQuestion]);
    }

    // Build history for the LLM from current messages
    const history: HistoryEntry[] = messages.map(m => ({
      role: m.type === 'question' ? 'user' : 'assistant',
      content: m.text,
    }));

    // Placeholder streaming message
    const streamingId = Date.now() + 1;
    setMessages(prev => [...prev, {
      id: streamingId,
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'answer',
      model: selectedModel,
    }]);

    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    await streamQuery(text, history, selectedModel, activeConversationId, {
      onChunk(chunk) {
        setMessages(prev => prev.map(m =>
          m.id === streamingId ? { ...m, text: m.text + chunk } : m
        ));
      },
      onDone(payload) {
        const first = payload.sources?.[0];
        setMessages(prev => prev.map(m =>
          m.id === streamingId
            ? { ...m, source: first?.file_name, sourceAbsPath: first?.abs_path }
            : m
        ));
        if (payload.conversation_id != null) {
          setActiveConversationId(payload.conversation_id);
        }
        loadHistory();
        setIsStreaming(false);
        abortControllerRef.current = null;
      },
      onOutOfScope(conversationId) {
        setMessages(prev => prev.filter(m => m.id !== streamingId));
        setActiveConversationId(conversationId);
        setShowScopeDialog(true);
        loadHistory();
        setIsStreaming(false);
        abortControllerRef.current = null;
      },
      onError(message) {
        setMessages(prev => prev.map(m =>
          m.id === streamingId ? { ...m, text: `⚠️ ${message}` } : m
        ));
        setIsStreaming(false);
        abortControllerRef.current = null;
      },
    }, controller.signal);
  };

  const handleSend = () => {
    sendMessage(inputValue, false);
    setInputValue('');
  };

  const handleFollowUp = () => {
    sendMessage(followUpValue, true);
    setFollowUpValue('');
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
    setMessages(prev => prev.filter(m => !(m.type === 'answer' && m.text === '')));
  };

  const savePinned = (ids: number[]) => {
    setPinnedIds(ids);
    localStorage.setItem('arcana-pinned-ids', JSON.stringify(ids));
  };

  const closeMenu = () => { setOpenMenuId(null); setMenuPos(null); };

  const handlePin = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    closeMenu();
    if (pinnedIds.includes(id)) {
      savePinned(pinnedIds.filter(p => p !== id));
    } else if (pinnedIds.length < 3) {
      savePinned([...pinnedIds, id]);
    }
  };

  const handleDeleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    closeMenu();
    // Optimistic update — remove instantly from UI, no waiting for network
    setHistoryItems(prev => prev.filter(h => h.id !== id));
    if (pinnedIds.includes(id)) savePinned(pinnedIds.filter(p => p !== id));
    if (activeHistoryId === id) {
      setMessages([]);
      setActiveHistoryId(null);
      setActiveConversationId(null);
    }
    deleteConversation(id); // fire-and-forget — UI already updated
  };

  const handleHistoryClick = async (item: HistoryItem) => {
    setShowScopeDialog(false);
    setShowInternetOptions(false);
    setActiveHistoryId(item.id);
    setActiveConversationId(item.id);
    if (item.model) setSelectedModel(item.model);
    if (isFirstTime) {
      setIsFirstTime(false);
      setSidebarOpen(true);
    }

    if (item.outOfScope) {
      // Show just the question with the scope dialog
      setMessages([{
        id: 1,
        text: item.question,
        timestamp: '',
        type: 'question',
        model: item.model,
      }]);
      setShowScopeDialog(true);
      return;
    }

    try {
      const detail = await getConversation(item.id);
      const mapped: Message[] = detail.messages.map(m => ({
        id: m.id,
        text: m.content,
        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: m.role === 'user' ? 'question' : 'answer',
        source: m.sources?.[0]?.file_name,
        sourceAbsPath: m.sources?.[0]?.abs_path,
        model: detail.model,
      }));
      setMessages(mapped);
    } catch {
      setMessages([{
        id: 1,
        text: item.question,
        timestamp: '',
        type: 'question',
        model: item.model,
      }]);
    }
  };

  const handleScopeYes = () => setShowInternetOptions(true);

  const handleScopeNo = () => {
    setShowScopeDialog(false);
    setShowInternetOptions(false);
    setMessages(prev => {
      const already = prev.find(m => m.type === 'answer');
      if (already) return prev;
      return [...prev, {
        id: Date.now(),
        text: 'This conversation has ended.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'answer',
      }];
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploadStatus('uploading');
    setUploadMessage(`Uploading ${file.name}…`);
    try {
      const result = await uploadFile(file);
      setUploadStatus('success');
      setUploadMessage(`✓ ${result.file_name} ingested (${result.chunks_ingested} chunks)`);
    } catch (err: unknown) {
      setUploadStatus('error');
      setUploadMessage(`✗ ${err instanceof Error ? err.message : 'Upload failed'}`);
    }
    setTimeout(() => setUploadStatus('idle'), 4000);
  };

  return (
    <div className="w-full h-screen flex bg-gray-50 relative">
      {isCollapsed ? (
        /* Collapsed View — fills the resized Electron window */
        <div className="w-full h-full flex flex-col min-h-0 shadow-lg rounded-lg overflow-hidden relative">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200">
            <ImageWithFallback src={logoIcon} alt="Logo" className="w-6 h-6" />
            <span className="text-xs text-gray-700 font-bold truncate flex-1">{messages.find(m => m.type === 'question')?.text ?? ''}</span>
            <button
              onClick={() => { setIsCollapsed(false); window.electronAPI?.expandWindow(); }}
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
                      <button
                        onClick={() => message.sourceAbsPath && revealFile(message.sourceAbsPath)}
                        className="flex items-center gap-1 text-gray-400 hover:text-teal-600 hover:bg-teal-50 px-1.5 py-0.5 rounded transition-colors"
                        style={{ fontSize: '10px' }}
                        title="Show in Finder"
                      >
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
          {/* Collapse Button — overlay only, hidden in browser */}
          {!isFirstTime && isElectron && (
            <button
              onClick={() => { setIsCollapsed(true); window.electronAPI?.collapseWindow(); }}
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
                          <option value="Qwen 3">Qwen 3</option>
                          <option value="Gemma 4">Gemma 4</option>
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setShowComingSoon(true)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                          <Mic className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={handleSend}
                          disabled={isStreaming || !inputValue.trim()}
                          className="w-8 h-8 flex items-center justify-center bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                {/* Header */}
                <div className="bg-white border-b border-gray-200 p-4">
                  <div className="max-w-4xl mx-auto flex justify-end">
                    <button
                      onClick={() => {
                        setIsFirstTime(true);
                        setMessages([]);
                        setActiveHistoryId(null);
                        setActiveConversationId(null);
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
                            <p className="text-gray-800 whitespace-pre-line">
                              {message.text}
                              {message.type === 'answer' && message.text === '' && isStreaming && (
                                <span className="inline-flex items-center gap-1 text-teal-500 text-xs">
                                  <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
                                </span>
                              )}
                            </p>
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
                                <button
                                  onClick={() => message.sourceAbsPath && revealFile(message.sourceAbsPath)}
                                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-600 hover:bg-teal-50 px-2 py-1 rounded transition-colors cursor-pointer"
                                  title="Show in Finder"
                                >
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
                                { label: 'Google Browser', url: 'https://www.google.com/search?q=' + encodeURIComponent(messages.find(m => m.type === 'question')?.text ?? ''), icon: googleIcon },
                                { label: 'ChatGPT', url: 'https://chat.openai.com/', icon: chatgptIcon },
                                { label: 'Claude', url: 'https://claude.ai/', icon: claudeIcon },
                              ].map(({ label, url, icon }) => (
                                <a
                                  key={label}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setClickedTool(label)}
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
                                  return [...prev, {
                                    id: Date.now(),
                                    text: 'This conversation has ended.',
                                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                    type: 'answer',
                                  }];
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
                      {isStreaming ? (
                        <button
                          onClick={handleCancel}
                          className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex-shrink-0"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={handleFollowUp}
                          disabled={!followUpValue.trim()}
                          className="w-8 h-8 flex items-center justify-center bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                      )}
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

      {/* Click-outside overlay — closes open card menus */}
      {openMenuId !== null && (
        <div className="fixed inset-0 z-[998]" onClick={closeMenu} />
      )}

      {/* Right Sidebar */}
      {!isFirstTime && !isCollapsed && (
        <div className={`${sidebarOpen ? 'w-80' : 'w-10 overflow-hidden'} bg-white border-l border-gray-200 flex flex-col transition-all duration-300`}>
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadStatus === 'uploading'}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm disabled:opacity-60"
                >
                  <div className="flex items-center gap-2">
                    {uploadStatus === 'uploading'
                      ? <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
                      : <File className="w-4 h-4 text-gray-500" />
                    }
                    <span className="text-gray-700">Local files</span>
                  </div>
                  <span className={`text-xs ${
                    uploadStatus === 'success' ? 'text-teal-600' :
                    uploadStatus === 'error' ? 'text-red-500' :
                    'text-gray-400'
                  }`}>
                    {uploadStatus === 'idle' ? 'Sync here' :
                     uploadStatus === 'uploading' ? 'Uploading…' :
                     uploadStatus === 'success' ? 'Done!' :
                     'Error'}
                  </span>
                </button>
                {uploadMessage && uploadStatus !== 'idle' && (
                  <p className={`mt-1 text-xs px-1 ${uploadStatus === 'error' ? 'text-red-500' : 'text-gray-500'}`}>
                    {uploadMessage}
                  </p>
                )}
              </div>

              {/* History Section */}
              <div className="flex-1 p-4 flex flex-col min-h-0">
                <h3 className="text-sm font-medium text-gray-700 mb-3">History</h3>
                <div className="space-y-2 overflow-auto flex-1">
                  {historyItems.length === 0 && (
                    <p className="text-xs text-gray-400">No conversations yet.</p>
                  )}

                  {(() => {
                    const pinned = historyItems.filter(h => pinnedIds.includes(h.id));
                    const unpinned = historyItems.filter(h => !pinnedIds.includes(h.id));
                    const atMax = pinnedIds.length >= 3;

                    const renderCard = (item: HistoryItem, isPinned: boolean) => (
                      <div
                        key={item.id}
                        onClick={() => handleHistoryClick(item)}
                        className={`relative group p-3 rounded-lg cursor-pointer transition-colors ${
                          activeHistoryId === item.id
                            ? 'bg-teal-50 border border-teal-200'
                            : isPinned
                            ? 'bg-teal-50/40 border border-teal-100 hover:bg-teal-50'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-1 pr-6">
                          {item.model && <img src={getModelIcon(item.model)} alt="" className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                          <p className="text-sm text-gray-800 flex-1 leading-snug">{item.question}</p>
                        </div>
                        <div className="flex items-center gap-1.5 ml-6">
                          <span className="text-xs text-gray-400">{item.time}</span>
                          {isPinned && <Pin className="w-3 h-3 text-teal-500" />}
                        </div>

                        {/* ⋮ menu trigger — captures screen position for fixed dropdown */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openMenuId === item.id) {
                              setOpenMenuId(null);
                              setMenuPos(null);
                            } else {
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                              setOpenMenuId(item.id);
                            }
                          }}
                          className={`absolute top-2 right-2 p-1 rounded hover:bg-gray-200 transition-colors ${
                            openMenuId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                          title="Options"
                        >
                          <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      </div>
                    );

                    return (
                      <>
                        {pinned.length > 0 && (
                          <>
                            <p className="text-xs text-teal-600 font-medium px-1 pb-0.5">Pinned</p>
                            {pinned.map(item => renderCard(item, true))}
                            {unpinned.length > 0 && <hr className="border-gray-200 my-1" />}
                          </>
                        )}
                        {unpinned.map(item => renderCard(item, false))}
                      </>
                    );
                  })()}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Fixed-position dropdown — rendered outside all overflow containers */}
      {openMenuId !== null && menuPos !== null && (() => {
        const item = historyItems.find(h => h.id === openMenuId);
        if (!item) return null;
        const isPinned = pinnedIds.includes(openMenuId);
        const atMax = pinnedIds.length >= 3;
        return (
          <div
            style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 999 }}
            className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[130px]"
            onClick={(e) => e.stopPropagation()}
          >
            {isPinned ? (
              <button
                onClick={(e) => handlePin(item.id, e)}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <PinOff className="w-3.5 h-3.5 text-teal-500" />
                Unpin
              </button>
            ) : (
              <button
                onClick={(e) => !atMax && handlePin(item.id, e)}
                disabled={atMax}
                className={`flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors ${
                  atMax ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Pin className={`w-3.5 h-3.5 ${atMax ? 'text-gray-300' : 'text-teal-500'}`} />
                {atMax ? 'Pin (max 3)' : 'Pin'}
              </button>
            )}
            <button
              onClick={(e) => handleDeleteConversation(item.id, e)}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        );
      })()}
    </div>
  );
}
