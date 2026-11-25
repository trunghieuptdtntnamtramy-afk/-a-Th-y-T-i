import { WORKSPACE_PROJECT_ID } from './workspaceAuth';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface GmailMessageSummary {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
}

export interface ChatSpaceItem {
  name: string;
  displayName?: string;
  spaceType?: string;
}

export interface ContactPerson {
  resourceName: string;
  name: string;
  email: string;
}

export interface FormSummary {
  formId: string;
  title: string;
  description?: string;
  questionCount: number;
  responseCount: number;
  responderUri?: string;
}

export interface SlideDeckSummary {
  presentationId: string;
  title: string;
  slideCount: number;
  snippets: string[];
}

async function parseGoogleResponse<T>(res: Response, serviceName: string): Promise<T> {
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const rawMsg =
      payload?.error?.message ||
      payload?.message ||
      `Yêu cầu ${serviceName} thất bại (HTTP ${res.status}).`;

    if (serviceName === 'Google Chat' && (res.status === 404 || rawMsg.includes('Chat app not found'))) {
      throw new Error(
        `${rawMsg} Lưu ý: Google Chat API yêu cầu tài khoản Google Workspace (Business/Enterprise) và cần cấu hình Chat App trong Google Cloud Console (project ${WORKSPACE_PROJECT_ID}).`
      );
    }
    if (res.status === 401) {
      throw new Error('Phiên kết nối Google Workspace đã hết hạn. Vui lòng nhấn Đăng nhập Google Workspace lại.');
    }
    throw new Error(rawMsg);
  }
  return payload as T;
}

// 1. Google Drive
export async function listDriveFiles(
  accessToken: string,
  query?: string
): Promise<DriveFileItem[]> {
  const baseQ = 'trashed = false';
  const fullQ = query?.trim()
    ? `${baseQ} and name contains '${query.trim().replace(/'/g, "\\'")}'`
    : baseQ;
  const params = new URLSearchParams({
    pageSize: '15',
    q: fullQ,
    fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
    orderBy: 'modifiedTime desc',
  });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await parseGoogleResponse<{ files?: DriveFileItem[] }>(res, 'Google Drive');
  return data.files ?? [];
}

// 2. Google Docs
export async function createStudyNoteDoc(
  accessToken: string,
  title: string,
  bodyText: string
): Promise<{ documentId: string; url: string }> {
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });
  const docData = await parseGoogleResponse<{ documentId: string }>(createRes, 'Google Docs');
  const documentId = docData.documentId;

  if (bodyText.trim()) {
    const updateRes = await fetch(
      `https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: bodyText,
              },
            },
          ],
        }),
      }
    );
    await parseGoogleResponse(updateRes, 'Google Docs');
  }

  return {
    documentId,
    url: `https://docs.google.com/document/d/${documentId}/edit`,
  };
}

// 3. Google Sheets
export async function exportProgressToSheet(
  accessToken: string,
  title: string,
  rows: string[][]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [{ properties: { title: 'EDU_SMART' } }],
    }),
  });
  const created = await parseGoogleResponse<{
    spreadsheetId: string;
    spreadsheetUrl: string;
    sheets?: Array<{ properties?: { title?: string } }>;
  }>(createRes, 'Google Sheets');

  const firstSheetTitle = created.sheets?.[0]?.properties?.title || 'EDU_SMART';
  const range = encodeURIComponent(`${firstSheetTitle}!A1`);
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(created.spreadsheetId)}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rows }),
    }
  );
  await parseGoogleResponse(updateRes, 'Google Sheets');

  return {
    spreadsheetId: created.spreadsheetId,
    spreadsheetUrl: created.spreadsheetUrl,
  };
}

export async function readSpreadsheetPreview(
  accessToken: string,
  spreadsheetId: string
): Promise<{ title: string; sheetName: string; rows: string[][] }> {
  const safeId = encodeURIComponent(spreadsheetId.trim());
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${safeId}?fields=properties.title,sheets.properties.title`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const meta = await parseGoogleResponse<{
    properties?: { title?: string };
    sheets?: Array<{ properties?: { title?: string } }>;
  }>(metaRes, 'Google Sheets');

  const sheetName = meta.sheets?.[0]?.properties?.title;
  if (!sheetName) {
    throw new Error('Không tìm thấy trang tính nào trong bảng tính này.');
  }

  const range = encodeURIComponent(`${sheetName}!A1:F15`);
  const valuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${safeId}/values/${range}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const valuesData = await parseGoogleResponse<{ values?: string[][] }>(
    valuesRes,
    'Google Sheets'
  );
  return {
    title: meta.properties?.title || 'Bảng tính',
    sheetName,
    rows: valuesData.values ?? [],
  };
}

// 4. Google Slides
export async function getSlideDeckSummary(
  accessToken: string,
  presentationId: string
): Promise<SlideDeckSummary> {
  const safeId = encodeURIComponent(presentationId.trim());
  const res = await fetch(`https://slides.googleapis.com/v1/presentations/${safeId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await parseGoogleResponse<{
    presentationId: string;
    title?: string;
    slides?: Array<{
      pageElements?: Array<{
        shape?: {
          text?: {
            textElements?: Array<{ textRun?: { content?: string } }>;
          };
        };
      }>;
    }>;
  }>(res, 'Google Slides');

  const slides = data.slides ?? [];
  const snippets = slides.slice(0, 6).map((slide, idx) => {
    const texts: string[] = [];
    for (const el of slide.pageElements ?? []) {
      for (const te of el.shape?.text?.textElements ?? []) {
        if (te.textRun?.content) texts.push(te.textRun.content.trim());
      }
    }
    const joined = texts.filter(Boolean).join(' · ').slice(0, 180);
    return `Slide ${idx + 1}: ${joined || '(Không có văn bản)'}`;
  });

  return {
    presentationId: data.presentationId,
    title: data.title || 'Bài trình chiếu',
    slideCount: slides.length,
    snippets,
  };
}

