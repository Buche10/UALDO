# Script de generacion de iconos y pantallas de inicio para Android
# Usa .NET System.Drawing nativo sin dependencias externas de npm.
# Colores: Fondo oficial de marca #1d1d1b e isotipo docs/brand-assets/ualdo-isotipo.png

Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\docs\brand-assets\ualdo-isotipo.png"
$srcImg = [System.Drawing.Image]::FromFile($srcPath)
$brandBg = [System.Drawing.Color]::FromArgb(255, 0x1d, 0x1d, 0x1b)

function Save-Image {
    param(
        [System.Drawing.Bitmap]$bmp,
        [string]$destPath
    )
    $dir = [System.IO.Path]::GetDirectoryName($destPath)
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    if (Test-Path $destPath) {
        Remove-Item -Path $destPath -Force
    }
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
}

function New-ForegroundIcon {
    param([int]$size, [string]$outPath)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    # Safe zone ~ 62% del lienzo
    $targetSize = [math]::Round($size * 0.62)
    $aspect = $srcImg.Width / $srcImg.Height
    if ($aspect -gt 1) {
        $w = $targetSize
        $h = [math]::Round($targetSize / $aspect)
    } else {
        $h = $targetSize
        $w = [math]::Round($targetSize * $aspect)
    }
    $x = [math]::Round(($size - $w) / 2)
    $y = [math]::Round(($size - $h) / 2)
    $g.DrawImage($srcImg, $x, $y, $w, $h)
    $g.Dispose()

    Save-Image $bmp $outPath
    $bmp.Dispose()
}

function New-LauncherIcon {
    param([int]$size, [string]$outPath, [bool]$isRound = $false)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $brush = New-Object System.Drawing.SolidBrush($brandBg)
    if ($isRound) {
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddEllipse(0, 0, $size, $size)
        $g.FillPath($brush, $path)
        $g.SetClip($path)
        $path.Dispose()
    } else {
        # Squircle / rounded rect suave
        $corner = [math]::Round($size * 0.18)
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $d = $corner * 2
        $path.AddArc(0, 0, $d, $d, 180, 90)
        $path.AddArc($size - $d, 0, $d, $d, 270, 90)
        $path.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
        $path.AddArc(0, $size - $d, $d, $d, 90, 90)
        $path.CloseFigure()
        $g.FillPath($brush, $path)
        $g.SetClip($path)
        $path.Dispose()
    }
    $brush.Dispose()

    # Isotipo centrado ~ 70% del tamano
    $targetSize = [math]::Round($size * 0.70)
    $aspect = $srcImg.Width / $srcImg.Height
    if ($aspect -gt 1) {
        $w = $targetSize
        $h = [math]::Round($targetSize / $aspect)
    } else {
        $h = $targetSize
        $w = [math]::Round($targetSize * $aspect)
    }
    $x = [math]::Round(($size - $w) / 2)
    $y = [math]::Round(($size - $h) / 2)
    $g.DrawImage($srcImg, $x, $y, $w, $h)
    $g.Dispose()

    Save-Image $bmp $outPath
    $bmp.Dispose()
}

function New-Splash {
    param([int]$width, [int]$height, [string]$outPath)
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear($brandBg)

    # Isotipo centrado con escala ~ 35% del lado menor
    $minDim = [math]::Min($width, $height)
    $targetSize = [math]::Round($minDim * 0.35)
    $aspect = $srcImg.Width / $srcImg.Height
    if ($aspect -gt 1) {
        $w = $targetSize
        $h = [math]::Round($targetSize / $aspect)
    } else {
        $h = $targetSize
        $w = [math]::Round($targetSize * $aspect)
    }
    $x = [math]::Round(($width - $w) / 2)
    $y = [math]::Round(($height - $h) / 2)
    $g.DrawImage($srcImg, $x, $y, $w, $h)
    $g.Dispose()

    Save-Image $bmp $outPath
    $bmp.Dispose()
}

$resDir = Join-Path $PSScriptRoot "..\android\app\src\main\res"

# 1. Iconos mipmap
$densities = @(
    @{ Name = "mipmap-mdpi";    Icon = 48;  Fg = 108 },
    @{ Name = "mipmap-hdpi";    Icon = 72;  Fg = 162 },
    @{ Name = "mipmap-xhdpi";   Icon = 96;  Fg = 216 },
    @{ Name = "mipmap-xxhdpi";  Icon = 144; Fg = 324 },
    @{ Name = "mipmap-xxxhdpi"; Icon = 192; Fg = 432 }
)

foreach ($d in $densities) {
    $dir = Join-Path $resDir $d.Name
    New-ForegroundIcon -size $d.Fg -outPath (Join-Path $dir "ic_launcher_foreground.png")
    New-LauncherIcon -size $d.Icon -outPath (Join-Path $dir "ic_launcher.png") -isRound $false
    New-LauncherIcon -size $d.Icon -outPath (Join-Path $dir "ic_launcher_round.png") -isRound $true
}

# 2. Pantallas de inicio (splash)
$splashes = @(
    @{ Dir = "drawable";               W = 480;  H = 800 },
    @{ Dir = "drawable-land-mdpi";     W = 480;  H = 320 },
    @{ Dir = "drawable-land-hdpi";     W = 800;  H = 480 },
    @{ Dir = "drawable-land-xhdpi";    W = 1280; H = 720 },
    @{ Dir = "drawable-land-xxhdpi";   W = 1600; H = 960 },
    @{ Dir = "drawable-land-xxxhdpi";  W = 1920; H = 1280 },
    @{ Dir = "drawable-port-mdpi";     W = 320;  H = 480 },
    @{ Dir = "drawable-port-hdpi";     W = 480;  H = 800 },
    @{ Dir = "drawable-port-xhdpi";    W = 720;  H = 1280 },
    @{ Dir = "drawable-port-xxhdpi";   W = 960;  H = 1600 },
    @{ Dir = "drawable-port-xxxhdpi";  W = 1280; H = 1920 }
)

foreach ($s in $splashes) {
    $out = Join-Path (Join-Path $resDir $s.Dir) "splash.png"
    New-Splash -width $s.W -height $s.H -outPath $out
}

$srcImg.Dispose()
Write-Output "Iconos y splash generados exitosamente con la marca Ualdo."
