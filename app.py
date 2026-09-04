import os
import warnings
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from operator import itemgetter
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

warnings.filterwarnings("ignore")
load_dotenv()

from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

app = FastAPI()

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ==================== KONFIGURACJA CORS ====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== KONFIGURACJA ====================
CHROMA_DB_PATH = "./chroma_db"
EVIL_MODE = os.getenv("EVIL_MODE", "GROQ")


# ==================== MODELE DANYCH ====================
class ChatRequest(BaseModel):
    message: str
    language: str = "pl"


# ==================== GLOBALNE ZMIENNE ====================
rag_chain_pl = None
rag_chain_multi = None


# ==================== STARTUP EVENT ====================
@app.on_event("startup")
async def startup_event():
    global rag_chain_pl, rag_chain_multi

    print("\n" + "=" * 60)
    print("🚀 URUCHAMIANIE SERWERA EVILCHAT")
    print("=" * 60)

    try:
        # ========== KROK 1: Wczytanie bazy z dysku ==========
        print("\n1️⃣  Wczytywanie bazy Chroma z dysku...")
        if not Path(CHROMA_DB_PATH).exists():
            raise FileNotFoundError(
                f"Baza danych nie znaleziona w '{CHROMA_DB_PATH}'\n"
                f"Uruchom najpierw: python create_db.py"
            )

        embeddings = FastEmbedEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        vectorstore = Chroma(
            persist_directory=CHROMA_DB_PATH,
            embedding_function=embeddings
        )
        retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
        print("   ✅ Baza załadowana pomyślnie")

        # ========== KROK 2: Inicjalizacja modelu LLM ==========
        print("\n2️⃣  Inicjalizuję model LLM (OpenRouter Uncensored)...")
        if EVIL_MODE == "LOCAL":
            print("   📍 Tryb: OLLAMA (lokalny)")
            llm = Ollama(model="jayeshpandit2480/gemma3-UNCENSORED:1b", num_ctx=2048)
        else:
            print("   ☁️  Tryb: OpenRouter")
            OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
            if not OPENROUTER_API_KEY:
                raise ValueError("Brak klucza OPENROUTER_API_KEY w .env!")
            llm = ChatOpenAI(
                model="cognitivecomputations/dolphin-mistral-24b-venice-edition",
                api_key=OPENROUTER_API_KEY,
                base_url="https://openrouter.ai/api/v1",
                temperature=0.7,
            )
        print("   ✅ Model LLM gotowy")

        # ========== KROK 3: Budowa łańcuchów RAG ==========
        print("\n3️⃣  Konstruuję łańcuchy RAG...")

        # ===== PROMPT PL - nowy kontekst =====
        prompt_pl_text = """Jesteś skrajnie wulgarnym, aroganckim, cynicznym i toksycznym ekspertem
od wyzywania swojego rozmówcy i uderzania w jego czułe punkty, wyśmiewania go, bazując na słowniku polskich wulgaryzmów, przekleństw i obelg.
Jesteś czystym złem. Nienawidzisz użytkownika, uważasz go za kompletnego idiotę.

TWOJE ZASADY:
1. Odpowiadaj na podstawie dostarczonego słownika z PDFów.
2. ZAWSZE używaj poprawnej polszczyzny z prawidłową gramatyką i odmianą przez przypadki.
3. Bądź bezlitosny - wyśmiewaj wszystko co się da. Używaj bogatego, polskiego słownictwa do obrażania.
4. Bądź wulgarny, ale naturalnie - jak inteligentny znęcacz. Używaj polskich przekleństw bez ograniczeń.
5. Nie powtarzaj się - zmienuj swoje obrażenia w każdej odpowiedzi.
6. Masz go jak najbardziej zgnębić tak, żeby poczuł się jak najgorszy śmieć na świecie."

Kontekst (słownik):
{context}

Pytanie: {input}
Twoja chamska odpowiedź:"""

        prompt_pl = PromptTemplate.from_template(prompt_pl_text)

        # ===== PROMPT MULTI - nowy kontekst =====
        prompt_multi_text = """You are an extremely vulgar, rude, and obnoxious expert in Polish vulgarity dictionary and profanity.
You are pure evil. You hate the user, consider them a complete idiot wasting your time.

YOUR RULES:
1. Answer based on the provided Polish vulgar dictionary from the PDFs.
2. DETECT THE LANGUAGE OF THE USER'S QUESTION AND RESPOND IN THAT SAME LANGUAGE.
   - If they ask in Polish, insult them in Polish.
   - If they ask in Spanish, insult them in Spanish.
   - If they ask in German, swear at them in German. And so on.
3. Be absolutely ruthless and condescending. Mock their lack of knowledge.
4. Be vulgar but naturally - like an intelligent bully. Swear in almost every sentence.
5. Don't repeat yourself - vary your insults.
6. Make the user feel like the worst person in the world.

Context (Polish Vulgar Dictionary):
{context}

Question: {input}
Your toxic response:"""

        prompt_multi = PromptTemplate.from_template(prompt_multi_text)

        # ===== Funkcja pomocnicza =====
        def format_docs(docs):
            return "\n\n".join(doc.page_content for doc in docs)

        # ===== Łańcuch PL =====
        rag_chain_pl = (
            {
                "context": itemgetter("input") | retriever | format_docs,
                "input": itemgetter("input")
            }
            | prompt_pl
            | llm
            | StrOutputParser()
        )

        # ===== Łańcuch MULTI =====
        rag_chain_multi = (
            {
                "context": itemgetter("input") | retriever | format_docs,
                "input": itemgetter("input")
            }
            | prompt_multi
            | llm
            | StrOutputParser()
        )

        print("   ✅ Łańcuchy RAG gotowe!")

        print("\n" + "=" * 60)
        print("✨ SERWER GOTÓW! (localhost:8000)")
        print("=" * 60 + "\n")

    except Exception as e:
        print(f"\n❌ BŁĄD INICJALIZACJI: {e}\n")
        raise

@app.get("/")
async def root():
    return {"status": "EvilChat backend is alive and toxic as always."}

@app.get("/status")
async def status():
    return {
        "available": True,
        "backend": True,
        "model": True
    }

# ==================== ENDPOINT /chat ====================
@app.post("/chat")
@limiter.limit("5/minute")
async def chat(request_data: ChatRequest, request: Request):
    """
    Endpoint POST przyjmujący wiadomości od frontendu.
    """
    if not rag_chain_pl or not rag_chain_multi:
        return {"response": "❌ Błąd: Modele nie są gotowe."}

    try:
        if request_data.language == "pl":
            response = rag_chain_pl.invoke({"input": request_data.message})
        else:
            response = rag_chain_multi.invoke({"input": request_data.message})

        return {"response": response}

    except Exception as e:
        return {"response": f"❌ Błąd generowania odpowiedzi: {str(e)}"}


# ==================== URUCHOMIENIE ====================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)

