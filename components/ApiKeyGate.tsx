
import React, { useState, useEffect } from 'react';

interface ApiKeyGateProps {
  onSuccess: () => void;
}

const ApiKeyGate: React.FC<ApiKeyGateProps> = ({ onSuccess }) => {
  const [hasKey, setHasKey] = useState<boolean>(false);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      const exists = await window.aistudio.hasSelectedApiKey();
      setHasKey(exists);
    };
    checkKey();
  }, []);

  const handleOpenSelector = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    // Assume success per instructions
    onSuccess();
  };

  if (hasKey) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-key text-2xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">프리미엄 기능 액세스</h2>
        <p className="text-gray-600 mb-6">
          고품질 영상 생성 기능은 유료 Google Cloud 프로젝트 API 키가 필요합니다. 
          계속하시려면 API 키를 선택해 주세요.
        </p>
        <div className="space-y-4">
          <button
            onClick={handleOpenSelector}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
          >
            API 키 선택하기
          </button>
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-blue-500 hover:underline"
          >
            결제 정보 자세히 알아보기
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyGate;
