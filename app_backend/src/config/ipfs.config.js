module.exports = {
  apiKey: process.env.PINATA_API_KEY,
  secretKey: process.env.PINATA_SECRET_KEY,
  gateway: process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
};
