Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\USER\.gemini\antigravity\brain\c6e78cfa-f096-4b7a-b258-98dd335ec3a9\.user_uploaded\media_1791455907629_99b57f14.jpg"
if (-not (Test-Path $sourcePath)) {
    Write-Error "Source image not found at $sourcePath"
    exit 1
}

$sourceImg = [System.Drawing.Image]::FromFile($sourcePath)

function Resize-Image {
    param (
        [System.Drawing.Image]$Image,
        [int]$Width,
        [int]$Height,
        [string]$DestinationPath
    )
    $dir = Split-Path $DestinationPath -Parent
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $destBitmap = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($destBitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.DrawImage($Image, 0, 0, $Width, $Height)
    $graphics.Dispose()

    $destBitmap.Save($DestinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBitmap.Dispose()
    Write-Host "Created: $DestinationPath ($Width x $Height)"
}

function Create-AdaptiveForeground {
    param (
        [System.Drawing.Image]$Image,
        [int]$CanvasSize,
        [string]$DestinationPath
    )
    $dir = Split-Path $DestinationPath -Parent
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $destBitmap = New-Object System.Drawing.Bitmap($CanvasSize, $CanvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($destBitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $graphics.Clear([System.Drawing.Color]::Transparent)
    # Safe zone for Android adaptive icons is center 66% - 72%
    $logoSize = [int]($CanvasSize * 0.72)
    $offset = [int](($CanvasSize - $logoSize) / 2)

    $graphics.DrawImage($Image, $offset, $offset, $logoSize, $logoSize)
    $graphics.Dispose()

    $destBitmap.Save($DestinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBitmap.Dispose()
    Write-Host "Created Adaptive Foreground: $DestinationPath ($CanvasSize x $CanvasSize, logo: $logoSize)"
}

function Create-SplashScreen {
    param (
        [System.Drawing.Image]$Image,
        [int]$Width,
        [int]$Height,
        [string]$DestinationPath
    )
    $dir = Split-Path $DestinationPath -Parent
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $destBitmap = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($destBitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    # Dark background matching app theme (#0B0E14)
    $bgColor = [System.Drawing.ColorTranslator]::FromHtml("#0B0E14")
    $graphics.Clear($bgColor)

    # Scale logo nicely in center
    $minDim = [Math]::Min($Width, $Height)
    $logoSize = [int]($minDim * 0.45)
    $offsetX = [int](($Width - $logoSize) / 2)
    $offsetY = [int](($Height - $logoSize) / 2)

    $graphics.DrawImage($Image, $offsetX, $offsetY, $logoSize, $logoSize)
    $graphics.Dispose()

    $destBitmap.Save($DestinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBitmap.Dispose()
    Write-Host "Created Splash Screen: $DestinationPath ($Width x $Height)"
}

Write-Host "--- Generating Web / PWA Assets ---"
Resize-Image $sourceImg 512 512 "E:\gold-bullion-rates\public\logo.png"
Resize-Image $sourceImg 64 64 "E:\gold-bullion-rates\public\favicon.png"
Resize-Image $sourceImg 32 32 "E:\gold-bullion-rates\public\favicon-32x32.png"
Resize-Image $sourceImg 180 180 "E:\gold-bullion-rates\public\apple-touch-icon.png"

# Copy high-res source to src/assets as well
$srcAssetsDir = "E:\gold-bullion-rates\src\assets"
if (-not (Test-Path $srcAssetsDir)) { New-Item -ItemType Directory -Path $srcAssetsDir -Force | Out-Null }
Resize-Image $sourceImg 512 512 "$srcAssetsDir\logo.png"

Write-Host "`n--- Generating Android Mipmap Launcher Icons ---"
$densities = @(
    @{ Name = "mipmap-mdpi"; Size = 48; FgSize = 108 },
    @{ Name = "mipmap-hdpi"; Size = 72; FgSize = 162 },
    @{ Name = "mipmap-xhdpi"; Size = 96; FgSize = 216 },
    @{ Name = "mipmap-xxhdpi"; Size = 144; FgSize = 324 },
    @{ Name = "mipmap-xxxhdpi"; Size = 192; FgSize = 432 }
)

foreach ($d in $densities) {
    $dir = "E:\gold-bullion-rates\android\app\src\main\res\$($d.Name)"
    Resize-Image $sourceImg $d.Size $d.Size "$dir\ic_launcher.png"
    Resize-Image $sourceImg $d.Size $d.Size "$dir\ic_launcher_round.png"
    Create-AdaptiveForeground $sourceImg $d.FgSize "$dir\ic_launcher_foreground.png"
}

Write-Host "`n--- Generating Android Splash Screens ---"
$splashes = @(
    @{ Path = "drawable\splash.png"; W = 480; H = 320 },
    @{ Path = "drawable-land-mdpi\splash.png"; W = 480; H = 320 },
    @{ Path = "drawable-land-hdpi\splash.png"; W = 800; H = 480 },
    @{ Path = "drawable-land-xhdpi\splash.png"; W = 1280; H = 720 },
    @{ Path = "drawable-land-xxhdpi\splash.png"; W = 1600; H = 960 },
    @{ Path = "drawable-land-xxxhdpi\splash.png"; W = 1920; H = 1280 },
    @{ Path = "drawable-port-mdpi\splash.png"; W = 320; H = 480 },
    @{ Path = "drawable-port-hdpi\splash.png"; W = 480; H = 800 },
    @{ Path = "drawable-port-xhdpi\splash.png"; W = 720; H = 1280 },
    @{ Path = "drawable-port-xxhdpi\splash.png"; W = 960; H = 1600 },
    @{ Path = "drawable-port-xxxhdpi\splash.png"; W = 1280; H = 1920 }
)

foreach ($s in $splashes) {
    Create-SplashScreen $sourceImg $s.W $s.H "E:\gold-bullion-rates\android\app\src\main\res\$($s.Path)"
}

$sourceImg.Dispose()
Write-Host "`n[SUCCESS] All app logo and launcher icon assets successfully generated!"
