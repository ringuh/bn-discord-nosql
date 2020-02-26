import config from './funcs/config';
import { Client, Collection, Message } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { db } from './models'
import { botPermission } from './funcs/commandTools';
import './extensions/message.extension'
import { launchBrowser } from './babel/headlessChrome';
const client = new Client();
const commands = new Collection();




const loadCommands = (fPath: string) => {
    const folders = fs.readdirSync(fPath, { withFileTypes: true }).filter(file => file.isDirectory());
    const commandFiles = fs.readdirSync(fPath, { withFileTypes: true }).filter(file => file.name.endsWith('.ts'));
    console.log(commandFiles.length)
    for (const file of commandFiles) {
        const command = require(path.join(fPath, file.name));
        command.name.forEach((al: string) => commands.set(al, command))
    }

    folders.forEach(folder => {
        loadCommands(require('path').join(fPath, folder.name))
    })


};
loadCommands(path.join(__dirname, "commands"))




client.on('message', message => {
    // ignore non-prefix and other bots excluding REPEAT BOT 621467973122654238
    if (!message.content.startsWith(config.prefix) ||
        (message.author.bot &&
            (!config.bypass_bots.includes(message.author.id)
                || message.author.id === client.user.id
            )
        )
    )
        return;
    // mobile discord wants to offer ! command instead of !command
    if (message.content.startsWith(`${config.prefix} `))
        message.content = message.content.replace(`${config.prefix} `, config.prefix)

    let args = message.content.slice(config.prefix.length).split(/ +/);
    let parameters = []
    if (args.includes("|"))
        parameters = args.splice(args.indexOf("|"), args.length).slice(1)

    const command = args.shift().toLowerCase();

    if (!commands.has(command)) return;

    try {
        let cmd: any = commands.get(command)
        if (botPermission(message, cmd.permissions))
            cmd.execute(message, args, parameters);
    } catch (error) {
        console.error(error.message);
        message.reply('there was an error trying to execute that command!');
    }
});


client.once('ready', async () => {
    console.log('Discord bot running!');
    await launchBrowser(true);
    
});

client.login(config.discord_token).catch(err => console.log(err.message))
setInterval(async () => await launchBrowser(true), 60000);
