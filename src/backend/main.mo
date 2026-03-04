import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import List "mo:core/List";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  //----------------------------- Type definitions ------------------------------
  public type ProductCategory = {
    #groceries;
    #fruits;
    #vegetables;
    #dairy;
    #snacks;
    #beverages;
    #personalCare;
    #household;
  };

  module ProductCategory {
    public func toText(category : ProductCategory) : Text {
      switch (category) {
        case (#groceries) { "groceries" };
        case (#fruits) { "fruits" };
        case (#vegetables) { "vegetables" };
        case (#dairy) { "dairy" };
        case (#snacks) { "snacks" };
        case (#beverages) { "beverages" };
        case (#personalCare) { "personalCare" };
        case (#household) { "household" };
      };
    };
  };

  public type OrderStatus = {
    #pending;
    #accepted;
    #outForDelivery;
    #delivered;
  };

  public type Product = {
    productId : Nat;
    name : Text;
    price : Float;
    unit : Text;
    category : ProductCategory;
    stockQuantity : Nat;
    imageEmoji : Text;
  };

  module Product {
    public func compare(product1 : Product, product2 : Product) : Order.Order {
      Nat.compare(product1.productId, product2.productId);
    };
  };

  public type OrderedProduct = {
    productId : Nat;
    productName : Text;
    quantity : Nat;
    price : Float;
  };

  public type Order = {
    orderId : Nat;
    customerName : Text;
    customerPhone : Text;
    items : [OrderedProduct];
    totalAmount : Float;
    status : OrderStatus;
    createdAt : Time.Time;
  };

  public type UserProfile = {
    name : Text;
  };

  module ProductStore {
    public func compare(store1 : ProductStore, store2 : ProductStore) : Order.Order {
      Nat.compare(store1.productId, store2.productId);
    };
  };

  public type ProductStore = {
    productId : Nat;
    product : Product;
  };

  //---------------------- Persistent state -------------------------------------
  var nextProductId = 1;
  var nextOrderId = 1;

  let productsMap = Map.empty<Nat, Product>();
  let ordersMap = Map.empty<Nat, Order>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  //---------------------- User Profile Management ------------------------------
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  //---------------------- Product Management -----------------------------------
  public shared ({ caller }) func addProduct(name : Text, price : Float, unit : Text, category : ProductCategory, stockQuantity : Nat, imageEmoji : Text) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can add products");
    };

    let product = {
      productId = nextProductId;
      name;
      price;
      unit;
      category;
      stockQuantity;
      imageEmoji;
    };

    productsMap.add(nextProductId, product);
    nextProductId += 1;
    product.productId;
  };

  public shared ({ caller }) func updateProduct(productId : Nat, name : Text, price : Float, unit : Text, category : ProductCategory, stockQuantity : Nat, imageEmoji : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can update products");
    };

    switch (productsMap.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?_) {
        let updatedProduct = {
          productId;
          name;
          price;
          unit;
          category;
          stockQuantity;
          imageEmoji;
        };
        productsMap.add(productId, updatedProduct);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(productId : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can delete products");
    };

    if (not productsMap.containsKey(productId)) {
      Runtime.trap("Product not found");
    };

    productsMap.remove(productId);
  };

  public shared ({ caller }) func updateStock(productId : Nat, newStock : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can update stock");
    };

    switch (productsMap.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) {
        let updatedProduct = {
          product with
          stockQuantity = newStock;
        };
        productsMap.add(productId, updatedProduct);
      };
    };
  };

  //---------------------- Product Queries --------------------------------------
  public query ({ caller }) func getProducts() : async [Product] {
    productsMap.values().toArray().sort();
  };

  public query ({ caller }) func getProductsByCategory(category : ProductCategory) : async [Product] {
    productsMap.values().toArray().filter(func(product) { product.category == category }).sort();
  };

  public query ({ caller }) func searchProducts(searchTerm : Text) : async [Product] {
    let filtered = productsMap.values().toArray().filter(
      func(product) { product.name.toLower().contains(#text(searchTerm.toLower())) }
    );
    filtered.sort();
  };

  //----------------------- Order Management ------------------------------------
  public shared ({ caller }) func placeOrder(customerName : Text, customerPhone : Text, items : [OrderedProduct]) : async Nat {
    // Verify stock availability before placing order
    for (item in items.values()) {
      switch (productsMap.get(item.productId)) {
        case (null) { Runtime.trap("Product not found: " # item.productId.toText()) };
        case (?product) {
          if (product.stockQuantity < item.quantity) {
            Runtime.trap("Insufficient stock for product: " # product.name);
          };
        };
      };
    };

    let totalAmount = items.foldLeft(0.0, func(acc, item) { acc + (item.price * item.quantity.toFloat()) });

    let orderId = nextOrderId;
    let order = {
      orderId;
      customerName;
      customerPhone;
      items;
      totalAmount;
      status = #pending : OrderStatus;
      createdAt = Time.now();
    };

    ordersMap.add(orderId, order);
    nextOrderId += 1;

    // Update stock after successful order creation
    for (item in items.values()) {
      switch (productsMap.get(item.productId)) {
        case (null) {};
        case (?product) {
          let newStockQuantity = if (item.quantity > product.stockQuantity) {
            Runtime.trap("Cannot reduce stock below zero");
          } else {
            product.stockQuantity - item.quantity : Nat;
          };
          let updatedProduct = {
            product with
            stockQuantity = newStockQuantity;
          };
          productsMap.add(item.productId, updatedProduct);
        };
      };
    };

    orderId;
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Nat, status : OrderStatus) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can update order status");
    };

    switch (ordersMap.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder = {
          order with
          status;
        };
        ordersMap.add(orderId, updatedOrder);
      };
    };
  };

  public query ({ caller }) func getOrdersByPhone(phone : Text) : async [Order] {
    // Public access allowed - customers can check their orders by phone
    let filtered = ordersMap.values().toArray().filter(func(order) { order.customerPhone == phone });
    filtered;
  };

  public query ({ caller }) func getProductById(productId : Nat) : async ?Product {
    productsMap.get(productId);
  };

  public query ({ caller }) func getOrderById(orderId : Nat) : async ?Order {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can view order details");
    };
    ordersMap.get(orderId);
  };

  public query ({ caller }) func getOrdersPaginated(offset : Nat, limit : Nat) : async [Order] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can view all orders");
    };

    let ordersArray = ordersMap.values().toArray();

    if (offset >= ordersArray.size()) {
      return [];
    };

    let actualLimit = Nat.min(ordersArray.size() - offset, limit);
    ordersArray.sliceToArray(offset, offset + actualLimit);
  };

  public query ({ caller }) func getProductsPaginated(offset : Nat, limit : Nat) : async [Product] {
    let productsArray = productsMap.values().toArray().sort();

    if (offset >= productsArray.size()) {
      return [];
    };

    let actualLimit = Nat.min(productsArray.size() - offset, limit);
    productsArray.sliceToArray(offset, offset + actualLimit);
  };

  public query ({ caller }) func getOutOfStockProducts() : async [Product] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can view out of stock products");
    };
    productsMap.values().toArray().filter(func(product) { product.stockQuantity == 0 }).sort();
  };

  public query ({ caller }) func getOrdersInLast24Hours() : async [Order] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can view order statistics");
    };

    let now = Time.now();
    let dayInNanos = 24 * 60 * 60 * 1_000_000_000;

    let filtered = ordersMap.values().toArray().filter(
      func(order) { now - order.createdAt <= dayInNanos }
    );
    filtered;
  };

  //----------------------- Product Seeding -------------------------------------
  public shared ({ caller }) func seedProducts() : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can seed products");
    };

    // Groceries
    ignore await addProduct("Basmati Rice", 80.0, "kg", #groceries, 100, "🌾");
    ignore await addProduct("Atta", 220.0, "5kg", #groceries, 100, "🍞");
    ignore await addProduct("Toor Dal", 110.0, "kg", #groceries, 100, "🥣");
    ignore await addProduct("Mustard Oil", 150.0, "1L", #groceries, 100, "🌻");
    ignore await addProduct("Sugar", 40.0, "kg", #groceries, 100, "🍬");
    ignore await addProduct("Salt", 20.0, "kg", #groceries, 100, "🧂");
    ignore await addProduct("Maggi Noodles", 15.0, "pack", #groceries, 100, "🍜");
    ignore await addProduct("Britannia Bread", 40.0, "pack", #groceries, 100, "🍞");

    // Fruits
    ignore await addProduct("Banana", 40.0, "dozen", #fruits, 100, "🍌");
    ignore await addProduct("Apple", 120.0, "kg", #fruits, 100, "🍎");
    ignore await addProduct("Mango", 60.0, "kg", #fruits, 100, "🥭");
    ignore await addProduct("Watermelon", 50.0, "piece", #fruits, 100, "🍉");
    ignore await addProduct("Grapes", 60.0, "500g", #fruits, 100, "🍇");

    // Vegetables
    ignore await addProduct("Tomato", 30.0, "kg", #vegetables, 100, "🍅");
    ignore await addProduct("Potato", 25.0, "kg", #vegetables, 100, "🥔");
    ignore await addProduct("Onion", 30.0, "kg", #vegetables, 100, "🧅");
    ignore await addProduct("Spinach", 20.0, "500g", #vegetables, 100, "🥬");
    ignore await addProduct("Carrot", 25.0, "500g", #vegetables, 100, "🥕");
    ignore await addProduct("Capsicum", 40.0, "500g", #vegetables, 100, "🫑");

    // Dairy
    ignore await addProduct("Amul Milk", 55.0, "1L", #dairy, 100, "🥛");
    ignore await addProduct("Amul Butter", 260.0, "500g", #dairy, 100, "🧈");
    ignore await addProduct("Paneer", 80.0, "200g", #dairy, 100, "🍽️");

    // Snacks
    ignore await addProduct("Parle-G", 10.0, "pack", #snacks, 100, "🍪");
    ignore await addProduct("Lays Chips", 20.0, "pack", #snacks, 100, "🍟");
    ignore await addProduct("Good Day Biscuits", 25.0, "pack", #snacks, 100, "🍪");

    // Beverages
    ignore await addProduct("Real Juice", 95.0, "1L", #beverages, 100, "🧃");
    ignore await addProduct("Coca-Cola", 90.0, "2L", #beverages, 100, "🥤");

    // Personal Care
    ignore await addProduct("Colgate Toothpaste", 60.0, "pack", #personalCare, 100, "🦷");
    ignore await addProduct("Lifebuoy Soap", 35.0, "bar", #personalCare, 100, "🧼");

    // Household
    ignore await addProduct("Surf Excel", 120.0, "kg", #household, 100, "🧺");
    ignore await addProduct("Harpic Toilet Cleaner", 85.0, "500ml", #household, 100, "🚽");
  };
};
