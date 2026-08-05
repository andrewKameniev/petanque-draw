export default {
  en: {
    docs: {
      title: 'Documentation',
      search: 'Search...',
      backToTop: 'Back to top',
      overview: 'Overview',
      quickRef: 'Quick Reference',
      systems: 'Tournament Systems',
      formats: 'Combined Formats',
      rankings: 'Rankings & Scoring',
      guide: 'How to Use',
      faq: 'FAQ',

      // Quick reference cards
      glossary: {
        title: 'Petanque Tournament Glossary',
        swiss: {
          term: 'Swiss System',
          short: 'Intelligent pairing — same-level opponents each round, no rematches',
        },
        barrage: {
          term: 'Barrage',
          short: 'Round-robin qualification in small groups before playoff',
        },
        cadrage: {
          term: 'Cadrage',
          short: 'Play-in round for bubble teams between Swiss and Playoff',
        },
        playoff: {
          term: 'Playoff',
          short: 'Knockout bracket — single elimination (one loss = out) or double elimination (two losses)',
        },
        tir: {
          term: 'TIR (Tir de Précision)',
          short: 'Individual precision shooting across 5 stations at various distances',
        },
        supermele: {
          term: 'Supermele',
          short: 'Fun format — teams randomly reshuffled every round',
        },
        buchholz: {
          term: 'Buchholz',
          short: "Tiebreaker: sum of all opponents' wins throughout the tournament",
        },
        technical: {
          term: 'Technical (Bye)',
          short: 'Walkover win given to odd-numbered team (13:7 default score)',
        },
        carreau: {
          term: 'Carreau',
          short: 'TIR: perfect shot — your boule replaces the target (5 pts)',
        },
        reussi: {
          term: 'Réussi',
          short: 'TIR: successful shot — boule stays in scoring zone (3 pts)',
        },
        touche: {
          term: 'Touché',
          short: "TIR: touched the target but didn't stay (1 pt)",
        },
        manque: {
          term: 'Manqué',
          short: 'TIR: missed the target completely (0 pts)',
        },
        lane: {
          term: 'Lane (Terrain)',
          short: 'Playing field/court. App assigns lanes to minimize repeats',
        },
        cochonnet: {
          term: 'Cochonnet',
          short: 'The small target ball (jack) that players throw towards',
        },
      },

      // Swiss system
      swissSystem: {
        title: 'Swiss System',
        subtitle: 'The primary format for petanque tournaments',
        intro:
          'Teams play a limited number of rounds with intelligent pairing. NOT a round-robin — you only play a fraction of the field.',
        rules: {
          title: 'Core Rules',
          noRematch: 'A team NEVER plays the same opponent twice',
          equalWins: 'After round 1, teams with equal wins play each other (strongest vs strongest)',
          pairing: 'Within a win tier, pairing is first-vs-last by ranking',
          odd: "Odd number of teams = Technical bye for the weakest unbye'd team",
        },
        maxRounds: {
          title: 'Maximum Rounds',
          explanation:
            "Each round eliminates one possible future opponent. After ~N/2 rounds the algorithm can't find valid pairs.",
          teams: 'Teams',
          rounds: 'Max Rounds',
        },
        firstRound: {
          title: 'First Round Pairing',
          noRating: 'Without rating: completely random',
          withRating: 'With rating: seeded (rank 1 vs rank N/2+1, etc.)',
        },
        subsequentRounds: {
          title: 'Subsequent Rounds',
          step1: 'Sort all teams by ranking',
          step2: 'Group teams by number of wins',
          step3: 'Within each win-tier: pair first with last',
          step4: 'If invalid (already played): try next available',
          step5: 'If no valid opponent: backtracking algorithm',
          step6: 'If all exhausted: draw error',
        },
        bye: {
          title: 'Technical Win (Bye)',
          text: 'When odd teams: lowest-ranked team gets a walkover with preset score (default 13:7). A team can only receive one Technical bye per tournament.',
        },
        calculator: {
          title: 'Swiss Calculator',
          description: 'Calculate optimal number of rounds for your tournament',
          teamsLabel: 'Number of teams',
          result: 'Recommended rounds: {rounds} (max: {max})',
        },
      },

      // Groups
      groupsSystem: {
        title: 'Groups (Round-Robin)',
        subtitle: 'Full round-robin within groups',
        intro: 'Teams split into groups. Within each group, everyone plays everyone.',
        formation: {
          title: 'Group Formation',
          withRating: 'With rating: snake distribution (1,4,5,8 in group A; 2,3,6,7 in group B) — balanced groups',
          noRating: 'Without rating: random distribution',
          special: 'Special 2-group scheme for <33 teams using bracket-style distribution',
        },
        scheduling: {
          title: 'Scheduling',
          text: 'Circle method: position 0 fixed, all others rotate. N teams = N-1 rounds.',
        },
        ranking: {
          title: 'Ranking Within Group',
          criteria: 'wins > direct wins > direct points > point difference',
          headToHead: 'When tied on wins, only head-to-head results between tied teams matter.',
        },
        after: {
          title: 'After Groups',
          text: 'Top N teams from each group advance to Playoff or Cadrage.',
        },
      },

      // Barrage
      barrageSystem: {
        title: 'Barrage (Poules de Barrage)',
        subtitle: 'Round-robin qualification format',
        intro: 'Can be used standalone or as a phase within Swiss tournament.',
        standalone: {
          title: 'Standalone (Poules System)',
          text: 'Teams placed into groups, play full round-robin. Top teams per group advance to Playoff.',
        },
        withinSwiss: {
          title: 'Within Swiss Tournament',
          step1: 'After Swiss rounds complete, organizer triggers barrage',
          step2: 'Qualifying teams distributed into small groups (3-4 teams)',
          step3: 'Full round-robin within each group',
          step4: 'Top N per group advance to playoff',
        },
        qualification: {
          title: 'Qualification',
          text: 'A team needs 2+ wins in its barrage group to qualify for playoff.',
        },
        ranking: {
          title: 'Ranking',
          text: 'Only barrage results count — Swiss results used for seeding only.',
        },
      },

      // Supermele
      supermeleSystem: {
        title: 'Supermele',
        subtitle: 'Social/fun format with rotating teams',
        intro: 'Individual players register alone. Teams are reformed EVERY round — a great social format.',
        modes: {
          title: 'Modes',
          ideal: 'Ideal (default)',
          idealDesc:
            'Balanced team formation — strongest player paired with weakest each round. Equalizes team strength so games stay competitive.',
          idealRound1: 'Round 1: random (or by rating if enabled)',
          idealRound2: 'Round 2+: sorted by wins then point difference, paired top with bottom',
          standard: 'Standard',
          standardDesc:
            'Fully random team formation every round. Only constraint: avoid pairing the same players together twice.',
        },
        howItWorks: {
          title: 'How Drawing Works',
          individual: 'Players are individual participants (not fixed teams)',
          doublesPreferred:
            'Doubles preferred: all doubles by default. Odd player count adds a triple or gives technical',
          triplesPreferred: 'Triples preferred: all triples. Leftover players form doubles',
          avoidRepeat: 'Tracks teammates — same pair never plays together twice (best-effort)',
        },
        avoidTechnical: {
          title: 'Avoid Technical Win',
          text: 'When enabled (default), the app splits or joins teams instead of giving a walkover:',
          tetATet: 'Odd number of doubles → last double splits into 1v1 (tête-à-tête)',
          joinTriple: 'Odd player count → leftover player joins a team as a triple',
          triplesConvert: 'Triples mode → converts triples to doubles to achieve even team count',
          example: 'Example: 10 players → 5 doubles (odd) → 2 matches + 1 tête-à-tête',
        },
        ranking: {
          title: 'Ranking & Points',
          text: 'Individual stats accumulate across all rounds:',
          criteria: '1) Wins → 2) Point difference → 3) Points scored → 4) Rating',
          noBuchholz: 'No Buchholz — meaningless when teammates change every round.',
          pointsTitle: 'How points count:',
          win: 'If your team won — you get +1 win',
          pointsPlus: "Your team's score added to your Points+",
          pointsMinus: "Opponent's score added to your Points−",
        },
      },

      // TIR
      tirSystem: {
        title: 'TIR (Tir de Précision)',
        subtitle: 'Individual precision shooting tournament',
        intro: 'Individual players compete across 5 ateliers (exercise stations) at multiple distances.',
        structure: {
          title: 'Structure',
          ateliers: '5 ateliers (shooting exercises)',
          distances: 'Scored at distances: 6m, 7m, 8m, 9m (seniors) or 6m, 7m, 8m (juniors)',
          maxSenior: 'Max total: 100 pts (senior)',
          maxJunior: 'Max total: 75 pts (junior)',
        },
        scoring: {
          title: 'Scoring',
          carreau: 'Carreau — 5 pts (perfect replacement shot)',
          reussi: 'Réussi — 3 pts (stayed in zone)',
          touche: 'Touché — 1 pt (touched target)',
          manque: 'Manqué — 0 pts (missed)',
        },
        modes: {
          title: 'Scoring Modes',
          byParticipant: 'By participant: Select player, fill all 5 ateliers',
          byAtelier: 'By atelier: Select station, fill scores for all players',
        },
        rounds: {
          title: '2-Round Qualification',
          text: 'Optional mode: Round 1 for all, top 4 directly qualify to quarterfinals. Places 5-16 play Round 2. Top 4 from R2 (by combined score) join the 4 direct qualifiers. 8 players total enter playoff.',
        },
        ranking: {
          title: 'Ranking',
          text: 'Total score > carreau count (tiebreaker). Pure precision-based.',
        },
      },

      // Playoff
      playoffSystem: {
        title: 'Playoff',
        subtitle: 'Knockout bracket format',
        intro:
          'Two formats: Single Elimination (lose once = out) and Double Elimination (two losses to be eliminated).',
        formatChoice: {
          title: 'Format Selection',
          single: 'Single Elimination — classic knockout, supports 4-64 teams',
          double: 'Double Elimination — everyone gets a second chance, any team count from 2+',
        },
        seeding: {
          title: 'Seeding',
          text: 'Standard tournament bracket: seed 1 and seed 2 meet only in the final. Top seeds avoid each other as long as possible.',
        },
        bracket: {
          title: 'Bracket (8 teams)',
          text: '1 vs 8, 4 vs 5, 3 vs 6, 2 vs 7 — ensures rank 1 and rank 2 meet latest.',
        },
        thirdPlace: {
          title: 'Third-Place Match',
          text: 'Optional game between semifinal losers (single elimination only).',
        },
        doubleElim: {
          title: 'Double Elimination',
          text: 'All start in Winners Bracket. First loss drops to Losers Bracket. Second loss eliminates.',
          crossing: 'Losers drop to opposite side of lower bracket — prevents immediate rematch after a loss.',
          grandFinal: 'Winners Final champion vs Losers Final champion play one decisive Grand Final.',
          sizes: 'Any team count from 2+. Non-power-of-two fields padded with seeded byes.',
        },
        finalRanking: {
          title: 'Final Ranking',
          first: 'Final winner = 1st',
          second: 'Final loser = 2nd',
          third: 'Third-place winner = 3rd (single) / by elimination round (double)',
          fourth: 'Third-place loser = 4th',
          rest: 'Quarterfinal losers = 5th-8th (ranked by Swiss standing)',
          doubleNote: 'In double elimination: ranked by how late you were eliminated from losers bracket',
        },
      },

      // Cadrage
      cadrageSystem: {
        title: 'Cadrage (Play-In Round)',
        subtitle: 'Qualifying elimination for bubble teams',
        intro: 'French: "cadrer" = to frame. Bridges the gap when more teams qualify than the bracket needs.',
        example: {
          title: 'Example: 50 teams, top-16 playoff',
          direct: 'Positions 1-8: Directly seeded into playoff',
          cadrage: 'Positions 9-24: Play cadrage (16 teams → 8 games → 8 winners)',
          eliminated: 'Positions 25-50: Tournament over',
        },
        pairing: {
          title: 'Pairing',
          text: 'Best-of-bubble vs worst-of-bubble: rank 9 vs rank 24, rank 10 vs rank 23, etc.',
        },
        math: {
          title: 'Math',
          directSeeds: 'Direct seeds: top T/2 teams skip cadrage',
          pool: 'Cadrage pool: teams ranked T/2+1 through T×1.5',
          winners: 'Cadrage produces T/2 winners who fill the bracket',
        },
      },

      // Combined formats
      swissPlayoff: {
        title: 'Swiss + Playoff',
        subtitle: 'The most common competitive format',
        intro: 'Swiss rounds determine seeding, then top teams play knockout.',
        flow: {
          title: 'Flow',
          step1: 'Swiss rounds (4-7 rounds depending on team count)',
          step2: 'Organizer triggers "Go Playoff" — top N teams enter bracket',
          step3: 'Playoff single elimination determines final ranking',
        },
        options: {
          title: 'Options',
          cadrage: 'Add Cadrage play-in between Swiss and Playoff',
          tournamentB: 'Tournament B for non-qualifying teams',
        },
      },

      swissBarragePlayoff: {
        title: 'Swiss + Barrage + Playoff',
        subtitle: 'Extended format with round-robin qualification',
        intro: 'Maximum accuracy in determining playoff qualifiers for large tournaments (30+ teams).',
        flow: {
          title: 'Flow',
          step1: 'Swiss rounds determine initial ranking',
          step2: 'Barrage — qualifying teams play round-robin in small groups',
          step3: 'Group winners advance to Playoff knockout',
        },
        whenToUse: {
          title: 'When to Use',
          text: 'Large tournaments where the organizer wants maximum accuracy. Barrage eliminates lucky Swiss results.',
        },
      },

      tournamentB: {
        title: 'Tournament B',
        subtitle: 'Companion tournament for eliminated players',
        intro: 'When playoff starts, remaining teams can continue in a fresh Swiss tournament.',
        howItWorks: {
          title: 'How It Works',
          step1: 'Organizer enables Tournament B before starting playoff',
          step2: 'Non-qualifying teams are copied to a new tournament',
          step3: 'Stats reset — fresh independent Swiss tournament',
          step4: 'Both tournaments run simultaneously',
        },
      },

      // Rankings
      rankingAlgorithms: {
        title: 'Ranking Algorithms',
        subtitle: 'How teams are sorted in each system',
        swiss: {
          title: 'Swiss Ranking',
          criteria: 'wins > Buchholz > Small Buchholz > point difference > points scored > rating',
        },
        groups: {
          title: 'Groups Ranking',
          criteria: 'wins > direct wins > direct points > point difference',
          note: 'Head-to-head between tied teams only',
        },
        supermele: {
          title: 'Supermele Ranking',
          criteria: 'wins > point difference > points scored > rating',
          note: 'No Buchholz (teams change every round)',
        },
        barrage: {
          title: 'Barrage Ranking',
          criteria: 'wins > point difference',
          note: 'Only results within barrage group count',
        },
        tir: {
          title: 'TIR Ranking',
          criteria: 'total score > carreau count',
          note: 'Pure precision-based',
        },
        buchholz: {
          title: 'What is Buchholz?',
          text: "Sum of all your opponents' wins. Rewards teams who faced stronger opposition. Small Buchholz (SBuh) is the same but excludes the weakest opponent.",
        },
        lanes: {
          title: 'Lane Assignment',
          text: 'Across all systems, lanes minimize repeat assignments using a weight matrix. Fresh lanes (never played) are always preferred.',
        },
      },

      // FAQ
      faqSection: {
        title: 'Frequently Asked Questions',
        items: {
          q1: 'How many rounds should I play in Swiss?',
          a1: 'Roughly half the number of teams. The app caps at Math.round(N/2). For 16 teams, play 5-7 rounds for a good balance of fairness and time.',
          q2: 'What happens with an odd number of teams?',
          a2: "The lowest-ranked team that hasn't had a bye gets a Technical win (default 13:7). Each team can only get one bye per tournament.",
          q3: 'Can I edit results from a previous round?',
          a3: 'Yes! In Groups/Round-Robin, use the pencil icon in the Results tab. All stats will be recalculated automatically.',
          q4: "What's the difference between Barrage and Groups?",
          a4: 'They use the same round-robin format, but Barrage is typically a short qualification stage (3-4 teams per group) inserted between Swiss and Playoff. Groups is a standalone system.',
          q5: 'How does the calculator determine recommended rounds?',
          a5: 'For Swiss: approximately log₂(teams) for competitive results, with maximum at N/2. More rounds = more accurate ranking but more time.',
          q6: 'Can I run TIR and Swiss simultaneously?',
          a6: 'Yes, you can have up to 10 active tournaments including TIR. Switch between them from the sidebar menu.',
          q7: 'What if the Swiss draw fails?',
          a7: "This means no valid pairing exists (too many rounds played). You've reached the mathematical limit — start playoff or finish the tournament.",
          q8: 'How does seeding work in Playoff?',
          a8: 'Standard bracket seeding: #1 seed is placed to meet #2 only in the final. Top seeds are kept apart as long as possible for fair competition.',
        },
      },
    },
  },
  ua: {
    docs: {
      title: 'Документація',
      search: 'Пошук...',
      backToTop: 'На початок',
      overview: 'Огляд',
      quickRef: 'Довідник',
      systems: 'Системи турнірів',
      formats: 'Комбіновані формати',
      rankings: 'Рейтинги та підрахунок',
      guide: 'Як користуватись',
      faq: 'FAQ',

      glossary: {
        title: 'Глосарій турнірних термінів',
        swiss: {
          term: 'Швейцарська система',
          short: 'Розумна жеребкування — суперники одного рівня, без повторів',
        },
        barrage: {
          term: 'Бараж',
          short: 'Кваліфікація круговим турніром у малих групах перед плей-оф',
        },
        cadrage: {
          term: 'Кадраж',
          short: 'Додатковий раунд для команд на межі між Швейцаркою та Плей-оф',
        },
        playoff: {
          term: 'Плей-оф',
          short: 'Сітка на виліт — одинарне (одна поразка = вибув) або подвійне (дві поразки) вибування',
        },
        tir: {
          term: 'TIR (Tir de Précision)',
          short: 'Індивідуальна точність стрільби на 5 вправах, різні дистанції',
        },
        supermele: {
          term: 'Супермеле',
          short: 'Розважальний формат — команди перемішуються кожен раунд',
        },
        buchholz: {
          term: 'Бухгольц',
          short: 'Тай-брейк: сума перемог усіх суперників протягом турніру',
        },
        technical: {
          term: 'Технічна (пауза)',
          short: 'Технічна перемога для непарної команди (рахунок 13:7 за замовч.)',
        },
        carreau: {
          term: 'Карро',
          short: 'TIR: ідеальний кидок — куля замінює ціль (5 балів)',
        },
        reussi: {
          term: 'Реюсі',
          short: 'TIR: вдалий кидок — куля залишилась у зоні (3 бали)',
        },
        touche: {
          term: 'Туше',
          short: 'TIR: дотик до цілі, але не залишилась (1 бал)',
        },
        manque: {
          term: 'Манке',
          short: 'TIR: промах (0 балів)',
        },
        lane: {
          term: 'Терен (доріжка)',
          short: 'Ігровий майданчик. Додаток розподіляє терени щоб уникнути повторів',
        },
        cochonnet: {
          term: 'Кошонет',
          short: 'Маленька цільова куля, до якої кидають гравці',
        },
      },

      swissSystem: {
        title: 'Швейцарська система',
        subtitle: 'Основний формат для турнірів з петанку',
        intro:
          'Команди грають обмежену кількість раундів з розумною жеребкуванням. НЕ круговий турнір — ви граєте лише частину суперників.',
        rules: {
          title: 'Основні правила',
          noRematch: 'Команда НІКОЛИ не грає з тим самим суперником двічі',
          equalWins: 'Після 1-го раунду команди з однаковою кількістю перемог грають між собою',
          pairing: 'В межах групи перемог: перший проти останнього за рейтингом',
          odd: 'Непарна кількість команд = технічна перемога для найслабшої команди без паузи',
        },
        maxRounds: {
          title: 'Максимум раундів',
          explanation:
            'Кожен раунд виключає одного можливого майбутнього суперника. Після ~N/2 раундів алгоритм не може знайти валідні пари.',
          teams: 'Команди',
          rounds: 'Макс. раундів',
        },
        firstRound: {
          title: 'Жеребкування першого раунду',
          noRating: 'Без рейтингу: повністю випадково',
          withRating: 'З рейтингом: сіяні (ранг 1 проти N/2+1 і т.д.)',
        },
        subsequentRounds: {
          title: 'Наступні раунди',
          step1: 'Сортування команд за рейтингом',
          step2: 'Групування за кількістю перемог',
          step3: 'В межах групи: перший з останнім',
          step4: 'Якщо невалідно (вже грали): спроба наступного',
          step5: 'Якщо немає валідного: алгоритм бектрекінгу',
          step6: 'Якщо все вичерпано: помилка жеребкування',
        },
        bye: {
          title: 'Технічна перемога (пауза)',
          text: 'При непарній кількості: найслабша команда отримує технічну перемогу (рахунок 13:7). Команда може отримати лише одну паузу за турнір.',
        },
        calculator: {
          title: 'Калькулятор швейцарки',
          description: 'Розрахуйте оптимальну кількість раундів',
          teamsLabel: 'Кількість команд',
          result: 'Рекомендовано раундів: {rounds} (макс: {max})',
        },
      },

      groupsSystem: {
        title: 'Групи (круговий турнір)',
        subtitle: 'Повний круговий турнір в групах',
        intro: 'Команди поділяються на групи. В кожній групі всі грають з усіма.',
        formation: {
          title: 'Формування груп',
          withRating: 'З рейтингом: розподіл зміїкою (1,4,5,8 в групу A; 2,3,6,7 в групу B) — збалансовані групи',
          noRating: 'Без рейтингу: випадковий розподіл',
          special: 'Спеціальна схема для <33 команд з використанням сітки',
        },
        scheduling: {
          title: 'Розклад',
          text: 'Метод кола: позиція 0 фіксована, інші ротують. N команд = N-1 раунд.',
        },
        ranking: {
          title: 'Рейтинг у групі',
          criteria: 'перемоги > прямі перемоги > прямі очки > різниця очок',
          headToHead: 'При рівній кількості перемог враховуються лише особисті зустрічі між командами.',
        },
        after: {
          title: 'Після груп',
          text: 'Найкращі N команд з кожної групи виходять в Плей-оф або Кадраж.',
        },
      },

      barrageSystem: {
        title: 'Бараж (Poules de Barrage)',
        subtitle: 'Кваліфікаційний круговий формат',
        intro: 'Може використовуватись як окрема система або як етап у швейцарському турнірі.',
        standalone: {
          title: 'Окрема система (Пулі)',
          text: 'Команди розподіляються в групи, грають повний круг. Кращі з кожної групи виходять в Плей-оф.',
        },
        withinSwiss: {
          title: 'В рамках Швейцарки',
          step1: 'Після завершення раундів швейцарки організатор запускає бараж',
          step2: 'Команди розподіляються в малі групи (3-4 команди)',
          step3: 'Повний круговий турнір в кожній групі',
          step4: 'Кращі N з кожної групи виходять в плей-оф',
        },
        qualification: {
          title: 'Кваліфікація',
          text: 'Команді потрібно 2+ перемоги в групі баражу для кваліфікації в плей-оф.',
        },
        ranking: {
          title: 'Рейтинг',
          text: 'Враховуються лише результати баражу — швейцарка використовується тільки для посіву.',
        },
      },

      supermeleSystem: {
        title: 'Супермеле',
        subtitle: 'Розважальний формат зі змінними командами',
        intro: 'Гравці реєструються індивідуально. Команди формуються КОЖЕН раунд — чудовий соціальний формат.',
        modes: {
          title: 'Режими',
          ideal: 'Ідеальний (за замовчуванням)',
          idealDesc:
            'Збалансоване формування команд — найсильніший гравець з найслабшим. Вирівнює силу команд щоб ігри були конкурентними.',
          idealRound1: 'Раунд 1: рандом (або за рейтингом якщо увімкнено)',
          idealRound2: 'Раунд 2+: сортування за перемогами та різницею очок, парування верх з низом',
          standard: 'Стандартний',
          standardDesc: 'Повний рандом кожен раунд. Єдина умова — одні й ті ж гравці не грають разом двічі.',
        },
        howItWorks: {
          title: 'Як працює жеребкування',
          individual: 'Гравці — індивідуальні учасники (не фіксовані команди)',
          doublesPreferred: 'Дублети: всі дублети за замовчуванням. Непарна кількість — додається триплет або технічна',
          triplesPreferred: 'Триплети: всі триплети. Залишок гравців формує дублети',
          avoidRepeat: 'Відстеження партнерів — одна й та ж пара ніколи не грає разом двічі',
        },
        avoidTechnical: {
          title: 'Уникнення технічної перемоги',
          text: "Коли увімкнено (за замовчуванням) — додаток розбиває або об'єднує команди замість технічної:",
          tetATet: 'Непарна кількість дублетів → останній дублет розбивається на 1v1 (тет-а-тет)',
          joinTriple: 'Непарна кількість гравців → зайвий гравець приєднується до команди як триплет',
          triplesConvert: 'Режим триплетів → конвертація триплетів в дублети для парної кількості команд',
          example: 'Приклад: 10 гравців → 5 дублетів (непарно) → 2 матчі + 1 тет-а-тет',
        },
        ranking: {
          title: 'Рейтинг та очки',
          text: 'Індивідуальна статистика накопичується по всіх раундах:',
          criteria: '1) Перемоги → 2) Різниця очок → 3) Забиті очки → 4) Рейтинг',
          noBuchholz: 'Без Бухгольца — безглуздо коли команди змінюються кожен раунд.',
          pointsTitle: 'Як рахуються очки:',
          win: 'Якщо ваша команда виграла — ви отримуєте +1 перемогу',
          pointsPlus: 'Рахунок вашої команди додається до Очки+',
          pointsMinus: 'Рахунок суперника додається до Очки−',
        },
      },

      tirSystem: {
        title: 'TIR (Tir de Précision)',
        subtitle: 'Індивідуальний турнір на точність',
        intro: 'Гравці змагаються на 5 ательє (вправах) на різних дистанціях.',
        structure: {
          title: 'Структура',
          ateliers: '5 ательє (вправ)',
          distances: 'Дистанції: 6м, 7м, 8м, 9м (дорослі) або 6м, 7м, 8м (юніори)',
          maxSenior: 'Максимум: 100 балів (дорослі)',
          maxJunior: 'Максимум: 75 балів (юніори)',
        },
        scoring: {
          title: 'Підрахунок',
          carreau: 'Карро — 5 балів (ідеальний кидок з заміщенням)',
          reussi: 'Реюсі — 3 бали (залишилась в зоні)',
          touche: 'Туше — 1 бал (дотик)',
          manque: 'Манке — 0 балів (промах)',
        },
        modes: {
          title: 'Режими підрахунку',
          byParticipant: 'За учасником: обрати гравця, заповнити всі 5 ательє',
          byAtelier: 'За ательє: обрати вправу, заповнити для всіх гравців',
        },
        rounds: {
          title: '2-раундова кваліфікація',
          text: "Необов'язковий режим: 1-й раунд для всіх, топ 4 напряму в чвертьфінал. Місця 5-16 грають 2-й раунд. Кращі 4 з R2 (за сумою) приєднуються до 4 прямих кваліфікантів. 8 гравців в плей-оф.",
        },
        ranking: {
          title: 'Рейтинг',
          text: 'Загальний рахунок > кількість карро (тай-брейк). Чиста точність.',
        },
      },

      playoffSystem: {
        title: 'Плей-оф (на виліт)',
        subtitle: 'Формат сітки на виліт',
        intro:
          'Два формати: Одинарне вибування (одна поразка = вибув) та Подвійне вибування (дві поразки для вибування).',
        formatChoice: {
          title: 'Вибір формату',
          single: 'Одинарне вибування — класичний нокаут, підтримує 4-64 команди',
          double: 'Подвійне вибування — кожен має другий шанс, будь-яка кількість від 2+',
        },
        seeding: {
          title: 'Посів',
          text: 'Стандартна сітка: сіяні 1 і 2 зустрічаються лише у фіналі. Топ-сіяні уникають одне одного якомога довше.',
        },
        bracket: {
          title: 'Сітка (8 команд)',
          text: '1 проти 8, 4 проти 5, 3 проти 6, 2 проти 7 — ранги 1 і 2 зустрічаються останніми.',
        },
        thirdPlace: {
          title: 'Матч за 3-тє місце',
          text: "Необов'язкова гра між програвшими півфіналу (тільки одинарне вибування).",
        },
        doubleElim: {
          title: 'Подвійне вибування',
          text: 'Всі починають у верхній сітці. Перша поразка — падіння в нижню. Друга — вибування.',
          crossing: 'Програвші падають на протилежний бік нижньої сітки — уникає негайного реваншу.',
          grandFinal: 'Переможець верхньої сітки грає з переможцем нижньої в одному вирішальному Гранд-Фіналі.',
          sizes: 'Будь-яка кількість від 2+ учасників. Неповні сітки доповнюються byes за посівом.',
        },
        finalRanking: {
          title: 'Фінальний рейтинг',
          first: 'Переможець фіналу = 1 місце',
          second: 'Програвший фіналу = 2 місце',
          third: 'Переможець за 3-тє = 3 місце (одинарне) / за раундом вибування (подвійне)',
          fourth: 'Програвший за 3-тє = 4 місце',
          rest: 'Програвші чвертьфіналу = 5-8 місця (за рейтингом Швейцарки)',
          doubleNote: 'У подвійному: ранг визначається раундом вибування з нижньої сітки (пізніше = вище)',
        },
      },

      cadrageSystem: {
        title: 'Кадраж (додатковий раунд)',
        subtitle: 'Кваліфікаційний раунд для команд на межі',
        intro: 'Від фр. "cadrer" = обрамити. Заповнює розрив коли команд більше ніж потрібно для сітки.',
        example: {
          title: 'Приклад: 50 команд, топ-16 плей-оф',
          direct: 'Місця 1-8: Напряму в сітку',
          cadrage: 'Місця 9-24: Грають кадраж (16 команд → 8 ігор → 8 переможців)',
          eliminated: 'Місця 25-50: Турнір закінчено',
        },
        pairing: {
          title: 'Жеребкування',
          text: 'Кращий з граничних проти гіршого: ранг 9 проти 24, ранг 10 проти 23 і т.д.',
        },
        math: {
          title: 'Математика',
          directSeeds: 'Прямий посів: топ T/2 команд пропускають кадраж',
          pool: 'Пул кадражу: команди з рангом T/2+1 по T×1.5',
          winners: 'Кадраж дає T/2 переможців для заповнення сітки',
        },
      },

      swissPlayoff: {
        title: 'Швейцарка + Плей-оф',
        subtitle: 'Найпоширеніший змагальний формат',
        intro: 'Швейцарські раунди визначають посів, потім кращі грають на виліт.',
        flow: {
          title: 'Послідовність',
          step1: 'Швейцарські раунди (4-7 залежно від кількості команд)',
          step2: 'Організатор запускає Плей-оф — топ N команд у сітку',
          step3: 'Плей-оф на виліт визначає фінальний рейтинг',
        },
        options: {
          title: 'Опції',
          cadrage: 'Додати Кадраж між Швейцаркою та Плей-оф',
          tournamentB: 'Турнір Б для команд що не пройшли',
        },
      },

      swissBarragePlayoff: {
        title: 'Швейцарка + Бараж + Плей-оф',
        subtitle: 'Розширений формат з круговою кваліфікацією',
        intro: 'Максимальна точність визначення кваліфікантів для великих турнірів (30+ команд).',
        flow: {
          title: 'Послідовність',
          step1: 'Швейцарські раунди визначають початковий рейтинг',
          step2: 'Бараж — команди грають круговий в малих групах',
          step3: 'Переможці груп виходять в Плей-оф',
        },
        whenToUse: {
          title: 'Коли використовувати',
          text: 'Великі турніри де потрібна максимальна точність. Бараж виключає випадкові результати Швейцарки.',
        },
      },

      tournamentB: {
        title: 'Турнір Б',
        subtitle: 'Додатковий турнір для вибулих',
        intro: 'Коли починається плей-оф, решта команд може продовжити в новому турнірі.',
        howItWorks: {
          title: 'Як це працює',
          step1: 'Організатор вмикає Турнір Б перед запуском плей-оф',
          step2: 'Команди що не пройшли копіюються в новий турнір',
          step3: 'Статистика обнуляється — новий незалежний швейцарський турнір',
          step4: 'Обидва турніри працюють одночасно',
        },
      },

      rankingAlgorithms: {
        title: 'Алгоритми рейтингу',
        subtitle: 'Як сортуються команди в кожній системі',
        swiss: {
          title: 'Рейтинг Швейцарки',
          criteria: 'перемоги > Бухгольц > малий Бухгольц > різниця очок > забиті очки > рейтинг',
        },
        groups: {
          title: 'Рейтинг Груп',
          criteria: 'перемоги > прямі перемоги > прямі очки > різниця очок',
          note: 'Особисті зустрічі тільки між командами з однаковими перемогами',
        },
        supermele: {
          title: 'Рейтинг Супермеле',
          criteria: 'перемоги > різниця очок > забиті очки > рейтинг',
          note: 'Без Бухгольца (команди змінюються)',
        },
        barrage: {
          title: 'Рейтинг Баражу',
          criteria: 'перемоги > різниця очок',
          note: 'Тільки результати баражу',
        },
        tir: {
          title: 'Рейтинг TIR',
          criteria: 'загальний рахунок > кількість карро',
          note: 'Чиста точність',
        },
        buchholz: {
          title: 'Що таке Бухгольц?',
          text: 'Сума перемог усіх суперників. Нагороджує команди що грали з сильнішими. Малий Бухгольц (SBuh) — те саме, але без найслабшого суперника.',
        },
        lanes: {
          title: 'Розподіл доріжок',
          text: 'В усіх системах доріжки мінімізують повтори через матрицю ваг. Нові доріжки (ніколи не грали) завжди пріоритетні.',
        },
      },

      faqSection: {
        title: 'Часті запитання',
        items: {
          q1: 'Скільки раундів грати в Швейцарці?',
          a1: 'Приблизно половина від кількості команд. Додаток обмежує Math.round(N/2). Для 16 команд — 5-7 раундів для балансу справедливості та часу.',
          q2: 'Що відбувається з непарною кількістю команд?',
          a2: 'Найслабша команда без паузи отримує Технічну перемогу (13:7). Кожна команда може отримати лише одну паузу за турнір.',
          q3: 'Чи можна редагувати результати попереднього раунду?',
          a3: 'Так! В Групах використовуйте іконку олівця. Вся статистика перерахується автоматично.',
          q4: 'Яка різниця між Баражем і Групами?',
          a4: 'Той самий круговий формат, але Бараж — короткий кваліфікаційний етап (3-4 команди) між Швейцаркою та Плей-оф. Групи — окрема система.',
          q5: 'Як калькулятор визначає рекомендовану кількість раундів?',
          a5: 'Для Швейцарки: приблизно log₂(команд) для конкурентних результатів, максимум N/2. Більше раундів = точніший рейтинг, але більше часу.',
          q6: 'Чи можна запустити TIR і Швейцарку одночасно?',
          a6: 'Так, можна мати до 10 активних турнірів включно з TIR. Перемикайтесь між ними в бічному меню.',
          q7: 'Що робити якщо жеребкування не вдалось?',
          a7: 'Це означає що не існує валідних пар (забагато зіграних раундів). Ви досягли математичної межі — запускайте плей-оф або завершіть турнір.',
          q8: 'Як працює посів в Плей-оф?',
          a8: 'Стандартна сітка: 1-й сіяний зустрічає 2-го лише у фіналі. Топ-сіяні розведені якомога далі для чесної конкуренції.',
        },
      },
    },
  },
  fr: {
    docs: {
      title: 'Documentation',
      search: 'Rechercher...',
      backToTop: 'Retour en haut',
      overview: 'Aperçu',
      quickRef: 'Référence rapide',
      systems: 'Systèmes de tournoi',
      formats: 'Formats combinés',
      rankings: 'Classements',
      guide: 'Guide',
      faq: 'FAQ',

      glossary: {
        title: 'Glossaire des termes de tournoi',
        swiss: {
          term: 'Système suisse',
          short: 'Appariement intelligent — adversaires de même niveau, sans revanche',
        },
        barrage: { term: 'Barrage', short: 'Qualification en poules avant le playoff' },
        cadrage: { term: 'Cadrage', short: 'Tour de barrage pour les équipes en limite de qualification' },
        playoff: {
          term: 'Playoff',
          short: 'Tableau éliminatoire — simple (une défaite = éliminé) ou double élimination (deux défaites)',
        },
        tir: { term: 'TIR (Tir de Précision)', short: 'Tir de précision individuel sur 5 ateliers' },
        supermele: { term: 'Supermêlée', short: 'Format social — équipes mélangées à chaque tour' },
        buchholz: { term: 'Buchholz', short: 'Départage : somme des victoires de tous les adversaires' },
        technical: { term: 'Technique (Bye)', short: "Victoire par forfait pour l'équipe impaire (13:7)" },
        carreau: { term: 'Carreau', short: 'TIR : tir parfait — la boule remplace la cible (5 pts)' },
        reussi: { term: 'Réussi', short: 'TIR : tir réussi — boule restée dans la zone (3 pts)' },
        touche: { term: 'Touché', short: 'TIR : touché la cible sans rester (1 pt)' },
        manque: { term: 'Manqué', short: 'TIR : raté (0 pts)' },
        lane: { term: 'Terrain', short: "Aire de jeu. L'app minimise les répétitions" },
        cochonnet: { term: 'Cochonnet', short: 'La petite balle cible (but) vers laquelle on lance' },
      },

      swissSystem: {
        title: 'Système suisse',
        subtitle: 'Le format principal pour les tournois de pétanque',
        intro: 'Les équipes jouent un nombre limité de tours avec un appariement intelligent.',
        rules: {
          title: 'Règles',
          noRematch: 'Une équipe ne joue JAMAIS deux fois le même adversaire',
          equalWins: 'Après le 1er tour, les équipes avec le même nombre de victoires se rencontrent',
          pairing: 'Dans chaque groupe : premier contre dernier',
          odd: 'Nombre impair = Technique pour la plus faible sans bye',
        },
        maxRounds: {
          title: 'Tours maximum',
          explanation:
            "Chaque tour élimine un adversaire possible. Après ~N/2 tours l'algorithme ne trouve plus de paires.",
          teams: 'Équipes',
          rounds: 'Tours max',
        },
        firstRound: {
          title: 'Premier tour',
          noRating: 'Sans classement : aléatoire',
          withRating: 'Avec classement : têtes de série',
        },
        subsequentRounds: {
          title: 'Tours suivants',
          step1: 'Trier par classement',
          step2: 'Grouper par victoires',
          step3: 'Premier vs dernier',
          step4: 'Si invalide : essayer suivant',
          step5: 'Si aucun : algorithme de retour arrière',
          step6: 'Si épuisé : erreur',
        },
        bye: {
          title: 'Technique (Bye)',
          text: "Nombre impair : l'équipe la plus faible reçoit un forfait (13:7). Maximum un bye par tournoi.",
        },
        calculator: {
          title: 'Calculateur suisse',
          description: 'Calculez le nombre optimal de tours',
          teamsLabel: "Nombre d'équipes",
          result: 'Tours recommandés : {rounds} (max : {max})',
        },
      },

      groupsSystem: {
        title: 'Poules (Round-Robin)',
        subtitle: 'Tous contre tous dans chaque groupe',
        intro: 'Les équipes sont réparties en groupes. Chacun joue contre chacun.',
        formation: {
          title: 'Formation',
          withRating: 'Avec classement : distribution serpentin',
          noRating: 'Sans classement : aléatoire',
          special: 'Schéma spécial pour <33 équipes',
        },
        scheduling: { title: 'Calendrier', text: 'Méthode du cercle : position 0 fixe, les autres tournent.' },
        ranking: {
          title: 'Classement',
          criteria: 'victoires > confrontations directes > points directs > différence',
          headToHead: "En cas d'égalité, seuls les résultats directs comptent.",
        },
        after: { title: 'Après les poules', text: 'Les meilleures équipes avancent en Playoff ou Cadrage.' },
      },

      barrageSystem: {
        title: 'Barrage (Poules de Barrage)',
        subtitle: 'Format de qualification en poules',
        intro: 'Utilisable seul ou comme phase dans un tournoi suisse.',
        standalone: {
          title: 'Système autonome',
          text: 'Équipes en groupes, round-robin complet. Les meilleurs avancent.',
        },
        withinSwiss: {
          title: 'Dans le suisse',
          step1: "Après les tours suisses, l'organisateur lance le barrage",
          step2: 'Équipes distribuées en petits groupes (3-4)',
          step3: 'Round-robin dans chaque groupe',
          step4: 'Top N par groupe avance',
        },
        qualification: { title: 'Qualification', text: '2+ victoires dans le groupe pour se qualifier.' },
        ranking: { title: 'Classement', text: 'Seuls les résultats du barrage comptent.' },
      },

      supermeleSystem: {
        title: 'Supermêlée',
        subtitle: 'Format social avec équipes changeantes',
        intro: "Les joueurs s'inscrivent individuellement. Équipes reformées à chaque tour — un format social idéal.",
        modes: {
          title: 'Modes',
          ideal: 'Idéal (par défaut)',
          idealDesc: 'Formation équilibrée — le plus fort avec le plus faible. Égalise la force des équipes.',
          idealRound1: 'Tour 1 : aléatoire (ou par classement si activé)',
          idealRound2: 'Tour 2+ : tri par victoires puis différence, appariement haut avec bas',
          standard: 'Standard',
          standardDesc: 'Aléatoire total à chaque tour. Seule contrainte : pas de paire identique deux fois.',
        },
        howItWorks: {
          title: 'Comment fonctionne le tirage',
          individual: "Joueurs individuels (pas d'équipes fixes)",
          doublesPreferred: 'Doublettes : toutes doublettes par défaut. Nombre impair → triplette ou technique',
          triplesPreferred: 'Triplettes : toutes triplettes. Le reste forme des doublettes',
          avoidRepeat: 'Suivi des partenaires — même paire ne joue jamais ensemble deux fois',
        },
        avoidTechnical: {
          title: 'Éviter la victoire technique',
          text: "Quand activé (par défaut) — divise ou regroupe les équipes au lieu d'une technique :",
          tetATet: 'Nombre impair de doublettes → dernière doublette en 1v1 (tête-à-tête)',
          joinTriple: 'Nombre impair de joueurs → joueur restant rejoint une équipe en triplette',
          triplesConvert: "Mode triplettes → conversion en doublettes pour nombre pair d'équipes",
          example: 'Ex : 10 joueurs → 5 doublettes (impair) → 2 matchs + 1 tête-à-tête',
        },
        ranking: {
          title: 'Classement et points',
          text: 'Statistiques individuelles cumulées sur tous les tours :',
          criteria: '1) Victoires → 2) Différence → 3) Points marqués → 4) Rating',
          noBuchholz: 'Pas de Buchholz — sans intérêt quand les équipes changent.',
          pointsTitle: 'Comptage des points :',
          win: 'Votre équipe gagne → vous obtenez +1 victoire',
          pointsPlus: 'Score de votre équipe ajouté à vos Points+',
          pointsMinus: 'Score adverse ajouté à vos Points−',
        },
      },

      tirSystem: {
        title: 'TIR (Tir de Précision)',
        subtitle: 'Tournoi individuel de précision',
        intro: 'Les joueurs concourent sur 5 ateliers à différentes distances.',
        structure: {
          title: 'Structure',
          ateliers: '5 ateliers',
          distances: '6m, 7m, 8m, 9m (seniors) ou 6m, 7m, 8m (juniors)',
          maxSenior: 'Max : 100 pts (senior)',
          maxJunior: 'Max : 75 pts (junior)',
        },
        scoring: {
          title: 'Pointage',
          carreau: 'Carreau — 5 pts',
          reussi: 'Réussi — 3 pts',
          touche: 'Touché — 1 pt',
          manque: 'Manqué — 0 pts',
        },
        modes: { title: 'Modes', byParticipant: 'Par participant', byAtelier: 'Par atelier' },
        rounds: {
          title: 'Qualification 2 tours',
          text: 'Tour 1 pour tous, top 4 directement en quarts. Places 5-16 jouent tour 2. Top 4 du T2 rejoint les 4 directs.',
        },
        ranking: { title: 'Classement', text: 'Score total > nombre de carreaux.' },
      },

      playoffSystem: {
        title: 'Playoff',
        subtitle: 'Tableau à élimination',
        intro:
          'Deux formats : Simple élimination (une défaite = éliminé) et Double élimination (deux défaites pour être éliminé).',
        formatChoice: {
          title: 'Choix du format',
          single: 'Simple élimination — knockout classique, 4-64 équipes',
          double: "Double élimination — chacun a une seconde chance, n'importe quel nombre à partir de 2",
        },
        seeding: {
          title: 'Têtes de série',
          text: 'Tableau standard : 1 et 2 se rencontrent en finale uniquement.',
        },
        bracket: {
          title: 'Tableau (8 équipes)',
          text: '1v8, 4v5, 3v6, 2v7 — les meilleurs se rencontrent le plus tard.',
        },
        thirdPlace: {
          title: 'Petite finale',
          text: 'Match optionnel entre les perdants des demi-finales (simple élimination uniquement).',
        },
        doubleElim: {
          title: 'Double élimination',
          text: 'Tous commencent dans le tableau des vainqueurs. Une défaite envoie dans le tableau des perdants. Deux défaites = éliminé.',
          crossing: 'Les perdants tombent du côté opposé du tableau inférieur — évite la revanche immédiate.',
          grandFinal:
            'Le champion du tableau des vainqueurs affronte celui des perdants en une Grande Finale décisive.',
          sizes:
            "N'importe quel nombre à partir de 2. Les tableaux incomplets sont complétés par des exemptions (byes).",
        },
        finalRanking: {
          title: 'Classement final',
          first: 'Vainqueur = 1er',
          second: 'Finaliste = 2e',
          third: "Vainqueur petite finale = 3e (simple) / par tour d'élimination (double)",
          fourth: 'Perdant petite finale = 4e',
          rest: 'Quart-finalistes = 5e-8e',
          doubleNote:
            "En double élimination : classé par le tour d'élimination du tableau des perdants (plus tard = mieux classé)",
        },
      },

      cadrageSystem: {
        title: 'Cadrage (Tour préliminaire)',
        subtitle: 'Élimination qualificative',
        intro: "Comble l'écart quand plus d'équipes que de places dans le tableau.",
        example: {
          title: 'Exemple : 50 équipes, top-16',
          direct: 'Places 1-8 : directement qualifiées',
          cadrage: 'Places 9-24 : jouent le cadrage',
          eliminated: 'Places 25-50 : éliminées',
        },
        pairing: { title: 'Appariement', text: 'Meilleur vs pire : rang 9 vs 24, rang 10 vs 23, etc.' },
        math: {
          title: 'Calcul',
          directSeeds: 'Qualifiés directs : top T/2',
          pool: 'Pool cadrage : rangs T/2+1 à T×1.5',
          winners: 'T/2 vainqueurs remplissent le tableau',
        },
      },

      swissPlayoff: {
        title: 'Suisse + Playoff',
        subtitle: 'Le format compétitif le plus courant',
        intro: 'Les tours suisses déterminent le classement, puis élimination directe.',
        flow: {
          title: 'Déroulement',
          step1: 'Tours suisses (4-7)',
          step2: 'Lancement du Playoff',
          step3: 'Élimination directe',
        },
        options: {
          title: 'Options',
          cadrage: 'Ajouter un Cadrage',
          tournamentB: 'Tournoi B pour les éliminés',
        },
      },

      swissBarragePlayoff: {
        title: 'Suisse + Barrage + Playoff',
        subtitle: 'Format étendu avec qualification en poules',
        intro: 'Précision maximale pour les grands tournois (30+ équipes).',
        flow: {
          title: 'Déroulement',
          step1: 'Tours suisses',
          step2: 'Barrage en petits groupes',
          step3: 'Vainqueurs en Playoff',
        },
        whenToUse: { title: 'Quand utiliser', text: 'Grands tournois nécessitant une précision maximale.' },
      },

      tournamentB: {
        title: 'Tournoi B',
        subtitle: 'Tournoi compagnon pour les éliminés',
        intro: 'Les équipes non qualifiées continuent dans un nouveau tournoi suisse.',
        howItWorks: {
          title: 'Fonctionnement',
          step1: 'Activer avant le playoff',
          step2: 'Équipes non qualifiées copiées',
          step3: 'Stats remises à zéro',
          step4: 'Les deux tournois en parallèle',
        },
      },

      rankingAlgorithms: {
        title: 'Algorithmes de classement',
        subtitle: 'Comment les équipes sont triées',
        swiss: {
          title: 'Suisse',
          criteria: 'victoires > Buchholz > petit Buchholz > différence > points > rating',
        },
        groups: {
          title: 'Poules',
          criteria: 'victoires > victoires directes > points directs > différence',
          note: 'Confrontations directes uniquement',
        },
        supermele: {
          title: 'Supermêlée',
          criteria: 'victoires > différence > points > rating',
          note: 'Pas de Buchholz',
        },
        barrage: {
          title: 'Barrage',
          criteria: 'victoires > différence',
          note: 'Résultats du barrage uniquement',
        },
        tir: { title: 'TIR', criteria: 'score total > carreaux', note: 'Précision pure' },
        buchholz: {
          title: "Qu'est-ce que le Buchholz ?",
          text: 'Somme des victoires de tous vos adversaires. Récompense les équipes ayant affronté des adversaires forts.',
        },
        lanes: {
          title: 'Attribution des terrains',
          text: 'Minimise les répétitions via une matrice de poids.',
        },
      },

      faqSection: {
        title: 'Questions fréquentes',
        items: {
          q1: 'Combien de tours en suisse ?',
          a1: "Environ la moitié du nombre d'équipes. Maximum N/2. Pour 16 : 5-7 tours.",
          q2: "Nombre impair d'équipes ?",
          a2: 'La plus faible reçoit un bye (13:7). Maximum un par tournoi.',
          q3: "Modifier les résultats d'un tour précédent ?",
          a3: "Oui ! Icône crayon dans l'onglet Résultats. Tout est recalculé.",
          q4: 'Différence Barrage / Poules ?',
          a4: 'Même format, mais le barrage est une phase courte entre suisse et playoff.',
          q5: 'Comment le calculateur fonctionne ?',
          a5: '~log₂(équipes) recommandé, maximum N/2.',
          q6: 'TIR et Suisse simultanément ?',
          a6: "Oui, jusqu'à 10 tournois actifs.",
          q7: 'Tirage échoué ?',
          a7: 'Limite mathématique atteinte. Lancez le playoff.',
          q8: 'Comment marche le seeding ?',
          a8: 'Tableau standard : #1 et #2 se rencontrent en finale uniquement.',
        },
      },
    },
  },
  es: {
    docs: {
      title: 'Documentación',
      search: 'Buscar...',
      backToTop: 'Volver arriba',
      overview: 'Resumen',
      quickRef: 'Referencia rápida',
      systems: 'Sistemas de torneo',
      formats: 'Formatos combinados',
      rankings: 'Rankings y puntuación',
      guide: 'Guía',
      faq: 'FAQ',

      glossary: {
        title: 'Glosario de términos de torneo',
        swiss: {
          term: 'Sistema suizo',
          short: 'Emparejamiento inteligente — rivales del mismo nivel, sin repeticiones',
        },
        barrage: { term: 'Barrage', short: 'Clasificación en grupos antes del playoff' },
        cadrage: { term: 'Cadrage', short: 'Ronda de repechaje para equipos en el límite' },
        playoff: { term: 'Playoff', short: 'Eliminación directa — una derrota y fuera' },
        tir: { term: 'TIR (Tir de Précision)', short: 'Tiro de precisión individual en 5 estaciones' },
        supermele: { term: 'Supermele', short: 'Formato social — equipos mezclados cada ronda' },
        buchholz: { term: 'Buchholz', short: 'Desempate: suma de victorias de todos los rivales' },
        technical: { term: 'Técnica (Bye)', short: 'Victoria por defecto para equipo impar (13:7)' },
        carreau: { term: 'Carreau', short: 'TIR: tiro perfecto (5 pts)' },
        reussi: { term: 'Réussi', short: 'TIR: tiro exitoso (3 pts)' },
        touche: { term: 'Touché', short: 'TIR: tocó el objetivo (1 pt)' },
        manque: { term: 'Manqué', short: 'TIR: falló (0 pts)' },
        lane: { term: 'Pista', short: 'Campo de juego. La app minimiza repeticiones' },
        cochonnet: { term: 'Cochonnet', short: 'La bola pequeña objetivo (boliche)' },
      },

      swissSystem: {
        title: 'Sistema suizo',
        subtitle: 'El formato principal para torneos de petanca',
        intro: 'Equipos juegan rondas limitadas con emparejamiento inteligente.',
        rules: {
          title: 'Reglas',
          noRematch: 'Un equipo NUNCA juega contra el mismo rival dos veces',
          equalWins: 'Tras la ronda 1, equipos con mismas victorias se enfrentan',
          pairing: 'Dentro del grupo: primero contra último',
          odd: 'Número impar = Técnica para el más débil sin bye',
        },
        maxRounds: {
          title: 'Rondas máximas',
          explanation: 'Cada ronda elimina un rival posible. Tras ~N/2 rondas no hay pares válidos.',
          teams: 'Equipos',
          rounds: 'Rondas máx',
        },
        firstRound: {
          title: 'Primera ronda',
          noRating: 'Sin rating: aleatorio',
          withRating: 'Con rating: cabezas de serie',
        },
        subsequentRounds: {
          title: 'Rondas siguientes',
          step1: 'Ordenar por ranking',
          step2: 'Agrupar por victorias',
          step3: 'Primero vs último',
          step4: 'Si inválido: siguiente',
          step5: 'Si ninguno: backtracking',
          step6: 'Si agotado: error',
        },
        bye: {
          title: 'Técnica (Bye)',
          text: 'Número impar: el más débil recibe forfait (13:7). Máximo uno por torneo.',
        },
        calculator: {
          title: 'Calculadora suiza',
          description: 'Calcula el número óptimo de rondas',
          teamsLabel: 'Número de equipos',
          result: 'Rondas recomendadas: {rounds} (máx: {max})',
        },
      },

      groupsSystem: {
        title: 'Grupos (Round-Robin)',
        subtitle: 'Todos contra todos en cada grupo',
        intro: 'Equipos divididos en grupos. Todos juegan contra todos.',
        formation: {
          title: 'Formación',
          withRating: 'Con rating: distribución serpiente',
          noRating: 'Sin rating: aleatorio',
          special: 'Esquema especial para <33 equipos',
        },
        scheduling: { title: 'Calendario', text: 'Método circular: posición 0 fija, las demás rotan.' },
        ranking: {
          title: 'Clasificación',
          criteria: 'victorias > directas > puntos directos > diferencia',
          headToHead: 'En empate, solo cuentan los enfrentamientos directos.',
        },
        after: { title: 'Después', text: 'Los mejores avanzan a Playoff o Cadrage.' },
      },

      barrageSystem: {
        title: 'Barrage',
        subtitle: 'Formato de clasificación en grupos',
        intro: 'Puede usarse solo o como fase del suizo.',
        standalone: { title: 'Autónomo', text: 'Equipos en grupos, round-robin completo.' },
        withinSwiss: {
          title: 'Dentro del suizo',
          step1: 'Tras las rondas suizas, se lanza el barrage',
          step2: 'Equipos en grupos pequeños (3-4)',
          step3: 'Round-robin en cada grupo',
          step4: 'Top N por grupo avanza',
        },
        qualification: { title: 'Clasificación', text: '2+ victorias para clasificarse.' },
        ranking: { title: 'Ranking', text: 'Solo resultados del barrage cuentan.' },
      },

      supermeleSystem: {
        title: 'Supermele',
        subtitle: 'Formato social con equipos cambiantes',
        intro: 'Jugadores individuales. Equipos reformados cada ronda — un gran formato social.',
        modes: {
          title: 'Modos',
          ideal: 'Ideal (por defecto)',
          idealDesc: 'Formación equilibrada — el más fuerte con el más débil. Iguala la fuerza de equipos.',
          idealRound1: 'Ronda 1: aleatorio (o por rating si está activado)',
          idealRound2: 'Ronda 2+: ordenados por victorias y diferencia, emparejados arriba con abajo',
          standard: 'Estándar',
          standardDesc: 'Aleatorio total cada ronda. Única restricción: no repetir la misma pareja.',
        },
        howItWorks: {
          title: 'Cómo funciona el sorteo',
          individual: 'Jugadores individuales (no equipos fijos)',
          doublesPreferred: 'Dobletes: todos dobletes por defecto. Número impar → triplete o técnica',
          triplesPreferred: 'Tripletes: todos tripletes. El resto forma dobletes',
          avoidRepeat: 'Seguimiento de compañeros — misma pareja nunca juega junta dos veces',
        },
        avoidTechnical: {
          title: 'Evitar victoria técnica',
          text: 'Cuando está activado (por defecto) — divide o une equipos en vez de dar técnica:',
          tetATet: 'Número impar de dobletes → último doblete se divide en 1v1 (tête-à-tête)',
          joinTriple: 'Número impar de jugadores → jugador sobrante se une como triplete',
          triplesConvert: 'Modo tripletes → convierte tripletes en dobletes para número par de equipos',
          example: 'Ej: 10 jugadores → 5 dobletes (impar) → 2 partidos + 1 tête-à-tête',
        },
        ranking: {
          title: 'Ranking y puntos',
          text: 'Estadísticas individuales acumuladas en todas las rondas:',
          criteria: '1) Victorias → 2) Diferencia → 3) Puntos marcados → 4) Rating',
          noBuchholz: 'Sin Buchholz — sin sentido cuando los equipos cambian.',
          pointsTitle: 'Cómo se cuentan los puntos:',
          win: 'Tu equipo gana → obtienes +1 victoria',
          pointsPlus: 'Marcador de tu equipo se suma a tus Puntos+',
          pointsMinus: 'Marcador rival se suma a tus Puntos−',
        },
      },

      tirSystem: {
        title: 'TIR (Tir de Précision)',
        subtitle: 'Torneo individual de precisión',
        intro: 'Jugadores compiten en 5 talleres a varias distancias.',
        structure: {
          title: 'Estructura',
          ateliers: '5 talleres',
          distances: '6m, 7m, 8m, 9m (seniors) o 6m, 7m, 8m (juniors)',
          maxSenior: 'Máx: 100 pts (senior)',
          maxJunior: 'Máx: 75 pts (junior)',
        },
        scoring: {
          title: 'Puntuación',
          carreau: 'Carreau — 5 pts',
          reussi: 'Réussi — 3 pts',
          touche: 'Touché — 1 pt',
          manque: 'Manqué — 0 pts',
        },
        modes: { title: 'Modos', byParticipant: 'Por participante', byAtelier: 'Por taller' },
        rounds: {
          title: 'Clasificación 2 rondas',
          text: 'Ronda 1 para todos, top 4 directo a cuartos. Puestos 5-16 juegan ronda 2.',
        },
        ranking: { title: 'Ranking', text: 'Puntuación total > carreaux.' },
      },

      playoffSystem: {
        title: 'Playoff (Eliminación directa)',
        subtitle: 'Cuadro eliminatorio',
        intro: 'Una derrota = eliminado. Soporta 4, 8, 16, 32, 64 equipos.',
        seeding: { title: 'Cabezas de serie', text: 'Cuadro estándar: #1 y #2 solo en la final.' },
        bracket: { title: 'Cuadro (8 equipos)', text: '1v8, 4v5, 3v6, 2v7.' },
        thirdPlace: { title: 'Tercer puesto', text: 'Partido opcional entre semifinalistas perdedores.' },
        finalRanking: {
          title: 'Clasificación final',
          first: 'Ganador = 1°',
          second: 'Finalista = 2°',
          third: 'Ganador 3° puesto = 3°',
          fourth: 'Perdedor 3° puesto = 4°',
          rest: 'Cuartofinalistas = 5°-8°',
        },
      },

      cadrageSystem: {
        title: 'Cadrage (Repechaje)',
        subtitle: 'Eliminatoria para equipos en el límite',
        intro: 'Cubre el hueco cuando hay más equipos que plazas.',
        example: {
          title: 'Ejemplo: 50 equipos, top-16',
          direct: 'Puestos 1-8: directos',
          cadrage: 'Puestos 9-24: juegan cadrage',
          eliminated: 'Puestos 25-50: eliminados',
        },
        pairing: { title: 'Emparejamiento', text: 'Mejor vs peor: puesto 9 vs 24, etc.' },
        math: {
          title: 'Cálculo',
          directSeeds: 'Directos: top T/2',
          pool: 'Pool: puestos T/2+1 a T×1.5',
          winners: 'T/2 ganadores al cuadro',
        },
      },

      swissPlayoff: {
        title: 'Suizo + Playoff',
        subtitle: 'El formato competitivo más común',
        intro: 'Rondas suizas + eliminación directa.',
        flow: {
          title: 'Flujo',
          step1: 'Rondas suizas (4-7)',
          step2: 'Lanzar Playoff',
          step3: 'Eliminación directa',
        },
        options: { title: 'Opciones', cadrage: 'Añadir Cadrage', tournamentB: 'Torneo B para eliminados' },
      },

      swissBarragePlayoff: {
        title: 'Suizo + Barrage + Playoff',
        subtitle: 'Formato extendido con clasificación en grupos',
        intro: 'Máxima precisión para torneos grandes (30+ equipos).',
        flow: {
          title: 'Flujo',
          step1: 'Rondas suizas',
          step2: 'Barrage en grupos',
          step3: 'Ganadores al Playoff',
        },
        whenToUse: { title: 'Cuándo usar', text: 'Torneos grandes que necesitan máxima precisión.' },
      },

      tournamentB: {
        title: 'Torneo B',
        subtitle: 'Torneo para eliminados',
        intro: 'Los no clasificados continúan en un nuevo torneo suizo.',
        howItWorks: {
          title: 'Cómo funciona',
          step1: 'Activar antes del playoff',
          step2: 'Equipos copiados',
          step3: 'Stats reseteadas',
          step4: 'Ambos torneos en paralelo',
        },
      },

      rankingAlgorithms: {
        title: 'Algoritmos de ranking',
        subtitle: 'Cómo se ordenan los equipos',
        swiss: {
          title: 'Suizo',
          criteria: 'victorias > Buchholz > pequeño Buchholz > diferencia > puntos > rating',
        },
        groups: {
          title: 'Grupos',
          criteria: 'victorias > directas > puntos directos > diferencia',
          note: 'Solo enfrentamientos directos',
        },
        supermele: {
          title: 'Supermele',
          criteria: 'victorias > diferencia > puntos > rating',
          note: 'Sin Buchholz',
        },
        barrage: { title: 'Barrage', criteria: 'victorias > diferencia', note: 'Solo resultados del barrage' },
        tir: { title: 'TIR', criteria: 'puntuación > carreaux', note: 'Precisión pura' },
        buchholz: {
          title: '¿Qué es Buchholz?',
          text: 'Suma de victorias de todos tus rivales. Premia enfrentar rivales fuertes.',
        },
        lanes: { title: 'Asignación de pistas', text: 'Minimiza repeticiones con matriz de pesos.' },
      },

      faqSection: {
        title: 'Preguntas frecuentes',
        items: {
          q1: '¿Cuántas rondas en suizo?',
          a1: '~Mitad del número de equipos. Máximo N/2. Para 16: 5-7 rondas.',
          q2: '¿Número impar de equipos?',
          a2: 'El más débil recibe bye (13:7). Máximo uno por torneo.',
          q3: '¿Editar resultados anteriores?',
          a3: 'Sí, icono lápiz. Todo se recalcula.',
          q4: '¿Diferencia Barrage / Grupos?',
          a4: 'Mismo formato, pero barrage es fase corta entre suizo y playoff.',
          q5: '¿Cómo funciona la calculadora?',
          a5: '~log₂(equipos), máximo N/2.',
          q6: '¿TIR y Suizo simultáneamente?',
          a6: 'Sí, hasta 10 torneos activos.',
          q7: '¿Sorteo fallido?',
          a7: 'Límite matemático. Lanza el playoff.',
          q8: '¿Cómo funciona el seeding?',
          a8: 'Cuadro estándar: #1 y #2 solo en la final.',
        },
      },
    },
  },
};
