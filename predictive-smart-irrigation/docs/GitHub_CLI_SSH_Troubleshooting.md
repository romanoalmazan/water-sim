# 🛠️ GitHub CLI & SSH Troubleshooting Guide for Windows

## Table of Contents
- [GitHub CLI Troubleshooting](#github-cli-troubleshooting)
- [SSH Configuration Troubleshooting](#ssh-configuration-troubleshooting)
- [Quick Reference Commands](#quick-reference-commands)

---

## 📋 GitHub CLI Troubleshooting

### ❌ **Issue**: `gh` commands are not running in PowerShell

**Symptoms:**
- PowerShell returns "command not found" or similar error
- `gh --version` doesn't work
- GitHub CLI is installed but not accessible

### ✅ **Solution**: Set PATH Environment Variable

#### **Option A: Permanently (Recommended)**

1. **Open System Properties**
   ```
   Press Win + R → type: sysdm.cpl → press Enter
   ```

2. **Navigate to Environment Variables**
   - Go to **Advanced** tab
   - Click **Environment Variables** button

3. **Edit User PATH Variable**
   - Under "User variables" section
   - Find **Path** → Click **Edit**

4. **Add GitHub CLI Path**
   - Click **New** and add:
   ```
   C:\Users\ntang\AppData\Local\Programs\GitHub CLI
   ```

5. **Apply Changes**
   - Click **OK** → **OK** → **OK**
   - Close and reopen PowerShell

6. **Verify Installation**
   ```powershell
   gh --version
   ```
   
   **Expected Output:**
   ```
   gh version 2.x.x
   ```

#### **Option B: Temporary (Session Only)**

If you need a quick fix for the current session:

```powershell
$env:PATH += ";C:\Users\ntang\AppData\Local\Programs\GitHub CLI"
gh --version
```

> ⚠️ **Note**: This only works for the current PowerShell session.

---

## 🔐 SSH Configuration Troubleshooting

### ❌ **Issue**: SSH config file exists but Host is not showing up

**Symptoms:**
- SSH config file is created but hosts aren't recognized
- `ssh <hostname>` doesn't work
- File appears to be ignored by SSH client

### ✅ **Solution**: Fix File Encoding

The most common cause is incorrect file encoding (UTF-16 instead of UTF-8).

#### **Method 1: Using Notepad (Built-in)**

1. **Open SSH Config File**
   ```powershell
   notepad $env:USERPROFILE\.ssh\config
   ```
   
   Or manually navigate to:
   ```
   C:\Users\ntang\.ssh\config
   ```

2. **Save with Correct Encoding**
   - In Notepad, go to **File** → **Save As...**
   - Set the following options:
     - **File name**: `config` (no extension)
     - **Save as type**: `All Files (*.*)`
     - **Encoding**: `UTF-8`
   - Click **Save** (overwrite existing file)

3. **Verify File Name**
   - Ensure the file is named exactly `config` with no `.txt` extension
   - In File Explorer → **View** → check "File name extensions" to verify

#### **Method 2: Using VS Code (Recommended)**

1. **Open Config in VS Code**
   ```powershell
   code $env:USERPROFILE\.ssh\config
   ```

2. **Change Encoding**
   - Look at bottom-right corner (you might see `UTF-16 LE`)
   - Click on the encoding indicator
   - Select **"Save with Encoding..."**
   - Choose **UTF-8**

3. **Save File**
   - Press `Ctrl + S` to save

#### **Method 3: Using PowerShell (Advanced)**

For GitHub Codespaces specifically:

```powershell
# Generate SSH config with proper encoding
gh codespace ssh --config >> "$env:USERPROFILE\.ssh\config"
```

Then follow Method 1 or 2 to fix encoding.

### 🔍 **Verification Steps**

1. **Check File Encoding**
   ```powershell
   Get-Content $env:USERPROFILE\.ssh\config -Encoding UTF8 | Select-Object -First 5
   ```

2. **Test SSH Configuration**
   ```powershell
   ssh -T git@github.com
   ```

3. **List Available SSH Hosts**
   ```powershell
   ssh -F $env:USERPROFILE\.ssh\config
   ```

---

## 🚀 Quick Reference Commands

### **GitHub CLI Commands**
```powershell
# Check version
gh --version

# Login to GitHub
gh auth login

# Create repository
gh repo create

# Clone with SSH
gh repo clone <owner>/<repo>

# List codespaces
gh codespace list

# SSH into codespace
gh codespace ssh
```

### **SSH Commands**
```powershell
# Test GitHub SSH connection
ssh -T git@github.com

# Check SSH config syntax
ssh -F $env:USERPROFILE\.ssh\config -T git@github.com

# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add SSH key to agent
ssh-add $env:USERPROFILE\.ssh\id_ed25519
```

### **File Path Commands**
```powershell
# Open SSH directory
explorer $env:USERPROFILE\.ssh

# Edit SSH config
notepad $env:USERPROFILE\.ssh\config

# View SSH config content
Get-Content $env:USERPROFILE\.ssh\config
```

---

## 🔧 Common File Locations

| Item | Windows Path |
|------|-------------|
| **GitHub CLI** | `C:\Users\ntang\AppData\Local\Programs\GitHub CLI\` |
| **SSH Config** | `C:\Users\ntang\.ssh\config` |
| **SSH Keys** | `C:\Users\ntang\.ssh\id_*` |
| **PowerShell Profile** | `$PROFILE` (run in PowerShell) |

---

## ⚡ Pro Tips

### **🎯 Best Practices**

1. **Always use UTF-8 encoding** for SSH config files
2. **Keep SSH config file permissions secure** (readable only by user)
3. **Backup your SSH keys** before making changes
4. **Use descriptive Host names** in SSH config

### **🐛 Debugging Tips**

1. **Enable SSH verbose mode** for troubleshooting:
   ```powershell
   ssh -v <hostname>
   ```

2. **Check Windows file associations**:
   ```powershell
   assoc .config
   ```

3. **Verify PATH variable**:
   ```powershell
   $env:PATH -split ";"
   ```

### **🔄 Alternative Solutions**

If problems persist:

1. **Use Windows Subsystem for Linux (WSL)**:
   ```powershell
   wsl --install
   # Then use Linux SSH tools
   ```

2. **Use Git Bash** instead of PowerShell:
   - Comes with Git for Windows
   - More Unix-like environment
   - Better SSH compatibility

3. **Use Visual Studio Code integrated terminal**:
   - Often handles paths better
   - Built-in Git integration
   - Cross-platform consistency

---

## 📚 Additional Resources

- **GitHub CLI Documentation**: [cli.github.com](https://cli.github.com)
- **SSH Configuration Guide**: [OpenSSH Config](https://www.openssh.com/manual.html)
- **Windows PowerShell Documentation**: [Microsoft Docs](https://docs.microsoft.com/powershell)

---

## 📞 Still Having Issues?

If these solutions don't work:

1. **Check GitHub Status**: [githubstatus.com](https://githubstatus.com)
2. **Review GitHub CLI Issues**: [github.com/cli/cli/issues](https://github.com/cli/cli/issues)
3. **Ask on GitHub Community**: [github.community](https://github.community)

---

> 💡 **Remember**: Most SSH and GitHub CLI issues on Windows are related to file encoding, PATH variables, or file permissions. Following this guide should resolve 95% of common problems!