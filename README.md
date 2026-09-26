# DepthUMI project page

Anonymous academic project page. Plain HTML, CSS and JavaScript; no build step,
external fonts, analytics, or runtime dependencies. Published with GitHub Pages
at <https://anonymous-submission-x.github.io/DepthUMI/>.

## Preview

```sh
python preview.py --port 8765
```

Open <http://127.0.0.1:8765/>. This localhost-only server supports byte ranges so
native video players can seek. GitHub Pages serves the same static files with
byte-range support.

## Content

- `index.html`: research narrative, task comparisons and manuscript results.
- `assets/site.css`: responsive layout and visual tokens.
- `assets/site.js`: accessible task tabs, shared playback, figure viewer and
  citation copy. Videos are user-initiated and pause when their task is hidden.
- `assets/media/`: original scientific figures, unchanged.
- `assets/videos/`: six silent H.264, 720p/30 fps clips and JPEG posters.
  All clips play at 4×; only leading/trailing time is removed. A fixed task crop
  and conservative constant color adjustments are applied identically within
  each DP/DP3 pair. Clips are selected examples, not success-rate estimates.
- `assets/DepthUMI.pdf`: existing anonymous paper PDF.

The peg and block DP source filenames were interchanged: `P-BE-fail-DP.MP4`
contains peg insertion, and `P-PI-fail-DP.MP4` contains block extraction. Web
assets are named by visually verified task. Raw source files were not renamed
or modified. Editing commands, hashes, source time ranges, backups and review
frames are retained outside this public working copy.

The robot results report successes over 10 trials per task and policy, with a
30-trial total. Tracking results use millimetres and preserve their original
aggregation/support. Qualitative clips do not establish relative execution
speed. No claim of conference acceptance is made.

Before future updates, review the page and media and verify that the
paper is the intended anonymous version. Do not publish local evidence folders
or original camera recordings.

## Page hierarchy

Figure 1 is followed by the paper abstract, then real-world results: selected
robot videos, aggregate manipulation success, onboard geometry and motion
recovery. Method, simulation-guided sensing design, hardware/calibration and
citation follow the results. The sticky navigation links directly to each topic.

Main figures 1–5 and 7, plus the requested hardware Figure 8, are visible in the
narrative. Supplementary Figures 9–11 and the longer numerical comparisons are
available in topic-specific disclosures. Figure 6 is omitted where the videos
already show execution; Figure 12 and the exhaustive figure index are removed.
Figures retain the paper's numbering and original scientific content. Each
included figure has a zoomable viewer and a direct paper-page link.

The abstract uses a small centered label and a spacious reading column. Videos
have no surrounding outcome-colored cards: policy and text/icon outcomes sit
above each image, with compact independent playback, seeking and full-screen
controls beneath. A segmented selector switches between the three tasks; shared
play/pause and restart controls remain available. Native video controls are kept
as a no-JavaScript fallback. Drawer Opening labels both shown clips successful.

The quantitative sections preserve Tables 1–3 and Table 15's confidence intervals,
with full supporting comparisons expandable. Clips remain selected examples;
all aggregate counts, units, evaluation support and modality distinctions are
unchanged. Scientific figures retain their source content; video processing is
described above.
