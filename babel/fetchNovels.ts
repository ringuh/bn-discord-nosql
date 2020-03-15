import config from "../funcs/config"
import { db, Novel, Puppet } from "../models"
import { Browser, Page } from "puppeteer"
import { PageApiDTO } from "../models/dto/pageApi.dto"
import { InitialPage } from "./babelSteps"
import { CodeList } from "../models/enum/codeList"
import { ReturnObject } from "../models/interface/returnObject.type"
import { waitFor } from "../funcs/waitFor"
import { LiveMessage } from "./liveMessage"
const { red, magenta, yellow, green } = require('chalk').bold

interface jsonDTO {
    code: number,
    data: PageApiDTO[]
}

export async function fetchNovels(browser: Browser, chapterLimit: number): Promise<ReturnObject> {
    const liveMessage = new LiveMessage()
    const page = await InitialPage(browser, null, liveMessage)
    if (!page) return await liveMessage.fetchingCookieFailed()

    let pageNr: number = 0
    let attemptNr: number = 0;
    let json: jsonDTO = { code: 0, data: [null] };
    while (json.code === 0 && json.data.length && attemptNr < 5) {
        let fetch_url = config.api.novels.replace("<pageNr>", pageNr.toString()).replace("<pageSize>", "20");
        if (chapterLimit) fetch_url = `${fetch_url}&enSerial=ongoing`;
        console.log(green("page", pageNr))
        try {
            await page.goto(fetch_url);
            json = await page.evaluate(() => {
                return JSON.parse(document.querySelector("body").innerText);
            });
            if (json.code) continue
        }
        catch (e) {
            console.log(red(`JSON parse error: ${e.message}`))
            attemptNr++;
            await waitFor();
            continue;
        }

        for (var i in json.data) {
            const novelData: PageApiDTO = json.data[i];
            if (novelData.releasedChapterCount < chapterLimit) {
                console.log("below limit")
                json.code = -1
                break;
            }
            console.log(novelData.canonicalName, novelData.releasedChapterCount)
            const novel = new Novel(novelData.id);
            await novel.getDoc()
            const res = await novel.updateFromPageApi(novelData);
            if (res.code === CodeList.novel_created) await novel.fetchNovel(page)

        }

        pageNr++;
    }
    return { code: CodeList.success, message: "Fetched novels" }
}





