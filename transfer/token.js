const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const fs = require('fs');

const Config = require('../config');

const ALICE_BOT = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
const Token_ID =
    '0xf4169148358073831eacb40822ccfa8a7754c8fd8e5283be0dc98db8e86181ec';
const toAccount = ALICE_BOT;
const amount = 100000000000;

function readAccount() {
    const obj = JSON.parse(fs.readFileSync('./wallet.json', 'utf8'));
    const keyring = new Keyring();
    const pair = keyring.addFromJson(obj);
    pair.decodePkcs8('Qwer1234');

    return pair;
}

async function main() {
    const account = readAccount();
    const wsProvider = new WsProvider(Config.endPoint);
    const api = await ApiPromise.create({
        provider: wsProvider,
        types: Config.types,
    });

    const transferRecord = await new Promise((resolve, reject) => {
        // Transferd(AccountId, AccountId, Hash, Balance)
        api.tx.tokenModule
            .transfer(Token_ID, toAccount, amount, '')
            .signAndSend(account, (result) => {
                if (result.status.isFinalized) {
                    const failedExtrinsic = result.findRecord(
                        'system',
                        'ExtrinsicFailed'
                    );
                    if (failedExtrinsic) {
                        reject(failedExtrinsic.toJSON().event.data);
                    }
                    const record = result.findRecord(
                        'tokenModule',
                        'Transferd'
                    );
                    if (record) {
                        resolve(record);
                    }
                }
            });
    });
    const transferEvent = transferRecord.toJSON().event.data;
    console.log('transfer event: ', transferEvent);
}

main()
    .catch(console.error)
    .finally(() => process.exit());
