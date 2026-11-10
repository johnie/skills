## Summary

This PR significantly improves the performance and reliability of the image upload flow by introducing client-side compression before upload. This is a crucial enhancement that will dramatically reduce upload times and greatly improve the experience for users on slow connections.

## Details

Images larger than 2 MB are now resized to a maximum of 2048px on the longest edge and re-encoded as JPEG at quality 0.85 using the browser's canvas API, via the new `compressImage()` helper in `upload/compress.ts`. HEIC files are passed through unchanged since canvas can't decode them in most browsers. The change has been thoroughly tested and should work across all major browsers.

## Impact

- Much faster uploads
- Reduced bandwidth and storage costs
- Improved user satisfaction
