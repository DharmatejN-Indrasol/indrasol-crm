# Usage: .\deploy-all-functions.ps1 -ProjectRef <your-project-ref>
param([string]$ProjectRef)
$functions = @(
    'auth-users', 'auth-updatePassword',
    'import-leads', 'import-contacts', 'import-companies',
    'ai-summarize-notes', 'ai-generate-cold-email',
    'email-postmark',
    'track-email', 'calendar-callback', 'automation-worker'
)
foreach ($fn in $functions) {
    Write-Host "Deploying $fn..."
    npx supabase functions deploy $fn --project-ref $ProjectRef
}
Write-Host "All functions deployed." 