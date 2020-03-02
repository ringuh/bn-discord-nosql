import { Browser, Page } from "puppeteer";
import config from "../funcs/config";
import { Collections } from "../models/enum/collections";
import { db } from "../models";
import { Interceptions } from "../models/enum/interceptions";
const { magenta, cyan } = require('chalk').bold

export const InitialPage = async (browser: Browser, interception: Interceptions) => {
    let [i, limit] = [0, 3];
    let page: Page;
    while (i < limit && !page) {
        i++;
        try {
            console.log(cyan(`Fetching cookie attempt ${i}`))
            page = await browser.newPage();
            await page.goto("https://babelnovel.com/search");
            //await page.screenshot({path: 'screenshot.png'});
            // lets find that history-text
            const h2s = await page.evaluate(() =>
                Array.from(
                    document.querySelectorAll('h2'),
                    element => element.textContent.trim().toLowerCase())
            );

            if (!h2s.includes("history")) throw {}
            await setInterception(page, interception)
            return page
        } catch (e) {
            await page.waitFor(config.numerics.retry_seconds)
            await page.close()
            page = null
            continue
        }
    }
}


async function setInterception(page: Page, interception: Interceptions): Promise<void> {
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