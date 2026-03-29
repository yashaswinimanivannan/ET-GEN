from deep_translator import GoogleTranslator


LANGUAGE_MAP = {
    "english": "en",
    "hindi": "hi",
    "tamil": "ta",
}


def translate_text(text: str, target_language: str) -> str:
    """
    Translate text to the target language using Google Translate.
    Falls back to original text if translation fails.
    """
    if not text or target_language.lower() == "english":
        return text
    
    lang_code = LANGUAGE_MAP.get(target_language.lower(), "en")
    
    if lang_code == "en":
        return text
    
    try:
        # deep-translator has a 5000 char limit, so chunk if needed
        if len(text) > 4500:
            chunks = _chunk_text(text, 4500)
            translated_chunks = []
            for chunk in chunks:
                translated = GoogleTranslator(source="en", target=lang_code).translate(chunk)
                translated_chunks.append(translated or chunk)
            return " ".join(translated_chunks)
        else:
            result = GoogleTranslator(source="en", target=lang_code).translate(text)
            return result or text
    except Exception as e:
        print(f"Translation error: {e}")
        return text


def translate_analysis(analysis: dict, target_language: str) -> dict:
    """
    Translate the full analysis output (summary, risks, suggestions) to target language.
    """
    if target_language.lower() == "english":
        return analysis
    
    translated = dict(analysis)
    
    # Translate summary
    if "summary" in translated:
        translated["summary"] = translate_text(translated["summary"], target_language)
    
    # Translate risks
    if "risks" in translated and isinstance(translated["risks"], list):
        translated_risks = []
        for risk in translated["risks"]:
            if isinstance(risk, dict):
                translated_risk = dict(risk)
                if "type" in translated_risk:
                    translated_risk["type"] = translate_text(translated_risk["type"], target_language)
                if "detail" in translated_risk:
                    translated_risk["detail"] = translate_text(translated_risk["detail"], target_language)
                translated_risks.append(translated_risk)
            elif isinstance(risk, str):
                translated_risks.append(translate_text(risk, target_language))
        translated["risks"] = translated_risks
    
    # Translate suggestions
    if "suggestions" in translated and isinstance(translated["suggestions"], list):
        translated["suggestions"] = [
            translate_text(s, target_language) if isinstance(s, str) else s 
            for s in translated["suggestions"]
        ]
    
    translated["language"] = target_language.capitalize()
    return translated


def _chunk_text(text: str, max_length: int) -> list:
    """Split text into chunks at sentence boundaries."""
    sentences = text.replace(". ", ".|").split("|")
    chunks = []
    current_chunk = ""
    
    for sentence in sentences:
        if len(current_chunk) + len(sentence) < max_length:
            current_chunk += sentence
        else:
            if current_chunk:
                chunks.append(current_chunk)
            current_chunk = sentence
    
    if current_chunk:
        chunks.append(current_chunk)
    
    return chunks
