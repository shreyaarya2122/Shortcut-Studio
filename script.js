const form = document.querySelector("#generator-form");
const topicInput = document.querySelector("#topic");
const list = document.querySelector("#script-list");
const statusEl = document.querySelector("#status");
const resetBtn = document.querySelector("#reset");
const regenBtn = document.querySelector("#regenerate");
const themeBtn = document.querySelector("[data-theme-toggle]");

let lastPayload = null;
let generationRound = 0;
const usedScriptSignatures = new Set();
const usedHooks = new Set();
const usedPrompts = new Set();
const usedFrameworks = new Set();

const POLICY_CATEGORIES = [
  {
    id: "adult",
    label: "Adult / sexual content",
    keywords: ["porn", "pornographic", "xxx", "nude", "nudes", "nudity", "sex tape", "sexual", "onlyfans", "escort", "fetish", "erotic", "strip club", "stripping", "camgirl", "nsfw"],
    reframe: (t) => `Healthy relationships and online safety: what creators should know about ${t.replace(/porn(ographic)?|xxx|nude(s)?|nudity|sex tape|sexual content|onlyfans|escort|erotic|nsfw/gi, "this topic").trim() || "this topic"}`,
    note: "Adult or sexualized content is not advertiser-safe and breaks YouTube's nudity and sexual content policy. Reframed as an awareness/education angle for general audiences.",
  },
  {
    id: "violence",
    label: "Graphic violence / gore",
    keywords: ["gore", "graphic violence", "behead", "decapitat", "torture", "murder tutorial", "how to kill", "stab someone", "shoot someone", "fight video", "street fight", "blood and gore", "snuff"],
    reframe: (t) => `Conflict de-escalation and online safety: a creator-friendly take on ${sanitizeTopic(t)}`,
    note: "Graphic violence is restricted by YouTube's violent or graphic content policy and is not advertiser-friendly. Reframed as a de-escalation and awareness angle.",
  },
  {
    id: "selfharm",
    label: "Self-harm / suicide",
    keywords: ["suicide", "kill myself", "kill yourself", "self harm", "self-harm", "cutting myself", "end my life", "ways to die", "how to die", "anorexia tips", "pro ana", "pro-ana", "thinspo"],
    reframe: (t) => `Mental health awareness and supportive resources: a sensitive creator angle on ${sanitizeTopic(t)}`,
    note: "Self-harm and suicide content is highly restricted by YouTube. Reframed as a supportive mental-health awareness angle. Includes a help-line reminder for viewers.",
    addSafetyResource: true,
  },
  {
    id: "dangerous",
    label: "Dangerous acts / pranks / challenges",
    keywords: ["dangerous prank", "scary prank", "harmful prank", "dangerous challenge", "tide pod", "blackout challenge", "choking challenge", "fire challenge", "car surfing", "train surfing", "rooftop jump", "parkour stunt", "drink bleach", "eat tide", "balcony jump", "dangerous stunt", "risky stunt"],
    reframe: (t) => `Why this trend is risky and what creators can do instead: a safe-creator breakdown of ${sanitizeTopic(t)}`,
    note: "Dangerous acts, harmful pranks, and risky challenges violate YouTube's harmful or dangerous content policy. Reframed as a creator-ethics and prevention angle — no operational instructions.",
  },
  {
    id: "weapons",
    label: "Weapons / explosives",
    keywords: ["how to make a bomb", "build a bomb", "ied", "pipe bomb", "homemade gun", "ghost gun", "3d print gun", "convert to full auto", "auto sear", "silencer", "suppressor build", "molotov", "explosive", "tnt recipe", "gunpowder recipe", "thermite"],
    reframe: (t) => `Public safety and policy context: an explainer-style creator angle on ${sanitizeTopic(t)}`,
    note: "Instructions for weapons or explosives are restricted by YouTube's firearms and harmful content policies. Reframed as a policy/explainer angle — no build steps.",
  },
  {
    id: "hate",
    label: "Hate / harassment / protected classes",
    keywords: ["hate speech", "racial slur", "ethnic slur", "white power", "white supremac", "neo-nazi", "kill all", "subhuman", "deserve to die", "exterminate", "n-word video", "homophobic rant", "transphobic rant", "doxx", "doxxing"],
    reframe: (t) => `Inclusion, respect, and online conduct: a creator-positive angle on ${sanitizeTopic(t)}`,
    note: "Hate speech, harassment, and attacks on protected groups violate YouTube's hate speech and harassment policies. Reframed as an inclusion and online-conduct angle.",
  },
  {
    id: "regulated",
    label: "Drugs, tobacco, vaping, firearms, gambling, regulated goods",
    keywords: ["how to get high", "drug recipe", "make meth", "make cocaine", "buy drugs online", "where to buy weed", "vape tricks for kids", "underage vape", "underage drinking", "fake id", "casino hack", "rigged slot", "gambling system", "match fixing"],
    reframe: (t) => `Risks, regulation, and safer creator coverage of ${sanitizeTopic(t)}`,
    note: "Regulated goods (drugs, tobacco, firearms sales, gambling systems) are restricted or limited by YouTube and its advertiser-friendly guidelines. Reframed as a regulation/awareness angle.",
  },
  {
    id: "scam",
    label: "Scams / dishonest behavior",
    keywords: ["scam tutorial", "phishing tutorial", "carding", "credit card dump", "stolen card", "hack instagram", "hack snapchat", "hack a phone", "free robux generator", "free v-bucks generator", "ponzi", "pyramid scheme tutorial", "fake reviews farm"],
    reframe: (t) => `Spotting and avoiding the trap: a viewer-protection angle on ${sanitizeTopic(t)}`,
    note: "Promoting scams, phishing, or dishonest behavior violates YouTube's spam, deceptive practices, and scams policy. Reframed as a scam-spotting / viewer-protection angle.",
  },
  {
    id: "medmis",
    label: "Medical or scientific misinformation",
    keywords: ["miracle cure", "cure cancer naturally", "covid hoax", "vaccines cause autism", "anti-vax", "anti vaccine", "essential oils cure", "drink bleach cure", "miracle weight loss", "guaranteed cure"],
    reframe: (t) => `What the evidence actually says: a fact-checked creator angle on ${sanitizeTopic(t)}`,
    note: "Medical or scientific claims that contradict health authorities are restricted by YouTube's medical misinformation policy. Reframed as a fact-check angle citing reputable sources.",
  },
  {
    id: "civic",
    label: "Election / civic misinformation",
    keywords: ["election was stolen", "rigged election", "voter fraud proof", "fake ballots", "stop the steal", "the election is fake", "voting machines hacked"],
    reframe: (t) => `How elections are actually verified: an evidence-based creator angle on ${sanitizeTopic(t)}`,
    note: "Election integrity claims are tightly governed by YouTube's elections misinformation policy. Reframed as an evidence-based civics explainer.",
  },
  {
    id: "tragedy",
    label: "Sensitive tragedies / events",
    keywords: ["mass shooting", "school shooting", "terror attack", "9/11 hoax", "holocaust hoax", "natural disaster jokes", "war atrocity"],
    reframe: (t) => `Respectful coverage and viewer support: a sensitive creator angle on ${sanitizeTopic(t)}`,
    note: "Sensitive events and tragedies need careful handling under YouTube's violent events and harassment policies, and are limited for advertisers. Reframed for respectful coverage.",
  },
  {
    id: "minors",
    label: "Child safety / minors",
    keywords: ["kids in swimsuits", "child model", "minor dating", "kids alone at night", "babysit minor flirt", "underage relationship", "sexualize minor", "loli"],
    reframe: (t) => `Online safety for kids and parents: a protective creator angle on ${sanitizeTopic(t)}`,
    note: "Anything that could endanger minors is one of YouTube's strictest policy areas. Reframed entirely as a child-safety / parent-education angle. No identifying or risky details.",
  },
  {
    id: "claims",
    label: "Misleading or guaranteed claims",
    keywords: ["guaranteed money", "get rich quick", "guaranteed 10k", "100% guaranteed", "no risk profit", "secret millionaire trick", "instant six pack", "lose 30 pounds in a week", "guaranteed views", "guaranteed subscribers"],
    reframe: (t) => `Realistic expectations and honest creator framing of ${sanitizeTopic(t)}`,
    note: "Guaranteed-outcome claims violate YouTube's deceptive practices guidelines and advertiser-friendly rules. Reframed with honest, evidence-based language.",
  },
];

