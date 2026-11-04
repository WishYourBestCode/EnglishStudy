# EnglishStudy

Open `index.html` for the study library. It includes eleven lessons across IELTS writing, grammar, vocabulary, speaking, reading, and listening. Listen to the workshop voicemail, check your quiz answers, or save a writing draft in your browser. The included pages work when opened from an extracted folder.

## Publish on GitHub Pages

1. Create the public repository `WishYourBestCode/EnglishStudy` and use `main` as the default branch.
2. Upload the contents of the extracted folder. The repository's top level should contain `index.html`, `catalog.json`, the other site files, and the `lessons` folder.
3. Under **Settings → Pages**, choose **Deploy from a branch**, select **main** and **/(root)**, and save.
4. After GitHub finishes building, use **Visit site**. The expected address is `https://wishyourbestcode.github.io/EnglishStudy/`.

## Add another subject or lesson

To make a lesson available on every device, upload a standalone HTML file under `lessons/<subject>/`. For example, `lessons/grammar/past-perfect.html` appears as “Past perfect” under “Grammar” after GitHub Pages rebuilds. The catalog uses standard GitHub Pages branch publishing with Jekyll. Keep the HTML file free of YAML front matter and use hyphens between words in folder and file names.

For personal study, use **Add a lesson** on the homepage. Files and links you save there stay in the browser and browser profile where you added them.
