import { AbstractModel } from "./abstract.model";
import { PageApiDTO } from "./dto/pageApi.dto";
import { getEnabledCategories } from "trace_events";
import { Collections } from "./enum/collections";
import { DocumentSnapshot, QueryDocumentSnapshot, WriteResult } from "@google-cloud/firestore";
import { db } from ".";
const { green, red, yellow, magenta } = require("chalk").bold;

interface NovelName {
    en: string,
    raw: string,
    canonical: string,
    historyCanonical: string,
    abbr: string,
    aliases: string[]
}
interface NovelTranslations {
    hiatus: boolean,
    completed: boolean,
    ignore: boolean
}

interface NovelStatus {
    isRemoved: boolean,
    isPay: boolean,
    limitedFree: Date,
    limitedDiscount: Date
}

interface NovelTimestamp {
    createdAt: Date,
    updatedAt: Date,
    checkedAt: Date,
    successAt: Date
}

interface AuthorName {
    name: string,
    enName: string,
}

class NovelArgs {
    babelId: string;
    name?: NovelName;
    cover?: string;
    author?: AuthorName;
    releasedChapterCount?: number;
    tag?: Array<string>;
    genre?: string[];
    source?: string;
    synopsis?: string;
    status?: NovelStatus;
    translation?: NovelTranslations;
    timestamp?: NovelTimestamp;
    originalData?: any;
}


class NovelDocument extends NovelArgs {
    babelId: string;

    constructor(kwargs: FirebaseFirestore.DocumentData) {
        super();
        return Object.assign(this, kwargs)
    }


    toJson(): NovelDocument {
        return { ...this }
    }
}

export class Novel extends AbstractModel {
    data: NovelDocument;

    constructor(babelId: string) {
        super(Collections.novels, babelId);
    }

    async updateFromPageApi(json: PageApiDTO) {
        const snapshot = await this.document.get()
        const novel: NovelDocument = snapshot.data() || new NovelDocument({ babelId: snapshot.id })

        const changes: NovelArgs = {
            ...novel,
            name: {
                ...novel.name,
                en: json.name,
                raw: json.cnName,
                canonical: json.canonicalName,
                historyCanonical: json.historyCanonicalName,
                aliases: json.alias?.split("|").filter(t => t && t.trim().length) || []
            },
            timestamp: {
                ...novel.timestamp,
                createdAt: json.createTime,
                updatedAt: json.updateTime
            },
            status: {
                ...novel.status,
                isRemoved: false
            },
            cover: !novel.cover ? json.cover : novel.cover,
            synopsis: (!novel.synopsis || novel.synopsis !== json.synopsis) ? json.synopsis : novel.synopsis,
            genre: json.genres?.map(genre => genre.name) || [],
            tag: json.tag?.split("|").filter(t => t && t.trim().length) || [],
            releasedChapterCount: json.releasedChapterCount
        }
        
        if (!snapshot.exists) {
            await this.document.set(changes).then((res: QueryDocumentSnapshot) =>
                console.log(green(`Added novel ${changes.name.canonical}`))
            ).catch(e => {
                console.log(red(`Failed to add novel ${changes.name.canonical}\n${e.message}`))
            })
        }

        else {
            let differences = {}
            Object.keys(changes).forEach(key => {
                if (JSON.stringify(changes[key]) !== JSON.stringify(novel[key])) {
                    differences[key] = changes[key]
                }
            })
            if (Object.keys(differences).length > 0) {
                await this.document.update(differences)
                    .then((res: WriteResult) => console.log(yellow(`Updated Novel ${novel.name.canonical}`)))
                    .catch(e => console.log(magenta(`Failed to update novel ${novel.name.canonical}\n${e.message}`)))
            }
        }
    }

    protected converter = {
        toFirestore(post: NovelDocument): FirebaseFirestore.DocumentData {
            return { ...post }
        },
        fromFirestore(
            data: FirebaseFirestore.DocumentData
        ): NovelDocument {
            return new NovelDocument(data);
        }
    }
}

