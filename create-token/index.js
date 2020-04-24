const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const fs = require('fs');
const Config = require('../config');
const got = require('got');

const SYMBOL = 'ETH';
const SUPPLY = 10000000;
const PRECISION = 6;

const API_URL = 'https://dotapi.cybex.io/api/v1';
const ADMIN_SECRET = 'XQhB1o8EbJb4';

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

    const amount = SUPPLY * 10 ** PRECISION;

    const record = await new Promise((resolve) => {
        api.tx.tokenModule
            .issue(SYMBOL, amount)
            .signAndSend(account, (result) => {
                if (result.status.isFinalized) {
                    const record = result.findRecord('tokenModule', 'Issued');
                    if (record) {
                        resolve(record);
                    }
                }
            });
    });
    const event = record.toJSON().event.data;
    console.log('event:', event);

    const data = {
        id: event[1],
        name: SYMBOL,
        supply: SUPPLY.toString(),
        precision: PRECISION,
    };
    console.log(data);

    const client = got.extend({
        prefixUrl: API_URL,
        headers: {
            'ADMIN-SECRET': ADMIN_SECRET,
        },
    });
    const { body } = await client.post('token', {
        json: data,
        responseType: 'json',
    });
    console.log(body);
}

main()
    .catch(console.error)
    .finally(() => process.exit());
