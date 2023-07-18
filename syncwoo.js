const { Product, Category, Order,api, Customer  } = require("./database");
process.title = "CiruitWooSync"
let syncing = {
  products: false,
  categories: false,
  orders:false,
  customers:false
}

async function Sync() {
  //Products And Categories
  console.log("🏁 Starting Woocommerce Sync At ", new Date().toLocaleString());
  syncing.categories = true;
  syncing.products = true;
  syncing.orders = true;
  syncing.customers = true;

  //=====Categories Sync
  console.log("Syncing Cattegories.....");
  const categories = (await api.get("products/categories",{per_page:30})).data
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
  console.log("Syncing Products.....");
  console.log("Syncing Page 1...")
  let products = (await api.get("products",{per_page:100,page:1})).data
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
        wid: id,
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

  console.log("Syncing Page 2...")
  products = (await api.get("products",{per_page:100,page:2})).data
  console.log(products.length)
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
  console.log("Syncing Orders.....");
  const orders = (await api.get("orders")).data;
  await Promise.all(
    orders.map(async wooOrder => {
      const order = await Order.findOne({ wid: wooOrder.id })
      const { billing, shipping, customer_id, line_items, status, total, total_tax, date_created, date_modified, date_paid, payment_method_title } = wooOrder;
      if (order) {
        //Update Order if found
        order.customer = String(customer_id);
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
        order.save()
      } else {
        const norder = new Order({ billing, shipping, status, total, wid:wooOrder.id })
        norder.customer = customer_id
        norder.lineItems = line_items.map(l => ({ productId: l.product_id, quantity: l.quantity, price: l.price }))
        norder.totalTax = total_tax;
        norder.dateCreated = new Date(date_created);
        norder.dateModified = new Date(date_modified);
        norder.datePaid = new Date(date_paid)
        norder.payementMethod = payment_method_title;
        norder.save()
      }
    })
  )
  console.log("Orders Sync Successfull ✅✅")
  syncing.orders = false


  //=======Customers Syncing
  console.log("Syncing Customers.....");

  const customers = (await api.get("customers")).data
  await Promise.all(customers.map(async wooCustomer=>{
    const customer = await Customer.findOne({wid:wooCustomer.id})
    const {first_name,last_name,shipping,email,avatar_url,phone,date_created,billing} = wooCustomer;
    if(customer){
      customer.name = `${first_name} ${last_name}`;
      customer.email = email;
      customer.address = billing.address_1 + " " + shipping.address_2 + ","+shipping.city+","+shipping.state+","+shipping.country
      customer.phone = phone;
      customer.image = avatar_url;
      customer.dateAdded = new Date(date_created)
      customer.save()
    }else{
      const customer = new Customer({
        name: `${first_name} ${last_name}`,
        email: email,
        address: shipping.address_1 + " " + shipping.address_2 + ","+shipping.city+","+shipping.state+","+shipping.country,
        phone: phone,
        image: avatar_url,
        dateAdded: new Date(date_created),
        wid:wooCustomer.id
      })
      customer.save()
    }
  }));
  syncing.customers  = false;
  console.log("Customer Sync Successfull ✅✅")

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
module.exports = api;