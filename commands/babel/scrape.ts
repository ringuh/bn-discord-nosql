import { Message } from "discord.js";
import { usageMessage, isBypass } from "../../funcs/commandTools";
import { findNovel } from "../../funcs/findNovel";
import { NovelArgs } from "../../models/novel.model";
import { initScrape } from "../../babel/fetchChapters";
import { scrapeParameters } from "../../models/interface/parameters";

export default {
    name: ['scrape'],
    description: 'Prints the script to add the novel to babel library',
    args: "<novel>",
    hidden: true,
    async execute(message: Message, args: string[], params: string[]) {
        if (!isBypass(message)) return false
        if (args.length < 1) return usageMessage(message, this)
        const novel: NovelArgs = await findNovel(message, args);
        if (!novel) return false

        await initScrape([novel], handleParams(params), message)
    }
};


function handleParams(params: string[]): scrapeParameters {
    let returnParameters: scrapeParameters = {
        hop: params.includes("hop"),
        reverse: params.includes("reverse") || params.includes("rev"),
        ignoreAll: params.includes("ignore"),
        recheck: params.includes("recheck"),
        token: params.find(p => p.startsWith("token="))?.substr(6)
    }

    return returnParameters
}