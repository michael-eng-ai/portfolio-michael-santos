const BOT_UA_PATTERN = /bot|crawler|spider|scraper|headless|phantom|selenium|puppeteer|playwright|lighthouse|monitor|uptime|pingdom|curl|wget|python-requests|go-http-client|java\/|facebookexternalhit|twitterbot|linkedinbot|slackbot|whatsapp|telegrambot|discordbot|preview|fetch|http-client|scanner|archiver/i;

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) {
    return true;
  }

  return BOT_UA_PATTERN.test(userAgent);
}
