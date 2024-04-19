const axios = require("axios");

// let nextBlockNumber;
const baseUrl =
  "https://www.bkcscan.com/api/v2/addresses/0x874987257374cAE9E620988FdbEEa2bBBf757cA9/logs";

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
  const numberOfDays = 10; // change here
  const numberOfBlocks = numberOfDays * 17280; // Block per day is 17280
  const targetBlock = await findTargetBlock(numberOfBlocks);
  console.log(targetBlock);

  let eventLogs = [];
  let firstPage = await axios.get(baseUrl);
  eventLogs = [...firstPage.data.items];
  //   console.log(eventLogs[0]);
  //   console.log(firstPage.data.items[0].decoded.method_call);
  //   console.log(firstPage.data.next_page_params);
  let nextBlockNumber = firstPage.data.next_page_params.block_number;
  let nextIndex = firstPage.data.next_page_params.index;
  let nextItemsCount = firstPage.data.next_page_params.items_count;
  while (nextBlockNumber > targetBlock) {
    let nextPage = await queryNextPage(
      nextBlockNumber,
      nextIndex,
      nextItemsCount
    );
    eventLogs.push(...nextPage.items);
    nextBlockNumber = nextPage.data.next_page_params.block_number;
    nextIndex = nextPage.data.next_page_params.index;
    nextItemsCount = firstPage.data.next_page_params.items_count;
  }
  console.log(eventLogs.items);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
