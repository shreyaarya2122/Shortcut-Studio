const form = document.querySelector("#generator-form");
const topicInput = document.querySelector("#topic");
const list = document.querySelector("#script-list");
const statusEl = document.querySelector("#status");
const resetBtn = document.querySelector("#reset");
const regenBtn = document.querySelector("#regenerate");
const themeBtn = document.querySelector("[data-theme-toggle]");

let lastPayload = null;
let generationRound = 0;

const frameworkLibrary = [
  {
    name: "Mistake reversal",
    label: "Stop doing this",
    angle: "Show the common mistake, then flip it into a better method.",
    hooks: [
      (t) => `Stop using ${t} like this. You are making the result harder than it needs to be.`,
      (t) => `Most people fail with ${t} because they start in the wrong place.`,
      (t) => `If ${t} is not working for you, this is probably the mistake.`,
    ],
    close: [
      "Comment “fix” if you want the checklist version.",
      "Which mistake have you seen most often?",
      "Save this before you try it again.",
    ],
  },
  {
    name: "Myth vs truth",
    label: "Myth breaker",
    angle: "Challenge a belief, prove the better answer, then give a simple takeaway.",
    hooks: [
      (t) => `The biggest myth about ${t} is that you need more time. You need a cleaner structure.`,
      (t) => `People explain ${t} like it is complicated. It is usually just badly organized.`,
      (t) => `You have probably heard this advice about ${t}. It is only half true.`,
    ],
    close: [
      "Comment “myth” if this changed how you see it.",
      "What is another myth I should break next?",
      "Send this to someone still doing it the old way.",
    ],
  },
  {
    name: "3-step shortcut",
    label: "Fast framework",
    angle: "Give viewers a repeatable three-step process they can use immediately.",
    hooks: [
      (t) => `Here is a three-step shortcut for ${t} that you can use today.`,
      (t) => `If I had 60 seconds to explain ${t}, I would use this framework.`,
      (t) => `Do ${t} in this order: spot it, shape it, ship it.`,
    ],
    close: [
      "Save this and try the three steps today.",
      "Which step should I turn into a full video?",
      "Comment the topic you want me to simplify next.",
    ],
  },
  {
    name: "Story reveal",
    label: "Mini story",
    angle: "Open with a tiny story, reveal the lesson, then turn it into advice.",
    hooks: [
      (t) => `A creator tried ${t} the hard way for weeks. The fix took less than a minute.`,
      (t) => `This ${t} example looks normal at first, but the result comes from one hidden choice.`,
      (t) => `I saw someone change one thing about ${t}, and the whole outcome improved.`,
    ],
    close: [
      "Would you test this approach? Yes or no?",
      "Comment “story” if you want more examples like this.",
      "What would you change first?",
    ],
  },
  {
    name: "Contrarian take",
    label: "Hot take",
    angle: "Say the unexpected thing, defend it, and make viewers respond.",
    hooks: [
      (t) => `Hot take: ${t} is not about doing more. It is about removing the weak part.`,
      (t) => `The advice everyone gives about ${t} sounds helpful, but it can slow you down.`,
      (t) => `You do not need to master ${t}. You need to stop doing the part that kills momentum.`,
    ],
    close: [
      "Agree or disagree? Tell me why.",
      "Comment the part you would remove first.",
      "Share this with someone who loves overcomplicating it.",
    ],
  },
  {
    name: "Before and after",
    label: "Transformation",
    angle: "Show a weak version, improve it, then explain the difference.",
    hooks: [
      (t) => `Here is the weak version of ${t}, and here is the version that actually holds attention.`,
      (t) => `Watch how one small change makes ${t} feel ten times clearer.`,
      (t) => `This is the before-and-after test I would run for ${t}.`,
    ],
    close: [
      "Comment “before” if you want me to review an example.",
      "Which version would you keep watching?",
      "Save this as a quick editing checklist.",
    ],
  },
];

const toneLines = {
  curious: ["Here is the interesting part", "Notice what changed", "That is the hidden lever"],
  dramatic: ["This is where most people lose the viewer", "Now the switch happens", "That one choice changes the outcome"],
  funny: ["This is the tiny chaos moment", "The internet loves making this harder", "Painful, but useful"],
  coach: ["Use this exact structure", "Do not skip this step", "Steal this for your next video"],
};

