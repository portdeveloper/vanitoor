/* eslint-disable no-undef */
/* eslint-env worker */
/* eslint-disable no-restricted-globals */

self.importScripts(
  "https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js"
);

let shouldContinueGenerating = true;

const generateAddresses = async function* (ensName) {
  let count = 0;
  while (shouldContinueGenerating) {
    // Generate a random private key using Web Crypto API
    const randomBytes = new Uint8Array(32);
    self.crypto.getRandomValues(randomBytes);
    const privateKeyHex = Array.from(randomBytes)
      .map((b) => ("00" + b.toString(16)).slice(-2))
      .join("");
    const privateKey = "0x" + privateKeyHex;

    // Create an ethers.js Wallet instance
    const wallet = new ethers.Wallet(privateKey);
    const address = wallet.address;
    count++;
    if (address.startsWith("0x" + ensName)) {
      shouldContinueGenerating = false;
      yield { address, privateKey, count };
      return;
    }
    if (count % 100 === 0) {  // Every 100 addresses generated, yield count for progress tracking
      yield { count };
    }
  }
};

self.onmessage = (event) => {
  if (event.data === 'stop') {
    shouldContinueGenerating = false;
  } else {
    const ensName = event.data;
    shouldContinueGenerating = true;

    const generator = generateAddresses(ensName);
    (async function () {
      let result = await generator.next();
      while (!result.done) {
        self.postMessage(result.value);
        result = await generator.next();
      }
    })().catch((error) => {
      // Log the error or handle it as appropriate
      console.error(error);
      shouldContinueGenerating = false;
    });
  }
};

self.onmessageerror = () => {
  // Graceful termination logic
  shouldContinueGenerating = false;
};
