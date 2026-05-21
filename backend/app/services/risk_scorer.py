def compute_risk_score(
    cvss: float | None,
    is_exploited: bool,
    ai_score: float | None,
    patch_available: bool
) -> float:
    """
    Composite risk score (1.0–10.0) weighted across four signals:
      - CVSS Base Score              35%  (NVD)
      - Active exploitation status   25%  (CISA KEV)
      - AI business impact score     25%  (GROQ)
      - Patch unavailability         15%  (NVD / manual)
    """
    cvss_norm = (cvss or 5.0) / 10.0
    exploit_bonus = 1.0 if is_exploited else 0.0
    ai_norm = (ai_score or 5.0) / 10.0
    patch_reduction = 0.0 if patch_available else 1.0

    raw = (
        cvss_norm * 0.35 +
        exploit_bonus * 0.25 +
        ai_norm * 0.25 +
        patch_reduction * 0.15
    )
    return round(min(raw * 10, 10.0), 1)


def get_severity(score: float | None) -> str:
    """
    Map a composite risk score to a human-readable severity bucket.

    Buckets (from DOCUMENTATION.md §7):
      9.0 – 10.0  →  critical
      7.0 –  8.9  →  high
      4.0 –  6.9  →  medium
      1.0 –  3.9  →  low
    """
    if score is None:
        return "low"
    if score >= 9.0:
        return "critical"
    if score >= 7.0:
        return "high"
    if score >= 4.0:
        return "medium"
    return "low"
