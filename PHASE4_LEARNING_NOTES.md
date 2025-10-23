# Phase 4 Learning Notes: Local Development & Testing

## Overview
This document captures all the concepts, questions, and explanations from Phase 4 of building your PWA - setting up professional local development environment with HTTPS, build tools, and automated testing.

---

## Table of Contents
1. [Local HTTPS Setup with mkcert](#local-https-setup-with-mkcert)
2. [WSL (Windows Subsystem for Linux)](#wsl-windows-subsystem-for-linux)
3. [Certificate Authorities Explained](#certificate-authorities-explained)
4. [Let's Encrypt vs mkcert](#lets-encrypt-vs-mkcert)
5. [Security Best Practices](#security-best-practices)
6. [Key Takeaways](#key-takeaways)

---

## Local HTTPS Setup with mkcert

### Why HTTPS Locally?

**The Problem:**
- PWA features like `beforeinstallprompt` work more reliably over HTTPS
- Service workers require a secure context
- Testing in production-like environment is important
- Avoid "Not Secure" warnings in browser

**The Solution:**
Use mkcert to create locally-trusted SSL certificates for localhost development.

### What is mkcert?

**Definition:**
A tool that creates SSL certificates that your browser will trust for local development.

**Key Features:**
- Creates certificates for localhost, 127.0.0.1, and custom domains
- Automatically manages a local Certificate Authority
- Works on Windows, macOS, and Linux
- Zero configuration required
- Perfect for development (not for production)

**How It Works:**
1. Creates a local Certificate Authority (CA)
2. Installs this CA in your system's trust store
3. Generates certificates signed by this CA
4. Your browser trusts the CA → trusts the certificates

---

## WSL (Windows Subsystem for Linux)

### What is WSL?

**Definition:**
Windows Subsystem for Linux (WSL) is a compatibility layer that lets you run a Linux environment directly on Windows without needing a virtual machine or dual-boot setup.

**Key Concepts:**
- **WSL 1**: Translation layer that converts Linux system calls to Windows calls
- **WSL 2**: Uses a real Linux kernel in a lightweight virtual machine (better performance, more compatible)
- Integrates with Windows filesystem
- Can run Linux command-line tools, utilities, and applications

### WSL Version Check

**Command:**
```bash
wsl --version
```

**What It Shows:**
- WSL version (2.x is latest)
- Kernel version
- Windows version compatibility

**Example Output:**
```
WSL version: 2.3.26.0
Kernel version: 5.15.167.4-1
```

### Linux Distributions in WSL

**What are Linux Distributions?**
- WSL is the "engine", but you need an actual Linux OS to run
- Common distributions: Ubuntu, Debian, Fedora, etc.
- Each distribution is a separate WSL instance

**Checking Installed Distributions:**
```bash
wsl -l -v
```

**Output Format:**
```
NAME              STATE      VERSION
Ubuntu            Running    2
docker-desktop    Stopped    2
```

- **NAME**: Distribution or application name
- **STATE**: Running or Stopped
- **VERSION**: WSL version (1 or 2)

### Installing Ubuntu in WSL

**Why Ubuntu?**
- Most popular Linux distribution for beginners
- Best package/software support
- Large community and documentation
- Default choice for development

**Installation Methods:**

**Method 1: Microsoft Store (GUI)**
1. Open Microsoft Store
2. Search "Ubuntu"
3. Install "Ubuntu" (gets latest stable version)

**Method 2: Command Line (Faster)**
```bash
wsl --install -d Ubuntu
```

**First-Time Setup:**
- Creates a Unix username (lowercase, no spaces)
- Sets a password (won't show characters while typing - this is normal!)
- Password is for `sudo` commands (administrator actions)

### Ubuntu Command Prompt Explained

**What You See:**
```
vitor@DESKTOP-XXXXX:~$
```

**Breaking It Down:**
- `vitor` = your Linux username
- `@` = separator
- `DESKTOP-XXXXX` = your computer's hostname
- `:` = separator
- `~` = current directory (~ means home directory)
- `$` = regular user prompt (# would mean root/admin)

### Basic Linux Commands Used

**whoami**
```bash
whoami
```
- Shows your current username
- Useful for verifying you're logged in as the right user

**sudo**
```bash
sudo command
```
- "SuperUser DO" - runs command as administrator
- Requires your password
- Needed for system-level operations

**apt (Package Manager)**
```bash
sudo apt update        # Refresh package lists
sudo apt install pkg   # Install a package
```
- Ubuntu's package manager (like an app store for Linux)
- `update` refreshes the list of available software
- `install` downloads and installs software

**cd (Change Directory)**
```bash
cd /path/to/folder
```
- Navigate to a different folder
- `~` = home directory
- `/` = root directory
- `..` = parent directory

**ls (List Files)**
```bash
ls              # Basic list
ls -la          # Detailed list with hidden files
```
- Shows files in current directory
- `-l` = long format (details)
- `-a` = all files (including hidden)

**curl (Download Files)**
```bash
curl -JLO "url"
```
- Downloads files from the internet
- `-J` = use server's filename
- `-L` = follow redirects
- `-O` = save to file

**mv (Move/Rename)**
```bash
mv oldname newname     # Rename
mv file /path/         # Move
```
- Renames or moves files
- No output = success

**chmod (Change Permissions)**
```bash
chmod +x filename
```
- Changes file permissions
- `+x` = add executable permission (make it runnable)

**cp (Copy)**
```bash
cp source destination
```
- Copies files or directories

**echo (Output Text)**
```bash
echo "text" >> file
```
- Prints text or writes to files
- `>>` = append to file
- `>` = overwrite file

### WSL Filesystem Integration

**Accessing Windows Files from WSL:**
- Windows drives are mounted under `/mnt/`
- `C:\` = `/mnt/c/`
- `D:\` = `/mnt/d/`

**Example:**
```
Windows path: C:\Users\vitor410rodrigues\source\repos\demo-pwa-app
WSL path:     /mnt/c/Users/vitor410rodrigues/source/repos/demo-pwa-app
```

**Why This Matters:**
- You can edit files in Windows (VS Code, Notepad, etc.)
- Run Linux commands on those same files in WSL
- Best of both worlds!

---

## Certificate Authorities Explained

### What is a Certificate Authority (CA)?

**Definition:**
A Certificate Authority is a trusted organization that issues digital certificates to verify the identity of websites and encrypt connections.

**Real-World Analogy:**
- Like a government issuing passports
- The government (CA) is trusted
- When you show your passport (certificate), people trust it's really you
- Because a trusted authority issued it

### How CAs Work in HTTPS

**The Chain of Trust:**

1. **Browser has pre-installed CAs**
   - DigiCert, Let's Encrypt, VeriSign, etc.
   - These are built into your browser/OS
   - You trust your browser → you trust these CAs

2. **Website gets certificate from CA**
   - Website proves its identity to CA
   - CA signs a certificate for the website
   - Certificate says "I vouch for this website"

3. **You visit the website**
   - Website presents its certificate
   - Browser checks: "Was this signed by a CA I trust?"
   - If yes → Green lock, HTTPS works
   - If no → Warning: "Not Secure"

### Q: Don't I Already Have Local CAs in Windows?

**Question:**
"Don't I already have a local CA if I'm using Windows?"

**Answer:**
Yes, BUT those CAs won't sign certificates for localhost!

**Windows' Built-in CAs:**
- Pre-installed from companies like DigiCert, Let's Encrypt, VeriSign
- Used to verify certificates from **public websites**
- Example: When you visit `https://google.com`, Windows checks if Google's certificate was signed by a trusted CA

**The Problem:**
- Those CAs will NOT sign certificates for `localhost`
- You can't ask DigiCert for a localhost certificate
- You need your own CA specifically for development

**What mkcert Does:**
- Creates a NEW local CA (just for you, just for development)
- Installs it in Windows' trust store (alongside the existing ones)
- Now Windows trusts: DigiCert ✅, Let's Encrypt ✅, **Your Local CA** ✅
- Any certificate signed by your local CA will be trusted

### mkcert Installation Process

**Step 1: Install Dependencies**
```bash
sudo apt install libnss3-tools -y
```
- `libnss3-tools` = contains certutil (certificate utility)
- mkcert uses this to install CAs in system trust store

**Step 2: Download mkcert**
```bash
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
```
- Downloads pre-built binary from official source
- `linux/amd64` = Linux version for 64-bit processors

**Step 3: Rename and Make Executable**
```bash
mv mkcert-v*-linux-amd64 mkcert
chmod +x mkcert
```
- Simplifies the filename
- `chmod +x` = makes it executable (runnable as a program)

**Step 4: Move to System Location**
```bash
sudo mv mkcert /usr/local/bin/
```
- `/usr/local/bin/` = folder for user-installed programs
- Adding to PATH means you can run `mkcert` from anywhere

**Step 5: Verify Installation**
```bash
mkcert -version
```
- Should show version number (e.g., v1.4.4)

### Creating the Local CA

**Command:**
```bash
mkcert -install
```

**What This Does:**
1. Creates a new local Certificate Authority
2. Generates CA certificate and private key
3. Stores them in `~/.local/share/mkcert/` (on Linux)
4. Installs CA in system trust store

**Output:**
```
Created a new local CA 💥
The local CA is now installed in the system trust store! ⚡️
```

**Finding the CA Location:**
```bash
mkcert -CAROOT
```
- Shows path to CA files
- Example: `/home/vitor/.local/share/mkcert`

### WSL and Windows Certificate Stores

**Important Distinction:**
- WSL (Linux) has its own certificate trust store
- Windows has a separate certificate trust store
- Your browser runs on Windows, not in WSL

**Why This Matters:**
- Running `mkcert -install` in WSL installs the CA in Linux
- But your browser (Chrome, Edge, Firefox) runs on Windows
- So we need to install the CA in Windows too

**The Solution:**
1. Copy CA from WSL to Windows: `cp /home/vitor/.local/share/mkcert/rootCA.pem /mnt/c/Users/vitor410rodrigues/Downloads/`
2. Install CA in Windows manually (graphical process)

### Installing CA in Windows

**Process:**
1. Copy `rootCA.pem` to Windows location (Downloads folder)
2. Rename to `rootCA.crt` (Windows recognizes .crt better than .pem)
3. Right-click → "Install Certificate"
4. Choose "Current User" (not Local Machine)
5. Select "Trusted Root Certification Authorities" store
6. Complete installation

**Current User vs Local Machine:**
- **Current User**: Certificate only trusted for your Windows account (recommended)
- **Local Machine**: Certificate trusted for all users on computer (requires admin, unnecessary for dev)

**Why "Trusted Root Certification Authorities"?**
- This is the store for root CAs - the most trusted certificates
- Putting our CA here makes Windows trust any certificate it signs
- This is safe because the CA only works locally and only signs localhost certificates

### Generating Localhost Certificates

**Command:**
```bash
mkcert localhost 127.0.0.1 ::1
```

**Breaking It Down:**
- `localhost` = domain name for local computer
- `127.0.0.1` = IPv4 loopback address (another way to say "this computer")
- `::1` = IPv6 loopback address

**Why Multiple Names?**
- Browser might use any of these to access your app
- Having all three in the certificate ensures it works no matter which one is used

**Output:**
```
Created a new certificate valid for the following names 📜
 - "localhost"
 - "127.0.0.1"
 - "::1"

The certificate is at "./localhost+2.pem" and the key at "./localhost+2-key.pem" ✅
It will expire on 20 January 2028 🗓
```

**Files Created:**
- `localhost+2.pem` = The certificate (public, can be shared)
- `localhost+2-key.pem` = The private key (SECRET, never share!)

**The "+2" in Filename:**
- Indicates the certificate is valid for 2 additional names beyond the first
- (localhost + 2 more: 127.0.0.1 and ::1)

---

## Let's Encrypt vs mkcert

### Q: Would Let's Encrypt Be a Better Approach?

**Question:**
"I know there is a thing called Let's Encrypt that gets you free certificates. Would this be a better approach?"

**Excellent question!** This shows understanding that there are multiple ways to get SSL certificates.

### Let's Encrypt

**What It's For:**
Creating certificates for **public websites** on the internet with real domain names.

**How It Works:**
1. You must own a domain name (like `example.com`, `myapp.com`)
2. Let's Encrypt verifies you own that domain
3. Verification is done by checking the domain from the internet
4. Issues a certificate trusted by all browsers worldwide

**Requirements:**
- Real domain name (costs money to register)
- Server must be publicly accessible from the internet
- Let's Encrypt servers need to reach your server to verify ownership

**Use Cases:**
- Production websites
- Deployed applications
- Public APIs
- Any site accessible from the internet

### mkcert

**What It's For:**
Creating certificates for **local development** on your own computer.

**How It Works:**
1. Creates a local Certificate Authority on your computer
2. Your computer/browser trusts this CA (only on your machine)
3. Generates certificates signed by this CA
4. Works with localhost, 127.0.0.1, and local hostnames

**Requirements:**
- Just mkcert installed
- No domain name needed
- No internet connection required
- No public server needed

**Use Cases:**
- Local development
- Testing HTTPS features
- Private development environments
- Learning and experimentation

### Why Let's Encrypt Won't Work for Localhost

**The Problem:**
- Let's Encrypt needs to verify domain ownership
- Verification happens from their servers on the internet
- They try to connect to your domain from the outside
- `localhost` is not a public domain - it only exists on your computer
- Let's Encrypt servers can't reach your `localhost`
- Therefore, verification fails

**Technical Reason:**
- `localhost` always resolves to `127.0.0.1` (your own computer)
- When Let's Encrypt tries to verify `localhost`, it checks their own server
- Not your computer!

### Comparison Table

| Scenario | Tool | Why |
|----------|------|-----|
| Local development (localhost) | **mkcert** ✅ | Works with localhost, no domain needed |
| Production website with domain | **Let's Encrypt** ✅ | Free, trusted globally, auto-renewal |
| Testing on your computer | **mkcert** ✅ | Simple, fast, no configuration |
| Deployed to GitHub Pages | No action needed | GitHub provides HTTPS automatically |
| Deployed to Netlify/Vercel | No action needed | Platform provides HTTPS automatically |
| Custom server with domain | **Let's Encrypt** ✅ | Industry standard for production |

### When You'll Use Each

**Phase 4.1 (Now - Local HTTPS):**
- Using **mkcert**
- Testing PWA features locally
- Installing app from localhost

**Later - When Deploying:**
- If using GitHub Pages/Netlify/Vercel: HTTPS included, nothing to do
- If deploying to your own server with custom domain: Use Let's Encrypt

---

## Security Best Practices

### Q: Should .pem Files Be Added to Git Repository?

**Question:**
"Can I add these 2 new files (.pem) to a public repository? Is that safe, or should I create a .gitignore for them?"

**Excellent security thinking!** ✅

### The Two Files

**localhost+2.pem (Certificate)**
- Public part of the certificate
- Relatively safe to share
- But still no benefit to committing it

**localhost+2-key.pem (Private Key)**
- **PRIVATE** - should NEVER be shared
- Anyone with this key could impersonate your localhost
- While the risk is low for localhost, it's a bad practice

### Why Keep Certificates Out of Git

**Security Best Practice:**
- Private keys should NEVER be committed to repositories
- Even for localhost certificates
- Builds good security habits for when you work with real production secrets

**Machine-Specific:**
- Certificates are tied to individual machines
- Each developer should generate their own
- No benefit to sharing them

**Clutter:**
- Certificate files aren't part of the application code
- They're local development environment setup
- Belong in .gitignore like node_modules, .env files, etc.

**General Rule:**
```
Certificates + Private Keys = Secrets
Secrets = .gitignore
```

### Adding to .gitignore

**Command:**
```bash
echo "*.pem" >> .gitignore
```

**What This Does:**
- `echo "*.pem"` = outputs the text "*.pem"
- `>>` = appends to file (or creates if doesn't exist)
- `.gitignore` = the file to append to

**Result:**
- All files ending in `.pem` will be ignored by Git
- Won't be committed or pushed
- Won't show up in `git status`

**Best Practice:**
Also add to .gitignore:
- `*.key` = private keys
- `*.crt` = certificates
- `*.pem` = certificates and keys
- `.env` = environment variables
- Secrets and credentials files

---

## Key Takeaways

### Conceptual Understanding

1. **WSL is a Powerful Development Tool**
   - Lets you use Linux tools on Windows
   - Integrates seamlessly with Windows filesystem
   - Best of both worlds for development

2. **Certificate Authorities Create Trust**
   - CAs vouch for certificate authenticity
   - Browsers have pre-installed trusted CAs
   - mkcert creates a local CA for development

3. **HTTPS Requires Certificates**
   - Public websites: Use Let's Encrypt
   - Local development: Use mkcert
   - Choose the right tool for the job

4. **Security Best Practices Matter**
   - Never commit private keys to Git
   - Use .gitignore for secrets
   - Build good habits early

### Technical Skills Gained

1. **WSL Setup and Usage**
   - Installing Linux distributions
   - Basic Linux command line
   - Navigating between Windows and Linux filesystems

2. **Certificate Management**
   - Understanding how SSL/TLS works
   - Creating local Certificate Authorities
   - Installing certificates in Windows trust store
   - Generating SSL certificates for localhost

3. **Development Environment Setup**
   - Setting up HTTPS for local development
   - Understanding security implications
   - Using professional development tools

### Commands Mastered

**WSL:**
```bash
wsl --version                  # Check WSL version
wsl -l -v                      # List distributions
wsl --install -d Ubuntu        # Install Ubuntu
```

**Linux Basics:**
```bash
whoami                         # Current user
sudo command                   # Run as admin
apt update                     # Update package lists
apt install package            # Install software
cd /path                       # Change directory
ls -la                         # List files detailed
curl -JLO "url"               # Download file
mv old new                     # Rename/move
chmod +x file                  # Make executable
cp source dest                 # Copy file
echo "text" >> file           # Append to file
```

**mkcert:**
```bash
mkcert -version                # Check version
mkcert -install                # Create and install local CA
mkcert -CAROOT                 # Show CA location
mkcert localhost 127.0.0.1 ::1 # Generate certificates
```

### What's Next

**Still To Do in Phase 4:**
- Install Node.js and http-server in WSL
- Serve the PWA over HTTPS using the certificates
- Test PWA features with real HTTPS
- Set up build process with Vite
- Configure unit testing
- Set up end-to-end testing
- (Optional) Create CI/CD pipeline

### Installing Node.js in WSL

**Why Node.js in WSL?**
- Windows and WSL are separate environments
- Programs installed on Windows don't work in WSL (and vice versa)
- We created certificates in WSL, so using Node.js in WSL is cleaner

**Installation Process:**
```bash
sudo apt update                    # Update package lists
sudo apt install nodejs npm -y     # Install Node.js and npm
node --version                     # Verify Node.js (v18.19.1)
npm --version                      # Verify npm (9.2.0)
```

**Global npm Packages:**
- Installing packages globally with `-g` requires `sudo`
- Example: `sudo npm install -g http-server`

### http-server vs Express

**Q: How does http-server compare to Express?**

**http-server:**
- Simple command-line static file server
- Zero configuration
- Just serves files as-is
- Perfect for local development and testing
- Usage: `http-server -S -C cert.pem -K key.pem`

**Express:**
- Full web application framework
- Requires writing JavaScript code
- Used for building APIs and dynamic applications
- Database integration, authentication, custom routing
- Overkill for just serving static files

**When to use each:**
- **http-server**: Static sites, local development, PWA testing (what we're doing)
- **Express**: Backend APIs, dynamic applications, production servers with custom logic

### Serving PWA Over HTTPS

**Command:**
```bash
http-server -S -C localhost+2.pem -K localhost+2-key.pem
```

**Breaking It Down:**
- `http-server` = run the web server
- `-S` = enable SSL/HTTPS mode
- `-C localhost+2.pem` = certificate file
- `-K localhost+2-key.pem` = private key file

**What Happens:**
- Server starts on port 8080 by default
- Available at `https://localhost:8080`
- Serves all files in current directory
- Keeps running until you press Ctrl+C

**Testing in Browser:**
1. Navigate to `https://localhost:8080`
2. Look for green lock icon in address bar
3. No "Not Secure" warnings
4. No certificate errors
5. PWA loads and functions normally

**Success Indicators:**
- ✅ Green lock icon (certificate is trusted)
- ✅ HTTPS in address bar
- ✅ Service worker registers successfully
- ✅ No console errors related to certificates
- ✅ Install prompt can appear (beforeinstallprompt fires over HTTPS)

### VS Code WSL Integration

**Q: Can I access WSL terminal via VS Code extension?**

**Option 1: Integrated Terminal (Simple)**
- Press `Ctrl + ` ` to open terminal
- Click dropdown next to "+"
- Select "Ubuntu (WSL)" if available
- Or type `wsl` in PowerShell terminal to enter WSL

**Option 2: Remote - WSL Extension (Professional)**
- Install "Remote - WSL" extension by Microsoft
- Runs entire VS Code session in WSL context
- Better for projects stored in WSL filesystem
- More advanced setup

**For Phase 4:** Option 1 is sufficient - we're just running commands in WSL while files stay on Windows filesystem.

---

## Personal Reflections

**On Infrastructure Setup:**

Installing and configuring this type of infrastructure has always felt like something that I as a software developer should at least know how to do... but that doesn't mean I enjoy it! :)

It's one of those foundational skills - necessary, valuable, good to understand - but not necessarily the fun part of building applications. The payoff comes when everything is set up and you can focus on actually building features.

---

**Progress Update:** Phase 4.1a is complete! ✅

We successfully:
- Installed WSL and Ubuntu
- Installed mkcert and created local Certificate Authority
- Generated SSL certificates for localhost
- Installed CA in Windows trust store
- Installed Node.js and http-server in WSL
- Served the PWA over HTTPS at https://localhost:8080
- Verified trusted HTTPS connection with green lock icon

Your PWA now runs in a production-like HTTPS environment locally!

---

## Phase 4.1b: Docker + nginx (Professional Approach)

### What is Docker?

**Definition:**
Docker is a platform for developing, shipping, and running applications in containers. Containers package an application and all its dependencies together so it runs consistently across different environments.

**Real-World Analogy:**
Think of containers like shipping containers:
- Standard size and shape
- Can be moved between ships, trucks, trains
- Contents are isolated and protected
- You know exactly what's inside

**Key Benefits:**
- **Consistency**: "Works on my machine" becomes "works on every machine"
- **Isolation**: Each container has its own environment
- **Portability**: Move containers between development, testing, and production
- **Efficiency**: Containers share the host OS kernel (lighter than virtual machines)
- **Reproducibility**: Same Dockerfile = same container every time

### Docker Concepts

#### Containers vs Images

**Docker Image:**
- Blueprint or template for a container
- Read-only
- Created from a Dockerfile
- Like a "class" in programming

**Docker Container:**
- Running instance of an image
- Has its own filesystem, networking, processes
- Like an "object" created from a class
- Can be started, stopped, deleted

**Analogy:**
- Image = Recipe
- Container = Actual meal made from recipe

#### Dockerfile

**What It Is:**
A text file containing instructions to build a Docker image.

**Common Instructions:**

```dockerfile
FROM nginx:alpine           # Base image to start from
COPY file.txt /path/        # Copy files into image
RUN command                 # Execute command during build
EXPOSE 443                  # Document which ports are used
CMD ["nginx"]               # Command to run when container starts
```

**Our Dockerfile Explained:**

```dockerfile
# Use nginx alpine (lightweight Linux distribution)
FROM nginx:alpine
```
- Starts from official nginx image (web server)
- `alpine` = minimal Linux distro (smaller image size)

```dockerfile
# Copy PWA files to nginx's default html directory
COPY index.html /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
# ... etc
```
- Copies our PWA files into the container
- `/usr/share/nginx/html/` = where nginx serves files from

```dockerfile
# Copy SSL certificates
COPY localhost+2.pem /etc/nginx/ssl/
COPY localhost+2-key.pem /etc/nginx/ssl/
```
- Puts SSL certificates in container for HTTPS

```dockerfile
# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
```
- Replaces default nginx config with our custom one

```dockerfile
# Expose HTTPS port
EXPOSE 443
```
- Documents that container listens on port 443
- Doesn't actually publish the port (docker-compose does that)

#### docker-compose.yml

**What It Is:**
A YAML file that defines how to run one or more Docker containers.

**Why Use It:**
- Easier than remembering long `docker run` commands
- Define configuration once, use repeatedly
- Simple commands: `docker-compose up`, `docker-compose down`
- Great for multi-container applications

**Our docker-compose.yml Explained:**

```yaml
version: '3.8'
```
- Specifies docker-compose file format version

```yaml
services:
  pwa:
```
- Defines a service named "pwa"
- Services are containers you want to run

```yaml
    build:
      context: .
      dockerfile: Dockerfile
```
- `context: .` = use current directory for build
- `dockerfile: Dockerfile` = use this Dockerfile

```yaml
    container_name: demo-pwa-app
```
- Gives container a friendly name (instead of random name)

```yaml
    ports:
      - "443:443"
```
- Maps port 443 on host → port 443 in container
- Format: `"host:container"`
- Allows accessing `https://localhost` (port 443)

```yaml
    restart: unless-stopped
```
- Auto-restart container if it crashes
- Won't restart if manually stopped

#### .dockerignore

**What It Is:**
Like `.gitignore` but for Docker builds.

**Why Use It:**
- Excludes unnecessary files from build context
- Faster builds (less to copy)
- Smaller images (less bloat)
- Don't copy secrets or dev files into production images

**Our .dockerignore:**
- Excludes: `.git`, documentation, scripts, node_modules, etc.
- Only copies what's needed to run the PWA

### nginx Web Server

**What is nginx?**
A high-performance web server, reverse proxy, and load balancer.

**Pronunciation:** "Engine-X"

**Why nginx?**
- **Fast**: Handles thousands of concurrent connections
- **Lightweight**: Low memory footprint
- **Production-ready**: Used by Netflix, Airbnb, NASA, etc.
- **Flexible**: Web server, reverse proxy, load balancer, cache

**nginx vs http-server:**

| Feature | http-server | nginx |
|---------|-------------|-------|
| Purpose | Development | Production |
| Performance | Basic | High-performance |
| Configuration | Command-line flags | Config files |
| Features | Serve static files | Web server, proxy, load balancer, caching |
| Use case | Quick local testing | Real deployments |

**Our nginx.conf Explained:**

```nginx
events {
    worker_connections 1024;
}
```
- Configures how nginx handles connections
- `worker_connections`: Max simultaneous connections per worker process

```nginx
http {
    include /etc/nginx/mime.types;
```
- Includes MIME type definitions (tells browsers what file types are)
- `.js` = `application/javascript`, `.css` = `text/css`, etc.

```nginx
    server {
        listen 443 ssl;
        server_name localhost;
```
- Creates an HTTPS server on port 443
- Responds to requests for `localhost`

```nginx
        ssl_certificate /etc/nginx/ssl/localhost+2.pem;
        ssl_certificate_key /etc/nginx/ssl/localhost+2-key.pem;
```
- Points to SSL certificate and private key
- Enables HTTPS

```nginx
        root /usr/share/nginx/html;
        index index.html;
```
- `root`: Where to find files to serve
- `index`: Default file to serve for directories

```nginx
        location / {
            try_files $uri $uri/ =404;
```
- Handles all requests
- Try to find exact file, then directory, then return 404

```nginx
        location ~ ^/(sw\.js|manifest\.json)$ {
            add_header Cache-Control "no-cache, must-revalidate";
            add_header Service-Worker-Allowed "/";
        }
```
- Special handling for service worker and manifest
- Don't cache these files (always get fresh version)
- `Service-Worker-Allowed` header allows SW to control all pages

### Docker Commands Learned

**Building and Running:**
```bash
docker-compose up              # Build (if needed) and start
docker-compose up --build      # Force rebuild and start
docker-compose up -d           # Start in background (detached)
```

**Stopping:**
```bash
docker-compose down            # Stop and remove containers
Ctrl+C                         # Stop (when running in foreground)
```

**Viewing Logs:**
```bash
docker-compose logs            # Show logs
docker-compose logs -f         # Follow logs (live updates)
```

**Container Management:**
```bash
docker ps                      # List running containers
docker ps -a                   # List all containers (including stopped)
docker images                  # List images
```

**Cleanup:**
```bash
docker-compose down --volumes  # Stop and remove volumes
docker system prune            # Remove unused containers, images, networks
```

### Comparison: Phase 4.1a vs 4.1b

| Aspect | Phase 4.1a (mkcert + http-server) | Phase 4.1b (Docker + nginx) |
|--------|-----------------------------------|------------------------------|
| **Setup Complexity** | Simple, quick | More involved |
| **Start Command** | `./start-https.sh` | `docker-compose up` |
| **URL** | `https://localhost:8080` | `https://localhost` |
| **Web Server** | http-server (Node.js) | nginx (production-grade) |
| **Environment** | Runs on host machine | Runs in container |
| **Production-like** | Somewhat | Very |
| **Portability** | WSL-specific | Works anywhere Docker runs |
| **Best For** | Quick testing, development | Learning DevOps, production prep |
| **Skills Gained** | Certificates, basic HTTPS | Docker, nginx, containerization |

### When to Use Each Approach

**Use Phase 4.1a (mkcert + http-server) when:**
- ✅ Quick local testing
- ✅ Rapid development cycles
- ✅ Just need HTTPS for PWA features
- ✅ Don't want Docker overhead
- ✅ Simplicity is priority

**Use Phase 4.1b (Docker + nginx) when:**
- ✅ Want production-like environment
- ✅ Learning Docker/DevOps
- ✅ Testing container deployment
- ✅ Need to share exact environment with team
- ✅ Preparing for cloud deployment

**Both are valid!** Many developers use simple servers for development and Docker for testing/production.

### Files Created

**Docker Configuration:**
- `Dockerfile` - Instructions to build image
- `docker-compose.yml` - Service orchestration
- `.dockerignore` - Files to exclude from build

**Web Server Configuration:**
- `nginx.conf` - nginx web server configuration

**Development Script (from earlier):**
- `start-https.sh` - Quick script to run http-server

### Key Takeaways

**Conceptual Understanding:**

1. **Containers Solve Real Problems**
   - Eliminate "works on my machine" issues
   - Consistent environments across dev, test, prod
   - Isolation prevents conflicts

2. **Docker Images Are Layered**
   - Each instruction in Dockerfile creates a layer
   - Layers are cached (faster rebuilds)
   - Start from base images, add your customizations

3. **nginx Is Industry Standard**
   - Used in production by major companies
   - High performance and reliability
   - Complex but powerful configuration

4. **Infrastructure as Code**
   - Dockerfile = code that builds environment
   - Version controlled, reproducible
   - Share exact setup with team

**Technical Skills Gained:**

1. **Docker Skills**
   - Writing Dockerfiles
   - Using docker-compose
   - Managing containers and images
   - Understanding containerization benefits

2. **nginx Configuration**
   - Setting up HTTPS in nginx
   - Serving static files
   - Configuring SSL/TLS
   - Setting headers for PWAs

3. **DevOps Practices**
   - Container orchestration
   - Production-like local environments
   - Infrastructure automation

**Commands Mastered:**

**Docker Compose:**
```bash
docker-compose up              # Start services
docker-compose up --build      # Rebuild and start
docker-compose up -d           # Start detached
docker-compose down            # Stop services
docker-compose logs -f         # View logs
```

**Docker:**
```bash
docker ps                      # List running containers
docker images                  # List images
docker system prune            # Cleanup
```

### What's Next

**Completed in Phase 4:**
- ✅ Phase 4.1a: Local HTTPS with mkcert + http-server
- ✅ Phase 4.1b: Docker + nginx containerization

**Still Available in Phase 4:**
- Phase 4.2: Build Process Setup (Vite, minification, optimization)
- Phase 4.3: Unit Testing Setup (Vitest/Jest)
- Phase 4.4: End-to-End Testing (Playwright/Cypress)
- Phase 4.5: CI/CD Pipeline (GitHub Actions) - Optional
- Phase 4.6: Advanced Containerization (Multi-stage builds, dev containers) - Optional

---

**Progress Update:** Phase 4.1b is complete! ✅

We successfully:
- Installed Docker Desktop for Windows
- Created Dockerfile for nginx-based PWA serving
- Configured nginx with SSL/TLS
- Created docker-compose.yml for easy orchestration
- Built Docker image containing our PWA
- Ran containerized PWA at https://localhost
- Verified PWA works in production-like environment

You now have TWO professional local development setups and understand the benefits of containerization!

---

## Phase 4.2: Build Process Setup

### What Are Build Tools?

**Definition:**
Build tools are programs that transform your source code into optimized files ready for production deployment.

**Why We Need Them:**

**Development Code (What You Write):**
```javascript
// Clear variable names
const userInputElement = document.getElementById('text-input');
const outputDisplayElement = document.getElementById('output');

// Helpful comments
// Function to update the output display
function updateOutput() {
  const inputText = userInputElement.value;

  // Show placeholder if empty
  if (inputText === '') {
    outputDisplayElement.textContent = 'Type something to see it here...';
  } else {
    outputDisplayElement.textContent = inputText;
  }
}
```

**Production Code (What Users Download):**
```javascript
const t=document.getElementById("text-input"),e=document.getElementById("output");function u(){const n=t.value;e.textContent=""===n?"Type something to see it here...":n}
```

**Benefits:**
- Smaller files (faster downloads)
- Fewer HTTP requests (bundling)
- Browser compatibility (transpiling)
- Optimized assets (compressed images, fonts)

---

### What is Vite?

**Definition:**
Vite (French for "fast") is a modern build tool that provides a fast development server and optimized production builds.

**Created by:** Evan You (creator of Vue.js)

**Key Features:**
- Lightning-fast dev server with Hot Module Replacement (HMR)
- Instant server start (doesn't pre-bundle everything)
- Optimized production builds using Rollup
- Out-of-the-box support for TypeScript, JSX, CSS preprocessors
- Native ES modules support

**Why "Fast"?**

**Traditional bundlers (Webpack):**
1. Start dev server
2. Bundle ALL files first
3. Wait... wait... wait... (can take minutes for large apps)
4. Server finally ready

**Vite:**
1. Start dev server (instant!)
2. Serve files on-demand
3. Only process files you actually request
4. Ready in milliseconds

---

### Development vs Production Modes

Vite has two distinct modes:

#### Development Mode (`npm run dev`)

**Purpose:** Fast, convenient local development

**How it works:**
- Runs a smart HTTP server (http://localhost:3000)
- Serves files on-demand (no pre-bundling)
- Hot Module Replacement (changes appear instantly)
- Preserves file structure for easy debugging
- Source maps enabled by default

**Files served:**
- Original, unminified code
- Separate files (not bundled)
- Development-friendly

**Use for:** Active development, testing features

---

#### Production Mode (`npm run build`)

**Purpose:** Create optimized files for deployment

**How it works:**
- Processes all files
- Minifies JavaScript and CSS
- Bundles files together
- Optimizes assets
- Generates hashed filenames
- Creates source maps
- Outputs to `dist/` folder

**Files created:**
- Minified, optimized code
- Bundled (fewer files)
- Hashed filenames for cache busting
- Production-ready

**Use for:** Deploying to production servers

---

### Vite vs Other Development Servers

| Feature | http-server | Vite Dev | nginx | Purpose |
|---------|-------------|----------|-------|---------|
| **Type** | Static file server | Development server | Production web server | - |
| **Processing** | None | On-demand transforms | None | - |
| **Hot Reload** | No | Yes (HMR) | No | - |
| **Speed** | Fast | Instant | Very fast | - |
| **Build Tools** | No | Yes | No | - |
| **Best For** | Simple testing | Active development | Production serving | - |

**Your toolkit now:**
- **http-server** (Phase 4.1a): Quick HTTPS testing
- **Docker + nginx** (Phase 4.1b): Production-like environment
- **Vite dev** (Phase 4.2): Fast development with HMR
- **Vite build** (Phase 4.2): Optimized production builds

---

### package.json Explained

**What It Is:**
A JSON file that describes your project and its dependencies.

**Key Sections:**

```json
{
  "name": "demo-pwa-app",           // Project name
  "version": "1.0.0",                // Project version
  "description": "",                 // Project description

  "scripts": {                       // Commands you can run
    "dev": "vite",                   // npm run dev
    "build": "vite build",           // npm run build
    "preview": "vite preview"        // npm run preview
  },

  "devDependencies": {               // Development tools
    "vite": "^7.1.12"                // Version installed
  }
}
```

**Scripts Section:**
- Define custom commands
- Run with `npm run <script-name>`
- Short aliases for longer commands

**Dependencies vs DevDependencies:**

**dependencies:**
- Packages needed to run the app
- Installed in production
- Example: UI frameworks, libraries

**devDependencies:**
- Packages only needed for development
- NOT installed in production
- Example: Build tools, testing frameworks
- Installed with `--save-dev` flag

---

### vite.config.js Explained

**What It Is:**
Configuration file that tells Vite how to build your project.

**Our Configuration Breakdown:**

```javascript
import { defineConfig } from 'vite';
```
- Imports Vite's config helper
- Provides TypeScript types and validation

```javascript
export default defineConfig({
```
- Exports configuration object
- `defineConfig()` provides autocomplete in editors

```javascript
  root: '.',
```
- Root directory of the project
- Where `index.html` is located
- `.` means current directory

```javascript
  build: {
    outDir: 'dist',
```
- Output directory for production build
- All built files go in `dist/` folder

```javascript
    emptyOutDir: true,
```
- Clear `dist/` folder before each build
- Prevents old files from accumulating

```javascript
    sourcemap: true,
```
- Generate source map files (`.map`)
- Allows debugging minified code in DevTools

```javascript
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
```
- Rollup is the bundler Vite uses for production
- Specifies entry point (index.html)
- Vite analyzes HTML and finds all linked files

```javascript
  server: {
    port: 3000,
    open: true
  }
```
- Dev server configuration
- `port: 3000`: Run on http://localhost:3000
- `open: true`: Automatically open browser

---

### Hot Module Replacement (HMR)

**What It Is:**
Technology that updates code in the browser without a full page refresh.

**Traditional Workflow:**
1. Edit code
2. Save file
3. Browser detects change
4. **Full page refresh**
5. Lose application state (form data, scroll position, etc.)

**With HMR:**
1. Edit code
2. Save file
3. Vite sends update via WebSocket
4. **Only changed module updates**
5. Application state preserved

---

#### How HMR Works Technically

**1. WebSocket Connection:**
```
Browser <----WebSocket----> Vite Dev Server
     (stays open while server runs)
```

**2. File Watching:**
- Vite watches your files for changes
- Uses efficient file system watchers
- Detects saves instantly

**3. Module Graph:**
- Vite builds a dependency graph
- Knows which modules import which
- Understands impact of changes

**4. Selective Update:**

**When you save `styles.css`:**
```
1. Vite detects change
2. Sends message through WebSocket: "styles.css changed"
3. Browser receives new CSS
4. Browser replaces stylesheet
5. Page updates instantly
6. No refresh needed!
```

**When you save `app.js`:**
```
1. Vite detects change
2. Determines if module can be hot-swapped
3. If yes: Send update, swap module
4. If no: Request full reload
```

**Types of HMR:**

| File Type | HMR Behavior | Reason |
|-----------|-------------|--------|
| CSS | Always HMR | Stylesheets can be swapped independently |
| JavaScript | Usually HMR | Depends on code structure |
| HTML | Usually reload | HTML is page structure |
| Images | Reload | Assets referenced by URLs |

---

#### Seeing HMR in Action

**Browser DevTools Console:**
```
[vite] connected.
[vite] css hot updated: /styles.css
```

**Network Tab (WebSocket):**
- Filter by "WS"
- See WebSocket connection to Vite
- Messages sent when files change

**Why This Matters:**
- **Faster development** - No waiting for page reloads
- **Preserved state** - Don't lose form data, scroll position
- **Instant feedback** - See changes immediately
- **Better experience** - Stay in flow state while coding

---

### ES Modules and type="module"

**The Problem We Encountered:**

**Original HTML:**
```html
<script src="app.js"></script>
```

**Build warning:**
```
<script src="app.js"> in "/index.html" can't be bundled
without type="module" attribute
```

**Why?**

**Traditional Scripts (no type attribute):**
- Loaded and executed immediately
- Global scope pollution
- No `import`/`export` statements
- Vite can't optimize these properly

**ES Modules (type="module"):**
```html
<script type="module" src="app.js"></script>
```
- Modern JavaScript standard
- Supports `import` and `export`
- Scoped (not global)
- Loaded asynchronously
- Vite can analyze dependencies
- Required for proper bundling

**Benefits:**
- Proper dependency management
- Tree-shaking (remove unused code)
- Better optimization
- Modern JavaScript features

---

### The Build Process

**What Happens When You Run `npm run build`:**

**Step 1: File Analysis**
- Vite reads `index.html`
- Finds all `<script>`, `<link>`, `<img>` tags
- Builds dependency graph

**Step 2: Transformation**
- Transpiles modern JavaScript for browser compatibility
- Processes CSS (autoprefixer, minification)
- Optimizes images
- Handles imports

**Step 3: Bundling**
- Combines related files
- Reduces number of HTTP requests
- One CSS bundle, one JS bundle (for simple apps)

**Step 4: Minification**

**JavaScript minification:**
```javascript
// Before (readable)
function updateOutput() {
  const inputText = textInput.value;
  if (inputText === '') {
    outputDiv.textContent = 'Type something...';
  }
}

// After (minified)
function u(){const t=textInput.value;outputDiv.textContent=""===t?"Type something...":t}
```

**CSS minification:**
```css
/* Before */
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}

/* After */
body{margin:0;padding:0;font-family:Arial,sans-serif}
```

**Step 5: Hashing**
- Generates unique hash for each file
- Based on file content
- Example: `main-BahivuGj.js`

**Step 6: Output**
- Writes files to `dist/` folder
- Updates HTML references
- Generates source maps

---

### Understanding the Build Output

**Our Build Result:**
```
dist/assets/manifest-DgQNnq5L.json  0.58 kB │ gzip: 0.28 kB
dist/index.html                     1.72 kB │ gzip: 0.78 kB
dist/assets/main-B3FtBgLk.css       2.59 kB │ gzip: 0.96 kB
dist/assets/main-BahivuGj.js        1.89 kB │ gzip: 0.89 kB │ map: 3.63 kB
✓ built in 165ms
```

**Breaking It Down:**

**File Sizes:**
- First number: Actual file size
- `gzip`: Size when compressed (what users actually download)
- `map`: Source map file size

**Why GZIP Matters:**
- Web servers compress files before sending
- GZIP compression typically 60-80% reduction
- `2.59 kB` becomes `0.96 kB` over the network

**File Structure:**
```
dist/
├── index.html (entry point)
└── assets/
    ├── main-B3FtBgLk.css (all CSS, minified)
    ├── main-BahivuGj.js (all JavaScript, minified)
    ├── main-BahivuGj.js.map (source map)
    └── manifest-DgQNnq5L.json (PWA manifest)
```

---

### File Hashing and Cache Busting

**What Are Hashed Filenames?**

**Original names:**
- `app.js`
- `styles.css`

**After build:**
- `main-BahivuGj.js`
- `main-B3FtBgLk.css`

**The hash (`BahivuGj`, `B3FtBgLk`):**
- Generated from file content
- Same content = same hash
- Different content = different hash

---

#### The Browser Caching Problem

**Without hashes:**

**First visit:**
```
1. User visits https://example.com
2. Browser downloads app.js
3. Browser caches app.js (stores locally)
```

**You update your code:**
```
4. You change app.js
5. You deploy to server
```

**User returns:**
```
6. User visits https://example.com again
7. Browser checks: "I have app.js cached"
8. Browser uses OLD cached version
9. User sees BUGS you already fixed! 😱
```

**The old solution:**
- Tell users to "hard refresh" (Ctrl+Shift+R)
- Not reliable, users don't know how

---

#### Cache Busting with Hashed Filenames

**With hashes:**

**First visit:**
```
1. User visits https://example.com
2. Browser downloads main-abc123.js
3. Browser caches main-abc123.js
```

**You update your code:**
```
4. You change app.js
5. You run npm run build
6. Vite generates main-xyz789.js (different hash!)
7. You deploy to server
```

**User returns:**
```
8. User visits https://example.com again
9. Browser sees <script src="main-xyz789.js">
10. "xyz789" ≠ "abc123" → Different file!
11. Browser downloads new version
12. User always gets latest code! ✅
```

**How index.html is updated:**

**Before build:**
```html
<script type="module" src="app.js"></script>
```

**After build (in dist/index.html):**
```html
<script type="module" src="/assets/main-BahivuGj.js"></script>
```

Vite automatically updates the reference!

---

### Source Maps

**What Is a Source Map?**

A file that maps minified production code back to original source code.

**The Problem:**

**Your original code:**
```javascript
function updateOutput() {
  const inputText = textInput.value;
  if (inputText === '') {
    outputDiv.textContent = 'Type something...';
  }
}
```

**Production code (minified):**
```javascript
function u(){const t=textInput.value;outputDiv.textContent=""===t?"Type something...":t}
```

**When debugging in DevTools:**
- Error in production: "Error at line 1, column 245"
- Which line is that in your original code? 🤷

---

#### How Source Maps Help

**Source map file:** `main-BahivuGj.js.map`

**Contains mapping:**
```
Line 1, col 245 in minified → Line 3, col 10 in original
Variable 't' in minified → Variable 'inputText' in original
```

**In Browser DevTools:**
- Error shows original line numbers
- See original variable names
- Step through original code
- Debug production issues easily

**Source Map Reference:**

At the end of minified file:
```javascript
//# sourceMappingURL=main-BahivuGj.js.map
```

Browser automatically loads source map when DevTools is open.

---

### Bundling Benefits

**What Is Bundling?**

Combining multiple files into fewer files.

**Example: Before Bundling**

**Your project grows:**
```
styles/
  ├── base.css
  ├── components.css
  ├── layout.css
  └── utilities.css

scripts/
  ├── app.js
  ├── helpers.js
  ├── api.js
  └── utils.js
```

**Without bundling:**
- Browser makes 8 separate HTTP requests
- Each request has overhead (DNS, handshake, headers)
- Waterfall effect (some files wait for others)
- Slower page load

**With Vite bundling:**
```
dist/assets/
  ├── main-abc123.css (all CSS combined)
  └── main-xyz789.js (all JavaScript combined)
```

- Browser makes 2 requests (1 CSS, 1 JS)
- Fewer requests = faster loading
- Optimized, compressed files

**HTTP Request Overhead:**

Each request costs ~50-100ms:
- DNS lookup
- TCP connection
- TLS handshake
- Request headers
- Response headers

**8 requests × 75ms = 600ms overhead**
**2 requests × 75ms = 150ms overhead**

**450ms saved** just from fewer requests!

---

### Build Process for Small vs Large Apps

**Your Current PWA (Small):**
- 3 source files (HTML, CSS, JS)
- Build size: ~5 KB total
- Build time: 165ms
- Modest size savings

**Larger Real-World App:**
- 100+ source files
- 20+ npm packages
- Images, fonts, icons
- Build size: 500 KB → 150 KB (70% reduction!)
- Build time: 2-5 seconds
- Dramatic improvements

**Why Small Apps Still Benefit:**
- Learn professional workflows
- Foundation for growth
- Cache busting still valuable
- Ready to scale when needed
- Practice with real tools

---

### npm Commands Learned

**Package Management:**
```bash
npm init -y                    # Create package.json
npm install <package>          # Install package
npm install --save-dev <pkg>   # Install dev dependency
npm install                    # Install all dependencies from package.json
```

**Running Scripts:**
```bash
npm run dev                    # Start Vite dev server
npm run build                  # Build for production
npm run preview                # Preview production build
npm run <script-name>          # Run custom script
```

**Understanding Output:**
```bash
> demo-pwa-app@1.0.0 build    # Script running from package.json
> vite build                  # Actual command executed
```

---

### Key Takeaways

**Conceptual Understanding:**

1. **Build Tools Transform Code**
   - Source code (readable) → Production code (optimized)
   - Development experience vs user experience
   - Different needs for different stages

2. **Two Modes: Dev and Production**
   - Dev: Fast feedback, debugging tools, unoptimized
   - Production: Optimized, minified, cached, fast loading
   - Don't serve dev builds to users!

3. **Cache Busting Is Critical**
   - Browser caching improves performance
   - But can serve stale code
   - Hashed filenames solve this elegantly

4. **Bundling Reduces HTTP Overhead**
   - Fewer requests = faster loading
   - Especially important for mobile networks
   - Modern build tools handle automatically

5. **Source Maps Bridge Dev and Prod**
   - Debug production code easily
   - See original variable names and line numbers
   - Best of both worlds

**Technical Skills Gained:**

1. **Vite Expertise**
   - Setting up modern build tool
   - Configuring for PWA needs
   - Understanding dev vs production modes

2. **npm and package.json**
   - Managing JavaScript projects
   - Installing dependencies
   - Creating custom scripts
   - Understanding semver (^7.1.12)

3. **ES Modules**
   - Modern JavaScript imports/exports
   - Understanding type="module"
   - Module-based architecture

4. **Build Pipeline Understanding**
   - How code transforms from source to production
   - Minification, bundling, hashing
   - Performance optimization

5. **Professional Development Workflow**
   - Industry-standard tools
   - Reproducible builds
   - Team collaboration ready

**Files Created:**

**Configuration:**
- `package.json` - Project metadata and scripts
- `package-lock.json` - Exact dependency versions
- `vite.config.js` - Vite configuration
- `node_modules/` - Installed packages (gitignored)

**Build Output:**
- `dist/` - Production build folder
  - `index.html` - Entry point
  - `assets/` - Optimized CSS, JS, assets
  - Source maps for debugging

**Updated:**
- `.gitignore` - Added node_modules/ and dist/
- `index.html` - Added type="module" to script tag

---

### What's Next

**Completed in Phase 4:**
- ✅ Phase 4.1a: Local HTTPS with mkcert + http-server
- ✅ Phase 4.1b: Docker + nginx containerization
- ✅ Phase 4.2: Build Process Setup (Vite)

**Still Available in Phase 4:**
- Phase 4.3: Unit Testing Setup (Vitest/Jest)
- Phase 4.4: End-to-End Testing (Playwright/Cypress)
- Phase 4.5: CI/CD Pipeline (GitHub Actions) - Optional
- Phase 4.6: Advanced Containerization (Multi-stage builds) - Optional

---

**Progress Update:** Phase 4.2 is complete! ✅

We successfully:
- Created package.json and installed Vite
- Configured Vite for PWA development
- Set up npm scripts for dev, build, and preview
- Experienced Hot Module Replacement (HMR)
- Built optimized production bundle
- Learned about hashed filenames and cache busting
- Understood source maps for debugging
- Analyzed build output and optimizations

You now have a professional build pipeline ready for development and production!
