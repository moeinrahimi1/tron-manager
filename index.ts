import { Elysia } from "elysia";
import { TronWeb } from "tronweb";
import HDKey from "hdkey";
import * as bip39 from "bip39";

const FULL_NODE = process.env.FULL_NODE || "https://nile.trongrid.io";
const PORT = process.env.PORT || 3000;

interface Balance {
  trx: string;
}

class HDWallet {
  private mnemonic: string;
  private seed: Buffer;
  private hdkey: HDKey;
  private parentWallet: HDKey;

  constructor(mnemonic?: string) {
    this.mnemonic = mnemonic || bip39.generateMnemonic();
    if(!process.env.MNEMONIC) {
      console.log(this.mnemonic,'\nif this is first time running app, write mnemonic to .env file');
    }
    this.seed = bip39.mnemonicToSeedSync(this.mnemonic);
    this.hdkey = HDKey.fromMasterSeed(this.seed);
    this.parentWallet = this.hdkey.derive("m/44'/195'/0'/0/0");
  }

  getChildWallet(index: number): HDKey {
    return this.hdkey.derive(`m/44'/195'/0'/0/${index}`);
  }

  getAddress(wallet: HDKey): string {
    const privateKey = wallet.privateKey!.toString("hex");
    return TronWeb.address.fromPrivateKey(privateKey).toString();
  }

  getPrivateKey(wallet: HDKey): string {
    return wallet.privateKey!.toString("hex");
  }
}

function createTronWebInstance(privateKey: string): TronWeb {
  return new TronWeb({
    fullHost: FULL_NODE,
    privateKey: privateKey,
  });
}

const hdWallet = new HDWallet(process.env.MNEMONIC);
const tronWeb = createTronWebInstance(
  hdWallet.getPrivateKey(hdWallet.getChildWallet(0))
);

async function getBalance(address: string): Promise<Balance> {
  const trxBalance = await tronWeb.trx.getBalance(address);
  return {
    trx: tronWeb.fromSun(trxBalance).toString(),
  };
}

const app = new Elysia()
  .post("/create-wallet", ({ body }) => {
    const { index } = body as { index: number };
    const childWallet = hdWallet.getChildWallet(index);
    const address = hdWallet.getAddress(childWallet);
    const privateKey = hdWallet.getPrivateKey(childWallet);
    return { address, privateKey };
  })
  .get("/parent-wallet", () => {
    const address = hdWallet.getAddress(hdWallet.getChildWallet(0));
    return { address };
  })
  .post("/deposit/trx", async ({ body }) => {
    const { to, amount } = body as { to: string; amount: number };
    try {
      const transaction = await tronWeb.trx.sendTransaction(to, amount);
      return { success: true, transaction };
    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, error: (error as Error).message }),
        { status: 400 }
      );
    }
  })
  .post("/withdraw/trx", async ({ body }) => {
    const { to, amount, fromIndex } = body as {
      to: string;
      amount: number;
      fromIndex: number;
    };
    try {
      const childWallet = hdWallet.getChildWallet(fromIndex);
      const privateKey = hdWallet.getPrivateKey(childWallet);
      const childTronWeb = createTronWebInstance(privateKey);
      const transaction = await childTronWeb.trx.sendTransaction(to, amount);
      return { success: true, transaction };
    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, error: (error as Error).message }),
        { status: 400 }
      );
    }
  })
  .get("/balance/:address", async ({ params }) => {
    try {
      const balance = await getBalance(params.address);
      return balance;
    } catch (error) {
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        status: 400,
      });
    }
  })
  .listen(PORT);

console.log(`Server is running on http://localhost:${PORT}`);
