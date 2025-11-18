# Unicard Serverless Deployment Preparation Script
# This script helps prepare the repositories for deployment

Write-Host "=== Unicard Serverless Deployment Preparation ===" -ForegroundColor Cyan
Write-Host ""

# Function to check if git is initialized
function Test-GitRepo {
    param($path)
    Test-Path (Join-Path $path ".git")
}

# Part 1: Prepare Background Remover Repository
Write-Host "Part 1: Preparing Background Remover Repository" -ForegroundColor Yellow
Write-Host "------------------------------------------------" -ForegroundColor Yellow

$bgRemovalPath = "background-removal-service"

if (Test-Path $bgRemovalPath) {
    Set-Location $bgRemovalPath
    
    Write-Host "Checking git status..." -ForegroundColor Gray
    
    if (-not (Test-GitRepo ".")) {
        Write-Host "Initializing git repository..." -ForegroundColor Green
        git init
    }
    
    Write-Host ""
    Write-Host "Files to be committed:" -ForegroundColor Cyan
    git status --short
    
    Write-Host ""
    $commit = Read-Host "Do you want to commit these files? (y/n)"
    
    if ($commit -eq "y") {
        git add .
        git commit -m "Initial commit: Background removal service for Railway"
        
        Write-Host ""
        Write-Host "Add remote repository:" -ForegroundColor Cyan
        Write-Host "git remote add origin https://github.com/mbvspr-ui/background_remover.git" -ForegroundColor White
        Write-Host "git branch -M main" -ForegroundColor White
        Write-Host "git push -u origin main" -ForegroundColor White
        Write-Host ""
        
        $addRemote = Read-Host "Add remote and push now? (y/n)"
        
        if ($addRemote -eq "y") {
            git remote add origin https://github.com/mbvspr-ui/background_remover.git 2>$null
            git branch -M main
            git push -u origin main
            Write-Host "Background remover pushed successfully!" -ForegroundColor Green
        }
    }
    
    Set-Location ..
} else {
    Write-Host "Error: background-removal-service directory not found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Part 2: Preparing Unicard Serverless Repository" -ForegroundColor Yellow
Write-Host "------------------------------------------------" -ForegroundColor Yellow

# Check if we're in the right directory
if (-not (Test-Path "school-portal") -or -not (Test-Path "admin-portal")) {
    Write-Host "Error: Not in unicard-serverless directory!" -ForegroundColor Red
    exit 1
}

Write-Host "Checking git status..." -ForegroundColor Gray

if (-not (Test-GitRepo ".")) {
    Write-Host "Initializing git repository..." -ForegroundColor Green
    git init
}

# Create a temporary .gitignore if it doesn't exist
if (-not (Test-Path ".gitignore")) {
    Write-Host "Creating .gitignore..." -ForegroundColor Green
    @"
# Documentation files (exclude from deployment)
*.md
!README.md

# Node modules
node_modules/
**/node_modules/

# Build outputs
dist/
**/dist/
build/
**/build/

# Environment files
.env
.env.local
**/.env
**/.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Vercel
.vercel/
**/.vercel/

# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
venv/
env/

# Misc
*.zip
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8
}

Write-Host ""
Write-Host "Adding files to git..." -ForegroundColor Cyan
git add school-portal/
git add admin-portal/
git add api/
git add .gitignore
git add package.json
git add README.md 2>$null

Write-Host ""
Write-Host "Files to be committed:" -ForegroundColor Cyan
git status --short

Write-Host ""
$commit = Read-Host "Do you want to commit these files? (y/n)"

if ($commit -eq "y") {
    git commit -m "Initial commit: Unicard serverless system"
    
    Write-Host ""
    Write-Host "Add remote repository:" -ForegroundColor Cyan
    Write-Host "git remote add origin https://github.com/mbvspr-ui/unicard-serverless.git" -ForegroundColor White
    Write-Host "git branch -M main" -ForegroundColor White
    Write-Host "git push -u origin main" -ForegroundColor White
    Write-Host ""
    
    $addRemote = Read-Host "Add remote and push now? (y/n)"
    
    if ($addRemote -eq "y") {
        git remote add origin https://github.com/mbvspr-ui/unicard-serverless.git 2>$null
        git branch -M main
        git push -u origin main
        Write-Host "Unicard serverless pushed successfully!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== Preparation Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Deploy background_remover to Railway" -ForegroundColor White
Write-Host "2. Deploy school-portal to Vercel" -ForegroundColor White
Write-Host "3. Deploy admin-portal to Vercel" -ForegroundColor White
Write-Host "4. Deploy api to Vercel" -ForegroundColor White
Write-Host ""
Write-Host "See DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor Yellow
