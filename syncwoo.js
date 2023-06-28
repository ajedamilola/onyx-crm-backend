const { Product, Category } = require("./database");

const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const api = new WooCommerceRestApi({
  url: "https://circuitcity.com.ng",
  consumerKey: "ck_364cc4fa2becaef0e95ee6bb60693b37eb95d730",
  consumerSecret: "cs_d53a2573da1d953fb958da04e2f95f23fd283e00",
});


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

  //Products Too
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

  }).finally(() => {
    console.log("Done");
    process.exit(0);
  })
})



//TODO: Updaing Of Products To WOO
//TODO: Fetching And Updating Of Orders
module.exports = api;