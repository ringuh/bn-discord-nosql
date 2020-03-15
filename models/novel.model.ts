import { AbstractModel } from "./abstract.model";
import { PageApiDTO } from "./dto/pageApi.dto";
import { Collections } from "./enum/collections";
import { CodeList } from "./enum/codeList"
import { QueryDocumentSnapshot, WriteResult, Timestamp } from "@google-cloud/firestore";
import { Page } from "puppeteer";
import { ReturnObject } from "./interface/returnObject.type";
import config from "../funcs/config";
import { waitFor } from "../funcs/waitFor";
import { NovelDTO } from "./dto/novel.dto";
import { promotionType } from "./dto/promotion.dto";
const { green, red, yellow, magenta } = require("chalk").bold;

interface NovelName {
    en: string,
    raw: string,
    canonical: string,
    historyCanonical: string,
    search: string,
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
    createdAt: string,
    updatedAt: string,
    checkedAt: string,
    successAt: string
}

interface AuthorName {
    name: string,
    enName: string,
}

export class NovelArgs {
    babelId: string;
    name?: NovelName;
    cover?: string;
    author?: AuthorName;
    releasedChapterCount?: number;
    epubCount?: number;
    ratingNum?: number;
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

    async updateFromPageApi(json: PageApiDTO): Promise<ReturnObject> {
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
                search: json.name.toLowerCase(),
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
            return await this.document.set(changes).then((res: QueryDocumentSnapshot) => {
                const msg = `Added novel ${changes.name.canonical}`;
                console.log(green(msg));
                return { code: CodeList.novel_created, message: msg }
            }

            ).catch(e => {
                const msg = `Failed to add novel ${changes.name.canonical}\n${e.message}`
                console.log(red(msg));
                return { code: CodeList.novel_creation_failed, message: msg }
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
                differences["timestamp"] = { ...changes.timestamp, checkedAt: new Date().toISOString() }
                return await this.document.update(differences)
                    .then((res: WriteResult) => {
                        const msg = `Updated Novel ${novel.name.canonical}`
                        console.log(yellow(msg))
                        return { code: CodeList.novel_updated, message: msg }
                    }).catch(e => {
                        const msg = `Failed to update novel ${novel.name.canonical}\n${e.message}`;
                        console.log(magenta(msg))
                        return { code: CodeList.novel_update_failed, message: msg }
                    })
            }

            return { code: CodeList.novel_checked, message: "Novel checked, nothing to update" }
        }
    }

    async updateFromNovelApi(json: NovelDTO): Promise<ReturnObject> {
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
                search: json.name.toLowerCase(),
                aliases: json.alias?.split("|").filter(t => t && t.trim().length) || []
            },
            author: {
                ...novel.author,
                name: json.author?.name || novel.author?.name || null,
                enName: json.author?.enName || novel.author?.name || null
            },
            timestamp: {
                ...novel.timestamp,
                createdAt: json.createTime,
                updatedAt: json.updateTime,
                checkedAt: new Date().toISOString(),
            },
            status: {
                ...novel.status,
                isRemoved: json.isShowStrategy,
                isPay: json.isPay,
                limitedFree: null,
                limitedDiscount: null
            },
            cover: !novel.cover ? json.cover : novel.cover,
            synopsis: (!novel.synopsis || novel.synopsis !== json.synopsis) ? json.synopsis : novel.synopsis,
            genre: json.genres?.map(genre => genre.name) || [],
            tag: json.tag?.split("|").filter(t => t && t.trim().length) || [],
            releasedChapterCount: json.releasedChapterCount
        }

        if (json.promotion?.endTime) {
            const now = new Date();
            const endTime = new Date(json.promotion.endTime);
            if (endTime > now) {
                if (json.promotion.promotionType === promotionType.limited_free)
                    changes.status.limitedFree = endTime;
                else if (json.promotion.promotionType === promotionType.discount)
                    changes.status.limitedDiscount = endTime
            }
        }

        let differences = {}
        Object.keys(changes).forEach(key => {
            if (JSON.stringify(changes[key]) !== JSON.stringify(novel[key]))
                differences[key] = changes[key]
        })
        if (Object.keys(differences).length > 0) {
            return await this.document.update(differences)
                .then((res: WriteResult) => {
                    const msg = `Fetch updated Novel ${novel.name.canonical}`
                    console.log(yellow(msg))
                    return { code: CodeList.novel_fetch_updated, message: msg }
                }).catch(e => {
                    const msg = `Failed to fetch update novel ${novel.name.canonical}\n${e.message}`;
                    console.log(magenta(msg))
                    return { code: CodeList.novel_fetch_update_failed, message: msg }
                })
        }

        return { code: CodeList.novel_fetch_checked, message: "Novel fetch checked, nothing to update" }
    }

    async fetchNovel(page: Page): Promise<ReturnObject> {

        let json: {
            code: number,
            data: NovelDTO
        };

        for (let attemptNr = 0; attemptNr < 5; ++attemptNr) {
            let fetch_url = config.api.novel.replace('<book>', this.document_id)
            try {
                await page.goto(fetch_url);
                json = await page.evaluate(() => {
                    return JSON.parse(document.querySelector("body").innerText);
                });
                if (json.code !== 0) {
                    console.log(json)
                    const msg = `Novel fetch code ${json.code} is wrong`;
                    console.log(red(msg))
                    await page.screenshot({ path: `./static/screenshot/novel_code_${this.document_id}.png` });
                    return { code: CodeList.novel_fetch_code_wrong, message: msg }
                }
                return await this.updateFromNovelApi(json.data)
            }
            catch (e) {
                console.log(json)
                console.log(red(`JSON parse error: ${e.message}`))
                if (page) await page.screenshot({ path: `./static/screenshot/err_novel_${this.document_id}.png` });
                await waitFor();
                continue;
            }
        }
        const msg = `Fetching novel failed after ${5} attempts`
        console.log(magenta(msg))
        return { code: CodeList.novel_fetch_error, message: msg }
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

