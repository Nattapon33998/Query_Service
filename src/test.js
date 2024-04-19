const { ethers } = require("ethers");
const MegalandMarketabi = require("./abis/MegalandMarket.json");

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    "https://rpc.bitkubchain.io"
  );
  const contractAddress = "0x874987257374cAE9E620988FdbEEa2bBBf757cA9";

  const contract = new ethers.Contract(
    contractAddress,
    MegalandMarketabi,
    provider
  );

  const result = await contract["idToListing"](4281752);
  console.log(result.exchangeToken);
  console.log(parseInt(result.price._hex, 16));

  //   console.log(provider);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
