import os
import httpx
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class INCOISService:
    """Service for fetching and validating ocean hazard data from INCOIS"""
    
    def __init__(self):
        self.api_url = os.getenv("INCOIS_API_URL", "https://incois.gov.in/api")
        self.api_key = os.getenv("INCOIS_API_KEY")
        self.enabled = bool(self.api_key)
        
        if not self.enabled:
            logger.warning("INCOIS API not configured. Using mock data for development.")
    
    async def fetch_active_alerts(self) -> List[Dict]:
        """
        Fetch active ocean hazard alerts from INCOIS
        
        Returns:
            List of alert dictionaries
        """
        if not self.enabled:
            # Return mock data for development
            return self._get_mock_alerts()
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/alerts",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    alerts = response.json()
                    logger.info(f"Fetched {len(alerts)} alerts from INCOIS")
                    return alerts
                else:
                    logger.error(f"INCOIS API error: {response.status_code}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error fetching INCOIS alerts: {str(e)}")
            return []
    
    async def validate_hazard(
        self, 
        hazard_type: str, 
        latitude: float, 
        longitude: float, 
        timestamp: datetime
    ) -> Dict:
        """
        Validate if a reported hazard correlates with INCOIS data
        
        Args:
            hazard_type: Type of hazard (tsunami, cyclone, high_tide)
            latitude: Latitude of report
            longitude: Longitude of report
            timestamp: Time of report
            
        Returns:
            Dict with validation results:
            - validated: bool
            - correlation: str (description of match)
            - matching_alerts: List[Dict]
        """
        alerts = await self.fetch_active_alerts()
        
        matching_alerts = []
        
        for alert in alerts:
            # Check hazard type match
            if alert.get('alert_type') != hazard_type:
                continue
            
            # Check location proximity (within 50km)
            alert_lat = alert.get('latitude')
            alert_lon = alert.get('longitude')
            
            if alert_lat and alert_lon:
                distance = self._calculate_distance(
                    latitude, longitude, alert_lat, alert_lon
                )
                
                if distance <= alert.get('radius_km', 50):
                    # Check time proximity (within 24 hours)
                    alert_time = datetime.fromisoformat(alert.get('issued_at'))
                    time_diff = abs((timestamp - alert_time).total_seconds() / 3600)
                    
                    if time_diff <= 24:
                        matching_alerts.append({
                            'alert_id': alert.get('id'),
                            'title': alert.get('title'),
                            'distance_km': round(distance, 2),
                            'time_diff_hours': round(time_diff, 2)
                        })
        
        validated = len(matching_alerts) > 0
        
        if validated:
            correlation = f"Matches {len(matching_alerts)} INCOIS alert(s). "
            correlation += f"Closest: {matching_alerts[0]['title']} "
            correlation += f"({matching_alerts[0]['distance_km']}km away)"
        else:
            correlation = "No matching INCOIS alerts found in vicinity"
        
        return {
            'validated': validated,
            'correlation': correlation,
            'matching_alerts': matching_alerts
        }
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two coordinates using Haversine formula
        
        Returns:
            Distance in kilometers
        """
        from math import radians, sin, cos, sqrt, atan2
        
        R = 6371  # Earth's radius in km
        
        lat1_rad = radians(lat1)
        lat2_rad = radians(lat2)
        delta_lat = radians(lat2 - lat1)
        delta_lon = radians(lon2 - lon1)
        
        a = sin(delta_lat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        distance = R * c
        return distance
    
    def _get_mock_alerts(self) -> List[Dict]:
        """Return mock INCOIS alerts for development"""
        now = datetime.utcnow()
        
        return [
            {
                'id': 1,
                'alert_type': 'cyclone',
                'severity': 'high',
                'title': 'Cyclone Warning - Bay of Bengal',
                'description': 'Severe cyclonic storm expected in coastal areas',
                'latitude': 13.0827,
                'longitude': 80.2707,
                'affected_area': 'Chennai Coast',
                'radius_km': 100.0,
                'issued_at': (now - timedelta(hours=2)).isoformat(),
                'valid_until': (now + timedelta(hours=22)).isoformat(),
                'source': 'INCOIS',
                'active': True
            },
            {
                'id': 2,
                'alert_type': 'high_tide',
                'severity': 'medium',
                'title': 'High Tide Alert - Mumbai Coast',
                'description': 'Abnormally high tides expected',
                'latitude': 18.9388,
                'longitude': 72.8354,
                'affected_area': 'Mumbai Coastal Areas',
                'radius_km': 50.0,
                'issued_at': (now - timedelta(hours=1)).isoformat(),
                'valid_until': (now + timedelta(hours=11)).isoformat(),
                'source': 'INCOIS',
                'active': True
            }
        ]


# Singleton instance
incois_service = INCOISService()
