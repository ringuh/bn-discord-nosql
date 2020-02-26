import { AbstractModel } from "./abstract.model";
import { Collections } from './enum/collections'

enum PuppeteerTypes {
    busy = 'busy'
}


export class Puppet extends AbstractModel {
    babelId?: string;
    server_id?: string;
    type?: PuppeteerTypes
    key?: string;
    value?: string | number | boolean | Date;
    updatedAt?: Date;
    createdAt?: Date;

    constructor(babel_id: string) {
        super(Collections.puppet, babel_id);
    }
}