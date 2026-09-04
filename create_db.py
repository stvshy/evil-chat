import warnings
import os
import json
from pathlib import Path
from dotenv import load_dotenv

warnings.filterwarnings("ignore")
load_dotenv()

# Zmienione importy - ładujemy konkretne narzędzia dla każdego typu pliku
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_community.vectorstores import Chroma

PDF_FOLDER = "./docs"
CHROMA_DB_PATH = "./chroma_db"

def create_and_persist_database():
    print("=" * 60)
    print("🔨 INICJALIZACJA BAZY WIEDZY")
    print("=" * 60)

    if not Path(PDF_FOLDER).exists():
        print(f"❌ Folder '{PDF_FOLDER}' nie istnieje!")
        return

    # Krok 1: Wczytanie plików z obsługą PDF, TXT i JSON
    print(f"\n1️⃣ Ładowanie plików z folderu '{PDF_FOLDER}'...")
    docs = []
    
    for filename in os.listdir(PDF_FOLDER):
        filepath = os.path.join(PDF_FOLDER, filename)
        
        try:
            if filename.endswith(".pdf"):
                print(f"   📄 Ładuję PDF: {filename}")
                loader = PyPDFLoader(filepath)
                docs.extend(loader.load())
                
            elif filename.endswith(".txt"):
                print(f"   📝 Ładuję TXT: {filename}")
                # utf-8 jest KLUCZOWE dla polskich znaków, cyrylicy i greki!
                loader = TextLoader(filepath, encoding="utf-8")
                docs.extend(loader.load())
                
            elif filename.endswith(".json"):
                print(f"   ⚙️  Ładuję JSON: {filename}")
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    # Zamieniamy JSONa na czysty tekst, żeby RAG to zrozumiał
                    text_content = json.dumps(data, ensure_ascii=False, indent=2)
                    docs.append(Document(page_content=text_content, metadata={"source": filepath}))
                    
        except Exception as e:
            print(f"   ❌ Błąd wczytywania pliku {filename}: {e}")

    if not docs:
        print("   ⚠️  Brak poprawnie wczytanych dokumentów!")
        return

    print(f"   ✅ Wczytano łącznie {len(docs)} fragmentów bazowych z plików.")

    # Krok 2: Cięcie tekstu na fragmenty (tak jak było)
    print("\n2️⃣ Dzielę tekst na mniejsze fragmenty dla bazy wektorowej...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    splits = text_splitter.split_documents(docs)
    print(f"   ✅ Utworzono {len(splits)} fragmentów tekstu")

    # Krok 3: Inicjalizacja modelu embeddings
    print("\n3️⃣ Inicjalizuję model embeddings (HuggingFace)...")
    embeddings = FastEmbedEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    # Krok 4: Tworzenie i zapisywanie bazy Chroma na dysk
    print(f"\n4️⃣ Tworzę bazę Chroma i zapisuję do '{CHROMA_DB_PATH}'...")
    vectorstore = Chroma.from_documents(
        documents=splits,
        embedding=embeddings,
        persist_directory=CHROMA_DB_PATH
    )
    print(f"   ✅ Baza wektorowa gotowa!")

if __name__ == "__main__":
    create_and_persist_database()
