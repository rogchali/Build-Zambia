# Minimal static file server for local testing (no Node/Python needed).
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\serve.ps1 [-Port 8765]
# Then open http://localhost:8765/  (game)  or  http://localhost:8765/tests/  (engine tests)
param([int]$Port = 8765)

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$types = @{
  ".html" = "text/html; charset=utf-8"; ".js" = "text/javascript; charset=utf-8";
  ".css" = "text/css; charset=utf-8"; ".json" = "application/json; charset=utf-8";
  ".webmanifest" = "application/manifest+json"; ".svg" = "image/svg+xml";
  ".png" = "image/png"; ".woff2" = "font/woff2"; ".txt" = "text/plain; charset=utf-8"
}
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/"
try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart("/")
    if ($path -eq "" -or $path.EndsWith("/")) { $path += "index.html" }
    $file = [System.IO.Path]::GetFullPath((Join-Path $root $path))
    $res = $ctx.Response
    if ($file.StartsWith($root) -and (Test-Path $file -PathType Leaf)) {
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $ext = [System.IO.Path]::GetExtension($file).ToLower()
      $res.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { "application/octet-stream" }
      $res.Headers.Add("Cache-Control", "no-cache")
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
    }
    $res.Close()
  }
} finally { $listener.Stop() }
