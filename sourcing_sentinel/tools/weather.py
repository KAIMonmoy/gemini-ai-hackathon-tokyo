"""Severe-weather / port-logistics risk for supplier regions."""

from __future__ import annotations

import logging

from ..config import USE_STUBS

logger = logging.getLogger(__name__)

# Minimal region -> (lat, lon) map for supplier regions we expect to see.
_REGION_COORDS = {
    "Kagoshima": (31.56, 130.56),
    "Osaka": (34.69, 135.50),
    "Tokyo": (35.68, 139.69),
    "Shenzhen": (22.54, 114.06),
    "Nagoya": (35.18, 136.91),
    "Fukuoka": (33.59, 130.40),
}


def get_weather_logistics(regions: list[str]) -> dict:
    """Check severe weather / port-logistics risk for supplier regions.

    Args:
        regions: supplier regions to check, e.g. ["Kagoshima", "Osaka"].

    Returns:
        {"signals": [RiskSignal, ...]}
    """
    if USE_STUBS:
        logger.info("get_weather_logistics: USE_STUBS -> typhoon near Kagoshima")
        return {
            "signals": [
                {
                    "stream": "weather",
                    "affected": ["Kagoshima"],
                    "severity": 4,
                    "detail": "Typhoon expected to make landfall near Kagoshima in ~36h; shipping/port delays likely.",
                    "source": "stub",
                }
            ]
        }

    # --- Real path (Phase 3): Open-Meteo (free, no key) ------------------------
    import requests

    signals: list[dict] = []
    for region in regions:
        coords = _REGION_COORDS.get(region)
        if not coords:
            continue
        lat, lon = coords
        try:
            data = requests.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "daily": "wind_speed_10m_max,precipitation_sum",
                    "forecast_days": 3,
                    "timezone": "auto",
                },
                timeout=10,
            ).json()["daily"]
            max_wind = max(data["wind_speed_10m_max"])  # km/h
            max_rain = max(data["precipitation_sum"])  # mm
            if max_wind >= 60 or max_rain >= 80:
                severity = 4 if (max_wind >= 90 or max_rain >= 150) else 3
                signals.append(
                    {
                        "stream": "weather",
                        "affected": [region],
                        "severity": severity,
                        "detail": (
                            f"Severe weather near {region}: gusts up to {max_wind:.0f} km/h, "
                            f"rain up to {max_rain:.0f} mm in 3 days; possible logistics delays."
                        ),
                        "source": "https://open-meteo.com",
                    }
                )
        except Exception:  # safe fallback
            logger.exception("get_weather_logistics: lookup failed for %s", region)
    return {"signals": signals}
