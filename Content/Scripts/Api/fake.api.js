const winExampleArray = [
    [1, 1, 1, 2, 4, 3, 6, 2, 2, 2, 3, 2, 2, 4, 4],
    [3, 6, 5, 6, 4, 1, 1, 1, 5, 6, 3, 2, 5, 5, 4],
    [3, 2, 5, 5, 2, 3, 2, 4, 6, 6, 1, 1, 1, 2, 6],
    [1, 5, 6, 6, 1, 3, 1, 4, 1, 2, 3, 2, 1, 2, 4],
    [3, 5, 1, 2, 4, 3, 1, 5, 6, 2, 1, 6, 5, 5, 2],
    [1, 1, 6, 5, 4, 3, 4, 1, 2, 4, 3, 5, 5, 1, 6],
    [3, 5, 2, 2, 6, 3, 5, 1, 2, 2, 1, 1, 6, 4, 5],
    [3, 1, 1, 1, 4, 1, 5, 2, 6, 6, 3, 4, 6, 2, 6],
    [3, 2, 4, 2, 5, 1, 6, 2, 6, 1, 3, 1, 1, 1, 6],
    [1, 6, 6, 5, 2, 3, 1, 1, 1, 4, 3, 5, 5, 4, 6],
    [1, 0, 1, 1, 1, 3, 6, 4, 6, 5, 3, 5, 5, 2, 2],
    [2, 0, 4, 0, 9, 9, 2, 6, 4, 2, 3, 4, 9, 5, 6],
    [2, 1, 1, 4, 4, 7, 0, 0, 6, 3, 6, 5, 1, 5, 3]
];

const defaultExampleArray = [
    [3, 1, 4, 6, 6, 2, 6, 4, 5, 1, 3, 2, 6, 3, 2],
    [3, 1, 3, 5, 5, 3, 1, 6, 3, 5, 10, 5, 5, 3, 3],
    [2, 3, 1, 1, 10, 5, 3, 1, 5, 7, 3, 3, 4, 5, 4],
    [1, 1, 4, 3, 2, 2, 3, 4, 10, 3, 1, 3, 8, 5, 3],
    [1, 6, 1, 2, 4, 6, 8, 8, 2, 4, 2, 4, 5, 2, 4],
    [3, 2, 5, 4, 5, 10, 3, 5, 5, 5, 1, 1, 5, 6, 5]
];

// WILD COMBINATIONS
// [1, 0, 1, 1, 1, 3, 6, 4, 6, 5, 3, 5, 5, 2, 2] 
// [2, 0, 4, 0, 9, 9, 2, 6, 4, 2, 3, 4, 9, 5, 6]
// [2, 1, 1, 4, 4, 7, 0, 0, 6, 3, 6, 5, 1, 5, 3]

const variants = [1, 2, 3, 4, 5, 6, 7, 8];

function replaceOnes(lines, newValue) {
  return lines.map(arr => arr.map(x => x === 1 ? newValue : x));
}
const allWinLinesVariants = variants.map(v => replaceOnes(winExampleArray, v));


let winCombinationCouter = 0;

const MachineInfo = {
    Balance: 1000,
    Baraban: [1, 6, 1, 2, 4, 6, 8, 8, 2, 4, 2, 4, 5, 2, 4],
    UserWin: 0,
    Multiplier: 1,
    ErrorMessage: null
}

async function GetBoard(bet) {
    if(!bet) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return MachineInfo;
    }
    const betAmount = parseFloat(bet);

    if(MachineInfo.Balance < betAmount || betAmount <= 0) {
        MachineInfo.ErrorMessage = "Something went wrong";
        await new Promise(resolve => setTimeout(resolve, 100));
        return MachineInfo;
    }

    // get random numbers from 1 to 5
    MachineInfo.Multiplier = Math.floor(Math.random() * 5) + 1;

    MachineInfo.UserWin = 0;
    MachineInfo.Balance -= betAmount;
    
    let array = defaultExampleArray;
    const randomIndex = Math.floor(Math.random() * array.length);
    winCombinationCouter++;
    if(winCombinationCouter % randomIndex === 1) {
        MachineInfo.UserWin += betAmount * MachineInfo.Multiplier;
        array = allWinLinesVariants[Math.floor(Math.random() * allWinLinesVariants.length)];
    }

    MachineInfo.Balance += MachineInfo.UserWin;
    MachineInfo.ErrorMessage = null;

    if(winCombinationCouter > array.length) winCombinationCouter = 0;
    
    await new Promise(resolve => setTimeout(resolve, 100 * randomIndex));
    
    MachineInfo.Baraban = array[randomIndex];

    return MachineInfo;
}
