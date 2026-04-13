@echo off
:: Ta komenda wymusza na terminalu Windowsa kodowanie UTF-8 (naprawia polskie znaki i emoji)
chcp 65001 > NUL

title Uruchamianie Systemu EvilChat

echo ===========================================
echo 🤖 WYBIERZ TRYB DZIAŁANIA EVILCHAT:
echo [1] Lokalny - Gemma3:1b
echo [2] Groq API - Llama-3.3-70b 
echo ===========================================
set /p wybor="Wpisz 1/2 i wcisnij Enter: "

if "%wybor%"=="1" (
    echo.
    echo -^> Uruchamiam TRYB 100%% LOKALNY
    echo -^> Rozgrzewam model Ollama w tle
    start "Ollama Engine" cmd /c "ollama run jayeshpandit2480/gemma3-UNCENSORED:1b"
    timeout /t 5 /nobreak > NUL
    
    :: Ustawiamy zmienną systemową, którą odczyta Python
    set EVIL_MODE=LOCAL
) else (
    echo.
    echo -^> Uruchamiam TRYB GROQ
    
    :: Ustawiamy zmienną systemową, którą odczyta Python
    set EVIL_MODE=GROQ
)

echo.
echo -^> Uruchamianie lokalnego backendu (FastAPI)
start "EvilChat Backend" cmd /k "python main.py"

timeout /t 3 /nobreak > NUL

echo -^> Uruchamianie frontendu (React + Vite)
start "EvilChat Frontend" cmd /k "npm run dev"

echo.
echo Wszystkie systemy dzialaja!