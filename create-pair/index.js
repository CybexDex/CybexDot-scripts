const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const fs = require('fs');
const Config = require('../config');
const got = require('got');

const BASE_SYMBOL = 'EOS';
const BASE_ID =
    '0x63cb5b56223c13509d7c763d2d25b6e1995948cb924719332bf2c32c7238c523';
const BASE_PRECISION = 6;

const QUOTE_SYMBOL = 'ETH';
const QUOTE_ID =
    '0xf4169148358073831eacb40822ccfa8a7754c8fd8e5283be0dc98db8e86181ec';
const QUOTE_PRECISION = 6;

const PRECISIONs = {
    info: {
        last_price: 5,
        change: 5,
        volume: 2,
    },
    book: {
        last_price: 5,
        amount: 2,
        total: 6,
    },
    choose: {
        last_price: 5,
        volume: 2,
    },
    form: {
        min_trade_amount: 0.01,
        amount_step: 0.01,
        price_step: 0.00001,
        min_order_value: 0.002,
        total_step: 0.000001,
    },
};

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

    const pairRecord = await new Promise((resolve) => {
        // TradePairCreated(AccountId, Hash, TradePair),
        api.tx.tradeModule
            .createTradePair(BASE_ID, QUOTE_ID)
            .signAndSend(account, (result) => {
                if (result.status.isFinalized) {
                    const record = result.findRecord(
                        'tradeModule',
                        'TradePairCreated'
                    );
                    if (record) {
                        resolve(record);
                    }
                }
            });
    });
    const pairEvent = pairRecord.toJSON().event.data;
    console.log('event: ', pairEvent);

    const data = {
        id: pairEvent[1],
        base: {
            id: BASE_ID,
            name: BASE_SYMBOL,
            precision: BASE_PRECISION,
        },
        quote: {
            id: QUOTE_ID,
            name: QUOTE_SYMBOL,
            precision: QUOTE_PRECISION,
        },
        ...PRECISIONs,
    };
    console.log(data);

    const client = got.extend({
        prefixUrl: API_URL,
        headers: {
            'ADMIN-SECRET': ADMIN_SECRET,
        },
    });
    const { body } = await client.post('pair', {
        json: data,
        responseType: 'json',
    });

    console.log(body);
}

main()
    .catch(console.error)
    .finally(() => process.exit());
