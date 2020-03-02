export interface configModel {
    "identifier": string,
    "discord_token": string,
    "prefix": string,
    "bypass_list": string[],
    "bypass_bots": string[],
    "api": apiListModel,
    "numerics": numericsModel,
    "bad_requests": string[]
}

interface apiListModel {
    "latest_chapters": string,
    "novels": string,
    "novel": string,
    "novel_chapters": string,
    "chapter": string,
    "chapter_groups": string
}

interface numericsModel {
    "epub_lifespan_seconds": number,
    "latest_chapter_count": number,
    "latest_chapter_limit": number,
    "novel_chapters_count": number,
    "puppeteer_delay": number,
    "puppeteer_busy_seconds": number,
    "cron_chapters": number,
    "retry_seconds": number,
    "update_chapter_limit": number
}