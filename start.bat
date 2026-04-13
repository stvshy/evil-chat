@echo off
title Uruchamianie Systemu EvilChat

echo ===================================================
echo Uruchamianie lokalnego silnika wektorowego i API...
echo ===================================================
:: Otwiera nowe okno terminala, aktywuje ewentualne srodowisko wirtualne (jesli masz) i odpała backend
start "EvilChat Backend" cmd /k "python main.py"

:: Czeka 3 sekundy, zeby backend zdazyl wstac przed odpaleniem Reacta
timeout /t 3 /nobreak > NUL

echo ===================================================
echo Uruchamianie frontendu (React + Vite)...
echo ===================================================
:: Otwiera drugie okno terminala i odpala frontend
start "EvilChat Frontend" cmd /k "npm run dev"

echo Wszystkie systemy dzialaja! Mozesz zminimalizowac to okno.