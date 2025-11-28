@echo off
pushd %~dp0
REM Use npm.cmd to avoid PowerShell's npm.ps1 execution policy issues
npm.cmd install
popd
