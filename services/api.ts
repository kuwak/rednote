import { ProductInfo, GeneratedCopy, ImageAnalysis, QualityReport } from '../types';

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
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API密钥未配置，请在设置中配置LLM API密钥');
  }
  
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
  
  if (!data?.choices?.[0]?.message?.content) {
    throw new Error('API 返回的响应格式不正确，未找到内容');
  }
  
  const result = extractJson(data.choices[0].message.content);
  
  if (!result.title || !result.content || !Array.isArray(result.tags)) {
    throw new Error('API 返回的数据不完整，缺少必要的字段（title、content 或 tags）');
  }
  
  return result;
};

export const generateImageAnalysisAndPrompt = async (apiKey: string, product: ProductInfo): Promise<{ analysis: ImageAnalysis, qualityReport: QualityReport, prompt: string }> => {
  const prompt = `
    你是一位顶尖小红书爆款封面摄影师。
    任务：根据以下信息为【${product.name}】生成一个高质量的小红书风格营销封面图的英文提示词。

    【产品信息】
    - 产品名称：${product.name}
    - 品类：${product.category}
    - 核心卖点：${product.sellingPoints}
    - 产品特点：${product.features}
    - 目标用户：${product.targetAudience}
    - 风格调性：${product.tone}

    【小红书爆款封面核心要点】
    1. 视觉冲击力：主体突出，画面干净通透
    2. 氛围感：温暖柔和的生活场景，治愈系光线
    3. 真实感：还原使用场景，有生活气息但不杂乱
    4. 质感：高清8K画质，柔光箱级别布光，杂志级后期
    5. 留白：适当留白让视线聚焦产品

    【禁止出现】
    - 文字、价格标签、水印
    - 杂乱背景、穿帮镜头
    - 过度PS的不真实感

    请严格输出 JSON：
    {
      "analysis": {
        "form": "主体形态描述",
        "texture": "材质质感描述",
        "light": "布光方案",
        "atmosphere": "氛围关键词",
        "style": "摄影风格",
        "composition": "构图方案",
        "setting": "场景描述"
      },
      "qualityReport": {
        "subject": {"score": 9.8, "reason": "主体突出"},
        "function": {"score": 9.5, "reason": "卖点可视化强"},
        "structure": {"score": 9.9, "reason": "光影质感高级"},
        "concept": {"score": 9.7, "reason": "场景代入感强"}
      },
      "finalPrompt": "英文提示词"
    }

    【finalPrompt 英文提示词模板参考】
    A premium ${product.category} product photography, ${product.name}, ${product.features}. Shot on Hasselblad medium format camera, soft natural daylight from window, warm color temperature 3500K, minimalist lifestyle scene with ${product.targetAudience} aesthetic, soft pastel background, shallow depth of field, bokeh effect, high-end magazine editorial style, 8K resolution, crystal clear detail, soft shadows, clean composition, trending on Xiaohongshu, lifestyle product shot, inviting atmosphere, no text, no watermark, no price tag, photorealistic, ultra-detailed."
    `;

  const data = await callDeepSeek(apiKey, [{ role: "user", content: prompt }]);
  
  if (!data?.choices?.[0]?.message?.content) {
    throw new Error('API 返回的响应格式不正确，未找到内容');
  }
  
  const result = extractJson(data.choices[0].message.content);
  
  // 验证必要字段，但使用安全的默认值防止 UI 崩溃
  if (!result.analysis && !result.qualityReport && !result.finalPrompt) {
    throw new Error('API 返回的数据不完整，缺少必要的字段（analysis、qualityReport 或 finalPrompt）');
  }
  
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

/**
 * 轮询任务状态直到完成
 */
const pollTaskStatus = async (apiKey: string, taskId: string, maxAttempts: number = 60): Promise<string> => {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
    
    try {
      const response = await fetch(`https://router.shengsuanyun.com/api/v1/tasks/generations/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`获取任务状态失败: ${response.status}`);
      }
      
      const json = await response.json();
      const data = json.data || json;
      
      // 检查任务状态 - 注意是 COMPLETED（全大写）
      if (data.status === 'COMPLETED' || data.status === 'completed' || data.status === 'succeeded') {
        // 查找图片URL - 在 data.image_urls 中
        if (data.data?.image_urls && data.data.image_urls.length > 0) {
          return data.data.image_urls[0];
        }
        if (data.image_urls && data.image_urls.length > 0) {
          return data.image_urls[0];
        }
        if (data.result?.images && data.result.images.length > 0) {
          return data.result.images[0];
        }
        if (data.images && data.images.length > 0) {
          return data.images[0];
        }
        if (data.result?.image) {
          return data.result.image;
        }
        if (data.image) {
          return data.image;
        }
        throw new Error('任务完成但未找到图片URL');
      }
      
      if (data.status === 'FAILED' || data.status === 'failed' || data.status === 'error') {
        throw new Error(`任务失败: ${data.fail_reason || data.error || data.message || '未知错误'}`);
      }
      
      // 继续轮询
    } catch (error) {
      if (i === maxAttempts - 1) {
        throw error;
      }
      // 继续重试
    }
  }
  
  throw new Error('任务超时，请稍后重试');
};

export const generateCoverImage = async (apiKey: string, visualPrompt: string, aspectRatio: string = "3:4"): Promise<string> => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API密钥未配置，请在设置中配置图片生成API密钥');
  }
  
  // 清理提示词，移除可能的前缀
  let cleanPrompt = visualPrompt.trim();
  if (cleanPrompt.startsWith('英文生图提示词:') || cleanPrompt.startsWith('英文生图提示词：')) {
    cleanPrompt = cleanPrompt.replace(/^英文生图提示词[：:]\s*/, '').trim();
  }
  // 移除可能的方括号
  cleanPrompt = cleanPrompt.replace(/^\[|\]$/g, '').trim();
  
  const defaultImage = "https://shengsuanyun.oss-cn-shanghai.aliyuncs.com/modelinfo%2Fprod%2Finput_temp%2F%E5%B0%8F%E5%98%9F%2F283%2F2d6cf4e450d857e6.png";
  const aspectRatioValue = aspectRatio === "1:1" ? "1:1" : aspectRatio === "3:4" ? "3:4" : "16:9";
  
  // 根据宽高比计算尺寸
  const imageSize = aspectRatio === "1:1" ? "2048x2048" : "1536x2048";
  
  try {
    // 创建生成任务 - 使用 google/gemini-3.1-flash-image-preview 模型（纯文生图）
    // 注意：该模型不支持图像输入，如需图生图请换回 bytedance/doubao-seedream-4.5
    const response = await fetch('https://router.shengsuanyun.com/api/v1/tasks/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        prompt: cleanPrompt,
        aspect_ratio: aspectRatioValue,
        response_modalities: ["IMAGE"],
        size: "1K"
      })
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `API Error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage += ` - ${errorJson.error?.message || errorJson.message || errorBody}`;
      } catch {
        errorMessage += ` - ${errorBody}`;
      }
      throw new Error(errorMessage);
    }
    
    const json = await response.json();
    const taskData = json.data || json;
    
    // 检查是否直接返回了图片URL
    if (taskData.image) {
      return taskData.image;
    }
    if (taskData.data?.image_urls && taskData.data.image_urls.length > 0) {
      return taskData.data.image_urls[0];
    }
    if (taskData.result?.image) {
      return taskData.result.image;
    }
    if (taskData.images && taskData.images.length > 0) {
      return taskData.images[0];
    }
    if (taskData.result?.images && taskData.result.images.length > 0) {
      return taskData.result.images[0];
    }
    
    // 如果有任务ID，需要轮询 - 注意是 request_id
    const taskId = taskData.request_id || taskData.task_id || taskData.id || taskData.taskId;
    if (taskId) {
      return await pollTaskStatus(apiKey, taskId);
    }
    
    // 如果任务已完成但没有图片，检查状态
    if (taskData.status === 'COMPLETED' || taskData.status === 'completed' || taskData.status === 'succeeded') {
      throw new Error('任务完成但未找到图片URL');
    }
    
    throw new Error('无法获取任务ID或图片URL');
    
  } catch (error) {
    console.warn("文生图API错误，使用pollinations备用方案:", error);
    // 备用方案：使用 pollinations
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