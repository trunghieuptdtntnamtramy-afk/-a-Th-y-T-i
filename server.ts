import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const PORT = 3000;
const app = express();
app.use(express.json({ limit: '1mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const COACH_SYSTEM_INSTRUCTION = `Bạn là AI Coach của hệ sinh thái học tập thông minh EDU SMART dành cho học sinh Trường PTDTNT THPT Quảng Nam.

Nguyên tắc sư phạm BẮT BUỘC:
1. KHÔNG BAO GIỜ đưa ra đáp án hoàn chỉnh hoặc bài giải trọn vẹn để học sinh chép lại ngay ở lượt đầu.
2. Luôn ghi nhận và phản hồi tích cực phần "Suy nghĩ ban đầu (Think First)" của học sinh nếu có, chỉ ra điểm hợp lý và điểm cần làm rõ thêm.
3. Gợi mở từng bước (scaffolding) bằng 2–3 câu hỏi dẫn dắt hoặc gợi ý phương pháp tiếp cận theo chương trình GDPT 2018.
4. Nhắc học sinh tự kiểm chứng thông tin bằng sách giáo khoa, vở ghi hoặc tài liệu tin cậy ở bước Fact Check.
5. Trả lời bằng tiếng Việt rõ ràng, mạch lạc, súc tích, thân thiện và tôn trọng tư duy độc lập của học sinh.
6. Trình bày bằng văn bản thuần tự nhiên, KHÔNG dùng dấu sao markdown (**) hay ký hiệu LaTeX ($...$), viết công thức bằng chữ/ký hiệu thông thường (ví dụ: I = U / R).`;

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

function extractErrorStatus(err: unknown): { code?: number; message: string } {
  const rawMessage = err instanceof Error ? err.message : String(err ?? '');
  const statusProp =
    typeof err === 'object' && err !== null && 'status' in err
      ? Number((err as { status?: unknown }).status)
      : undefined;

  if (rawMessage.includes('API_KEY_INVALID') || rawMessage.includes('PERMISSION_DENIED') || statusProp === 403) {
    return { code: 403, message: rawMessage };
  }
  if (rawMessage.includes('RESOURCE_EXHAUSTED') || rawMessage.includes('"code":429') || statusProp === 429) {
    return { code: 429, message: rawMessage };
  }
  if (
    rawMessage.includes('UNAVAILABLE') ||
    rawMessage.includes('"code":503') ||
    rawMessage.includes('high demand') ||
    statusProp === 503
  ) {
    return { code: 503, message: rawMessage };
  }
  return { code: statusProp, message: rawMessage };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.post('/api/ai-coach', async (req, res) => {
  try {
    const { subject, question, priorThinking, mode } = req.body ?? {};

    if (typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập nội dung câu hỏi cần AI Coach gợi mở.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng kiểm tra mục Settings > Secrets.',
      });
    }

    const cleanSubject = typeof subject === 'string' && subject.trim() ? subject.trim() : 'Tổng hợp';
    const cleanQuestion = question.trim().slice(0, 2000);
    const cleanPrior = typeof priorThinking === 'string' ? priorThinking.trim().slice(0, 3000) : '';
    const modeLabel =
      mode === 'outline'
        ? 'Hãy gợi ý dàn ý/các bước tư duy theo trình tự, không viết hộ bài hoàn chỉnh.'
        : mode === 'check_reasoning'
          ? 'Hãy phản biện nhẹ nhàng lập luận ban đầu của em và đặt câu hỏi giúp em tự phát hiện lỗ hổng kiến thức.'
          : 'Hãy gợi mở từng bước và đặt câu hỏi dẫn dắt để em tự tìm ra hướng giải.';

    const promptParts = [
      `Môn học: ${cleanSubject}`,
      `Yêu cầu sư phạm: ${modeLabel}`,
      cleanPrior ? `Suy nghĩ ban đầu (Think First) của học sinh:\n${cleanPrior}` : 'Học sinh chưa ghi phần Think First trước đó — hãy nhắc nhẹ em tóm tắt hướng nghĩ của mình sau gợi ý.',
      `Câu hỏi / khó khăn của học sinh:\n${cleanQuestion}`,
    ];

    const delaysMs = [1200, 2400];
    let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null;
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= delaysMs.length; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: promptParts.join('\n\n'),
          config: {
            systemInstruction: COACH_SYSTEM_INSTRUCTION,
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.HIGH,
            },
          },
        });
        break;
      } catch (err: unknown) {
        lastError = err;
        const parsed = extractErrorStatus(err);
        const isTransient = parsed.code === 503 || parsed.code === 429;
        if (!isTransient || attempt === delaysMs.length) {
          throw err;
        }
        await sleep(delaysMs[attempt]);
      }
    }

    const text = response?.text?.trim();
    if (!text) {
      throw lastError ?? new Error('EMPTY_RESPONSE');
    }

    return res.json({
      guidance: text,
      model: 'gemini-4-hydrogen',
    });
  } catch (err: unknown) {
    console.error('AI Coach API error:', err);
    const parsed = extractErrorStatus(err);
    const status =
      parsed.code === 403 ? 403 : parsed.code === 429 ? 429 : parsed.code === 503 ? 503 : 500;
    const errorMessage =
      status === 403
        ? 'API key Gemini không hợp lệ hoặc chưa đủ quyền. Vui lòng kiểm tra Settings > Secrets.'
        : status === 429
          ? 'Hệ thống AI đang vượt hạn mức truy cập tạm thời. Em hãy thử lại sau ít phút.'
          : status === 503
            ? 'Trợ lý AI đang có lượng truy cập cao tạm thời. Em hãy thử bấm "Yêu cầu gợi mở" lại sau vài giây.'
            : 'Không thể kết nối tới trợ lý AI lúc này. Em hãy thử lại sau ít giây.';
    return res.status(status).json({ error: errorMessage });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EDU SMART server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