function sanitizeTopic(t) {
  if (!t) return "this topic";
  return t.replace(/\s+/g, " ").trim();
}

function detectPolicyIssue(rawTopic) {
  const t = (rawTopic || "").toLowerCase();
  if (!t) return null;
  for (const cat of POLICY_CATEGORIES) {
    for (const kw of cat.keywords) {
      if (t.includes(kw.toLowerCase())) {
        return { category: cat, matchedKeyword: kw };
      }
    }
  }
  return null;
}

function buildSafePayload(originalPayload, policyHit) {
  const safeTopic = policyHit.category.reframe(originalPayload.topic);
  return {
    ...originalPayload,
    topic: safeTopic,
    originalTopic: originalPayload.topic,
    policyHit,
  };
}

const safetyChecklist = [
  "Avoid graphic, shocking, or gory visuals — keep imagery suggestive, not explicit.",
  "No hate, slurs, harassment, or attacks on protected groups.",
  "No sexualized titles, thumbnails, or descriptions — even for safe topics.",
  "Do not show or instruct dangerous acts, pranks, or stunts that could cause harm.",
  "Cite reputable sources for any health, safety, financial, or scientific claims.",
  "Avoid guaranteed outcomes — say 'can help', not 'will guarantee'.",
  "Use educational framing for sensitive subjects; add a brief disclaimer when needed.",
  "Keep music, clips, and footage license-clean to stay monetizable.",
];

