/**
 * Built-in default copy for the Buy and Sell pages.
 * Rendered when the matching Sanity field is empty, and fully overridable
 * from the Studio (Buy Page / Sell Page). Kept evergreen and accurate —
 * no fabricated stats, tax figures, or testimonials.
 */

export type Faq = { question: string; answer: string };
export type ProcessStep = { title: string; description: string };
export type ProcessDefault = { title: string; intro: string; steps: ProcessStep[] };
export type Stat = { value: string; label: string };
export type Testimonial = { quote: string; author: string; location?: string };

// PLACEHOLDER stats — replace with real figures in the Studio before relying on them.
export const DEFAULT_BUY_STATS: Stat[] = [
  { value: "00+", label: "Years of Experience" },
  { value: "$000M+", label: "In Sales Volume" },
  { value: "000+", label: "Homes Closed" },
  { value: "5.0", label: "Client Rating" },
];

export const DEFAULT_SELL_STATS: Stat[] = [
  { value: "00+", label: "Years of Experience" },
  { value: "$000M+", label: "In Sales Volume" },
  { value: "00%", label: "List-to-Sale Price" },
  { value: "5.0", label: "Client Rating" },
];

// PLACEHOLDER testimonials (lorem ipsum) — replace with real, attributed client quotes.
export const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.",
    author: "Client Name",
    location: "Aspen, CO",
  },
  {
    quote:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident sunt in culpa.",
    author: "Client Name",
    location: "Snowmass Village, CO",
  },
  {
    quote:
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa quae ab illo inventore veritatis.",
    author: "Client Name",
    location: "Roaring Fork Valley, CO",
  },
];

export const DEFAULT_BUY_PROCESS: ProcessDefault = {
  title: "How Buying a Home in Aspen Works",
  intro: "A clear, proven path from first conversation to the keys in your hand.",
  steps: [
    {
      title: "Connect & define your goals",
      description:
        "We start by understanding your lifestyle, must-haves, budget, and timeline so every property we show you is worth your time.",
    },
    {
      title: "Get financially prepared",
      description:
        "Whether you're paying cash or financing, we help you line up proof of funds or pre-approval so you can move quickly and negotiate from strength.",
    },
    {
      title: "Search — including off-market",
      description:
        "We curate on-market and private, pre-market listings that fit your criteria and arrange private showings and video tours.",
    },
    {
      title: "Tour & evaluate",
      description:
        "We tour properties together, in person or remotely, and give you honest, data-backed guidance on value, condition, and fit.",
    },
    {
      title: "Offer & negotiate",
      description:
        "We craft a competitive offer and negotiate price, terms, and contingencies to protect your interests.",
    },
    {
      title: "Due diligence & inspections",
      description:
        "We coordinate inspections, title review, HOA and short-term-rental research, and appraisal so there are no surprises.",
    },
    {
      title: "Closing & beyond",
      description:
        "We manage the details through a smooth closing and remain a resource afterward for property management, rentals, and future needs.",
    },
  ],
};

export const DEFAULT_BUY_FAQS: Faq[] = [
  {
    question: "How does buying a home in Aspen or Snowmass work if I live out of state or abroad?",
    answer:
      "Many Aspen and Snowmass buyers purchase from out of state or internationally, and the process is built to work remotely. We handle private showings, video tours, and digital document signing, and coordinate local inspectors, lenders, title, and closing on your behalf so you can buy with confidence from anywhere.",
  },
  {
    question: "Do I pay my buyer's agent to represent me?",
    answer:
      "In most Aspen-area transactions, buyer representation is arranged so that working with a dedicated buyer's agent costs you nothing out of pocket, while giving you an advocate who negotiates on your behalf. We'll review exactly how representation and compensation work for your specific purchase before you commit to anything.",
  },
  {
    question: "Can I see off-market or pocket listings in Aspen and Snowmass?",
    answer:
      "Yes. A meaningful share of high-end Aspen and Snowmass sales happen quietly, before or without ever reaching the MLS. Through our local relationships we can surface off-market and pre-market opportunities that match your criteria and aren't visible on public search sites.",
  },
  {
    question: "What closing costs and transfer taxes should I expect in the Aspen area?",
    answer:
      "Buyer costs typically include title insurance, lender fees (if financing), recording fees, and prorated property taxes, and certain areas around Aspen carry a real estate transfer assessment. Because these vary by property and location, we provide a clear, itemized estimate for any home you're seriously considering.",
  },
  {
    question: "What should I know about short-term rentals and HOAs before buying?",
    answer:
      "Short-term-rental rules vary significantly across Aspen, Snowmass Village, and Pitkin County, and many condominiums and communities have their own HOA rules, fees, and rental restrictions. If rental income or flexibility matters to you, we'll confirm the current regulations and HOA terms for each property before you make an offer.",
  },
  {
    question: "Should I pay cash or finance a luxury or second home here?",
    answer:
      "Both are common in the Aspen market. Cash can strengthen your offer and speed up closing, while financing can preserve liquidity for the right buyer. We can introduce you to lenders experienced with luxury and second-home loans so you can compare and decide what fits your goals.",
  },
  {
    question: "How long does a typical Aspen luxury transaction take from offer to closing?",
    answer:
      "Many Aspen and Snowmass closings happen within roughly 30 to 45 days once you're under contract, though timing depends on financing, inspections, and the terms you negotiate. Cash purchases can close faster. We'll set a realistic timeline for your specific transaction.",
  },
  {
    question: "What's the difference between Aspen, Snowmass Village, Woody Creek, and the down-valley communities?",
    answer:
      "Each area offers a distinct lifestyle and price point — from Aspen's walkable core and West End, to Snowmass Village's ski-in/ski-out convenience, to the privacy of Woody Creek and Old Snowmass, to the value and space of down-valley towns like Basalt and Carbondale. We'll help you weigh location, lifestyle, and long-term value to find the right fit.",
  },
];

