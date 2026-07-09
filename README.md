# Canvas360 — Project Website

Project page for **"Enhancing In-context Panoramic Generation via Geometric-aware Pretraining"** (Canvas360).

## Structure

```
website/
├── index.html              # Single-page site
├── static/
│   ├── css/style.css       # Styles
│   ├── js/main.js          # Nav, reveal-on-scroll, lightbox, tabs, copy-BibTeX
│   └── images/*.jpg        # Figures (rendered from the paper's PDFs)
└── README.md
```

## Local preview

```bash
cd website
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to GitHub Pages

1. Push this `website/` content to a repo (or the repo root / `docs/`).
2. In **Settings → Pages**, set the source branch and folder.
3. The included `.nojekyll` file ensures assets under `static/` are served correctly.

## Notes

- Figures were rendered from the paper's vector PDFs to progressive JPEGs (~5 MB total) for fast loading.
- Update the placeholder links in the hero (`arXiv`, `Code`, `Dataset`) once the resources are public.
- Author links currently point to `#`; add homepages as needed.

## Editing figures

If you update paper figures, re-render with:

```bash
pip install pymupdf pillow
# see the render script used during construction
```
