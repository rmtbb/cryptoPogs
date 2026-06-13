# Images

## Root Directory Images

| File | Purpose |
|------|---------|
| `favicon.png` | Browser tab icon |
| `favicon big.png` | Large favicon variant |
| `regpreview.png` | Open Graph preview image for social sharing |
| `home_screen_icon_180x180.png` | Apple touch icon (180px) |
| `home_screen_icon_192x192.png` | Android icon (192px) |
| `home_screen_icon_256x256.png` | High-res icon (256px) |
| `home_screen_icon_512x512.png` | PWA icon (512px) |

## External Images

Coin logos are loaded dynamically from CoinGecko's CDN:
```
https://assets.coingecko.com/coins/images/ID/large/NAME.png
```

## Usage

- Favicon/icons are referenced via GitHub raw URLs in HTML
- App icons used for PWA manifest
- Preview image used in Open Graph meta tags

## Related Articles

- [[landing-page]]
- [[old-files]]
