# Упаковка папок Resources лабораторных работ в ZIP-архивы для сайта.
#
# Исходники пособий лежат рядом с репозиторием — в папках вида
# «МКВС.26 - ЛРN», у каждой есть подпапка Resources с файлами, которые
# нужны студенту при выполнении работы. GitHub Pages отдаёт только то,
# что попало в public/, поэтому Resources пакуются в архив и кладутся
# в content/labNN/resources/ — оттуда Quartz копирует их как обычный ассет,
# а на странице работы стоит кнопка скачивания.
#
# PDF в архив не попадают: все документы пособий собраны на общей странице
# content/docs/index.md и открываются в браузере, без скачивания и распаковки.
# Добавляя PDF в Resources, положите его копию в content/docs/ и опишите на
# той странице; в архиве работы остаются только файлы для проекта.
#
# Запуск (из любой папки):
#   powershell -ExecutionPolicy Bypass -File tools/pack-resources.ps1
#
# Скрипт перезаписывает архивы целиком, поэтому его достаточно прогнать
# после любого изменения в исходных папках Resources.

[CmdletBinding()]
param(
    # Папка, в которой лежат «МКВС.26 - ЛРN». По умолчанию — родительская
    # для репозитория сайта.
    [string]$LabsRoot,

    # Папка content/ сайта.
    [string]$ContentRoot
)

$ErrorActionPreference = 'Stop'

# $PSScriptRoot в блоке param() пуст, поэтому пути по умолчанию считаем здесь.
$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not $LabsRoot) { $LabsRoot = (Resolve-Path (Split-Path -Parent $repoRoot)).Path }
if (-not $ContentRoot) { $ContentRoot = (Resolve-Path (Join-Path $repoRoot 'content')).Path }

# Папка работы опознаётся не по имени (оно кириллическое и может меняться),
# а по наличию подпапки Resources; номер работы берётся из хвоста имени.
$labDirs = Get-ChildItem -LiteralPath $LabsRoot -Directory |
    Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'Resources') } |
    Where-Object { $_.Name -match '(\d+)\s*$' }

if (-not $labDirs) {
    Write-Warning "В '$LabsRoot' не найдено папок лабораторных работ с подпапкой Resources."
    return
}

Add-Type -AssemblyName System.IO.Compression.FileSystem

foreach ($labDir in $labDirs) {
    $null = $labDir.Name -match '(\d+)\s*$'
    $labNumber = [int]$Matches[1]
    $labSlug = 'lab{0:D2}' -f $labNumber

    # Работы, для которых страниц на сайте ещё нет, пропускаем.
    $pageDir = Join-Path $ContentRoot $labSlug
    if (-not (Test-Path -LiteralPath $pageDir)) {
        Write-Host "$($labDir.Name): страницы $labSlug ещё нет - пропущено."
        continue
    }

    $sourceDir = (Resolve-Path -LiteralPath (Join-Path $labDir.FullName 'Resources')).Path
    $outputDir = Join-Path $pageDir 'resources'
    $archive = Join-Path $outputDir ('mkvs-26-lr{0}-resources.zip' -f $labNumber)

    # Документы работы живут на общей странице content/docs, в архив идут
    # только файлы для проекта.
    $files = Get-ChildItem -LiteralPath $sourceDir -Recurse -File |
        Where-Object { $_.Extension -ne '.pdf' } |
        Sort-Object FullName

    if (Test-Path -LiteralPath $archive) { Remove-Item -LiteralPath $archive -Force }
    if (-not $files) {
        Write-Host "$($labDir.Name): кроме PDF в Resources ничего нет - архив не нужен."
        continue
    }

    # Внутри архива файлы лежат в папке с именем работы: распакованные
    # архивы разных работ не сливаются в одну кучу «Resources».
    $entryRoot = '{0} - Resources' -f $labDir.Name

    $null = New-Item -ItemType Directory -Path $outputDir -Force

    # Compress-Archive в Windows PowerShell 5.1 пишет имена элементов с
    # обратной косой чертой; такой архив корректно распаковывается только в
    # Windows. Поэтому архив собирается вручную, с разделителем «/» по
    # спецификации ZIP - он открывается и в Windows, и в Linux, и в macOS.
    $zip = [System.IO.Compression.ZipFile]::Open($archive, 'Create')
    try {
        foreach ($file in $files) {
            $relative = $file.FullName.Substring($sourceDir.Length).TrimStart([System.IO.Path]::DirectorySeparatorChar)
            $entryName = $entryRoot + '/' + $relative.Replace([System.IO.Path]::DirectorySeparatorChar, '/')
            $null = [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                $zip, $file.FullName, $entryName, [System.IO.Compression.CompressionLevel]::Optimal)
        }
    }
    finally {
        $zip.Dispose()
    }

    $sizeKb = [math]::Round((Get-Item -LiteralPath $archive).Length / 1KB)
    Write-Host ("{0}: {1} файлов -> {2} ({3} КБ)" -f $labDir.Name, @($files).Count, $archive, $sizeKb)
}
