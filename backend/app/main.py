"""
EuAjudo API - Generic Event-Driven Order System
Version 2.0 - Refactored with generic models
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import (
    auth,
    users,
    batches,
    deliveries,
    resources,
    locations,
    admin,
    product_config,
    dashboard,
    cancel
)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EuAjudo - Generic Order Management System",
    description="""Event-driven API for managing donations, deliveries, and orders of any product type.
    
## Features
- **Authentication**: JWT-based auth with role-based access
- **Product Batches**: Create and manage meal batches, ingredient requests
- **Deliveries**: Volunteer-driven delivery system with confirmation codes
- **Resource Management**: Request and reserve ingredients
- **Location Management**: Manage delivery locations (shelters, providers)
- **Admin Panel**: User approval and system management

## Quick Start
1. Register as provider/volunteer/shelter at `/api/auth/register`
2. Login at `/api/auth/login` to get JWT token
3. Use token in Authorization header: `Bearer <token>`
4. Create batches, deliveries, or resource requests

## Roles
- **provider**: Creates meal batches and ingredient requests
- **volunteer**: Delivers meals and provides ingredients
- **shelter**: Receives meals and requests ingredients
- **admin**: Manages users and system
    """,
    version="2.0.0",
    contact={
        "name": "EuAjudo API Support",
        "email": "dev@euajudo.com"
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
    }
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(batches.router)
app.include_router(deliveries.router)
app.include_router(resources.router)
app.include_router(locations.router)
app.include_router(admin.router)
app.include_router(product_config.router)
app.include_router(dashboard.router)
app.include_router(cancel.router)

@app.get("/")
def root():
    return {
        "message": "EuAjudo API - Sistema de Gestão Solidária",
        "version": "2.0.0",
        "features": [
            "Generic product batches (meals, ingredients, etc.)",
            "Event-driven delivery system",
            "Volunteer-based distribution",
            "Multi-product support"
        ],
        "docs": "/docs"
    }

@app.get("/api/docs/examples")
def api_examples():
    """API usage examples for frontend developers"""
    return {
        "authentication": {
            "register": {
                "url": "/api/auth/register",
                "method": "POST",
                "body": {
                    "email": "provider@example.com",
                    "name": "Restaurante Bom Sabor",
                    "phone": "32988881234",
                    "roles": "provider",
                    "password": "mypassword123",
                    "address": "Av Rio Branco, 100 - Centro",
                    "production_capacity": 100
                }
            },
            "login": {
                "url": "/api/auth/login",
                "method": "POST",
                "body": {
                    "username": "provider@example.com",
                    "password": "mypassword123"
                }
            }
        },
        "batches": {
            "create_meal_batch": {
                "url": "/api/batches/",
                "method": "POST",
                "headers": {"Authorization": "Bearer <token>"},
                "body": {
                    "product_type": "meal",
                    "quantity": 50,
                    "description": "Vegetarian pasta with tomato sauce",
                    "donated_ingredients": True,
                    "pickup_deadline": "2024-12-31T18:00:00"
                }
            },
            "mark_ready": {
                "url": "/api/batches/{batch_id}/mark-ready",
                "method": "POST",
                "headers": {"Authorization": "Bearer <token>"}
            }
        },
        "deliveries": {
            "create": {
                "url": "/api/deliveries/",
                "method": "POST",
                "headers": {"Authorization": "Bearer <token>"},
                "body": {
                    "batch_id": 1,
                    "location_id": 1,
                    "quantity": 25
                }
            }
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "2.0.0"}

@app.get("/api/product-types")
def list_product_types():
    """List supported product types"""
    from app.enums import ProductType
    return {
        "product_types": [pt.value for pt in ProductType]
    }

@app.get("/api/status-types")
def list_status_types():
    """List available status types"""
    from app.enums import OrderStatus, DeliveryStatus, BatchStatus
    return {
        "order_status": [s.value for s in OrderStatus],
        "delivery_status": [s.value for s in DeliveryStatus],
        "batch_status": [s.value for s in BatchStatus]
    }
