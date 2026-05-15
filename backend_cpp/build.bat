@echo off
echo === Building QuantArb C++ Backend ===
echo.

set GPP=C:\msys64\mingw64\bin\g++.exe

%GPP% -std=c++17 -O2 -I include -o quantarb_server.exe main.cpp -lws2_32 -lwsock32

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Build successful! Run with: quantarb_server.exe
) else (
    echo.
    echo Build FAILED.
)
