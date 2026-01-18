import React, { useState } from 'react';
import { ProductInfo } from '../types';

interface Props {
  onSubmit: (info: ProductInfo) => void;
  isLoading: boolean;
}

const TONE_OPTIONS = [
  '温馨治愈', 
  '活泼俏皮', 
  '专业测评', 
  '种草安利', 
  '简约高级'
];

const InputForm: React.FC<Props> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<ProductInfo>({
    name: '',
    sellingPoints: '',
    features: '',
    category: '',
    tone: '',
    targetAudience: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToneSelect = (selectedTone: string) => {
    setFormData(prev => ({
      ...prev,
      tone: prev.tone === selectedTone ? '' : selectedTone 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const fillDemoData = () => {
    setFormData({
      name: '云朵感记忆棉枕头',
      sellingPoints: '模拟云朵般的柔软包裹感，帮助使用者快速放松入睡。',
      features: '慢回弹记忆棉、透气网眼面料、符合人体工学的颈部支撑曲线。',
      category: '家居床品',
      tone: '温馨治愈',
      targetAudience: '追求高质量睡眠的城市上班族'
    });
  };

  return (
    <div className="max-w-2xl mx-auto w-full animate-fade-in-up">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            创建新策划案
          </h2>
          <button 
            type="button"
            onClick={fillDemoData}
            className="text-xs font-medium text-xhs-red bg-red-50 px-3 py-1 rounded-full hover:bg-red-100 transition-colors"
          >
            自动填充示例
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">产品名称</label>
            <input
              required
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="例如：极光夜间修护霜"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-xhs-red/20 focus:border-xhs-red outline-none transition-all"
            />
          </div>

          {/* Selling Points */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">核心卖点</label>
            <textarea
              required
              name="sellingPoints"
              value={formData.sellingPoints}
              onChange={handleChange}
              rows={3}
              placeholder="用户为什么买它？例如：7天见效、性价比高..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-xhs-red/20 focus:border-xhs-red outline-none transition-all resize-none"
            />
          </div>

          {/* Highlights */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">产品特色</label>
            <textarea
              required
              name="features"
              value={formData.features}
              onChange={handleChange}
              rows={2}
              placeholder="外观细节、特殊设计或材质特征..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-xhs-red/20 focus:border-xhs-red outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">产品种类</label>
              <input
                required
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="例如：护肤品、家居..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-xhs-red/20 focus:border-xhs-red outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">目标人群</label>
              <input
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleChange}
                placeholder="例如：职场新人..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-xhs-red/20 focus:border-xhs-red outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              预期风格 (Tone)
            </label>
            <div className="flex flex-wrap gap-3">
              {TONE_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleToneSelect(t)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    formData.tone === t
                      ? 'bg-xhs-red text-white border-xhs-red shadow-md shadow-red-100'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-xhs-red/50 hover:text-xhs-red'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg shadow-red-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0
              ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-xhs-red hover:bg-red-600'}
            `}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="fas fa-spinner fa-spin"></i> 正在生成方案...
              </span>
            ) : (
              '开始策划 ✨'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InputForm;