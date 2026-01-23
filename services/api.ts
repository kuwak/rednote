import { ProductInfo, GeneratedCopy, ImageAnalysis, QualityReport } from '../types';
import { GoogleGenAI } from "@google/genai";

const BASE_URL = "https://router.shengsuanyun.com/api/v1";

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `API Error: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorBody);
      errorMessage += ` - ${errorJson.error?.message || errorBody}`;
    } catch {
      errorMessage += ` - ${errorBody}`;
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

/**
 * 超强鲁棒性的 JSON 提取与修复工具。
 * 针对 AI 常见的格式错误进行多步清洗。
 */
const extractJson = (content: string) => {
  if (!content) throw new Error("AI 响应内容为空");
  
  const trimmed = content.trim();
  
  // 1. 提取最外层的 { ... }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("AI 响应中未找到有效的 JSON 结构。");
  }

  let candidate = trimmed.substring(firstBrace, lastBrace + 1);

  // 2. 多步清洗逻辑
  const sanitize = (str: string) => {
    return str
      .replace(/,\s*([}\]])/g, '$1')              // 移除对象或数组末尾的逗号
      .replace(/#\s*"/g, '"#')                   // 修复 #"标签" -> "#标签"
      .replace(/([^"])\s*#([^"\]\s,]+)/g, '$1"#$2"') // 修复未加引号的 #标签 -> "#标签"
      .replace(/"\s*#/g, '"#')                   // 修复 " #标签 -> "#标签
      .replace(/""#/g, '"#')                     // 修复可能产生的双重引号
      .replace(/\\'/g, "'");                     // 修复转义单引号
  };

  try {
    return JSON.parse(candidate);
  } catch (e) {
    console.warn("直接解析 JSON 失败，尝试进行深度清洗...");
    try {
      const sanitized = sanitize(candidate);
      return JSON.parse(sanitized);
    } catch (finalError) {
      console.error("深度清洗后依然解析失败。原始内容:", candidate);
      try {
        const ultraSanitized = candidate.replace(/"tags"\s*:\s*\[([\s\S]*?)\]/g, (match, arrayContent) => {
           const fixedArray = arrayContent
             .split(',')
             .map(item => {
               const clean = item.trim().replace(/[\[\]"']/g, '').replace(/^#?/, '#');
               return `"${clean}"`;
             })
             .join(', ');
           return `"tags": [${fixedArray}]`;
        });
        return JSON.parse(sanitize(ultraSanitized));
      } catch (e3) {
        throw new Error("AI 返回的 JSON 格式严重受损，请重新尝试。");
      }
    }
  }
};

const callDeepSeek = async (apiKey: string, messages: any[]) => {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-v3.2", 
      messages: messages,
      temperature: 0.6,
      top_p: 0.7,
      stream: false,
      response_format: { type: "json_object" }
    })
  });
  return handleResponse(response);
};

export const generateCopywriting = async (apiKey: string, product: ProductInfo): Promise<GeneratedCopy> => {
  const prompt = `
    你是一位顶尖的小红书爆款内容专家。
    任务：为【${product.name}】撰写一篇爆款种草笔记。
    
    产品卖点：${product.sellingPoints}
    产品特色：${product.features}
    调性：${product.tone}

    要求：
    1. 标题吸引人，包含 Emoji。
    2. 正文分段清晰，使用小红书风格。
    3. tags 数组必须严格使用 ["#标签1", "#标签2"] 格式。
    
    输出格式示例：
    {
      "title": "标题",
      "content": "内容",
      "tags": ["#好物", "#推荐"]
    }
  `;
  const data = await callDeepSeek(apiKey, [{ role: "user", content: prompt }]);
  return extractJson(data.choices[0].message.content);
};

export const generateImageAnalysisAndPrompt = async (apiKey: string, product: ProductInfo): Promise<{ analysis: ImageAnalysis, qualityReport: QualityReport, prompt: string }> => {
  const prompt = `
    你是一位顶尖商业摄影策划。
    任务：根据以下“黄金信息三角”为【${product.name}】策划一张小红书风格封面图并生成英文生图 Prompt。

    【黄金信息三角】
    1. 产品主体：${product.name} (品类: ${product.category})
    2. 物理细节：${product.features} (造型依据)
    3. 卖点与调性：${product.sellingPoints} / 预期风格: ${product.tone}
    4. 目标用户：${product.targetAudience} (决定场景精细度)

    【封面策划要求 - 严格遵循模版】
    - 主题与情绪：创造一个视觉故事（如：松弛的清晨），情绪需呼应“${product.tone}”。
    - 视觉化卖点：如果卖点包含舒适/柔软/支撑，画面必须体现。特别是枕头类产品，必须呈现自然的【回弹凹陷感】，体现被头部压出的弧度，质感软糯实心。
    - 场景与构图：将产品置于理想化场景（如：${product.targetAudience}向往的极简卧室）。
    - 强化调性：生活化质感，电影感滤镜。
    - 严禁：文字、价格、杂乱背景、完整人脸。

    请严格输出 JSON 对象：
    {
      "analysis": {
        "form": "主体形态描述",
        "texture": "质感描述",
        "light": "光影方案",
        "atmosphere": "情绪词",
        "style": "摄影风格",
        "composition": "构图方案",
        "setting": "场景环境描述"
      },
      "qualityReport": {
        "subject": {"score": 9.8, "reason": "描述形态符合度"},
        "function": {"score": 9.5, "reason": "描述卖点视觉化程度"},
        "structure": {"score": 9.9, "reason": "描述光影高级感"},
        "concept": {"score": 9.7, "reason": "描述场景代入感"}
      },
      "finalPrompt": "英文生图提示词: [A high-end commercial shot of ${product.name} featuring ${product.features} in a lifestyle setting for ${product.targetAudience}. Cinematic lighting, ergonomic pillow with soft head indentation, soft bed sheets, minimalist room, ${product.tone} atmosphere, 8k, photorealistic, shallow depth of field, minimalist aesthetic, no text.]"
    }
  `;

  const data = await callDeepSeek(apiKey, [{ role: "user", content: prompt }]);
  const result = extractJson(data.choices[0].message.content);

  // Ensure qualityReport structure exists to prevent UI crashes
  const defaultItem = { score: 8.5, reason: "符合基础商业摄影标准" };
  const safeQualityReport: QualityReport = {
    subject: result.qualityReport?.subject || { score: 9.0, reason: "主体形态呈现清晰" },
    function: result.qualityReport?.function || defaultItem,
    structure: result.qualityReport?.structure || defaultItem,
    concept: result.qualityReport?.concept || defaultItem,
  };

  return {
    analysis: result.analysis || {}, 
    qualityReport: safeQualityReport,
    prompt: result.finalPrompt || ""
  };
};

export const generateCoverImage = async (apiKey: string, visualPrompt: string, aspectRatio: string = "3:4"): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts: [{ text: visualPrompt }] }],
      config: {
        imageConfig: {
          aspectRatio: (aspectRatio === "3:4" ? "3:4" : "1:1") as any
        }
      }
    });

    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData?.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image data");
  } catch (error) {
    console.warn("Gemini Error, falling back to pollinations:", error);
    const cleanPrompt = encodeURIComponent(visualPrompt.substring(0, 350));
    const width = aspectRatio === "1:1" ? 1024 : 1080;
    const height = aspectRatio === "1:1" ? 1024 : 1440;
    return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&nologo=true&seed=${Math.floor(Math.random()*10000)}`;
  }
};

export const generatePosterCopy = async (apiKey: string, product: ProductInfo) => { 
  const prompt = `为【${product.name}】生成封面大字文案（10字内）。
  只需返回 JSON: {"slogan": "文案"}`;
  const data = await callDeepSeek(apiKey, [{ role: "user", content: prompt }]);
  try {
    const result = extractJson(data.choices[0].message.content);
    return result.slogan || product.name;
  } catch {
    return product.name;
  }
};