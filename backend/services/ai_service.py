import os
import re
import json
from typing import Optional
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
USE_MOCK = not OPENAI_API_KEY or OPENAI_API_KEY == "your-api-key-here"

if not USE_MOCK:
    client = OpenAI(
        api_key=OPENAI_API_KEY,
        base_url="https://api.groq.com/openai/v1"
    )
else:
    client = None
    print("⚠️  No OpenAI API key found. Running in DEMO MODE with smart document analysis.")


ANALYSIS_PROMPT = """You are a financial document analyst. Analyze the following financial document text and provide a clear, helpful analysis for a regular person (not a finance expert).

DOCUMENT TEXT:
{document_text}

USER CONTEXT:
- Monthly Income: {income}
- Financial Goal: {goal}

Please provide your analysis in the following JSON format (return ONLY valid JSON, no markdown):
{{
  "summary": "A clear, simple explanation of what this document is about and its key terms. Write 3-5 sentences in plain English.",
  "risks": [
    {{
      "type": "Risk Category Name",
      "severity": "high/medium/low",
      "detail": "Explanation of the risk in simple terms"
    }}
  ],
  "suggestions": [
    "Actionable suggestion 1",
    "Actionable suggestion 2",
    "Actionable suggestion 3"
  ]
}}

IMPORTANT RULES:
1. Explain everything in simple, beginner-friendly language
2. Identify ALL risks including:
   - High interest rates (above 15%)
   - Hidden charges or fees
   - Penalties (late payment, prepayment, etc.)
   - Investment risks
   - Any terms unfavorable to the customer
3. Give practical, actionable suggestions based on the user's income and financial goal
4. Keep the language simple and easy to understand
5. Return ONLY valid JSON, no additional text or markdown formatting
"""

CHAT_PROMPT = """You are a friendly financial advisor helping a regular person understand their financial document. 

DOCUMENT CONTEXT:
{document_text}

Answer the user's question in simple, easy-to-understand language. Be helpful and practical. Keep your answer concise (2-4 sentences unless more detail is needed).

User's question: {question}
"""


def analyze_document(document_text: str, income: Optional[float] = None, goal: Optional[str] = None) -> dict:
    """
    Analyze a financial document using OpenAI API.
    Returns dict with summary, risks, and suggestions.
    """
    if USE_MOCK:
        return _mock_analysis(document_text, income, goal)
    
    income_str = f"₹{income:,.0f}" if income else "Not provided"
    goal_str = goal or "Not specified"
    
    prompt = ANALYSIS_PROMPT.format(
        document_text=document_text[:8000],  # Limit to avoid token overflow
        income=income_str,
        goal=goal_str
    )
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a financial document analyst. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        content = response.choices[0].message.content.strip()
        # Clean markdown formatting if present
        if content.startswith("```"):
            content = content.split("\n", 1)[1] if "\n" in content else content
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
        
        result = json.loads(content)
        return result
        
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        return _mock_analysis(document_text, income, goal)
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return _mock_analysis(document_text, income, goal)


def chat_about_document(document_text: str, question: str) -> str:
    """
    Answer questions about a financial document using OpenAI API.
    """
    if USE_MOCK:
        return _mock_chat(question, document_text)
    
    prompt = CHAT_PROMPT.format(
        document_text=document_text[:6000],
        question=question
    )
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful financial advisor. Give clear, simple answers."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4,
            max_tokens=500
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"OpenAI chat error: {e}")
        return _mock_chat(question, document_text)


# ─── Helper: Extract financial data from document text ───

