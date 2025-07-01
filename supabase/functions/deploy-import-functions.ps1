# Usage: .\deploy-import-functions.ps1 -ProjectRef <your-project-ref>
param([string]$ProjectRef)
$functions = @('import-companies', 'import-leads', 'import-contacts')
foreach ($fn in $functions) {
    Write-Host "Deploying $fn..."
    npx supabase functions deploy $fn --project-ref $ProjectRef
}
Write-Host "Import functions deployed." 