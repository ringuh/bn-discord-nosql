import config from '../funcs/config';
const { botPermission } = require('../funcs/commandTools')
import path from 'path';
import { Message } from 'discord.js';
import '../extensions/message.extension';
module.exports = {
    name: ['cmds'],
    description: 'Lists available commands',
    args: false,
    execute(message: Message, args: Array<string>) {
        console.log("this far")
        var reply = [`Available ${config.prefix}${this.name[0]}:`]
        const dirs = (filePath) => {
            var replies = []
            const folders = require('fs').readdirSync(filePath, { withFileTypes: true }).filter(file => file.isDirectory() && file.name !== 'hidden');
            const commandFiles = require('fs').readdirSync(filePath, { withFileTypes: true }).filter(file => file.name.endsWith('.ts'));
            console.log(commandFiles)
            for (const file of commandFiles) {
                const cmd = require(path.join(filePath, file.name));
                if (!cmd.hidden && botPermission(message, cmd.permissions, false))
                    replies.push(`${cmd.name.join(" / ")} ${cmd.args ? cmd.args + " --" : '--'} ${cmd.description}`)
            }

            folders.forEach(folder => {

                let r = dirs(require('path').join(filePath, folder.name))
                if (r.length)
                    replies = [...replies, "", folder.name, "-------", ...r]
            })
            return replies
        };

        reply = [...reply, ...dirs(__dirname)]
        
        message.channel.send(reply.join("\n"), { code: true }).then()

    },
};