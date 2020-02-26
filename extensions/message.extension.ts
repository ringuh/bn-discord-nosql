import { Message } from "discord.js";
import config from '../funcs/config';

declare module 'discord.js' {
    interface Message {
        expire(prevMsg?: Message, keep?: boolean, expire?: number): void
    }

    interface Array<Message> {
        expire(prevMsg?: Message, keep?: boolean, expire?: number): void
    }

}

Message.prototype.expire = async function (prevMsg?: Message, keep?: boolean, expire: number = config.numerics.epub_lifespan_seconds) {
    if (prevMsg) {
        prevMsg.channel.stopTyping(true)
        if (!keep) await prevMsg.delete(expire).catch(err => null)
    }
    if (!keep) await this.delete(expire).catch(err => null)
};

