import { getSubjectsForGrade, type CbcSubject } from "./domain";

type SeedQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
};

type SubjectKey = `${number}:${CbcSubject}`;

function mk(
  question: string,
  options: string[],
  answer: string,
  explanation: string,
  difficulty: SeedQuestion["difficulty"] = "medium",
): SeedQuestion {
  return { question, options, answer, explanation, difficulty };
}

const KISWAHILI_SEED_QUESTIONS: SeedQuestion[] = [
  mk(
    "Katika methali 'Haraka haraka haina baraka', ujumbe mkuu ni upi?",
    [
      "Kufanya mambo kwa pupa huleta makosa.",
      "Kila kazi inapaswa kufanywa usiku.",
      "Haraka ndiyo njia bora ya kufaulu.",
      "Mtu anatakiwa kuacha kazi mapema.",
    ],
    "Kufanya mambo kwa pupa huleta makosa.",
    "Methali hii inasisitiza umuhimu wa utulivu na umakini katika kazi.",
  ),
  mk(
    "Nahau 'kupiga mbizi' hutumiwa kueleza nini katika mazungumzo ya kawaida?",
    [
      "Kutoroka haraka au kujificha.",
      "Kucheza mchezo wa maji tu.",
      "Kula chakula kingi.",
      "Kupanda mlima mrefu.",
    ],
    "Kutoroka haraka au kujificha.",
    "Katika muktadha wa nahau, 'kupiga mbizi' mara nyingi humaanisha kutoweka ghafla.",
  ),
  mk(
    "Ni ipi sentensi yenye matumizi sahihi ya kivumishi?",
    [
      "Kitabu kizuri kiko mezani.",
      "Mzuri kitabu kiko mezani.",
      "Kitabu iko zuri mezani.",
      "Kizuri mezani kiko kitabu.",
    ],
    "Kitabu kizuri kiko mezani.",
    "Kivumishi 'kizuri' kimetumika kufuata nomino 'kitabu' kwa mpangilio sahihi.",
  ),
  mk(
    "Katika sentensi 'Asha anasoma darasani', neno 'darasani' linaonyesha nini?",
    [
      "Mahali kitendo kinafanyika.",
      "Muda wa kitendo.",
      "Jina la mtu anayesoma.",
      "Aina ya kitabu kinachosomwa.",
    ],
    "Mahali kitendo kinafanyika.",
    "Neno 'darasani' ni kielezi cha mahali.",
    "easy",
  ),
  mk(
    "Neno lipi ni kitenzi katika sentensi: 'Watoto walicheza uwanjani jana'?",
    ["walicheza", "watoto", "uwanjani", "jana"],
    "walicheza",
    "Kitenzi huonyesha kitendo; hapa kitendo ni 'walicheza'.",
    "easy",
  ),
  mk(
    "Ngeli ipi inafaa kwa neno 'vitabu'?",
    ["KI-VI", "M-WA", "U-I", "PA-KU-MU"],
    "KI-VI",
    "Neno 'kitabu/vitabu' huingia katika ngeli ya KI-VI.",
  ),
  mk(
    "Ni ipi sentensi yenye kihusishi kilichotumika kwa usahihi?",
    [
      "Alienda sokoni kwa miguu.",
      "Alienda sokoni ya miguu.",
      "Alienda sokoni na miguu.",
      "Alienda sokoni wa miguu.",
    ],
    "Alienda sokoni kwa miguu.",
    "Kihusishi 'kwa' ndicho kinachofaa kueleza namna ya kwenda.",
  ),
  mk(
    "Sehemu ipi SIYO kipengele cha hadithi?",
    ["Mhusika", "Mandhari", "Lugha ya programu", "Msimulizi"],
    "Lugha ya programu",
    "Vipengele vya hadithi ni vya kifasihi, si vya kompyuta.",
    "easy",
  ),
  mk(
    "Katika mjadala wa darasani, hatua ya kwanza yenye manufaa ni ipi?",
    [
      "Kutoa hoja kwa heshima na ushahidi.",
      "Kukatiza anayezungumza.",
      "Kupaza sauti ili ushinde.",
      "Kudharau hoja ya mwenzako.",
    ],
    "Kutoa hoja kwa heshima na ushahidi.",
    "Mjadala bora hujengwa kwa hoja zenye mantiki na heshima.",
  ),
  mk(
    "Katika ufahamu wa matini, mbinu bora ya kujibu maswali ni ipi?",
    [
      "Kusoma matini kwa makini kisha kurejea sehemu husika.",
      "Kukisia majibu bila kusoma matini.",
      "Kuangalia swali la mwisho tu.",
      "Kupuuza msamiati usioeleweka.",
    ],
    "Kusoma matini kwa makini kisha kurejea sehemu husika.",
    "Ufahamu mzuri unahitaji usomaji wa makini na rejea ya ushahidi kutoka matini.",
  ),
];

