#!/usr/bin/env python3
"""
Test script to verify distribution functionality
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def login():
    """Login as shelter user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", 
                           data={  # Use form data, not JSON
        "username": "test.shelter@example.com",
        "password": "test123"
    })
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        return None
    
    token = response.json()["access_token"]
    print("✅ Login successful")
    return token

def get_dashboard(token):
    """Get current dashboard data"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/inventory/dashboard", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Get dashboard failed: {response.status_code} - {response.text}")
        return None
    
    data = response.json()
    print(f"✅ Dashboard loaded")
    return data

def distribute_items(token, category_id, quantity):
    """Test distribution"""
    headers = {"Authorization": f"Bearer {token}"}
    
    distribution_data = {
        "category_id": category_id,
        "quantity": quantity,
        "recipient_name": "Test Beneficiary",
        "recipient_document": "12345678900",
        "notes": "Test distribution"
    }
    
    print(f"\n📦 Testing distribution:")
    print(f"   Category ID: {category_id}")
    print(f"   Quantity: {quantity}")
    
    response = requests.post(f"{BASE_URL}/api/inventory/distribute", 
                           headers=headers, 
                           json=distribution_data)
    
    if response.status_code != 200:
        print(f"❌ Distribution failed: {response.status_code} - {response.text}")
        return None
    
    result = response.json()
    print(f"✅ Distribution successful:")
    print(f"   Distribution ID: {result['id']}")
    print(f"   Quantity distributed: {result['quantity']}")
    return result

def create_inventory_item(token, category_id, quantity):
    """Create inventory item for testing"""
    headers = {"Authorization": f"Bearer {token}"}
    
    item_data = {
        "category_id": category_id,
        "quantity_in_stock": quantity,
        "min_threshold": 5
    }
    
    response = requests.post(f"{BASE_URL}/api/inventory/items", 
                           headers=headers, 
                           json=item_data)
    
    if response.status_code != 200:
        print(f"❌ Create inventory failed: {response.status_code} - {response.text}")
        return None
    
    result = response.json()
    print(f"✅ Inventory item created:")
    print(f"   Category ID: {result['category_id']}")
    print(f"   Quantity: {result['quantity_in_stock']}")
    return result

def get_categories(token):
    """Get available categories"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/categories/", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Get categories failed: {response.status_code} - {response.text}")
        return []
    
    return response.json()

def main():
    print("🧪 Testing Distribution Flow\n")
    
    # Login
    token = login()
    if not token:
        return
    
    # Get initial dashboard
    print("\n📊 Getting initial dashboard...")
    initial_data = get_dashboard(token)
    if not initial_data:
        return
    
    # Show inventory
    print("\n📦 Current Inventory:")
    for item in initial_data["inventory_by_category"]:
        print(f"   {item['category_name']}: {item['quantity_in_stock']} (available: {item['quantity_available']})")
    
    # If no inventory, create some
    if not initial_data["inventory_by_category"]:
        print("\n📝 No inventory found. Creating inventory items...")
        
        # Get categories
        categories = get_categories(token)
        if not categories:
            print("❌ Could not get categories")
            return
        
        # Create inventory for first 3 categories
        for i, cat in enumerate(categories[:3]):
            print(f"\n   Creating inventory for {cat['display_name']}...")
            item = create_inventory_item(token, cat['id'], 20)
            if not item:
                continue
        
        # Refresh dashboard
        print("\n📊 Refreshing dashboard...")
        initial_data = get_dashboard(token)
        if not initial_data:
            return
        
        print("\n📦 Updated Inventory:")
        for item in initial_data["inventory_by_category"]:
            print(f"   {item['category_name']}: {item['quantity_in_stock']} (available: {item['quantity_available']})")
    
    # Find a category with stock
    if not initial_data["inventory_by_category"]:
        print("❌ No inventory items found")
        return
    
    first_item = initial_data["inventory_by_category"][0]
    category_id = first_item["category_id"]
    category_name = first_item["category_name"]
    available_stock = first_item["quantity_available"]
    
    if available_stock <= 0:
        print(f"❌ No available stock for {category_name}")
        return
    
    # Distribute some items
    distribute_quantity = min(5, available_stock)
    distribution = distribute_items(token, category_id, distribute_quantity)
    if not distribution:
        return
    
    # Get updated dashboard
    print("\n📊 Getting updated dashboard...")
    updated_data = get_dashboard(token)
    if not updated_data:
        return
    
    # Find the updated item
    updated_item = None
    for item in updated_data["inventory_by_category"]:
        if item["category_id"] == category_id:
            updated_item = item
            break
    
    if not updated_item:
        print(f"❌ Could not find updated item for category {category_id}")
        return
    
    # Verify stock decreased
    stock_before = first_item["quantity_in_stock"]
    stock_after = updated_item["quantity_in_stock"]
    available_before = first_item["quantity_available"]
    available_after = updated_item["quantity_available"]
    
    print(f"\n📈 Stock Changes for {category_name}:")
    print(f"   Stock before: {stock_before}")
    print(f"   Stock after: {stock_after}")
    print(f"   Stock decrease: {stock_before - stock_after}")
    print(f"   Available before: {available_before}")
    print(f"   Available after: {available_after}")
    print(f"   Available decrease: {available_before - available_after}")
    
    # Verify the decrease matches distributed quantity
    expected_decrease = distribute_quantity
    actual_decrease = stock_before - stock_after
    
    if actual_decrease == expected_decrease:
        print(f"\n✅ SUCCESS: Stock decreased correctly by {actual_decrease} units")
    else:
        print(f"\n❌ ERROR: Expected decrease of {expected_decrease}, got {actual_decrease}")
    
    # Check recent transactions
    print(f"\n📋 Recent Transactions:")
    for txn in updated_data["recent_transactions"][:3]:
        print(f"   {txn['transaction_type']}: {txn.get('quantity_change', 'N/A')} {txn['category_name']} - {txn.get('notes', 'No notes')}")

if __name__ == "__main__":
    main()
