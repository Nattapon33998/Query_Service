const axios = require("axios");

async function main() {
  // const
  const baseUrl =
    "https://www.bkcscan.com/api/v2/addresses/0x874987257374cAE9E620988FdbEEa2bBBf757cA9/logs";

  let firstPage = await axios.get(baseUrl);
  //   console.log(firstPage.data.items[0].decoded.method_call);
  console.log(firstPage.data.next_page_params);
  let secoundPage = await axios({
    method: "get",
    url:
      baseUrl +
      "?block_number=" +
      firstPage.data.next_page_params.block_number +
      "&index=" +
      firstPage.data.next_page_params.index +
      "&items_count" +
      firstPage.data.next_page_params.items_count,
  });
  console.log(secoundPage.data.next_page_params);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
