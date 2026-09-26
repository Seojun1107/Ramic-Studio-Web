const DISCORD_MAX_CONTENT = 2000;

export type DiscordNoticeOptions = {
  title: string;
  body: string;
  mentionEveryone: boolean;
  customBody?: string;
};

export type DiscordNoticeResult =
  | { sent: true; message: string }
  | { sent: false; message: string; skipped?: boolean };

function trimDiscordContent(value: string) {
  if (value.length <= DISCORD_MAX_CONTENT) return value;
  return `${value.slice(0, DISCORD_MAX_CONTENT - 24).trimEnd()}\n… (내용 일부 생략)`;
}

export async function publishDiscordNotice(
  options: DiscordNoticeOptions
): Promise<DiscordNoticeResult> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!webhookUrl)
    return {
      sent: false,
      skipped: true,
      message: "DISCORD_WEBHOOK_URL이 설정되지 않았습니다.",
    };

  const content = trimDiscordContent(
    options.customBody?.trim() || `${options.title.trim()}\n\n${options.body.trim()}`
  );
  const payload = {
    content: options.mentionEveryone ? `@everyone\n${content}` : content,
    allowed_mentions: options.mentionEveryone ? { parse: ["everyone"] } : { parse: [] },
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 180);
      return {
        sent: false,
        message: `Discord 전송 실패 (${response.status})${detail ? `: ${detail}` : ""}`,
      };
    }
    return { sent: true, message: "Discord 공지까지 전송되었습니다." };
  } catch (error) {
    return {
      sent: false,
      message:
        error instanceof Error
          ? `Discord 연결 실패: ${error.message}`
          : "Discord 연결에 실패했습니다.",
    };
  }
}
