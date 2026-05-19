<#
.SYNOPSIS
    从下载好的精灵 wiki HTML 中提取全部精灵数据。

.PARAMETER Name
    精灵名称，HTML 文件必须已存在于 D:\DmgCalculator\temp\<Name>.html

.EXAMPLE
    .\parse-creature.ps1 圣羽翼王
#>
param([Parameter(Mandatory)][string]$Name)

$htmlPath = "D:\DmgCalculator\temp\$Name.html"
if (-not (Test-Path $htmlPath)) {
    Write-Error "HTML file not found: $htmlPath"
    exit 1
}
$html = Get-Content $htmlPath -Raw -Encoding UTF8

# ════════════════════════════════════════════════════════════
# 辅助：清洗技能特效文字，去除纯伤害描述
# ════════════════════════════════════════════════════════════
function Clean-Note([string]$raw) {
    if ([string]::IsNullOrWhiteSpace($raw)) { return "" }

    # 若整条内容就是纯伤害描述，直接返回空
    $purePhrases = @(
        '^对敌方精灵造成物理伤害。?$',
        '^对敌方精灵造成魔法伤害。?$',
        '^对敌方造成物理伤害。?$',
        '^对敌方造成魔法伤害。?$',
        '^造成物理伤害。?$',
        '^造成魔法伤害。?$',
        '^造成物伤。?$',
        '^造成魔伤。?$'
    )
    foreach ($p in $purePhrases) { if ($raw -match $p) { return "" } }

    # 去除结尾的纯伤害短语（如"蓄力，对敌方造成魔法伤害。"→"蓄力"）
    $raw = $raw -replace '[，,]对敌方精灵造成物理伤害。?$', ''
    $raw = $raw -replace '[，,]对敌方精灵造成魔法伤害。?$', ''
    $raw = $raw -replace '[，,]对敌方造成物理伤害。?$', ''
    $raw = $raw -replace '[，,]对敌方造成魔法伤害。?$', ''

    # 去除开头的纯伤害前缀（如"造成物伤，迅捷。"→"迅捷"）
    $raw = $raw -replace '^造成物伤[，,]',                    ''
    $raw = $raw -replace '^造成魔伤[，,]',                    ''
    $raw = $raw -replace '^造成物理伤害[，,]',                ''
    $raw = $raw -replace '^造成魔法伤害[，,]',                ''
    $raw = $raw -replace '^对敌方精灵造成物理伤害[，,]',      ''
    $raw = $raw -replace '^对敌方精灵造成魔法伤害[，,]',      ''

    # 去掉结尾的句号，去空格
    return ($raw -replace '。$', '').Trim()
}

# ════════════════════════════════════════════════════════════
# 1. 名称 & 编号
#    格式：<div class="rocom_sprite_grament_name ..."><p>NO152.圣羽翼王</p></div>
#    页面上存在两处渲染，第二处含 "NO" 前缀，以此为准
# ════════════════════════════════════════════════════════════
$creatureNo   = "?"
$creatureName = $Name
if ($html -match '<div class="rocom_sprite_grament_name[^"]*"><p>NO(\d+)\.([^<]+)</p>') {
    $creatureNo   = $Matches[1]
    $creatureName = $Matches[2].Trim()
}

# ════════════════════════════════════════════════════════════
# 2. 属性 & 属性图标
#    格式：<div class="rocom_sprite_grament_attributes ...">
#            <li>
#              <img alt="图标 宠物 属性 翼.png" src="URL" .../>
#              <div class="rocom_sprite_grament_attributes_text"><p>翼</p></div>
#            </li>
#          </div>
#          <div class="rocom_sprite_grament_img">   ← 属性块紧接图片块
#    策略：截取第一个 rocom_sprite_grament_img 之前的 HTML，
#          在其中匹配所有 alt="图标 宠物 属性 X.png"（避免污染自技能区）
# ════════════════════════════════════════════════════════════
$types        = [System.Collections.Generic.List[string]]::new()
$typeIconUrls = @{}

$imgDivPos  = $html.IndexOf('rocom_sprite_grament_img')
$beforeImg  = if ($imgDivPos -gt 0) { $html.Substring(0, $imgDivPos) } else { $html }

$typeMatches = [regex]::Matches($beforeImg, 'alt="图标 宠物 属性 ([^.]+)\.png" src="([^"]+)"')
foreach ($m in $typeMatches) {
    $t = $m.Groups[1].Value.Trim()
    $u = $m.Groups[2].Value
    if (-not $types.Contains($t)) {
        $types.Add($t)
        $typeIconUrls[$t] = $u
    }
}

# ════════════════════════════════════════════════════════════
# 3. 精灵立绘图片
#    格式：<img alt="页面 宠物 立绘 圣羽翼王 1.png" src="URL" .../>
#    浏览器另存时 src 为本地路径 _files/HASH.png → 输出 LOCAL:HASH.png
# ════════════════════════════════════════════════════════════
$creatureImg = "?"
if ($html -match 'alt="页面 宠物 立绘[^"]*" src="(https://patchwiki[^"]+)"') {
    $creatureImg = $Matches[1]
} elseif ($html -match 'alt="页面 宠物 立绘[^"]*" src="[^"]*_files/([^"]+)"') {
    $creatureImg = "LOCAL:" + $Matches[1]
}

# ════════════════════════════════════════════════════════════
# 4. 特性
#    格式：<p class="rocom_sprite_info_characteristic_title ...">飓风</p>
#          <p class="rocom_sprite_info_characteristic_text  ...">描述</p>
#          图标：rocom_sprite_info_characteristic_content_icon 内 <img alt="飓风" src="URL">
# ════════════════════════════════════════════════════════════
$abilityName = "?"
$abilityDesc = ""
$abilityIcon = "?"

