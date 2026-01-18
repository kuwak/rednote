import React, { useState, useEffect } from 'react';
import { AppState, ProductInfo } from './types';
import SettingsModal from './components/SettingsModal';
import InputForm from './components/InputForm';
import ResultPreview from './components/ResultPreview';
import { generateCopywriting, generateImageAnalysisAndPrompt, generateCoverImage } from './services/api';

const DEFAULT_LLM_KEY = 'qOAAQD7IMiQ8TjDl5lSIs225pLNltaPt7qa17g8aKbAJuiNCyZjW2B6tZGsKFvDF2ikkAFE6Ou6jEg';

interface LoadingStep {
  id: number;
  label: string;
  status: 'waiting' | 'active' | 'completed';
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    llmApiKey: '',
    imgApiKey: '', 
    hasKeys: false,
    step: 'input',
    productInfo: { name: '', sellingPoints: '', features: '', category: '', tone: '', targetAudience: '' },
    generatedCopy: null,
    generatedImage: null,
    isSettingsOpen: false,
    isLoading: false,
    loadingMessage: '',
    currentAnalysis: undefined
  });

  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([
    { id: 1, label: '语义解析与卖点提取', status: 'waiting' },
    { id: 2, label: '视觉特征维度拆解', status: 'waiting' },
    { id: 3, label: '基础形态认知对齐', status: 'waiting' },
    { id: 4, label: '美学构图场域生成', status: 'waiting' },
    { id: 5, label: '渲染高质量封面图', status: 'waiting' },
  ]);

  useEffect(() => {
    const storedLlmKey = localStorage.getItem('rednote_llm_key') || DEFAULT_LLM_KEY;
    setState(prev => ({ ...prev, llmApiKey: storedLlmKey, hasKeys: true }));
  }, []);

  const updateStepStatus = (id: number, status: 'waiting' | 'active' | 'completed') => {
    setLoadingSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const handleGenerate = async (info: ProductInfo) => {
    setState(prev => ({ ...prev, isLoading: true, productInfo: info }));
    setLoadingSteps(prev => prev.map(s => ({ ...s, status: 'waiting' })));

    try {
      // Step 1
      updateStepStatus(1, 'active');
      const copyPromise = generateCopywriting(state.llmApiKey, info);
      await new Promise(r => setTimeout(r, 1000));
      updateStepStatus(1, 'completed');

      // Step 2
      updateStepStatus(2, 'active');
      const analysisResult = await generateImageAnalysisAndPrompt(state.llmApiKey, info);
      setState(prev => ({ ...prev, currentAnalysis: analysisResult.analysis }));
      await new Promise(r => setTimeout(r, 800));
      updateStepStatus(2, 'completed');

      // Step 3: Base shape (Simulated logic flow)
      updateStepStatus(3, 'active');
      await new Promise(r => setTimeout(r, 1200));
      updateStepStatus(3, 'completed');

      // Step 4: Composition
      updateStepStatus(4, 'active');
      await new Promise(r => setTimeout(r, 1000));
      updateStepStatus(4, 'completed');

      // Step 5: Render
      updateStepStatus(5, 'active');
      const [copy, imageUrl] = await Promise.all([
        copyPromise,
        generateCoverImage(state.llmApiKey, analysisResult.prompt)
      ]);
      updateStepStatus(5, 'completed');

      // Finish
      await new Promise(r => setTimeout(r, 600));
      setState(prev => ({
        ...prev,
        isLoading: false,
        step: 'preview',
        generatedCopy: copy,
        generatedImage: { 
          url: imageUrl, 
          promptUsed: analysisResult.prompt, 
          analysis: analysisResult.analysis,
          qualityReport: analysisResult.qualityReport
        }
      }));
    } catch (error) {
      console.error("Generate error:", error);
      alert('内容生成失败，请重试');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="min-h-screen pb-12 bg-[#f8f9fa]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-xhs-red rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">R</div>
            <h1 className="font-bold text-xl text-gray-800 tracking-tight">RedNote Agent</h1>
          </div>
          <button 
            onClick={() => setState(prev => ({ ...prev, isSettingsOpen: true }))} 
            className="text-gray-400 hover:text-xhs-red transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-red-50"
          >
            <i className="fas fa-sliders-h text-sm"></i>
            <span className="text-sm font-bold tracking-wide">配置</span>
          </button>
        </div>
      </header>

      <main className="px-4 py-8">
        {state.isLoading && (
          <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-md">
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-red-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 text-xhs-red animate-pulse">
                  <i className="fas fa-microchip text-3xl"></i>
                </div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">AI 视觉策划中</h2>
                <p className="text-gray-400 text-sm font-medium">正在按流程构建您的爆款笔记...</p>
              </div>

              <div className="space-y-3">
                {loadingSteps.map((step) => (
                  <div 
                    key={step.id} 
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                      step.status === 'active' ? 'bg-white border-xhs-red shadow-xl shadow-red-50 scale-[1.02]' :
                      step.status === 'completed' ? 'bg-gray-50 border-transparent opacity-60' :
                      'bg-transparent border-transparent opacity-20'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                      step.status === 'active' ? 'bg-xhs-red text-white' :
                      step.status === 'completed' ? 'bg-green-500 text-white' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {step.status === 'completed' ? <i className="fas fa-check"></i> : step.id}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${step.status === 'active' ? 'text-gray-900' : 'text-gray-500'}`}>
                        {step.label}
                      </p>
                      {step.status === 'active' && (
                        <div className="flex gap-1 mt-1">
                          {[0, 1, 2].map(i => (
                            <div key={i} className="w-1.5 h-1.5 bg-xhs-red rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {state.step === 'input' && <InputForm onSubmit={handleGenerate} isLoading={state.isLoading} />}
        {state.step === 'preview' && state.generatedCopy && state.generatedImage && (
          <ResultPreview 
            copy={state.generatedCopy}
            image={state.generatedImage}
            productInfo={state.productInfo}
            llmApiKey={state.llmApiKey}
            onReset={() => setState(prev => ({ ...prev, step: 'input' }))}
            onRegenerateImage={() => handleGenerate(state.productInfo)} 
          />
        )}
      </main>

      <SettingsModal 
        isOpen={state.isSettingsOpen} 
        onClose={() => setState(prev => ({ ...prev, isSettingsOpen: false }))}
        onSave={(l, i) => setState(prev => ({ ...prev, llmApiKey: l, imgApiKey: i, isSettingsOpen: false }))}
        currentLlmKey={state.llmApiKey}
        currentImgKey={state.imgApiKey}
      />
    </div>
  );
};

export default App;