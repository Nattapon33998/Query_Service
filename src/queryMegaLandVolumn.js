const axios = require("axios");

// let nextBlockNumber;
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
  return nextPage.data;
}

async function findTargetBlock(numberOfBlocks) {
  let currentBlock = await axios.get("https://www.bkcscan.com/api/v2/blocks");
  currentBlock = currentBlock.data.items[0].height;
  return currentBlock - numberOfBlocks;
}

async function main() {
  const numberOfDays = 0.1; // change here
  const numberOfBlocks = numberOfDays * 17280; // Block per day is 17280
  const targetBlock = await findTargetBlock(numberOfBlocks);

  let eventLogs = [];

  let firstPage = await axios.get(baseUrl);
  let nextBlockNumber = firstPage.data.next_page_params.block_number;
  let nextIndex = firstPage.data.next_page_params.index;
  let nextItemsCount = firstPage.data.next_page_params.items_count;

  firstPage = await filterOnlyItemmSold(firstPage.data);
  eventLogs = [...firstPage];

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
  console.log("start at block : ", targetBlock);
  console.log(eventLogs);
  console.log(eventLogs.length);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
