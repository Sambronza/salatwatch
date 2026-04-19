$languages = @(
    @{ id = "zh-tw"; mode = "round";  hijri = "14 RAMADAN 1447"; next = "下次禮拜:"; name = "晌禮"; p1 = "時禮"; p2 = "晌禮"; p3 = "憤禮" },
    @{ id = "zh-tw"; mode = "square"; hijri = "14 RAMADAN 1447"; next = "下次禮拜:"; name = "晌禮"; p1 = "時禮"; p2 = "晌禮"; p3 = "憤禮" },
    @{ id = "ru";    mode = "square"; hijri = "14 RAMADAN 1447"; next = "Следующий:";     name = "Зухр";  p1 = "Фаджр"; p2 = "Зухр";  p3 = "Аср" },
    @{ id = "tr";    mode = "square"; hijri = "14 RAMADAN 1447"; next = "Sonraki:";       name = "Öğle";  p1 = "Sabah"; p2 = "Öğle";  p3 = "İkindi" },
    @{ id = "ur";    mode = "square"; hijri = "14 RAMADAN 1447"; next = "اگلی:";          name = "ظہر";   p1 = "فجر";   p2 = "ظہر";   p3 = "عصر" }
)

$templatePath = "C:\zepp\premium_zh_tw.svg"
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$outDir = "C:\zepp\store_screenshots"

foreach ($lang in $languages) {
    $tempSvg = "C:\zepp\temp_$($lang.id)_$($lang.mode).svg"
    $content = Get-Content $templatePath -Raw
    
    # Replace contents (Simple replacement for batch)
    $content = $content -replace "14 RAMADAN 1447", $lang.hijri
    $content = $content -replace "&#x4E0B;&#x6B21;&#x79AE;&#x62DC;:", $lang.next
    $content = $content -replace "&#x664C;&#x79AE;", $lang.name
    $content = $content -replace "&#x6642;&#x79AE;", $lang.p1
    $content = $content -replace "&#x6124;&#x79AE;", $lang.p3
    
    # Handle square vs round
    if ($lang.mode -eq "square") {
        # Square screenshots can use the same frame but we might adjust the mask later if needed
    }

    Set-Content $tempSvg $content
    
    $outFile = Join-Path $outDir "screenshot_$($lang.mode)_$($lang.id).png"
    & $edgePath --headless --screenshot="$outFile" --window-size=360,360 --force-device-scale-factor=1 --hide-scrollbars --disable-gpu "file:///$tempSvg"
    
    Remove-Item $tempSvg
}
