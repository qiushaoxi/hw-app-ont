# Ledger javascript API for ONT and NEO

## Usage

```typescript
require("babel-polyfill");
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import HwAppOnt from "@qiushaoxi/hw-app-ont";
import { Crypto, Transaction, utils } from 'ontology-ts-sdk';

export class OntLedgerSigner {
    path: string
    transport: any
    app: any
    constructor(path: string) {
        this.path = path
    }
    async init() {
        this.transport = await TransportNodeHid.open("");
        this.app = new HwAppOnt(this.transport);
    }
    async close() {
        await this.transport.close()
    }
    async sign(transaction: Transaction): Promise<Crypto.Signature> {
        const unsignedData = transaction.serializeUnsignedData();
        const result = await this.app.signMessage(this.path, unsignedData);
        const ontSignature = new Crypto.Signature(Crypto.SignatureScheme.ECDSAwithSHA256, result);
        const signatureHex = ontSignature.serializeHex();
        console.log(signatureHex);
        return ontSignature;
    }
    async getPublicKey(): Promise<Crypto.PublicKey> {
        const publicKeyStr = await this.app.getPublicKey(this.path);
        console.log(publicKeyStr);
        const publicKey = Crypto.PublicKey.deserializeHex(new utils.StringReader(publicKeyStr))
        console.log(publicKey.serializeHex())
        return publicKey;
    }
};
```