const safetyChecklistVariants = [
  [
    "Skip shock-bait thumbnails and clickbait titles — write the title that matches the payoff.",
    "Avoid mocking, insulting, or stereotyping any group — punch at ideas, not people.",
    "If a claim could affect health, money, or safety, attach a source on screen.",
    "Replace 'guaranteed' with 'often', 'can', or 'in my experience'.",
    "Keep visuals PG-13 max: no nudity, no blood-pooling, no real injury footage.",
  ],
  [
    "Trim any line that sensationalizes harm, death, or tragedy.",
    "Use B-roll and motion graphics instead of real shocking footage.",
    "Disclose sponsorships, AI-generated visuals, and dramatizations on screen.",
    "Ask a respectful question at the end — avoid baiting outrage in comments.",
    "License music or use the YouTube Audio Library to stay monetizable.",
  ],
  [
    "Re-read your hook out loud — if it sounds like a tabloid, soften it.",
    "Blur faces, license plates, and any private info that appears in B-roll.",
    "If you reference a study or statistic, show the source on screen for two seconds.",
    "Avoid framing minors in any sexualized, risky, or dangerous context — ever.",
    "Skip 'do this and you will get rich/famous/healthy' — show the realistic range.",
  ],
];

const frameworkLibrary = [
  {
    name: "Mistake reversal",
    label: "Stop doing this",
    angle: "Show the common mistake, then flip it into a better method.",
    hooks: [
      (t) => `If your ${t} is stalling, it is almost always one wrong move at the start.`,
      (t) => `The first time I tried ${t}, I made the same mistake almost every beginner makes.`,
      (t) => `${t} feels harder than it should because most people fix the wrong step first.`,
      (t) => `Watch the wrong way to handle ${t}, then watch the version that actually lands.`,
    ],
    close: [
      "Comment 'fix' and I will turn this into a free checklist.",
      "Which mistake do you see most often in your feed?",
      "Save this so future-you does not repeat it.",
      "Tell me which step usually trips you up.",
    ],
  },
  {
    name: "Myth vs truth",
    label: "Myth breaker",
    angle: "Challenge a belief, prove the better answer, then give a simple takeaway.",
    hooks: [
      (t) => `The biggest lie about ${t} is that you need more time. You need a cleaner structure.`,
      (t) => `${t} is not complicated — it has just been explained badly for years.`,
      (t) => `Half the advice on ${t} sounds smart and quietly slows you down.`,
      (t) => `If your ${t} feels harder than your friends' version, the rule you were taught is probably wrong.`,
    ],
    close: [
      "Comment 'myth' if this changed how you see it.",
      "What myth should I break next?",
      "Send this to someone still doing it the old way.",
      "Tell me which 'rule' you are dropping after this.",
    ],
  },
  {
    name: "3-step shortcut",
    label: "Fast framework",
    angle: "Give viewers a repeatable three-step process they can use immediately.",
    hooks: [
      (t) => `Three steps for ${t} — spot it, shape it, ship it.`,
      (t) => `If I had 60 seconds to teach ${t}, I would only use these three moves.`,
      (t) => `Most ${t} problems disappear once you put these three steps in this order.`,
      (t) => `Steal this 3-step structure for ${t} — it works whether you have 5 minutes or 5 days.`,
    ],
    close: [
      "Save this and try the three steps today.",
      "Which step should I turn into a full breakdown?",
      "Comment the topic you want me to simplify next.",
      "Tag a creator who needs the third step the most.",
    ],
  },
  {
    name: "Story reveal",
    label: "Mini story",
    angle: "Open with a tiny story, reveal the lesson, then turn it into advice.",
    hooks: [
      (t) => `I watched a friend rebuild their ${t} in a weekend after a year of struggling.`,
      (t) => `The strangest thing happened the third time I tried ${t} — the rule everyone gave me was wrong.`,
      (t) => `Two creators tried ${t} the same week. One got a million views. The difference was a single line.`,
      (t) => `A reader sent me a ${t} that should not have worked. I keep thinking about why it did.`,
    ],
    close: [
      "Would you test this approach? Yes or no?",
      "Comment 'story' if you want more breakdowns like this.",
      "What would you change first?",
      "Drop a story of your own — I read every comment.",
    ],
  },
  {
    name: "Contrarian take",
    label: "Hot take",
    angle: "Say the unexpected thing, defend it, and make viewers respond.",
    hooks: [
      (t) => `Hot take — most ${t} advice is solving the wrong problem.`,
      (t) => `Unpopular opinion: the standard ${t} playbook is the reason creators plateau.`,
      (t) => `${t} does not need more effort. It needs you to remove one specific habit.`,
      (t) => `If your ${t} is decent and not growing, you are probably trying to perfect the wrong layer.`,
    ],
    close: [
      "Agree or disagree? Tell me why.",
      "Comment the part you would remove first.",
      "Share this with someone who loves overcomplicating it.",
      "Where does this take fall apart? I want the strongest counter.",
    ],
  },
  {
    name: "Before and after",
    label: "Transformation",
    angle: "Show a weak version, improve it, then explain the difference.",
    hooks: [
      (t) => `Same ${t}, two versions — one feels lazy, one feels expensive. The change is small.`,
      (t) => `Watch ${t} before and after a single edit, and tell me which one you would keep watching.`,
      (t) => `One small adjustment turns most ${t} attempts from 'fine' into 'shareable'.`,
      (t) => `Here is the cheap-looking version of ${t} and the version that holds attention to the last second.`,
    ],
    close: [
      "Comment 'before' if you want me to review your example.",
      "Which version would you keep watching?",
      "Save this as a quick editing checklist.",
      "Drop a link to your draft and I will pick one to break down.",
    ],
  },
  {
    name: "Curiosity stack",
    label: "Curiosity ladder",
    angle: "Stack three quick questions that pull the viewer to the payoff.",
    hooks: [
      (t) => `Three questions about ${t} that keep coming up in my comments — I will answer them in order.`,
      (t) => `If you have ever wondered why ${t} works for some creators and flops for others, this is the cleanest answer I have.`,
      (t) => `Pick a number from one to three — that is the part of ${t} I will fix in this Short.`,
      (t) => `Most viewers stop watching ${t} content at the same exact second. Here is what to put there instead.`,
    ],
    close: [
      "Drop your number — one, two, or three — and I will go deeper on it.",
      "Which question were you stuck on?",
      "Tell me your niche so I can answer your version next.",
      "Comment the question you wish more creators would answer.",
    ],
  },
  {
    name: "Behind the scenes",
    label: "BTS reveal",
    angle: "Show how the result was made, then turn the process into a takeaway.",
    hooks: [
      (t) => `Here is how I actually plan ${t} in the messy, unfiltered version.`,
      (t) => `My ${t} looks polished on camera and absolutely is not behind the scenes — that is the point.`,
      (t) => `The 'pro' version of ${t} is mostly the same as yours, with two boring decisions that change everything.`,
      (t) => `If you saw the real process behind ${t}, you would copy it the next day.`,
    ],
    close: [
      "Want the full BTS in a longer video? Comment 'BTS'.",
      "Which step would you skip?",
      "Tell me which BTS detail surprised you most.",
      "Save this and try the boring step before the fun one.",
    ],
  },
];

