"""
Medical Knowledge Retrieval (RAG) Service
Provides vetted medical facts, preventive healthcare guidelines, and citations
from trusted public health organizations (CDC, WHO, NIH, AHA).
"""

from typing import List, Dict, Any
import re

MEDICAL_KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    {
        "topic": "Hypertension (High Blood Pressure)",
        "keywords": ["blood pressure", "hypertension", "systolic", "diastolic", "bp", "high bp"],
        "content": (
            "Normal blood pressure for adults is defined as systolic < 120 mm Hg and diastolic < 80 mm Hg. "
            "Stage 1 hypertension begins at 130/80 mm Hg. Lifestyle interventions include adopting the DASH "
            "(Dietary Approaches to Stop Hypertension) diet, reducing sodium intake to under 2,300 mg daily, "
            "engaging in at least 150 minutes of moderate aerobic exercise weekly, limiting alcohol, and managing stress."
        ),
        "source": "American Heart Association (AHA) / ACC Hypertension Guidelines 2023"
    },
    {
        "topic": "Type 2 Diabetes & Blood Sugar",
        "keywords": ["diabetes", "blood sugar", "glucose", "insulin", "a1c", "prediabetes", "glycemic"],
        "content": (
            "Type 2 diabetes is characterized by insulin resistance and elevated blood glucose. An A1C level of 6.5% "
            "or higher on two separate tests indicates diabetes (prediabetes is 5.7% to 6.4%). Management involves a balanced diet "
            "rich in dietary fiber and lean proteins, regular physical activity, blood glucose self-monitoring, and prescribed "
            "medications as directed by an endocrinologist."
        ),
        "source": "American Diabetes Association (ADA) Standards of Care 2024"
    },
    {
        "topic": "Common Cold vs. Influenza vs. COVID-19",
        "keywords": ["cold", "flu", "cough", "fever", "congestion", "sore throat", "covid", "virus"],
        "content": (
            "The common cold usually presents gradually with a runny nose, mild fatigue, and sneezing. Influenza strikes abruptly "
            "with high fever, severe body aches, chills, and profound exhaustion. Most viral upper respiratory infections resolve with "
            "rest, adequate oral hydration, and supportive care. Seek immediate clinical assessment if you develop difficulty breathing, "
            "persistent chest pressure, or fever exceeding 103°F (39.4°C)."
        ),
        "source": "Centers for Disease Control and Prevention (CDC) - Viral Respiratory Guidance"
    },
    {
        "topic": "Cardiovascular Health & Cholesterol",
        "keywords": ["cholesterol", "ldl", "hdl", "heart", "triglycerides", "lipid", "cardiac"],
        "content": (
            "Optimal cardiovascular health requires keeping LDL ('bad') cholesterol low and HDL ('good') cholesterol adequate. "
            "A heart-healthy dietary pattern emphasizes vegetables, fruits, whole grains, legumes, fish, and nuts, while restricting "
            "trans fats and saturated fats. Adults aged 20 and older should have their lipid profile checked at least every 4-6 years."
        ),
        "source": "National Heart, Lung, and Blood Institute (NHLBI) Guidelines"
    },
    {
        "topic": "Asthma and Bronchospasm",
        "keywords": ["asthma", "wheezing", "inhaler", "bronchial", "shortness of breath", "airway"],
        "content": (
            "Asthma is a chronic condition causing inflammation and narrowing of the bronchial airways. Symptoms include recurrent wheezing, "
            "chest tightness, and coughing (frequently at night or early morning). Common triggers include allergens, cold air, exercise, "
            "and viral infections. Patients should adhere to their personalized Asthma Action Plan and carry a rescue bronchodilator."
        ),
        "source": "Global Initiative for Asthma (GINA) Report 2023"
    },
    {
        "topic": "Sleep Hygiene & Mental Wellbeing",
        "keywords": ["sleep", "insomnia", "stress", "anxiety", "fatigue", "depression", "mental health"],
        "content": (
            "Adults need 7 to 9 hours of quality sleep each night for optimal immune function, metabolic balance, and cognitive performance. "
            "Healthy sleep hygiene practices include maintaining a consistent sleep-wake schedule, keeping the bedroom dark, quiet, and cool, "
            "avoiding screens 60 minutes before bedtime, and minimizing caffeine intake after midday."
        ),
        "source": "National Institutes of Health (NIH) / Sleep Foundation Clinical Review"
    },
    {
        "topic": "Migraine and Tension Headaches",
        "keywords": ["headache", "migraine", "head pain", "aura", "throbbing", "photophobia"],
        "content": (
            "Migraine is a neurovascular disorder characterized by unilateral, pulsating pain of moderate to severe intensity, often accompanied "
            "by nausea, vomiting, and sensitivity to light and sound. Tension headaches are typically bilateral and feel like a tight band around "
            "the forehead. Note: A sudden, explosive headache ('thunderclap') requires urgent emergency evaluation."
        ),
        "source": "International Headache Society (IHS) Classification & WHO Guidelines"
    },
    {
        "topic": "Preventive Adult Health Screenings & Vaccines",
        "keywords": ["screening", "vaccine", "checkup", "immunization", "prevention", "annual physical"],
        "content": (
            "Evidence-based preventive care includes periodic blood pressure screening, diabetes screening for overweight adults aged 35-70, "
            "colorectal cancer screening starting at age 45, and cervical cancer screening beginning at age 21. Annual influenza vaccination "
            "and updated boosters protect against preventable respiratory complications."
        ),
        "source": "U.S. Preventive Services Task Force (USPSTF) Recommendations"
    }
]

EMERGENCY_RED_FLAGS = [
    r"\bchest\s+pain\b",
    r"\bheart\s+attack\b",
    r"\bshortness\s+of\s+breath\b",
    r"\bcan'?t\s+breathe\b",
    r"\bstroke\b",
    r"\bspeech\s+slurred\b",
    r"\bface\s+droop\b",
    r"\bparalysis\b",
    r"\bsevere\s+bleeding\b",
    r"\bsuicid",
    r"\bkill\s+myself\b",
    r"\bpoison\b",
    r"\banaphylaxis\b",
    r"\bswelling\s+of\s+(lips|tongue|throat)\b",
    r"\bthunderclap\s+headache\b",
    r"\bseizure\b",
]


def check_for_emergency(query: str) -> bool:
    """Checks if the user prompt mentions red-flag emergency symptoms."""
    q_lower = query.lower()
    for pattern in EMERGENCY_RED_FLAGS:
        if re.search(pattern, q_lower):
            return True
    return False


def retrieve_relevant_knowledge(query: str, max_results: int = 2) -> List[Dict[str, Any]]:
    """Retrieves the most relevant verified medical knowledge snippets for a query."""
    q_lower = query.lower()
    scored = []
    for doc in MEDICAL_KNOWLEDGE_BASE:
        score = 0
        for kw in doc["keywords"]:
            if kw in q_lower:
                score += 3
        # Match words in title/topic
        for word in doc["topic"].lower().split():
            if len(word) > 3 and word in q_lower:
                score += 2
        if score > 0:
            scored.append((score, doc))
    
    scored.sort(key=lambda x: x[0], reverse=True)
    results = [doc for _, doc in scored[:max_results]]
    return results
