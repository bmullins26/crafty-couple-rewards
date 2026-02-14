from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Admin PIN from environment (default: 1234)
ADMIN_PIN = os.environ.get('ADMIN_PIN', '1234')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============== Models ==============

class CustomerCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None

class CustomerResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    punches: int = 0
    total_spent: float = 0.0
    created_at: str

class TransactionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    customer_id: str
    customer_name: str
    amount: float
    punches_added: int
    reward_redeemed: Optional[str] = None
    discount_percent: Optional[int] = None
    created_at: str

class AddPunchRequest(BaseModel):
    customer_id: str
    amount: float

class RedeemRewardRequest(BaseModel):
    customer_id: str
    tier: int  # 10, 15, or 20 punches

class AdminLoginRequest(BaseModel):
    pin: str

class CustomerLookupRequest(BaseModel):
    identifier: str  # phone or email

# ============== Helper Functions ==============

def calculate_punches(amount: float) -> int:
    """Calculate punches: 1 punch per $10 spent"""
    return int(amount // 10)

def get_available_rewards(punches: int) -> list:
    """Get list of available rewards based on punch count"""
    rewards = []
    if punches >= 10:
        rewards.append({"tier": 10, "discount": 15, "label": "15% Off"})
    if punches >= 15:
        rewards.append({"tier": 15, "discount": 20, "label": "20% Off"})
    if punches >= 20:
        rewards.append({"tier": 20, "discount": 25, "label": "25% Off"})
    return rewards

def get_next_reward(punches: int) -> dict:
    """Get the next reward tier info"""
    if punches < 10:
        return {"tier": 10, "discount": 15, "punches_needed": 10 - punches}
    elif punches < 15:
        return {"tier": 15, "discount": 20, "punches_needed": 15 - punches}
    elif punches < 20:
        return {"tier": 20, "discount": 25, "punches_needed": 20 - punches}
    else:
        return {"tier": 20, "discount": 25, "punches_needed": 0, "max_reached": True}

# ============== Customer Routes ==============

@api_router.post("/customers/signup", response_model=dict)
async def signup_customer(customer: CustomerCreate):
    """Create a new customer account"""
    if not customer.phone and not customer.email:
        raise HTTPException(status_code=400, detail="Phone or email is required")
    
    # Check if customer already exists
    query = []
    if customer.phone:
        query.append({"phone": customer.phone})
    if customer.email:
        query.append({"email": customer.email.lower()})
    
    if query:
        existing = await db.customers.find_one({"$or": query}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Customer with this phone or email already exists")
    
    customer_doc = {
        "id": str(uuid.uuid4()),
        "name": customer.name,
        "phone": customer.phone,
        "email": customer.email.lower() if customer.email else None,
        "punches": 0,
        "total_spent": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.customers.insert_one(customer_doc)
    
    # Remove MongoDB _id before returning
    customer_doc.pop("_id", None)
    
    return {
        "customer": customer_doc,
        "available_rewards": get_available_rewards(0),
        "next_reward": get_next_reward(0)
    }

@api_router.post("/customers/lookup", response_model=dict)
async def lookup_customer(request: CustomerLookupRequest):
    """Find customer by phone or email"""
    identifier = request.identifier.strip().lower()
    
    # Try to find by phone or email
    customer = await db.customers.find_one(
        {"$or": [
            {"phone": identifier},
            {"phone": request.identifier.strip()},  # Keep original case for phone
            {"email": identifier}
        ]},
        {"_id": 0}
    )
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get transactions
    transactions = await db.transactions.find(
        {"customer_id": customer["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {
        "customer": customer,
        "transactions": transactions,
        "available_rewards": get_available_rewards(customer["punches"]),
        "next_reward": get_next_reward(customer["punches"])
    }

@api_router.get("/customers/{customer_id}", response_model=dict)
async def get_customer(customer_id: str):
    """Get customer details by ID"""
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    transactions = await db.transactions.find(
        {"customer_id": customer_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {
        "customer": customer,
        "transactions": transactions,
        "available_rewards": get_available_rewards(customer["punches"]),
        "next_reward": get_next_reward(customer["punches"])
    }

# ============== Admin Routes ==============

@api_router.post("/admin/login")
async def admin_login(request: AdminLoginRequest):
    """Verify admin PIN"""
    if request.pin == ADMIN_PIN:
        return {"success": True, "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid PIN")

@api_router.get("/admin/customers", response_model=List[dict])
async def list_all_customers():
    """Get all customers (admin only)"""
    customers = await db.customers.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Add reward info to each customer
    for customer in customers:
        customer["available_rewards"] = get_available_rewards(customer["punches"])
        customer["next_reward"] = get_next_reward(customer["punches"])
    
    return customers

@api_router.post("/admin/add-punch", response_model=dict)
async def add_punch(request: AddPunchRequest):
    """Add punches based on transaction amount"""
    customer = await db.customers.find_one({"id": request.customer_id}, {"_id": 0})
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    punches_to_add = calculate_punches(request.amount)
    
    if punches_to_add <= 0:
        raise HTTPException(status_code=400, detail="Amount must be at least $10 to earn punches")
    
    new_punches = customer["punches"] + punches_to_add
    new_total_spent = customer["total_spent"] + request.amount
    
    # Update customer
    await db.customers.update_one(
        {"id": request.customer_id},
        {"$set": {"punches": new_punches, "total_spent": new_total_spent}}
    )
    
    # Create transaction record
    transaction = {
        "id": str(uuid.uuid4()),
        "customer_id": request.customer_id,
        "customer_name": customer["name"],
        "amount": request.amount,
        "punches_added": punches_to_add,
        "reward_redeemed": None,
        "discount_percent": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.transactions.insert_one(transaction)
    transaction.pop("_id", None)
    
    # Get updated customer
    updated_customer = await db.customers.find_one({"id": request.customer_id}, {"_id": 0})
    
    return {
        "customer": updated_customer,
        "transaction": transaction,
        "punches_added": punches_to_add,
        "available_rewards": get_available_rewards(new_punches),
        "next_reward": get_next_reward(new_punches)
    }

@api_router.post("/admin/redeem-reward", response_model=dict)
async def redeem_reward(request: RedeemRewardRequest):
    """Redeem a reward for customer"""
    customer = await db.customers.find_one({"id": request.customer_id}, {"_id": 0})
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Validate tier
    tier_discounts = {10: 15, 15: 20, 20: 25}
    if request.tier not in tier_discounts:
        raise HTTPException(status_code=400, detail="Invalid reward tier")
    
    if customer["punches"] < request.tier:
        raise HTTPException(status_code=400, detail=f"Not enough punches. Need {request.tier}, have {customer['punches']}")
    
    discount = tier_discounts[request.tier]
    new_punches = customer["punches"] - request.tier
    
    # Update customer
    await db.customers.update_one(
        {"id": request.customer_id},
        {"$set": {"punches": new_punches}}
    )
    
    # Create transaction record
    transaction = {
        "id": str(uuid.uuid4()),
        "customer_id": request.customer_id,
        "customer_name": customer["name"],
        "amount": 0,
        "punches_added": -request.tier,
        "reward_redeemed": f"{discount}% Off",
        "discount_percent": discount,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.transactions.insert_one(transaction)
    transaction.pop("_id", None)
    
    # Get updated customer
    updated_customer = await db.customers.find_one({"id": request.customer_id}, {"_id": 0})
    
    return {
        "customer": updated_customer,
        "transaction": transaction,
        "reward_redeemed": f"{discount}% Off",
        "punches_used": request.tier,
        "available_rewards": get_available_rewards(new_punches),
        "next_reward": get_next_reward(new_punches)
    }

@api_router.get("/admin/transactions", response_model=List[dict])
async def get_all_transactions():
    """Get all transactions (admin only)"""
    transactions = await db.transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return transactions

# ============== Base Routes ==============

@api_router.get("/")
async def root():
    return {"message": "The Crafty Couple's Rewards API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
