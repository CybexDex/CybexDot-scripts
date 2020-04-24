const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const Config = require('../config');

const toAccount = '5ELsycSf2vVGN4whjWA176J2TWzJY52PDGxTC89APeuTcbvB';
const amount = 100000;

// dave to me
async function main() {
    const wsProvider = new WsProvider(Config.endPoint);

    const api = await ApiPromise.create({
        provider: wsProvider,
        types: Config.types,
    });

    const keyring = new Keyring({ type: 'sr25519' });
    const dave = keyring.addFromUri('//Dave', { name: 'Dave default' });

    await new Promise((resolve, reject) => {
        const transfer = api.tx.balances.transfer(toAccount, amount);

        transfer.signAndSend(dave, ({ events = [], status }) => {
            if (status.isFinalized) {
                console.log(
                    'Successful transfer of ' +
                        randomAmount +
                        ' with hash ' +
                        status.asFinalized.toHex()
                );
            } else {
                console.log('Status of transfer: ' + status.type);
            }

            events.forEach(({ phase, event: { data, method, section } }) => {
                console.log(
                    phase.toString() +
                        ' : ' +
                        section +
                        '.' +
                        method +
                        ' ' +
                        data.toString()
                );
            });
        });
    });
}

main()
    .catch(console.error)
    .finally(() => process.exit());
