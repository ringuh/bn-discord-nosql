import { connect, launch, Browser } from 'puppeteer';
import { db, Puppet, FieldValue } from '../models';
import config from '../funcs/config';
import { Collections } from '../models/enum/collections';
const { red, green, yellow } = require('chalk').bold;
let browser: Browser = null;

export async function launchBrowser(allow?: boolean): Promise<Browser> {
    if (browser?.isConnected()) return browser;

    const headless = `chrome_${config.identifier}`;
    const setting = await db.collection(Collections.puppet).doc(headless)
    const chromeEndpoint = await setting.get()
    if (chromeEndpoint.exists) {
        browser = await connect({
            browserWSEndpoint: chromeEndpoint.get("value")
        }).then(success => {
            console.log(green("Puppeteer opened on existing Chrome"));
            return success;
        }).catch(err => {
            console.log(red(`Opening old browser failed: ${err.message}`))
            return null
        })
        if (browser) return browser;
    }

    if (!allow) throw {
        code: 99, message: "Not allowed to open new browser"
    }
    browser = await launch({
        args: ['--mute-audio', '--disable-setuid-sandbox']
    }).finally(() => console.log(yellow("Started a new browser")))

    await setting.set({
        value: browser.wsEndpoint()
    })

    return browser
}