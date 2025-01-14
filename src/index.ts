import { convertPathToBuffer, convertDerToHex } from './utils';
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import * as elliptic from 'elliptic';
import { Crypto } from 'ontology-ts-sdk'


const VALID_STATUS = 0x9000;
const MSG_TOO_BIG = 0x6d08;
const APP_CLOSED = 0x6e00;
const TX_DENIED = 0x6985;
const TX_PARSE_ERR = 0x6d07;

export default class Ont {
  transport: TransportNodeHid
  constructor(transport: TransportNodeHid, scrambleKey = 'ONT') {
    this.transport = transport;
    //transport.decorateAppAPIMethods(this, ['getPublicKey', 'signMessage'], scrambleKey);
  }

  async getPublicKey(path: string) {
    try {
      const pathBuffer = convertPathToBuffer(path);
      const result = await this.transport.send(0x80, 0x04, 0x00, 0x00, pathBuffer, [VALID_STATUS]);
      const uncompressed = result.toString('hex').substring(0, 130)
      const ec = new elliptic.ec(Crypto.CurveLabel.SECP256R1.preset);
      const keyPair = ec.keyFromPublic(uncompressed, 'hex');
      const compressed = keyPair.getPublic(true, 'hex');
      return compressed;
    } catch (error) {
      throw this._convertTransportError(error);
    }
  }

  async signMessage(path: string, msg: string) {
    try {
      const pathBuffer = convertPathToBuffer(path);
      const data = msg + pathBuffer.toString('hex');
      const chunks = data.match(/.{1,500}/g) || [];
      if (chunks.length === 0) {
        throw new Error(`Invalid data provided: ${data}`);
      }

      let result = null;
      for (let i = 0; i < chunks.length; i++) {
        const p1 = i === chunks.length - 1 ? 0x80 : 0x00;
        const chunk = Buffer.from(chunks[i], 'hex');
        result = await this.transport.send(0x80, 0x02, p1, 0x00, chunk, [VALID_STATUS]);
        result = result && result.toString('hex');
      }

      if (result === null || result === '9000') {
        throw new Error('No more data but Ledger did not return signature!');
      }
      return convertDerToHex(result);
    } catch (error) {
      throw this._convertTransportError(error);
    }
  }

  _convertTransportError(error: any) {
    switch (error.statusCode) {
      case APP_CLOSED:
        error.message = 'Your ledger app is closed! Please login.';
        break;
      case MSG_TOO_BIG:
        error.message = 'Your transaction is too big for the ledger to sign!';
        break;
      case TX_DENIED:
        error.message = 'You have denied the transaction on your ledger.';
        break;
      case TX_PARSE_ERR:
        error.message =
          'Error parsing transaction. Make sure your ledger app version is up to date.';
        break;
    }
    return error;
  }
}