if ($html -match '(?s)<div class="rocom_sprite_info_characteristic_content">(.+?)</div>\s*</div>') {
    $abilityBlock = $Matches[1]
    if ($abilityBlock -match '<p class="rocom_sprite_info_characteristic_title[^"]*">([^<]+)</p>') {
        $abilityName = $Matches[1].Trim()
    }
    if ($abilityBlock -match '<p class="rocom_sprite_info_characteristic_text[^"]*">([^<]+)</p>') {
        $abilityDesc = $Matches[1].Trim()
    }
    if ($abilityBlock -match 'alt="[^"]*" src="(https://patchwiki[^"]+)"') {
        $abilityIcon = $Matches[1]
    } elseif ($abilityBlock -match 'alt="[^"]*" src="[^"]*_files/([^"]+)"') {
        $abilityIcon = "LOCAL:" + $Matches[1]
    }
}

# ════════════════════════════════════════════════════════════
# 5. 种族值
#    格式：<p class="rocom_sprite_info_qualification_name">生命</p>
#           ...
#          <p class="rocom_sprite_info_qualification_value">132</p>
#    顺序固定：生命→物攻→魔攻→物防→魔防→速度
# ════════════════════════════════════════════════════════════
$statKeyMap = @{ '生命'='hp'; '物攻'='atk'; '魔攻'='spatk'; '物防'='def'; '魔防'='spdef'; '速度'='spd' }
$stats = @{}

$statMatches = [regex]::Matches(
    $html,
    '(?s)<p class="rocom_sprite_info_qualification_name">([^<]+)</p>.+?<p class="rocom_sprite_info_qualification_value">(\d+)</p>'
)
foreach ($m in $statMatches) {
    $label = $m.Groups[1].Value.Trim()
    if ($statKeyMap.ContainsKey($label)) {
        $key = $statKeyMap[$label]
        if (-not $stats.ContainsKey($key)) { $stats[$key] = $m.Groups[2].Value }
    }
}

# ════════════════════════════════════════════════════════════
# 5. 技能列表
#    找到第一段技能区（含 rocom_sprite_skillName），
#    以 rocom_sprite_temp_classGrow_box 为结束标记，避免解析重复渲染
# ════════════════════════════════════════════════════════════
$catMap = @{ '物攻'='physical'; '魔攻'='special'; '防御'='defense'; '状态'='status' }

$lines = $html -split "`n"
$sStart = -1; $sEnd = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($sStart -eq -1 -and $lines[$i] -match 'rocom_sprite_skillName') {
        $sStart = [Math]::Max(0, $i - 10)
    }
    if ($sStart -ne -1 -and $lines[$i] -match 'rocom_sprite_temp_classGrow_box') {
        $sEnd = $i; break
    }
}

$skillSection = if ($sStart -ge 0 -and $sEnd -gt $sStart) {
    ($lines[$sStart..$sEnd]) -join "`n"
} else { "" }

$skillBlocks = $skillSection -split '<div class="rocom_sprite_skill_box">' | Select-Object -Skip 1

# ════════════════════════════════════════════════════════════
# 输出
# ════════════════════════════════════════════════════════════
Write-Host "NAME: $creatureName"
Write-Host "NO: $creatureNo"
Write-Host "TYPES: $($types -join ', ')"
Write-Host "STATS: hp=$($stats['hp']) atk=$($stats['atk']) spatk=$($stats['spatk']) def=$($stats['def']) spdef=$($stats['spdef']) spd=$($stats['spd'])"
Write-Host "CREATURE_IMAGE: $creatureImg"
foreach ($t in $types) {
    Write-Host "TYPE_ICON_${t}: $($typeIconUrls[$t])"
}
Write-Host "ABILITY: $abilityName"
Write-Host "ABILITY_DESC: $abilityDesc"
Write-Host "ABILITY_ICON: $abilityIcon"
Write-Host ""
Write-Host "MOVES:"
foreach ($block in $skillBlocks) {
    if ($block -notmatch '<div class="rocom_sprite_skillName[^"]*">([^<]+)</div>') { continue }
    $sname = $Matches[1].Trim()

    $power  = if ($block -match '<div class="rocom_sprite_skill_power[^"]*">(\d+)</div>') { $Matches[1] } else { "0" }
    $cost   = if ($block -match '<div class="rocom_sprite_skillDamage[^"]*">[^>]*>(\d+)</div>') { $Matches[1] } else { "0" }
    $attr   = if ($block -match 'alt="图标 宠物 属性 ([^.]+)\.png"') { $Matches[1] } else { "普通" }
    $catRaw = if ($block -match 'alt="图标 技能 类别 ([^.]+)\.png"') { $Matches[1] } else { "状态" }
    $cat    = if ($catMap.ContainsKey($catRaw)) { $catMap[$catRaw] } else { "status" }

    $icon = "?"
    if ($block -match 'alt="技能图标[^"]*" src="(https://patchwiki[^"]+)"') {
        $icon = $Matches[1]
    } elseif ($block -match 'alt="技能图标[^"]*" src="[^"]*_files/([^"]+)"') {
        $icon = "LOCAL:" + $Matches[1]
    }

    $note = ""
    if ($block -match '<div class="rocom_sprite_skillContent[^"]*">✦([^<]+)</div>') {
        $note = Clean-Note $Matches[1].Trim()
    }

    Write-Host "$sname | $attr | $power | $cost | $cat | $icon | $note"
}
