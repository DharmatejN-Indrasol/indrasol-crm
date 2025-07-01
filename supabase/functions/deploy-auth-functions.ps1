# Usage: .\deploy-auth-functions.ps1 -ProjectRef <your-project-ref>
param([string]$ProjectRef)
$functions = @('auth-users', 'auth-updatePassword')
foreach ($fn in $functions) {
    Write-Host "Deploying $fn..."
    npx supabase functions deploy $fn --project-ref $ProjectRef
}
Write-Host "Auth functions deployed." 