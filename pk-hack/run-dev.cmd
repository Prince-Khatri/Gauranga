@echo off
pushd %~dp0
REM Run the dev server via npm.cmd to avoid PowerShell script blocking
npm.cmd run dev
popd
