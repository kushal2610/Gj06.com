"""
Run this ONCE to seed your Supabase database with the real GJ 06 menu.

Usage:
    python seed_menu.py
"""
from lib.supabase_client import supabase

menu_items = [
    # ── Chai Ki Chuski ───────────────────────────────
    {"category": "Chai Ki Chuski", "name": "Cutting Chai",          "description": "The classic half-cup chai, strong and bold.",                              "price": 4.00,  "tag": "bestseller", "sort_order": 1},
    {"category": "Chai Ki Chuski", "name": "Masala Chai",           "description": "Our signature blend of spices brewed slow and fresh every time.",           "price": 5.00,  "tag": "bestseller", "sort_order": 2},
    {"category": "Chai Ki Chuski", "name": "Ginger (Adarak) Chai",  "description": "Fresh ginger brewed deep into every sip. Warming and bold.",               "price": 5.00,  "tag": None,         "sort_order": 3},
    {"category": "Chai Ki Chuski", "name": "Mint (Phudina) Chai",   "description": "Fresh mint leaves steeped with our house chai blend.",                     "price": 5.00,  "tag": None,         "sort_order": 4},
    {"category": "Chai Ki Chuski", "name": "Cardamom (Elaichi) Chai","description": "Fragrant cardamom pods slow-brewed for a deeply aromatic cup.",           "price": 5.00,  "tag": None,         "sort_order": 5},
    {"category": "Chai Ki Chuski", "name": "Masala Coffee",         "description": "Our spice blend meets rich coffee. Unexpected and unforgettable.",          "price": 6.00,  "tag": "new",        "sort_order": 6},

    # ── Coffee ───────────────────────────────────────
    {"category": "Coffee", "name": "Long Black",    "description": "Bold, clean espresso poured over hot water.",                    "price": 4.50, "tag": None,         "sort_order": 1},
    {"category": "Coffee", "name": "Flat White",    "description": "Silky microfoam over a double ristretto. The Australian classic.", "price": 4.50, "tag": "bestseller", "sort_order": 2},
    {"category": "Coffee", "name": "Latte",         "description": "Smooth espresso with steamed milk and a light foam top.",         "price": 4.50, "tag": None,         "sort_order": 3},
    {"category": "Coffee", "name": "Cappuccino",    "description": "Equal parts espresso, steamed milk, and thick foam.",             "price": 4.50, "tag": None,         "sort_order": 4},
    {"category": "Coffee", "name": "Hot Chocolate", "description": "Rich, velvety house-made hot chocolate.",                         "price": 5.00, "tag": None,         "sort_order": 5},
    {"category": "Coffee", "name": "Chai Latte",    "description": "Our masala chai blend meets steamed milk.",                       "price": 5.00, "tag": "bestseller", "sort_order": 6},
    {"category": "Coffee", "name": "Dirty Chai",    "description": "Espresso shot poured straight into masala chai. Dangerously good.","price": 5.50, "tag": "new",        "sort_order": 7},
    {"category": "Coffee", "name": "Mocha",         "description": "Espresso meets chocolate meets milk.",                            "price": 5.50, "tag": None,         "sort_order": 8},
    {"category": "Coffee", "name": "Piccolo",       "description": "Ristretto in a small glass with a dash of milk.",                 "price": 4.00, "tag": None,         "sort_order": 9},
    {"category": "Coffee", "name": "Espresso",      "description": "Single shot, pure and unapologetic.",                            "price": 4.00, "tag": None,         "sort_order": 10},
    {"category": "Coffee", "name": "Affogato",      "description": "Vanilla ice cream drowned in a hot espresso shot.",               "price": 9.00, "tag": None,         "sort_order": 11},
    {"category": "Coffee", "name": "Babyccino",     "description": "Frothy steamed milk for the little ones.",                        "price": 1.00, "tag": None,         "sort_order": 12},

    # ── Cold Brew ─────────────────────────────────────
    {"category": "Cold Brew", "name": "Iced Latte",               "description": "Smooth espresso over ice with cold milk.",                         "price": 8.00, "tag": "bestseller", "sort_order": 1},
    {"category": "Cold Brew", "name": "Iced Chai Latte",          "description": "Our masala chai blend chilled over ice with milk.",                 "price": 8.00, "tag": "bestseller", "sort_order": 2},
    {"category": "Cold Brew", "name": "Iced Coffee",              "description": "Cold brew poured over ice with a splash of milk.",                  "price": 8.00, "tag": None,         "sort_order": 3},
    {"category": "Cold Brew", "name": "Iced Mocha",               "description": "Cold brew meets chocolate. Rich and refreshing.",                   "price": 8.00, "tag": None,         "sort_order": 4},
    {"category": "Cold Brew", "name": "Cold Coffee (Indian Style)","description": "Sweetened cold coffee blended thick. Utterly addictive.",           "price": 11.00,"tag": "new",        "sort_order": 5},

    # ── Indian Street Style ──────────────────────────
    {"category": "Indian Street Style", "name": "Bombay Style Vadapav",  "description": "Spicy potato fritter in gram flour batter, toasted bun, garlic chutney & fried green chilli.", "price": 7.50, "tag": "bestseller", "sort_order": 1},
    {"category": "Indian Street Style", "name": "Masala Vadapav",        "description": "Spiced potato fritter in a butter-toasted bun with tangy garlic chutney and special house masala.", "price": 8.50, "tag": None, "sort_order": 2},
    {"category": "Indian Street Style", "name": "Cheese Vadapav",        "description": "Spicy potato fritter with melted cheese in a toasted bun.", "price": 9.50, "tag": None, "sort_order": 3},
    {"category": "Indian Street Style", "name": "Schezwan Vadapav",      "description": "A fiery Indo-Chinese fusion with Schezwan sauce.", "price": 9.50, "tag": "spicy", "sort_order": 4},
    {"category": "Indian Street Style", "name": "Pav Bhaji",             "description": "Buttery spiced vegetable mash with toasted pav buns, onions, and lemon.", "price": 15.90, "tag": "bestseller", "sort_order": 5},
    {"category": "Indian Street Style", "name": "Veg. Cheese Frankie",   "description": "Soft flatbread rolled with spiced veggies, melted cheese, and tangy sauces.", "price": 11.90, "tag": None, "sort_order": 6},
    {"category": "Indian Street Style", "name": "Cheese Paneer Frankie", "description": "Flatbread with spiced paneer, melted cheese, fresh veggies and tangy chutneys.", "price": 12.90, "tag": None, "sort_order": 7},
    {"category": "Indian Street Style", "name": "Samosa (2pcs)",         "description": "Golden flaky pastry filled with spiced mashed potatoes and peas.", "price": 7.00, "tag": "bestseller", "sort_order": 8},
    {"category": "Indian Street Style", "name": "Dabeli",                "description": "Sweet, spicy Gujarati street snack with pomegranate, peanuts, and sev.", "price": 7.90, "tag": None, "sort_order": 9},
    {"category": "Indian Street Style", "name": "Sev Usal",              "description": "Spicy white pea curry topped with crispy sev, onions, and fresh coriander.", "price": 14.90, "tag": None, "sort_order": 10},

    # ── Snacks ────────────────────────────────────────
    {"category": "Snacks", "name": "GJ06 Special Club Sandwich", "description": "Triple-layered toasted bread with fresh veggies, cheese, and tangy sauces.", "price": 14.90, "tag": "bestseller", "sort_order": 1},
    {"category": "Snacks", "name": "Veg. Bombay Grilled Sandwich","description": "Buttered bread grilled golden, filled with fresh veggies and melted cheese.", "price": 12.90, "tag": None, "sort_order": 2},
    {"category": "Snacks", "name": "Veg. Aloo Puff",             "description": "Flaky pastry filled with spicy, flavourful mashed potatoes.",                 "price": 5.90,  "tag": None, "sort_order": 3},
    {"category": "Snacks", "name": "Paneer Puff",                "description": "Flaky pastry filled with spiced, soft paneer cubes.",                         "price": 7.90,  "tag": None, "sort_order": 4},
    {"category": "Snacks", "name": "Schezwan Cheese Puff",       "description": "Crispy flaky pastry stuffed with cheese and fiery Schezwan sauce.",           "price": 7.90,  "tag": "spicy", "sort_order": 5},
    {"category": "Snacks", "name": "Handvo",                     "description": "Savory steamed lentil and rice cake, crisped to perfection.",                 "price": 7.90,  "tag": None, "sort_order": 6},
    {"category": "Snacks", "name": "Indori Poha",                "description": "Fluffy flattened rice with mustard seeds, curry leaves, sev, and lemon.",     "price": 9.90,  "tag": None, "sort_order": 7},
    {"category": "Snacks", "name": "Sev Khamni",                 "description": "Steamed chickpea flour crumble with crunchy sev, chutneys, and fresh herbs.", "price": 11.90, "tag": None, "sort_order": 8},

    # ── Pizza & Burger ────────────────────────────────
    {"category": "Pizza & Burger", "name": "GJ06 Signature Pizza",   "description": "11\" — Marinated paneer, onions, capsicum, jalapeños, pineapple & herbs.", "price": 15.90, "tag": "bestseller", "sort_order": 1},
    {"category": "Pizza & Burger", "name": "Veg. Signature Burger",  "description": "Hearty veggie pattie, pineapple ring, lettuce, tomato, beetroot & our signature sauces.", "price": 15.90, "tag": "bestseller", "sort_order": 2},
    {"category": "Pizza & Burger", "name": "Veg. Pizza",             "description": "11\" — Onions, capsicum, tomatoes, black olives, and aromatic herbs.",     "price": 14.90, "tag": None, "sort_order": 3},
    {"category": "Pizza & Burger", "name": "Margherita Pizza",       "description": "San Marzano tomato, fresh basil, quality mozzarella.",                    "price": 12.90, "tag": None, "sort_order": 4},
    {"category": "Pizza & Burger", "name": "Loaded Fries",           "description": "Cheesy seasoned fries with jalapeños, onion, and signature sauces.",      "price": 13.90, "tag": "bestseller", "sort_order": 5},
    {"category": "Pizza & Burger", "name": "GJ06 Special Garlic Bread","description": "Garlic bread topped with marinated paneer, onion, capsicum, olives, and herbs.", "price": 10.90, "tag": "new", "sort_order": 6},

    # ── Sweet Goodies ─────────────────────────────────
    {"category": "Sweet Goodies", "name": "Bun Maska",               "description": "Soft bun generously layered with butter. A timeless Irani café favourite.", "price": 6.00,  "tag": "bestseller", "sort_order": 1},
    {"category": "Sweet Goodies", "name": "Pistachio Falooda",       "description": "Layered rose milk falooda with pistachio. A show-stopper in a glass.",     "price": 10.90, "tag": "bestseller", "sort_order": 2},
    {"category": "Sweet Goodies", "name": "Maharaja Falooda",        "description": "The royal version — loaded with all the toppings, rose milk, and ice cream.", "price": 10.90, "tag": "bestseller", "sort_order": 3},
    {"category": "Sweet Goodies", "name": "Pistachio Crunch Brownie","description": "Fudgy brownie topped with pistachio crunch. Our most indulgent bite.",    "price": 15.90, "tag": "new", "sort_order": 4},
    {"category": "Sweet Goodies", "name": "Biscoff Cheesecake",      "description": "Creamy cheesecake on a crunchy Biscoff base.",                             "price": 9.90,  "tag": "new", "sort_order": 5},
    {"category": "Sweet Goodies", "name": "Brownie with Ice Cream",  "description": "Warm fudgy brownie with a scoop of cold ice cream.",                       "price": 10.90, "tag": None, "sort_order": 6},
    {"category": "Sweet Goodies", "name": "Chocolate Brownie",       "description": "Dense, fudgy, perfectly gooey. Made fresh daily.",                         "price": 6.90,  "tag": None, "sort_order": 7},

    # ── Combo Deals ──────────────────────────────────
    {"category": "Combo Deals", "name": "Chai + Bun Maska / Aloo Puff / Samosa", "description": "Your perfect chai-time companion. Pick your bite.", "price": 10.00, "tag": "bestseller", "sort_order": 1},
    {"category": "Combo Deals", "name": "Chai + Indori Poha / Tari Poha",        "description": "The ultimate morning ritual.",                      "price": 13.00, "tag": None,         "sort_order": 2},
    {"category": "Combo Deals", "name": "Signature Burger + Fries + Can Drink",  "description": "The complete meal deal.",                           "price": 19.90, "tag": "bestseller", "sort_order": 3},
    {"category": "Combo Deals", "name": "Pizza + Garlic Bread + Can Drink",      "description": "The full pizza experience.",                        "price": 19.90, "tag": None,         "sort_order": 4},
]

def seed():
    print(f"Seeding {len(menu_items)} menu items to Supabase...")

    # Clear existing items first
    supabase.table("menu_items").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    print("Cleared existing menu items.")

    # Insert all items
    response = supabase.table("menu_items").insert(menu_items).execute()
    print(f"✓ Inserted {len(response.data)} items successfully.")
    print("\nCategories seeded:")
    categories = sorted(set(i["category"] for i in menu_items))
    for cat in categories:
        count = sum(1 for i in menu_items if i["category"] == cat)
        print(f"  {cat}: {count} items")

if __name__ == "__main__":
    seed()