const CURATED_QUESTION_BANK: Partial<Record<SubjectKey, SeedQuestion[]>> = {
  "7:Kiswahili": KISWAHILI_SEED_QUESTIONS,
};

const SUBJECT_QUESTION_BANK: Record<CbcSubject, SeedQuestion[]> = {
  Mathematics: [
    mk("What is 25% of 200?", ["20", "25", "50", "75"], "50", "25% is one quarter; one quarter of 200 is 50."),
    mk("Solve: 3x + 5 = 20. What is x?", ["3", "4", "5", "6"], "5", "3x = 15, so x = 5."),
    mk("The sum of interior angles of a triangle is:", ["90°", "180°", "270°", "360°"], "180°", "Triangles always total 180°."),
    mk("What is the value of 2^4?", ["6", "8", "12", "16"], "16", "2^4 = 2 × 2 × 2 × 2."),
    mk("A ratio of 2:3 is equivalent to:", ["4:6", "6:4", "3:2", "5:6"], "4:6", "Multiply both parts by the same number."),
    mk("Mean of 4, 6, 8, 10 is:", ["6", "7", "8", "9"], "7", "Sum is 28; 28 ÷ 4 = 7."),
    mk("A right triangle has legs 6 and 8. Hypotenuse is:", ["10", "12", "13", "14"], "10", "6² + 8² = 100, √100 = 10."),
    mk("0.75 as a fraction is:", ["3/5", "3/4", "2/3", "5/8"], "3/4", "0.75 = 75/100 = 3/4."),
    mk("Area of a rectangle 9 cm by 4 cm:", ["13 cm²", "26 cm²", "36 cm²", "40 cm²"], "36 cm²", "Area = length × width."),
    mk("If CP = 800 and SP = 920, profit % is:", ["10%", "12.5%", "15%", "20%"], "15%", "Profit 120; 120/800 × 100 = 15%."),
  ],
  English: [
    mk(
      "Choose the correctly punctuated sentence.",
      ["Lets eat, grandma.", "Let's eat grandma.", "Let's eat, grandma.", "Lets eat grandma."],
      "Let's eat, grandma.",
      "Apostrophe for contraction and comma for direct address.",
    ),
    mk("Identify the adverb in: 'She sang beautifully.'", ["She", "sang", "beautifully", "none"], "beautifully", "Adverbs describe how."),
    mk(
      "Which sentence is in passive voice?",
      ["The boy kicked the ball.", "The ball was kicked by the boy.", "The boy is kicking.", "Kick the ball."],
      "The ball was kicked by the boy.",
      "Passive: subject receives the action.",
    ),
    mk("A synonym for 'rapid' is:", ["slow", "quick", "quiet", "small"], "quick", "Rapid means fast."),
    mk(
      "Choose correct subject-verb agreement.",
      ["The team are winning.", "The team is winning.", "The team were winning.", "The team have winning."],
      "The team is winning.",
      "Here 'team' is treated as a single unit.",
    ),
    mk("The plural of 'analysis' is:", ["analysises", "analysis", "analyses", "analys"], "analyses", "Irregular plural."),
    mk("Which word is a conjunction?", ["because", "table", "bright", "run"], "because", "Conjunctions join clauses."),
    mk(
      "Pick the sentence with correct tense consistency.",
      [
        "She studied and passes the exam.",
        "She studies and passed the exam.",
        "She studied and passed the exam.",
        "She study and passed the exam.",
      ],
      "She studied and passed the exam.",
      "Past tense throughout.",
    ),
    mk(
      "Main purpose of a topic sentence is to:",
      ["give jokes", "state the main idea", "end the essay", "add punctuation"],
      "state the main idea",
      "It introduces the paragraph focus.",
    ),
    mk(
      "A metaphor is:",
      ["a direct comparison (one thing is another)", "only exaggeration", "repeated vowels", "a map"],
      "a direct comparison (one thing is another)",
      "Metaphor compares without 'like' or 'as'.",
    ),
  ],
  Kiswahili: KISWAHILI_SEED_QUESTIONS,
  Science: [
    mk("Which process do plants use to make food?", ["respiration", "photosynthesis", "digestion", "transpiration"], "photosynthesis", "Plants use light, water and CO₂."),
    mk("Water boils at what temperature at sea level?", ["50°C", "75°C", "100°C", "120°C"], "100°C", "Standard boiling point."),
    mk("Which organ pumps blood?", ["lungs", "brain", "heart", "kidney"], "heart", "Heart circulates blood."),
    mk("Force pulling objects toward Earth:", ["friction", "gravity", "magnetism", "pressure"], "gravity", "Gravity attracts mass."),
    mk("Liquid to gas is called:", ["condensation", "freezing", "evaporation", "melting"], "evaporation", "Evaporation produces vapor."),
    mk("Which is renewable?", ["coal", "petrol", "solar", "diesel"], "solar", "Sunlight is replenished."),
    mk("Humans need which gas to respire?", ["carbon dioxide", "oxygen", "nitrogen", "helium"], "oxygen", "Cells use oxygen."),
    mk("A simple circuit needs:", ["only a bulb", "only a battery", "source, path, and load", "only wires"], "source, path, and load", "Complete path for current."),
    mk("Which group often lays eggs?", ["mammals only", "birds and reptiles", "cats only", "whales only"], "birds and reptiles", "Many birds and reptiles are oviparous."),
    mk("Balanced diet means:", ["protein only", "one meal daily", "nutrients in right amounts", "no water"], "nutrients in right amounts", "Health needs balance."),
  ],
  "Social Studies": [
    mk("A map key explains:", ["jokes", "symbols", "rainfall only", "time"], "symbols", "Keys decode map symbols."),
    mk("County government mainly:", ["prints money", "local services", "declares war", "foreign policy"], "local services", "Devolved functions."),
    mk("Citizenship includes:", ["no rights", "rights and duties", "only duties", "only travel"], "rights and duties", "Civic balance."),
    mk("Forest conservation helps:", ["more erosion", "less rain", "environment", "no farming"], "environment", "Forests protect ecosystems."),
    mk("Import trade is:", ["local sales", "buying from abroad", "only farming", "road building"], "buying from abroad", "Imports come in."),
    mk("Population density is:", ["births only", "people per area", "school count", "vehicles"], "people per area", "People over land."),
    mk("EAC is a bloc in:", ["West Africa", "East Africa", "North Africa", "Europe"], "East Africa", "East African Community."),
    mk("A constitution:", ["changes daily", "defines governance", "only oral", "removes laws"], "defines governance", "Supreme framework."),
    mk("Roads suit short trips because:", ["always free", "flexible access", "no fuel", "no upkeep"], "flexible access", "Door-to-door."),
    mk("Written at the time of an event:", ["secondary", "primary source", "blog only", "cartoon only"], "primary source", "Firsthand record."),
  ],
  CRE: [
    mk("Golden Rule:", ["revenge", "treat others as you wish", "ignore others", "avoid neighbors"], "treat others as you wish", "Love neighbor as self."),
    mk("Who received the Ten Commandments?", ["Abraham", "Moses", "David", "Paul"], "Moses", "At Mount Sinai."),
    mk("A parable is:", ["law book", "story with moral", "hymn only", "map"], "story with moral", "Teaching stories."),
    mk("'Do not steal' promotes:", ["dishonesty", "integrity", "violence", "greed"], "integrity", "Respect for property."),
    mk("Prayer is mainly:", ["talk to God", "entertainment", "show wealth", "skip study"], "talk to God", "Communication with God."),
    mk("Forgiveness means:", ["keep anger", "release resentment", "punish all", "ignore justice"], "release resentment", "Mercy and restoration."),
    mk("Bible has:", ["one part only", "Old and New Testaments", "maps only", "laws only"], "Old and New Testaments", "Two main sections."),
    mk("Prophet often:", ["built roads", "delivered God's message", "taxes", "all wars"], "delivered God's message", "Called to righteousness."),
    mk("Stewardship is:", ["waste", "faithful use of resources", "hoarding", "no work"], "faithful use of resources", "Responsible care."),
    mk("Love for neighbor shows as:", ["mocking", "helping others", "rumors", "selfishness"], "helping others", "Practical compassion."),
  ],
  "Business Studies": [
    mk("Sole proprietorship owned by:", ["one person", "two firms", "gov only", "only shareholders"], "one person", "Single owner."),
    mk("Capital means:", ["customers only", "assets to run business", "profit only", "debts only"], "assets to run business", "Funds and assets."),
    mk("Demand often rises when price:", ["rises", "falls", "fixed", "ignored"], "falls", "Law of demand."),
    mk("Bookkeeping helps:", ["skip records", "track transactions", "replace marketing", "remove customers"], "track transactions", "Financial records."),
    mk("Entrepreneur:", ["avoids risk", "seizes opportunities", "gov only", "no innovation"], "seizes opportunities", "Creates value."),
    mk("Insurance mainly:", ["raises tax", "shares risk", "guarantees profit", "no planning"], "shares risk", "Policy-based cover."),
    mk("Receipt issued when:", ["return", "payment received", "stock count", "late pay"], "payment received", "Proof of payment."),
    mk("Market research:", ["guess", "understand customers", "kill products", "avoid competition"], "understand customers", "Informs decisions."),
    mk("Consumer protection:", ["cheating ok", "fair treatment", "secret prices", "no standards"], "fair treatment", "Rights and standards."),
    mk("A budget is:", ["random spend", "income/spend plan", "debt letter", "insurance form"], "income/spend plan", "Financial planning."),
  ],
  Geography: [
    mk("Contour lines join equal:", ["temperature", "elevation", "rain", "population"], "elevation", "Height above sea level."),
    mk("Rainfall measured with:", ["thermometer", "barometer", "rain gauge", "hygrometer"], "rain gauge", "Collects precipitation."),
    mk("Weather is:", ["30-year average", "short-term atmosphere", "rock type", "ownership"], "short-term atmosphere", "Day-to-day."),
    mk("Climate is:", ["one day", "long-term average", "only rain", "only temp"], "long-term average", "Years of pattern."),
    mk("Reduce erosion by:", ["deforest", "terracing + plants", "overgraze", "burn"], "terracing + plants", "Slow runoff."),
    mk("Delta forms at:", ["source", "mouth", "peak", "desert"], "mouth", "Sediment deposit."),
    mk("Latitude lines run:", ["N-S", "E-W", "diagonal", "random"], "E-W", "Parallel to equator."),
    mk("Urbanization:", ["town decline", "city growth", "fewer services", "to farms only"], "city growth", "Urban expansion."),
    mk("Plate tectonics explains:", ["currency", "quakes/volcanoes", "timetables", "trade"], "quakes/volcanoes", "Crust movement."),
    mk("Renewable example:", ["coal", "solar", "oil", "gas"], "solar", "Replenished naturally."),
  ],
  History: [
    mk("Primary source:", ["textbook summary", "diary from event", "blog", "cartoon"], "diary from event", "Firsthand."),
    mk("Colonialism in Africa:", ["self-rule", "foreign control", "equal only", "no change"], "foreign control", "External rule."),
    mk("Nationalism helped:", ["erase identity", "independence struggles", "end schools", "few parties"], "independence struggles", "Self-rule drive."),
    mk("Constitution in history:", ["gossip", "governance framework", "oral only", "removes laws"], "governance framework", "State structure."),
    mk("Archaeology studies:", ["weather", "material remains", "fiction", "rumors"], "material remains", "Artifacts."),
    mk("Trade routes helped:", ["isolation", "exchange", "no migration", "no culture"], "exchange", "Goods and ideas."),
    mk("Independence means:", ["occupation", "self-governance", "military rule", "collapse"], "self-governance", "Sovereign state."),
    mk("Timeline shows:", ["chronology", "exam scores", "maps", "weather"], "chronology", "Event order."),
    mk("Oral tradition:", ["useless", "community memory", "replaces all writing", "only fun"], "community memory", "Heritage."),
    mk("Regional cooperation aims:", ["conflict", "trade and stability", "close borders", "ban roads"], "trade and stability", "Shared gains."),
  ],
  Biology: [
    mk("Basic unit of life:", ["tissue", "organ", "cell", "organism"], "cell", "Cell theory."),
    mk("Photosynthesis mainly in:", ["roots", "chloroplasts", "xylem only", "stomata only"], "chloroplasts", "Chlorophyll site."),
    mk("Gas exchange in humans in:", ["heart", "alveoli", "kidney", "arteries"], "alveoli", "Lung sacs."),
    mk("Xylem carries:", ["sugar", "water and minerals", "O₂ only", "food down"], "water and minerals", "Upward transport."),
    mk("Dominant allele expressed when:", ["with recessive", "no alleles", "mitochondria", "hidden always"], "with recessive", "One dominant shows."),
    mk("Removing metabolic waste:", ["digestion", "excretion", "respiration", "circulation"], "excretion", "Waste removal."),
    mk("Ecosystem includes:", ["animals only", "plants only", "life + environment", "soil only"], "life + environment", "Biotic + abiotic."),
    mk("Food chain shows:", ["genes", "feeding energy flow", "weather", "mitosis"], "feeding energy flow", "Who eats whom."),
    mk("Mitosis produces:", ["4 different", "2 identical cells", "gametes only", "none"], "2 identical cells", "Growth/repair."),
    mk("Classification helps:", ["confuse", "group by traits", "ignore evolution", "no names"], "group by traits", "Organize life."),
  ],
  Chemistry: [
    mk("One type of atom:", ["compound", "mixture", "element", "solution"], "element", "Pure element."),
    mk("Neutral pH:", ["1", "7", "10", "14"], "7", "pH scale midpoint."),
    mk("Filtration separates:", ["salt from water", "solid from liquid", "O₂ from air", "miscible liquids"], "solid from liquid", "Insoluble residue."),
    mk("Ion forms by:", ["nucleus change", "electron gain/loss", "melting", "crystal only"], "electron gain/loss", "Charge imbalance."),
    mk("Periodic table by:", ["mass only", "atomic number", "color", "density"], "atomic number", "Proton count."),
    mk("HCl + NaOH gives:", ["salt + water", "O₂ + H₂", "CO₂ only", "metal"], "salt + water", "Neutralization."),
    mk("Rusting needs:", ["iron only", "iron + H₂O + O₂", "sun only", "N₂"], "iron + H₂O + O₂", "Oxidation in moisture."),
    mk("Catalyst:", ["consumed", "speeds unchanged", "stops reaction", "less product"], "speeds unchanged", "Lowers activation energy."),
    mk("Electrolysis is:", ["electric decomposition", "evaporation", "freezing", "burning"], "electric decomposition", "Current drives reaction."),
    mk("Conservation of mass:", ["created", "destroyed", "conserved in reactions", "equals volume"], "conserved in reactions", "Closed system."),
  ],
  Physics: [
    mk("SI unit of force:", ["joule", "newton", "watt", "pascal"], "newton", "N."),
    mk("Speed =", ["d×t", "d÷t", "t÷d", "m÷v"], "d÷t", "Distance over time."),
    mk("Pressure highest when:", ["large area", "small area", "zero force", "zero area"], "small area", "P = F/A."),
    mk("Convex lens:", ["diverges", "converges", "absorbs all", "no image"], "converges", "Focuses light."),
    mk("Current measured with:", ["voltmeter", "ammeter", "barometer", "thermometer"], "ammeter", "Amperes."),
    mk("Energy is:", ["lost always", "converted", "only in batteries", "only kinetic"], "converted", "Conservation."),
    mk("Waves transfer:", ["matter only", "energy", "atoms", "nothing"], "energy", "Propagation."),
    mk("Heat by contact:", ["radiation", "conduction", "convection", "reflection"], "conduction", "Direct contact."),
    mk("Newton I: body at rest unless:", ["equal mass", "unbalanced force", "temp", "pressure"], "unbalanced force", "Inertia."),
    mk("Field lines with current wire seen using:", ["wood", "iron filings", "sand", "salt"], "iron filings", "Align to B-field."),
  ],
};

