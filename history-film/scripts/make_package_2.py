#!/usr/bin/env python3
"""Writes the YouTube upload package for Evidence Room Part 2 (text version and a copy-button page).

Usage: python3 scripts/make_package_2.py [html_out]
Reads public/evidence-room-2/chapters.json (from make_srt_2.py). Writes scripts/evidence-room-2-caerleon/PUBLISH.md
and the HTML page (default out/publishing-package-2.html) that is published as an artifact.
Nothing here uploads anything: the owner reviews and uploads.
"""
import json
import sys

ch = json.load(open("public/evidence-room-2/chapters.json"))
fmt = lambda t: f"{int(t // 60)}:{int(t % 60):02d}"
CHAPTERS = "\n".join(f"{fmt(c['t'])} {c['title']}" for c in ch)

TITLES = [
    "Was King Arthur's Round Table a Roman Arena?",
    "Did King Arthur Hold Court Here? Caerleon on Trial",
    "Round Table or Roman Arena? Verdict: Unproven",
    "King Arthur's Round Table Is a Roman Ruin in Wales?",
]

DESC = f"""A Roman amphitheatre in south Wales. A legend that calls it King Arthur's Round Table. In The Evidence Room, a historical claim goes on trial: Dig makes the claim, Doubt objects, the Clerk produces the sources, and the Curator gives the verdict. Today's verdict: UNPROVEN.

WHAT THE EVIDENCE SHOWS
- Caerleon (Isca) is real: a Roman legionary fortress, with an amphitheatre Cadw says was built around AD 90 with seating for up to 6,000 (an estimate).
- Geoffrey of Monmouth (about 1136) has Arthur hold a court at the City of Legions. We searched two English translations and the Latin: no Round Table, no amphitheatre.
- The Round Table first appears in Wace's poem, in 1155.
- Gerald of Wales (1188) lists the ruins at Caerleon. He never mentions a Round Table.
- Tennyson, at Caerleon in 1856: "I sit like King Arthur in Caerleon."
- 1926: the Daily Mail paid for the dig in return for exclusive updates. Cadw's own booklet calls the Arthur story "an appealing, (though untrue), story".
- The earliest firm label "King Arthur's Round Table" for the amphitheatre that we found is on Ordnance Survey maps recorded 1898 to 1908. We could not find when the name began.

CHAPTERS
{CHAPTERS}

SOURCES
- Cadw, Caerleon Roman Amphitheatre: https://cadw.gov.wales/visit/places-to-visit/caerleon-roman-amphitheatre
- Cadw, Trailblazers: Tessa Verney Wheeler (booklet, pp. 19 to 25; the "actual excavation" line is Cadw quoting the historian Lydia Carr): https://cadw.gov.wales/sites/default/files/2026-01/Trailblazers%20-Tessa%20Wheeler%20booklet.pdf
- Museum Wales, Caerleon, City of the Legion: https://museum.wales/blog/1326/Caerleon---City-of-the-Legion/
- Museum Wales, Roman Ruins: https://museum.wales/roman/ruins/
- Museum Wales, Who was King Arthur?: https://museum.wales/articles/1352/Who-was-King-Arthur/
- People's Collection Wales (Amgueddfa Cymru), King Arthur's Round Table: https://www.peoplescollection.wales/content/king-arthurs-round-table
- Coflein (RCAHMW), Caerleon Roman amphitheatre: https://coflein.gov.uk/en/site/95650
- RCAHMW Historic Place Names, "King Arthur's Round Table Amphitheatre" (Ordnance Survey): https://historicplacenames.rcahmw.gov.uk/placenames/recordedname/3c7a8b6e-fc99-4fb9-8fee-962046e390dc
- Wheeler and Wheeler, The Roman Amphitheatre at Caerleon, Monmouthshire, Archaeologia 78 (1928): https://www.cambridge.org/core/journals/archaeologia/article/vthe-roman-amphitheatre-at-caerleon-monmouthshire/3F51519E3385BC50590E7E1AAA9A698D
- Geoffrey of Monmouth, History of the Kings of Britain (Giles translation, 1848): https://archive.org/details/sixoldenglishchr00gileuoft
- Geoffrey of Monmouth (Evans translation, 1904): https://archive.org/details/geoffreyofmonmou00geofuoft
- Geoffrey of Monmouth (Latin edition, Giles, 1844): https://archive.org/details/bub_gb_isqApyNTSs0C
- Gerald of Wales, Itinerary through Wales (Hoare translation, 1806): https://archive.org/details/itineraryofarchb01girauoft
- Hallam Tennyson, Alfred Lord Tennyson: A Memoir, vol. 1 (1897): https://archive.org/details/alfredlordtennys01tennuoft
- The Camelot Project (University of Rochester), the Round Table and Wace: https://d.lib.rochester.edu/camelot/theme/round-table.html
- Nicholas Higham, King Arthur: The Making of the Legend (Yale University Press, 2018): https://yalebooks.yale.edu/book/9780300210927/king-arthur/

WHERE SOURCES DISAGREE
- The amphitheatre's date: Cadw and Museum Wales say about AD 90; one Museum Wales page says about AD 80.
- How long the fortress was occupied: Museum Wales pages give "almost 200 years" and "more than 200 years".
- Whether Arthur existed: historians debate it. Higham writes that most period specialists today declare themselves agnostic.
- The Geoffrey searches used machine-read scans of the translations and the Latin edition above.

MUSIC AND SOUND
Music: "The Old Tower Inn", "Harvest Season" and "The Bard's Tale" by RandomMind (CC0, via OpenGameArt.org). Sound effects are original, made for this video.

This video is a dramatised cartoon retelling for entertainment and education. Characters, dialogue and settings are illustrated interpretations. Where historians disagree, we say so. It is not a substitute for academic research. Spotted a mistake? Tell us in the comments and we will correct it.

#history #KingArthur #Wales"""

