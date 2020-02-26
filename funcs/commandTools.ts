import config from './config';
import { Message } from 'discord.js';
const { bypass_list, numerics } = config;


export function isAdmin(message: Message, reply = true) {
    if (!message.member.hasPermission("ADMINISTRATOR") &&
        !bypass_list.includes(message.member.id)) {
        if (reply)
            message.channel.send(
                `Admin access required`, { code: true }
            )//.then(msg => msg.Expire(message))
        return false
    }
    return true
};

export function isBypass(message) {
    return bypass_list.includes(message.member.id)
}

export function usageMessage(message, command) {
    message.channel.send(
        `Usage: ${config.prefix}${command.name[0]} ${command.args ? command.args : ''}`,
        { code: true }
    ).then(msg => msg.Expire(message))
};

export function botPermission(message, permissions, reply = true) {
    if (!permissions) return true
    if (typeof (permissions) === "string")
        permissions = [permissions]

    const botPermissionsFor = message.channel.permissionsFor(message.guild.me)
    if (botPermissionsFor.has('ADMINISTRATOR')) return true

    const response = !permissions.some(permission => {
        if (!botPermissionsFor.has(permission)) {
            if (reply)
                message.channel.send(
                    `Bot is missing permission ${permission}`, { code: true }
                ).then(msg => msg.Expire(message))
            return true
        }
    })

    return response
}
