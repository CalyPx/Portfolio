// Everything the work section, case studies and per-project pages print.
// Only facts from Rohit's CV, repositories, live sites and his own LinkedIn posts. A field left out is
// simply not shown.
//   slug      the case study's address: /work/<slug>/
//   origin    where the project was made (a hackathon, a course); shown as a tag
//   result    the outcome in a few words, for the work strip; `outcome` is the full sentence
//   status    shown in the work strip when there is no outcome to report
//   flow      the steps the system runs through; either one list, or named groups drawn as rows
//   limits    what it is not, in Rohit's own framing
// Personal roles are deliberately left off the site.
// Order: most verifiable first (code or a live site, measured results, awards).
export const PROJECTS = [
  {
    id: 'quake', slug: 'quakesafe', name: 'QuakeSafe Nepal', short: 'QuakeSafe',
    tag: 'Earthquake damage, predicted',
    kind: 'Machine learning', access: 'Code on GitHub', origin: 'AI/ML Microdegree capstone, 2026',
    problem: 'The 2015 Gorkha earthquake damaged more than 600,000 buildings. Inspecting every building in the country by hand before the next one is not possible.',
    approach: [
      'An XGBoost model trained on 260,601 buildings surveyed after the earthquake, predicting one of three damage grades from 38 structural and geographic attributes.',
      'Five features were engineered by hand: volume (area × height), the log of building age, floor area per storey, the number of wall materials used, and the number of secondary uses. Volume ranked fourth in feature importance.',
      'Damage classes were balanced with SMOTE, and the model was compared against a decision tree, k-nearest neighbours and a random forest before being served over FastAPI.',
      'A damage grade alone means little to a homeowner, so each prediction also shows the factors behind it, such as wall type, roof and construction style, with basic retrofit suggestions.',
    ],
    flow: { Train: ['260,601 surveyed buildings', 'Five engineered features', 'SMOTE balancing', 'XGBoost'], Serve: ['Building details', 'FastAPI', 'Damage grade 1–3', 'Reasons and retrofit tips'] },
    outcome: '74.45% accuracy and a macro F1 of 0.70, the best of the four models tried.',
    result: '74.45% accuracy, macro F1 0.70',
    limits: 'A decision-support prototype trained on historical survey data, not a replacement for a structural engineer’s assessment.',
    stack: ['Python', 'XGBoost', 'SMOTE', 'scikit-learn', 'FastAPI'],
    links: [['Code on GitHub', 'https://github.com/CalyPx/earthquake-damage-prediction']],
  },
  {
    id: 'sunuwa', slug: 'sunuwa', name: 'Sunuwa', ne: 'सुनुवाइ', means: 'a hearing',
    tag: 'Civic complaints, routed',
    kind: 'Civic tech', access: 'Code on GitHub', origin: 'CivicCode hackathon, June 2026',
    problem: 'A citizen with a broken streetlight or an unfair fee posts about it or visits the ward office again and again. The complaint is never captured, routed or tracked.',
    approach: [
      'One place to report a problem, in Nepali or English, in under a minute. A Nepali-language LLM and embedding pipeline classifies each report, clusters the duplicates and routes it to the right municipal office.',
      'If nobody answers, the complaint escalates up the chain instead of disappearing.',
    ],
    flow: ['Citizen report', 'Classify', 'Cluster duplicates', 'Route to office', 'Escalate if ignored'],
    outcome: 'Second place at CivicCode 2026, a 12-hour civic tech hackathon run by Think Big.',
    result: 'Second place, CivicCode 2026',
    stack: ['Next.js', 'FastAPI', 'Supabase', 'Llama 3.3 on Groq', 'Sentence Transformers'],
    links: [['Code on GitHub', 'https://github.com/CalyPx/Sunuwa']],
  },
  {
    id: 'prep', slug: 'nepalprep', name: 'NepalPrep',
    tag: 'Entrance-exam practice, free',
    kind: 'Education', access: 'Live',
    problem: 'Students preparing for Nepal’s national entrance exams need structured notes and a lot of practice questions in one place.',
    approach: [
      'Structured notes, topic-wise MCQ practice and worked examples in one place, built with React and TypeScript.',
    ],
    outcome: 'Live and free, with more than 1,000 practice questions.',
    result: 'Live and free, 1,000+ questions',
    stack: ['React', 'TypeScript'],
    links: [['Open the site', 'https://nepalprep.vercel.app'], ['Code on GitHub', 'https://github.com/CalyPx/NepalPrep']],
    shot: ['/img/nepalprep.webp', 'NepalPrep home page: the words Crack the CEE over a heartbeat line'],
  },
  {
    id: 'mul', slug: 'mul', name: 'Mul', ne: 'मूल', means: 'the Nepali word for a spring, the source',
    tag: 'Agents that watch drying springs',
    kind: 'Autonomous AI agents', access: 'Not public yet', origin: 'TSN Agentic AI Hackathon, September 2026',
    problem: 'Springs that rural municipalities depend on are drying up, and nobody is watching them closely enough to act in time.',
    approach: [
      'Plain-code anomaly sweeps flag a spring first. Only then does an LLM investigation start, pulling in Open-Meteo rainfall, AWS SRTM terrain elevation and Copernicus Sentinel-2 imagery inside a bounded, multi-model agent loop.',
      'A person approves every finding before anything is sent. Approved alerts go out as SMS written in Nepali.',
    ],
    flow: ['Anomaly sweep', 'LLM investigation', 'Human approval', 'SMS in Nepali'],
    outcome: 'One of the top three teams at the TSN Agentic AI Hackathon, and selected to pitch at the Startup Summit in December 2026.',
    result: 'Top three, TSN Agentic AI Hackathon',
    safeguard: 'Every alert passes a human approval gate before it is sent.',
    limits: 'The prototype runs on sample data. How a spring recharges also depends on geology, such as rock layers and fractures, which it does not model yet.',
    stack: ['Python', 'LLM agents', 'Open-Meteo', 'AWS SRTM', 'Sentinel-2', 'SMS'],
    links: [],
  },
  {
    id: 'crash', slug: 'crash-capsule', name: 'Crash Capsule',
    tag: 'Crash evidence, sealed on impact',
    kind: 'Mobile, road safety', access: 'Not public yet', origin: 'MBMC IdeaX hackathon, October 2026',
    problem: 'After a crash, what happened often comes down to one person’s word against another’s, and the evidence can be edited, lost or disputed.',
    approach: [
      'When a phone detects an impact, it seals the video (without audio), the GPS track and the motion data from around that moment and signs them digitally, so the record cannot be quietly edited later.',
      'Nearby phones pick up a Bluetooth Low Energy alert and seal their own view of the moment, even with no internet, so there is more than one witness. Evidence uploads when a connection returns, and a dashboard verifies its integrity.',
      'It did not stop at a slide deck: the team took it onto the road and filmed a field demo in real conditions.',
    ],
    flow: ['Impact detected', 'Video, GPS and motion sealed and signed', 'Nearby phones seal their view over BLE', 'Upload when online', 'Integrity checked on a dashboard'],
    outcome: 'Won the Smart Urban Transportation and Road Safety track at MBMC IdeaX 2026, a national hackathon that opened with 116 teams.',
    result: 'Track winner, MBMC IdeaX 2026',
    limits: 'Still a prototype. It is built to make the evidence trustworthy, not to decide who was at fault.',
    stack: ['Mobile sensors', 'Digital signatures', 'Bluetooth LE', 'GPS', 'Verification dashboard'],
    links: [],
  },
  {
    id: 'sajha', slug: 'sajhadoctor', name: 'SajhaDoctor', ne: 'साझा डाक्टर', means: 'साझा means shared, held in common',
    tag: 'Telehealth in two languages',
    kind: 'Telehealth', access: 'Code on GitHub', origin: 'Web design competition',
    problem: 'People in rural areas need structured medical guidance, in Nepali as well as English, and a way to find the nearest care.',
    approach: [
      'A telehealth platform in Nepali and English that gives structured medical guidance and shows where the nearest care is on a map.',
    ],
    status: 'Code on GitHub',
    stack: ['Next.js', 'React', 'Leaflet.js'],
    links: [['Code on GitHub', 'https://github.com/CalyPx/SajhaDoctor']],
  },
  {
    id: 'learn', slug: 'learnscape', name: 'LearnScape',
    tag: 'Physics, in your own room',
    kind: 'Augmented reality', access: 'Not public yet', origin: 'Hackathon',
    problem: 'Physics is taught as formulas on a page, which makes it hard to see what the formula is describing.',
    approach: [
      'A game-like AR platform that places physics concepts in the room around you, so a formula turns into something you can walk around.',
    ],
    status: 'Not public yet',
    stack: ['AR'],
    links: [],
  },
]
