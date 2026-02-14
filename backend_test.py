#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import os
from pathlib import Path

# Get the backend URL from frontend env file
frontend_env_path = Path("/app/frontend/.env")
BACKEND_URL = None

if frontend_env_path.exists():
    with open(frontend_env_path, "r") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL"):
                BACKEND_URL = line.split("=", 1)[1].strip()
                break

if not BACKEND_URL:
    print("❌ Could not find REACT_APP_BACKEND_URL in frontend/.env")
    sys.exit(1)

API_BASE = f"{BACKEND_URL}/api"

class RewardsAPITester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.test_customer_id = None
        self.admin_authenticated = False

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        status = "✅" if success else "❌"
        print(f"{status} {name}")
        if details:
            print(f"   {details}")
        if success:
            self.tests_passed += 1

    def test_api_endpoint(self, method, endpoint, expected_status, data=None, headers=None):
        """Test a single API endpoint"""
        url = f"{API_BASE}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, {"raw_response": response.text}
            else:
                error_detail = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_json = response.json()
                    if 'detail' in error_json:
                        error_detail += f" - {error_json['detail']}"
                except:
                    pass
                return False, {"error": error_detail, "status": response.status_code}

        except Exception as e:
            return False, {"error": str(e)}

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Test root endpoint
        success, response = self.test_api_endpoint('GET', '', 200)
        self.log_test("API Root Endpoint", success, 
                     response.get('message', '') if success else response.get('error', ''))
        
        # Test health check
        success, response = self.test_api_endpoint('GET', 'health', 200)
        self.log_test("Health Check Endpoint", success,
                     response.get('status', '') if success else response.get('error', ''))

    def test_customer_signup(self):
        """Test customer signup functionality"""
        print("\n🔍 Testing Customer Signup...")
        
        # Test successful signup with phone
        test_data = {
            "name": "Test Customer",
            "phone": "555-123-4567",
            "email": None
        }
        
        success, response = self.test_api_endpoint('POST', 'customers/signup', 200, test_data)
        if success and 'customer' in response:
            self.test_customer_id = response['customer']['id']
            self.log_test("Customer Signup (Phone Only)", True, f"ID: {self.test_customer_id}")
        else:
            self.log_test("Customer Signup (Phone Only)", False, response.get('error', ''))
        
        # Test signup with email
        test_data = {
            "name": "Test Email Customer", 
            "phone": None,
            "email": "test@example.com"
        }
        
        success, response = self.test_api_endpoint('POST', 'customers/signup', 200, test_data)
        self.log_test("Customer Signup (Email Only)", success, 
                     f"ID: {response['customer']['id']}" if success and 'customer' in response else response.get('error', ''))
        
        # Test validation - no phone or email
        test_data = {
            "name": "Invalid Customer",
            "phone": None,
            "email": None
        }
        
        success, response = self.test_api_endpoint('POST', 'customers/signup', 400, test_data)
        self.log_test("Customer Signup Validation (No Contact)", success, 
                     "Correctly rejected" if success else response.get('error', ''))
        
        # Test duplicate signup (should fail)
        test_data = {
            "name": "Duplicate Customer",
            "phone": "555-123-4567",  # Same phone as first customer
            "email": None
        }
        
        success, response = self.test_api_endpoint('POST', 'customers/signup', 400, test_data)
        self.log_test("Customer Signup (Duplicate Detection)", success,
                     "Correctly rejected duplicate" if success else response.get('error', ''))

    def test_customer_lookup(self):
        """Test customer lookup functionality"""
        print("\n🔍 Testing Customer Lookup...")
        
        if not self.test_customer_id:
            print("⚠️  Skipping lookup tests - no test customer created")
            return
        
        # Test lookup by phone
        lookup_data = {"identifier": "555-123-4567"}
        success, response = self.test_api_endpoint('POST', 'customers/lookup', 200, lookup_data)
        self.log_test("Customer Lookup (By Phone)", success,
                     f"Found: {response['customer']['name']}" if success and 'customer' in response else response.get('error', ''))
        
        # Test lookup by email
        lookup_data = {"identifier": "test@example.com"}
        success, response = self.test_api_endpoint('POST', 'customers/lookup', 200, lookup_data)
        self.log_test("Customer Lookup (By Email)", success,
                     f"Found: {response['customer']['name']}" if success and 'customer' in response else response.get('error', ''))
        
        # Test lookup - not found
        lookup_data = {"identifier": "nonexistent@example.com"}
        success, response = self.test_api_endpoint('POST', 'customers/lookup', 404, lookup_data)
        self.log_test("Customer Lookup (Not Found)", success,
                     "Correctly returned 404" if success else response.get('error', ''))

    def test_customer_get_by_id(self):
        """Test get customer by ID"""
        print("\n🔍 Testing Get Customer By ID...")
        
        if not self.test_customer_id:
            print("⚠️  Skipping get by ID tests - no test customer created")
            return
        
        # Test valid ID
        success, response = self.test_api_endpoint('GET', f'customers/{self.test_customer_id}', 200)
        self.log_test("Get Customer By ID (Valid)", success,
                     f"Customer: {response['customer']['name']}" if success and 'customer' in response else response.get('error', ''))
        
        # Test invalid ID
        success, response = self.test_api_endpoint('GET', 'customers/invalid-id', 404)
        self.log_test("Get Customer By ID (Invalid)", success,
                     "Correctly returned 404" if success else response.get('error', ''))

    def test_admin_login(self):
        """Test admin login functionality"""
        print("\n🔍 Testing Admin Login...")
        
        # Test correct PIN
        pin_data = {"pin": "1234"}
        success, response = self.test_api_endpoint('POST', 'admin/login', 200, pin_data)
        if success:
            self.admin_authenticated = True
        self.log_test("Admin Login (Correct PIN)", success,
                     response.get('message', '') if success else response.get('error', ''))
        
        # Test incorrect PIN
        pin_data = {"pin": "0000"}
        success, response = self.test_api_endpoint('POST', 'admin/login', 401, pin_data)
        self.log_test("Admin Login (Incorrect PIN)", success,
                     "Correctly rejected" if success else response.get('error', ''))

    def test_admin_get_customers(self):
        """Test admin get all customers"""
        print("\n🔍 Testing Admin Get All Customers...")
        
        if not self.admin_authenticated:
            print("⚠️  Skipping admin tests - not authenticated")
            return
        
        success, response = self.test_api_endpoint('GET', 'admin/customers', 200)
        customer_count = len(response) if success and isinstance(response, list) else 0
        self.log_test("Admin Get All Customers", success,
                     f"Retrieved {customer_count} customers" if success else response.get('error', ''))

    def test_admin_add_punch(self):
        """Test admin add punch functionality"""
        print("\n🔍 Testing Admin Add Punch...")
        
        if not self.admin_authenticated or not self.test_customer_id:
            print("⚠️  Skipping add punch tests - requirements not met")
            return
        
        # Test valid transaction ($25 should give 2 punches)
        punch_data = {
            "customer_id": self.test_customer_id,
            "amount": 25.00
        }
        success, response = self.test_api_endpoint('POST', 'admin/add-punch', 200, punch_data)
        punches_added = response.get('punches_added', 0) if success else 0
        self.log_test("Admin Add Punch (Valid Transaction)", success,
                     f"Added {punches_added} punches for $25" if success else response.get('error', ''))
        
        # Test insufficient amount ($5 should fail)
        punch_data = {
            "customer_id": self.test_customer_id,
            "amount": 5.00
        }
        success, response = self.test_api_endpoint('POST', 'admin/add-punch', 400, punch_data)
        self.log_test("Admin Add Punch (Insufficient Amount)", success,
                     "Correctly rejected $5 transaction" if success else response.get('error', ''))
        
        # Test invalid customer ID
        punch_data = {
            "customer_id": "invalid-customer-id",
            "amount": 20.00
        }
        success, response = self.test_api_endpoint('POST', 'admin/add-punch', 404, punch_data)
        self.log_test("Admin Add Punch (Invalid Customer)", success,
                     "Correctly rejected invalid customer" if success else response.get('error', ''))

    def test_admin_redeem_reward(self):
        """Test admin redeem reward functionality"""
        print("\n🔍 Testing Admin Redeem Reward...")
        
        if not self.admin_authenticated or not self.test_customer_id:
            print("⚠️  Skipping redeem reward tests - requirements not met")
            return
        
        # First add enough punches to test redemption (100 punches = $1000)
        punch_data = {
            "customer_id": self.test_customer_id,
            "amount": 1000.00
        }
        setup_success, setup_response = self.test_api_endpoint('POST', 'admin/add-punch', 200, punch_data)
        
        if not setup_success:
            print("⚠️  Could not setup customer for redemption tests")
            return
        
        # Test valid redemption (10 punches = 15% off)
        redeem_data = {
            "customer_id": self.test_customer_id,
            "tier": 10
        }
        success, response = self.test_api_endpoint('POST', 'admin/redeem-reward', 200, redeem_data)
        reward = response.get('reward_redeemed', '') if success else ''
        self.log_test("Admin Redeem Reward (10 punches)", success,
                     f"Redeemed: {reward}" if success else response.get('error', ''))
        
        # Test invalid tier
        redeem_data = {
            "customer_id": self.test_customer_id,
            "tier": 5  # Invalid tier
        }
        success, response = self.test_api_endpoint('POST', 'admin/redeem-reward', 400, redeem_data)
        self.log_test("Admin Redeem Reward (Invalid Tier)", success,
                     "Correctly rejected invalid tier" if success else response.get('error', ''))

    def test_admin_transactions(self):
        """Test admin get all transactions"""
        print("\n🔍 Testing Admin Get All Transactions...")
        
        if not self.admin_authenticated:
            print("⚠️  Skipping transaction tests - not authenticated")
            return
        
        success, response = self.test_api_endpoint('GET', 'admin/transactions', 200)
        transaction_count = len(response) if success and isinstance(response, list) else 0
        self.log_test("Admin Get All Transactions", success,
                     f"Retrieved {transaction_count} transactions" if success else response.get('error', ''))

    def run_all_tests(self):
        """Run all API tests"""
        print(f"🚀 Starting API Tests for: {API_BASE}")
        print("=" * 60)
        
        # Run test suites in logical order
        self.test_health_endpoints()
        self.test_customer_signup()
        self.test_customer_lookup()
        self.test_customer_get_by_id()
        self.test_admin_login()
        self.test_admin_get_customers()
        self.test_admin_add_punch()
        self.test_admin_redeem_reward()
        self.test_admin_transactions()
        
        # Print final results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    """Main test runner"""
    tester = RewardsAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())