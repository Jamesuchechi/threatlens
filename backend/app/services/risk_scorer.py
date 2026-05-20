def compute_risk_score(
    cvss: float | None,
    is_exploited: bool,
    ai_score: float | None,
    patch_available: bool
) -> float:
    # Normalize CVSS score (default to 5.0 if not available)
    cvss_norm = (cvss or 5.0) / 10.0
    
    # Active exploitation bonus (1.0 if exploited, 0.0 otherwise)
    exploit_bonus = 1.0 if is_exploited else 0.0
    
    # Normalize AI score (default to 5.0 if not available)
    ai_norm = (ai_score or 5.0) / 10.0
    
    # Patch reduction (1.0 if no patch available, 0.0 if patch exists)
    patch_reduction = 0.0 if patch_available else 1.0

    raw = (
        cvss_norm * 0.35 +
        exploit_bonus * 0.25 +
        ai_norm * 0.25 +
        patch_reduction * 0.15
    )
    return round(min(raw * 10, 10.0), 1)
