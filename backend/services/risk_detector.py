import re
from typing import Optional


def detect_risks(text: str, monthly_income: Optional[float] = None) -> dict:
    """
    Rule-based risk detection for financial documents.
    Returns risks list and a risk score.
    """
    risks = []
    risk_level = "Low"
    risk_points = 0

    text_lower = text.lower()

    # --- Interest Rate Detection ---
    interest_patterns = [
        r'(\d+\.?\d*)\s*%\s*(?:per\s*annum|p\.?a\.?|annual|interest|rate)',
        r'interest\s*(?:rate)?\s*(?:of|:|-|is)?\s*(\d+\.?\d*)\s*%',
        r'rate\s*of\s*interest\s*(?:of|:|-|is)?\s*(\d+\.?\d*)\s*%',
        r'(\d+\.?\d*)\s*%\s*(?:p\.?m\.?|per\s*month)',
    ]
    for pattern in interest_patterns:
        matches = re.findall(pattern, text_lower)
        for match in matches:
            try:
                rate = float(match)
                if rate > 15:
                    risks.append({
                        "type": "High Interest Rate",
                        "severity": "high",
                        "detail": f"Interest rate of {rate}% detected — above the 15% threshold. This is considered high and may lead to excessive repayment costs."
                    })
                    risk_points += 3
                elif rate > 10:
                    risks.append({
                        "type": "Moderate Interest Rate",
                        "severity": "medium",
                        "detail": f"Interest rate of {rate}% detected. While not extremely high, compare with other options."
                    })
                    risk_points += 1
            except ValueError:
                pass

    # --- Penalty & Fee Detection ---
    penalty_keywords = [
        "penalty", "late fee", "late payment", "prepayment penalty",
        "foreclosure charge", "processing fee", "hidden charge",
        "overdue", "default", "non-payment", "bounce charge",
        "penal interest", "additional charge", "service charge"
    ]
    found_penalties = []
    for keyword in penalty_keywords:
        if keyword in text_lower:
            found_penalties.append(keyword)
    
    if found_penalties:
        risks.append({
            "type": "Penalties & Hidden Charges",
            "severity": "high" if len(found_penalties) > 3 else "medium",
            "detail": f"Found references to: {', '.join(found_penalties)}. Review these carefully to understand all costs."
        })
        risk_points += min(len(found_penalties), 4)

    # --- EMI / Debt Ratio ---
    if monthly_income and monthly_income > 0:
        emi_patterns = [
            r'emi\s*(?:of|:|-|is|amount)?\s*(?:rs\.?|₹|inr)?\s*(\d[\d,]*\.?\d*)',
            r'(?:monthly|installment)\s*(?:payment|amount)?\s*(?:of|:|-|is)?\s*(?:rs\.?|₹|inr)?\s*(\d[\d,]*\.?\d*)',
        ]
        for pattern in emi_patterns:
            matches = re.findall(pattern, text_lower)
            for match in matches:
                try:
                    emi = float(match.replace(",", ""))
                    ratio = (emi / monthly_income) * 100
                    if ratio > 40:
                        risks.append({
                            "type": "Debt Risk",
                            "severity": "high",
                            "detail": f"EMI of ₹{emi:,.0f} is {ratio:.0f}% of your monthly income (₹{monthly_income:,.0f}). Experts recommend keeping EMIs below 40% of income."
                        })
                        risk_points += 3
                    elif ratio > 30:
                        risks.append({
                            "type": "Moderate Debt Burden",
                            "severity": "medium",
                            "detail": f"EMI of ₹{emi:,.0f} is {ratio:.0f}% of your monthly income. Consider reviewing your budget."
                        })
                        risk_points += 1
                except ValueError:
                    pass

    # --- Investment Risk Keywords ---
    investment_risk_keywords = [
        "market risk", "volatile", "no guaranteed returns",
        "subject to market", "capital loss", "high risk",
        "speculative", "not guaranteed"
    ]
    found_investment_risks = []
    for keyword in investment_risk_keywords:
        if keyword in text_lower:
            found_investment_risks.append(keyword)
    
    if found_investment_risks:
        risks.append({
            "type": "Investment Risk",
            "severity": "medium",
            "detail": f"Document mentions: {', '.join(found_investment_risks)}. Understand the risks before investing."
        })
        risk_points += 2

    # --- Insurance Exclusions ---
    exclusion_keywords = [
        "exclusion", "not covered", "waiting period",
        "pre-existing", "deductible", "co-pay", "sub-limit"
    ]
    found_exclusions = []
    for keyword in exclusion_keywords:
        if keyword in text_lower:
            found_exclusions.append(keyword)
    
    if found_exclusions:
        risks.append({
            "type": "Coverage Limitations",
            "severity": "medium",
            "detail": f"Document mentions: {', '.join(found_exclusions)}. Check what is NOT covered."
        })
        risk_points += 1

    # --- Calculate Risk Level ---
    if risk_points >= 5:
        risk_level = "High"
    elif risk_points >= 2:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # If no risks found, add a positive note
    if not risks:
        risks.append({
            "type": "No Major Risks Detected",
            "severity": "low",
            "detail": "No obvious risks were found in this document. Still, read all terms carefully before signing."
        })

    return {
        "risks": risks,
        "risk_score": risk_level,
        "risk_points": risk_points
    }
