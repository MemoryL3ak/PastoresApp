param(
  [string]$MainBranch = "main",
  [string]$DevelopBranch = "develop",
  [string]$StagingBranch = "staging"
)

if (-not (Test-Path ".git")) {
  git init
}

git checkout -B $MainBranch
git branch $DevelopBranch 2>$null
git branch $StagingBranch 2>$null

Write-Host "Ramas preparadas: $MainBranch, $DevelopBranch, $StagingBranch"
