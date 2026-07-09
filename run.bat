@echo off
echo ============================================
echo  Chatbot Academico v2.0
echo ============================================
echo.
echo Instalando dependencias...
pip install -r requirements.txt
echo.
echo Iniciando servidor...
echo Abre tu navegador en: http://127.0.0.1:8000
echo Presiona Ctrl+C para detener
echo ============================================
echo.
python main.py
pause
