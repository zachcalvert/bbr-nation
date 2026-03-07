const BBR_CHAT_API_URL = "https://bbr-chat-service.fly.dev/chat/api/query/";

export async function queryBbrChatService(
  text: string,
  userId: string
): Promise<string> {
  const apiKey = process.env.BBR_CHAT_API_KEY;
  if (!apiKey) {
    throw new Error("BBR_CHAT_API_KEY is not set");
  }

  const response = await fetch(BBR_CHAT_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, groupme_id: userId }),
  });

  if (!response.ok) {
    throw new Error(`bbr-chat-service error: ${response.status}`);
  }

  const data = (await response.json()) as { groupme_id: string; response: string };
  return data.response;
}
