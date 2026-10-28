/**
 * Default text for every editable part of the site. The admin panel saves
 * changes on top of these (site_content table); anything never edited keeps
 * the value below. Placeholders such as {{phone}} or {title} are filled in when
 * the page is shown (see fill() in ./render).
 */

export const DEFAULTS = {
  settings: {
    brand: "Bracelet By Ammit",
    legalName: "Bracelet By Ammit",
    founder: "Ammit Kukreja, Numerologist",
    address: "GuruAtman, Gauripada, Kalyan West, Thane, Maharashtra 421301",
    email: "",
    phone: "+91 78888 35454",
    gstin: "",
    grievanceName: "Ammit Kukreja",
    grievanceDesignation: "Founder",
    defaultPrice: 1200,
    price2: 1900,
    price3: 3000,
    shippingMinDays: 8,
    shippingMaxDays: 9,
    whatsapp: "https://wa.me/message/ENJCQVDZ2QU4L1",
    instagram: "https://www.instagram.com/braceletbyammit/",
    youtube: "https://www.youtube.com/@braceletbyammit",
    youtubeShorts: "https://www.youtube.com/@braceletbyammit/shorts",
    reelUrl: "https://www.instagram.com/reel/DG7Kf4kCVvW/",
    instagramReviews: "https://www.instagram.com/stories/highlights/18046452023799577/",
    announcement: "Every bracelet is newly designed for your birth chart · Free shipping",
    announcementLink: "Ask Ammit",
    disclaimer:
      "Crystal and numerology guidance reflects traditional belief and personal experience. It is not a substitute for medical, psychological, legal or financial advice. Results vary from person to person.",
    refNote: "This is a reference image, your bracelet will be customized according to you.",
    showLoader: true,
    staffEmails: "",
    ammitName: "Ammit Kukreja",
    ammitRole: "Numerologist, Bracelet By Ammit",
    ammitPhoto: "/ammit/ammit-kukreja.jpg",
    ammitPhotoAlt: "Ammit Kukreja, numerologist and founder of Bracelet By Ammit",
    seoTitle: "Bracelet By Ammit — Crystal bracelets chosen for your birth date",
    seoDescription:
      "Charged and analysed crystal bracelets, newly designed for your name, date of birth and purpose by numerologist Ammit Kukreja. Cleansed, energised and shipped free.",
  },

  home: {
    heroTitle: "A bracelet for what you're asking of life.",
    heroLede:
      "Choose your purpose. Numerologist Ammit Kukreja studies your name, date of birth and planets, designs a bracelet only for you, then cleanses and energises it before it's sent.",
    heroPrimary: "Shop by purpose",
    heroSecondary: "Find my bracelet",
    editTitle: "Choose your purpose",
    editLede: "Ten purposes. Every bracelet newly designed for you, {{price}} with free shipping.",
    editHintHover: "Hover to see each one, then choose.",
    editHintTouch: "Tap one to choose.",
    madeTitle: "Newly designed for you. Never a copy.",
    madeText:
      "Every bracelet is newly designed keeping your birth chart and purpose in mind. Ammit studies your name, date of birth and the dasha of your planets before choosing a single crystal. Your bracelet is cleansed and energised before it reaches you, and shipping is free.",
    madePoints: [
      "100% natural and authentic crystals",
      "Made only for you: no copies, never the same bracelet twice",
      "Your birth details and your purpose both studied first",
      "A photo and full details of your bracelet on WhatsApp before it's couriered",
      "Cleansed and energised for 1 to 2 days before dispatch",
    ],
    madeNote: "We don't do any kind of jadu-tona or vashikaran. Only the natural power of crystals and your planets, to bring positivity into your life.",
    madeButton: "Find my bracelet",
    madeReelTitle: "How Ammit designs your bracelet",
    madeReelNote: "Plays from Instagram",
    madeReelCover: "/reel/cover.jpg",
    numberTitle: "Or start with your number",
    numberText:
      "Add the digits of the day you were born until one is left. Born on the 25th? 2 + 5 makes you a 7. Tap your number to see what it means.",
    noteTitle: "A note from Ammit",
    noteBody1:
      "Namaste. A crystal bracelet is often chosen for its colour, or because a friend wears one. But a stone that helps one person can do nothing for another, because your numbers are not theirs. That is why I started Bracelet By Ammit.",
    noteBody2:
      "Before I choose a single crystal, I read your date of birth myself: your mulank, your bhagyank and how your numbers sit together. Only then do I pick the stones for what you are asking of life, and string them by hand.",
    noteQuote: "Har bracelet style ke liye nahi hota. Right crystal, right direction.",
    noteButton: "Watch Ammit on YouTube",
    noteReadMore: "Read Ammit's story →",
    giftsTitle: "Gifts that mean something",
    giftsLede: "Send their birth date and we'll make it for them, not just for the occasion.",
    reviewsTitle: "In their own words",
    reviewsLede: "From people wearing a bracelet Ammit chose for them.",
    reviewsMore: "Read more reviews on Instagram",
    careTitle: "What if my bracelet breaks?",
    careText: "It's the question people ask us most. Ammit's answer on YouTube has been watched more than 14,000 times.",
    careWatch: "Watch Ammit's answer",
    careGuide: "Full care guide",
    seoTitle: "",
    seoDescription: "",
  },

  shared: {
    footerKicker: "Read for your date of birth",
    footerTitle: "Ask Ammit which crystal is yours",
    footerText: "A 60-second reading works out your numbers and the bracelet that suits them.",
    footerOrder: "Order my bracelet",
    footerWhatsapp: "Ask on WhatsApp",
    footerTagline: "Wear the right crystals, not just any.",
    ctaTitle: "Ready when you are",
    ctaText: "Answer 7 quick questions, see your numbers and the bracelet that suits them, then place your order.",
    ctaButton: "Order my bracelet",
    howTitle: "How your bracelet is made",
    howSteps: [
      { title: "Choose your purpose", text: "Pick what you'd like your bracelet to support." },
      { title: "Share your birth details", text: "Name and full date of birth (the wearer's, if it's a gift) when you order." },
      { title: "Ammit designs it for you", text: "He studies your birth details, planets and purpose, then chooses every crystal. You get a photo and full details on WhatsApp." },
      { title: "Cleansed, energised, delivered", text: "It's cleansed and energised for 1 to 2 days, then couriered free. About {{minDays}}–{{maxDays}} days in all." },
    ],
    trustShipping: "Free shipping across India",
    trustPayment: "Secure prepaid: UPI, cards, net banking",
    notFoundTitle: "This page has slipped off the strand",
    notFoundText: "The link may be old, or the page may have moved. Start again from the homepage.",
  },


  product: {
    eyebrow: "Purpose bracelet",
    priceNote: "newly designed for you · free shipping",
    orderButton: "Order this bracelet",
    askButton: "Ask Ammit first",
    hint: "A 60-second reading works out your numbers, then takes you to secure checkout.",
    aboutTitle: "About this bracelet",
    videoTitle: "Ammit explains this bracelet",
    forWhomTitle: "This bracelet is for you if…",
    crystalsTitle: "Crystals often used",
    crystalsNote:
      "These stones are traditionally linked with this purpose. Ammit chooses your final stones after studying your birth details, so yours may differ.",
    faqTitle: "Questions",
    faqs: [
      {
        q: "How is the {title} bracelet made for me?",
        a: "Ammit studies the wearer's name, date of birth and planets together with this purpose, chooses every crystal, and designs a new bracelet. You get a photo and full details on WhatsApp, then it's cleansed, energised and couriered free.",
      },
      {
        q: "Which size should I choose?",
        a: "Measure around the wrist bone with a thread and a ruler. Women's sizes are 14, 15 and 16 cm; men's are 16, 17 and 18 cm. If you're between sizes, choose the larger one. The size guide shows how to measure.",
      },
      {
        q: "What if my bracelet breaks?",
        a: "Collect every bead and message us on WhatsApp with a photo. We'll tell you how to send them back so Ammit can restring the same crystals.",
      },
      {
        q: "How do I look after it?",
        a: "Cleanse it once a week with dry rock salt or incense smoke, recharge it under the full moon, and keep it away from water, perfume and soap.",
      },
      {
        q: "Can a crystal bracelet replace medical or professional advice?",
        a: "No. Crystal and numerology guidance is traditional belief. Please keep following your doctor's or adviser's guidance.",
      },
    ],
    othersTitle: "Other purposes",
  },

  gifts: {
    eyebrow: "Gifting",
    title: "Gifts that mean something",
    lede: "Send their birth date and we'll make it for them, not just for the occasion. {{price}} per bracelet.",
    howTitle: "How a gift is made",
    ctaTitle: "Have their date of birth ready?",
    ctaText: "Answer a few questions about the wearer and we'll suggest the bracelet that suits their numbers.",
    ctaButton: "Order a gift",
    detailEyebrow: "Gift",
    priceNote: "per bracelet · read for the wearer",
    orderButton: "Order this gift",
    sendTitle: "What to send us",
    ideasTitle: "Gift ideas",
    othersLabel: "Other gifts",
    seoTitle: "Gifts that mean something",
    seoDescription: "Crystal bracelet gifts for Rakhi, your mother or an anniversary, each read for the wearer's date of birth. {{price}} per bracelet.",
  },

  mulank: {
    eyebrow: "By number",
    title: "Start with your number",
    lede: "Your mulank is your birth number. Add the digits of the day you were born until one is left. Born on the 25th? 2 + 5 makes you a 7. Born on the 9th? You're a 9.",
    bornOn: "Born on",
    startTitle: "Your mulank is only the start",
    startText:
      "Your bhagyank, the sum of your full date of birth, matters just as much, and so does how your numbers sit together. That's why Ammit reads your whole date of birth before choosing a single crystal.",
    ctaTitle: "Know your number?",
    ctaText: "Take the 60-second reading to see your mulank, your bhagyank and the bracelet that suits them.",
    detailEyebrow: "Ruled by {planet} ({planetHindi})",
    detailAsk: "Ask Ammit about my crystals",
    detailFind: "Find my bracelet",
    daysTitle: "You're a {n} if you were born on",
    daysNote: "of any month.",
    traitsTitle: "Qualities traditionally linked with {n}",
    crystalsTitle: "Which crystals suit a {n}?",
    crystalsText:
      "It depends on more than your mulank. Ammit also reads your bhagyank and how your numbers work together, so two people with mulank {n} can need different stones. Send him your full date of birth and he'll tell you which crystals suit you, and which to avoid.",
    videoTitle: "Ammit on mulank {n}",
    numbers: [
      { number: 1, planet: "Sun", planetHindi: "Surya", summary: "Mulank 1 is ruled by the Sun: the number of leaders and self-starters.", traits: ["Leadership and independence", "Confidence and ambition", "A strong sense of self-respect"], videoId: "5O7mGmDKn_M" },
      { number: 2, planet: "Moon", planetHindi: "Chandra", summary: "Mulank 2 is ruled by the Moon: the number of feeling, intuition and partnership.", traits: ["Sensitivity and intuition", "Creativity and imagination", "A gift for cooperation"], videoId: "P_sfaKT5jnc" },
      { number: 3, planet: "Jupiter", planetHindi: "Guru", summary: "Mulank 3 is ruled by Jupiter: the number of wisdom, teaching and growth.", traits: ["Wisdom and a love of learning", "Optimism and generosity", "A natural guide for others"], videoId: "cJ96nbbIVsQ" },
      { number: 4, planet: "Rahu", planetHindi: "Rahu", summary: "Mulank 4 is ruled by Rahu: the number of hard work, originality and sudden turns.", traits: ["Hard-working and practical", "Unconventional thinking", "Life brings sudden changes"], videoId: "Sk1JgTM4ajk" },
      { number: 5, planet: "Mercury", planetHindi: "Budh", summary: "Mulank 5 is ruled by Mercury: the number of communication, business and quick minds.", traits: ["Quick, adaptable mind", "Strong communication and business sense", "Loves travel and variety"], videoId: "ZLjITOqVlJg" },
      { number: 6, planet: "Venus", planetHindi: "Shukra", summary: "Mulank 6 is ruled by Venus: the number of love, beauty and family.", traits: ["Warmth and devotion to family", "An eye for beauty and comfort", "Charm and creativity"], videoId: "qwXP-_LB31w" },
      { number: 7, planet: "Ketu", planetHindi: "Ketu", summary: "Mulank 7 is ruled by Ketu: the number of reflection, research and the spiritual path.", traits: ["Deep thinking and research", "Spiritual and introspective", "Strong intuition"], videoId: "usQRUS5Y6Co" },
      { number: 8, planet: "Saturn", planetHindi: "Shani", summary: "Mulank 8 is ruled by Saturn: the number of discipline, patience and lasting results.", traits: ["Discipline and patience", "Results that come late but last", "A strong sense of justice"], videoId: "hFCGygBRXY4" },
      { number: 9, planet: "Mars", planetHindi: "Mangal", summary: "Mulank 9 is ruled by Mars: the number of courage, energy and protection.", traits: ["Courage and energy", "Protective of the people they love", "Direct and determined"], videoId: "HMtP14b0_6M" },
    ],
    seoTitle: "Mulank 1 to 9: find your number",
    seoDescription: "What your mulank (birth number) says, its ruling planet and traditional qualities. Find yours from the day you were born.",
  },

  about: {
    eyebrow: "The numerologist",
    title: "Meet Ammit Kukreja",
    lede: "Right crystal, right direction. Every bracelet starts with Ammit reading your date of birth himself.",
    videoTitle: "In Ammit's words",
    videoId: "CySF-l3yeBQ",
    workTitle: "What Ammit does",
    work: [
      { title: "Crystal bracelets", text: "Bracelets for ten purposes, each newly designed for your birth chart.", cta: "Shop by purpose", href: "/#edit" },
      { title: "Numerology consultations", text: "A one-to-one reading of your numbers, with advice on which crystals suit you.", cta: "About consultations", href: "/consultation" },
      { title: "Videos in Hinglish", text: "Short videos on mulank, number combinations and crystal care, on YouTube and Instagram.", cta: "Watch on YouTube", href: "https://www.youtube.com/@braceletbyammit" },
    ],
    ctaTitle: "Ask Ammit which crystal is yours",
    seoTitle: "About Ammit Kukreja, numerologist",
    seoDescription:
      "Ammit Kukreja is the numerologist behind Bracelet By Ammit. He reads every date of birth himself before choosing crystals, and strings each bracelet by hand.",
  },

  consultation: {
    eyebrow: "One to one",
    title: "A numerology consultation with Ammit",
    lede: "Not sure which bracelet, or have a bigger question? Ammit reads your full date of birth and talks you through what your numbers say.",
    button: "Book on WhatsApp",
    coversTitle: "What we cover",
    covers: [
      "Your mulank (birth number) and bhagyank (destiny number)",
      "How your numbers work together, and which ones are missing",
      "Which crystals suit you, and which to avoid",
      "Your questions on career, relationships, studies or health",
    ],
    stepsTitle: "How to book",
    steps: [
      "Message Ammit on WhatsApp and say you'd like a consultation",
      "Share your full date of birth and your main question",
      "Ammit confirms the time, format and fee with you",
    ],
    callout: "Numerology is guidance, not a guarantee. For medical, legal or financial decisions, please also speak to a qualified professional.",
    ctaTitle: "Have your date of birth ready",
    ctaText: "Message Ammit on WhatsApp to book a time.",
    seoTitle: "Numerology consultation with Ammit",
    seoDescription: "Book a one-to-one numerology consultation with Ammit Kukreja: your mulank, bhagyank and the crystals that suit you.",
  },

  care: {
    eyebrow: "Care guide",
    title: "Looking after your bracelet",
    lede: "A little care keeps your crystals clear and your bracelet strong. Here's how.",
    items: [
      {
        term: "Cleansing",
        detail:
          "Once a week, hold the bracelet in a bowl of dry rock salt or under a stream of smoke from a diya or incense for a few minutes. Avoid soaking it in water: some crystals fade or crack.",
      },
      {
        term: "Recharging",
        detail:
          "Leave it on a windowsill overnight under the full moon; this suits almost every crystal. Morning sunlight is fine for citrine, tiger eye and pyrite, but keep amethyst and rose quartz out of strong sun so their colour stays.",
      },
      {
        term: "Restringing",
        detail:
          "If the thread breaks, collect every bead and don't throw any away. Send us a photo on WhatsApp and we'll tell you how to send them back so Ammit can restring the same crystals for you.",
      },
    ],
    dosTitle: "Do",
    dos: [
      "Wear it daily so it stays with you",
      "Cleanse it once a week, more often if you've had a heavy week",
      "Recharge it under the full moon every month",
      "Keep it in a soft pouch when you're not wearing it",
    ],
    dontsTitle: "Don't",
    donts: [
      "Don't soak it in water or wear it while bathing or swimming",
      "Keep it away from perfume, soap and cleaning chemicals",
      "Avoid letting others wear your bracelet",
      "Don't throw away beads if it breaks; keep every one",
    ],
    breakTitle: "What if my bracelet breaks?",
    breakText:
      "It's the question people ask us most. Collect every bead, then [watch Ammit's answer on YouTube]({{youtubeShorts}}) and message us on WhatsApp so we can restring the same crystals for you.",
    videoId: "NLb5BcYFoMo",
    ctaTitle: "Need a restring?",
    ctaText: "Send us a photo of the beads (contact details are at the bottom of this page) and we'll tell you how to send them back.",
    seoTitle: "Crystal bracelet care",
    seoDescription: "How to cleanse, recharge and look after your crystal bracelet, and what to do if it breaks.",
  },

  reviews: {
    eyebrow: "Customer reviews",
    title: "What customers say",
    lede: "Screenshots of messages customers have sent Ammit about their bracelets, straight from our Instagram.",
    shotsTitle: "Straight from our Instagram",
    shots: [] as { image: string; text: string; name: string; link: string }[],
    items: [
      { quote: "I wore the bracelet in August 2025 and now I have finally received a job offer in a prestigious position in Germany. After wearing it I felt very positive and confident, and my job interviews were successful. I want to thank you from my heart.", name: "Sagnik", intention: "career-and-finance", sourceLabel: "Shared on Instagram", sourceUrl: "https://www.instagram.com/stories/highlights/18046452023799577/" },
      { quote: "I am wearing the spiritual bracelet you made for me as per the mentioned day and time, and I truly feel thankful for your work. I received great news today and I'm feeling very grateful. Your dedication and positive energy really reflect in your work.", name: "Vishakha", intention: "", sourceLabel: "Shared on Instagram", sourceUrl: "https://www.instagram.com/stories/highlights/18046452023799577/" },
      { quote: "This is my 2nd purchase. My first was the love bracelet. I can't even explain it, it was magic: when I started wearing it, everything changed in our relationship. Now this one is for my career. Loads of love, Ammit sir and team.", name: "Customer on WhatsApp", intention: "love-life", sourceLabel: "Shared on Instagram", sourceUrl: "https://www.instagram.com/stories/highlights/18046452023799577/" },
      { quote: "Maine aapse 3rd time bracelet purchase kiya hai. 2021 mein liya tha, phir 2023 mein, aur ab 2026 mein career aur financial ke liye. Aur sach mein yeh bahut achha kaam karta hai. Thank you so much, Ammit sir.", name: "Vijaya", intention: "career-and-finance", sourceLabel: "Shared on Instagram", sourceUrl: "https://www.instagram.com/stories/highlights/18046452023799577/" },
      { quote: "Thank you sir for the bracelet which you have made especially for me. It is making things easier for me. People and situations are changing for me, and I'm feeling more positive than ever. Thank you so much.", name: "Customer on WhatsApp", intention: "", sourceLabel: "Shared on Instagram", sourceUrl: "https://www.instagram.com/stories/highlights/17972703031853261/" },
      { quote: "The bracelet designed by Ammit ji is working for me. Wanted to thank you guys, and specifically Ammit ji.", name: "Alpana", intention: "", sourceLabel: "Shared on Instagram", sourceUrl: "https://www.instagram.com/stories/highlights/18046452023799577/" },
      { quote: "Thank you so much for the beautiful bracelet, just received. Bracelet ko open karte hi bahut positive vibes feel hui. Thank you so much.", name: "Deepika", intention: "", sourceLabel: "Shared on Instagram", sourceUrl: "https://www.instagram.com/stories/highlights/18046452023799577/" },
      { quote: "Aap jo bracelet banate ho, woh bahut achhe hain. Mujh par bracelet ka bahut hi achha asar ho raha hai. Main family ke liye aur bracelet lene wali hoon. Thank you so much.", name: "Kavita", intention: "", sourceLabel: "Shared on Instagram", sourceUrl: "https://www.instagram.com/stories/highlights/17972703031853261/" },
      { quote: "Aapse bracelet liya hai, 1 month hone ko aaya hai. Positive ho rahi hoon, thoughts ki clarity ho rahi hai, study mein mann lag raha hai. I'm so grateful.", name: "Customer on WhatsApp", intention: "", sourceLabel: "Shared on Instagram", sourceUrl: "https://www.instagram.com/stories/highlights/17972703031853261/" },
      { quote: "I received the bracelet today. It's very beautiful and gives positive vibes. Thank you sir.", name: "Ambika", intention: "", sourceLabel: "Shared on Instagram", sourceUrl: "https://www.instagram.com/stories/highlights/18046452023799577/" },
      { quote: "Sir, maine 2 baar bracelet banwaye hain aur mujhe isse bahut zyada achha effect mehsoos hua hai. It really works. Thank you so much.", name: "Customer on WhatsApp", intention: "", sourceLabel: "Shared on Instagram", sourceUrl: "https://www.instagram.com/stories/highlights/18046452023799577/" },
      { quote: "Aapka bracelet sahi mein bahut kaam karta hai. Thank you!", name: "Somya", intention: "", sourceLabel: "Shared on Instagram", sourceUrl: "https://www.instagram.com/stories/highlights/18046452023799577/" },
    ],
    ctaTitle: "Wearing one of our bracelets?",
    ctaText: "We'd love to hear how it's going. Contact details are at the bottom of this page.",
    seoTitle: "Customer reviews",
    seoDescription: "Real messages from customers wearing a Bracelet By Ammit crystal bracelet.",
  },

  sizeGuide: {
    eyebrow: "Fit",
    title: "Find your bracelet size",
    lede: "A crystal bracelet should sit comfortably on the wrist bone: snug enough not to slide over your hand, loose enough to turn.",
    measureTitle: "How to measure",
    measureSteps: [
      "Wrap a thread or a strip of paper around your wrist, just above the wrist bone.",
      "Mark where the end meets the thread. Don't pull it tight.",
      "Lay it flat on a ruler and read the length in centimetres.",
      "Pick the size closest to your measurement. If you're between two sizes, choose the larger one.",
    ],
    sizesTitle: "Our sizes",
    sizes: [
      { label: "Slim", women: "14 cm", men: "16 cm" },
      { label: "Medium", women: "15 cm", men: "17 cm" },
      { label: "Healthy", women: "16 cm", men: "18 cm" },
    ],
    note: "Not sure? Choose \"Not sure\" in the reading, or send us your measurement on WhatsApp (link in the footer) and we'll advise. If it doesn't fit, see our [returns policy](/returns).",
    ctaTitle: "Got your size?",
    seoTitle: "Bracelet size guide",
    seoDescription: "How to measure your wrist for a Bracelet By Ammit crystal bracelet, with the sizes we make for women and men.",
  },


  funnel: {
    introKicker: "60-second crystal reading",
    introTitle: "Find the bracelet that suits your numbers",
    introText:
      "Answer 7 quick questions. We'll work out your mulank and bhagyank and suggest the bracelet Ammit would start with for you.",
    introFine:
      "Your answers stay in this browser until you place an order. Crystal and numerology guidance is traditional belief, not medical, legal or financial advice.",
    genderTitle: "Who will wear it?",
    genderText: "This sets the wrist sizes we show later.",
    intentionTitle: "What would you like your bracelet to help with?",
    intentionTitleGift: "What would you like the bracelet to help them with?",
    proofTitle: "Every bracelet starts with a reading",
    proofText: "Ammit reads the wearer's name and date of birth before he chooses a single crystal. Here's what one customer wrote to him:",
    nameTitle: "What's your name?",
    nameTitleGift: "What's the wearer's name?",
    nameText: "In numerology your name carries a number too. Use the name you go by every day.",
    dobText: "Your mulank comes from the day; your bhagyank from the full date.",
    wristTitle: "What's your wrist size?",
    wristTitleGift: "What's their wrist size?",
    wristText: "Wrap a thread around the wrist bone and measure it in centimetres.",
    matchingTitle: "Matching crystals to your answers",
    nextSteps: [
      "Add a delivery address and pay securely: UPI, cards or net banking.",
      "Ammit studies your birth details and purpose, designs your bracelet and sends you a photo and full details on WhatsApp.",
      "It's cleansed and energised for 1 to 2 days, then delivered free. About {{minDays}}–{{maxDays}} days in all.",
    ],
    checkoutTitle: "Delivery and payment",
    confirmedText: "Your {title} bracelet is ordered and paid. Keep your order number {ref} handy.",
    seoTitle: "Find your bracelet: 60-second crystal reading",
    seoDescription:
      "Answer 7 quick questions to find your mulank, bhagyank and the crystal bracelet for your purpose. Newly designed, cleansed and energised.",
  },

  privacy: {
    title: "Privacy policy",
    lede: "We only ask for what we need to read your numbers, make your bracelet and deliver it. This page explains what that is and what we do with it.",
    updated: "22 October 2026",
    body: `## Who we are

This website is run by {{legalName}} ("we", "us"), founded by {{founder}}. For anything about your data, message us on WhatsApp (link in the footer).

## What we collect

### When you browse this website

The website itself does not ask you to log in and does not set advertising cookies. Our hosting provider (Vercel) keeps standard server logs, such as IP address, browser type and the pages requested, to keep the site secure and working. If we turn on analytics, it only runs after you click "Accept" on the cookie notice, and you can change your mind at any time from the footer.

If you arrive through a link shared by one of our partners (an address with /p/ or ?ref= in it), we store a small cookie for 30 days that says which partner sent you, and a random visitor number so a visit is counted only once a day. If you order in that time, the partner's code is saved with your order so we can pay them their commission. Partners don't see your name, contact details or birth details.

### When you take the 60-second reading

Your answers (including the wearer's name and date of birth) are processed inside your browser to work out the mulank and bhagyank. They are not sent to us or stored unless you continue to checkout and place an order.

### When you order

Orders are placed through our website checkout. We collect:

- name, mobile number and email address;
- date of birth and gender of the person who will wear the bracelet;
- wrist size and the purpose of the bracelet;
- delivery address;
- how you heard about us, and anything you tell us in messages.

## Why we use it

- to read the wearer's numbers and choose the crystals;
- to make, pack and deliver the bracelet and keep you updated;
- to help with care, restringing and any problem with your order;
- to keep the records the law requires (for example, tax records).

We do not sell your data. We only send you offers if you've agreed to receive them, and you can opt out any time.

## Who we share it with

- Razorpay, which processes payments. Your card, UPI and bank details go directly to Razorpay; we never see or store them;
- our order database provider, which stores order details securely for us;
- our email provider, which sends order details to our own team (never to anyone else);
- Meta (WhatsApp), if you message us or we message you about your order;
- courier partners, who need your name, phone number and address to deliver;
- Vercel, which hosts this website;
- authorities, only where the law requires it.

Some of these providers may process data outside India, under their own security and privacy terms.

## Videos on this site

Ammit's videos use YouTube's privacy-enhanced mode and only load when you press play. Once you do, YouTube's own privacy policy applies.

## Children

If the bracelet is for someone under 18, the order must be placed by their parent or guardian, who provides the child's details on their behalf.

## How long we keep it

We keep order details for as long as we need them to fulfil and support your order, and for as long as the law requires us to keep business records. After that we delete them.

## Your rights

Under India's Digital Personal Data Protection Act, 2023 you can ask us to show you the data we hold about you, correct it, delete it, or withdraw consent you've given. You can also nominate someone to act for you. Message us on WhatsApp (link in the footer) and we'll respond as quickly as we can.

## Grievance officer

{{grievance}}. Phone: {{phone}}. Address: {{address}}. You can also reach us on WhatsApp (link in the footer).

## Changes

If we change this policy we'll update the date at the top of this page. See also our [terms](/terms), [shipping](/shipping) and [returns](/returns) policies.`,
  },

  terms: {
    title: "Terms of use",
    lede: "By using this website or ordering a bracelet, you agree to these terms. They're written to be read, so please do.",
    updated: "22 October 2026",
    body: `## About these terms

These terms apply to the website and to orders placed with {{legalName}}. Our [privacy policy](/privacy), [shipping policy](/shipping) and [returns policy](/returns) form part of them.

## Guidance, not advice

{{disclaimer}}

Numerology readings, crystal suggestions and website content are offered as traditional guidance. Please don't stop or change any medical treatment, or make legal or financial decisions, based on them.

## Your bracelet

- Every bracelet is made after we read the wearer's name and date of birth, so details you give us must be accurate.
- Crystals are natural. Colour, pattern and size vary from stone to stone, and photos and illustrations are a guide only.
- The crystals named on product pages are those traditionally used for each purpose. Ammit chooses the final stones for each wearer, so yours may differ.

## Prices and payment

Prices are shown in Indian rupees and include free delivery within India. Orders are prepaid online through Razorpay (UPI, cards, net banking); we don't offer cash on delivery. Your order is accepted once your payment is confirmed, and we'll send updates on WhatsApp. If we can't fulfil an order, we'll refund it in full.

## Delivery, returns and restringing

See our [shipping policy](/shipping) and [returns policy](/returns).

## Website content

The Bracelet By Ammit name, logo, text, videos and designs belong to us or are used with permission. Please don't copy them for commercial use without asking.

## Liability

We take care to make every bracelet well. To the extent the law allows, our liability for any order is limited to the amount you paid for it. Nothing in these terms affects your rights under the Consumer Protection Act, 2019.

## Questions and complaints

Message us on WhatsApp (link in the footer) or call {{phone}}. Our grievance officer is {{grievance}}, {{address}}. These terms are governed by the laws of India.`,
  },

  shipping: {
    title: "Shipping and delivery",
    lede: "Free delivery across India, usually within {{minDays}}–{{maxDays}} days of your order. Every bracelet is newly designed, cleansed and energised first.",
    updated: "22 October 2026",
    body: `## Making your bracelet

After your order is confirmed, Ammit studies the wearer's birth details and purpose, chooses the crystals and designs the bracelet. We send you a photo and full details on WhatsApp, then the bracelet is cleansed and energised for 1 to 2 days and couriered (usually 4 to 5 days). We'll tell you on WhatsApp when it's on its way.

## Where we deliver

We deliver across India. For delivery outside India, message us on WhatsApp (link in the footer) before ordering.

## Delivery charges

Shipping is free on every order within India. The price you see is the price you pay.

## Delivery time

Most orders arrive within {{minDays}}–{{maxDays}} days of payment, including the time Ammit takes to read your numbers and string the bracelet. We show an estimated delivery date before you pay. Remote PIN codes and festival periods can take a little longer; we'll tell you on WhatsApp if that happens.

## Payment

All orders are prepaid online through Razorpay: UPI, debit and credit cards, and net banking. We don't offer cash on delivery.

## Your address

Please give your full address, including flat or house number, society, street, landmark and PIN code. Couriers don't always call before delivering, so an incomplete address can mean the parcel is returned or delayed.

## Tracking

We'll share tracking details on WhatsApp once your bracelet has been sent.

## If something goes wrong

If your parcel is late, damaged or missing, message us on WhatsApp with your name and order details and we'll sort it out with the courier. See also our [returns policy](/returns).`,
  },

  returns: {
    title: "Returns, exchanges and restringing",
    lede: "Each bracelet is made for one person's numbers, so we can't resell it. But if something isn't right, we'll help.",
    updated: "22 October 2026",
    body: `## If it arrives damaged or incorrect

Message us on WhatsApp (link in the footer) as soon as you open the parcel, with a photo of the bracelet and the packaging. We'll arrange a repair or replacement.

## If it doesn't fit

Check the [size guide](/size-guide) before ordering. If the bracelet still doesn't fit, message us on WhatsApp and we'll tell you how to send it back for resizing.

## If it breaks

Collect every bead and don't throw any away. Message us on WhatsApp with a photo, and we'll tell you how to send them back so Ammit can restring the same crystals for you. The [care guide](/bracelet-care) explains how to make your bracelet last.

## Change of mind

Because every bracelet is read and strung for one wearer's numbers, we can't accept returns for a change of mind once it has been made. Your rights under the Consumer Protection Act, 2019 are not affected.

## Refunds

Where a refund is due, we'll confirm it with you on WhatsApp and start it within 7 working days, back to the method you paid with. Your bank or UPI app may take a further 5–7 working days to show it.`,
  },
};

export type Defaults = typeof DEFAULTS;
export type PageId = keyof Defaults;
export type Content<K extends PageId> = Defaults[K];
