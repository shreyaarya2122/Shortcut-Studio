const form = document.querySelector("#generator-form");
const topicInput = document.querySelector("#topic");
const list = document.querySelector("#script-list");
const statusEl = document.querySelector("#status");
const resetBtn = document.querySelector("#reset");
const regenBtn = document.querySelector("#regenerate");
const themeBtn = document.querySelector("[data-theme-toggle]");

let lastPayload = null;

const angles = [
  {
    name: "Curiosity gap",
    label: "Shock opener",
    hook: (t) => `Everyone thinks ${t} is obvious. The weird part is what happens right before it works.`,
    prompt: "Comment the moment you realized this was true.",
  },
  {
    name: "Mini story",
    label: "Story loop",
    hook: (t) => `I tested ${t} like a creator would, and the first result made no sense.`,
    prompt: "Would you try this or skip it? Answer in one word.",
  },
  {
    name: "Teach fast",
    label: "Lesson sprint",
    hook: (t) => `Here is the 60-second version of ${t} that most people explain backwards.`,
    prompt: "Save this and tell me which step needs a deeper breakdown.",
  },
];

const toneMap = {
  curious: ["Wait for the twist", "Here is the part nobody mentions", "The payoff is smaller than you expect, but more useful"],
  dramatic: ["This changes the whole frame", "That is the trap", "Now the reveal"],
  funny: ["Tiny chaos, useful lesson", "This sounds fake, stay with me", "And yes, people still do this"],
  coach: ["Use this structure", "Notice the transition", "Steal this for your next video"],
};

const styleTips = {
  education: [
    "Use captions as chapter titles, not subtitles only.",
    "Show a quick before/after visual by second 8.",
    "Cut to proof every time a claim gets abstract.",
  ],
  entertainment: [
    "Open with motion already happening, then explain after the cut.",
    "Use reaction zooms on the contradiction and payoff.",
    "Let one line feel quotable enough for comments.",
  ],
  hybrid: [
    "Package the lesson like a reveal, not a lecture.",
    "Alternate face-to-camera with visual receipts every 2-3 seconds.",
    "End on a debate prompt instead of a generic follow request.",
  ],
};

function cleanTopic(value) {
  return value.trim().replace(/\s+/g, " ");
}

function getPayload() {
  return {
    topic: cleanTopic(topicInput.value),
    category: document.querySelector("#category").value,
    audience: cleanTopic(document.querySelector("#audience").value) || "curious viewers",
    tone: document.querySelector("#tone").value,
    pace: document.querySelector("#pace").value,
  };
}

function paceLine(pace) {
  if (pace === "story") return "Hold shots for 3-4 seconds during story beats, then quick-cut the payoff.";
  if (pace === "balanced") return "Alternate 3-second explanation beats with 1-second visual resets.";
  return "Cut every 1.5-2.5 seconds; use zooms, captions, and b-roll as pattern interrupts.";
}

function buildScript(payload, angle, index) {
  const t = payload.topic;
  const toneLines = toneMap[payload.tone];
  const tips = styleTips[payload.category];
  return {
    title: `${angle.label}: ${t}`,
    angle: angle.name,
    hook: angle.hook(t),
    beats: [
      `0-3s: Hook: "${angle.hook(t)}" Put the key phrase as large on-screen text.`,
      `4-10s: Context: Tell ${payload.audience} why this matters today. Use a fast visual example before explaining it.`,
      `11-23s: Build the loop: "${toneLines[0]}." Show one surprising detail, mistake, or contrast.`,
      `24-38s: Payoff setup: "${toneLines[1]}." Add a jump cut, screen recording, or prop demonstration.`,
      `39-52s: Payoff: Give the practical takeaway in one sentence, then show the result visually.`,
      `53-60s: Engagement close: "${angle.prompt}" Keep the last frame readable for at least one second.`,
    ],
    onScreen: [
      `Big text: "${t}: the part people miss"`,
      `Mid-video caption: "${toneLines[2]}"`,
      `Final card: "${angle.prompt}"`,
    ],
    cta: angle.prompt,
    tips: [paceLine(payload.pace), ...tips],
    retention: [
      "Start mid-action instead of with an intro.",
      "Use an open loop in the hook and resolve it after the halfway mark.",
      "Change framing, crop, or visual evidence whenever the sentence changes purpose.",
    ],
    index,
  };
}

