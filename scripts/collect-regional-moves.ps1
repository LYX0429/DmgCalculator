# Collect all moves from 39 regional forms, find new ones vs moves.js
$movesJs = Get-Content "D:\DmgCalculator\data\moves.js" -Raw -Encoding UTF8
$existingIds = @{}
$idMatches = [regex]::Matches($movesJs, 'id:\s*"([^"]+)"')
foreach ($m in $idMatches) { $existingIds[$m.Groups[1].Value] = $true }
Write-Host "Existing move IDs: $($existingIds.Count)"

$allCreatures = @(
    "水泡壳（蜕皮时的样子）", "岚鸟（夏天的样子）", "岚鸟（秋天的样子）",
    "石冠王蜥（球球尾巴的样子）", "化蝶（幽冥眼的样子）", "化蝶（喵喵的样子）",
    "化蝶（奇丽花的样子）", "晶石蜗（莲花刚玉的样子）", "晶石蜗（星彩榴石的样子）",
    "晶石蜗（火山琉璃的样子）", "晶石蜗（蓝锥矿的样子）", "晶石蜗（烧蓝黄金的样子）",
    "卡瓦重（沙地附近的样子）", "卡瓦重（雪山附近的样子）", "幽冥眼（闭眼的样子）",
    "蹦蹦花（彩玉球形态）", "蹦蹦花（短毛球形态）", "蹦蹦花（象牙球形态）",
    "千棘盔（磨损的样子）", "星光狮（月光能量的样子）", "风滚暮虫（枯叶的样子）",
    "嗜波螺（被污染的样子）", "棋骑士（黑子）", "棋齐垒（黑子）",
    "棋祈督（黑子）", "棋绮后（黑子）", "海枝枝（杏黄百合）",
    "海枝枝（洋红沙丁）", "海枝枝（翠绿纶布）",
    "圣代甜甜（樱桃草莓口味）", "圣代甜甜（樱桃抹茶口味）", "圣代甜甜（蓝莓巧克力口味）",
    "圣代甜甜（蓝莓草莓口味）", "圣代甜甜（蓝莓抹茶口味）", "圣代甜甜（杨桃巧克力口味）",
    "圣代甜甜（杨桃草莓口味）", "圣代甜甜（杨桃抹茶口味）",
    "月亮砣（下弦的样子）", "乌拉塔（极夜的样子）"
)

# Ordered dict: id -> {name,power,cost,category,type,icon,note}
$allMoves = [System.Collections.Specialized.OrderedDictionary]::new()
# Per-creature learnable move lists
$creatureMoveMap = @{}

foreach ($name in $allCreatures) {
    $output = powershell -ExecutionPolicy Bypass -File "D:\DmgCalculator\scripts\parse-creature.ps1" -Name "$name"
    $inMoves = $false
    $movesForThis = [System.Collections.Generic.List[string]]::new()
    foreach ($line in $output) {
        if ($line -eq "MOVES:") { $inMoves = $true; continue }
        if ($inMoves -and $line -match "^(.+?) \| (.+?) \| (\d+) \| (\d+) \| (\w+) \| (.+?) \| (.*)$") {
            $mname = $Matches[1].Trim()
            $mtype = $Matches[2].Trim()
            $mpower = [int]$Matches[3]
            $mcost = [int]$Matches[4]
            $mcat = $Matches[5].Trim()
            $micon = $Matches[6].Trim()
            $mnote = $Matches[7].Trim()
            $movesForThis.Add($mname) | Out-Null
            if (-not $allMoves.Contains($mname)) {
                $allMoves[$mname] = @{
                    name=$mname; power=$mpower; cost=$mcost
                    category=$mcat; type=$mtype; icon=$micon; note=$mnote
                }
            }
        }
    }
    $creatureMoveMap[$name] = $movesForThis.ToArray()
    Write-Host "  Parsed ${name}: $($movesForThis.Count) moves"
}

Write-Host ""
Write-Host "Total unique moves across all 39: $($allMoves.Count)"

$newMoves = $allMoves.Keys | Where-Object { -not $existingIds.ContainsKey($_) }
Write-Host "New moves to add: $($($newMoves | Measure-Object).Count)"
Write-Host ""
Write-Host "=== NEW MOVES ==="
foreach ($id in $newMoves) {
    $m = $allMoves[$id]
    $iconPath = "assets/icons/moves/$($m.name).png"
    $noteField = if ($m.note) { ", note: `"$($m.note)`"" } else { "" }
    $line = "  { id: `"$($m.name)`", name: `"$($m.name)`", power: $($m.power), cost: $($m.cost), category: `"$($m.category)`", type: `"$($m.type)`", icon: `"${iconPath}`"${noteField} },"
    Write-Host "TYPE:$($m.type)|$line"
}
Write-Host ""
Write-Host "=== CREATURE MOVES ==="
foreach ($cname in $allCreatures) {
    $ids = $creatureMoveMap[$cname] -join '", "'
    Write-Host "${cname}|`"${ids}`""
}
