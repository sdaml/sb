const fetch = require('node-fetch');

const ethUrl = 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=CAD';
const btcUrl = 'https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=CAD';

const jsonResponse = (res) => res.json();
const getETHPrice = () => fetch(ethUrl).then(jsonResponse);
const getBTCPrice = () => fetch(btcUrl).then(jsonResponse);

module.exports = {
    getETHPrice,
    getBTCPrice
};
