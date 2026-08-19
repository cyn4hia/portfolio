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
// Orientation:  every video declares `orientation: "horizontal" | "vertical"`
//               (missing = vertical).
//               horizontal — plays letterboxed 16:9 in the vertical phone,
//               with the on-video "full screen" button that turns the phone.
//               vertical   — fills the phone screen like a native TikTok;
//               no letterbox, no rotation.
//
// Profile picture:  set an account's `avatar` to an image path (drop the
//                   file in public/images/) — null falls back to the
//                   monogram circle.
//
// Stats are deliberately loose — store a ballpark number and the site
// displays it rounded down with a "+" (102400 -> "100K+"), so you never
// have to chase exact counts.
//
// Hiding stats:  set `statsHidden: true` on any video and the viewer's
//                performance card reads "hidden" instead of the numbers.
//
// Collections:  an account may carry a `collections` array — content
//               categories (e.g. "motion", "anime", "ai") shown ONLY on that
//               account's profile as a row of buttons below the main grid;
//               each button opens that category's reel. Every collection keeps
//               its footage in its own folder (public/videos/<account-id>/
//               <collection-id>/) so the content types never mix. Collection
//               clips are title-only: no hook, no field notes — just the work
//               and its numbers.
// ---------------------------------------------------------------------------

export const site = {
  name: "cindy",
  title: "cindy's content creation portfolio",
  tagline: "after effects design and creation",
  // shown top-right of the homepage
  status: "open to collabs",
  // the self-introduction card — appears once on your first hover of the
  // account window; after that only the "about me" button toggles it
  about: {
    label: "file://about-me",
    avatar: "/videos/main/me.jpg",
    title: "hey. im cindy",
    lines: [
      "Content creator since 2021.",
      "All my accounts were grown from the ground up, 0 following, 0 followers from the very start. But by understanding my audience, I was able to create content for millions of people.",
      "I love watching TikTok which is why I create!",
    ],
    facts: [
      { label: "based in", value: "boston, ma" },
      { label: "mail", value: "zhou.cy@northeastern.edu" },
      { label: "github", value: "@cyn4hia" },
    ]
  },
};

