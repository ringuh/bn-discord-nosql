import { Message } from "discord.js";
import { usageMessage, isBypass } from "../../funcs/commandTools";
import { findNovel } from "../../funcs/findNovel";
import { NovelArgs } from "../../models/novel.model";

export default {
    name: ['updateall', 'ua'],
    description: 'Updates all excisting epubs',
    args: "<novel> [min] [max]",
    hidden: true,
    async execute(message: Message, args: string[], params: string[]) {
        if (!isBypass(message)) return false
        if (args.length < 1) return usageMessage(message, this)
        const novel: NovelArgs = await findNovel(message, args);
        if (!novel) return false

    }
};