function difficultyForGrade(grade: number): "easy" | "medium" | "hard" {
  if (grade <= 6) return "easy";
  if (grade <= 9) return "medium";
  return "hard";
}

export function buildSeedQuestions() {
  const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return grades.flatMap((grade) =>
    getSubjectsForGrade(grade).flatMap((subject) => {
      const curatedKey = `${grade}:${subject}` as SubjectKey;
      const curated = CURATED_QUESTION_BANK[curatedKey];
      if (curated && curated.length > 0) {
        return curated.map((item) => ({
          subject,
          grade,
          ...item,
        }));
      }

      return SUBJECT_QUESTION_BANK[subject].map((item) => ({
        subject,
        grade,
        ...item,
        difficulty: difficultyForGrade(grade),
      }));
    }),
  );
}

export type PreviewQuestion = SeedQuestion & { id: string };

function shuffleInPlace<T>(items: T[]) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}

export function buildCbcPreviewPack(params: { grade: number; subject: CbcSubject; count?: number }): PreviewQuestion[] {
  const count = params.count ?? 5;
  const curatedKey = `${params.grade}:${params.subject}` as SubjectKey;
  const curated = CURATED_QUESTION_BANK[curatedKey];
  if (curated && curated.length > 0) {
    const curatedItems = [...curated];
    shuffleInPlace(curatedItems);
    return curatedItems.slice(0, count).map((item, idx) => ({
      id: `cbc-curated-${params.grade}-${params.subject}-${idx}`,
      ...item,
    }));
  }

  const baseBank = [...SUBJECT_QUESTION_BANK[params.subject]];
  shuffleInPlace(baseBank);

  return baseBank.slice(0, count).map((base, idx) => ({
    id: `cbc-${params.grade}-${params.subject}-${idx}`,
    ...base,
    difficulty: difficultyForGrade(params.grade),
  }));
}
