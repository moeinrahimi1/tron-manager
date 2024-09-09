import { TronWeb } from "tronweb";
// const {TronWeb} = require('tronweb');
import express from 'express'
import bodyParser from 'body-parser'
import HDKey from 'hdkey'
import bip39 from 'bip39'
const app = express();
app.use(bodyParser.json());
const FULL_NODE = 'https://nile.trongrid.io';
const SOLIDITY_NODE = 'https://nile.trongrid.io';
const EVENT_SERVER = 'https://nile.trongrid.io';
// child address
// {
//     "address": "TNThbSL9AsKyzm5K3NDp64jDAvYEwHinVG",
//     "privateKey": "0a32c532c1e8bb931ca0be339e3798727252b9db48707a59ee31a79563763788"
// }
// // USDT contract address on TRC20
const usdtContractAddress = 'TWfXw4VZYtuewFLbCd6krE8ibgz1aByC7w';

// // TronGrid API key
const tronGridApiKey = '858a39c2-b760-4538-84f5-1c8f45614fb4';
// HD Wallet class
class HDWallet {
    constructor(mnemonic) {
        this.mnemonic = mnemonic || bip39.generateMnemonic();
        this.seed = bip39.mnemonicToSeedSync(this.mnemonic);
        this.hdkey = HDKey.fromMasterSeed(this.seed);
        this.parentWallet = this.hdkey.derive("m/44'/195'/0'/0/0");
    }

    getChildWallet(index) {
        return this.hdkey.derive(`m/44'/195'/0'/0/${index}`);
    }

    getAddress(wallet) {
        const privateKey = wallet.privateKey.toString('hex');
        return TronWeb.address.fromPrivateKey(privateKey);
    }

    getPrivateKey(wallet) {
        return wallet.privateKey.toString('hex');
    }
}

// Initialize HD Wallet
const hdWallet = new HDWallet();

// Function to create TronWeb instance with API key
function createTronWebInstance(privateKey) {
    return new TronWeb({
        fullNode:FULL_NODE,
        solidityNode:SOLIDITY_NODE,
        eventServer:EVENT_SERVER,
        // headers: { "TRON-PRO-API-KEY": tronGridApiKey },
        privateKey: "4fa9800dba860c7f18e284f12acf94768af5ef93b609b8ff0f7525211de06ac7"

    });
}

// Initialize TronWeb with parent wallet
const tronWeb = createTronWebInstance(hdWallet.getPrivateKey(hdWallet.parentWallet));

// Function to get account balance
async function getBalance(address) {
    const trxBalance = await tronWeb.trx.getBalance(address);
    console.log(trxBalance,'abala')
    // const contract = await tronWeb.contract().at(usdtContractAddress);
    // console.log(contract,'abala')
    // const usdtBalance = await contract.balanceOf(address).call();
    // console.log(usdtBalance,'abala')
    return {
        trx: tronWeb.fromSun(trxBalance),
        // usdt: tronWeb.fromSun(usdtBalance)
    };
}

// Create new child wallet
app.post('/create-wallet', (req, res) => {
    const { index } = req.body;
    const childWallet = hdWallet.getChildWallet(index);
    const address = hdWallet.getAddress(childWallet);
    const privateKey = hdWallet.getPrivateKey(childWallet);

    res.json({ address, privateKey });
});

// Get parent wallet info
app.get('/parent-wallet', (req, res) => {
    const address = hdWallet.getAddress(hdWallet.parentWallet);
    res.json({ address });
});

// Deposit TRX
app.post('/deposit/trx', async (req, res) => {
    const { to, amount } = req.body;
    try {
        const transaction = await tronWeb.trx.sendTransaction(to, amount);
        res.json({ success: true, transaction });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Withdraw TRX
app.post('/withdraw/trx', async (req, res) => {
    const { to, amount, fromIndex } = req.body;
    try {
        const childWallet = hdWallet.getChildWallet(fromIndex);
        const privateKey = hdWallet.getPrivateKey(childWallet);
        const childTronWeb = createTronWebInstance(privateKey);
        const transaction = await childTronWeb.trx.sendTransaction(to, amount);
        res.json({ success: true, transaction });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Deposit USDT
app.post('/deposit/usdt', async (req, res) => {
    const { to, amount } = req.body;
    try {
        const contract = await tronWeb.contract().at(usdtContractAddress);
        const transaction = await contract.transfer(to, amount).send();
        res.json({ success: true, transaction });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Withdraw USDT
app.post('/withdraw/usdt', async (req, res) => {
    const { to, amount, fromIndex } = req.body;
    try {
        const childWallet = hdWallet.getChildWallet(fromIndex);
        const privateKey = hdWallet.getPrivateKey(childWallet);
        const childTronWeb = createTronWebInstance(privateKey);
        const contract = await childTronWeb.contract().at(usdtContractAddress);
        const transaction = await contract.transfer(to, amount).send({
            feeLimit: 100000000,
            callValue: 0,
            shouldPollResponse: true
        });
        res.json({ success: true, transaction });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Get balance
app.get('/balance/:address', async (req, res) => {
    try {
        const balance = await getBalance(req.params.address);
        res.json(balance);
    } catch (error) {
        console.log(error,'erero')
        res.status(400).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));