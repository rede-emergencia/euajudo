"""
Shared enums loaded from shared/enums.json (source of truth).
Both frontend and backend use this file.
"""
import json
import os
from enum import Enum

ENUMS_JSON_PATH = os.path.join(os.path.dirname(__file__), '..', 'shared', 'enums.json')

with open(ENUMS_JSON_PATH, 'r', encoding='utf-8') as f:
    ENUMS_DATA = json.load(f)

class OrderStatus(str, Enum):
    IDLE = ENUMS_DATA['OrderStatus']['IDLE']
    REQUESTING = ENUMS_DATA['OrderStatus']['REQUESTING']
    OFFERING = ENUMS_DATA['OrderStatus']['OFFERING']
    RESERVED = ENUMS_DATA['OrderStatus']['RESERVED']
    IN_PROGRESS = ENUMS_DATA['OrderStatus']['IN_PROGRESS']
    AWAITING_PICKUP = ENUMS_DATA['OrderStatus']['AWAITING_PICKUP']
    PICKED_UP = ENUMS_DATA['OrderStatus']['PICKED_UP']
    IN_TRANSIT = ENUMS_DATA['OrderStatus']['IN_TRANSIT']
    PENDING_CONFIRMATION = ENUMS_DATA['OrderStatus']['PENDING_CONFIRMATION']
    COMPLETED = ENUMS_DATA['OrderStatus']['COMPLETED']
    CANCELLED = ENUMS_DATA['OrderStatus']['CANCELLED']
    EXPIRED = ENUMS_DATA['OrderStatus']['EXPIRED']

class BatchStatus(str, Enum):
    PRODUCING = ENUMS_DATA['BatchStatus']['PRODUCING']
    READY = ENUMS_DATA['BatchStatus']['READY']
    IN_DELIVERY = ENUMS_DATA['BatchStatus']['IN_DELIVERY']
    COMPLETED = ENUMS_DATA['BatchStatus']['COMPLETED']
    CANCELLED = ENUMS_DATA['BatchStatus']['CANCELLED']
    EXPIRED = ENUMS_DATA['BatchStatus']['EXPIRED']

class DeliveryStatus(str, Enum):
    AVAILABLE = ENUMS_DATA['DeliveryStatus']['AVAILABLE']
    RESERVED = ENUMS_DATA['DeliveryStatus']['RESERVED']
    PICKED_UP = ENUMS_DATA['DeliveryStatus']['PICKED_UP']
    IN_TRANSIT = ENUMS_DATA['DeliveryStatus']['IN_TRANSIT']
    DELIVERED = ENUMS_DATA['DeliveryStatus']['DELIVERED']
    CANCELLED = ENUMS_DATA['DeliveryStatus']['CANCELLED']
    EXPIRED = ENUMS_DATA['DeliveryStatus']['EXPIRED']

class ProductType(str, Enum):
    MEAL = ENUMS_DATA['ProductType']['MEAL']
    INGREDIENT = ENUMS_DATA['ProductType']['INGREDIENT']
    CLOTHING = ENUMS_DATA['ProductType']['CLOTHING']
    MEDICINE = ENUMS_DATA['ProductType']['MEDICINE']
    HYGIENE = ENUMS_DATA['ProductType']['HYGIENE']
    CLEANING = ENUMS_DATA['ProductType']['CLEANING']
    SCHOOL_SUPPLIES = ENUMS_DATA['ProductType']['SCHOOL_SUPPLIES']
    BABY_ITEMS = ENUMS_DATA['ProductType']['BABY_ITEMS']
    PET_SUPPLIES = ENUMS_DATA['ProductType']['PET_SUPPLIES']
    GENERIC = ENUMS_DATA['ProductType']['GENERIC']

class UserRole(str, Enum):
    PROVIDER = ENUMS_DATA['UserRole']['PROVIDER']
    SHELTER = ENUMS_DATA['UserRole']['SHELTER']
    VOLUNTEER = ENUMS_DATA['UserRole']['VOLUNTEER']
    ADMIN = ENUMS_DATA['UserRole']['ADMIN']

class OrderType(str, Enum):
    DONATION = ENUMS_DATA['OrderType']['DONATION']
    REQUEST = ENUMS_DATA['OrderType']['REQUEST']
    PURCHASE = ENUMS_DATA['OrderType']['PURCHASE']
    LOAN = ENUMS_DATA['OrderType']['LOAN']

def display(enum_name: str, value: str) -> str:
    return ENUMS_DATA['displayNames'].get(enum_name, {}).get(value, value)

def color(enum_name: str, value: str) -> str:
    return ENUMS_DATA['colors'].get(enum_name, {}).get(value, 'bg-gray-100 text-gray-800')