TAGS = ("King Arthur, Round Table, Caerleon, Caerleon amphitheatre, Roman amphitheatre, Isca Augusta, Roman Britain, Wales history, "
        "Geoffrey of Monmouth, Wace, Tennyson, Cadw, Arthurian legend, archaeology, history explained, animated history, "
        "cartoon history, The Evidence Room, Past Tense, ancient history")

PINNED = ("Verdict: unproven. Which is the better story, the Roman arena or the Round Table? Sources and the places where they disagree are in the description. "
          "Spotted a mistake? Tell us and we will correct it. Next case: a pope puts a dead pope on trial.")

SHORT_TITLES = ["Was King Arthur's Round Table a Roman arena? #Shorts", "A Roman ruin on trial: King Arthur's Round Table #Shorts", "Verdict: unproven. The Round Table at Caerleon #Shorts"]
SHORT_DESC = """A Roman ruin in Wales that legend calls King Arthur's Round Table, on trial in The Evidence Room. Verdict: unproven.

Full episode: The Evidence Room, Part 2: The Round Table at Caerleon, on Past Tense.

Sources: Cadw (Caerleon Roman Amphitheatre page; Trailblazers: Tessa Verney Wheeler booklet), Geoffrey of Monmouth's History of the Kings of Britain, Wace. Full list with links in the full episode's description.

Dramatised cartoon retelling for entertainment and education. Where historians disagree, we say so. Not a substitute for academic research.

#Shorts #history #KingArthur"""

