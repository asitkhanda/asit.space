import { getEnv } from "@/lib/env";

const API = "https://api.telegram.org";

function token() {
  const t = getEnv("TELEGRAM_BOT_TOKEN");
  if (!t) throw new Error("Missing TELEGRAM_BOT_TOKEN");
  return t;
}

export async function sendMessage(chatId: number, text: string) {
  const res = await fetch(`${API}/bot${token()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("telegram sendMessage failed", res.status, body);
  }
}

type FileResult = {
  file_id: string;
  file_unique_id: string;
  file_path?: string;
  file_size?: number;
};

export async function getFile(fileId: string): Promise<FileResult> {
  const res = await fetch(`${API}/bot${token()}/getFile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId }),
  });
  const json = (await res.json()) as {
    ok: boolean;
    result?: FileResult;
    description?: string;
  };
  if (!json.ok || !json.result?.file_path) {
    throw new Error(json.description ?? "getFile failed");
  }
  return json.result;
}

export async function downloadFile(filePath: string): Promise<ArrayBuffer> {
  const res = await fetch(`${API}/file/bot${token()}/${filePath}`);
  if (!res.ok) {
    throw new Error(`download failed: ${res.status}`);
  }
  return res.arrayBuffer();
}