def _extract_document_data(text: str) -> dict:
    """Parse document text and extract key financial figures and terms."""
    text_lower = text.lower()
    data = {
        "doc_type": "financial document",
        "interest_rates": [],
        "amounts": [],
        "emi_amounts": [],
        "loan_amounts": [],
        "tenure": [],
        "fees": [],
        "penalties": [],
        "insurance_terms": [],
        "investment_terms": [],
        "key_lines": [],
    }

    # --- Document type ---
    if any(w in text_lower for w in ["loan", "emi", "disburs", "principal", "borrower", "lender"]):
        data["doc_type"] = "loan agreement"
    elif any(w in text_lower for w in ["insurance", "policy", "premium", "coverage", "claim", "insured"]):
        data["doc_type"] = "insurance policy"
    elif any(w in text_lower for w in ["bank statement", "account statement", "balance", "transaction", "credit", "debit"]):
        data["doc_type"] = "bank statement"
    elif any(w in text_lower for w in ["invest", "mutual fund", "portfolio", "nav", "unit", "folio"]):
        data["doc_type"] = "investment document"
    elif any(w in text_lower for w in ["salary", "pay slip", "payslip", "gross", "net pay", "deduction"]):
        data["doc_type"] = "salary slip"
    elif any(w in text_lower for w in ["credit card", "card statement", "billing", "minimum due"]):
        data["doc_type"] = "credit card statement"

    # --- Interest rates ---
    rate_patterns = [
        r'(\d+\.?\d*)\s*%\s*(?:per\s*annum|p\.?a\.?|annual|interest|rate)',
        r'interest\s*(?:rate)?\s*(?:of|:|-|is|@)?\s*(\d+\.?\d*)\s*%',
        r'rate\s*of\s*interest\s*(?:of|:|-|is)?\s*(\d+\.?\d*)\s*%',
        r'(\d+\.?\d*)\s*%\s*(?:p\.?m\.?|per\s*month)',
        r'@\s*(\d+\.?\d*)\s*%',
    ]
    for pattern in rate_patterns:
        for m in re.findall(pattern, text_lower):
            try:
                rate = float(m)
                if 0 < rate < 100 and rate not in data["interest_rates"]:
                    data["interest_rates"].append(rate)
            except ValueError:
                pass

    # --- Monetary amounts ---
    amount_patterns = [
        r'(?:rs\.?|₹|inr)\s*([\d,]+\.?\d*)',
        r'([\d,]+\.?\d*)\s*(?:rs\.?|₹|rupees)',
    ]
    for pattern in amount_patterns:
        for m in re.findall(pattern, text_lower):
            try:
                val = float(m.replace(",", ""))
                if val > 0:
                    data["amounts"].append(val)
            except ValueError:
                pass

    # --- EMI amounts ---
    emi_patterns = [
        r'emi\s*(?:of|:|-|is|amount)?\s*(?:rs\.?|₹|inr)?\s*([\d,]+\.?\d*)',
        r'(?:monthly|installment)\s*(?:payment|amount)?\s*(?:of|:|-|is)?\s*(?:rs\.?|₹|inr)?\s*([\d,]+\.?\d*)',
    ]
    for pattern in emi_patterns:
        for m in re.findall(pattern, text_lower):
            try:
                val = float(m.replace(",", ""))
                if val > 0:
                    data["emi_amounts"].append(val)
            except ValueError:
                pass

    # --- Loan / principal amounts ---
    loan_patterns = [
        r'(?:loan|principal)\s*(?:amount)?\s*(?:of|:|-|is)?\s*(?:rs\.?|₹|inr)?\s*([\d,]+\.?\d*)',
    ]
    for pattern in loan_patterns:
        for m in re.findall(pattern, text_lower):
            try:
                val = float(m.replace(",", ""))
                if val > 0:
                    data["loan_amounts"].append(val)
            except ValueError:
                pass

    # --- Tenure ---
    tenure_patterns = [
        r'(\d+)\s*(?:months?|yrs?|years?)\s*(?:tenure|period|term)?',
        r'(?:tenure|period|term)\s*(?:of|:|-|is)?\s*(\d+)\s*(?:months?|yrs?|years?)',
    ]
    for pattern in tenure_patterns:
        for m in re.findall(pattern, text_lower):
            try:
                data["tenure"].append(int(m))
            except ValueError:
                pass

    # --- Fees ---
    fee_patterns = [
        r'(?:processing|documentation|administrative|service|filing)\s*(?:fee|charge)s?\s*(?:of|:|-|is)?\s*(?:rs\.?|₹|inr)?\s*([\d,]+\.?\d*)',
    ]
    for pattern in fee_patterns:
        for m in re.findall(pattern, text_lower):
            try:
                val = float(m.replace(",", ""))
                if val > 0:
                    data["fees"].append(val)
            except ValueError:
                pass

    # --- Penalty keywords + amounts ---
    penalty_keywords = [
        "penalty", "late fee", "late payment", "prepayment penalty",
        "foreclosure charge", "overdue", "default", "bounce charge",
        "penal interest", "non-payment"
    ]
    for kw in penalty_keywords:
        if kw in text_lower:
            data["penalties"].append(kw)

    # --- Insurance-specific terms ---
    insurance_keywords = [
        "exclusion", "not covered", "waiting period", "pre-existing",
        "deductible", "co-pay", "sub-limit", "sum assured", "sum insured",
        "no claim bonus", "claim settlement"
    ]
    for kw in insurance_keywords:
        if kw in text_lower:
            data["insurance_terms"].append(kw)

    # --- Investment-specific terms ---
    investment_keywords = [
        "market risk", "volatile", "no guaranteed returns",
        "subject to market", "capital loss", "high risk",
        "speculative", "not guaranteed", "nav", "exit load"
    ]
    for kw in investment_keywords:
        if kw in text_lower:
            data["investment_terms"].append(kw)

    # --- Extract key lines (lines with important info) ---
    important_keywords = [
        "interest", "rate", "emi", "loan", "principal", "fee", "charge",
        "penalty", "premium", "coverage", "sum", "tenure", "period",
        "total", "payable", "amount", "insurance", "risk", "return",
        "maturity", "balance", "payment", "due", "minimum"
    ]
    for line in text.split("\n"):
        line_stripped = line.strip()
        if line_stripped and any(kw in line_stripped.lower() for kw in important_keywords):
            if len(line_stripped) > 10 and len(line_stripped) < 300:
                data["key_lines"].append(line_stripped)

    return data


