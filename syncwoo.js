const { Product, Category } = require("./database");

//============= CONFIG
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const api = new WooCommerceRestApi({
  url: "https://circuitcity.com.ng",
  consumerKey: "ck_364cc4fa2becaef0e95ee6bb60693b37eb95d730",
  consumerSecret: "cs_d53a2573da1d953fb958da04e2f95f23fd283e00",
});

let syncing = {
  products: false,
  categories: false
}

function Sync() {
  console.log("🏁 Starting Woocommerce Sync At ", new Date().toLocaleString());
  syncing.categories = true;
  syncing.products = true;
  api.get("products/categories").then(response => {
    // require("fs").writeFileSync("nogit/woo_categories.json", JSON.stringify(response.data))
    const categories = response.data;
    categories.forEach(async wooCat => {
      const dbCat = await Category.findOne({ wid: wooCat.id })
      if (!dbCat) {
        const category = new Category({
          name: wooCat.name, description: wooCat.description, wid: wooCat.id
        })
        category.save()
      }
    });
    syncing.categories = false;
    console.log("Done Syncing Categories ✅");


    api.get("products").then(r => {
      const products = r.data;
      // require("fs").writeFileSync("nogit/woo_products.json", JSON.stringify(response.data))
      products.forEach(async wooProduct => {
        const dbProduct = await Product.findOne({ wid: wooProduct.id })
        const { name, price, featured, id } = wooProduct;
        if (!dbProduct) {
          const product = new Product({
            price,
            featured,
            name,
            image: wooProduct.images[0]?.src,
            category: wooProduct.categories[0]?.name || "Uncategorized",
            qty: wooProduct.stock_quantity || 0,
            wid: id
          });
          product.save();
        } else {
          dbProduct.price = price;
          dbProduct.featured = featured;
          dbProduct.name = name;
          dbProduct.image = wooProduct.images[0]?.src
          dbProduct.category = wooProduct.categories[0]?.name || "Uncategorized"
          dbProduct.qty = wooProduct.stock_quantity || 0
          dbProduct.save()
        }
      })
      syncing.products = false
      console.log("Done Syncing Products ✅")
      console.log("==============✔✔ ALL DONE ✔✔==========")
    })

  })

}

//============= INIT
console.log(`

            ░██╗░░░░░░░██╗███████╗██╗░░░░░░█████╗░░█████╗░███╗░░░███╗███████╗
            ░██║░░██╗░░██║██╔════╝██║░░░░░██╔══██╗██╔══██╗████╗░████║██╔════╝
            ░╚██╗████╗██╔╝█████╗░░██║░░░░░██║░░╚═╝██║░░██║██╔████╔██║█████╗░░
            ░░████╔═████║░██╔══╝░░██║░░░░░██║░░██╗██║░░██║██║╚██╔╝██║██╔══╝░░
            ░░╚██╔╝░╚██╔╝░███████╗███████╗╚█████╔╝╚█████╔╝██║░╚═╝░██║███████╗
            ░░░╚═╝░░░╚═╝░░╚══════╝╚══════╝░╚════╝░░╚════╝░╚═╝░░░░░╚═╝╚══════╝
            
▀█▀ █▀█   █▀▀ █ █▀█ █▀▀ █░█ █ ▀█▀   █▀▀ █ ▀█▀ █▄█   █▀▀ █▀█ █▀▄▀█   █░█░█ █▀█ █▀█ █▀▀ █▀█ █▀▄▀█ █▀▄▀█ █▀▀ █▀█ █▀▀ █▀▀
░█░ █▄█   █▄▄ █ █▀▄ █▄▄ █▄█ █ ░█░   █▄▄ █ ░█░ ░█░   █▄▄ █▀▄ █░▀░█   ▀▄▀▄▀ █▄█ █▄█ █▄▄ █▄█ █░▀░█ █░▀░█ ██▄ █▀▄ █▄▄ ██▄

█▀ █▄█ █▄░█ █▀▀ █▀▀ █▀█
▄█ ░█░ █░▀█ █▄▄ ██▄ █▀▄

This action takes place wevery 24 HRS Do NOT STOP Process ⚠ ⚠ ⚠ In order to keep woocomerce synced 

======================================================================================================


`);
Sync();
setInterval(() => {
  if (!syncing.products && !syncing.categories) {
    Sync();
  }
}, 1000 * 60 * 60 * 24)


//TODO: Updaing Of Products To WOO
//TODO: Fetching And Updating Of Orders
module.exports = api;