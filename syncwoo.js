const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const api = new WooCommerceRestApi({
  url: "https://circuitcity.com.ng",
  consumerKey: "ck_364cc4fa2becaef0e95ee6bb60693b37eb95d730",
  consumerSecret: "cs_d53a2573da1d953fb958da04e2f95f23fd283e00",
});

api.get("products").then(response=>{
    console.log(response.data);
})