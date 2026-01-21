#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class EquipDetailAPITester:
    def __init__(self, base_url="https://char-customizer-7.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = f"test-user-{datetime.now().strftime('%H%M%S')}"
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        if headers is None:
            headers = {'Content-Type': 'application/json'}
            
        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                self.log(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test /api/ root endpoint"""
        success, response = self.run_test(
            "API Root",
            "GET", 
            "",
            200
        )
        if success and isinstance(response, dict) and "message" in response:
            self.log(f"   Root message: {response['message']}")
            return True
        return False

    def test_profile_upsert(self):
        """Test profile creation/update"""
        success, response = self.run_test(
            "Profile Upsert",
            "POST",
            "profile/upsert",
            200,
            data={
                "discord_user_id": self.test_user_id,
                "username": "TestPilot",
                "avatar": None
            }
        )
        if success and isinstance(response, dict) and response.get("ok"):
            self.log(f"   Profile upserted successfully")
            return True
        return False

    def test_profile_fetch(self):
        """Test profile retrieval"""
        success, response = self.run_test(
            "Profile Fetch",
            "GET",
            f"profile/{self.test_user_id}",
            200
        )
        if success and isinstance(response, dict):
            # Check required fields
            required_fields = ["discord_user_id", "username", "base_stats", "inventory", "equipped"]
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                self.log(f"   Missing fields: {missing_fields}")
                return False
            
            # Check inventory seeding
            inventory = response.get("inventory", [])
            if len(inventory) == 0:
                self.log(f"   Warning: No inventory items seeded")
                return False
                
            self.log(f"   Profile loaded: {len(inventory)} items, base stats: {response['base_stats']}")
            return True
        return False

    def test_equip_item(self):
        """Test equipping an item"""
        # First get profile to find an item
        success, profile = self.run_test(
            "Get Profile for Equip Test",
            "GET",
            f"profile/{self.test_user_id}",
            200
        )
        
        if not success or not isinstance(profile, dict):
            return False
            
        inventory = profile.get("inventory", [])
        if not inventory:
            self.log(f"   No inventory items to equip")
            return False
            
        # Find first head item
        head_item = next((item for item in inventory if item["slot"] == "head"), None)
        if not head_item:
            self.log(f"   No head items found in inventory")
            return False
            
        # Equip the item
        success, response = self.run_test(
            "Equip Item",
            "PUT",
            f"profile/{self.test_user_id}/equipped",
            200,
            data={
                "slot": "head",
                "item_id": head_item["item_id"]
            }
        )
        
        if success and isinstance(response, dict):
            equipped = response.get("equipped", {})
            if equipped.get("head") == head_item["item_id"]:
                self.log(f"   Successfully equipped {head_item['name']} to head slot")
                return True
            else:
                self.log(f"   Equip failed: head slot is {equipped.get('head')}, expected {head_item['item_id']}")
        return False

    def test_auto_equip(self):
        """Test auto-equip functionality"""
        success, response = self.run_test(
            "Auto-Equip",
            "PUT",
            f"profile/{self.test_user_id}/auto-equip",
            200
        )
        
        if success and isinstance(response, dict):
            equipped = response.get("equipped", {})
            equipped_count = sum(1 for v in equipped.values() if v is not None)
            self.log(f"   Auto-equipped {equipped_count} items")
            return equipped_count > 0
        return False

    def test_unequip_all(self):
        """Test unequip all functionality"""
        success, response = self.run_test(
            "Unequip All",
            "PUT",
            f"profile/{self.test_user_id}/unequip-all",
            200
        )
        
        if success and isinstance(response, dict):
            equipped = response.get("equipped", {})
            equipped_count = sum(1 for v in equipped.values() if v is not None)
            if equipped_count == 0:
                self.log(f"   Successfully unequipped all items")
                return True
            else:
                self.log(f"   Unequip failed: {equipped_count} items still equipped")
        return False

    def test_verify_endpoint(self):
        """Test /api/verify endpoint"""
        success, response = self.run_test(
            "Verify Endpoint",
            "GET",
            "verify",
            200
        )
        if success and isinstance(response, dict) and response.get("ok"):
            self.log(f"   Verify endpoint working")
            return True
        return False

    def test_interactions_endpoint(self):
        """Test /api/interactions endpoint with PING"""
        success, response = self.run_test(
            "Interactions PING",
            "POST",
            "interactions",
            200,
            data={"type": 1}  # PING type
        )
        if success and isinstance(response, dict) and response.get("type") == 1:
            self.log(f"   Interactions endpoint responds to PING correctly")
            return True
        return False

    def run_all_tests(self):
        """Run all backend tests"""
        self.log("🚀 Starting Discord Activity Equip Detail Backend Tests")
        self.log(f"   Base URL: {self.base_url}")
        self.log(f"   Test User ID: {self.test_user_id}")
        
        tests = [
            self.test_root_endpoint,
            self.test_profile_upsert,
            self.test_profile_fetch,
            self.test_equip_item,
            self.test_auto_equip,
            self.test_unequip_all,
            self.test_verify_endpoint,
            self.test_interactions_endpoint,
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log(f"❌ {test.__name__} - Exception: {str(e)}")
        
        self.log(f"\n📊 Backend Tests Summary: {self.tests_passed}/{self.tests_run} passed")
        return self.tests_passed == self.tests_run

def main():
    tester = EquipDetailAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())