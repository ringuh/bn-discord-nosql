import config from "../funcs/config"
import { db, Novel, Puppet } from "../models"
import { Browser, Page } from "puppeteer"
import { PageApiDTO } from "../models/dto/pageApi.dto"
import { InitialPage } from "./babelSteps"
import { CodeList } from "../models/enum/codeList"
import { ReturnObject } from "../models/interface/returnObject.type"
import { waitFor } from "../funcs/waitFor"
import { chapterGroupDTO } from "../models/dto/chapterGroup.dto"
import { NovelArgs } from "../models/novel.model"
import { Message } from "discord.js"
import { launchBrowser } from "./headlessChrome"
import { GroupChapterDTO, ChapterDTO } from "../models/dto/chapter.dto"
import { Chapter, ChapterArgs } from "../models/chapter.model"
import { scrapeParameters } from "../models/interface/parameters"
import { Collections } from "../models/enum/collections"
import { DocumentSnapshot, QueryDocumentSnapshot, QuerySnapshot } from "@google-cloud/firestore"
import { LiveMessage } from "./liveMessage"
const { red, gray, magenta, yellow, green } = require('chalk').bold

interface jsonDTO {
    code: number,
    data: chapterGroupDTO[]
}

export async function initScrape(novels: NovelArgs[], parameters: scrapeParameters, message?: Message) {
    let liveMessage = new LiveMessage(message);
    const browser: Browser = await launchBrowser()
    let page: Page = await InitialPage(browser, null, liveMessage)
    if (!page) return await liveMessage.fetchingCookieFailed()

    for (var i in novels)
        await scrapeChapters(page, novels[i], parameters, liveMessage)
    await liveMessage.scrapeCompleted()
}

async function scrapeChapters(page: Page, novel: NovelArgs, parameters: scrapeParameters, liveMessage?: LiveMessage): Promise<ReturnObject> {
    let chapters: GroupChapterDTO[] = [];
    for (let attemptNr = 0, limitNr = 5; attemptNr < limitNr; ++attemptNr) {
        let json: jsonDTO;
        let fetch_url = config.api.chapter_groups.replace("<book>", novel.babelId);

        await liveMessage.fetchChapterGroups(novel, attemptNr, limitNr)

        try {
            await page.goto(fetch_url);
            await page.screenshot({ path: "fetch_group.png" })
            json = await page.evaluate(() => {
                return JSON.parse(document.querySelector("body").innerText);
            });
            if (json.code !== 0) throw { message: `Chapter group code is wrong ${json.code}` }

            chapters = json.data.map(chapterGroup => {
                return chapterGroup.firstChapter.id !== chapterGroup.lastChapter.id ?
                    [chapterGroup.firstChapter, chapterGroup.lastChapter] : chapterGroup.firstChapter
            }).flat()

            await liveMessage.foundNrChapters(chapters.length)
            break
        }
        catch (e) {
            console.log(red(`JSON parse error: ${e.message}`))
            attemptNr++;
            await waitFor();
            continue;
        }
    }
    console.log(green(novel.name.canonical))
    if (parameters?.reverse) chapters = chapters.reverse()

    let existingChapters = await getExistingChapters(novel.babelId);
    let scrapeOrder = parameters?.hop ? getHopChapters(chapters, existingChapters) : [...chapters]

    let weight = 0

    for (let attemptNr = 0; attemptNr < 5; ++attemptNr) {
        try {
            for (var i in scrapeOrder) {
                let json: {
                    code: number,
                    data: ChapterDTO
                };
                const chapterDTO: GroupChapterDTO = scrapeOrder[i];
                const exChapter = existingChapters.find(ex => chapterDTO.id === ex.babelId)
                if (exChapter?.content?.babel && !parameters?.recheck) continue
                if (exChapter?.status?.ignore) continue
                if (exChapter?.status?.skip && ((Math.ceil(Math.random() * 100) + weight < 90))) continue

                console.log(chapterDTO)
                try {
                    console.log(novel.babelId)
                    const fetch_url = config.api.chapter.replace("<book>", novel.babelId).replace("<chapterName>", chapterDTO.id);
                    await page.goto(fetch_url)
                    await page.screenshot({ path: "fetch_chapter.png" })
                    json = await page.evaluate(() => {
                        return JSON.parse(document.querySelector("body").innerText);
                    });
                    
                    if (json.code !== 0) {
                        console.log(magenta(`Chapter code wrong for ${chapterDTO.name} ${chapterDTO.num}`))
                        continue
                    }
                    console.log(novel.babelId)
                    const chapterData: ChapterDTO = json.data;
                    const chapter = new Chapter(chapterData.id, novel.babelId)
                    await chapter.getDoc()

                    const retObj: ReturnObject = await chapter.updateFromChapterContent(chapterData, parameters)
                    if (retObj.code === CodeList.chapter_premium && !parameters.ignoreAll) {
                        console.log(magenta(retObj.message))
                        return retObj
                    }
                    else if (retObj.code == CodeList.chapter_already_parsed) {
                        existingChapters = await getExistingChapters(novel.babelId)
                        if (parameters.hop) throw { code: CodeList.hop_again }
                    }
                } catch (err) {
                    if (err?.code === CodeList.hop_again) {
                        throw err
                    }
                    console.log(red(`Error fetching chapter ${chapters[i].num}: ${err.message}`))
                    await waitFor();
                    continue
                }
            }
            return { code: CodeList.success, message: "Chapters scraped" }
        } catch (err) {
            if (err?.code === CodeList.hop_again) {
                scrapeOrder = getHopChapters(chapters, existingChapters)
                --attemptNr;
                continue;
            }
            console.log(red(err.message))
        }
    }
    return { code: CodeList.success, message: "Fetched novels" }
}


export async function getExistingChapters(novelId: string): Promise<ChapterArgs[]> {
    let chapters = []
    let lastVisible = null
    for (let page = 1; page < 20; ++page) {
        let query = await db.collection(Collections.chapters)
            .where("novelId", "==", novelId)
            .orderBy("num").limit(500)
        if (lastVisible) query = query.startAfter(lastVisible)
        const results: QuerySnapshot = await query.get()
        if (results.empty) break
        lastVisible = results.docs[results.docs.length - 1]
        results.forEach((r: DocumentSnapshot) => chapters.push(r.data()))
    }
    console.log(chapters.length)
    return chapters
}

async function getHopChapters(chapters: GroupChapterDTO[], existingChapters: ChapterArgs[]): Promise<ChapterArgs[]> {
    let emptySlots: number[] = chapters.map(c => {
        const ex = existingChapters.find(ex => c.id === ex.babelId)
        return ex?.content?.babel ? 1 : 0
    })

    let [topValue, topIndex] = [0, 0]

    emptySlots.reduce((previousValue, currentValue, index, array) => {
        if (!currentValue) return 0
        let cv = currentValue + previousValue;
        if (currentValue) emptySlots[index] = cv;
        if (cv > topValue) {
            topValue = cv;
            topIndex = index;
        }
        return cv
    })

    const coinFlip = (Math.floor(Math.random() * 2) == 0);
    let slicedChapters = []
    if (coinFlip) slicedChapters = chapters.slice(topIndex - Math.floor(topValue / 2), topIndex + 1)
    else slicedChapters = chapters.slice(topIndex - (topValue - 1), topIndex + 1 - Math.floor(topValue / 2)).reverse()

    return slicedChapters
}


