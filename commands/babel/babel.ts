import { Message } from "discord.js";
import { usageMessage } from "../../funcs/commandTools";
import { findNovel } from "../../funcs/findNovel";
import { NovelArgs } from "../../models/novel.model";
import config from "../../funcs/config";
import { RichEmbed } from "discord.js";

export default {
    name: ['babel', 'b'],
    description: 'Print novel info',
    args: "<novel>",
    async execute(message: Message, args: string[], params: string[]) {
        if (args.length < 1) return usageMessage(message, this)
        const novel: NovelArgs = await findNovel(message, args);
        if (!novel) return false

        let authLine = [
            novel.name.abbr,
            novel.status?.isPay ? 'premium' : null,
            novel.status?.isRemoved ? 'removed' : null,
            novel.translation?.hiatus ? 'hiatus' : null,
            novel.translation?.ignore ? 'ignored' : null,
            novel.translation?.completed ? 'completed' : null
        ].filter(l => l).join(" | ")

        const emb = new RichEmbed()
            .setColor('#0099ff')
            .setTitle(novel.name.en)
            .setAuthor(authLine, null, null)
            .setURL(config.api.novel.replace("/api/", "/").replace("<book>", novel.name.canonical))
            //.attachFile(coverAttachment)
            //.setThumbnail(coverName)
            .setDescription(novel.synopsis ? novel.synopsis.substr(0, 1000) : 'description missing')
            //.setFooter(novel.genre, coverName)
            .setTimestamp()
            .addField("bookId", novel.babelId, true)
            .addField("Rating", Math.round(novel.ratingNum * 100) / 100, true)
            .addBlankField(true)
            .addField("Chapters", novel.releasedChapterCount, true)
            //.addField("Epub", novel.epubs, true)
            .addBlankField(true)
        if (novel.name.raw) emb.addField("Name", novel.name.raw, true)
        /* if (novel.author || novel.)
            emb.addField("Author",
                [novel.authorEn, novel.author].filter(a => a && a.length).join(" | "), true) */
        emb.addBlankField()
        if (novel.status.isRemoved)
            emb.addField("Library script command", `!script ${novel.name.canonical}`)

        if (novel.source)
            emb.addBlankField().addField("Source", novel.source)

        await message.channel.send(emb).then((msg: Message) => msg.bin(message));
    }
};