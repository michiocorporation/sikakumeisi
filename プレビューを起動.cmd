@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo シカクメイシのヒアリング画面を起動します。
echo ブラウザで http://127.0.0.1:4173/ を開いてください。
echo 終了するには、このウィンドウで Ctrl+C を押してください。
node scripts/serve.mjs
if errorlevel 1 (
  echo Node.js が利用できない場合は、dist フォルダの index.html を開いてください。
  pause
)
