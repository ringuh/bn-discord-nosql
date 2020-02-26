import config from "../funcs/config"
import { db, Novel, Puppet } from "../models"
import { Browser, Page } from "puppeteer"
import { PageApiDTO } from "../models/dto/pageApi.dto"
import { Collections } from "../models/enum/collections"
const { red, magenta, yellow, green } = require('chalk').bold

interface jsonDTO {
    code: number,
    data: PageApiDTO
}

export async function fetchNovels(browser: Browser, chapterLimit: number): Promise<void> {

    const page = await browser.newPage();
    await setInterception(page);

    // fetch cookie
    await page.goto("https://babelnovel.com/search");

    let pageNr: number = 0
    let attemptNr: number = 0;
    let json = { code: 0, data: [null] };
    while (json.code === 0 && json.data.length && attemptNr < 5) {
        let fetch_url = config.api.novels.replace("<pageNr>", pageNr).replace("<pageSize>", 20);
        if (chapterLimit) fetch_url = `${fetch_url}&enSerial=ongoing`;
        console.log(green("page", pageNr))
        try {
            await page.goto(fetch_url);
            json = await page.evaluate(() => {
                return JSON.parse(document.querySelector("body").innerText);
            });
        }
        catch (e) {
            console.log(red(`JSON parse error: ${e.message}`))
            attemptNr++;
            continue;
        }
        for (var i in json.data) {
            const novelData: PageApiDTO = json.data[i];
            if (novelData.releasedChapterCount < chapterLimit){
                json.code = -1
                break;
            }
            console.log(novelData.canonicalName, novelData.releasedChapterCount)
            const novel = new Novel(novelData.id);
            await novel.getDoc()
            await novel.updateFromPageApi(novelData);
            
        }
        pageNr++;
    }
    return null
}



async function setInterception(page: Page): Promise<void> {
    const puppetID = `puppeteer_${config.identifier}`
    await page.setRequestInterception(true);
    page.on('request', async request => {
        if (!request.isNavigationRequest()) {
            if (config.bad_requests &&
                config.bad_requests.some((str: string) => request.url().includes(str)))
                return request.abort()
            return request.continue();
        }

        // this novel surpasses all other processes
        const timestamp = Date.now()
        const setting = await db.collection(Collections.puppet).doc(puppetID)
        const doc = await setting.get();

        if (doc.exists) await setting.set({ value: Date.now() })

        let delay = config.numerics.puppeteer_delay
        const url = request.url()
        if (!url.includes("/api/")) delay = 500
        console.log(url, magenta(delay))
        await page.waitFor(delay)

        request.continue();
    });
}

