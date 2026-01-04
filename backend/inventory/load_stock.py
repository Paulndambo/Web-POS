from typing import Dict, Any
from inventory.models import InventoryItem, Category

products: list[Dict[str, Any]] = [
    { "name": 'Coca Cola 1L', "price": 50, "barcode": '12345', "category": 'Beverages', "quantity": 50 },
    { "name": 'Lays Chips', "price": 99, "barcode": '12346', "category": 'Snacks', "quantity": 30 },
    { "name": 'Bread 400g', "price": 50, "barcode": '12347', "category": 'Bakery', "quantity": 20 },
    { "name": 'Milk 1L', "price": 99, "barcode": '12348', "category": 'Dairy', "quantity": 25 },
    { "name": 'Apple 1kg', "price": 99, "barcode": '12349', "category": 'Fruits', "quantity": 40 },
    { "name": 'Chicken Breast', "price": 99, "barcode": '12350', "category": 'Meat', "quantity": 15 },
    { "name": 'Rice 5kg', "price": 1299, "barcode": '12351', "category": 'Grains', "quantity": 35 },
    { "name": 'Eggs 12pc', "price": 5.49, "barcode": '12352', "category": 'Dairy', "quantity": 45 },
    { "name": 'Orange Juice', "price": 49, "barcode": '12353', "category": 'Beverages', "quantity": 28 },
    { "name": 'Chocolate Bar', "price": 99, "barcode": '12354', "category": 'Snacks', "quantity": 60 },
    { "name": 'Coca Cola 2L', "price": 150, "barcode": '12345', "category": 'Beverages', "quantity": 50 },
    { "name": 'Lays Chips Big', "price": 199, "barcode": '12346', "category": 'Snacks', "quantity": 30 },
    { "name": 'Bread 800g', "price": 150, "barcode": '12347', "category": 'Bakery', "quantity": 20 },
    { "name": 'Milk 1L', "price": 99, "barcode": '12348', "category": 'Dairy', "quantity": 25 },
    { "name": 'Apple 2kg', "price": 199, "barcode": '12349', "category": 'Fruits', "quantity": 40 },
    { "name": 'Chicken Breast L', "price": 199, "barcode": '12350', "category": 'Meat', "quantity": 15 },
    { "name": 'Rice 10kg', "price": 1299, "barcode": '12351', "category": 'Grains', "quantity": 35 },
    { "name": 'Eggs 24pc', "price": 149, "barcode": '12352', "category": 'Dairy', "quantity": 45 },
    { "name": 'Orange Juice 2L', "price": 149, "barcode": '12353', "category": 'Beverages', "quantity": 28 },
  ]



def load_categories():
    for product in products:
        Category.objects.update_or_create(
            name=product["category"]
        )

        print(f"Category Name: {product["category"]}")

def load_products():
    for product in products:
        category = Category.objects.get(name=product["category"])

        InventoryItem.objects.create(
            category=category,
            barcode=product["barcode"],
            name=product["name"],
            quantity=1000,
            price=product["price"]
        )

        print(f"Product Name: {product["name"]} created successfully!!!")