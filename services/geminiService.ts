
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

// Standard client for non-video tasks
export const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateArticle = async (prompt: string, history?: any[]): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `다음 키워드/아이디어를 바탕으로 고품질의 기사나 이야기를 한국어로 작성해 주세요: ${prompt}. 독자의 흥미를 끌 수 있도록 전문적이고 매력적인 어조를 사용하세요.`,
  });
  return response.text || "텍스트 생성에 실패했습니다.";
};

export const refineContent = async (originalContent: string, instruction: string, type: 'text' | 'summary' | 'web'): Promise<string> => {
  const ai = getAiClient();
  const typeLabels = { text: '기사', summary: '요약본', web: '웹 HTML 코드' };
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `원본 ${typeLabels[type]}: ${originalContent}\n\n사용자 요청: ${instruction}\n\n위 요청에 맞춰 원본을 수정해 주세요. 수정된 내용만 반환해 주세요.`,
  });
  return response.text || originalContent;
};

export const generateSummary = async (text: string): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `다음 텍스트를 소셜 미디어 게시물이나 카드뉴스 형식에 적합하도록 한국어로 핵심만 요약해 주세요: ${text}`,
  });
  return response.text || "요약 생성에 실패했습니다.";
};

export const generateWebCode = async (text: string): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `이 내용을 바탕으로 한국어로 된 깔끔하고 반응형인 단일 페이지 HTML 레이아웃(Tailwind CSS 사용)을 생성해 주세요: ${text}. <div> 태그 안에 직접 렌더링할 수 있는 HTML 코드만 반환하세요. <html>이나 <body> 태그는 포함하지 마세요. 인라인 스타일보다는 Tailwind 클래스를 적극 활용하세요.`,
  });
  return response.text || "<div>웹 미리보기 생성에 실패했습니다.</div>";
};

export const generateImage = async (prompt: string): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `A high-quality cinematic illustration for: ${prompt}. Artistic and professional style, 4k resolution, highly detailed.` }],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
      },
    },
  });

  let imageUrl = '';
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return imageUrl;
};

/**
 * Generates a video storyboard (sequence of images + captions) as an alternative to Veo3.
 */
export const generateStoryboard = async (prompt: string): Promise<{ imageUrl: string, caption: string }[]> => {
  const ai = getAiClient();
  
  // 1. Define 3 scenes
  const sceneDefResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            visualPrompt: { type: Type.STRING, description: "Detailed visual description for an image generator." },
            caption: { type: Type.STRING, description: "Korean caption for this scene." }
          },
          required: ["visualPrompt", "caption"]
        }
      }
    },
    contents: `다음 주제에 대해 3개의 핵심 장면으로 구성된 영상 스토리보드를 기획해 주세요: ${prompt}. 각 장면은 이미지 생성 모델을 위한 상세한 영어 묘사(visualPrompt)와 영상 하단에 들어갈 짧은 한국어 자막(caption)을 포함해야 합니다.`,
  });

  const scenes = JSON.parse(sceneDefResponse.text || "[]");
  
  // 2. Generate images for each scene
  const storyboard = await Promise.all(scenes.map(async (scene: any) => {
    const imageUrl = await generateImage(scene.visualPrompt);
    return { imageUrl, caption: scene.caption };
  }));

  return storyboard;
};
