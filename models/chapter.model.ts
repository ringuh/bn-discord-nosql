import { AbstractModel } from "./abstract.model";
import { Collections } from "./enum/collections";
import { ChapterDTO, GroupChapterDTO } from "./dto/chapter.dto";
import { ReturnObject } from "./interface/returnObject.type";
import { CodeList } from "./enum/codeList";
import { WriteResult, QueryDocumentSnapshot } from "@google-cloud/firestore";
import { chapterGroupDTO } from "./dto/chapterGroup.dto";
import { scrapeParameters } from "./interface/parameters";
const { gray, green, red, yellow, magenta } = require("chalk").bold;

interface ChapterContent {
    raw?: string,
    babel?: string,
    initial?: string,
    proofread?: string,
}

interface ChapterTimestamp {
    createdAt: string,
    updatedAt: string,
    checkedAt: string,
    successAt: string,
    attemptedAt: string,
}

interface ChapterStatus {
    skip?: boolean,
    ignore?: boolean,
    attempts?: number,
}

export class ChapterArgs {
    babelId: string;
    novelId: string;
    prevId?: string;
    nextId?: string;
    num?: number;
    index?: number;
    name?: string;
    canonicalName?: string;
    content?: ChapterContent;
    status?: ChapterStatus;
    zhSourceURL?: string;
    zhTitle?: string;
    timestamp?: ChapterTimestamp;
    originalData?: any;
}

class ChapterDocument extends ChapterArgs {
    babelId: string;

    constructor(kwargs: FirebaseFirestore.DocumentData) {
        super();
        return Object.assign(this, kwargs)
    }

    toJson(): ChapterDocument {
        return { ...this }
    }
}

export class Chapter extends AbstractModel {
    data: ChapterDocument;
    novelId: string;
    constructor(babelId: string, novelId: string) {
        super(Collections.chapters, babelId);
        this.novelId = novelId

    }

    async updateFromGroup(json: GroupChapterDTO): Promise<ReturnObject> {
        console.log("update", this.document)
        const snapshot = await this.document.get()
        if (snapshot.exists) return { code: CodeList.success, message: "Chapter exists" }
        const chapter: ChapterDocument = new ChapterDocument({ babelId: snapshot.id })
        const changes: ChapterArgs = {
            ...chapter,
            novelId: chapter.novelId || this.novelId,
            num: json.num,
            name: json.name,
            canonicalName: json.name
        }

        if (!snapshot.exists) {
            return await this.document.set(changes).then((res: QueryDocumentSnapshot) => {
                const msg = `Added chapter ${changes.num}`;
                console.log(green(msg));
                return { code: CodeList.novel_created, message: msg }
            }).catch(e => {
                const msg = `Failed to add chapter ${changes.num}\n${e.message}`
                console.log(red(msg));
                return { code: CodeList.novel_creation_failed, message: msg }
            })
        }
    }

    async updateFromChapterContent(json: ChapterDTO, params: scrapeParameters): Promise<ReturnObject> {
        const snapshot = await this.document.get()
        const chapter: ChapterDocument = snapshot.data() || new ChapterDocument({ babelId: snapshot.id })

        if (chapter.content?.babel && !params.recheck) {
            const msg = `Chapter ${chapter.canonicalName} has already been parsed`
            console.log(gray(msg))
            return { code: CodeList.chapter_already_parsed, message: msg }
        }
        console.log(this.novelId, chapter.novelId)
        const changes: ChapterArgs = {
            ...chapter,
            novelId: chapter.novelId || this.novelId,
            prevId: json.prevId,
            nextId: json.nextId,
            num: json.num,
            index: json.index,
            name: json.name,
            canonicalName: json.name,
            zhSourceURL: json.zhSourceURL,
            zhTitle: json.zhTitle,
            content: {
                ...chapter.content,
            },
            status: {
                ...chapter.status,
            },
            timestamp: {
                ...chapter.timestamp,
                createdAt: json.createTime,
                updatedAt: json.updateTime,
                checkedAt: new Date().toISOString()
            }
        }

        const isPay = !(json.isFree || json.isLimitFree || json.isBought || json.isBorrowed)

        if (!isPay && json.content && json.content.length > 200) {
            if(!params.recheck && changes.content.babel){
                return { code: CodeList.chapter_already_parsed, message: `Chapter ${json.canonicalName} was already parsed`}
            }

            if (!changes.content.initial)
                changes.content.initial = json.content
            changes.content.babel = json.content
            if (changes.content.initial !== changes.content.babel)
                console.log(magenta(`Chapter content is different than initial ${changes.content.initial.length} vs ${changes.content.babel.length}`))
            changes.timestamp.successAt = new Date().toISOString()
        }

        if (!snapshot.exists) {
            return await this.document.set(changes).then((res: QueryDocumentSnapshot) => {
                const msg = `Added chapter ${changes.canonicalName}`;
                console.log(green(msg));
                return { code: isPay ? CodeList.chapter_premium : CodeList.chapter_created, message: msg }
            }).catch(e => {
                const msg = `Failed to add chapter ${changes.canonicalName}\n${e.message}`
                console.log(red(msg));
                return { code: CodeList.chapter_creation_failed, message: msg }
            })
        }

        let differences = {}
        Object.keys(changes).forEach(key => {
            if (JSON.stringify(changes[key]) !== JSON.stringify(chapter[key]))
                differences[key] = changes[key]
        })
        if (Object.keys(differences).length > 0) {
            return await this.document.update(differences)
                .then((res: WriteResult) => {
                    const msg = `Updated chapter ${json.num}`
                    console.log(yellow(msg))
                    return { code: CodeList.novel_fetch_updated, message: msg }
                }).catch(e => {
                    const msg = `Failed to update chapter ${json.num}\n${e.message}`;
                    console.log(magenta(msg))
                    return { code: CodeList.novel_fetch_update_failed, message: msg }
                })
        }

        if (isPay) return { code: CodeList.chapter_premium, message: "Chapter was premium" }
        return { code: CodeList.chapter_checked, message: "Chapter checked, nothing to update" }
    }

    protected converter = {
        toFirestore(post: ChapterDocument): FirebaseFirestore.DocumentData {
            return { ...post }
        },
        fromFirestore(
            data: FirebaseFirestore.DocumentData
        ): ChapterDocument {
            return new ChapterDocument(data);
        }
    }
};