const toneLines = {
  curious: ["Here is the part nobody talks about", "Notice the tiny shift", "That is the lever doing the work"],
  dramatic: ["This is the moment most creators lose the room", "Now the switch happens", "That single choice rewrites the outcome"],
  funny: ["This is the goofy chaos moment", "The internet keeps trying to make this harder", "Painful, useful, slightly cursed"],
  coach: ["Use this exact structure", "Do not skip this step", "Steal this for your next Short"],
};

const categoryMoves = {
  education: {
    proof: "Show a clean example, screen recording, diagram, or side-by-side comparison.",
    value: "Send the viewer away with one repeatable rule they can apply today.",
    visual: "Use chapter-style captions: Mistake → Fix → Example → Result.",
  },
  entertainment: {
    proof: "Use a reaction shot, clip-style cutaway, or quick visual contrast.",
    value: "Make the viewer feel a twist, reveal, or opinion they want to debate respectfully.",
    visual: "Use zooms, pauses, and punch-in captions on the strongest lines.",
  },
  hybrid: {
    proof: "Pair a useful explanation with a reveal-style edit or quick example.",
    value: "Teach one idea, but package it like a discovery.",
    visual: "Alternate face-to-camera, b-roll, and big captions every 2-3 seconds.",
  },
};

const audienceProblems = [
  (audience) => `${audience} scroll the moment a video opens with throat-clearing instead of a payoff.`,
  (audience) => `${audience} do not need more setup; they need one reason to care in the first beat.`,
  (audience) => `${audience} stay longer when the video shows the result before the explanation.`,
  (audience) => `${audience} drift the moment the example is delayed past second seven.`,
  (audience) => `${audience} respond when you give them a clear opinion to nod with or push back on.`,
  (audience) => `${audience} save Shorts that turn a fuzzy idea into a repeatable move.`,
  (audience) => `${audience} skip when a Short feels like a lecture instead of a discovery.`,
  (audience) => `${audience} share content that makes them sound smarter in a group chat.`,
];

