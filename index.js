const readline = require("readline");
const utils = require('./utils');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var mnemonic = null;
var seed = null;
var node = null;
var address = "No address";

async function main(){
    utils.mainMenu(rl, mnemonic, seed, node, address);
}

main();
