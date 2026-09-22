# Modulation — putting the site online with an editor login

About 20 minutes, once. You need a GitHub account (free). Nothing is paid.

What you end up with:

- **The site:** `https://YOUR-GITHUB-USERNAME.github.io/modulation/`
- **The editor:** the same address with `/admin/` on the end. Log in with an email and password, change things, press **Publish**, and the site updates about a minute later.

How it fits together: the site's text lives in small files in `content/`, pictures in `images/`. The editor is a set of forms that writes to those files. GitHub stores them and GitHub Pages serves the website. DecapBridge handles the login, so editors never need a GitHub account.

---

## 1. Put the files on GitHub (5 min)

1. Sign in at github.com → **+** (top right) → **New repository**.
2. Name it `modulation`. Set it to **Public** (free GitHub Pages needs a public repository — the content is a public website anyway). Tick **Add a README**. Create.
3. In the new repository: **Add file → Upload files**. Open this folder on your computer, select **everything inside it** (the `admin`, `content`, `images` folders and all the files — including the hidden `.nojekyll`; on a Mac press Cmd+Shift+. to show it) and drag it all onto the page. Wait for all ~75 files to list, then **Commit changes**.

   Check: the repository's front page should show `admin/`, `content/`, `images/`, `index.html`, `app.js`… at the top level, not inside another folder.

## 2. Switch on GitHub Pages (2 min)

1. In the repository: **Settings → Pages**.
2. Under *Build and deployment*: Source **Deploy from a branch**, Branch **main**, folder **/ (root)**. Save.
3. After about a minute the page shows *"Your site is live at …"*. Open it — the full site should appear.

## 3. Set up the login with DecapBridge (8 min)

1. Go to **decapbridge.com** and sign in with GitHub.
2. **Add site.** When asked, give it access to the `modulation` repository only (it installs a small GitHub app scoped to that one repository).
3. When it asks for the CMS / admin address, give: `https://YOUR-GITHUB-USERNAME.github.io/modulation/admin/`
4. DecapBridge shows a short `backend:` block with your **repo** and an **identity_url** containing your site ID. Keep that tab open.

## 4. Connect the editor to the login (3 min)

1. In GitHub, open `admin/config.yml` → the pencil icon (Edit).
2. Replace **every** `YOUR-GITHUB-USERNAME` with your GitHub username (it appears three times), and `YOUR-SITE-ID` with the ID from DecapBridge. If DecapBridge's snippet differs in any line of the `backend:` block, use theirs.
3. **Commit changes.** Wait a minute for Pages to redeploy.

## 5. Invite Asmita and log in (2 min)

1. In the DecapBridge dashboard for this site, invite collaborators by email: yourself and Asmita. Each person gets an email to set a password (or can use Google / Microsoft sign-in).
2. Open `…/modulation/admin/` → **Login** → sign in. You should see **Site** with nine sections.

That's it. From here on, nobody needs GitHub, code, or this folder — only the `/admin/` address and their login.

---

## If something doesn't work

- **The site shows "Loading…" forever** — the files went into a sub-folder. `index.html` must sit at the top of the repository.
- **Pictures missing** — the `images` folder didn't upload. Upload it again.
- **The editor says "Config Errors"** — a typo in `admin/config.yml`, usually a missing space after a colon. Undo your edit on GitHub and redo it.
- **Login fails / "Failed to load settings"** — `identity_url` or `repo` doesn't match DecapBridge exactly, or GitHub Pages hasn't redeployed yet (wait a minute, then reload).
- **Published but the site hasn't changed** — Pages takes 30–90 seconds. Reload the site.
- **Undo a mistake** — every Publish is saved on GitHub as a separate version (repository → Commits), so any earlier state can be restored. This is the one task that needs the GitHub account.

## Handing over later

Asmita (or whoever takes over) can invite and remove editors from the DecapBridge dashboard. To transfer ownership entirely: GitHub repository → Settings → Transfer ownership, and re-add the site in their DecapBridge account. A custom domain can be attached later under Settings → Pages without changing anything else.

## Other hosts

The folder is plain static files with no build step, so Netlify or Cloudflare also work — connect the GitHub repository, leave the build command empty, publish directory `/`. Update `site_url` in `admin/config.yml` and the admin address in DecapBridge to match.
