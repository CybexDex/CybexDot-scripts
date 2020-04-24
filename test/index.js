const got = require('got');

async function main() {
    const response = await got('https://dotapi.cybex.io/api/v1/token');
    console.log(response.body);
}

main()
    .catch((e) => console.error(e.toJSON()))
    .finally(() => process.exit());
