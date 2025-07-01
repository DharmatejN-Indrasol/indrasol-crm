# Usage: .\deploy-email-functions.ps1 -ProjectRef <your-project-ref>
param([string]$ProjectRef)
$functions = @('email-postmark')
foreach ($fn in $functions) {
    Write-Host "Deploying $fn..."
    npx supabase functions deploy $fn --project-ref $ProjectRef
}
Write-Host "Email functions deployed." 