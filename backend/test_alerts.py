
import requests
import json
import sys

BASE_URL = "http://localhost:8000/api"

def test_create_alert():
    print("Testing Create Alert...")
    payload = {
        "location_name": "Test Beach",
        "hazard_type": "high_tide"
    }
    try:
        response = requests.post(f"{BASE_URL}/admin/safety-alerts", json=payload)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("Response:", response.json())
            return response.json()['id']
        else:
            print("Error:", response.text)
            return None
    except Exception as e:
        print(f"Exception: {e}")
        return None

def test_get_alerts():
    print("\nTesting Get Alerts...")
    try:
        response = requests.get(f"{BASE_URL}/safety-alerts")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            alerts = response.json()
            print(f"Found {len(alerts)} alerts")
            print(alerts)
        else:
            print("Error:", response.text)
    except Exception as e:
        print(f"Exception: {e}")

def test_deactivate_alert(alert_id):
    if not alert_id:
        print("\nSkipping Deactivate (No ID)")
        return

    print(f"\nTesting Deactivate Alert {alert_id}...")
    try:
        response = requests.put(f"{BASE_URL}/admin/safety-alerts/{alert_id}/deactivate")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("Response:", response.json())
        else:
            print("Error:", response.text)
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    alert_id = test_create_alert()
    test_get_alerts()
    # test_deactivate_alert(alert_id) # Optional: comment out to leave it active for frontend testing
