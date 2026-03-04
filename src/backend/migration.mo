import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";

module {
  type ProductCategory = {
    #groceries;
    #fruits;
    #vegetables;
    #dairy;
    #snacks;
    #beverages;
    #personalCare;
    #household;
  };

  type Product = {
    productId : Nat;
    name : Text;
    price : Float;
    unit : Text;
    category : ProductCategory;
    stockQuantity : Nat;
    imageEmoji : Text;
  };

  type OldProductsMap = Map.Map<Nat, Product>;
  type OldActor = {
    productsMap : OldProductsMap;
  };

  type NewProductsMap = Map.Map<Nat, Product>;
  type NewActor = {
    productsMap : NewProductsMap;
  };

  public func run(old : OldActor) : NewActor {
    let newProducts = old.productsMap.map<Nat, Product, Product>(
      func(_id, product) {
        let existingProductsArray = old.productsMap.values().toArray();
        let existingProduct = existingProductsArray.find(
          func(p) { p.name == product.name }
        );

        switch (existingProduct) {
          case (?_) {
            product;
          };
          case (null) {
            product;
          };
        };
      }
    );
    { productsMap = newProducts };
  };
};