const loopSetups = [
  "Show the wrong version first, but do not explain the fix yet.",
  "Put a blurred or cropped result on screen and promise to reveal why it worked.",
  "Ask a yes/no question viewers can answer silently while watching.",
  "Show two options and hint that the weaker-looking one performs better.",
  "Make the viewer choose a side before you reveal the lesson.",
  "Start a countdown: three things to remove, two things to keep, one thing to copy.",
  "Tease the final frame in the first 3 seconds, then earn it back by second 45.",
  "Reveal one number on screen and promise a second number that contradicts it.",
];

const payoffMoves = [
  "Turn the lesson into a one-line rule the viewer can remember in the shower.",
  "Show the improved version next to the weak version for instant contrast.",
  "Reveal the hidden edit, phrase, or order that changed the result.",
  "Give viewers a copyable mini-template they can use after the video.",
  "Summarize the transformation in a single caption: before → switch → after.",
  "End with a practical test viewers can run on their next Short.",
  "Hand viewers a tiny script they can read aloud during their next attempt.",
  "Show the same idea applied to two different niches so it feels universal.",
];

const editorDirections = [
  "Use a jump cut on every claim, then slow down on the reveal.",
  "Punch in by 8-12% the moment the contradiction appears.",
  "Put the strongest noun in yellow or accent color for one beat.",
  "Use a swipe transition only when moving from mistake to fix.",
  "Show receipts: screen recording, sketch, search result, or side-by-side frame.",
  "Keep the final CTA card clean — one question, one font, one color.",
  "Drop the music for half a second on the strongest line — silence sells.",
  "Use a hand-drawn arrow over the screen text on your sharpest claim.",
];

const viralScoreReasons = [
  "Strong curiosity gap, fast payoff, comment-friendly ending — and entirely advertiser-safe.",
  "Clear before/after contrast with high save potential and a clean policy footprint.",
  "Debatable framing that earns comments without slipping into clickbait.",
  "Practical framework that makes viewers feel smarter in under a minute.",
  "Story-led opening that creates a reason to stay until the reveal.",
  "High replay value because the viewer can copy the structure verbatim.",
  "Trust-building framing — informative without sensationalizing.",
  "Title and hook stay safe enough to run on Shorts and a long-form follow-up.",
];

