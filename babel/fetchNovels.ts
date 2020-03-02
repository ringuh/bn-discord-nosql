import config from "../funcs/config"
import { db, Novel, Puppet } from "../models"
import { Browser, Page } from "puppeteer"
import { PageApiDTO } from "../models/dto/pageApi.dto"
import { Collections } from "../models/enum/collections"
import { InitialPage } from "./babelSteps"
import { CodeList } from "../models/enum/codeList"
import { ReturnObject } from "../models/interface/returnObject.type"
import { waitFor } from "../funcs/waitFor"
const { red, magenta, yellow, green } = require('chalk').bold

interface jsonDTO {
    code: number,
    data: PageApiDTO[]
}

export async function fetchNovels(browser: Browser, chapterLimit: number): Promise<ReturnObject> {

    const page = await InitialPage(browser, null)
    if (!page) {
        const msg = red("Loading cookie failed")
        console.log(msg)
        return { code: CodeList.babel_cookie_missing, message: msg }
    }

    let pageNr: number = 0
    let attemptNr: number = 0;
    let json: jsonDTO = { code: 0, data: [null] };
    while (json.code === 0 && json.data.length && attemptNr < 5) {
        let fetch_url = config.api.novels.replace("<pageNr>", pageNr.toString()).replace("<pageSize>", "20");
        if (chapterLimit) fetch_url = `${fetch_url}&enSerial=ongoing`;
        console.log(green("page", pageNr))
        try {
            await page.goto(fetch_url);
            await page.screenshot({ path: 'screenshot.png' });
            json = await page.evaluate(() => {
                return JSON.parse(document.querySelector("body").innerText);
            });

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






