import { Collections } from './enum/collections'
import { db } from '.';

export abstract class AbstractModel {
    protected converter: object;
    readonly collection: Collections;
    document_id: string;
    document: any;

    constructor(collection: Collections, document_id: string) {
        this.collection = collection;
        this.document_id = document_id
    }

    async getDoc() {
        this.document = await db.collection(this.collection)
            .withConverter(this.converter)
            .doc(this.document_id)
    }
}