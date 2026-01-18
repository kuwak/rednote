import React, { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (llmKey: string, imgKey: string) => void;
  currentLlmKey: string;
  currentImgKey: string;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, onSave, currentLlmKey, currentImgKey }) => {
  const [llmKey, setLlmKey] = useState(currentLlmKey);
  const [imgKey, setImgKey] = useState(currentImgKey);
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    setLlmKey(currentLlmKey);
    setImgKey(currentImgKey);
  }, [currentLlmKey, currentImgKey, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">设置 API Key</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <div className="space-y-6 mb-8">
            {/* LLM Key Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                大模型 API Key (DeepSeek)
              </label>
              <div className="relative">
                <input
                  type={showKeys ? "text" : "password"}
                  value={llmKey}
                  onChange={(e) => setLlmKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-xhs-red focus:border-transparent outline-none transition-all pr-12"
                />
                <button 
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <i className={`fas ${showKeys ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                用于生成文案内容和图片提示词。
              </p>
            </div>

            {/* Image Gen Key Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                生图模型 API Key (Gemini)
              </label>
              <div className="relative">
                <input
                  type={showKeys ? "text" : "password"}
                  value={imgKey}
                  onChange={(e) => setImgKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-xhs-red focus:border-transparent outline-none transition-all pr-12"
                />
                <button 
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <i className={`fas ${showKeys ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                用于生成封面图片。
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => onSave(llmKey, imgKey)}
              className="flex-1 px-4 py-3 text-white bg-xhs-red hover:bg-red-600 rounded-xl font-medium shadow-lg shadow-red-200 transition-colors"
            >
              保存配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;