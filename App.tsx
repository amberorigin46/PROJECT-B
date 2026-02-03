
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { OSMUState, ChatMessage, GeneratedContent, ContentType } from './types';
import * as gemini from './services/geminiService';
import PreviewTabs from './components/PreviewTabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const RAINBOW_COLORS = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

const App: React.FC = () => {
  const [state, setState] = useState<OSMUState>({
    isGenerating: false,
    currentTask: '',
    messages: [
      { role: 'model', text: '안녕하세요! OSMU 콘텐츠 스튜디오입니다. 원하시는 주제를 말씀해 주시면 봄의 생명력을 담은 기사와 이미지, 카드뉴스, 웹페이지, 그리고 스토리보드 영상을 제작해 드립니다.' }
    ],
    currentResult: null,
    history: []
  });

  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || state.isGenerating) return;

    const userInput = inputText.trim();
    setInputText('');
    
    const isRefining = state.currentResult && (
      userInput.includes('수정') || userInput.includes('바꿔') || userInput.includes('다시') || 
      userInput.includes('더') || userInput.includes('해줘') || userInput.includes('요약')
    );

    if (isRefining && state.currentResult) {
       await handleRefinement(userInput);
       return;
    }

    setState(prev => ({
      ...prev,
      isGenerating: true,
      currentTask: '메인 기사 생성 중...',
      messages: [...prev.messages, { role: 'user', text: userInput }]
    }));

    try {
      const article = await gemini.generateArticle(userInput);
      setState(prev => ({
        ...prev,
        currentTask: '멀티 플랫폼 최적화 중...',
        messages: [...prev.messages, { role: 'model', text: "기사 작성이 완료되었습니다! 이제 싱그러운 이미지와 요약본, 웹페이지를 준비합니다." }]
      }));

      const [summary, imageUrl, webHtml] = await Promise.all([
        gemini.generateSummary(article),
        gemini.generateImage(userInput),
        gemini.generateWebCode(article)
      ]);

      const newContent: GeneratedContent = {
        id: Date.now().toString(),
        originalText: article,
        summary,
        imageUrl,
        webHtml,
        timestamp: Date.now()
      };

      setState(prev => ({
        ...prev,
        currentResult: newContent,
        history: [newContent, ...prev.history],
        isGenerating: true,
        currentTask: 'AI 스토리보드 영상 제작 중...'
      }));

      const videoStoryboard = await gemini.generateStoryboard(userInput);

      setState(prev => ({
        ...prev,
        isGenerating: false,
        currentTask: '',
        currentResult: { ...newContent, videoStoryboard },
        history: prev.history.map(h => h.id === newContent.id ? { ...h, videoStoryboard } : h),
        messages: [...prev.messages, { role: 'model', text: "모든 콘텐츠 제작이 마무리되었습니다. 스튜디오에서 확인해 보세요!" }]
      }));

    } catch (error) {
      console.error(error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        currentTask: '',
        messages: [...prev.messages, { role: 'model', text: "콘텐츠 생성 중 예기치 못한 오류가 발생했습니다." }]
      }));
    }
  };

  const handleRefinement = async (instruction: string) => {
    if (!state.currentResult) return;

    setState(prev => ({
      ...prev,
      isGenerating: true,
      currentTask: '콘텐츠 수정 중...',
      messages: [...prev.messages, { role: 'user', text: instruction }]
    }));

    try {
      let updatedResult = { ...state.currentResult };
      
      if (instruction.includes('요약')) {
        const newSummary = await gemini.refineContent(state.currentResult.summary, instruction, 'summary');
        updatedResult.summary = newSummary;
      } else if (instruction.includes('웹') || instruction.includes('페이지')) {
        const newWeb = await gemini.refineContent(state.currentResult.webHtml || '', instruction, 'web');
        updatedResult.webHtml = newWeb;
      } else {
        const newText = await gemini.refineContent(state.currentResult.originalText, instruction, 'text');
        updatedResult.originalText = newText;
      }

      setState(prev => ({
        ...prev,
        isGenerating: false,
        currentTask: '',
        currentResult: updatedResult,
        messages: [...prev.messages, { role: 'model', text: "요청하신 대로 콘텐츠를 정성껏 수정했습니다!" }]
      }));
    } catch (error) {
       setState(prev => ({ ...prev, isGenerating: false, currentTask: '', messages: [...prev.messages, { role: 'model', text: '수정 중 오류가 발생했습니다.' }] }));
    }
  };

  const analyticsData = [
    { name: '기사', count: state.history.length },
    { name: '이미지', count: state.history.filter(h => h.imageUrl).length },
    { name: '영상', count: state.history.filter(h => h.videoStoryboard).length },
    { name: '웹', count: state.history.filter(h => h.webHtml).length },
  ];

  return (
    <div className="flex h-screen bg-[#fffdf5] text-slate-900 overflow-hidden selection:bg-emerald-100">
      
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm z-20">
        <div className="p-8">
          <div className="flex items-center space-x-3 mb-10 group cursor-default">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100 group-hover:scale-105 transition-transform">
              <i className="fas fa-seedling text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-800">OSMU Studio</h1>
              <p className="text-[10px] font-bold text-emerald-500 tracking-[0.2em] uppercase">Spring AI Lab</p>
            </div>
          </div>
          
          <nav className="space-y-1.5">
            <button 
              onClick={() => setState(prev => ({ ...prev, currentResult: null }))}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold transition-all"
            >
              <i className="fas fa-plus-circle"></i>
              <span>신규 프로젝트</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-emerald-50/50 hover:text-emerald-800 transition-all font-medium">
              <i className="fas fa-leaf"></i>
              <span>내 라이브러리</span>
            </button>
          </nav>
        </div>

        <div className="flex-1 px-8 overflow-y-auto pb-4">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">최근 작업물</h2>
          <div className="space-y-3">
            {state.history.length === 0 && (
              <div className="py-12 flex flex-col items-center opacity-30">
                <i className="fas fa-wind text-4xl mb-2 text-emerald-200"></i>
                <p className="text-xs italic">새로운 싹을 틔워보세요</p>
              </div>
            )}
            {state.history.map(item => (
              <button 
                key={item.id} 
                onClick={() => setState(prev => ({ ...prev, currentResult: item }))}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  state.currentResult?.id === item.id 
                  ? 'border-emerald-600 bg-emerald-50/30 shadow-md ring-1 ring-emerald-600/5' 
                  : 'border-slate-100 bg-white hover:border-emerald-200 hover:shadow-sm'
                }`}
              >
                <p className="text-sm font-bold truncate text-slate-800 mb-1">{item.originalText.substring(0, 30)}...</p>
                <div className="flex items-center justify-between">
                   <span className="text-[10px] text-slate-400 font-medium">
                     {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                   <div className="flex -space-x-1">
                      {item.imageUrl && <div className="w-4 h-4 rounded-full bg-emerald-100 border border-white flex items-center justify-center text-[8px] text-emerald-600"><i className="fas fa-image"></i></div>}
                      {item.videoStoryboard && <div className="w-4 h-4 rounded-full bg-lime-100 border border-white flex items-center justify-center text-[8px] text-lime-600"><i className="fas fa-film"></i></div>}
                   </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50/50">
           <div className="h-28 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData}>
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 4, 4]}>
                    {analyticsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RAINBOW_COLORS[index % RAINBOW_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
           <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest">생성 통계 (Rainbow Mode)</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative bg-[#fffdf5]">
        
        {/* Top Navbar */}
        <header className="h-20 border-b border-slate-100 flex items-center justify-between px-10 z-10 bg-white/80 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 text-sm font-medium">
              <span className="text-slate-400">워크스페이스</span>
              <i className="fas fa-chevron-right text-[10px] text-slate-300"></i>
              <span className="text-slate-800 font-bold">풀색 스튜디오</span>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden sm:flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">
               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
               AI SYSTEM ONLINE
            </div>
            <button className="text-slate-400 hover:text-emerald-600 transition-colors"><i className="fas fa-cog"></i></button>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-lime-500 shadow-md flex items-center justify-center text-white font-bold text-xs border-2 border-white">
              JD
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          
          {/* Chat Panel */}
          <section className="w-[420px] border-r border-slate-100 flex flex-col bg-emerald-50/10">
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {state.messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-5 text-sm shadow-sm transition-all ${
                    msg.role === 'user' 
                    ? 'bg-emerald-600 text-white rounded-tr-none shadow-emerald-100 font-medium' 
                    : 'bg-white text-slate-700 rounded-tl-none border border-emerald-50 leading-relaxed'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {state.isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-white border border-emerald-100 p-5 rounded-2xl rounded-tl-none flex items-center space-x-4 shadow-sm">
                    <div className="flex space-x-1.5">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce"></div>
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.2s]"></div>
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.4s]"></div>
                    </div>
                    <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">{state.currentTask}</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
              <form onSubmit={handleGenerate} className="relative group">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={state.currentResult ? "수정 사항을 입력해 주세요..." : "새로운 아이디어를 심어보세요..."}
                  disabled={state.isGenerating}
                  className="w-full pl-6 pr-14 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-inner disabled:opacity-50 text-sm placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={state.isGenerating || !inputText.trim()}
                  className="absolute right-3 top-3 h-12 w-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center transition-all disabled:bg-slate-300 disabled:shadow-none shadow-lg shadow-emerald-100 group-focus-within:scale-105 active:scale-95"
                >
                  <i className={`fas ${state.isGenerating ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
                </button>
              </form>
              <div className="flex justify-between mt-4 px-2">
                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Gemini 3.0 Spring Edition</p>
              </div>
            </div>
          </section>

          {/* Preview Panel */}
          <section className="flex-1 bg-[#fffdf5] p-10 overflow-hidden flex flex-col">
            {state.currentResult ? (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">콘텐츠 스튜디오</h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">풀색 프레임으로 완성된 결과물입니다.</p>
                  </div>
                  <div className="flex space-x-3">
                    <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all shadow-sm flex items-center space-x-2">
                      <i className="fas fa-file-export"></i>
                      <span>일괄 저장</span>
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 min-h-0 bg-white rounded-3xl p-2 shadow-2xl shadow-emerald-200/20 border border-emerald-100/50 overflow-hidden">
                  <div className="h-full rounded-[1.25rem] overflow-hidden">
                    <PreviewTabs content={state.currentResult} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-32 h-32 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-200 mb-8 rotate-12 animate-pulse">
                  <i className="fas fa-spa text-5xl"></i>
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">OSMU 스튜디오</h2>
                <p className="text-slate-500 max-w-sm font-medium leading-relaxed">
                  왼쪽 채팅창에 원하시는 주제를 입력해 보세요. <br/>
                  봄의 풀색처럼 싱그러운 콘텐츠가 탄생합니다.
                </p>
                <div className="mt-10 flex space-x-4">
                   <div className="px-4 py-2 bg-white border border-emerald-100 rounded-full text-[10px] font-bold text-emerald-400 shadow-sm">#기사</div>
                   <div className="px-4 py-2 bg-white border border-emerald-100 rounded-full text-[10px] font-bold text-emerald-400 shadow-sm">#영상</div>
                   <div className="px-4 py-2 bg-white border border-emerald-100 rounded-full text-[10px] font-bold text-emerald-400 shadow-sm">#카드뉴스</div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default App;