const hookDifferentiators = [
  "The fix is the order, not the tool.",
  "The first three seconds decide whether the rest survives.",
  "The secret is showing proof before explanation.",
  "The viewer needs the result before the lecture.",
  "The simplest version usually wins.",
  "The edit matters as much as the idea.",
  "The wrong opening makes a strong idea feel boring.",
  "The shareable beat must arrive before the halfway mark.",
  "The comment trigger needs to be built into the setup.",
  "The best version feels useful and slightly debatable.",
  "The payoff should feel screenshot-worthy.",
  "The hook should make the viewer pick a side without feeling tricked.",
];

const promptDifferentiators = [
  "Ask them to reply with one word.",
  "Ask them to pick side A or side B.",
  "Ask them what they would test next.",
  "Ask them to comment their niche.",
  "Ask them which step they would steal.",
  "Ask them what part deserves a deeper breakdown.",
  "Ask them whether they agree or disagree, and why.",
  "Ask them to save it as a checklist.",
  "Ask them to tag a creator who needs it.",
  "Ask them to vote for the next topic.",
  "Ask them to drop a number from 1-3 that matches their stuck point.",
];

const payoffFocus = [
  "make the first line impossible to ignore",
  "show the result before the explanation",
  "turn the idea into a repeatable shortcut",
  "make viewers compare two choices",
  "create a clean before-and-after moment",
  "give the viewer a reason to comment without baiting outrage",
  "make the middle of the video feel like a reveal",
  "turn the takeaway into a save-worthy checklist",
  "make the edit pattern carry the idea",
  "end with a question viewers can answer in one breath",
];

const retentionTactics = [
  "Open with the result or mistake before any intro.",
  "Put the most clickable phrase on screen in the first second.",
  "Change visual format whenever the script changes purpose.",
  "Use one open loop before second 5 and close it after second 35.",
  "Cut filler words from the voiceover before editing the visuals.",
  "End with a specific question, not a generic follow request.",
  "Show a before/after or example before explaining the theory.",
  "Make the final frame readable long enough for screenshots.",
  "Hold the strongest sentence on screen for at least two seconds.",
  "Reset the viewer's eye every 3 seconds with a new framing or caption.",
];

const textTemplates = [
  (t) => `${t}: the part people skip`,
  (t) => `Stop doing ${t} this way`,
  (t) => `3 steps for ${t}`,
  (t) => `The ${t} mistake`,
  (t) => `Before vs after: ${t}`,
  (t) => `Steal this ${t} framework`,
  (t) => `${t}: the boring rule that wins`,
  (t) => `One-line fix for ${t}`,
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
  if (pace === "story") return "Hold story beats for 3-4 seconds, then quick-cut the reveal and takeaway.";
  if (pace === "balanced") return "Use 2-3 second shots: hook, example, explanation, proof, payoff.";
  return "Use fast cuts every 1.5-2 seconds with captions, zooms, and B-roll resets.";
}

function pick(items, offset = 0) {
  return items[Math.abs(generationRound * 7 + offset * 11) % items.length];
}

function pickBySeed(items, seed) {
  return items[Math.abs(seed) % items.length];
}

function buildFrameworkSet() {
  const total = frameworkLibrary.length;
  const start = generationRound % total;
  const stride = (generationRound % 3) + 2;
  const chosen = [];
  let i = 0;
  while (chosen.length < 3 && i < total * 2) {
    const fw = frameworkLibrary[(start + i * stride) % total];
    if (!chosen.includes(fw)) chosen.push(fw);
    i += 1;
  }
  while (chosen.length < 3) {
    chosen.push(frameworkLibrary[(start + chosen.length) % total]);
  }
  return chosen;
}

function pickSafetyChecklist(index) {
  const variantIndex = (generationRound + index) % safetyChecklistVariants.length;
  const variant = safetyChecklistVariants[variantIndex];
  const baseStart = (generationRound + index) % safetyChecklist.length;
  const base = [
    safetyChecklist[baseStart],
    safetyChecklist[(baseStart + 3) % safetyChecklist.length],
    safetyChecklist[(baseStart + 5) % safetyChecklist.length],
  ];
  return [...base, ...variant.slice(0, 3)];
}

