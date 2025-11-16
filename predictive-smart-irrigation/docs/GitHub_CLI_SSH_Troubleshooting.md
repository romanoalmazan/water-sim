# GitHub CLI & SSH Troubleshooting (Windows)

## Troubleshooting gh (Windows)

**Issue**: gh commands are not running in powershell

**Solution**: Set path

### Option A – Permanently (recommended)
1. Press Win + R, type `sysdm.cpl`, press Enter
2. Go to Advanced → Environment Variables
3. Under "User variables" find Path → Edit
4. Add a new entry:
   ```
   C:\Users\ntang\AppData\Local\Programs\GitHub CLI
   ```
5. Click OK → OK → OK
6. Close and reopen PowerShell
7. Run:
   ```powershell
   gh --version
   ```
   You should now see:
   ```
   gh version 2.x.x
   ```

## Troubleshooting SSH (Windows, Powershell)

**Issue**: ssh config file is made, ssh Host is not showing up

**Solution**: set file type

### 1. Open your SSH config in a proper editor
In PowerShell:
```powershell
notepad $env:USERPROFILE\.ssh\config
```
(or open `C:\Users\ntang\.ssh\config` manually in Notepad / VS Code)

### 2. Save the file as UTF-8 (NOT UTF-16)

#### In Notepad
1. In Notepad, go to File → Save As…
2. At the bottom:
   - File name: `config`
   - Save as type: `All Files (*.*)`
   - Encoding: choose `UTF-8`
3. Save (overwrite the existing config in `C:\Users\ntang\.ssh\`)

**Important**: make sure it's literally named `config` with no `.txt` extension.
If needed, in File Explorer → View → show file extensions to verify it's just `config`.

#### In VS Code (if you prefer)
1. Open the file in VS Code
2. Bottom-right you'll see something like `UTF-16 LE` → click it
3. Select "Save with Encoding…"
4. Choose `UTF-8`
5. Save

Now the BOM (`\377\376`) is gone and ssh can parse the file.

### Windows Codespace Command
If your OS is windows, use this command:
```powershell
gh codespace ssh --config >> "$env:USERPROFILE\.ssh\config"
```
(instead of `gh codespace ssh --config >> ~/.ssh/config`)

Open the config file (`"$env:USERPROFILE\.ssh\config"`) in Notepad++
Change the encoding to "UTF-8"
Save the file
Retry your SSH command