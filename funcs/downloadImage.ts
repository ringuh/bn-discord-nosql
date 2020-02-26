import axios from 'axios'
import sharp from 'sharp'
const { yellow } = require('chalk').bold

async function downloadImage(url: string, filename: string, folder: string) {
    if (!url || !url.startsWith("http")) return null
    console.log(yellow(url))
    return new Promise(async (resolve, reject) => {
        //url = encodeURI(url)
        const path = `${folder}/${filename}`
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer' // stream
        }).then(async response => {
            const buffer = Buffer.from(response.data, 'binary')
            await sharp(buffer).resize(200).png({ lossless: false }).toFile(path)
                .then(f => setTimeout(() => { resolve(path) }, 500))
                .catch(err => setTimeout(() => { reject({ message: err.message }) }, 500))
        }).catch(err => {
            setTimeout(() => { reject({ message: err.message }) }, 500)
        })
    })
}

module.exports = downloadImage