// 5. Gmail
export async function listRecentGmail(accessToken: string): Promise<GmailMessageSummary[]> {
  const listRes = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=6',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const listData = await parseGoogleResponse<{ messages?: Array<{ id: string }> }>(
    listRes,
    'Gmail'
  );
  const ids = listData.messages ?? [];
  if (!ids.length) return [];

  const details = await Promise.all(
    ids.map(async ({ id }) => {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const msg = await parseGoogleResponse<{
        id: string;
        snippet?: string;
        payload?: { headers?: Array<{ name: string; value: string }> };
      }>(msgRes, 'Gmail');
      const headers = msg.payload?.headers ?? [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
      return {
        id: msg.id,
        subject: getHeader('Subject') || '(Không có tiêu đề)',
        from: getHeader('From') || 'Không rõ người gửi',
        date: getHeader('Date') || '',
        snippet: msg.snippet || '',
      };
    })
  );
  return details;
}

export async function sendGmailReport(
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<{ id: string }> {
  const rawMime = [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'Content-Type: text/plain; charset=UTF-8',
    'MIME-Version: 1.0',
    '',
    body,
  ].join('\r\n');

  const encoded = btoa(unescape(encodeURIComponent(rawMime)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encoded }),
  });
  return parseGoogleResponse<{ id: string }>(res, 'Gmail');
}

// 6. Google Chat
export async function listChatSpaces(accessToken: string): Promise<ChatSpaceItem[]> {
  const res = await fetch('https://chat.googleapis.com/v1/spaces?pageSize=10', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await parseGoogleResponse<{ spaces?: ChatSpaceItem[] }>(res, 'Google Chat');
  return data.spaces ?? [];
}

export async function postChatMessage(
  accessToken: string,
  spaceName: string,
  text: string
): Promise<{ name: string }> {
  const safeSpace = spaceName.startsWith('spaces/')
    ? `spaces/${encodeURIComponent(spaceName.replace(/^spaces\//, ''))}`
    : `spaces/${encodeURIComponent(spaceName)}`;
  const res = await fetch(`https://chat.googleapis.com/v1/${safeSpace}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  return parseGoogleResponse<{ name: string }>(res, 'Google Chat');
}

// 7. Google Forms
export async function getFormSummary(
  accessToken: string,
  formId: string
): Promise<FormSummary> {
  const safeFormId = encodeURIComponent(formId.trim());
  const [formRes, respRes] = await Promise.all([
    fetch(`https://forms.googleapis.com/v1/forms/${safeFormId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    fetch(`https://forms.googleapis.com/v1/forms/${safeFormId}/responses?pageSize=20`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  ]);

  const formData = await parseGoogleResponse<{
    formId: string;
    info?: { title?: string; description?: string };
    items?: unknown[];
    responderUri?: string;
  }>(formRes, 'Google Forms');

  let responseCount = 0;
  if (respRes.ok) {
    const respData = (await respRes.json().catch(() => ({}))) as { responses?: unknown[] };
    responseCount = respData.responses?.length ?? 0;
  }

  return {
    formId: formData.formId,
    title: formData.info?.title || 'Biểu mẫu Google Forms',
    description: formData.info?.description,
    questionCount: formData.items?.length ?? 0,
    responseCount,
    responderUri: formData.responderUri,
  };
}

// 8. Google Meet
export async function createMeetStudyRoom(
  accessToken: string
): Promise<{ meetingUri: string; meetingCode: string; name: string }> {
  const res = await fetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  return parseGoogleResponse<{ meetingUri: string; meetingCode: string; name: string }>(
    res,
    'Google Meet'
  );
}

// 9. Google Contacts (People API)
export async function listGoogleContacts(accessToken: string): Promise<ContactPerson[]> {
  const res = await fetch(
    'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses&pageSize=20',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await parseGoogleResponse<{
    connections?: Array<{
      resourceName: string;
      names?: Array<{ displayName?: string }>;
      emailAddresses?: Array<{ value?: string }>;
    }>;
  }>(res, 'Google Contacts');

  return (data.connections ?? [])
    .map((person) => ({
      resourceName: person.resourceName,
      name: person.names?.[0]?.displayName || 'Chưa đặt tên',
      email: person.emailAddresses?.[0]?.value || '',
    }))
    .filter((c) => c.email);
}
