import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// Apply persistent migration to upgrade the canister safely

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
    #medicines;
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
        case (#medicines) { "medicines" };
      };
    };
  };

  public type PaymentMethod = {
    #cashOnDelivery;
    #upi;
    #card;
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
    paymentMethod : PaymentMethod;
    owner : ?Principal;
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
  var seeded = false; // kept for upgrade compatibility
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place orders");
    };
    placeOrderWithPaymentInternal(caller, customerName, customerPhone, items, #cashOnDelivery);
  };

  public shared ({ caller }) func placeOrderWithPayment(customerName : Text, customerPhone : Text, items : [OrderedProduct], paymentMethod : PaymentMethod) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place orders");
    };
    placeOrderWithPaymentInternal(caller, customerName, customerPhone, items, paymentMethod);
  };

  func placeOrderWithPaymentInternal(owner : Principal, customerName : Text, customerPhone : Text, items : [OrderedProduct], paymentMethod : PaymentMethod) : Nat {
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
      paymentMethod;
      owner = ?owner;
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };

    let filtered = ordersMap.values().toArray().filter(
      func(order) {
        // Users can only see their own orders, admins can see all
        order.customerPhone == phone and (order.owner == caller or AccessControl.isAdmin(accessControlState, caller))
      }
    );
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
  // Helper function to check if a product with the given name already exists
  private func productExistsByName(name : Text) : Bool {
    let existingProducts = productsMap.values().toArray();
    existingProducts.find(func(p) { p.name == name }) != null;
  };

  // Helper function to add a product directly (internal use only, bypasses caller check)
  private func addProductInternal(name : Text, price : Float, unit : Text, category : ProductCategory, stockQuantity : Nat, imageEmoji : Text) {
    // Check if product already exists (idempotency)
    if (productExistsByName(name)) {
      return;
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
  };

  // Internal function for initial data seeding using system postupgrade
  private func runSeedProducts() {
    // Groceries
    addProductInternal("Basmati Rice", 80.0, "kg", #groceries, 100, "🌾");
    addProductInternal("Atta", 220.0, "5kg", #groceries, 100, "🍞");
    addProductInternal("Toor Dal", 110.0, "kg", #groceries, 100, "🥣");
    addProductInternal("Mustard Oil", 150.0, "1L", #groceries, 100, "🌻");
    addProductInternal("Sugar", 40.0, "kg", #groceries, 100, "🍬");
    addProductInternal("Salt", 20.0, "kg", #groceries, 100, "🧂");
    addProductInternal("Maggi Noodles", 15.0, "pack", #groceries, 100, "🍜");
    addProductInternal("Britannia Bread", 40.0, "pack", #groceries, 100, "🍞");

    // Fruits
    addProductInternal("Banana", 40.0, "dozen", #fruits, 100, "🍌");
    addProductInternal("Apple", 120.0, "kg", #fruits, 100, "🍎");
    addProductInternal("Mango", 60.0, "kg", #fruits, 100, "🥭");
    addProductInternal("Watermelon", 50.0, "piece", #fruits, 100, "🍉");
    addProductInternal("Grapes", 60.0, "500g", #fruits, 100, "🍇");
    addProductInternal("Papaya", 35.0, "piece", #fruits, 100, "🍈");
    addProductInternal("Pomegranate", 80.0, "piece", #fruits, 100, "🍎");

    // Vegetables
    addProductInternal("Tomato", 30.0, "kg", #vegetables, 100, "🍅");
    addProductInternal("Potato", 25.0, "kg", #vegetables, 100, "🥔");
    addProductInternal("Onion", 30.0, "kg", #vegetables, 100, "🧅");
    addProductInternal("Spinach", 20.0, "500g", #vegetables, 100, "🥬");
    addProductInternal("Carrot", 25.0, "500g", #vegetables, 100, "🥕");
    addProductInternal("Capsicum", 40.0, "500g", #vegetables, 100, "🫑");
    addProductInternal("Cauliflower", 30.0, "piece", #vegetables, 100, "🥦");
    addProductInternal("Bitter Gourd", 35.0, "500g", #vegetables, 100, "🥒");

    // Dairy
    addProductInternal("Amul Milk", 55.0, "1L", #dairy, 100, "🥛");
    addProductInternal("Amul Butter", 260.0, "500g", #dairy, 100, "🧈");
    addProductInternal("Paneer", 80.0, "200g", #dairy, 100, "🍽️");
    addProductInternal("Amul Curd", 45.0, "400g", #dairy, 100, "🥛");
    addProductInternal("Cheese Slice", 120.0, "pack", #dairy, 100, "🧀");

    // Snacks
    addProductInternal("Parle-G", 10.0, "pack", #snacks, 100, "🍪");
    addProductInternal("Lays Chips", 20.0, "pack", #snacks, 100, "🍟");
    addProductInternal("Good Day Biscuits", 25.0, "pack", #snacks, 100, "🍪");
    addProductInternal("Kurkure", 20.0, "pack", #snacks, 100, "🌽");
    addProductInternal("Hide & Seek", 30.0, "pack", #snacks, 100, "🍪");

    // Beverages
    addProductInternal("Real Juice", 95.0, "1L", #beverages, 100, "🧃");
    addProductInternal("Coca-Cola", 90.0, "2L", #beverages, 100, "🥤");
    addProductInternal("Frooti", 20.0, "200ml", #beverages, 100, "🥭");
    addProductInternal("Bisleri Water", 20.0, "1L", #beverages, 100, "💧");
    addProductInternal("Horlicks", 185.0, "500g", #beverages, 100, "☕");

    // Personal Care
    addProductInternal("Colgate Toothpaste", 60.0, "pack", #personalCare, 100, "🦷");
    addProductInternal("Lifebuoy Soap", 35.0, "bar", #personalCare, 100, "🧼");
    addProductInternal("Dove Shampoo", 180.0, "340ml", #personalCare, 100, "🧴");
    addProductInternal("Dettol Sanitizer", 90.0, "50ml", #personalCare, 100, "🧴");

    // Household
    addProductInternal("Surf Excel", 120.0, "kg", #household, 100, "🧺");
    addProductInternal("Harpic Toilet Cleaner", 85.0, "500ml", #household, 100, "🚽");
    addProductInternal("Vim Dishwash Bar", 25.0, "bar", #household, 100, "🧽");
    addProductInternal("Colin Glass Cleaner", 99.0, "500ml", #household, 100, "🪟");
    // More Groceries
    addProductInternal("Chana Dal", 95.0, "kg", #groceries, 100, "🫘");
    addProductInternal("Moong Dal", 100.0, "kg", #groceries, 100, "🟡");
    addProductInternal("Besan", 60.0, "500g", #groceries, 100, "🌾");
    addProductInternal("Poha", 50.0, "500g", #groceries, 100, "🌾");
    addProductInternal("Sooji", 40.0, "500g", #groceries, 100, "🌾");
    addProductInternal("Turmeric Powder", 30.0, "100g", #groceries, 100, "🟡");
    addProductInternal("Red Chilli Powder", 35.0, "100g", #groceries, 100, "🌶️");
    addProductInternal("Coriander Powder", 30.0, "100g", #groceries, 100, "🌿");
    addProductInternal("Cumin Seeds", 40.0, "100g", #groceries, 100, "🌿");
    addProductInternal("Black Pepper", 50.0, "50g", #groceries, 100, "⚫");
    addProductInternal("Vermicelli", 30.0, "200g", #groceries, 100, "🍝");
    addProductInternal("Sunflower Oil", 140.0, "1L", #groceries, 100, "🌻");

    // More Fruits
    addProductInternal("Orange", 80.0, "kg", #fruits, 100, "🍊");
    addProductInternal("Pineapple", 60.0, "piece", #fruits, 100, "🍍");
    addProductInternal("Guava", 40.0, "kg", #fruits, 100, "🍐");
    addProductInternal("Litchi", 100.0, "500g", #fruits, 100, "🍒");
    addProductInternal("Strawberry", 150.0, "250g", #fruits, 100, "🍓");
    addProductInternal("Coconut", 40.0, "piece", #fruits, 100, "🥥");
    addProductInternal("Lemon", 10.0, "piece", #fruits, 100, "🍋");

    // More Vegetables
    addProductInternal("Ladyfinger (Bhindi)", 40.0, "500g", #vegetables, 100, "🌿");
    addProductInternal("Brinjal", 30.0, "500g", #vegetables, 100, "🍆");
    addProductInternal("Peas", 50.0, "500g", #vegetables, 100, "🫛");
    addProductInternal("Garlic", 40.0, "250g", #vegetables, 100, "🧄");
    addProductInternal("Ginger", 30.0, "250g", #vegetables, 100, "🫚");
    addProductInternal("Green Chilli", 20.0, "250g", #vegetables, 100, "🌶️");
    addProductInternal("Beetroot", 35.0, "500g", #vegetables, 100, "🫀");
    addProductInternal("Cabbage", 25.0, "piece", #vegetables, 100, "🥬");
    addProductInternal("Radish", 20.0, "500g", #vegetables, 100, "🌿");
    addProductInternal("Bottle Gourd", 30.0, "piece", #vegetables, 100, "🥒");

    // More Dairy
    addProductInternal("Amul Ghee", 350.0, "500g", #dairy, 100, "🧈");
    addProductInternal("Lassi", 30.0, "200ml", #dairy, 100, "🥛");
    addProductInternal("Cream", 55.0, "200ml", #dairy, 100, "🍦");
    addProductInternal("Condensed Milk", 80.0, "400g", #dairy, 100, "🥛");

    // More Snacks
    addProductInternal("Haldiram Bhujia", 60.0, "200g", #snacks, 100, "🌾");
    addProductInternal("Pringles", 120.0, "110g", #snacks, 100, "🍟");
    addProductInternal("5 Star Chocolate", 20.0, "piece", #snacks, 100, "⭐");
    addProductInternal("KitKat", 30.0, "piece", #snacks, 100, "🍫");
    addProductInternal("Oreo Biscuits", 40.0, "pack", #snacks, 100, "🍪");
    addProductInternal("Murukku", 50.0, "200g", #snacks, 100, "🌀");
    addProductInternal("Popcorn", 30.0, "pack", #snacks, 100, "🍿");
    addProductInternal("Cashew Nuts", 200.0, "250g", #snacks, 100, "🥜");
    addProductInternal("Almonds", 250.0, "250g", #snacks, 100, "🥜");

    // More Beverages
    addProductInternal("Sprite", 40.0, "500ml", #beverages, 100, "🥤");
    addProductInternal("Pepsi", 40.0, "500ml", #beverages, 100, "🥤");
    addProductInternal("Tropicana Juice", 80.0, "1L", #beverages, 100, "🧃");
    addProductInternal("Boost", 180.0, "500g", #beverages, 100, "☕");
    addProductInternal("Bru Coffee", 120.0, "100g", #beverages, 100, "☕");
    addProductInternal("Tata Tea", 110.0, "250g", #beverages, 100, "🍵");
    addProductInternal("Red Bull", 115.0, "250ml", #beverages, 100, "🐂");
    addProductInternal("Coconut Water", 35.0, "200ml", #beverages, 100, "🥥");

    // More Personal Care
    addProductInternal("Head & Shoulders Shampoo", 200.0, "400ml", #personalCare, 100, "🧴");
    addProductInternal("Nivea Cream", 110.0, "100ml", #personalCare, 100, "🧴");
    addProductInternal("Gillette Razor", 150.0, "piece", #personalCare, 100, "🪒");
    addProductInternal("Whisper Pads", 80.0, "pack", #personalCare, 100, "🩺");
    addProductInternal("Oral-B Toothbrush", 60.0, "piece", #personalCare, 100, "🪥");
    addProductInternal("Vaseline", 80.0, "100ml", #personalCare, 100, "🧴");
    addProductInternal("Parachute Coconut Oil", 110.0, "200ml", #personalCare, 100, "🥥");

    // More Household
    addProductInternal("Phenyl Floor Cleaner", 60.0, "1L", #household, 100, "🧹");
    addProductInternal("Odonil Air Freshener", 45.0, "piece", #household, 100, "🌸");
    addProductInternal("Lizol Disinfectant", 130.0, "1L", #household, 100, "🧽");
    addProductInternal("Trash Bags", 55.0, "pack", #household, 100, "🗑️");
    addProductInternal("Tissue Paper", 40.0, "pack", #household, 100, "🧻");
    addProductInternal("Ariel Detergent", 150.0, "kg", #household, 100, "🧺");
    addProductInternal("Matchbox", 5.0, "pack", #household, 100, "🔥");

    // Medicines
    addProductInternal("Paracetamol", 12.0, "strip", #medicines, 100, "💊");
    addProductInternal("Crocin", 28.0, "strip", #medicines, 100, "💊");
    addProductInternal("Disprin", 15.0, "strip", #medicines, 100, "💊");
    addProductInternal("ORS Sachet", 10.0, "sachet", #medicines, 100, "💧");
    addProductInternal("Digene Antacid", 45.0, "pack", #medicines, 100, "💊");
    addProductInternal("Band-Aid", 30.0, "pack", #medicines, 100, "🩹");
    addProductInternal("Dettol Antiseptic", 90.0, "100ml", #medicines, 100, "🧴");
    addProductInternal("Vicks VapoRub", 55.0, "25ml", #medicines, 100, "🫁");
    addProductInternal("Ibuprofen", 25.0, "strip", #medicines, 100, "💊");
    addProductInternal("Antacid Syrup", 60.0, "200ml", #medicines, 100, "🍶");
    addProductInternal("Vitamin C Tablets", 80.0, "strip", #medicines, 100, "🍊");



  };

  system func postupgrade() {
    runSeedProducts();
  };

  public shared ({ caller }) func seedProducts() : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can seed products");
    };
    runSeedProducts();
  };
};
