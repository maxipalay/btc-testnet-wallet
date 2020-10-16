const btcutils = require('./btcutils');
const util = require('util');

async function inputMnemonicAndGenerateAddress(rl){
    let promise = new Promise(async function(resolve, reject) {
        rl.question("Ingrese un mnemonic:\n"
        , async function (line) {
            if (await btcutils.validateMnemonic(line)){
                console.log("mnemonic ok\n");
                mnemonic=line;
                seed = await btcutils.generateSeed(mnemonic);
                node = await btcutils.generateNode(seed);
                address = await btcutils.getAddress(node);
                mainMenu(rl, mnemonic, seed, node, address);
            } else {
                console.log("el mnemonic no es válido\n");
                inputMnemonicAndGenerateAddress(rl); 
            }
        });});
    await promise;
}

async function formatDate(date){
    let tx_date = new Date(date);
    let formatted_date = ("0"+tx_date.getDate()).slice(-2)+"/"+("0"+tx_date.getMonth()).slice(-2)+"/"+tx_date.getFullYear();
    return formatted_date;
}

async function sendTransactionMenu(rl){
    let amount_to_send = 0;
    let dest_address = "";
    let fee = 0;
    rl.question("Input amount to send (satoshis): ", async function (line) {
        amount_to_send = parseInt(line, 10);
        rl.question("Input destination address: ", async function(line){
            dest_address = line;
            rl.question("Input fee (satoshis): ", async function(line){
                fee = parseInt(line,10);
                await btcutils.sendTx(dest_address,amount_to_send,fee);
                mainMenu(rl, mnemonic, seed, node, address);
            });
        });
    });
}

function mainMenu(rl, mnemonic, seed, node, address) {
    rl.question("\n\tMenu principal\n\n"
        +"\tWallet address: "+address+"\n\n"
        +"\tAcciones (ingrese el numero de accion y luego Enter\n"
        + "\t\t1) Generar mnemonic y address\n"
        + "\t\t2) Ingresar mnemonic y calcular address\n"
        + "\t\t3) Balance\n"
        + "\t\t4) Mostrar transacciones\n"
        + "\t\t5) Enviar Bitcoin\n"
        + "\t\t6) Salir\n"
        , async function (line) {
            switch (line){
                case "1":
                    mnemonic = await btcutils.generateMnemonic();
                    seed = await btcutils.generateSeed(mnemonic);
                    node = await btcutils.generateNode(seed);
                    address = await btcutils.getAddress(node);
                    console.log("Generated mnemonic: "+mnemonic)
                    console.log(address);
                    break;
                case "2":
                    inputMnemonicAndGenerateAddress(rl);
                    break;
                case "3":
                    balances = await btcutils.getBalance(address);
                    console.log("total balance: "+balances[0]+"\n");
                    console.log("confirmed balance: "+balances[2]+"\n"); 
                    console.log("unconfirmed balance: "+balances[1]+"\n");     
                    break;
                case "4":
                    utxos = await btcutils.getTXs(address, formatDate);    
                    console.log(util.inspect(utxos,{showHidden: false, depth: null}));
                    break;
                case "5":
                    sendTransactionMenu(rl);
                    break;
                case "6":
                    console.log("Cerrando aplicación...");
                    rl.close();
                    return;
                default:
                    console.log("La opción ingresada no es correcta.");
            }
    mainMenu(rl, mnemonic, seed, node, address);
    });
}

module.exports = { inputMnemonicAndGenerateAddress, formatDate, sendTransactionMenu, mainMenu }