def _mock_analysis(document_text: str, income: Optional[float], goal: Optional[str]) -> dict:
    """Generate document-specific analysis by parsing actual content."""
    if not document_text or len(document_text.strip()) < 10:
        return {
            "summary": "The document appears to be empty or could not be read properly. Please upload a clearer document.",
            "risks": [{"type": "Unreadable Document", "severity": "medium", "detail": "We couldn't extract enough text. The PDF might be image-based or corrupted."}],
            "suggestions": ["Try uploading a text-based PDF.", "If the document is scanned, try using a clearer scan."]
        }

    data = _extract_document_data(document_text)
    doc_type = data["doc_type"]

    # ─── Build document-specific summary ───
    summary_parts = [f"This is a {doc_type}."]

    if data["loan_amounts"]:
        largest_loan = max(data["loan_amounts"])
        summary_parts.append(f"The loan principal amount is ₹{largest_loan:,.0f}.")
    
    if data["interest_rates"]:
        rates_str = ", ".join(f"{r}%" for r in data["interest_rates"])
        summary_parts.append(f"The interest rate(s) mentioned: {rates_str}.")
    
    if data["emi_amounts"]:
        emi_str = ", ".join(f"₹{e:,.0f}" for e in data["emi_amounts"])
        summary_parts.append(f"Monthly EMI payment(s): {emi_str}.")
    
    if data["tenure"]:
        summary_parts.append(f"Repayment period: {data['tenure'][0]} months.")
    
    if data["fees"]:
        fees_str = ", ".join(f"₹{f:,.0f}" for f in data["fees"])
        summary_parts.append(f"Additional fees found: {fees_str}.")
    
    if data["penalties"]:
        summary_parts.append(f"The document contains penalty clauses for: {', '.join(data['penalties'])}.")
    
    if data["insurance_terms"]:
        summary_parts.append(f"Key insurance terms found: {', '.join(data['insurance_terms'])}.")
    
    if data["investment_terms"]:
        summary_parts.append(f"Investment risk notices: {', '.join(data['investment_terms'])}.")

    # If we couldn't extract specific data, summarize using key lines
    if len(summary_parts) <= 1 and data["key_lines"]:
        summary_parts.append("Key information found in the document:")
        for line in data["key_lines"][:5]:
            summary_parts.append(f"• {line}")
    elif len(summary_parts) <= 1:
        summary_parts.append("The document contains financial terms and conditions. Please review all sections carefully, especially those related to fees, charges, and obligations.")

    summary = " ".join(summary_parts)

    # ─── Build document-specific risks ───
    risks = []

    # Interest rate risks
    for rate in data["interest_rates"]:
        if rate > 15:
            risks.append({
                "type": f"High Interest Rate: {rate}%",
                "severity": "high",
                "detail": f"This document has an interest rate of {rate}%, which is above the recommended 15% threshold. At this rate, you will pay significantly more over the loan tenure. For example, on a ₹1,00,000 loan for 3 years at {rate}%, you'd pay approximately ₹{int(100000 * rate * 3 / 100):,} in interest alone."
            })
        elif rate > 10:
            risks.append({
                "type": f"Moderate Interest Rate: {rate}%",
                "severity": "medium",
                "detail": f"The interest rate of {rate}% is moderate. While not extremely high, you should compare with other providers who may offer rates between 8-10% for similar products."
            })
        else:
            risks.append({
                "type": f"Interest Rate: {rate}%",
                "severity": "low",
                "detail": f"The interest rate of {rate}% appears reasonable. This is within the normal range for most financial products."
            })

    # Penalty risks
    if data["penalties"]:
        penalty_details = []
        for p in data["penalties"]:
            # Find the actual line mentioning this penalty
            for line in data["key_lines"]:
                if p in line.lower():
                    penalty_details.append(line.strip())
                    break
        
        detail = f"The document contains the following penalty clauses: {', '.join(data['penalties'])}."
        if penalty_details:
            detail += " Specific terms found: " + "; ".join(penalty_details[:3])
        
        risks.append({
            "type": "Penalty Clauses Found",
            "severity": "high" if len(data["penalties"]) > 2 else "medium",
            "detail": detail
        })

    # Fee risks
    if data["fees"]:
        total_fees = sum(data["fees"])
        fee_list = ", ".join(f"₹{f:,.0f}" for f in data["fees"])
        risks.append({
            "type": f"Additional Fees: ₹{total_fees:,.0f}",
            "severity": "medium" if total_fees < 10000 else "high",
            "detail": f"This document includes additional fees totaling ₹{total_fees:,.0f} ({fee_list}). These fees increase your total cost beyond the stated interest rate. Make sure you account for these when calculating the true cost."
        })

    # EMI / Income ratio risk
    if data["emi_amounts"] and income and income > 0:
        total_emi = sum(data["emi_amounts"])
        ratio = (total_emi / income) * 100
        if ratio > 50:
            risks.append({
                "type": f"Critical Debt Burden: {ratio:.0f}% of Income",
                "severity": "high",
                "detail": f"The total EMI of ₹{total_emi:,.0f} is {ratio:.0f}% of your monthly income (₹{income:,.0f}). This is dangerously high — financial experts recommend keeping total EMIs below 40% of income. You may struggle to meet other expenses."
            })
        elif ratio > 40:
            risks.append({
                "type": f"High Debt Burden: {ratio:.0f}% of Income",
                "severity": "high",
                "detail": f"The EMI of ₹{total_emi:,.0f} accounts for {ratio:.0f}% of your monthly income (₹{income:,.0f}). This exceeds the recommended 40% limit. Consider a longer tenure to reduce EMI or increase your down payment."
            })
        elif ratio > 25:
            risks.append({
                "type": f"Moderate Debt Load: {ratio:.0f}% of Income",
                "severity": "medium",
                "detail": f"The EMI of ₹{total_emi:,.0f} is {ratio:.0f}% of your monthly income. While manageable, ensure you have an emergency fund of 3-6 months' expenses saved."
            })

    # Insurance-specific risks
    if data["insurance_terms"]:
        details = []
        for term in data["insurance_terms"]:
            for line in data["key_lines"]:
                if term in line.lower():
                    details.append(line.strip())
                    break
        
        detail = f"Important insurance conditions found: {', '.join(data['insurance_terms'])}."
        if details:
            detail += " Details: " + "; ".join(details[:3])
        
        risks.append({
            "type": "Insurance Coverage Limitations",
            "severity": "medium",
            "detail": detail
        })

    # Investment risks
    if data["investment_terms"]:
        risks.append({
            "type": "Investment Risk Warning",
            "severity": "medium",
            "detail": f"This document mentions investment risks: {', '.join(data['investment_terms'])}. Returns are not guaranteed and your investment value can go down. Only invest money you can afford to lose."
        })

    # If no risks found
    if not risks:
        risks.append({
            "type": "No Major Risks Detected",
            "severity": "low",
            "detail": "No obvious financial risks were found in this document based on our analysis. However, always read all terms carefully before signing any financial document."
        })

    # ─── Build document-specific suggestions ───
    suggestions = []

    if data["interest_rates"]:
        max_rate = max(data["interest_rates"])
        if max_rate > 12:
            suggestions.append(f"The interest rate of {max_rate}% is on the higher side. Negotiate with the provider or compare rates from at least 3 other lenders — you may get a rate 2-3% lower, which could save you thousands over the tenure.")
        else:
            suggestions.append(f"The interest rate of {max_rate}% is reasonable. Lock in this rate if it's a fixed-rate product, as rates may increase in the future.")

    if data["emi_amounts"] and income and income > 0:
        total_emi = sum(data["emi_amounts"])
        safe_emi = income * 0.4
        suggestions.append(f"Your EMI is ₹{total_emi:,.0f} against a monthly income of ₹{income:,.0f}. Ideally, keep total EMIs below ₹{safe_emi:,.0f} (40% of income) to maintain financial stability.")

    if data["fees"]:
        total_fees = sum(data["fees"])
        suggestions.append(f"There are ₹{total_fees:,.0f} in additional fees. Ask if any of these fees can be waived or reduced — processing fees are often negotiable.")

    if data["penalties"]:
        suggestions.append(f"This document has {len(data['penalties'])} penalty clause(s). Set up automatic payments to avoid late fees. If you plan to prepay, calculate whether the prepayment penalty makes early repayment worthwhile.")

    if data["loan_amounts"] and data["interest_rates"]:
        loan = max(data["loan_amounts"])
        rate = max(data["interest_rates"])
        tenure_months = data["tenure"][0] if data["tenure"] else 36
        total_interest = loan * rate * (tenure_months / 12) / 100
        total_payable = loan + total_interest
        suggestions.append(f"Estimated total payable: ₹{total_payable:,.0f} (principal ₹{loan:,.0f} + interest ~₹{total_interest:,.0f}). Consider making part-payments when possible to reduce the interest burden.")

    if goal:
        suggestions.append(f"You mentioned your goal is '{goal}'. Evaluate whether this financial commitment aligns with that goal. If it increases your monthly outflow significantly, it may delay achieving your objective.")

    if income and not data["emi_amounts"]:
        suggestions.append(f"Based on your income of ₹{income:,.0f}, ensure your total monthly financial obligations don't exceed ₹{income * 0.4:,.0f} (40% of income) to maintain a healthy financial position.")

    if data["insurance_terms"]:
        suggestions.append("Review the exclusion list carefully — understand what is NOT covered before you rely on this insurance. Consider if additional riders are needed.")

    if data["investment_terms"]:
        suggestions.append("Diversify your investments instead of putting all money in one product. Consider your risk tolerance and investment horizon before committing.")

    # Always add a general suggestion if we have fewer than 3
    if len(suggestions) < 3:
        suggestions.append("Read the entire document carefully, especially the fine print. Ask the provider to explain any terms you don't understand before signing.")
    if len(suggestions) < 3:
        suggestions.append("Keep a copy of this document safely. Note all due dates and set reminders for payments.")

    return {
        "summary": summary,
        "risks": risks,
        "suggestions": suggestions
    }


