import { Message } from "discord.js";
import { NovelArgs, Novel } from "../models/novel.model";
import { ReturnObject } from "../models/interface/returnObject.type";
import { CodeList } from "../models/enum/codeList";
const { white, gray, cyan, yellow, magenta, red, green, blue } = require('chalk').bold;

export class LiveMessage {
    private _sent: Message;

    constructor(private _message?: Message) {

    }

    async fetchingCookie(attemptNr: number, limitNr: number) {
        const text = `Fetching cookie attempt ${attemptNr + 1} / ${limitNr}`
        console.log(cyan(text))
        if (this._sent) this._sent.edit(text, { code: true });
        else if (this._message)
            this._message.channel.send(text, { code: true }).then((msg: Message) => this._sent = msg)

    }

    async fetchingCookieFailed(): Promise<ReturnObject> {
        const text = "Loading cookie failed";
        console.log(red(text))
        if (this._sent) this._sent.edit(text, { code: true }).then((msg: Message) => msg.bin(this._message, true))
        return { code: CodeList.babel_cookie_missing, message: text }
    }

    async fetchChapterGroups(novel: NovelArgs, attemptNr: number, limitNr: number) {
        console.log(green(`Fetching chapters for ${novel.name.canonical} ${attemptNr} / ${limitNr}`))
        
    }

    async fetchChapterGroupsWrongCode(novel: NovelArgs, code: number) {

    }

    async foundNrChapters(count: number){
        console.log(gray(`Found ${count} chapters`))
    }



    async scrapeCompleted(): Promise<ReturnObject> {
        const msg = `Scrape finished`;
        console.log(blue(msg))
        if (this._sent) this._sent.expire(this._message, null, 1)
        if (this._message) this._message.reply(msg, { code: true }).then((msg: Message) => msg.bin(this._message, true))
        return { code: CodeList.success, message: msg }
    }
}