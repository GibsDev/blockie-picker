const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');

const EthUtil = require('ethereumjs-util');
const { workerData, parentPort } = require('worker_threads')

const data = workerData;
console.log('incoming workerData: ' , data);
console.log('Generating wallets...');

// Tracker for wallets per second
let attempts = 0;

// Limit for how many wallets this worker thread will generate
let count = 0;
const LIMIT = Number(data.limit);

// Generate a wallet
// Generates wallets the same way as the eth.build project: https://github.com/austintgriffith/eth.build
setInterval(async function() {
    attempts++;

    // mnemonic
    let mnemonic = require("bip39").generateMnemonic();
    let index = 0;

    // Private key and mnemonic
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const hdwallet = hdkey.fromMasterSeed(seed);
    const wallet_hdpath = "m/44'/60'/0'/0/";
    let fullPath = wallet_hdpath + index;
    const wallet = hdwallet.derivePath(fullPath).getWallet();
    let privk = "0x" + wallet._privKey.toString('hex');

    // Private key to everything else
    let pubk = "0x" + EthUtil.privateToPublic(wallet._privKey).toString('hex');
    let rawAddr = EthUtil.privateToAddress(wallet._privKey).toString('hex');
    let addr = "0x" + rawAddr;

    // Filter out unwanted addresses
    if (data.startsWith && !rawAddr.startsWith(data.startsWith)) return;
    if (data.contains && !rawAddr.includes(data.contains)) return;

    sendWallet({ "mnemonic": mnemonic, "privateKey": privk, "publicKey": pubk, "address": addr});
    
}, 0);

// Display how many wallets per second are being generated
setInterval(() => {
    console.log("Attempts per second (", data.id,"): ", attempts);
    attempts = 0;
}, 1000);

// Send wallet object to parent thread
function sendWallet(wallet) {
    if (count < LIMIT) {
        parentPort.postMessage(wallet);
        count++;
        if(count == LIMIT) {
            parentPort.postMessage(data.id);
            process.exit();
        }
    }
}

