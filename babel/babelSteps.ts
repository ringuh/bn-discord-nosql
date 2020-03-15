import { Browser, Page } from "puppeteer";
import config from "../funcs/config";
import { Collections } from "../models/enum/collections";
import { db } from "../models";
import { Interceptions } from "../models/enum/interceptions";
import { waitFor } from "../funcs/waitFor";
import { LiveMessage } from "./liveMessage";
const { magenta, cyan } = require('chalk').bold

export const InitialPage = async (browser: Browser, interception: Interceptions, liveMessage: LiveMessage) => {
    const limitNr = 3;
    for (let attemptNr = 0; attemptNr < limitNr; ++attemptNr) {
        let page: Page;
        try {
            liveMessage.fetchingCookie(attemptNr, limitNr)
            page = await browser.newPage();
            await page.goto("https://babelnovel.com/search");
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
            await waitFor()
            await page.close()
            page = null
            continue
        }
    }
    return null
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