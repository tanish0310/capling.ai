
#!/bin/bash

# Test script for Capling API system
# Run this in your terminal

echo "🧪 Testing Capling API System..."

# Test 1: Single Transaction
echo -e "\n1️⃣ Testing single transaction..."
curl -X POST http://localhost:3000/api/process-transaction \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "accountId": "test-account-456", 
    "merchant": "Test Coffee Shop",
    "amount": 4.50,
    "category": "dining",
    "description": "Morning coffee"
  }' | jq '.'

# Test 2: Fake Bank API
echo -e "\n2️⃣ Testing fake bank API..."
curl -X POST http://localhost:3000/api/fake-bank \
  -H "Content-Type: application/json" \
  -d '{
    "merchant": "Test Store",
    "amount": 25.99,
    "category": "shopping", 
    "description": "Test purchase",
    "accountNumber": "1234",
    "routingNumber": "123456789"
  }' | jq '.'

# Test 3: Transaction Simulation
echo -e "\n3️⃣ Testing transaction simulation..."
curl -X POST http://localhost:3000/api/simulate-transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "accountId": "test-account-456",
    "count": 3,
    "incomeLevel": "medium",
    "timeRange": "day"
  }' | jq '.'

echo -e "\n🎉 API testing complete!"