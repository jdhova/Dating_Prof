# Dating Match MVP

This MVP lets you:
- use an Admin portal to upload data and view full profile/match details
- use a Public page for manual submissions with limited match visibility
- get the top N best matches by similar likes

## 1) Install and run

```bash
pip install -r requirements.txt
streamlit run app.py
```

## 2) Supported data format

Expected columns for CSV/Excel/table in Word:
- `name` (required)
- `likes` (required, comma-separated)
- `age` (optional)
- `city` (optional)
- `bio` (optional)
- `photo_url` (optional, recommended for public match cards)

## 3) Word format option (paragraph-based)

You can also use a .docx where each profile is written as key-value lines:

```text
Name: Jane Doe
Age: 28
City: London
Likes: hiking, coffee, movies
Bio: Loves art galleries.

Name: John Smith
Age: 30
City: Manchester
Likes: travel, books, coffee
Bio: Weekends are for road trips.
```

## 4) Notes

- This MVP uses a deterministic similarity algorithm (no AI API key needed).
- Matching currently prioritizes similar likes, with small boosts for same city and close age.
- You can customize the matching formula in `matcher.py` later.

## 5) Access model

- Admin Portal:
	- Upload CSV/Excel/Word profile data.
	- View full profile details and full match details.
	- View full information submitted from the public page.
- Public Page:
	- Submit profile manually.
	- View only match names and photos (no age, city, likes, bio, or score).

## 6) Deploy On Streamlit Community Cloud

### A) Push project to GitHub

```bash
git init
git branch -M main
git remote add origin https://github.com/jdhova/Dating_Prof.git
git add .
git commit -m "Deploy-ready MVP"
git push -u origin main
```

### B) Deploy from Streamlit Cloud

1. Go to https://share.streamlit.io
2. Sign in with GitHub.
3. Click **Create app**.
4. Select:
	- Repository: `jdhova/Dating_Prof`
	- Branch: `main`
	- Main file path: `app.py`
5. Click **Deploy**.

### C) Notes

- `requirements.txt` is used for package install.
- `runtime.txt` pins Python version for cloud runtime.
- No API key is required for this MVP.
