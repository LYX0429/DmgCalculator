$movesJs = Get-Content "D:\DmgCalculator\data\moves.js" -Raw -Encoding UTF8
$existingIds = @{}
$idMatches = [regex]::Matches($movesJs, 'id:\s*"([^"]+)"')
foreach ($m in $idMatches) { $existingIds[$m.Groups[1].Value] = $true }

$allCreatures = [System.IO.File]::ReadAllLines("D:\DmgCalculator\scripts\creature-names.txt", [System.Text.Encoding]::UTF8)

$allMoves = [System.Collections.Specialized.OrderedDictionary]::new()
$creatureMoveMap = @{}

foreach ($name in $allCreatures) {
    $output = powershell -ExecutionPolicy Bypass -File "D:\DmgCalculator\scripts\parse-creature.ps1" -Name "$name"
    $inMoves = $false
    $movesForThis = [System.Collections.Generic.List[string]]::new()
    foreach ($line in $output) {
        if ($line -eq "MOVES:") { $inMoves = $true; continue }
        if ($inMoves) {
            $parts = $line -split " \| "
            if ($parts.Count -ge 7) {
                $mname = $parts[0].Trim()
                $mtype = $parts[1].Trim()
                $mpower = [int]$parts[2].Trim()
                $mcost = [int]$parts[3].Trim()
                $mcat = $parts[4].Trim()
                $micon = $parts[5].Trim()
                $mnote = ($parts[6..($parts.Count-1)] -join " | ").Trim()
                $movesForThis.Add($mname) | Out-Null
                if (-not $allMoves.Contains($mname)) {
                    $allMoves[$mname] = @{ name=$mname; power=$mpower; cost=$mcost; category=$mcat; type=$mtype; icon=$micon; note=$mnote }
                }
            }
        }
    }
    $creatureMoveMap[$name] = $movesForThis.ToArray()
    Write-Host "Parsed ${name}: $($movesForThis.Count) moves"
}

Write-Host "Total unique moves: $($allMoves.Count)"
$newMoveKeys = $allMoves.Keys | Where-Object { -not $existingIds.ContainsKey($_) }
Write-Host "New moves: $($($newMoveKeys | Measure-Object).Count)"

# Output new moves grouped by type
$outLines = [System.Collections.Generic.List[string]]::new()
$outLines.Add("=== NEW MOVES ===")
foreach ($id in $newMoveKeys) {
    $m = $allMoves[$id]
    $iconPath = "assets/icons/moves/$($m.name).png"
    $noteField = if ($m.note) { ", note: `"$($m.note)`"" } else { "" }
    $js = "  { id: `"$($m.name)`", name: `"$($m.name)`", power: $($m.power), cost: $($m.cost), category: `"$($m.category)`", type: `"$($m.type)`", icon: `"${iconPath}`"${noteField} },"
    $outLines.Add("TYPE:$($m.type)|$js")
}
$outLines.Add("=== CREATURE MOVES ===")
foreach ($cname in $allCreatures) {
    $ids = $creatureMoveMap[$cname] -join '", "'
    $outLines.Add("${cname}|`"${ids}`"")
}
[System.IO.File]::WriteAllLines("D:\DmgCalculator\scripts\regional-output.txt", $outLines, [System.Text.Encoding]::UTF8)
Write-Host "Output written to regional-output.txt"