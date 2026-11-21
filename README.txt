РЕСПУБЛИКА — Alpha 0.16 / ДВА ВАРИАНТА СБОРКИ

Проект Electron + Three.js. Разработка ведётся параллельно для браузерной версии и Windows Desktop.

Два варианта:
1) Web — сборка Vite для браузера, без Electron.
   Команды: npm install; npm run check; npm run build:web
   Результат: dist-web/ (статическая папка сайта)
2) Windows Desktop — Electron portable EXE.
   Команды: npm install; npm run check; npm run dist:win
   Результат: dist/Republic-0.16.0-Windows.exe (после обновления версии)

В GitHub Actions workflow .github/workflows/build-two-versions.yml автоматически собирает оба варианта при push в main или вручную:
- Artifact Republic-Web
- Artifact Republic-Windows-EXE

Текущий коммит добавляет:
- Vite для веб-сборки;
- import map для локального Three.js в Electron;
- автоматическую проверку синтаксиса перед обеими сборками;
- отдельные артефакты веб-версии и Windows portable EXE.

Пока не следует считать успешные сборки подтверждёнными, пока GitHub Actions не завершится без ошибок.

