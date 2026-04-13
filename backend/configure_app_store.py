"""
App Store Connect API - Configure IAP Products for FahmIQ
Uses the .p8 key to authenticate and create subscription products.
"""
import jwt
import time
import requests
import json
import sys

# Apple credentials
KEY_ID = "GT5LJK6XLQ"
ISSUER_ID = "4c19f293-33c2-47d3-a911-766e694b8095"
PRIVATE_KEY_PATH = "/app/backend/AuthKey_GT5LJK6XLQ.p8"
APP_ID = "6761907571"  # Numeric Apple App ID

BASE_URL = "https://api.appstoreconnect.apple.com/v1"

def generate_token():
    """Generate JWT for App Store Connect API"""
    with open(PRIVATE_KEY_PATH, "r") as f:
        private_key = f.read()
    
    header = {
        "alg": "ES256",
        "kid": KEY_ID,
        "typ": "JWT"
    }
    
    payload = {
        "iss": ISSUER_ID,
        "iat": int(time.time()),
        "exp": int(time.time()) + 1200,  # 20 minutes
        "aud": "appstoreconnect-v1"
    }
    
    token = jwt.encode(payload, private_key, algorithm="ES256", headers=header)
    return token

def get_headers(token):
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

def get_app_info(token):
    """Get app information"""
    url = f"{BASE_URL}/apps/{APP_ID}"
    resp = requests.get(url, headers=get_headers(token))
    print(f"App Info: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"  App: {data['data']['attributes'].get('name', 'N/A')}")
        print(f"  Bundle ID: {data['data']['attributes'].get('bundleId', 'N/A')}")
    else:
        print(f"  Error: {resp.text[:500]}")
    return resp

def list_subscriptions(token):
    """List existing subscription groups"""
    url = f"{BASE_URL}/apps/{APP_ID}/subscriptionGroups"
    resp = requests.get(url, headers=get_headers(token))
    print(f"\nSubscription Groups: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        groups = data.get("data", [])
        if groups:
            for g in groups:
                print(f"  Group: {g['attributes'].get('referenceName', 'N/A')} (ID: {g['id']})")
        else:
            print("  No subscription groups found — will create them")
        return groups
    else:
        print(f"  Error: {resp.text[:500]}")
    return []

def create_subscription_group(token, name):
    """Create a subscription group"""
    url = f"{BASE_URL}/subscriptionGroups"
    payload = {
        "data": {
            "type": "subscriptionGroups",
            "attributes": {
                "referenceName": name
            },
            "relationships": {
                "app": {
                    "data": {
                        "type": "apps",
                        "id": APP_ID
                    }
                }
            }
        }
    }
    resp = requests.post(url, headers=get_headers(token), json=payload)
    print(f"\nCreate Subscription Group '{name}': {resp.status_code}")
    if resp.status_code in [200, 201]:
        data = resp.json()
        group_id = data["data"]["id"]
        print(f"  Created! Group ID: {group_id}")
        return group_id
    else:
        print(f"  Error: {resp.text[:500]}")
    return None

def create_subscription(token, group_id, product_id, name, duration):
    """Create a subscription within a group"""
    # Duration mapping for App Store Connect API
    duration_map = {
        "monthly": "ONE_MONTH",
        "yearly": "ONE_YEAR"
    }
    
    url = f"{BASE_URL}/subscriptions"
    payload = {
        "data": {
            "type": "subscriptions",
            "attributes": {
                "productId": product_id,
                "name": name,
                "familySharable": False,
                "subscriptionPeriod": duration_map.get(duration, "ONE_MONTH"),
                "reviewNote": f"FahmIQ {name} subscription provides access to on-device AI inference models.",
                "groupLevel": 1
            },
            "relationships": {
                "group": {
                    "data": {
                        "type": "subscriptionGroups",
                        "id": group_id
                    }
                }
            }
        }
    }
    resp = requests.post(url, headers=get_headers(token), json=payload)
    print(f"\nCreate Subscription '{name}' ({product_id}): {resp.status_code}")
    if resp.status_code in [200, 201]:
        data = resp.json()
        print(f"  Created! Subscription ID: {data['data']['id']}")
        return data["data"]["id"]
    else:
        error_text = resp.text[:500]
        print(f"  Error: {error_text}")
        # Check if already exists
        if "ENTITY_ERROR.ATTRIBUTE.INVALID.DUPLICATE" in error_text or "already exists" in error_text.lower():
            print("  (Product already exists - this is OK)")
    return None

def list_iap(token):
    """List existing in-app purchases"""
    url = f"{BASE_URL}/apps/{APP_ID}/inAppPurchasesV2"
    resp = requests.get(url, headers=get_headers(token))
    print(f"\nExisting IAPs: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        iaps = data.get("data", [])
        for iap in iaps:
            attrs = iap.get("attributes", {})
            print(f"  IAP: {attrs.get('productId', 'N/A')} - {attrs.get('name', 'N/A')} ({attrs.get('state', 'N/A')})")
        return iaps
    return []

def update_app_privacy(token):
    """Check/update app privacy info"""
    url = f"{BASE_URL}/apps/{APP_ID}/appInfos"
    resp = requests.get(url, headers=get_headers(token))
    print(f"\nApp Info Entries: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        for info in data.get("data", []):
            print(f"  State: {info['attributes'].get('appStoreState', 'N/A')}")
    return resp

def main():
    print("=" * 60)
    print("FahmIQ — App Store Connect API Configuration")
    print("=" * 60)
    
    # Generate token
    print("\nGenerating JWT token...")
    token = generate_token()
    print(f"  Token generated (expires in 20 min)")
    
    # Get app info
    get_app_info(token)
    
    # List existing subscriptions
    existing_groups = list_subscriptions(token)
    
    # List existing IAPs
    list_iap(token)
    
    # Create subscription group if none exists
    group_id = None
    if existing_groups:
        group_id = existing_groups[0]["id"]
        print(f"\nUsing existing subscription group: {group_id}")
    else:
        group_id = create_subscription_group(token, "FahmIQ Subscriptions")
    
    if group_id:
        # Create subscription products
        products = [
            ("com.seekconsultingltd.fahmiq.pro.monthly", "FahmIQ Pro Monthly", "monthly"),
            ("com.seekconsultingltd.fahmiq.pro.yearly", "FahmIQ Pro Yearly", "yearly"),
            ("com.seekconsultingltd.fahmiq.ultra.monthly", "FahmIQ Ultra Monthly", "monthly"),
            ("com.seekconsultingltd.fahmiq.ultra.yearly", "FahmIQ Ultra Yearly", "yearly"),
        ]
        
        for product_id, name, duration in products:
            create_subscription(token, group_id, product_id, name, duration)
    
    # Check app privacy
    update_app_privacy(token)
    
    print("\n" + "=" * 60)
    print("Configuration complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