export const accounts = [
  {
    id: "main",
    handle: "@soft",
    name: "Editing Account",
    avatar: "/videos/main/pfp.jpeg", 
    hidden: false,
    bio: "after effects design and creation",
    stats: {
      followers: 1800,
      likes: 360000,
      views: 40000000,
    },
    highlights: ["Motion graphics", "20 million views in 1 month", "Diverse content"],
    brands: ["Anthropic"],
    videos: [
      {
        id: "fable-5-ad",
        title: "Fable 5 Relaunch Campaign",
        src: "/videos/main/post-freefable.MP4",
        orientation: "horizontal",
        poster: "/videos/main/fable5-cover.png",
        duration: "0:13",
        postedAt: "2026-06-14",
        stats: { views: 38000000, likes: 60000 },
        hook: "Quick Edit Turned Viral",
        thoughts: [
          "Originally the video was created after Fable 5 was disabled to encourage more discussion about the model.",
          "Anthropic reached out for a paid partnership, requesting to promote as an AD for their relaunch",
          "Reached various different audiences, leading a lot of users to test out the model and talk about their work",
        ],
        tags: ["partnership", "ai", "mograph"],
      },
      {
        id: "claude-mog",
        title: "Controversial 'Best' AI Model",
        src: "/videos/main/claude-mog_1.mp4",
        orientation: "horizontal",
        poster: "/videos/main/mog-cover.png",
        duration: "0:17",
        postedAt: "2026-06-04",
        stats: { views: 1100000, likes: 120000 },
        hook: "OBVIOUSLY Claude is the best",
        thoughts: [
          "First time making content about AI after spending a few days posting anime edits",
          "Only reached 10k views at the beginning, but absolutely skyrocked pre-Fable 5 release",
          "Receivied a lot of comments and engagement due to various opinions",
        ],
        tags: ["opinions", "claude"],
      },
      {
        id: "weathering",
        title: "Weathering Edit",
        src: "/videos/main/weathering-hoodie-post.mp4",
        orientation: "horizontal",
        poster: "/videos/main/weathering-hoodie.png",
        duration: "0:12",
        postedAt: "2026-07-28",
        stats: { views: 300000, likes: 70000 },
        hook: "Weathering With You x Hoodie",
        thoughts: [
          "Brought back memories of one of my favorite animes",
          "Fast paced sad intro stormy intro into a happy, sunny ending. Perfectly describes the anime.",
          "Reached a lot of new viewers, leading to a rise in popularity for my anime related videos.",
        ],
        tags: ["post-mortem", "honesty", "analytics"],
      },
      {
        id: "claude-names",
        title: "The Art of Anthropic Model Naming",
        src: "/videos/main/post-claudenaming.mp4",
        orientation: "horizontal",
        poster: "/videos/main/name-cover.png",
        duration: "0:24",
        postedAt: "2026-06-21",
        stats: { views: 200000, likes: 20000 },
        hook: "Meanings, not just numbers",
        thoughts: [
          "Unlike many other AI models, all of the Claude model names represented by literary termns based on their capabilities and functions.",
          "A beautiful visualizer to show the depth to these names",
          "Quite an overlooked topic! A lot of people commented that they only just learned from watching this video",
        ],
        tags: ["claude", "art", "aesthetics"],
      },
    ],
    // two content lanes shown only on this account's profile — each its own
    // folder under public/videos/main/ so motion + anime footage never mix.
    // title-only by design (no hook / thoughts); `statsHidden` blanks a clip's
    // performance card. drop files at the path shown in each `src`.
    collections: [
      {
        id: "motion",
        label: "motion",
        blurb: "movement with meaning",
        videos: [
          {
            id: "fable5 ui",
            title: "Fable 5 UI Redesign",
            src: "/videos/main/motion/fable5ui-post.mp4", 
            orientation: "horizontal",
            poster: null,
            duration: "0:07",
            postedAt: "2026-07-01",
            stats: { views: 12900, likes: null},
            tags: ["mograph", "ui design"],
          },
          {
            id: "claude splash",
            title: "Claude Splash",
            src: "/videos/main/motion/claude-splash.mp4",
            orientation: "horizontal",
            poster: null,
            duration: "0:10",
            postedAt: "2026-07-17",
            stats: { views: 12800, likes: 1200 },
            tags: ["smooth", "claude"],
          },
          {
            id: "nvidia fashion",
            title: "Nvidia Fashion",
            src: "/videos/main/motion/nvidia-fashion.mp4",
            orientation: "horizontal",
            poster: null,
            duration: "0:12",
            postedAt: "2026-06-13",
            stats: { views: 9100, likes: null },
            tags: ["lyrical", "nvidia"],
          },
          {
            id: "clawd-buddy",
            title: "Clawd Coding Buddy",
            src: "/videos/main/motion/clawd-buddy.mp4",
            orientation: "horizontal",
            poster: null,
            duration: "0:15",
            postedAt: "2026-06-23",
            stats: { views: 11000, likes: null },
            tags: ["fun", "clawd"],
          },
        ],
      },
      {
        id: "anime",
        label: "anime",
        blurb: "all genres of anime, clips of my favorites",
        videos: [
          {
            id: "lover-boy",
            title: "Lover Boy Triology",
            src: "public/videos/main/anime/loverboy-post.mp4",
            orientation: "horizontal",
            poster: null,
            duration: "0:15",
            postedAt: "2026-08-08",
            stats: { views: 77000, likes: 17000 },
            tags: ["manga", "animation"],
          },
          {
            id: "legendary-yourname",
            title: "Legendary Lovers",
            src: "public/videos/main/anime/legendary-yourname.mp4",
            orientation: "horizontal",
            poster: null,
            duration: "0:07",
            postedAt: "2026-06-01",
            stats: { views: 27000, likes: 4800 },
            tags: ["red string", "lovers"],
          },
          {
            id: "haikyuu-motion",
            title: "Left Right Left Right",
            src: "public/videos/main/anime/haikyuu.mp4",
            orientation: "horizontal",
            poster: null,
            duration: "0:09",
            postedAt: "2026-06-10",
            stats: { views: 23000, likes: 4200 },
            tags: ["anime", "mograph"],
          },
          {
            id: "ari-reze",
            title: "Reze in Motion",
            src: "public/videos/main/anime/ari-reze.mp4",
            orientation: "horizontal",
            poster: null,
            duration: "0:10",
            postedAt: "2026-06-07",
            stats: { views: 17000, likes: 2700 },
            tags: ["anime", "mograph"],
          },
          {
            id: "weathering-colors",
            title: "Weathering With You x Colors",
            src: "public/videos/main/anime/weathering-colors-post.mp4",
            orientation: "horizontal",
            poster: null,
            duration: "0:14",
            postedAt: "2026-08-03",
            statsHidden: true,
            stats: { views: 30000, likes: 5400 },
            tags: ["red string", "lovers"],
          },
        ],
      },
      {
        id: "ai talk",
        label: "ai talk",
        blurb: "From LLMs to new tech, you get it all",
        videos: [
          {
            id: "opus5-release",
            title: "Opus 5 Release",
            src: "public/videos/main/ai/opus5-release-post.mp4",
            orientation: "horizontal",
            poster: null,
            duration: "0:10",
            postedAt: "2026-07-26",
            stats: { views: 60000, likes: 6500 },
            tags: ["opus5", "release"],
          },
          {
            id: "fives",
            title: "5s",
            src: "public/videos/main/ai/opus5.mp4",
            orientation: "horizontal",
            poster: null,
            duration: "0:06",
            postedAt: "2026-07-16",
            stats: { views: 43000, likes: 3000 },
            tags: ["leak", "opus5"],
          },
          {
            id: "fable5-ani",
            title: "Introducing Fable 5",
            src: "public/videos/main/ai/fable5-ani.mp4",
            orientation: "horizontal",
            poster: null,
            duration: "0:07",
            postedAt: "2026-06-16",
            stats: { views: 23000, likes: 1900 },
            tags: ["graphic", "fable5"],
          },
          {
            id: "opus5-leak",
            title: "Opus5 Coming Soon",
            src: "public/videos/main/ai/opus5-leak.MP4",
            orientation: "horizontal",
            poster: null,
            duration: "0:21",
            postedAt: "2026-07-22",
            stats: { views: 47000, likes: 3300 },
            tags: ["graphic", "opus5"],
          },
        ],
      },
    ],
  },

  {
    id: "alt",
    handle: "@vin", // TODO: replace with your real handle
    name: "Quiet Living Account",
    avatar: null, // e.g. "images/vin-avatar.png"
    hidden: true,
    bio: "the lab. weirder ideas, rougher edits, faster feedback loops.",
    stats: {
      followers: 1100,
      likes: 40000,
      views: 350000,
    },
    highlights: ["3 formats prototyped", "48h idea-to-post loop"],
    videos: [
      {
        id: "alt-01",
        title: "one-take rule",
        src: null,
        orientation: "horizontal",
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
        orientation: "horizontal",
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
        orientation: "horizontal",
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
    avatar: null,
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
export const getCollection = (accountId, collectionId) =>
  getAccount(accountId)?.collections?.find((c) => c.id === collectionId) || null;