const categoryMoves = {
  education: {
    proof: "Show a simple example, screen recording, diagram, or side-by-side comparison.",
    value: "Make the viewer leave with one repeatable rule.",
    visual: "Use chapter-style captions: Mistake, Fix, Example, Result.",
  },
  entertainment: {
    proof: "Use a reaction shot, clip-style cutaway, or quick visual contrast.",
    value: "Make the viewer feel a twist, reveal, or opinion they want to debate.",
    visual: "Use zooms, pauses, and punch-in captions on the strongest lines.",
  },
  hybrid: {
    proof: "Pair a useful explanation with a reveal-style edit or quick example.",
    value: "Teach one idea, but package it like a discovery.",
    visual: "Alternate face-to-camera, b-roll, and big captions every 2-3 seconds.",
  },
};

const retentionTactics = [
  "Start with the result or mistake before any intro.",
  "Put the most clickable phrase on screen in the first second.",
  "Change visual format whenever the script changes purpose.",
  "Use one open loop before second 5 and close it after second 35.",
  "Cut filler words from the voiceover before editing the video.",
  "End with a specific question, not a generic follow request.",
  "Show a before/after or example before explaining the theory.",
  "Make the final frame readable long enough for screenshots.",
];

const textTemplates = [
  (t) => `${t}: the part people skip`,
  (t) => `Stop doing ${t} this way`,
  (t) => `3 steps for ${t}`,
  (t) => `The ${t} mistake`,
  (t) => `Before vs after: ${t}`,
  (t) => `Steal this ${t} framework`,
];

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
  if (pace === "story") return "Hold the story beats for 3-4 seconds, then quick-cut the reveal and takeaway.";
  if (pace === "balanced") return "Use 2-3 second shots: hook, example, explanation, proof, payoff.";
  return "Use fast cuts every 1.5-2 seconds with captions, zooms, and b-roll resets.";
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function pick(items, offset = 0) {
  return items[(generationRound + offset + Math.floor(Math.random() * items.length)) % items.length];
}

function buildFrameworkSet() {
  return shuffle(frameworkLibrary).slice(0, 3);
}

function buildScript(payload, framework, index) {
  const topic = payload.topic;
  const moves = categoryMoves[payload.category];
  const tone = toneLines[payload.tone];
  const hook = pick(framework.hooks, index)(topic);
  const prompt = pick(framework.close, index);
  const screenText = pick(textTemplates, index)(topic);
  const tacticSet = shuffle(retentionTactics).slice(0, 3);
  const toneA = pick(tone, index);
  const toneB = pick(tone, index + 1);

  return {
    title: `${framework.label}: ${topic}`,
    angle: framework.name,
    hook,
    beats: [
      `0-3s: Say: "${hook}" Show movement immediately. On-screen text: "${screenText}".`,
      `4-9s: Name the audience problem: "${payload.audience} usually lose time here because the first step is unclear."`,
      `10-18s: Set the loop: "${toneA}." Show the weak version, wrong assumption, or confusing example.`,
      `19-31s: Give proof: ${moves.proof} Keep each visual under three seconds.`,
      `32-44s: Deliver the useful method: explain the one rule, three steps, or before/after change viewers can copy.`,
      `45-54s: Payoff: "${toneB}." Show the improved result or the clearer version on screen.`,
      `55-60s: Engagement close: "${prompt}" Hold the final caption so viewers can read it.`,
    ],
    onScreen: [
      screenText,
      `Watch the change`,
      `Mistake → Fix → Result`,
      prompt,
    ],
    cta: prompt,
    tips: [
      paceLine(payload.pace),
      moves.visual,
      moves.value,
      framework.angle,
    ],
    retention: tacticSet,
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

function renderScripts(payload, reason = "Generated") {
  const selectedFrameworks = buildFrameworkSet();
  const scripts = selectedFrameworks.map((framework, index) => buildScript(payload, framework, index + 1));
  list.innerHTML = scripts
    .map(
      (script) => `
      <article class="script-card" data-testid="card-script-${script.index}">
        <div class="card-top">
          <div>
            <span class="badge">${escapeHtml(script.angle)}</span>
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

  statusEl.textContent = `${reason} 3 stronger scripts for "${payload.topic}". Variant ${generationRound + 1}.`;
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
  generationRound += 1;
  lastPayload = payload;
  renderScripts(payload, "Generated");
});

regenBtn.addEventListener("click", () => {
  const payload = getPayload();
  if (!payload.topic && !lastPayload) {
    statusEl.textContent = "Add a topic before regenerating.";
    topicInput.focus();
    return;
  }
  lastPayload = payload.topic ? payload : lastPayload;
  generationRound += 1;
  renderScripts(lastPayload, "Regenerated");
});

resetBtn.addEventListener("click", () => {
  HTMLFormElement.prototype.reset.call(form);
  document.querySelector("#category").value = "hybrid";
  document.querySelector("#audience").value = "curious viewers";
  lastPayload = null;
  generationRound = 0;
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
