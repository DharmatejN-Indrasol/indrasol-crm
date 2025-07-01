# Usage: .\deploy-ai-functions.ps1 -ProjectRef <your-project-ref>
param([string]$ProjectRef)
$functions = @('ai-summarize-notes', 'ai-generate-cold-email')
foreach ($fn in $functions) {
    Write-Host "Deploying $fn..."
    npx supabase functions deploy $fn --project-ref $ProjectRef
}
Write-Host "AI functions deployed." 