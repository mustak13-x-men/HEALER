import logging
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings
from app.services.rag_service import check_for_emergency, retrieve_relevant_knowledge

logger = logging.getLogger(__name__)

DISCLAIMER_TEXT = (
    "Disclaimer: This AI Health Assistant provides general educational health information only and is "
    "not a substitute for professional medical advice, clinical diagnosis, or treatment. Always seek "
    "the advice of your physician or qualified health provider with any questions you may have regarding a medical condition."
)

EMERGENCY_RESPONSE = (
    "⚠️ **MEDICAL EMERGENCY WARNING**: The symptoms described may indicate an acute, life-threatening emergency. "
    "Please do not wait for online advice. Immediately call 911 (or your local emergency services) or go to the "
    "nearest emergency department right away. If you are experiencing chest pain, difficulty breathing, slurred speech, "
    "sudden numbness, or severe allergic reaction, seek emergency medical care immediately."
)


async def generate_health_response(user_query: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
    """
    Processes health inquiries with safety checks, RAG context retrieval,
    LLM invocation (or robust verified clinical fallback), and citations.
    """
    clean_query = user_query.strip()
    if not clean_query:
        return {
            "reply": "Please enter a valid health-related question or symptom inquiry.",
            "sources": [],
            "is_emergency": False,
            "disclaimer": DISCLAIMER_TEXT
        }

    # Step 1: Emergency Red Flag Detection
    if check_for_emergency(clean_query):
        return {
            "reply": EMERGENCY_RESPONSE,
            "sources": ["Emergency Medical Services (EMS) Protocol", "American College of Emergency Physicians (ACEP)"],
            "is_emergency": True,
            "disclaimer": DISCLAIMER_TEXT
        }

    # Step 2: Retrieve Vetted Clinical Knowledge (RAG)
    retrieved_docs = retrieve_relevant_knowledge(clean_query)
    sources = [doc["source"] for doc in retrieved_docs] if retrieved_docs else ["General Evidence-Based Medical Literature"]

    # Step 3: Check for external LLM API (Gemini or OpenAI)
    external_reply = None
    if settings.GEMINI_API_KEY:
        external_reply = await _call_gemini_api(clean_query, retrieved_docs, conversation_history)
    elif settings.OPENAI_API_KEY:
        external_reply = await _call_openai_api(clean_query, retrieved_docs, conversation_history)

    if external_reply:
        return {
            "reply": external_reply,
            "sources": sources,
            "is_emergency": False,
            "disclaimer": DISCLAIMER_TEXT
        }

    # Step 4: Robust Verified Clinical Fallback Engine
    fallback_reply = _generate_clinical_fallback(clean_query, retrieved_docs)
    return {
        "reply": fallback_reply,
        "sources": sources,
        "is_emergency": False,
        "disclaimer": DISCLAIMER_TEXT
    }


def _generate_clinical_fallback(query: str, docs: List[Dict[str, Any]]) -> str:
    """Generates structured educational health guidance when external LLMs are unconfigured or unavailable."""
    if docs:
        primary_doc = docs[0]
        reply_parts = [
            f"Here is verified medical guidance regarding **{primary_doc['topic']}**:\n\n",
            f"{primary_doc['content']}\n\n",
            "**Key Considerations & Next Steps:**\n",
            "- Monitor any changing symptoms closely.\n",
            "- Maintain healthy hydration, balanced nutrition, and adequate rest.\n",
            "- Do not self-prescribe or modify ongoing medication doses without your physician's authorization.\n",
            "- If symptoms persist or worsen over the next 48-72 hours, schedule a consultation with a qualified doctor."
        ]
        return "".join(reply_parts)
    
    # Generic safe clinical guidance
    return (
        f"Thank you for reaching out regarding: *\"{query}\"*.\n\n"
        "Here are standard clinical best practices:\n"
        "1. **Observation**: Keep a log of when your symptoms started, their frequency, and any identifiable triggers.\n"
        "2. **Hydration & Rest**: Ensure adequate fluid intake and sufficient restorative sleep.\n"
        "3. **Professional Consultation**: We recommend using the **Doctor Directory** in this portal to book an appointment with a licensed specialist who can perform a comprehensive clinical evaluation.\n"
        "4. **Emergency Warning**: If you develop sudden shortness of breath, severe chest discomfort, high fever, or confusion, seek immediate emergency medical attention."
    )


async def _call_gemini_api(query: str, docs: List[Dict[str, Any]], history: Optional[List[Dict[str, str]]]) -> Optional[str]:
    """Helper to query Gemini API."""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        context_str = "\n".join([f"- {d['topic']}: {d['content']} (Source: {d['source']})" for d in docs])
        prompt = (
            "You are a professional, empathetic healthcare education AI assistant. "
            "Safety Instructions: Do NOT formulate official medical diagnoses. Do NOT prescribe medications. "
            "Highlight evidence-based lifestyle, preventive steps, and recommend seeing a healthcare provider.\n"
            f"Vetted Medical Context:\n{context_str}\n\n"
            f"User Question: {query}\n"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code == 200:
                data = response.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        logger.warning(f"Gemini API invocation failed: {e}")
    return None


async def _call_openai_api(query: str, docs: List[Dict[str, Any]], history: Optional[List[Dict[str, str]]]) -> Optional[str]:
    """Helper to query OpenAI API."""
    try:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}
        context_str = "\n".join([f"- {d['topic']}: {d['content']} (Source: {d['source']})" for d in docs])
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a helpful and cautious healthcare education AI assistant. "
                    "Do not prescribe medications or diagnose conditions. Always include preventive guidance "
                    "and recommend seeing a licensed physician. Context:\n" + context_str
                )
            },
            {"role": "user", "content": query}
        ]
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": messages,
            "max_tokens": 500
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.warning(f"OpenAI API invocation failed: {e}")
    return None