CHECKLIST = [
    "Watch the final video once from start to end on your tablet. I checked the files by measurement, not by watching them in real time.",
    "Pick a title (the first is my pick) and upload thumbnail-evidence-room-2.jpg (1280x720). Mark the video 'not made for kids'.",
    "Paste the description. Check the chapter times against the video (they come from the timing file and should be within a second).",
    "Optional: upload captions-en.srt. The captions are already on screen, so this only gives viewers the CC button.",
    "Check YouTube's 'altered or synthetic content' question in Studio. The video is a cartoon with your own recorded voice (pitch-shifted for the characters) and original sound effects; confirm the answer yourself.",
    "After uploading, post the pinned comment, then upload the Short and link it to the full video.",
    "Nothing has been uploaded. You review and publish.",
]

md = ["# Part 2 publishing package (nothing here is uploaded)", "", "## Title options"] + [f"{i}. {t} ({len(t)} characters)" for i, t in enumerate(TITLES, 1)]
md += ["", "## Description", "", "```", DESC, "```", "", f"({len(DESC)} characters, limit 5,000)", "", "## Tags", "", TAGS, f"({len(TAGS)} of 500 characters)",
       "", "## Pinned comment", "", PINNED, "", "## Short", "", "Titles:"] + [f"- {t}" for t in SHORT_TITLES] + ["", "```", SHORT_DESC, "```", "", "## Before you publish"] + [f"- {c}" for c in CHECKLIST]
open("scripts/evidence-room-2-caerleon/PUBLISH.md", "w", encoding="utf-8").write("\n".join(md) + "\n")