function scriptToText(script) {
  return `${script.title}
Angle: ${script.angle}

Hook:
${script.hook}

Beat map:
${script.beats.map((beat) => `- ${beat}`).join("\n")}

On-screen text:
${script.onScreen.map((item) => `- ${item}`).join("\n")}

Engagement prompt:
${script.cta}

Trending style tips:
${script.tips.map((tip) => `- ${tip}`).join("\n")}

Retention tactics:
${script.retention.map((item) => `- ${item}`).join("\n")}`;
}

function renderScripts(payload) {
  const scripts = angles.map((angle, index) => buildScript(payload, angle, index + 1));
  list.innerHTML = scripts
    .map(
      (script) => `
      <article class="script-card" data-testid="card-script-${script.index}">
        <div class="card-top">
          <div>
            <span class="badge">${script.angle}</span>
            <h3>${escapeHtml(script.title)}</h3>
          </div>
          <div class="card-actions">
            <button class="secondary small copy-btn" type="button" data-copy="${script.index}" data-testid="button-copy-${script.index}">Copy</button>
          </div>
        </div>
        <div class="script-body">
          <section class="script-section full">
            <h4>Hook</h4>
            <p>${escapeHtml(script.hook)}</p>
          </section>
          <section class="script-section full">
            <h4>60-second beat map</h4>
            <ol>${script.beats.map((beat) => `<li>${escapeHtml(beat)}</li>`).join("")}</ol>
          </section>
          <section class="script-section">
            <h4>On-screen text</h4>
            <ul>${script.onScreen.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </section>
          <section class="script-section">
            <h4>Style tips</h4>
            <ul>${script.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>
          </section>
          <section class="script-section full">
            <h4>Engagement prompt and retention tactics</h4>
            <p><strong>Prompt:</strong> ${escapeHtml(script.cta)}</p>
            <ul>${script.retention.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </section>
        </div>
      </article>
    `,
    )
    .join("");

  document.querySelectorAll(".copy-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const script = scripts[Number(button.dataset.copy) - 1];
      await navigator.clipboard.writeText(scriptToText(script));
      button.textContent = "Copied";
      setTimeout(() => (button.textContent = "Copy"), 1200);
    });
  });

  statusEl.textContent = `Generated 3 scripts for "${payload.topic}".`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const payload = getPayload();
  if (!payload.topic) {
    statusEl.textContent = "Add a topic first.";
    topicInput.focus();
    return;
  }
  lastPayload = payload;
  renderScripts(payload);
});

regenBtn.addEventListener("click", () => {
  const payload = getPayload();
  if (!payload.topic && !lastPayload) {
    statusEl.textContent = "Add a topic before regenerating.";
    topicInput.focus();
    return;
  }
  lastPayload = payload.topic ? payload : lastPayload;
  renderScripts(lastPayload);
});

resetBtn.addEventListener("click", () => {
  form.reset();
  document.querySelector("#category").value = "hybrid";
  document.querySelector("#audience").value = "curious viewers";
  lastPayload = null;
  list.innerHTML = `<article class="empty-state"><h3>Your scripts will appear here.</h3><p>Try a topic with a clear curiosity gap, surprising fact, or transformation promise.</p></article>`;
  statusEl.textContent = "Enter a topic to create three 60-second scripts with hooks, prompts, and editing notes.";
});

themeBtn.addEventListener("click", () => {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  themeBtn.textContent = next === "dark" ? "Light" : "Dark";
});

if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
  document.documentElement.setAttribute("data-theme", "light");
  themeBtn.textContent = "Dark";
}
