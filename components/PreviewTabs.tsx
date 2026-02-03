
import React, { useState, useEffect } from 'react';
import { GeneratedContent, ContentType, StoryboardItem } from '../types';

interface PreviewTabsProps {
  content: GeneratedContent;
}

const StoryboardVideoPlayer: React.FC<{ items: StoryboardItem[] }> = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [items.length]);

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl flex flex-col">
      <div className="flex-1 relative overflow-hidden">
        {items.map((item, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={item.imageUrl}
              alt={`Scene ${index + 1}`}
              className={`w-full h-full object-cover transition-transform duration-[4000ms] ease-linear ${
                index === currentIndex ? 'scale-110' : 'scale-100'
              }`}
            />
          </div>
        ))}
        {/* Captions Overlay */}
        <div className="absolute bottom-10 left-0 right-0 px-8 py-4 bg-emerald-900/60 backdrop-blur-sm text-center">
          <p className="text-white text-lg md:text-xl font-bold tracking-tight animate-pulse transition-all duration-500">
            {items[currentIndex]?.caption}
          </p>
        </div>
        {/* Progress Bars */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {items.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'w-8 bg-emerald-400' : 'w-2 bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
      <div className="h-12 bg-slate-900 border-t border-white/10 flex items-center justify-between px-6 text-white/50 text-[10px] font-bold uppercase tracking-widest">
         <span>AI Spring Storyboard</span>
         <div className="flex space-x-4">
            <i className="fas fa-play text-emerald-400"></i>
            <i className="fas fa-volume-up"></i>
            <span>0{currentIndex + 1} / 0{items.length}</span>
         </div>
      </div>
    </div>
  );
};

const PreviewTabs: React.FC<PreviewTabsProps> = ({ content }) => {
  const [activeTab, setActiveTab] = useState<ContentType>(ContentType.TEXT);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus('복사됨!');
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleDownloadImage = () => {
    if (!content.imageUrl) return;
    const link = document.createElement('a');
    link.href = content.imageUrl;
    link.download = `osmu-image-${content.id}.png`;
    link.click();
  };

  const ActionButton = ({ onClick, icon, label, primary = false }: any) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        primary 
        ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
        : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
      }`}
    >
      <i className={`fas ${icon}`}></i>
      <span>{label}</span>
    </button>
  );

  const renderContent = () => {
    switch (activeTab) {
      case ContentType.TEXT:
        return (
          <div className="bg-white p-6 rounded-xl border border-emerald-50 h-full overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">생성된 기사</h3>
              <ActionButton 
                onClick={() => handleCopy(content.originalText)} 
                icon="fa-copy" 
                label={copyStatus || "텍스트 복사"} 
              />
            </div>
            <div className="flex-1 overflow-y-auto prose prose-emerald max-w-none scrollbar-thin scrollbar-thumb-emerald-100">
              <p className="whitespace-pre-wrap text-slate-700 leading-relaxed text-sm md:text-base">
                {content.originalText}
              </p>
            </div>
          </div>
        );
      case ContentType.SUMMARY:
        return (
          <div className="bg-white p-6 rounded-xl border border-emerald-50 h-full overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">카드뉴스 요약</h3>
              <ActionButton 
                onClick={() => handleCopy(content.summary)} 
                icon="fa-copy" 
                label={copyStatus || "요약 복사"} 
              />
            </div>
            <div className="flex-1 overflow-y-auto flex items-center justify-center py-4">
              <div className="bg-gradient-to-br from-emerald-500 to-lime-600 p-8 md:p-12 rounded-2xl shadow-xl text-center max-w-lg mx-auto w-full">
                <p className="text-white text-xl md:text-2xl font-medium leading-relaxed italic">
                  "{content.summary}"
                </p>
                <div className="mt-8 flex justify-center space-x-2">
                  {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>)}
                </div>
              </div>
            </div>
          </div>
        );
      case ContentType.IMAGE:
        return (
          <div className="bg-white p-6 rounded-xl border border-emerald-50 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">AI 일러스트레이션</h3>
              <div className="flex space-x-2">
                {content.imageUrl && (
                  <ActionButton onClick={handleDownloadImage} icon="fa-download" label="다운로드" primary />
                )}
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center bg-emerald-50/20 rounded-lg overflow-hidden relative group">
              {content.imageUrl ? (
                <img 
                  src={content.imageUrl} 
                  alt="Generated" 
                  className="max-h-full max-w-full object-contain shadow-2xl rounded-lg border-4 border-white" 
                />
              ) : (
                <div className="flex flex-col items-center text-emerald-300">
                  <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                  <p className="font-medium">봄의 색을 입히는 중...</p>
                </div>
              )}
            </div>
          </div>
        );
      case ContentType.VIDEO:
        return (
          <div className="bg-white p-6 rounded-xl border border-emerald-50 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">AI 스토리보드 영상</h3>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Natural Storytelling</p>
            </div>
            <div className="flex-1 overflow-hidden">
              {content.videoStoryboard && content.videoStoryboard.length > 0 ? (
                <StoryboardVideoPlayer items={content.videoStoryboard} />
              ) : (
                <div className="w-full h-full bg-slate-900 rounded-xl flex flex-col items-center justify-center text-white/40">
                   <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                   <p className="text-sm">영상 시나리오를 구성하고 있습니다...</p>
                </div>
              )}
            </div>
          </div>
        );
      case ContentType.WEB:
        return (
          <div className="bg-white p-6 rounded-xl border border-emerald-50 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">웹 랜딩 페이지 미리보기</h3>
              <ActionButton 
                onClick={() => handleCopy(content.webHtml || '')} 
                icon="fa-code" 
                label={copyStatus || "HTML 복사"} 
              />
            </div>
            <div className="flex-1 overflow-hidden border border-emerald-100 rounded-xl shadow-inner bg-emerald-50/10 relative">
               <div className="absolute top-0 left-0 right-0 h-6 bg-emerald-100 flex items-center px-3 space-x-1.5 z-10">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
               </div>
               <div className="mt-6 h-full overflow-y-auto p-4 bg-white">
                  <div dangerouslySetInnerHTML={{ __html: content.webHtml || '<p>콘텐츠가 없습니다.</p>' }} />
               </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const tabs = [
    { id: ContentType.TEXT, label: '기사', icon: 'fa-file-lines' },
    { id: ContentType.SUMMARY, label: '요약', icon: 'fa-compress' },
    { id: ContentType.IMAGE, label: '이미지', icon: 'fa-image' },
    { id: ContentType.VIDEO, label: '영상', icon: 'fa-film' },
    { id: ContentType.WEB, label: '웹페이지', icon: 'fa-globe' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex space-x-1 p-1 bg-emerald-50/50 backdrop-blur rounded-xl mb-6 self-start border border-emerald-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap text-sm ${
              activeTab === tab.id 
              ? 'bg-white text-emerald-700 shadow-sm font-bold border border-emerald-100' 
              : 'text-emerald-600/60 hover:text-emerald-800 hover:bg-white/50'
            }`}
          >
            <i className={`fas ${tab.icon}`}></i>
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0">
        {renderContent()}
      </div>
    </div>
  );
};

export default PreviewTabs;