PAGE = r'''<title>Part 2 Publishing Package</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Bangers&display=swap">
<style>
  :root{--bg:#f6f2ea;--surface:#fff;--fg:#1d1a24;--muted:#5d586a;--line:#d9d2c3;--accent:#b3261e;--ok:#1e7a46;--on:#fff;
    --font-body:"Atkinson Hyperlegible",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--font-display:"Bangers",Impact,"Arial Narrow Bold",sans-serif}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#14121a;--surface:#1f1c29;--fg:#f1ecdf;--muted:#aaa3bb;--line:#37324a;--accent:#ff6a5c;--ok:#6fd49a;--on:#14121a;color-scheme:dark}}
  :root[data-theme="dark"]{--bg:#14121a;--surface:#1f1c29;--fg:#f1ecdf;--muted:#aaa3bb;--line:#37324a;--accent:#ff6a5c;--ok:#6fd49a;--on:#14121a;color-scheme:dark}
  *{box-sizing:border-box}html,body{margin:0}
  body{background:var(--bg);color:var(--fg);font-family:var(--font-body);font-size:20px;line-height:1.5;padding-block:0 60px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
  .wrap{max-width:900px;margin:0 auto}
  h1{font-family:var(--font-display);font-weight:400;letter-spacing:2px;font-size:clamp(34px,6vw,56px);line-height:1;margin:28px 0 6px;text-wrap:balance}
  h2{font-family:var(--font-display);font-weight:400;letter-spacing:1.5px;font-size:32px;margin:40px 0 10px;border-bottom:3px solid var(--fg);padding-bottom:4px}
  .sub{color:var(--muted);margin:0 0 8px;max-width:62ch}
  .card{background:var(--surface);border:2px solid var(--line);border-radius:10px;padding:16px 18px;margin:12px 0}
  button{font:inherit;font-weight:700;min-height:48px;padding:6px 16px;border-radius:10px;border:3px solid var(--fg);background:var(--bg);color:var(--fg);cursor:pointer}
  button:focus-visible{outline:4px solid var(--accent);outline-offset:2px}
  button.ok{background:var(--ok);border-color:var(--ok);color:var(--on)}
  textarea{width:100%;font:inherit;font-size:17px;line-height:1.45;background:var(--bg);color:var(--fg);border:2px solid var(--line);border-radius:8px;padding:12px;resize:vertical}
  .row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:8px}
  .title-opt{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
  .title-opt span{flex:1 1 300px;min-width:0;font-weight:700;font-size:22px}
  .count{color:var(--muted);font-size:16px}
  ul{margin:6px 0;padding-left:24px}li{margin:8px 0}
</style>
<div class="wrap">
<h1>Part 2 Publishing Package</h1>
<p class="sub">The Evidence Room, Part 2: The Round Table at Caerleon. Tap Copy, then paste into YouTube Studio. Nothing here has been uploaded. You review and publish.</p>
<h2>Title options</h2><div id="titles"></div>
<p class="sub">Titles under about 60 characters show fully on phones. The first one is my pick; it pairs with the thumbnail "ROUND TABLE ON TRIAL".</p>
<h2>Description</h2>
<div class="card"><textarea id="desc" rows="26" readonly aria-label="Description"></textarea><div class="row"><button id="c-desc">Copy description</button><span class="count" id="n-desc"></span></div></div>
<h2>Tags</h2>
<div class="card"><textarea id="tags" rows="4" readonly aria-label="Tags"></textarea><div class="row"><button id="c-tags">Copy tags</button><span class="count" id="n-tags"></span></div></div>
<h2>Pinned comment</h2>
<div class="card"><textarea id="pin" rows="4" readonly aria-label="Pinned comment"></textarea><div class="row"><button id="c-pin">Copy comment</button></div></div>
<h2>The Short</h2>
<div id="stitles"></div>
<div class="card"><textarea id="sdesc" rows="11" readonly aria-label="Short description"></textarea><div class="row"><button id="c-sdesc">Copy Short description</button></div></div>
<h2>Before you publish</h2>
<div class="card"><ul id="check"></ul></div>
</div>
<script>
var DATA = __DATA__;
function copy(text,btn){var done=function(){var o=btn.textContent;btn.textContent="Copied";btn.classList.add("ok");setTimeout(function(){btn.textContent=o;btn.classList.remove("ok")},1600)};
  var fb=function(){var t=document.createElement("textarea");t.value=text;document.body.appendChild(t);t.select();try{document.execCommand("copy");done()}catch(e){}document.body.removeChild(t)};
  try{navigator.clipboard.writeText(text).then(done,fb)}catch(e){fb()}}
function titles(host,list,pre){var h=document.getElementById(host);list.forEach(function(t,i){var d=document.createElement("div");d.className="card title-opt";var s=document.createElement("span");s.textContent=t;var c=document.createElement("span");c.className="count";c.style.flex="0 0 auto";c.textContent=t.length+" chars";var b=document.createElement("button");b.id=pre+i;b.textContent="Copy";b.onclick=function(){copy(t,b)};d.appendChild(s);d.appendChild(c);d.appendChild(b);h.appendChild(d)})}
titles("titles",DATA.titles,"c-title-");titles("stitles",DATA.shortTitles,"c-stitle-");
function fill(id,text,cid,nid,lim){document.getElementById(id).value=text;if(nid)document.getElementById(nid).textContent=text.length+(lim?" of "+lim+" characters":" characters");document.getElementById(cid).onclick=function(){copy(text,this)}}
fill("desc",DATA.desc,"c-desc","n-desc","5,000");fill("tags",DATA.tags,"c-tags","n-tags","500");fill("pin",DATA.pinned,"c-pin");fill("sdesc",DATA.shortDesc,"c-sdesc");
var ul=document.getElementById("check");DATA.check.forEach(function(t){var li=document.createElement("li");li.textContent=t;ul.appendChild(li)});
</script>'''
html = PAGE.replace("__DATA__", json.dumps({"titles": TITLES, "shortTitles": SHORT_TITLES, "desc": DESC, "tags": TAGS, "pinned": PINNED, "shortDesc": SHORT_DESC, "check": CHECKLIST}, ensure_ascii=False))
out = sys.argv[1] if len(sys.argv) > 1 else "out/publishing-package-2.html"
import os
os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
open(out, "w", encoding="utf-8").write(html)
print("description", len(DESC), "chars; tags", len(TAGS), "; wrote", out)
for t in TITLES:
    print(len(t), t)
