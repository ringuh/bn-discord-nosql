import { Message } from "discord.js";
import { usageMessage, isBypass } from "../../funcs/commandTools";
import { findNovel } from "../../funcs/findNovel";
import { NovelArgs } from "../../models/novel.model";
import { Collections } from "../../models/enum/collections";
import { db } from "../../models";
import { QuerySnapshot, DocumentSnapshot } from "@google-cloud/firestore";

export default {
    name: ['epub'],
    description: 'Generates epubs from scraped novels',
    args: "<novel>",
    async execute(message: Message, args: string[], params: string[]) {
        /* if (args.length < 1) return usageMessage(message, this)
  const novel: NovelArgs = await findNovel(message, args);
  if (!novel) return false
*/

        let chapters = []
        let lastVisible = null
        for (let page = 1; page < 20000; ++page) {
            let query = await db.collection(Collections.chapters)
                .where("releasedChapterCount", ">=", 0).limit(500)
            if (lastVisible) query = query.startAfter(lastVisible)
            const results: QuerySnapshot = await query.get()
            if (results.empty) break
            lastVisible = results.docs[results.docs.length - 1]
            results.forEach(async (r: DocumentSnapshot) => {
                const obj = { ...r.data().name, id: r.ref.id }
                chapters.push(obj)
                await db.collection(Collections.chapters).doc(r.ref.id).delete()
                .catch(err => console.log(err.message))
            })
            console.log(page)
        }

        let novels = {}
        for (let c in chapters) {
            const chapterName = chapters[c].canonical;
            if (!novels[chapterName]) novels[chapterName] = 0
            novels[chapterName]++;
           
            /* await db.collection(Collections.chapters).doc(chapters[c].id).delete()
            const r = await db.collection(Collections.chapters).doc(chapters[c].id).get()
            if(r.exists) console.log("delete failed") */
            //console.log(chapters[c].babelId, chapters[c].id, chapters[c].name.canonical)
        }

        Object.keys(novels).forEach(key => {
            console.log(key, novels[key])
        })
        console.log(chapters.length)
        console.log(Object.keys(novels).length)
    }
};