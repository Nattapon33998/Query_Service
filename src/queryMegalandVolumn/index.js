const axios = require("axios");
const { ethers } = require("ethers");
const MegalandMarketabi = require("./abis/MegalandMarket.json");
const TokenNameabi = require("./abis/TokenName.json");
const provider = new ethers.providers.JsonRpcProvider(
  "https://rpc.bitkubchain.io"
);
const megalandContractAddress = "0x874987257374cAE9E620988FdbEEa2bBBf757cA9";
const baseUrl =
  "https://www.bkcscan.com/api/v2/addresses/0x874987257374cAE9E620988FdbEEa2bBBf757cA9/logs";

async function filterOnlyItemmSold(data) {
  let itemSoldEvent = [];
  for (i in data.items) {
    const event = data.items[i];
    if (
      event.decoded.method_call ==
      "ItemSold(address indexed buyer, address indexed nftContract, uint256 indexed tokenId, address seller, uint256 soldAt, uint256 listingId)"
    ) {
      itemSoldEvent.push(data.items[i]);
    }
  }
  return itemSoldEvent;
}

async function queryNextPage(block_number, index, items_count) {
  let nextPage = await axios({
    method: "get",
    url:
      baseUrl +
      "?block_number=" +
      block_number +
      "&index=" +
      index +
      "&items_count" +
      items_count,
  });
  process.stdout.write(".");
  return nextPage.data;
}

async function findTargetBlock(numberOfBlocks) {
  let currentBlock = await axios.get("https://www.bkcscan.com/api/v2/blocks");
  currentBlock = currentBlock.data.items[0].height;
  return currentBlock - numberOfBlocks;
}

async function queryIdToListing(listingId) {
  let exchangeToken = "KUB";
  const contract = new ethers.Contract(
    megalandContractAddress,
    MegalandMarketabi,
    provider
  );
  const result = await contract["idToListing"](listingId);
  if (result.exchangeToken != null) {
    const tokenContract = new ethers.Contract(
      result.exchangeToken,
      TokenNameabi,
      provider
    );
    exchangeToken = await tokenContract["name"]();
    exchangeToken = String(exchangeToken);
  }

  console.log("\nListingID :", listingId);
  console.log({
    exchangeToken,
    price: parseInt(result.price._hex, 16),
  });
  return {
    exchangeToken,
    price: parseInt(result.price._hex, 16),
  };
}

async function main() {
  const args = process.argv;
  const userInput = args.slice(2);
  const numberOfDays = userInput[0];
  const numberOfBlocks = numberOfDays * 17280; // Block per day is 17280
  const targetBlock = await findTargetBlock(numberOfBlocks);

  let eventLogs = [];
  let exchangeTokenList = {};

  // Query first page
  console.log("Query event in process...");
  let firstPage = await axios.get(baseUrl);
  let nextBlockNumber = firstPage.data.next_page_params.block_number;
  let nextIndex = firstPage.data.next_page_params.index;
  let nextItemsCount = firstPage.data.next_page_params.items_count;

  firstPage = await filterOnlyItemmSold(firstPage.data);
  eventLogs = [...firstPage];

  // Query other page
  while (nextBlockNumber > targetBlock) {
    let nextPage = await queryNextPage(
      nextBlockNumber,
      nextIndex,
      nextItemsCount
    );
    nextBlockNumber = nextPage.next_page_params.block_number;
    nextIndex = nextPage.next_page_params.index;
    nextItemsCount = nextPage.next_page_params.items_count;

    nextPage = await filterOnlyItemmSold(nextPage);
    eventLogs.push(...nextPage);
  }

  for (i in eventLogs) {
    let { exchangeToken, price } = await queryIdToListing(
      eventLogs[i].decoded.parameters[5].value
    );
    if (exchangeTokenList.hasOwnProperty(exchangeToken)) {
      exchangeTokenList[exchangeToken] = {
        value: (exchangeTokenList[exchangeToken].value += price),
        quantity: (exchangeTokenList[exchangeToken].quantity += 1),
      };
    } else {
      exchangeTokenList[exchangeToken] = {
        value: price,
        quantity: 1,
      };
    }
  }

  console.log("\nQuery from last :", numberOfDays, "days");
  console.log("Start at block :", targetBlock);
  console.log("Total NFTs sold :", eventLogs.length);
  for (i in exchangeTokenList) {
    exchangeTokenList[i].value = (
      exchangeTokenList[i].value /
      10 ** 18
    ).toFixed(4);
    exchangeTokenList[i].value = Number(exchangeTokenList[i].value);
  }
  console.table(exchangeTokenList);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
