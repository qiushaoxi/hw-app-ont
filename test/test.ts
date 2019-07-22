import { Crypto, Token, OntAssetTxBuilder, RestClient, TxSignature } from 'ontology-ts-sdk';
const { Address } = Crypto
const { State } = Token
const { makeTransferStateTx } = OntAssetTxBuilder
import { OntLedgerSigner as Ledger } from './ledger';

const endpoint = "http://polaris1.ont.io"
// const mainnet = "http://dappnode1.ont.io"
// const testnet = "http://polaris1.ont.io"
const restPort = 20334
const restClient = new RestClient(`${endpoint}:${restPort}`);

const gasLimit = '20000';
const gasPrice = '500';

async function transfer(ledger: Ledger, publicKey: Crypto.PublicKey, from: Crypto.Address, to: Crypto.Address, amount: number, token: string) {
    if (token == 'ONG') {
        amount = Math.floor(amount * 1e9)
    } else if (token == 'ONT') {
        amount = Math.floor(amount)
    } else {
        console.error('token type not support')
    }

    const states = [
        new State(from, to, amount),
    ];
    const payer = from
    const tx = makeTransferStateTx(token, states, gasPrice, gasLimit, payer);
    const sig = await ledger.sign(tx)
    console.log(sig)

    const txSig = new TxSignature();
    txSig.M = 1;
    txSig.pubKeys = [publicKey];
    txSig.sigData = [sig.serializeHex()];
    tx.sigs = [txSig];
    console.log(tx.sigs)
    console.log(tx)
    const result = await restClient.sendRawTransaction(tx.serialize());
    console.log(JSON.stringify(result));
}

// test
(async function () {
    const path = `44'/1024'/0'/0/0`
    console.log("path:", path)
    const ledger = new Ledger(path)
    await ledger.init()
    const publicKey = await ledger.getPublicKey()
    const address = Crypto.Address.fromPubKey(publicKey).toBase58()
    console.log(address)
    await transfer(ledger, publicKey, new Address(address), new Address("AYfwpEvXrTv6uBtDxYJGrgoABLCsvjsVrK"), 1, 'ONG')
    await ledger.close()
})()

