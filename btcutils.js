const axios = require ('axios');
const bip39 = require('bip39');
const bip32 = require('bip32');
const bitcoin = require('bitcoinjs-lib');

async function validateMnemonic(mnemonic){
    return bip39.validateMnemonic(mnemonic);
} 

// generamos el mnemonic random
async function generateMnemonic(){
    const mn = bip39.generateMnemonic();
    return mn;
}

// generamos la seed a partir del mnemonic
async function generateSeed(mnemonic){
    const sd = bip39.mnemonicToSeedSync(mnemonic);
    return sd;
}

// generamos el nodo
async function generateNode(seed){
    const nd = bip32.fromSeed(seed, bitcoin.networks.testnet);
    return nd;
}

// get address
async function getAddress(node){
    const ad = bitcoin.payments.p2pkh({pubkey: node.publicKey, network: bitcoin.networks.testnet}).address;
    return ad;
}

async function getBalance(address){
    const result = await axios.get('https://api.blockcypher.com/v1/btc/test3/addrs/'  + address + '/full');
    const total_balance = result.data.final_balance;
    const unconf_balance = result.data.unconfirmed_balance;
    const conf_balance = result.data.balance;
    
    return [total_balance, unconf_balance, conf_balance];
}

async function getUTXO(address) {
    const result = await axios.get('https://api.blockcypher.com/v1/btc/test3/addrs/'  + address + '/full');
    const txs = result.data.txs;
    
    let utxo = [];

    // el siguiente for aninado podria mejorarse usando: map, reduce & filter
    for (let i=0; i<txs.length; i++) {
        const tx = txs[i];
        const outs = tx.outputs;
        
        for (let j=0; j<outs.length; j++) {
            const out = outs[j];
            if(!out.spent_by) {
                if(out.addresses.indexOf(address) !== -1) {
                    utxo.push({
                        txId: tx.hash,
                        index: j,
                        value: out.value
                    });
                }
            }
        }
    }

    return utxo;
}

async function sendTx(dest_address, send_amount, tx_fee) {
    let totalAmount = 0;
    let keyPair = bitcoin.ECPair.fromWIF(node.toWIF(), bitcoin.networks.testnet);

    const utxos = await getUTXO(address);

    // ordeno las utxos en orden creciente
    utxos.sort(function(utxo1,utxo2){
        return utxo1.value-utxo2.value;
    })
    console.log(utxos);
    let ninputs = 0;
    let tx = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
    for(let i=1; totalAmount<send_amount+tx_fee && i<utxos.length;i++){
        tx.addInput(utxos[i].txId, utxos[i].index);
        totalAmount += utxos[i].value;
        ninputs++;
    }

    tx.addOutput(dest_address, send_amount);
    tx.addOutput(address, totalAmount - send_amount - tx_fee);
    
    for(let i=0; i<ninputs; i++) {
        tx.sign(i, keyPair);
    }

    const body = tx.build().toHex();
    //console.log(body);

    await axios.post('https://api.blockcypher.com/v1/btc/test3/txs/push', {
        tx: body
    });
}

async function getTXs(address, formatDate) {
    const result = await axios.get('https://api.blockcypher.com/v1/btc/test3/addrs/'  + address + '/full');
    const txs = result.data.txs;
    
    let txs_out = [];

    // recorremos las transacciones
    for (let i=0; i<txs.length; i++) {
        const tx = txs[i];
        const ins = tx.inputs;
        const outs = tx.outputs;

        let inputs = [];
        let outputs = [];
        
        let formatted_date = await formatDate(tx.received);

        let tx_out = {hash: tx.hash,
            date: formatted_date,
            inputs: [],
            outputs: []
        };

        // obtenemos datos de los inputs
        for (let j=0; j<ins.length; j++) {
            const input = ins[j];
            tx_out.inputs.push({
                address: input.addresses,
                valor: input.output_value
            });
        }
        // obtenemos datos de los outputs
        for (let j=0; j<outs.length; j++) {
            const output = outs[j];
            let spt = false;
            if (output.hasOwnProperty('spent')){
                spt = true;
            }
            tx_out.outputs.push({
                address: output.addresses,
                valor: output.value,
                spent: spt
            });
        }

        // metemos la TX en el array de salida
        txs_out.push(tx_out);
    }
    return txs_out;
}

module.exports = { validateMnemonic, generateMnemonic, generateSeed, generateNode, getAddress, getBalance, getUTXO, sendTx, getTXs }