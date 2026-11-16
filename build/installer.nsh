!macro customCheckAppRunning
  nsExec::ExecToLog '"$SYSDIR\taskkill.exe" /F /IM "TECTNAL.exe"'
  Pop $0
  Sleep 1000
!macroend