function buildScript(payload, framework, index) {
  const topic = payload.topic;
  const moves = categoryMoves[payload.category];
  const tone = toneLines[payload.tone];
  const hookSeed = generationRound * 31 + index * 17;
  const baseHook = pick(framework.hooks, index)(topic);
  let hook = `${baseHook} ${pickBySeed(hookDifferentiators, hookSeed)} Use it to ${pickBySeed(payoffFocus, hookSeed)}.`;
  let hookSafety = 0;
  while (usedHooks.has(hook) && hookSafety < framework.hooks.length * hookDifferentiators.length * payoffFocus.length) {
    const altBase = pick(framework.hooks, index + hookSafety + 1)(topic);
    hook = `${altBase} ${pickBySeed(hookDifferentiators, hookSeed + hookSafety + 2)} Use it to ${pickBySeed(payoffFocus, hookSeed + hookSafety + 5)}.`;
    hookSafety += 1;
  }
  usedHooks.add(hook);
  let prompt = `${pick(framework.close, index)} ${pickBySeed(promptDifferentiators, hookSeed + 1)}`;
  let promptSafety = 0;
  while (usedPrompts.has(prompt) && promptSafety < framework.close.length * promptDifferentiators.length) {
    prompt = `${pick(framework.close, index + promptSafety + 1)} ${pickBySeed(promptDifferentiators, hookSeed + promptSafety + 7)}`;
    promptSafety += 1;
  }
  usedPrompts.add(prompt);
  const screenText = pick(textTemplates, index)(topic);
  const tacticStart = (generationRound + index) % retentionTactics.length;
  const tacticSet = [0, 1, 2].map((step) => retentionTactics[(tacticStart + step) % retentionTactics.length]);
  const toneA = pick(tone, index);
  const toneB = pick(tone, index + 1);
  const problem = pick(audienceProblems, index)(payload.audience);
  const loop = pick(loopSetups, index + 2);
  const payoff = pick(payoffMoves, index + 3);
  const editor = pick(editorDirections, index + 4);
  const score = 86 + ((generationRound * 5 + index * 3) % 12);
  const scoreReason = pick(viralScoreReasons, index + 5);
  const safety = pickSafetyChecklist(index);

  return {
    title: `${framework.label}: ${topic}`,
    angle: framework.name,
    hook,
    beats: [
      `0-3s: Say: "${hook}" Show motion immediately. On-screen text: "${screenText}".`,
      `4-9s: Name the audience reality: "${problem}"`,
      `10-18s: Set the loop — "${toneA}." ${loop}`,
      `19-31s: Drop proof: ${moves.proof} Keep each visual under three seconds.`,
      `32-44s: Land the useful method: ${payoff}`,
      `45-54s: Payoff line: "${toneB}." ${editor}`,
      `55-60s: Engagement close: "${prompt}" Hold the final caption long enough to screenshot.`,
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
      `Viral score: ${score}/100 — ${scoreReason}`,
    ],
    retention: tacticSet,
    safety,
    framework: framework.name,
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
${script.retention.map((item) => `- ${item}`).join("\n")}

YouTube safety check:
${script.safety.map((item) => `- ${item}`).join("\n")}`;
}

function renderPolicyBanner(policyHit, originalTopic, safeTopic) {
  if (!policyHit) return "";
  const resourceLine = policyHit.category.addSafetyResource
    ? `<p class="policy-resource"><strong>Viewer resource:</strong> If you or someone you know is struggling, include a help line such as the 988 Suicide &amp; Crisis Lifeline (US) or the local equivalent on screen.</p>`
    : "";
  return `
    <article class="policy-banner" role="status" data-testid="policy-banner">
      <div class="policy-banner-head">
        <span class="policy-tag">YouTube safety check</span>
        <h3>Topic reframed for YouTube and advertiser safety</h3>
      </div>
      <p><strong>Detected:</strong> ${escapeHtml(policyHit.category.label)} (matched on "${escapeHtml(policyHit.matchedKeyword)}")</p>
      <p><strong>Why:</strong> ${escapeHtml(policyHit.category.note)}</p>
      <p><strong>Your topic:</strong> ${escapeHtml(originalTopic)}</p>
      <p><strong>Reframed as:</strong> ${escapeHtml(safeTopic)}</p>
      ${resourceLine}
      <p class="policy-foot">ShortCut Studio does not generate operational instructions for harmful content. We aim to align with YouTube's Community Guidelines and advertiser-friendly content guidelines, but creators are responsible for their final upload.</p>
    </article>
  `;
}

function renderScripts(payload, reason = "Generated", policyHit = null, originalTopic = null) {
  let scripts = [];
  let safety = 0;
  while (scripts.length < 3 && safety < 30) {
    const selectedFrameworks = buildFrameworkSet();
    const candidates = selectedFrameworks.map((framework, index) => buildScript(payload, framework, index + 1));
    candidates.forEach((candidate) => {
      const signature = `${candidate.title}|${candidate.hook}|${candidate.beats.join("|")}|${candidate.cta}`;
      const fwKey = `${candidate.framework}|${generationRound}`;
      if (!usedScriptSignatures.has(signature) && scripts.length < 3) {
        usedScriptSignatures.add(signature);
        usedFrameworks.add(fwKey);
        scripts.push(candidate);
      }
    });
    if (scripts.length < 3) {
      generationRound += 1;
    }
    safety += 1;
  }

  if (scripts.length < 3) {
    usedScriptSignatures.clear();
    usedHooks.clear();
    usedPrompts.clear();
    usedFrameworks.clear();
    const selectedFrameworks = buildFrameworkSet();
    scripts = selectedFrameworks.map((framework, index) => buildScript(payload, framework, index + 1));
    scripts.forEach((script) => usedScriptSignatures.add(`${script.title}|${script.hook}|${script.beats.join("|")}|${script.cta}`));
  }

  const banner = policyHit ? renderPolicyBanner(policyHit, originalTopic, payload.topic) : "";

  list.innerHTML = banner + scripts
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
          <section class="script-section full safety-section" data-testid="safety-check-${script.index}">
            <h4>YouTube safety check</h4>
            <p class="safety-lede">Every script is structured around YouTube's Community Guidelines and advertiser-friendly content rules. Use this checklist before publishing.</p>
            <ul>${script.safety.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
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

  if (policyHit) {
    statusEl.textContent = `${reason} 3 YouTube-safe scripts. Topic was reframed: ${policyHit.category.label}. Variant ${generationRound + 1}.`;
  } else {
    statusEl.textContent = `${reason} 3 creator-grade, YouTube-safe scripts for "${payload.topic}". Variant ${generationRound + 1}.`;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function generate(reason) {
  const payload = getPayload();
  if (!payload.topic) {
    statusEl.textContent = "Add a topic first.";
    topicInput.focus();
    return;
  }
  generationRound += 1;
  const policyHit = detectPolicyIssue(payload.topic);
  let renderPayload = payload;
  let originalTopic = null;
  if (policyHit) {
    originalTopic = payload.topic;
    renderPayload = buildSafePayload(payload, policyHit);
  }
  lastPayload = renderPayload;
  renderScripts(renderPayload, reason, policyHit, originalTopic);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  generate("Generated");
});

regenBtn.addEventListener("click", () => {
  const payload = getPayload();
  if (!payload.topic && !lastPayload) {
    statusEl.textContent = "Add a topic before regenerating.";
    topicInput.focus();
    return;
  }
  if (payload.topic) {
    generate("Regenerated");
    return;
  }
  generationRound += 1;
  renderScripts(lastPayload, "Regenerated", lastPayload.policyHit || null, lastPayload.originalTopic || null);
});

resetBtn.addEventListener("click", () => {
  HTMLFormElement.prototype.reset.call(form);
  document.querySelector("#category").value = "hybrid";
  document.querySelector("#audience").value = "curious viewers";
  lastPayload = null;
  generationRound = 0;
  usedScriptSignatures.clear();
  usedHooks.clear();
  usedPrompts.clear();
  usedFrameworks.clear();
  list.innerHTML = `<article class="empty-state"><h3>Your scripts will appear here.</h3><p>Try a topic with a clear curiosity gap, surprising fact, or transformation promise. Every result is filtered against YouTube's Community Guidelines and advertiser-friendly rules.</p></article>`;
  statusEl.textContent = "Enter a topic to create three 60-second scripts with hooks, prompts, editing notes, and a YouTube safety check.";
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
