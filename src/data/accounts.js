// ---------------------------------------------------------------------------
// PORTFOLIO DATA
// This file is the only place you need to edit to change content.
//
// Adding an account:  copy an account object, give it a unique `id`,
//                     and set `hidden: false` to show it on the homepage.
// Hiding an account:  set `hidden: true` — it disappears everywhere but a
//                     "locked" ghost tab hints that more exists.
// Adding a video:     drop the mp4 into  public/videos/<account-id>/
//                     and add an entry to that account's `videos` array
//                     with `src: "videos/<account-id>/<file>.mp4"`.
//                     Until a src exists, the phone shows a static
//                     "awaiting footage" screen so the layout still works.
//
// Videos are treated as horizontal (16:9): they play letterboxed in the
// vertical phone, and the on-video "full screen" button rotates the phone.
//
// Stats are deliberately loose — store a ballpark number and the site
// displays it rounded down with a "+" (102400 -> "100K+"), so you never
// have to chase exact counts.
// ---------------------------------------------------------------------------

export const site = {
  name: "cyn",
  title: "cyn — video portfolio",
  tagline: "short-form video, deliberately made.",
  // shown top-right of the homepage
  status: "open to collabs",
};

export const accounts = [
  {
    id: "main",
    handle: "@cyn.mp4", // TODO: replace with your real handle
    name: "main account",
    hidden: false,
    bio: "the flagship. trends translated, hooks tested, lessons logged.",
    stats: {
      followers: 1240,
      likes: 48200,
      views: 312000,
    },
    highlights: ["100K+ views on a single video", "1K+ followers organic", "0 paid promotion"],
    brands: ["brand one", "brand two", "brand three"], // TODO: real brand names
    videos: [
      {
        id: "main-01",
        title: "the hook experiment",
        src: null, // e.g. "videos/main/hook-experiment.mp4"
        poster: null,
        duration: "0:21",
        postedAt: "2026-03-14",
        stats: { views: 102400, likes: 8400 },
        hook: "rewrote the first 1.5 seconds four times before posting.",
        thoughts: [
          "The whole video was built backwards from the hook. I scripted the payoff first, then kept cutting the intro until nothing before the tension remained.",
          "Retention graph confirmed it: the fourth hook held 78% at the 3-second mark versus 41% on the first draft. Same footage, different first frame.",
          "Takeaway I keep reusing: the hook is not the start of the video, it is the reason the rest gets watched.",
        ],
        tags: ["hook-testing", "retention", "editing"],
      },
      {
        id: "main-02",
        title: "trend, but slower",
        src: null,
        poster: null,
        duration: "0:34",
        postedAt: "2026-04-02",
        stats: { views: 68400, likes: 5100 },
        hook: "took a fast trend and cut it at half speed on purpose.",
        thoughts: [
          "Everyone was racing this sound. I bet the opposite direction: slower pacing reads as confidence when the whole feed is frantic.",
          "Comments skewed toward 'why is this so satisfying' — which told me the pacing itself became the content.",
        ],
        tags: ["trend-remix", "pacing"],
      },
      {
        id: "main-03",
        title: "the widescreen cut",
        src: null,
        poster: null,
        duration: "0:48",
        postedAt: "2026-05-11",
        stats: { views: 41200, likes: 3300 },
        hook: "framed for full screen — the turn of the phone is the point.",
        thoughts: [
          "Horizontal on TikTok forces an interaction: the viewer has to go full screen, which is a tiny commitment. Tiny commitments raise watch-through.",
          "The framing gave me room for a two-subject composition that vertical crops always killed. Worth the reach penalty.",
        ],
        tags: ["16:9", "composition", "format-test"],
      },
      {
        id: "main-04",
        title: "post-mortem: the flop",
        src: null,
        poster: null,
        duration: "0:27",
        postedAt: "2026-06-05",
        stats: { views: 3100, likes: 240 },
        hook: "kept the flop in the portfolio on purpose.",
        thoughts: [
          "This one died at 3K views and it earns its slot here. The concept was strong but I buried the payoff behind context nobody asked for.",
          "Diagnosis: 9 seconds of setup before any visual change. The algorithm never got a completion signal to work with.",
          "Every account section here keeps one flop. Showing the analysis matters more than hiding the number.",
        ],
        tags: ["post-mortem", "honesty", "analytics"],
      },
    ],
  },

  {
    id: "alt",
    handle: "@cyn.offcut", // TODO: replace with your real handle
    name: "alt account",
    hidden: false,
    bio: "the lab. weirder ideas, rougher edits, faster feedback loops.",
    stats: {
      followers: 480,
      likes: 12600,
      views: 88000,
    },
    highlights: ["3 formats prototyped", "48h idea-to-post loop"],
    videos: [
      {
        id: "alt-01",
        title: "one-take rule",
        src: null,
        poster: null,
        duration: "0:18",
        postedAt: "2026-04-20",
        stats: { views: 24800, likes: 2100 },
        hook: "no cuts allowed — constraint as a style.",
        thoughts: [
          "Rule for this series: one take, no edits, whatever happens stays. Constraints kill my perfectionism loop and doubled my posting rate.",
          "The imperfections read as authenticity on the alt audience — the same rawness would undercut the main account's polish.",
        ],
        tags: ["constraint", "series-design"],
      },
      {
        id: "alt-02",
        title: "caption-first draft",
        src: null,
        poster: null,
        duration: "0:26",
        postedAt: "2026-05-18",
        stats: { views: 15900, likes: 1400 },
        hook: "wrote the comment section I wanted, then made the video for it.",
        thoughts: [
          "Reverse-engineered engagement: I listed five comments I wanted to receive, then built the video that would provoke them.",
          "Four of the five showed up within the first hour. Comment-baiting gets a bad name; designing for conversation is just knowing your ending.",
        ],
        tags: ["engagement-design", "writing"],
      },
      {
        id: "alt-03",
        title: "landscape b-roll study",
        src: null,
        poster: null,
        duration: "0:52",
        postedAt: "2026-06-14",
        stats: { views: 9800, likes: 860 },
        hook: "testing whether cinematic b-roll survives the vertical feed.",
        thoughts: [
          "Pure craft post. Horizontal b-roll, graded, no talking. Low reach, high saves — which is exactly the trade I expected.",
          "Saves-per-view is my quality metric on the alt: people bookmark what they want to study.",
        ],
        tags: ["b-roll", "grading", "16:9"],
      },
    ],
  },

  {
    id: "vault",
    handle: "@cyn.vault",
    name: "third account",
    hidden: true, // flip to false when you're ready to show it
    bio: "not public yet.",
    stats: { followers: 0, likes: 0, views: 0 },
    highlights: [],
    videos: [],
  },
];

export const visibleAccounts = () => accounts.filter((a) => !a.hidden);
export const hiddenCount = () => accounts.filter((a) => a.hidden).length;
export const getAccount = (id) => accounts.find((a) => a.id === id && !a.hidden) || null;
