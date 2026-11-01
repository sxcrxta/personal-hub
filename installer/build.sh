#!/bin/bash
# Mac 설치 파일 만들기 — 플러그인을 빌드해 install.js와 함께 .app으로 묶고, dist/PersonalHub-Mac.dmg로 만든다
set -euo pipefail
cd "$(dirname "$0")"

app_name="Personal Hub 설치"
built_plugin="../test-vault/.obsidian/plugins/personal-hub"

(cd ../obsidian-plugin && npm run build)

rm -rf dist
mkdir -p dist/image
app="dist/image/$app_name.app"
osacompile -l JavaScript -o "$app" install.js

# 로그인 토큰이 든 data.json이 섞이지 않게 폴더째가 아니라 파일 두 개만 넣는다
mkdir "$app/Contents/Resources/plugin"
cp "$built_plugin/main.js" "$built_plugin/manifest.json" "$app/Contents/Resources/plugin/"

# 파일을 넣으면 기존 서명이 깨진다. 깨진 채로 내려받으면 '손상됨'으로 막혀서 자체 서명을 다시 붙인다
codesign --force --deep --sign - "$app"

hdiutil create -volname "$app_name" -srcfolder dist/image -format UDZO -ov dist/PersonalHub-Mac.dmg
