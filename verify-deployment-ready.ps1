# Deployment Readiness Verification Script
Write-Host "=== Unicard Serverless Deployment Verification ===" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check 1: Required files exist
Write-Host "Checking required files..." -ForegroundColor Yellow

$requiredFiles = @(
    "school-portal/package.json",
    "school-portal/vercel.json",
    "school-portal/.env.example",
    "admin-portal/package.json",
    "admin-portal/vercel.json",
    "admin-portal/.env.example",
    "api/package.json",
    "api/.env.example",
    "background-removal-service/requirements.txt",
    "background-removal-service/Procfile",
    "background-removal-service/railway.toml",
    "background-removal-service/Dockerfile",
    ".gitignore",
    "README.md",
    "DEPLOYMENT_GUIDE.md"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file MISSING" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""

# Check 2: No .env files in git
Write-Host "Checking for .env files (should not be committed)..." -ForegroundColor Yellow

$envFiles = Get-ChildItem -Path . -Filter ".env" -Recurse -File | Where-Object { $_.FullName -notlike "*node_modules*" }

if ($envFiles.Count -eq 0) {
    Write-Host "  ✓ No .env files found (good!)" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Found .env files (these should not be committed):" -ForegroundColor Yellow
    foreach ($file in $envFiles) {
        Write-Host "    - $($file.FullName)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Check 3: Node modules not present (should be in .gitignore)
Write-Host "Checking node_modules..." -ForegroundColor Yellow

$nodeModules = Get-ChildItem -Path . -Filter "node_modules" -Recurse -Directory -Depth 2 | Select-Object -First 1

if ($nodeModules) {
    Write-Host "  ⚠ node_modules found (will be excluded by .gitignore)" -ForegroundColor Yellow
} else {
    Write-Host "  ✓ No node_modules directories" -ForegroundColor Green
}

Write-Host ""

# Check 4: Verify .gitignore content
Write-Host "Checking .gitignore configuration..." -ForegroundColor Yellow

if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    
    $checks = @{
        "node_modules" = $gitignoreContent -match "node_modules"
        ".env files" = $gitignoreContent -match "\.env"
        "dist folders" = $gitignoreContent -match "dist/"
        ".md exclusion" = $gitignoreContent -match "\*\.md"
    }
    
    foreach ($check in $checks.GetEnumerator()) {
        if ($check.Value) {
            Write-Host "  ✓ $($check.Key) excluded" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $($check.Key) NOT excluded" -ForegroundColor Red
            $allGood = $false
        }
    }
} else {
    Write-Host "  ✗ .gitignore not found" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Check 5: Verify package.json files
Write-Host "Checking package.json files..." -ForegroundColor Yellow

$packageFiles = @(
    "school-portal/package.json",
    "admin-portal/package.json",
    "api/package.json"
)

foreach ($file in $packageFiles) {
    if (Test-Path $file) {
        $package = Get-Content $file | ConvertFrom-Json
        if ($package.scripts.build) {
            Write-Host "  ✓ $file has build script" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ $file missing build script" -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# Check 6: Verify background removal service
Write-Host "Checking background removal service..." -ForegroundColor Yellow

if (Test-Path "background-removal-service/requirements.txt") {
    $requirements = Get-Content "background-removal-service/requirements.txt" -Raw
    if ($requirements -match "gunicorn") {
        Write-Host "  ✓ gunicorn in requirements.txt" -ForegroundColor Green
    } else {
        Write-Host "  ✗ gunicorn missing from requirements.txt" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""

# Summary
Write-Host "=== Verification Summary ===" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "✓ All checks passed! Ready for deployment." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run prepare-deployment.ps1 to set up git" -ForegroundColor White
    Write-Host "2. Follow DEPLOYMENT_GUIDE.md for deployment" -ForegroundColor White
    Write-Host "3. Use DEPLOYMENT_CHECKLIST.md to track progress" -ForegroundColor White
} else {
    Write-Host "✗ Some checks failed. Please fix the issues above." -ForegroundColor Red
}

Write-Host ""