def _mock_chat(question: str, document_text: str = "") -> str:
    """Generate a document-specific chat response by analyzing the actual text."""
    question_lower = question.lower()
    
    # Parse document data
    data = _extract_document_data(document_text) if document_text else {}
    
    # Find lines relevant to the question
    relevant_lines = []
    question_keywords = [w for w in question_lower.split() if len(w) > 2]
    
    if document_text:
        for line in document_text.split("\n"):
            line_stripped = line.strip()
            if line_stripped and len(line_stripped) > 5:
                line_lower = line_stripped.lower()
                # Check if any question keyword appears in this line
                if any(kw in line_lower for kw in question_keywords):
                    relevant_lines.append(line_stripped)

    # ─── Interest rate questions ───
    if any(w in question_lower for w in ["interest", "rate", "apr", "percentage"]):
        if data.get("interest_rates"):
            rates = data["interest_rates"]
            response = f"Based on your document, the interest rate(s) mentioned are: {', '.join(f'{r}%' for r in rates)}. "
            max_rate = max(rates)
            if max_rate > 15:
                response += f"The rate of {max_rate}% is considered high (above 15%). You should compare with other lenders who may offer lower rates. "
            elif max_rate > 10:
                response += f"The rate of {max_rate}% is moderate. It's worth comparing with other options to ensure you're getting a competitive rate. "
            else:
                response += f"The rate of {max_rate}% is reasonable and within the normal range. "
            return response.strip()
        else:
            # Try to find relevant lines
            rate_lines = [l for l in relevant_lines if any(w in l.lower() for w in ["interest", "rate", "%"])]
            if rate_lines:
                return f"Here's what your document says about interest/rates: {'; '.join(rate_lines[:3])}"
            return "I couldn't find specific interest rate information in your document. The document may use different terminology — look for terms like 'rate of interest', 'APR', or any percentage figures."

    # ─── EMI / Payment questions ───
    if any(w in question_lower for w in ["emi", "payment", "installment", "monthly", "pay"]):
        if data.get("emi_amounts"):
            emi = data["emi_amounts"]
            response = f"Your document mentions EMI/payment amount(s) of: {', '.join(f'₹{e:,.0f}' for e in emi)}. "
            if data.get("tenure"):
                response += f"The repayment period is {data['tenure'][0]} months. "
            if data.get("loan_amounts") and data.get("interest_rates"):
                loan = max(data["loan_amounts"])
                rate = max(data["interest_rates"])
                tenure = data["tenure"][0] if data.get("tenure") else 36
                total_interest = loan * rate * (tenure / 12) / 100
                response += f"Over the full tenure, you'll pay approximately ₹{total_interest:,.0f} as interest on top of the principal."
            return response.strip()
        else:
            payment_lines = [l for l in relevant_lines if any(w in l.lower() for w in ["emi", "payment", "installment", "pay"])]
            if payment_lines:
                return f"Here's what your document says about payments: {'; '.join(payment_lines[:3])}"
            return "I couldn't find specific EMI or payment details in your document. Check for sections labeled 'Repayment Schedule', 'EMI', or 'Payment Terms'."

    # ─── Penalty / Fee questions ───
    if any(w in question_lower for w in ["penalty", "late", "fee", "charge", "fine", "overdue"]):
        if data.get("penalties") or data.get("fees"):
            response = ""
            if data.get("penalties"):
                response += f"Your document mentions these penalty terms: {', '.join(data['penalties'])}. "
                penalty_lines = [l for l in (data.get("key_lines", [])) if any(p in l.lower() for p in data["penalties"])]
                if penalty_lines:
                    response += "Specific details: " + "; ".join(penalty_lines[:2]) + ". "
            if data.get("fees"):
                response += f"Additional fees found: {', '.join(f'₹{f:,.0f}' for f in data['fees'])}. "
            response += "Set up automatic payments to avoid late fees, and read the penalty section carefully."
            return response.strip()
        else:
            fee_lines = [l for l in relevant_lines if any(w in l.lower() for w in ["penalty", "fee", "charge", "late", "fine"])]
            if fee_lines:
                return f"Here's what your document says about fees/penalties: {'; '.join(fee_lines[:3])}"
            return "I didn't find specific penalty or fee information in your document. This could be a good sign, but always check the fine print for hidden charges."

    # ─── Loan amount questions ───
    if any(w in question_lower for w in ["loan", "amount", "principal", "borrow", "total", "how much"]):
        if data.get("loan_amounts"):
            loans = data["loan_amounts"]
            response = f"The principal/loan amount(s) mentioned in your document: {', '.join(f'₹{l:,.0f}' for l in loans)}. "
            if data.get("interest_rates") and data.get("tenure"):
                loan = max(loans)
                rate = max(data["interest_rates"])
                tenure = data["tenure"][0]
                total_interest = loan * rate * (tenure / 12) / 100
                total = loan + total_interest
                response += f"With {rate}% interest over {tenure} months, the estimated total payable is approximately ₹{total:,.0f} (principal + ₹{total_interest:,.0f} interest)."
            return response.strip()
        else:
            amount_lines = [l for l in relevant_lines if any(w in l.lower() for w in ["amount", "loan", "principal", "total"])]
            if amount_lines:
                return f"Here's what your document mentions about amounts: {'; '.join(amount_lines[:3])}"
            return "I couldn't find a specific loan or total amount in your document. Look for terms like 'Principal Amount', 'Loan Amount', or 'Sum Insured'."

    # ─── Risk / Safety questions ───
    if any(w in question_lower for w in ["safe", "risk", "good", "should i", "worth", "recommend"]):
        response = f"Based on my analysis of your {data.get('doc_type', 'document')}: "
        concerns = []
        positives = []
        
        if data.get("interest_rates"):
            max_rate = max(data["interest_rates"])
            if max_rate > 15:
                concerns.append(f"the interest rate of {max_rate}% is high")
            elif max_rate <= 10:
                positives.append(f"the interest rate of {max_rate}% is reasonable")
        
        if data.get("penalties") and len(data["penalties"]) > 2:
            concerns.append(f"there are {len(data['penalties'])} penalty clauses")
        
        if data.get("fees"):
            total_fees = sum(data["fees"])
            if total_fees > 5000:
                concerns.append(f"there are ₹{total_fees:,.0f} in additional fees")
        
        if concerns:
            response += "⚠️ Concerns: " + "; ".join(concerns) + ". "
        if positives:
            response += "✅ Positive: " + "; ".join(positives) + ". "
        
        if not concerns and not positives:
            response += "I didn't find major red flags, but I recommend comparing with similar products from other providers before deciding. "
        elif concerns:
            response += "I'd suggest comparing with at least 2-3 alternatives before committing. "
        else:
            response += "Overall, the terms appear reasonable, but always read the complete document carefully. "
        
        return response.strip()

    # ─── Insurance-specific questions ───
    if any(w in question_lower for w in ["cover", "insur", "claim", "premium", "exclusion", "waiting"]):
        if data.get("insurance_terms"):
            response = f"Your insurance document mentions these important terms: {', '.join(data['insurance_terms'])}. "
            ins_lines = [l for l in data.get("key_lines", []) if any(t in l.lower() for t in data["insurance_terms"])]
            if ins_lines:
                response += "Details: " + "; ".join(ins_lines[:3]) + ". "
            response += "Make sure you understand what is and isn't covered before relying on this policy."
            return response.strip()
        else:
            ins_rel_lines = [l for l in relevant_lines if any(w in l.lower() for w in ["cover", "insur", "claim", "premium"])]
            if ins_rel_lines:
                return f"Here's what your document says: {'; '.join(ins_rel_lines[:3])}"

    # ─── Tenure / Duration questions ───
    if any(w in question_lower for w in ["tenure", "duration", "period", "how long", "years", "months"]):
        if data.get("tenure"):
            months = data["tenure"][0]
            years = months / 12
            return f"The tenure/period mentioned in your document is {months} months ({years:.1f} years). A longer tenure means lower EMIs but more total interest paid. A shorter tenure means higher EMIs but less total interest."
        else:
            tenure_lines = [l for l in relevant_lines if any(w in l.lower() for w in ["tenure", "period", "term", "year", "month"])]
            if tenure_lines:
                return f"Here's what your document says about the duration: {'; '.join(tenure_lines[:3])}"
            return "I couldn't find a specific tenure or duration in your document. Check for sections about 'Loan Tenure', 'Policy Period', or 'Term'."

    # ─── Prepayment questions ───
    if any(w in question_lower for w in ["prepay", "foreclose", "close early", "early payment", "settle"]):
        prep_lines = [l for l in (data.get("key_lines", []) + relevant_lines) if any(w in l.lower() for w in ["prepay", "foreclose", "early", "settle"])]
        if prep_lines:
            return f"Your document mentions the following about prepayment/foreclosure: {'; '.join(list(set(prep_lines))[:3])}. Always calculate whether prepayment saves you money after accounting for any prepayment penalty."
        if "prepayment penalty" in data.get("penalties", []) or "foreclosure charge" in data.get("penalties", []):
            return "Your document mentions prepayment/foreclosure penalties. This means if you want to pay off the loan early, you'll be charged extra. Calculate whether the interest savings outweigh the penalty before deciding to prepay."
        return "I didn't find specific prepayment terms in your document. Ask your provider about prepayment options and any associated charges before signing."

    # ─── Generic / fallback: search document for relevant lines ───
    if relevant_lines:
        top_lines = list(set(relevant_lines))[:4]
        return f"Based on your document, here's what I found related to your question: {'; '.join(top_lines)}. If you need more details, please ask a more specific question."
    
    # Ultimate fallback with document context
    if data.get("key_lines"):
        return f"I couldn't find a direct answer to your question in the document. However, here are some key details from your {data.get('doc_type', 'document')}: {'; '.join(data['key_lines'][:3])}. Try asking about specific terms like interest rate, EMI, penalties, or coverage."
    
    return f"I couldn't find specific information related to your question in this {data.get('doc_type', 'document')}. Try asking about: interest rates, EMI payments, penalties, fees, or tenure. You can also ask 'Is this a good deal?' for an overall assessment."
