const { Product, Category, Order,api  } = require("./database");
process.title = "CiruitWooSync"
let syncing = {
  products: false,
  categories: false,
  orders:false
}

async function Sync() {
  //Products And Categories
  console.log("🏁 Starting Woocommerce Sync At ", new Date().toLocaleString());
  syncing.categories = true;
  syncing.products = true;
  syncing.orders = true;

  //=====Categories Sync
  const categories = (await api.get("products/categories")).data
  await Promise.all(categories.map(async wooCat => {
    const dbCat = await Category.findOne({ wid: wooCat.id })
    if (!dbCat) {
      const category = new Category({
        name: wooCat.name, description: wooCat.description, wid: wooCat.id
      })
      category.save()
    }
  }));
  syncing.categories = false;
  console.log("Done Syncing Categories ✅");


  //=====Products Syncing
  const products = (await api.get("products")).data
  // require("fs").writeFileSync("nogit/woo_products.json", JSON.stringify(response.data))
  await Promise.all(products.map(async wooProduct => {
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
  }))
  syncing.products = false
  console.log("Done Syncing Products ✅")

  //=======Orders Syncing
  console.log("Syncing Orders");
  const orders = (await api.get("orders")).data;
  await Promise.all(
    orders.map(async wooOrder => {
      const order = await Order.findOne({ wid: wooOrder.id })
      const { billing, shipping, line_items, status, total, total_tax, date_created, date_modified, date_paid, payment_method_title } = wooOrder;
      if (order) {
        //Update Order if found
        order.billing = billing;
        order.shipping = shipping;
        order.lineItems = line_items.map(l => ({ productId: l.product_id, quantity: l.quantity, price: l.price }))
        order.status = status;
        order.total = total;
        order.totalTax = total_tax;
        order.dateCreated = new Date(date_created);
        order.dateModified = new Date(date_modified);
        order.datePaid = new Date(date_paid)
        order.payementMethod = payment_method_title;
      } else {
        const order = new Order({ billing, shipping, status, total, wid:wooOrder.id })
        order.lineItems = line_items.map(l => ({ productId: l.product_id, quantity: l.quantity, price: l.price }))
        order.totalTax = total_tax;
        order.dateCreated = new Date(date_created);
        order.dateModified = new Date(date_modified);
        order.datePaid = new Date(date_paid)
        order.payementMethod = payment_method_title;
        order.save()
      }
    })
  )
  console.log("Orders Sync Successfull ✅✅")
  syncing.orders = false

  console.log("==============✔✔ ALL DONE ✔✔==========")

}

//============= INIT
console.log(`
Starting Woo Commerce Data Synchronization 🔃🔃🔃
=========================

`);
Sync();
setInterval(() => {
  if (!syncing.products && !syncing.categories && !syncing.orders) {
    Sync();
  }
}, 1000 * 60 * 30)


//TODO: Updaing Of Products To WOO
//TODO: Fetching And Updating Of Orders
module.exports = api;