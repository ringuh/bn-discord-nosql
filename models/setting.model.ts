import { AbstractModel } from "./abstract.model";

enum SETTING_TYPES {
    channel = 'discord_channel',
    user = 'discord_user',
    guild = 'discord_guild',
    role = 'discord_role'
}


export class Setting extends AbstractModel {
    private COLLECTION: Collections = Collections.settings;
    discordServer: string;
    key: string;
    value: string | number | boolean;
    type?: SETTING_TYPES

    constructor() {
        super();
    }

    static get(id: string) {

    }
}