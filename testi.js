

const emptySlots = [1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0]


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
if (coinFlip) slicedChapters = emptySlots.slice(topIndex - Math.floor(topValue / 2), topIndex+1)
else slicedChapters = emptySlots.slice(topIndex - (topValue - 1), topIndex + 1 - Math.floor(topValue / 2)).reverse()



console.log(emptySlots)
console.log(emptySlots[topIndex - (topValue - 2)])
console.log(topValue, topIndex)

console.log(coinFlip, slicedChapters)