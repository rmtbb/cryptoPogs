# CORS Issues

## CoinGecko Image Color Extraction

### Issue
The landing page attempts to extract average color from coin logos using canvas:
```javascript
ctx.getImageData(0, 0, 1, 1)
```

However, CoinGecko images are cross-origin, and CORS blocks pixel data extraction.

### Solution
The code catches the security error and falls back to white:
```javascript
try {
  const cornerPixels = [
    ctx.getImageData(0, 0, 1, 1).data,
    // ...
  ];
  // Calculate average
} catch (e) {
  // CORS blocked - fallback to white
  resolve('rgb(255,255,255)');
}
```

## GitHub Raw Image URLs

### Issue
GitHub blob URLs may have CORS restrictions depending on how they're accessed.

### Solution
Use the `?raw=true` parameter to get actual file content:
```
https://github.com/USER/REPO/blob/main/FILE?raw=true
```

Or use raw.githubusercontent.com:
```
https://raw.githubusercontent.com/USER/REPO/main/FILE
```

## CoinGecko API

The CoinGecko API generally allows CORS for public endpoints. If you encounter issues:
- Check rate limiting (may return errors)
- Ensure using HTTPS
- Consider server-side proxy for production

## Related Articles

- [[landing-page]]
- [[external-apis]]