export const DEFAULT_SELL_PROCESS: ProcessDefault = {
  title: "How Selling Your Aspen Home Works",
  intro: "A proven, full-service process designed to sell for the best price with the least stress.",
  steps: [
    {
      title: "Consultation & pricing strategy",
      description:
        "We meet to understand your goals and prepare a data-driven pricing strategy using live Aspen and Snowmass comparable sales.",
    },
    {
      title: "Prepare & stage",
      description:
        "We recommend the high-return prep and staging that help your home show at its very best.",
    },
    {
      title: "Professional photography, video & content",
      description:
        "Magazine-quality photography, aerial and drone imagery, and video capture your home's story for a global audience.",
    },
    {
      title: "Launch & global marketing",
      description:
        "We launch across the MLS, leading luxury portals, and targeted digital, social, and print channels — plus our private buyer network.",
    },
    {
      title: "Showings & qualified buyers",
      description:
        "We manage private showings, vet buyers, and keep you informed with honest, timely feedback.",
    },
    {
      title: "Offers & negotiation",
      description:
        "We evaluate every offer and negotiate the best possible price and terms on your behalf.",
    },
    {
      title: "Under contract to closing",
      description:
        "We coordinate inspections, appraisal, and escrow to deliver a smooth, on-time close.",
    },
  ],
};

export const DEFAULT_SELL_FAQS: Faq[] = [
  {
    question: "How much is my Aspen or Snowmass home worth?",
    answer:
      "Your home's value depends on location, condition, views, and current market activity. We prepare a detailed comparative market analysis using live Aspen and Snowmass sales data and give you an honest, defensible price range — request a complimentary valuation to get started.",
  },
  {
    question: "How long does it take to sell a luxury home in the Aspen market?",
    answer:
      "Timelines vary with price point, season, and pricing strategy — some homes sell in weeks, others take several months. Pricing correctly from day one and marketing to the right buyers is the single biggest factor in selling faster and for more, and we'll set realistic expectations for your property.",
  },
  {
    question: "How do you price a luxury property correctly?",
    answer:
      "We combine live comparable sales, current inventory, days-on-market trends, and the unique features of your home to position it competitively. Overpricing is the most common reason luxury listings stall; a data-driven price attracts stronger offers early, when buyer interest is highest.",
  },
  {
    question: "How do you market my home to out-of-state and international buyers?",
    answer:
      "Most Aspen buyers come from outside the valley, so exposure is everything. We invest in professional photography and video, syndicate your listing to leading national and global luxury portals, and run targeted digital, social, and print marketing to reach qualified buyers wherever they are.",
  },
  {
    question: "Can I sell privately or off-market for discretion?",
    answer:
      "Yes. For sellers who value privacy, we can market your home discreetly through our private network of agents and qualified buyers before or instead of a public listing. We'll walk through the trade-offs so you can choose the approach that best fits your goals.",
  },
  {
    question: "Should I stage or make improvements before listing, and what's the ROI?",
    answer:
      "Presentation has a real impact on price in the luxury market. We'll walk your home and recommend only the improvements and staging likely to return more than they cost — sometimes that's simply decluttering and professional styling, sometimes targeted updates.",
  },
  {
    question: "What are the costs and commission involved in selling?",
    answer:
      "Typical seller costs include the agreed brokerage commission, closing and title costs, and any negotiated concessions. We're transparent about all of it up front and provide a clear net-proceeds estimate so you know exactly what to expect at closing.",
  },
  {
    question: "What is the current Aspen and Snowmass market like for sellers?",
    answer:
      "The Aspen and Snowmass market moves differently than most — limited inventory and strong demand for prime properties, with conditions that shift by neighborhood and price band. We'll give you a current read on your specific segment so you can time and price your sale wisely.",
  },
];
