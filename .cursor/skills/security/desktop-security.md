# Desktop & Electron Security

## Electron Security
- Disable nodeIntegration in renderer processes
- Enable contextIsolation
- Use contextBridge for secure IPC
- Validate all IPC messages (treat renderer as untrusted)

```javascript
// main.js — secure defaults
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: path.join(__dirname, 'preload.js')
  }
})
```

## Code Signing
- Sign all desktop app distributions
- Use notarization on macOS
- Verify signatures on auto-updates

## Auto-Update Security
- Verify update signatures before installing
- Use HTTPS for update server
- Implement rollback capability
- Test updates in staging before rolling out

## Local Data Storage
- Encrypt sensitive local data (keychain/credential store)
- Don't store secrets in plain files
- Clear sensitive data from memory when no longer needed
- Use OS credential stores (Keychain, Windows Credential Manager)
