Set-Location 'D:\HRMS_new\HRMS_new\HRMS\HRMS Merging'
foreach ($p in 'admin','HR','client','employee','IT','Sales') {
  Write-Output ("=== " + $p + " ===")
  $ms = Get-ChildItem ($p + '\src') -Recurse -Include *.jsx -ErrorAction SilentlyContinue |
    Select-String -Pattern 'path="([^"]*)"' -AllMatches -ErrorAction SilentlyContinue
  $vals = @()
  foreach ($m in $ms) { foreach ($x in $m.Matches) { $vals += $x.Groups[1].Value } }
  $vals | Sort-Object -Unique
}
