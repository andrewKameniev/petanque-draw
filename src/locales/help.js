export default {
  en: {
    help: {
      tocTitle: 'Table of Contents',
      title: 'Tournament Drawing App for Petanque',
      description:
        "This app simplifies the lives of petanque players who organize tournaments, cheer for their favorite team, or participate in competitions. All you need for drawing is internet access. Players no longer need to gather around the organizer's table to find out their playing field, opponents, or their position in the standings. Now, they can simply follow a link on their phone to check everything online.",
      feature1: 'The app supports Swiss, round-robin, knockout systems, and supermelee.',
      feature2: 'Minimal settings — get started in seconds.',
      feature3: 'Clean, modern interface with dark theme support.',
      feature4: 'Real-time remote viewing of draws, results, and standings via a shared link or QR code.',
      feature5:
        "Precise drawing algorithm for the Swiss system. The app doesn't draw teams randomly. For example, if the top 6 teams have the same number of wins, in the next round they will play as follows: 1-6, 2-5, 3-4.",
      howToUseTitle: 'How to Use This App',
      howToUse1:
        'To use the app, you need to register an account. No personal data other than email is required (and even that remains private, not even visible to me, the developer).',
      howToUse2:
        'Users can use the app as administrators (available only for Ukrainian users). This allows importing players from the Ukrainian Federation portal. I can issue a password personally upon request.',
      shortTitle: 'Quick Start Guide',
      shortText: 'To conduct a standard Swiss system tournament + playoffs, you need to:',
      shortText1: 'Log in or register a new account.',
      shortText2: 'Add team names on the "Teams" tab.',
      shortText3: 'Configure tournament system (Swiss is default) and click "Draw first round".',
      shortText4: 'Enter the results and save them.',
      shortText5: 'Draw subsequent rounds as many as you wish to play.',
      shortText6: 'Go to the "Ranking" tab to check the standings (if interested).',
      shortText7: 'Enable "Play-off after Swiss rounds" in setup, configure the number of teams in Preferences.',
      shortText8: 'Enter all playoff results on the "Current Games" tab.',
      shortText9:
        'Once you input the final results, the tournament is completed. You can archive it in your account for history or remove it.',
      shortSummary: 'Continue reading for more details.',
      interfaceTitle: 'Main Interface',
      interfaceDescription:
        'After logging in and creating a tournament, you will see the main workspace. The interface is divided into a toolbar at the top (for sharing and messaging), a tournament setup card, and content tabs below.',
      interface1: 'Click on the tournament name to rename it at any time.',
      interface2: 'Select the tournament system: Swiss, Groups (Round-Robin), or Supermele.',
      interface3: 'Configure play-off and Tournament B options before starting.',
      interface4:
        'Add teams by entering their name and clicking "Add team". Admins can also import from the UFP portal.',
      interface5: 'Option to use team ratings for seeding in the first round draw.',
      interface6: '"Restore last teams" allows you to quickly re-add teams from a previous tournament.',
      tournamentControlsTitle: 'Tournament Controls',
      tournamentControls1:
        'The "Draw first round" button starts the tournament. Once started, teams cannot be added or removed (except in supermelee). The "Remove tournament" button permanently deletes the tournament.',
      tournamentControls2:
        'After the tournament is started, the "Finish tournament" button appears. Click it to manually end the tournament at any point. A tournament also finishes automatically when all playoff results are entered.',
      tournamentControls3:
        '"Restore last teams" is helpful if you\'ve started a tournament and realize you forgot a team. Create a new tournament and click this button to re-add all teams from the previous one.',
      mainTabs: 'Main Sections',
      mainTabs1: 'Teams: add or remove teams before drawing the first round (or anytime for supermelee).',
      mainTabs2: 'Current games: view current round matchups, enter scores, and draw subsequent rounds.',
      mainTabs3: 'Results: browse all completed games with round filters (R1, R2, R3, All).',
      mainTabs4: 'Ranking: standings table with sorting by wins, Buchholz, and points.',
      preferences: 'Preferences',
      preferencesIntro:
        'Access preferences via the "Preferences" button at the bottom of the page, or through "Additional settings" before starting the tournament.',
      preferences1: 'All settings are optional and have sensible defaults.',
      preferences2: 'Technical score: adjust the score awarded for walkovers (default 13:7).',
      preferences3: 'Maximum score: change the game-ending score (useful for club formats like 31-point games).',
      preferences4: 'Playoff teams and lane numbering can also be configured here.',
      drawResults: 'Draw and Results',
      drawResultsText:
        'The "Draw N Round" button generates opponents for each subsequent round. The app doesn\'t ask for the total number of rounds upfront. In the Swiss system, be cautious with small team counts and many rounds — at some point the algorithm won\'t be able to satisfy all pairing conditions. This could happen, for example, with 7 rounds and 12 teams or 5 rounds and 8 teams.',
      drawResults1:
        'Each game shows both teams, their assigned lane, and input fields for scores. Enter scores and click "Save results" to proceed.',
      drawResults2: 'The lane number is displayed between teams. Lane assignments are random (except in playoffs).',
      drawResults3:
        '"Restore previous round" — if you make a mistake entering results, use this button to undo the last round. This only works for the most recently completed round.',
      ranking: 'Ranking',
      rankingSwiss1: 'Standings for the Swiss system are determined by these criteria:',
      rankingSwiss2: 'Number of wins.',
      rankingSwiss3: "Buchholz coefficient (sum of opponents' wins).",
      rankingSwiss4: "Minor Buchholz coefficient (sum of opponents' Buchholz).",
      rankingSwiss5: 'Points difference (scored vs. conceded).',
      rankingRound1: 'Standings for the round-robin system are determined by:',
      rankingRound2: 'Number of wins.',
      rankingRound3: 'Head-to-head result (if teams played each other).',
      rankingRound4: 'Overall point difference across all games.',
      rankingRound5: 'If three or more teams are tied, ranking is determined by:',
      rankingRound6: 'Wins within the group of tied teams.',
      rankingRound7: 'Point difference within the group of tied teams.',
      rankingRound8: 'Overall point difference across all games.',
      playOff: 'Playoffs',
      playOffText:
        'To enable playoffs, check "Play-off after Swiss rounds" in the tournament setup before starting. You can configure how many teams advance in Preferences. The app supports up to 64 teams in a knockout bracket.',
      playOffText2:
        'Once the playoff starts, a bracket view is available on the "Current Games" tab via the "Show playoff bracket" button. If you check "Also play Tournament B", a new tournament is automatically created for teams that didn\'t advance to playoffs.',
      roundSystem: 'Round-Robin System',
      roundSystemText:
        'When selecting "Groups (Round)" system, you can split teams into groups. Choose the number of teams per group in the setup — the system automatically calculates the number of groups.',
      roundSystemText1:
        'Best results are achieved when all groups have equal numbers of teams. If no group split is needed, set the group size equal to the total number of teams.',
      remoteControl: 'Sharing & Remote Access',
      remoteControl1:
        'One of the key features of the app is the ability for anyone to view current draws and results in real-time. Use the toolbar at the top of the page:',
      remoteControl2:
        '"Show tournament links" — generates a QR code and a shareable link. Send it to participants or display it at the venue.',
      remoteControl3:
        '"Write a message" — post a message visible to all viewers (e.g., tournament schedule, lunch break timing, or announcements).',
      remoteView: 'Remote Viewing',
      remoteViewText: 'With the shared link, viewers (players, fans) can see:',
      remoteView1: "Organizer's message at the top (if set).",
      remoteView2: 'Current games with scores.',
      remoteView3: 'All previous round results.',
      remoteView4: 'Full ranking table.',
      finishedTournament: 'Completed Tournament',
      finishedTournament1:
        'After the tournament is completed, final results appear on the "Ranking" tab with the tournament result table.',
      finishedTournament2:
        'You can archive the tournament — results remain accessible from the user menu under "Archived tournaments" until deleted.',
      finishedTournament3: 'Use "Copy results" to share final standings as text via messenger or email.',
      tournamentsControlsTitle: 'Managing Multiple Tournaments',
      tournamentsControls1:
        'Add a new tournament from the user menu (click your email in the top-right corner). Select "Add new tournament" from the dropdown.',
      tournamentsControls2:
        'Switch between active tournaments using the navigation. Archived tournaments are available separately via "Archived tournaments" in the menu.',
      tournamentsControls3:
        'You can manage up to 10 tournaments simultaneously. Delete or archive outdated ones as needed.',
      thanksMessage: 'Thank you for your time. Send questions, comments, and suggestions to',
      thanksMessagePost: 'email',
      thanksMessageOr: 'or',
      thanksMessageMessenger: 'messenger',
      pressBtnSeeInterface: 'Press this button to see the interface:',
      training: {
        title: 'Training',
        description:
          'This module is designed to track the training process. It allows you to create exercises for training, record, and analyze their results.',
        exerciseListTitle: 'Exercise List Page',
        exerciseList: {
          add: 'Go to the add new exercise page',
          list: 'List of created exercises',
          delete: 'Delete exercise',
          viewResults: 'View all results of a specific exercise',
          startTraining: 'Start training for a specific exercise',
        },
        addExerciseTitle: 'Add New Exercise Page',
        addExerciseDescription:
          'Typically, any exercise consists of a certain number of throws at a certain number of distances. The combination of these options allows you to create any training exercise variation.',
        addExercise: {
          back: 'Return to exercise list',
          name: 'Exercise name, as it will appear in the general list',
          distances: 'Distances for which the exercise will be performed',
          throws: 'Number of throws for each distance',
          series:
            'Here you can name each series. Thus, you can perform a comprehensive exercise. As an example – a shooting competition. In fact, you are performing three different exercises. Example of creation – at the end of the page.',
          scoring:
            'How each throw will be evaluated. You can choose a logical value (hit/miss, set/not set) or score each throw with a certain number of points.',
          scenario:
            'If you choose a logical value, the option to select a training scenario becomes available. If positive - all throws will be marked as successful by default, and vice versa.',
          order:
            'When there are multiple distances and a certain number of throws for each, you can conduct training in different sequences. First, throw a series of, for example, 10 throws at one distance, then 10 throws at the next, and so on. Or you can throw one throw at each distance in rotation.',
        },
        trainingProcessTitle: 'Training Process Page',
        trainingProcess: {
          inputResult: 'Enter throw result here',
          navigation: 'Navigation through throws or distances',
          finish: 'When all throws are completed, to finish the training and calculate the result, press here',
        },
        exerciseResultsTitle: 'Exercise Results Page',
        exerciseResults: {
          average:
            'The average result for the exercise over the entire history of records (can be either a percentage or a specific number, depending on the selected throw result value)',
          byDistance: 'Results for each distance separately',
          history: 'Results of each training session in chronological order',
        },
        exampleCreation: 'Example of creating a classical shooting exercise',
        exampleCreationText:
          'With these settings, you will create an exercise for recording training results according to the rules of classical shooting.',
      },
      stat: {
        title: 'Statistics',
        description: 'Allows you to count statistics in pétanque games and analyze data according to various criteria.',
        settings: {
          title: 'Game Settings',
          description:
            'The main settings require only specifying the game name and the game format (triplet, doublet, or têt). It is also recommended to specify the players.',
          gameName: 'The name of the game as it will appear in the list.',
          tags: 'Game tags. These are keywords that can describe the game and allow future filtering of data. For example, you might want to know how you played in games of a specific tournament or analyze statistics for different fields. You can manage tags by clicking the "Show tags" button.',
          mode: 'Mode. The fast mode was created to make it more comfortable to record statistics during the game as a player. It allows you to spend less time looking at your phone. More details below.',
          showStats:
            'If you check this box, the statistics will be displayed during the game. This allows decisions to be made regarding player substitutions. If you are recording statistics as a player, this could influence your decisions during the game.',
          scoringSystem:
            'Select a scoring system. Currently, you can use the simple or French system. At this stage, analysis is available only for the simple system.',
          scenario:
            'Game scenario. Here you can specify which throwing result will be shown by default. If you are playing as one of the top world players, use the positive scenario.',
        },
        tracking: {
          title: 'Tracking',
          distance:
            'For each round, you can specify the distance players are playing. It is not mandatory, but it allows you to filter data by distance during analysis. This sets the distance for all throws in this round. If you want to change the distance for a specific throw, see point 7.',
          teamStats:
            'Current team statistics as percentages and overall (only displayed if "Coach" checkbox is selected).',
          playerStats: 'Current player statistics (only displayed if "Coach" checkbox is selected).',
          shotsSeries:
            "Player's shot series (green - successful shot, red - unsuccessful shot, blue - caro (only in tie)).",
          roundPoints: 'How many points the team won in the played round.',
          highlight: 'A green exclamation mark shows a caro in a tie or point where 2 balls were played.',
          contextMenu:
            'Context menu for a throw. Appears when pressing the throw result for more than half a second. Additional shot effectiveness can be specified (for a successful shot, this means a caro, for a miss it means a knocked-out ball, for a point, it could mean either a knocked-out ball or a moved cochonnet with more than one ball played). You can also delete the throw (relevant for fast play mode when a cochonnet was knocked out and not all balls were thrown). Also, you can change the distance of a specific throw (relevant when the cochonnet was moved during the game).',
          shotType: 'The type and result of the shot. This can be toggled with a simple press.',
          negativeHighlight:
            'A red exclamation mark indicates a knocked-out ball or a foreign ball played after the throw.',
          navigation: 'Navigation between rounds.',
        },
        result: {
          title: 'Game Result',
          finalScore: 'Game result.',
          teamPerformance: 'Final team performance.',
          shotsPerRound:
            'Successful shots per round (accurate only when you specify the successful shot as one that "played"). This is a rather specific metric that may not be useful for everyone.',
          roundPoints: 'How many points the team won in each round.',
          playerSeries: 'Series of throws for each player.',
          playerPerformance: 'Individual player performance by the end of the game.',
        },
        modes: {
          title: 'Modes and Scenarios',
          simple: 'Simple mode. The first click makes the throw active. This is counted as a performed throw.',
          fastModePositive:
            'Fast mode. At the beginning of the round, all throws are recorded as performed. Below is fast mode with a POSITIVE scenario. By default, all throws are successful.',
          fastModeNegative: 'Here is the NEGATIVE scenario. Currently, this scenario is winning in Ukraine.',
          fastModeDescription:
            'Fast mode allows you to track statistics without being distracted by recording EVERY throw. It was made to make it easier to enter data during the game.',
        },
        tags: {
          title: 'Tags',
          description: 'Tags are keywords that describe games. You can create and delete tags.',
          usage:
            "For each game, you can add an unlimited number of tags (this can be done either at the start of the game or later when the game is already recorded). This allows you to filter games by these tags and analyze statistics accordingly. For example, you could add the tag 'Hard Court' and then look at statistics only on hard courts. The possibilities are endless.",
        },
        substitutions: {
          title: 'Substitutions',
          description:
            "During the game, you can make a player substitution. Hover over the player's name, and a button will appear that opens a modal window where you can enter the new player's name.",
        },
        archive: {
          title: 'Archive',
          description: 'This page stores all recorded games.',
          filterTags: 'Tags that can be used to filter games.',
          gameName: 'Game name. You can delete the game, but you cannot change its name.',
          recordDate: 'Date when the game was recorded.',
          addedTags: 'Tags added to the game.',
          addTag: 'Option to add a new tag to the game after it has been recorded.',
        },
        analysis: {
          title: 'Analysis',
          description: 'In this section, you can view detailed statistics for a specific player.',
          selectPlayer: 'Select a player to view their statistics.',
          selectPeriod: 'Select the period for which statistics will be displayed.',
          selectFormat: 'Select the game format for the statistics.',
          selectTag: 'Select the tag to filter the statistics.',
          selectDistance: 'Select the distance for which statistics will be displayed.',
          result: 'The result based on the selected filters.',
          charts: 'Charts showing the dynamics of statistics, separately for points and shots.',
        },
      },
    },
  },
  ua: {
    help: {
      tocTitle: 'Зміст',
      title: 'Програма для жеребкування турнірів з петанку',
      description:
        'Ця програма полегшить життя петанкістам, які організовують турніри, вболівають за улюблену команду або беруть участь у змаганнях. Для жеребкування вам знадобиться тільки інтернет. Гравцям більше не потрібно стояти біля столика організатора, щоб дізнатися, на якому майданчику та проти кого вони грають, чи знайти себе в турнірній таблиці. Тепер є можливість просто перейти з телефона за посиланням і все перевірити онлайн.',
      feature1: 'Програма жеребкує за швейцарською, круговою, олімпійською системах та супермеле.',
      feature2: 'Мінімум налаштувань — почніть за кілька секунд.',
      feature3: 'Сучасний інтерфейс з підтримкою темної теми.',
      feature4: 'Перегляд жеребкування, результатів та таблиці в реальному часі через посилання або QR-код.',
      feature5:
        'Чіткий алгоритм жеребкування за швейцарською системою. Програма не жеребкує команди рандомно. Наприклад, якщо перші 6 команд мають однакову кількість перемог, то в наступному раунді вони зіграють за схемою: 1-6, 2-5, 3-4.',
      howToUseTitle: 'Як користуватися цією програмою',
      howToUse1:
        'Для того щоб використовувати програму, треба зареєструвати акаунт. Жодних персональних даних, крім email, не потрібно (та й його ніхто не побачить, навіть я, розробник).',
      howToUse2:
        'Користувач може використовувати програму як адміністратор (тільки для українських користувачів). Це дає змогу імпортувати гравців з порталу Федерації петанку України. Пароль я можу видати особисто за запитом.',
      shortTitle: 'Швидкий старт',
      shortText: 'Щоб провести стандартний турнір за швейцарською системою + плей-оф, потрібно:',
      shortText1: 'Залогінитись або зареєструвати новий акаунт.',
      shortText2: 'Додати назви команд на вкладці "Команди".',
      shortText3: 'Обрати систему турніру (швейцарська за замовчуванням) і натиснути "Жеребкувати перший раунд".',
      shortText4: 'Внести результати, зберегти їх.',
      shortText5: 'Пожеребкувати наступні раунди, стільки, скільки ви хочете зіграти.',
      shortText6: 'Перейти на вкладку "Таблиця", щоб подивитись результати (якщо цікаво).',
      shortText7:
        'Увімкнути "Плей-оф після швейцарських раундів" у налаштуваннях турніру, вказати кількість команд у Налаштуваннях.',
      shortText8: 'На вкладці "Поточні ігри" ввести результати плей-оф.',
      shortText9: 'Коли ви внесете результати фіналу, турнір буде завершено. Його можна заархівувати або видалити.',
      shortSummary: 'Далі можна читати тим, кому цікаві "деталі".',
      interfaceTitle: 'Основний інтерфейс',
      interfaceDescription:
        'Після входу та створення турніру ви побачите основний робочий простір. Інтерфейс складається з панелі інструментів зверху (для поширення та повідомлень), картки налаштування турніру та вкладок з контентом.',
      interface1: 'Натисніть на назву турніру, щоб змінити її в будь-який момент.',
      interface2: 'Оберіть систему турніру: швейцарська, кругова (групи) або супермеле.',
      interface3: 'Налаштуйте плей-оф та опцію Турніру Б перед початком.',
      interface4:
        'Додавайте команди, вводячи назву та натискаючи "Додати". Адміністратори також можуть імпортувати з порталу ФПУ.',
      interface5: 'Опція використання рейтингу команд для посіву в першому раунді.',
      interface6: '"Відновити останні команди" дозволяє швидко додати команди з попереднього турніру.',
      tournamentControlsTitle: 'Керування турніром',
      tournamentControls1:
        'Кнопка "Жеребкувати перший раунд" починає турнір. Після старту команди не можна додавати чи видаляти (крім супермеле). Кнопка "Видалити турнір" повністю видаляє його.',
      tournamentControls2:
        'Після старту турніру з\'являється кнопка "Завершити турнір". Натисніть її, щоб завершити турнір вручну. Турнір також завершується автоматично, коли внесені результати фіналу плей-оф.',
      tournamentControls3:
        '"Відновити останні команди" корисна, якщо ви вже почали турнір і зрозуміли, що забули якусь команду. Створіть новий турнір і натисніть цю кнопку — команди з попереднього турніру стануть доступними.',
      mainTabs: 'Основні розділи',
      mainTabs1: 'Команди: додавання та видалення команд до жеребкування першого раунду (або будь-коли для супермеле).',
      mainTabs2: 'Поточні ігри: перегляд пар поточного раунду, внесення результатів та жеребкування наступних раундів.',
      mainTabs3: 'Результати: перегляд усіх зіграних ігор з фільтрами по раундах (R1, R2, R3, Всі).',
      mainTabs4: 'Таблиця: підсумкова таблиця з сортуванням за перемогами, Бухгольцем та очками.',
      preferences: 'Налаштування',
      preferencesIntro:
        'Доступ до налаштувань через кнопку "Налаштування" внизу сторінки або через "Додаткові налаштування" перед стартом турніру.',
      preferences1: "Усі налаштування необов'язкові і мають розумні значення за замовчуванням.",
      preferences2: 'Технічний рахунок: зміна рахунку за технічну перемогу (за замовчуванням 13:7).',
      preferences3:
        'Максимальний рахунок: зміна рахунку, при якому гра закінчується (корисно для клубних форматів, наприклад, ігри до 31).',
      preferences4: 'Тут також можна налаштувати кількість команд у плей-оф та нумерацію доріжок.',
      drawResults: 'Жеребкування і результати',
      drawResultsText:
        'Кнопка "Жеребкувати N раунд" генерує суперників на кожен наступний раунд. Програма не запитує загальну кількість раундів. При швейцарській системі будьте обережні з малою кількістю команд і великою кількістю раундів — в якийсь момент алгоритм не зможе виконати всі умови розстановки. Наприклад, 7 раундів при 12 командах або 5 раундів при 8.',
      drawResults1:
        'Кожна гра показує обидві команди, призначену доріжку та поля для введення рахунку. Введіть результати та натисніть "Зберегти результати".',
      drawResults2: 'Номер доріжки відображається між командами. Розподіл доріжок рандомний (крім плей-оф).',
      drawResults3:
        '"Відновити попередній раунд" — якщо ви помилились при внесенні результату, використайте цю кнопку. Працює ТІЛЬКИ для останнього завершеного раунду.',
      ranking: 'Таблиця',
      rankingSwiss1: 'Підсумкова таблиця при швейцарській системі визначається за такими критеріями:',
      rankingSwiss2: 'Кількість перемог.',
      rankingSwiss3: 'Коефіцієнт Бухгольця (сума перемог суперників).',
      rankingSwiss4: 'Коефіцієнт малого Бухгольця (сума бухгольців суперників).',
      rankingSwiss5: 'Різниця набраних/пропущених очок.',
      rankingRound1:
        'Якщо турнір грається за круговою системою, то підсумкова таблиця формується за такими критеріями:',
      rankingRound2: 'Кількість перемог.',
      rankingRound3: 'Результат особистої зустрічі (якщо команди грали між собою).',
      rankingRound4: 'Загальна різниця очок в усіх іграх.',
      rankingRound5:
        'Але якщо кількість перемог однакова у трьох чи більше команд, то місця між цими командами розподіляються таким чином:',
      rankingRound6: 'Кількість перемог тільки у групі з цими командами.',
      rankingRound7: 'Різниця очок у групі з цими командами.',
      rankingRound8: 'Загальна різниця очок в усіх іграх.',
      playOff: 'Плей-оф',
      playOffText:
        'Щоб увімкнути плей-оф, поставте галочку "Плей-оф після швейцарських раундів" у налаштуваннях турніру перед стартом. Кількість команд, що проходять далі, налаштовується у Налаштуваннях. Програма підтримує до 64 команд в олімпійській сітці.',
      playOffText2:
        'Після початку плей-оф сітка доступна на вкладці "Поточні ігри" через кнопку "Показати сітку плей-оф". Якщо увімкнути "Також грати Турнір Б", автоматично створюється новий турнір для команд, що не пройшли у плей-оф.',
      roundSystem: 'Кругова система',
      roundSystemText:
        'При виборі системи "Групи (Кругова)" можна розбити команди на групи. Оберіть кількість команд у групі — система автоматично порахує кількість груп.',
      roundSystemText1:
        'Найкращі результати, коли в усіх групах однакова кількість команд. Якщо групи не потрібні, вкажіть кількість команд, що дорівнює загальній кількості зареєстрованих.',
      remoteControl: 'Поширення та віддалений доступ',
      remoteControl1:
        'Одна з ключових функцій програми — можливість будь-кому переглядати жеребкування та результати в реальному часі. Використовуйте панель інструментів зверху сторінки:',
      remoteControl2:
        '"Показати посилання на турнір" — генерує QR-код та посилання. Надішліть учасникам або покажіть на екрані на майданчику.',
      remoteControl3:
        '"Написати повідомлення" — напишіть повідомлення, яке бачитимуть усі глядачі (наприклад, розклад турніру, перерва на обід, оголошення).',
      remoteView: 'Віддалений перегляд',
      remoteViewText: 'Перейшовши за посиланням, глядачі (гравці, вболівальники) бачать:',
      remoteView1: 'Повідомлення організатора зверху (якщо встановлено).',
      remoteView2: 'Поточні ігри з рахунком.',
      remoteView3: 'Результати всіх попередніх раундів.',
      remoteView4: 'Повну підсумкову таблицю.',
      finishedTournament: 'Завершений турнір',
      finishedTournament1:
        'Після завершення турніру фінальні результати з\'являються на вкладці "Таблиця" з підсумковою таблицею.',
      finishedTournament2:
        'Ви можете заархівувати турнір — результати залишаться доступними в меню користувача в розділі "Архівовані турніри" до видалення.',
      finishedTournament3:
        'Кнопка "Скопіювати результати" дозволяє поділитися підсумками в текстовому форматі через месенджер або email.',
      tournamentsControlsTitle: 'Керування кількома турнірами',
      tournamentsControls1:
        'Додати новий турнір можна з меню користувача (натисніть на email у правому верхньому куті). Виберіть "Додати новий турнір" у випадаючому меню.',
      tournamentsControls2:
        'Переключатися між активними турнірами можна через навігацію. Архівовані турніри доступні окремо через пункт "Архівовані турніри" в меню.',
      tournamentsControls3: 'Одночасно може бути до 10 турнірів. Видаляйте або архівуйте неактуальні за потреби.',
      thanksMessage: 'Дякую за ваш час. Питання, зауваження та пропозиції можна надсилати на',
      thanksMessagePost: 'пошту',
      thanksMessageOr: 'або у',
      thanksMessageMessenger: 'месенджер',
      pressBtnSeeInterface: 'Натиснувши цю кнопку, ви побачите такий інтерфейс:',
      training: {
        title: 'Тренування',
        description:
          'Цей модуль розроблений для відслідковування тренувального процесу. Дозволяє створювати вправи для тренувань, записувати та аналізувати їх результати.',
        exerciseListTitle: 'Сторінка списку вправ',
        exerciseList: {
          add: 'Перехід на сторінку додавання нової вправи',
          list: 'Список створених вправ',
          delete: 'Видалити вправу',
          viewResults: 'Подивитись всі результати конкретної вправи',
          startTraining: 'Почати тренування по конкретній вправі',
        },
        addExerciseTitle: 'Сторінка додавання нової вправи',
        addExerciseDescription:
          'Зазвичай люба вправа складається з певної кількості кидків на певну кількість дистанцій. Комбінація цих варіантів дозволяє зробити будь-який варіант тренувальної вправи',
        addExercise: {
          back: 'Повернутись до списку вправ',
          name: 'Назва вправи, як вона буде виглядати в загальному списку',
          distances: 'Дистанції на які буде виконуватись вправа',
          throws: 'Кількість кидків на кожну дистанцію',
          series:
            'Тут можна назвати кожну серію. Таким чином ви можете зробити комплексну вправу. Як приклад - змагання з тиру. Коли під по факту ви виконуєте три різні вправи. Приклад створення - в кінці сторінки',
          scoring:
            'Як буде оцінюватися кожен кидок. Можна вибрати логічне значення (влучив / не влучив, поставив / не поставив). Або оцінювати кожен кидок певною кількістю очок.',
          scenario:
            'Якщо вибрати логічне значення, то доступна опція вибору сценарію тренування. При позитивному - всі кидки за замовчуванням будуть вказані, як успішні і навпаки',
          order:
            'Коли є кілька дистанцій і певна кількість кидків на цю дистанцію, то можна провести тренування в різному порядку. Спочатку кинути серію з, наприклад, 10 кидків на одну дистанцію, потім 10 кидків на наступну і т.д. Або можна кидати по одному кидку на кожну дистанцію.',
        },
        trainingProcessTitle: 'Сторінка процесу тренування',
        trainingProcess: {
          inputResult: 'Тут вводиться результат кидка',
          navigation: 'Навігація по кидкам чи дистанціям',
          finish: 'Коли всі кидки виконані, щоб закінчити тренування і порахувати результат, натисність сюди',
        },
        exerciseResultsTitle: 'Сторінка результатів конкретної вправи',
        exerciseResults: {
          average:
            'Середній результат по вправі за всю історію записів (може бути або відсоток, або конкретна цифра, в залежності від вибраного значення результату кидка)',
          byDistance: 'Результати по кожній дистанції окремо',
          history: 'Результати кожного тренування в хронологічному порядку',
        },
      },
      stat: {
        title: 'Статистика',
        description: 'Дозволяє рахувати статистику в іграх з петанку та аналізувати дані по багатьом критеріям.',
        settings: {
          title: 'Налаштування гри',
          description:
            'Із основних налаштувань треба вказати тільки назву гри та формат гри (триплет, дуплет чи тет). А також бажано вказати гравців.',
          gameName: 'Назва гри як вона буде відображатись в списку.',
          tags: 'Теги гри. Це ключові слова яким можна описати гру і завдяки яким можна буде в майбутньому фільтрувати дані. Наприклад, вам може бути цікаво як ви зіграли в іграх конкретного турніру. Або ви хочете аналізувати статистику по різним майданчикам. Управляти тегами можна натиснувши кнопку "Показати теги".',
          mode: 'Режим. Швидкий режим був зроблений, щоб було комфортніше записувати статистику під час гри як гравець. Це дозволяє менше часу заглядати в телефон. Детальніше нижче.',
          showStats:
            'Якщо поставите цю галку, то цифри статистики будуть показуватись під час гри. Тобто по ним можна приймати рішення щодо заміни гравця. Якщо ви записуєте статистику як гравець - це може впливати на ваші думки під час гри.',
          scoringSystem:
            'Вибрати систему підрахунку. На даному етапі можна рахувати по простій системі або по французькій. На даному етапі аналіз доступний тільки для простої системи.',
          scenario:
            'Сценарій гри. Тут можна вказати який результат кидку буде вказаний за замовчуванням. Якщо ви граєте як топові гравці світу, то вказуйте позитивний сценарій.',
        },
        tracking: {
          title: 'Процес ведення статистики',
          distance:
            "Кожен раунд можна вказати на яку дистанцію грають гравці. Вибирати не обов'язково. Але потім при аналізі статистики можна буде фільтрувати дані по дистанціям. Це задає дистанцію відразу для всіх кидків в цьому раунді. Якщо хочете змінити відстань для конкретного кидка, дивіться 7 пункт.",
          teamStats:
            'Поточна статистика команди у відсотках та в загальному (буде показуватись тільки якщо вибрана галка "Як тренер").',
          playerStats: 'Поточна статистика гравця (буде показуватись тільки якщо вибрана галка "Як тренер").',
          shotsSeries:
            'Серія кидків гравця (зелений - результативний кидок, червоний - нерезультативний кидок, синій - каро (тільки при тирі)).',
          roundPoints: 'Скільки очок виграла команда в результаті зіграного раунду.',
          highlight: 'Зелений знак оклику показує, що це каро при тирі або поінт, при якому заграло 2 кулі.',
          contextMenu:
            'Контекстне меню кидка. Показується при довгому натисканні на результат кидка (більше ніж пів секунди). Можна вказати додаткову ефективність кидка (при результативному шуті це означатиме каро, при промаху це означатиме вибиту свою кулю, при поінті це може значити або підбита своя куля або переміщений кошонет при якому заграло більше ніж одна куля). Також можна видалити кидок (актуально при швидкому режимі гри, коли був вибитий кошонет і не всі кулі були кинуті). Також можна змінити відстань конкретного кидка (актуально коли під час гри кошонет був переміщений).',
          shotType: 'Тип і результат кидку. Перелючається простим натисканням.',
          negativeHighlight:
            'Червоний знак оклику показує вибиту свою кулю при тирі або при поінті, якщо в результаті кидка заграла чужа куля.',
          navigation: 'Навігація між раундами.',
        },
        result: {
          title: 'Результат гри',
          finalScore: 'Результат гри.',
          teamPerformance: 'Кінцева результативність гри (командна).',
          shotsPerRound:
            'Результативні кулі за кожний раунд (рахуються коректно тільки тоді, коли ви вказуєте в статистиці результативний кидок як той, що "зіграв"). Це досить специфічний показник, який не кожному потрібен, насправді).',
          roundPoints: 'Скільки очок виграла команда кожного раунду.',
          playerSeries: 'Серії кидків кожного гравця.',
          playerPerformance: 'Індивідуальна результативність гравця по результату гри.',
        },
        modes: {
          title: 'Режими та сценарії',
          simple: 'Простий режим. Перший клік - зробити кидок активним. Це рахується як кидок, який виконаний.',
          fastModePositive:
            'Швидкий режим. На початку раунду всі кидки будуть записані як виконані. На скріні нижче - швидкий режим та ПОЗИТИВНИЙ сценарій. Тобто за замовчуванням всі кидки результативні.',
          fastModeNegative: 'А ось нижче вже НЕГАТИВНИЙ сценарій. Поки що в Україні він перемагає.',
          fastModeDescription:
            'Швидкий режим дозволяє вести статистику не відволікаючись на запис КОЖНОГО кидку. Зроблений, як вже вказано вище, щоб легше було писати дані під час гри.',
        },
        tags: {
          title: 'Теги',
          description: 'Теги - це ключові слова, якими можна описувати ігри. Можна створювати і видаляти теги.',
          usage:
            'Для кожної гри можна додати необмежену кількість тегів (це можна зробити як на початку гри, так і вже потім, коли гра давно записана). Це дозволяє фільтрувати ігри по цим тегам і аналізувати статистику відповідно до цих тегів. Наприклад, ви можете додати тег "Твердий майданчик" і потім дивитись статистику тільки на твердих майданчиках. Тут тільки ваша фантазія.',
        },
        substitutions: {
          title: 'Заміни',
          description:
            "В процесі гри можна зробити заміну гравця. Треба заховерити на прізвище гравця і з'явиться кнопка, натиснувши на яку відкриється модальне вікно з можливістю ввести прізвище нового гравця.",
        },
        archive: {
          title: 'Архів',
          description: 'На цій сторінці зберігаються всі записані ігри.',
          filterTags: 'Теги по яким можна фільтрувати ігри.',
          gameName: 'Назва гри. Можна видалити гру, але не можна змінити назву.',
          recordDate: 'Дата, коли була гра записана.',
          addedTags: 'Доданий тег до гри.',
          addTag: 'Можливість додати додатковий тег до гри вже після того, як вона записана.',
        },
        analysis: {
          title: 'Аналіз',
          description: 'В цьому блоці можна подивитись детальну статистику по конкретному гравцю.',
          selectPlayer: 'Вибрати гравця по якому дивитись статистику.',
          selectPeriod: 'Вибрати період за який буде показана статистика.',
          selectFormat: 'Вибрати формат гри по якому показувати статистику.',
          selectTag: 'Вибрати тег по якому фільтрувати статистику.',
          selectDistance: 'Вибрати дистанцію по якій показувати статистику.',
          result: 'Результат в результаті вибраних фільтрів.',
          charts: 'Графіки. Динаміка статистики окремо по поінтам та шутам.',
        },
        exampleCreation: 'Приклад створення вправи для тиру',
        exampleCreationText:
          'З такими налаштуваннями ви створите вправу для запису результатів тренувань за правилами класичного тиру',
      },
    },
  },
  fr: {
    help: {
      tocTitle: 'Table of Contents',
      title: 'Tournament Drawing App for Petanque',
      description:
        "This app simplifies the lives of petanque players who organize tournaments, cheer for their favorite team, or participate in competitions. All you need for drawing is internet access. Players no longer need to gather around the organizer's table to find out their playing field, opponents, or their position in the standings. Now, they can simply follow a link on their phone to check everything online.",
      feature1: 'The app supports Swiss, round-robin, knockout systems, and supermelee.',
      feature2: 'Minimal settings — get started in seconds.',
      feature3: 'Clean, modern interface with dark theme support.',
      feature4: 'Real-time remote viewing of draws, results, and standings via a shared link or QR code.',
      feature5:
        "Precise drawing algorithm for the Swiss system. The app doesn't draw teams randomly. For example, if the top 6 teams have the same number of wins, in the next round they will play as follows: 1-6, 2-5, 3-4.",
      howToUseTitle: 'How to Use This App',
      howToUse1:
        'To use the app, you need to register an account. No personal data other than email is required (and even that remains private, not even visible to me, the developer).',
      howToUse2:
        'Users can use the app as administrators (available only for Ukrainian users). This allows importing players from the Ukrainian Federation portal. I can issue a password personally upon request.',
      shortTitle: 'Quick Start Guide',
      shortText: 'To conduct a standard Swiss system tournament + playoffs, you need to:',
      shortText1: 'Log in or register a new account.',
      shortText2: 'Add team names on the "Teams" tab.',
      shortText3: 'Configure tournament system (Swiss is default) and click "Draw first round".',
      shortText4: 'Enter the results and save them.',
      shortText5: 'Draw subsequent rounds as many as you wish to play.',
      shortText6: 'Go to the "Ranking" tab to check the standings (if interested).',
      shortText7: 'Enable "Play-off after Swiss rounds" in setup, configure the number of teams in Preferences.',
      shortText8: 'Enter all playoff results on the "Current Games" tab.',
      shortText9:
        'Once you input the final results, the tournament is completed. You can archive it in your account for history or remove it.',
      shortSummary: 'Continue reading for more details.',
      interfaceTitle: 'Main Interface',
      interfaceDescription:
        'After logging in and creating a tournament, you will see the main workspace. The interface is divided into a toolbar at the top (for sharing and messaging), a tournament setup card, and content tabs below.',
      interface1: 'Click on the tournament name to rename it at any time.',
      interface2: 'Select the tournament system: Swiss, Groups (Round-Robin), or Supermele.',
      interface3: 'Configure play-off and Tournament B options before starting.',
      interface4:
        'Add teams by entering their name and clicking "Add team". Admins can also import from the UFP portal.',
      interface5: 'Option to use team ratings for seeding in the first round draw.',
      interface6: '"Restore last teams" allows you to quickly re-add teams from a previous tournament.',
      tournamentControlsTitle: 'Tournament Controls',
      tournamentControls1:
        'The "Draw first round" button starts the tournament. Once started, teams cannot be added or removed (except in supermelee). The "Remove tournament" button permanently deletes the tournament.',
      tournamentControls2:
        'After the tournament is started, the "Finish tournament" button appears. Click it to manually end the tournament at any point. A tournament also finishes automatically when all playoff results are entered.',
      tournamentControls3:
        '"Restore last teams" is helpful if you\'ve started a tournament and realize you forgot a team. Create a new tournament and click this button to re-add all teams from the previous one.',
      mainTabs: 'Main Sections',
      mainTabs1: 'Teams: add or remove teams before drawing the first round (or anytime for supermelee).',
      mainTabs2: 'Current games: view current round matchups, enter scores, and draw subsequent rounds.',
      mainTabs3: 'Results: browse all completed games with round filters (R1, R2, R3, All).',
      mainTabs4: 'Ranking: standings table with sorting by wins, Buchholz, and points.',
      preferences: 'Preferences',
      preferencesIntro:
        'Access preferences via the "Preferences" button at the bottom of the page, or through "Additional settings" before starting the tournament.',
      preferences1: 'All settings are optional and have sensible defaults.',
      preferences2: 'Technical score: adjust the score awarded for walkovers (default 13:7).',
      preferences3: 'Maximum score: change the game-ending score (useful for club formats like 31-point games).',
      preferences4: 'Playoff teams and lane numbering can also be configured here.',
      drawResults: 'Draw and Results',
      drawResultsText:
        'The "Draw N Round" button generates opponents for each subsequent round. The app doesn\'t ask for the total number of rounds upfront. In the Swiss system, be cautious with small team counts and many rounds — at some point the algorithm won\'t be able to satisfy all pairing conditions. This could happen, for example, with 7 rounds and 12 teams or 5 rounds and 8 teams.',
      drawResults1:
        'Each game shows both teams, their assigned lane, and input fields for scores. Enter scores and click "Save results" to proceed.',
      drawResults2: 'The lane number is displayed between teams. Lane assignments are random (except in playoffs).',
      drawResults3:
        '"Restore previous round" — if you make a mistake entering results, use this button to undo the last round. This only works for the most recently completed round.',
      ranking: 'Ranking',
      rankingSwiss1: 'Standings for the Swiss system are determined by these criteria:',
      rankingSwiss2: 'Number of wins.',
      rankingSwiss3: "Buchholz coefficient (sum of opponents' wins).",
      rankingSwiss4: "Minor Buchholz coefficient (sum of opponents' Buchholz).",
      rankingSwiss5: 'Points difference (scored vs. conceded).',
      rankingRound1: 'Standings for the round-robin system are determined by:',
      rankingRound2: 'Number of wins.',
      rankingRound3: 'Head-to-head result (if teams played each other).',
      rankingRound4: 'Overall point difference across all games.',
      rankingRound5: 'If three or more teams are tied, ranking is determined by:',
      rankingRound6: 'Wins within the group of tied teams.',
      rankingRound7: 'Point difference within the group of tied teams.',
      rankingRound8: 'Overall point difference across all games.',
      playOff: 'Playoffs',
      playOffText:
        'To enable playoffs, check "Play-off after Swiss rounds" in the tournament setup before starting. You can configure how many teams advance in Preferences. The app supports up to 64 teams in a knockout bracket.',
      playOffText2:
        'Once the playoff starts, a bracket view is available on the "Current Games" tab via the "Show playoff bracket" button. If you check "Also play Tournament B", a new tournament is automatically created for teams that didn\'t advance to playoffs.',
      roundSystem: 'Round-Robin System',
      roundSystemText:
        'When selecting "Groups (Round)" system, you can split teams into groups. Choose the number of teams per group in the setup — the system automatically calculates the number of groups.',
      roundSystemText1:
        'Best results are achieved when all groups have equal numbers of teams. If no group split is needed, set the group size equal to the total number of teams.',
      remoteControl: 'Sharing & Remote Access',
      remoteControl1:
        'One of the key features of the app is the ability for anyone to view current draws and results in real-time. Use the toolbar at the top of the page:',
      remoteControl2:
        '"Show tournament links" — generates a QR code and a shareable link. Send it to participants or display it at the venue.',
      remoteControl3:
        '"Write a message" — post a message visible to all viewers (e.g., tournament schedule, lunch break timing, or announcements).',
      remoteView: 'Remote Viewing',
      remoteViewText: 'With the shared link, viewers (players, fans) can see:',
      remoteView1: "Organizer's message at the top (if set).",
      remoteView2: 'Current games with scores.',
      remoteView3: 'All previous round results.',
      remoteView4: 'Full ranking table.',
      finishedTournament: 'Completed Tournament',
      finishedTournament1:
        'After the tournament is completed, final results appear on the "Ranking" tab with the tournament result table.',
      finishedTournament2:
        'You can archive the tournament — results remain accessible from the user menu under "Archived tournaments" until deleted.',
      finishedTournament3: 'Use "Copy results" to share final standings as text via messenger or email.',
      tournamentsControlsTitle: 'Managing Multiple Tournaments',
      tournamentsControls1:
        'Add a new tournament from the user menu (click your email in the top-right corner). Select "Add new tournament" from the dropdown.',
      tournamentsControls2:
        'Switch between active tournaments using the navigation. Archived tournaments are available separately via "Archived tournaments" in the menu.',
      tournamentsControls3:
        'You can manage up to 10 tournaments simultaneously. Delete or archive outdated ones as needed.',
      thanksMessage: 'Thank you for your time. Send questions, comments, and suggestions to',
      thanksMessagePost: 'email',
      thanksMessageOr: 'or',
      thanksMessageMessenger: 'messenger',
      pressBtnSeeInterface: 'Press this button to see the interface:',
      training: {
        title: 'Training',
        description:
          'This module is designed to track the training process. It allows you to create exercises for training, record, and analyze their results.',
        exerciseListTitle: 'Exercise List Page',
        exerciseList: {
          add: 'Go to the add new exercise page',
          list: 'List of created exercises',
          delete: 'Delete exercise',
          viewResults: 'View all results of a specific exercise',
          startTraining: 'Start training for a specific exercise',
        },
        addExerciseTitle: 'Add New Exercise Page',
        addExerciseDescription:
          'Typically, any exercise consists of a certain number of throws at a certain number of distances. The combination of these options allows you to create any training exercise variation.',
        addExercise: {
          back: 'Return to exercise list',
          name: 'Exercise name, as it will appear in the general list',
          distances: 'Distances for which the exercise will be performed',
          throws: 'Number of throws for each distance',
          series:
            'Here you can name each series. Thus, you can perform a comprehensive exercise. As an example – a shooting competition. In fact, you are performing three different exercises. Example of creation – at the end of the page.',
          scoring:
            'How each throw will be evaluated. You can choose a logical value (hit/miss, set/not set) or score each throw with a certain number of points.',
          scenario:
            'If you choose a logical value, the option to select a training scenario becomes available. If positive - all throws will be marked as successful by default, and vice versa.',
          order:
            'When there are multiple distances and a certain number of throws for each, you can conduct training in different sequences. First, throw a series of, for example, 10 throws at one distance, then 10 throws at the next, and so on. Or you can throw one throw at each distance in rotation.',
        },
        trainingProcessTitle: 'Training Process Page',
        trainingProcess: {
          inputResult: 'Enter throw result here',
          navigation: 'Navigation through throws or distances',
          finish: 'When all throws are completed, to finish the training and calculate the result, press here',
        },
        exerciseResultsTitle: 'Exercise Results Page',
        exerciseResults: {
          average:
            'The average result for the exercise over the entire history of records (can be either a percentage or a specific number, depending on the selected throw result value)',
          byDistance: 'Results for each distance separately',
          history: 'Results of each training session in chronological order',
        },
        exampleCreation: 'Example of creating a classical shooting exercise',
        exampleCreationText:
          'With these settings, you will create an exercise for recording training results according to the rules of classical shooting.',
      },
      stat: {
        title: 'Statistics',
        description: 'Allows you to count statistics in pétanque games and analyze data according to various criteria.',
        settings: {
          title: 'Game Settings',
          description:
            'The main settings require only specifying the game name and the game format (triplet, doublet, or têt). It is also recommended to specify the players.',
          gameName: 'The name of the game as it will appear in the list.',
          tags: 'Game tags. These are keywords that can describe the game and allow future filtering of data. For example, you might want to know how you played in games of a specific tournament or analyze statistics for different fields. You can manage tags by clicking the "Show tags" button.',
          mode: 'Mode. The fast mode was created to make it more comfortable to record statistics during the game as a player. It allows you to spend less time looking at your phone. More details below.',
          showStats:
            'If you check this box, the statistics will be displayed during the game. This allows decisions to be made regarding player substitutions. If you are recording statistics as a player, this could influence your decisions during the game.',
          scoringSystem:
            'Select a scoring system. Currently, you can use the simple or French system. At this stage, analysis is available only for the simple system.',
          scenario:
            'Game scenario. Here you can specify which throwing result will be shown by default. If you are playing as one of the top world players, use the positive scenario.',
        },
        tracking: {
          title: 'Tracking',
          distance:
            'For each round, you can specify the distance players are playing. It is not mandatory, but it allows you to filter data by distance during analysis. This sets the distance for all throws in this round. If you want to change the distance for a specific throw, see point 7.',
          teamStats:
            'Current team statistics as percentages and overall (only displayed if "Coach" checkbox is selected).',
          playerStats: 'Current player statistics (only displayed if "Coach" checkbox is selected).',
          shotsSeries:
            "Player's shot series (green - successful shot, red - unsuccessful shot, blue - caro (only in tie)).",
          roundPoints: 'How many points the team won in the played round.',
          highlight: 'A green exclamation mark shows a caro in a tie or point where 2 balls were played.',
          contextMenu:
            'Context menu for a throw. Appears when pressing the throw result for more than half a second. Additional shot effectiveness can be specified (for a successful shot, this means a caro, for a miss it means a knocked-out ball, for a point, it could mean either a knocked-out ball or a moved cochonnet with more than one ball played). You can also delete the throw (relevant for fast play mode when a cochonnet was knocked out and not all balls were thrown). Also, you can change the distance of a specific throw (relevant when the cochonnet was moved during the game).',
          shotType: 'The type and result of the shot. This can be toggled with a simple press.',
          negativeHighlight:
            'A red exclamation mark indicates a knocked-out ball or a foreign ball played after the throw.',
          navigation: 'Navigation between rounds.',
        },
        result: {
          title: 'Game Result',
          finalScore: 'Game result.',
          teamPerformance: 'Final team performance.',
          shotsPerRound:
            'Successful shots per round (accurate only when you specify the successful shot as one that "played"). This is a rather specific metric that may not be useful for everyone.',
          roundPoints: 'How many points the team won in each round.',
          playerSeries: 'Series of throws for each player.',
          playerPerformance: 'Individual player performance by the end of the game.',
        },
        modes: {
          title: 'Modes and Scenarios',
          simple: 'Simple mode. The first click makes the throw active. This is counted as a performed throw.',
          fastModePositive:
            'Fast mode. At the beginning of the round, all throws are recorded as performed. Below is fast mode with a POSITIVE scenario. By default, all throws are successful.',
          fastModeNegative: 'Here is the NEGATIVE scenario. Currently, this scenario is winning in Ukraine.',
          fastModeDescription:
            'Fast mode allows you to track statistics without being distracted by recording EVERY throw. It was made to make it easier to enter data during the game.',
        },
        tags: {
          title: 'Tags',
          description: 'Tags are keywords that describe games. You can create and delete tags.',
          usage:
            "For each game, you can add an unlimited number of tags (this can be done either at the start of the game or later when the game is already recorded). This allows you to filter games by these tags and analyze statistics accordingly. For example, you could add the tag 'Hard Court' and then look at statistics only on hard courts. The possibilities are endless.",
        },
        substitutions: {
          title: 'Substitutions',
          description:
            "During the game, you can make a player substitution. Hover over the player's name, and a button will appear that opens a modal window where you can enter the new player's name.",
        },
        archive: {
          title: 'Archive',
          description: 'This page stores all recorded games.',
          filterTags: 'Tags that can be used to filter games.',
          gameName: 'Game name. You can delete the game, but you cannot change its name.',
          recordDate: 'Date when the game was recorded.',
          addedTags: 'Tags added to the game.',
          addTag: 'Option to add a new tag to the game after it has been recorded.',
        },
        analysis: {
          title: 'Analysis',
          description: 'In this section, you can view detailed statistics for a specific player.',
          selectPlayer: 'Select a player to view their statistics.',
          selectPeriod: 'Select the period for which statistics will be displayed.',
          selectFormat: 'Select the game format for the statistics.',
          selectTag: 'Select the tag to filter the statistics.',
          selectDistance: 'Select the distance for which statistics will be displayed.',
          result: 'The result based on the selected filters.',
          charts: 'Charts showing the dynamics of statistics, separately for points and shots.',
        },
      },
    },
  },
  es: {
    help: {
      tocTitle: 'Table of Contents',
      title: 'Tournament Drawing App for Petanque',
      description:
        "This app simplifies the lives of petanque players who organize tournaments, cheer for their favorite team, or participate in competitions. All you need for drawing is internet access. Players no longer need to gather around the organizer's table to find out their playing field, opponents, or their position in the standings. Now, they can simply follow a link on their phone to check everything online.",
      feature1: 'The app supports Swiss, round-robin, knockout systems, and supermelee.',
      feature2: 'Minimal settings — get started in seconds.',
      feature3: 'Clean, modern interface with dark theme support.',
      feature4: 'Real-time remote viewing of draws, results, and standings via a shared link or QR code.',
      feature5:
        "Precise drawing algorithm for the Swiss system. The app doesn't draw teams randomly. For example, if the top 6 teams have the same number of wins, in the next round they will play as follows: 1-6, 2-5, 3-4.",
      howToUseTitle: 'How to Use This App',
      howToUse1:
        'To use the app, you need to register an account. No personal data other than email is required (and even that remains private, not even visible to me, the developer).',
      howToUse2:
        'Users can use the app as administrators (available only for Ukrainian users). This allows importing players from the Ukrainian Federation portal. I can issue a password personally upon request.',
      shortTitle: 'Quick Start Guide',
      shortText: 'To conduct a standard Swiss system tournament + playoffs, you need to:',
      shortText1: 'Log in or register a new account.',
      shortText2: 'Add team names on the "Teams" tab.',
      shortText3: 'Configure tournament system (Swiss is default) and click "Draw first round".',
      shortText4: 'Enter the results and save them.',
      shortText5: 'Draw subsequent rounds as many as you wish to play.',
      shortText6: 'Go to the "Ranking" tab to check the standings (if interested).',
      shortText7: 'Enable "Play-off after Swiss rounds" in setup, configure the number of teams in Preferences.',
      shortText8: 'Enter all playoff results on the "Current Games" tab.',
      shortText9:
        'Once you input the final results, the tournament is completed. You can archive it in your account for history or remove it.',
      shortSummary: 'Continue reading for more details.',
      interfaceTitle: 'Main Interface',
      interfaceDescription:
        'After logging in and creating a tournament, you will see the main workspace. The interface is divided into a toolbar at the top (for sharing and messaging), a tournament setup card, and content tabs below.',
      interface1: 'Click on the tournament name to rename it at any time.',
      interface2: 'Select the tournament system: Swiss, Groups (Round-Robin), or Supermele.',
      interface3: 'Configure play-off and Tournament B options before starting.',
      interface4:
        'Add teams by entering their name and clicking "Add team". Admins can also import from the UFP portal.',
      interface5: 'Option to use team ratings for seeding in the first round draw.',
      interface6: '"Restore last teams" allows you to quickly re-add teams from a previous tournament.',
      tournamentControlsTitle: 'Tournament Controls',
      tournamentControls1:
        'The "Draw first round" button starts the tournament. Once started, teams cannot be added or removed (except in supermelee). The "Remove tournament" button permanently deletes the tournament.',
      tournamentControls2:
        'After the tournament is started, the "Finish tournament" button appears. Click it to manually end the tournament at any point. A tournament also finishes automatically when all playoff results are entered.',
      tournamentControls3:
        '"Restore last teams" is helpful if you\'ve started a tournament and realize you forgot a team. Create a new tournament and click this button to re-add all teams from the previous one.',
      mainTabs: 'Main Sections',
      mainTabs1: 'Teams: add or remove teams before drawing the first round (or anytime for supermelee).',
      mainTabs2: 'Current games: view current round matchups, enter scores, and draw subsequent rounds.',
      mainTabs3: 'Results: browse all completed games with round filters (R1, R2, R3, All).',
      mainTabs4: 'Ranking: standings table with sorting by wins, Buchholz, and points.',
      preferences: 'Preferences',
      preferencesIntro:
        'Access preferences via the "Preferences" button at the bottom of the page, or through "Additional settings" before starting the tournament.',
      preferences1: 'All settings are optional and have sensible defaults.',
      preferences2: 'Technical score: adjust the score awarded for walkovers (default 13:7).',
      preferences3: 'Maximum score: change the game-ending score (useful for club formats like 31-point games).',
      preferences4: 'Playoff teams and lane numbering can also be configured here.',
      drawResults: 'Draw and Results',
      drawResultsText:
        'The "Draw N Round" button generates opponents for each subsequent round. The app doesn\'t ask for the total number of rounds upfront. In the Swiss system, be cautious with small team counts and many rounds — at some point the algorithm won\'t be able to satisfy all pairing conditions. This could happen, for example, with 7 rounds and 12 teams or 5 rounds and 8 teams.',
      drawResults1:
        'Each game shows both teams, their assigned lane, and input fields for scores. Enter scores and click "Save results" to proceed.',
      drawResults2: 'The lane number is displayed between teams. Lane assignments are random (except in playoffs).',
      drawResults3:
        '"Restore previous round" — if you make a mistake entering results, use this button to undo the last round. This only works for the most recently completed round.',
      ranking: 'Ranking',
      rankingSwiss1: 'Standings for the Swiss system are determined by these criteria:',
      rankingSwiss2: 'Number of wins.',
      rankingSwiss3: "Buchholz coefficient (sum of opponents' wins).",
      rankingSwiss4: "Minor Buchholz coefficient (sum of opponents' Buchholz).",
      rankingSwiss5: 'Points difference (scored vs. conceded).',
      rankingRound1: 'Standings for the round-robin system are determined by:',
      rankingRound2: 'Number of wins.',
      rankingRound3: 'Head-to-head result (if teams played each other).',
      rankingRound4: 'Overall point difference across all games.',
      rankingRound5: 'If three or more teams are tied, ranking is determined by:',
      rankingRound6: 'Wins within the group of tied teams.',
      rankingRound7: 'Point difference within the group of tied teams.',
      rankingRound8: 'Overall point difference across all games.',
      playOff: 'Playoffs',
      playOffText:
        'To enable playoffs, check "Play-off after Swiss rounds" in the tournament setup before starting. You can configure how many teams advance in Preferences. The app supports up to 64 teams in a knockout bracket.',
      playOffText2:
        'Once the playoff starts, a bracket view is available on the "Current Games" tab via the "Show playoff bracket" button. If you check "Also play Tournament B", a new tournament is automatically created for teams that didn\'t advance to playoffs.',
      roundSystem: 'Round-Robin System',
      roundSystemText:
        'When selecting "Groups (Round)" system, you can split teams into groups. Choose the number of teams per group in the setup — the system automatically calculates the number of groups.',
      roundSystemText1:
        'Best results are achieved when all groups have equal numbers of teams. If no group split is needed, set the group size equal to the total number of teams.',
      remoteControl: 'Sharing & Remote Access',
      remoteControl1:
        'One of the key features of the app is the ability for anyone to view current draws and results in real-time. Use the toolbar at the top of the page:',
      remoteControl2:
        '"Show tournament links" — generates a QR code and a shareable link. Send it to participants or display it at the venue.',
      remoteControl3:
        '"Write a message" — post a message visible to all viewers (e.g., tournament schedule, lunch break timing, or announcements).',
      remoteView: 'Remote Viewing',
      remoteViewText: 'With the shared link, viewers (players, fans) can see:',
      remoteView1: "Organizer's message at the top (if set).",
      remoteView2: 'Current games with scores.',
      remoteView3: 'All previous round results.',
      remoteView4: 'Full ranking table.',
      finishedTournament: 'Completed Tournament',
      finishedTournament1:
        'After the tournament is completed, final results appear on the "Ranking" tab with the tournament result table.',
      finishedTournament2:
        'You can archive the tournament — results remain accessible from the user menu under "Archived tournaments" until deleted.',
      finishedTournament3: 'Use "Copy results" to share final standings as text via messenger or email.',
      tournamentsControlsTitle: 'Managing Multiple Tournaments',
      tournamentsControls1:
        'Add a new tournament from the user menu (click your email in the top-right corner). Select "Add new tournament" from the dropdown.',
      tournamentsControls2:
        'Switch between active tournaments using the navigation. Archived tournaments are available separately via "Archived tournaments" in the menu.',
      tournamentsControls3:
        'You can manage up to 10 tournaments simultaneously. Delete or archive outdated ones as needed.',
      thanksMessage: 'Thank you for your time. Send questions, comments, and suggestions to',
      thanksMessagePost: 'email',
      thanksMessageOr: 'or',
      thanksMessageMessenger: 'messenger',
      pressBtnSeeInterface: 'Press this button to see the interface:',
      training: {
        title: 'Training',
        description:
          'This module is designed to track the training process. It allows you to create exercises for training, record, and analyze their results.',
        exerciseListTitle: 'Exercise List Page',
        exerciseList: {
          add: 'Go to the add new exercise page',
          list: 'List of created exercises',
          delete: 'Delete exercise',
          viewResults: 'View all results of a specific exercise',
          startTraining: 'Start training for a specific exercise',
        },
        addExerciseTitle: 'Add New Exercise Page',
        addExerciseDescription:
          'Typically, any exercise consists of a certain number of throws at a certain number of distances. The combination of these options allows you to create any training exercise variation.',
        addExercise: {
          back: 'Return to exercise list',
          name: 'Exercise name, as it will appear in the general list',
          distances: 'Distances for which the exercise will be performed',
          throws: 'Number of throws for each distance',
          series:
            'Here you can name each series. Thus, you can perform a comprehensive exercise. As an example – a shooting competition. In fact, you are performing three different exercises. Example of creation – at the end of the page.',
          scoring:
            'How each throw will be evaluated. You can choose a logical value (hit/miss, set/not set) or score each throw with a certain number of points.',
          scenario:
            'If you choose a logical value, the option to select a training scenario becomes available. If positive - all throws will be marked as successful by default, and vice versa.',
          order:
            'When there are multiple distances and a certain number of throws for each, you can conduct training in different sequences. First, throw a series of, for example, 10 throws at one distance, then 10 throws at the next, and so on. Or you can throw one throw at each distance in rotation.',
        },
        trainingProcessTitle: 'Training Process Page',
        trainingProcess: {
          inputResult: 'Enter throw result here',
          navigation: 'Navigation through throws or distances',
          finish: 'When all throws are completed, to finish the training and calculate the result, press here',
        },
        exerciseResultsTitle: 'Exercise Results Page',
        exerciseResults: {
          average:
            'The average result for the exercise over the entire history of records (can be either a percentage or a specific number, depending on the selected throw result value)',
          byDistance: 'Results for each distance separately',
          history: 'Results of each training session in chronological order',
        },
        exampleCreation: 'Example of creating a classical shooting exercise',
        exampleCreationText:
          'With these settings, you will create an exercise for recording training results according to the rules of classical shooting.',
      },
      stat: {
        title: 'Statistics',
        description: 'Allows you to count statistics in pétanque games and analyze data according to various criteria.',
        settings: {
          title: 'Game Settings',
          description:
            'The main settings require only specifying the game name and the game format (triplet, doublet, or têt). It is also recommended to specify the players.',
          gameName: 'The name of the game as it will appear in the list.',
          tags: 'Game tags. These are keywords that can describe the game and allow future filtering of data. For example, you might want to know how you played in games of a specific tournament or analyze statistics for different fields. You can manage tags by clicking the "Show tags" button.',
          mode: 'Mode. The fast mode was created to make it more comfortable to record statistics during the game as a player. It allows you to spend less time looking at your phone. More details below.',
          showStats:
            'If you check this box, the statistics will be displayed during the game. This allows decisions to be made regarding player substitutions. If you are recording statistics as a player, this could influence your decisions during the game.',
          scoringSystem:
            'Select a scoring system. Currently, you can use the simple or French system. At this stage, analysis is available only for the simple system.',
          scenario:
            'Game scenario. Here you can specify which throwing result will be shown by default. If you are playing as one of the top world players, use the positive scenario.',
        },
        tracking: {
          title: 'Tracking',
          distance:
            'For each round, you can specify the distance players are playing. It is not mandatory, but it allows you to filter data by distance during analysis. This sets the distance for all throws in this round. If you want to change the distance for a specific throw, see point 7.',
          teamStats:
            'Current team statistics as percentages and overall (only displayed if "Coach" checkbox is selected).',
          playerStats: 'Current player statistics (only displayed if "Coach" checkbox is selected).',
          shotsSeries:
            "Player's shot series (green - successful shot, red - unsuccessful shot, blue - caro (only in tie)).",
          roundPoints: 'How many points the team won in the played round.',
          highlight: 'A green exclamation mark shows a caro in a tie or point where 2 balls were played.',
          contextMenu:
            'Context menu for a throw. Appears when pressing the throw result for more than half a second. Additional shot effectiveness can be specified (for a successful shot, this means a caro, for a miss it means a knocked-out ball, for a point, it could mean either a knocked-out ball or a moved cochonnet with more than one ball played). You can also delete the throw (relevant for fast play mode when a cochonnet was knocked out and not all balls were thrown). Also, you can change the distance of a specific throw (relevant when the cochonnet was moved during the game).',
          shotType: 'The type and result of the shot. This can be toggled with a simple press.',
          negativeHighlight:
            'A red exclamation mark indicates a knocked-out ball or a foreign ball played after the throw.',
          navigation: 'Navigation between rounds.',
        },
        result: {
          title: 'Game Result',
          finalScore: 'Game result.',
          teamPerformance: 'Final team performance.',
          shotsPerRound:
            'Successful shots per round (accurate only when you specify the successful shot as one that "played"). This is a rather specific metric that may not be useful for everyone.',
          roundPoints: 'How many points the team won in each round.',
          playerSeries: 'Series of throws for each player.',
          playerPerformance: 'Individual player performance by the end of the game.',
        },
        modes: {
          title: 'Modes and Scenarios',
          simple: 'Simple mode. The first click makes the throw active. This is counted as a performed throw.',
          fastModePositive:
            'Fast mode. At the beginning of the round, all throws are recorded as performed. Below is fast mode with a POSITIVE scenario. By default, all throws are successful.',
          fastModeNegative: 'Here is the NEGATIVE scenario. Currently, this scenario is winning in Ukraine.',
          fastModeDescription:
            'Fast mode allows you to track statistics without being distracted by recording EVERY throw. It was made to make it easier to enter data during the game.',
        },
        tags: {
          title: 'Tags',
          description: 'Tags are keywords that describe games. You can create and delete tags.',
          usage:
            "For each game, you can add an unlimited number of tags (this can be done either at the start of the game or later when the game is already recorded). This allows you to filter games by these tags and analyze statistics accordingly. For example, you could add the tag 'Hard Court' and then look at statistics only on hard courts. The possibilities are endless.",
        },
        substitutions: {
          title: 'Substitutions',
          description:
            "During the game, you can make a player substitution. Hover over the player's name, and a button will appear that opens a modal window where you can enter the new player's name.",
        },
        archive: {
          title: 'Archive',
          description: 'This page stores all recorded games.',
          filterTags: 'Tags that can be used to filter games.',
          gameName: 'Game name. You can delete the game, but you cannot change its name.',
          recordDate: 'Date when the game was recorded.',
          addedTags: 'Tags added to the game.',
          addTag: 'Option to add a new tag to the game after it has been recorded.',
        },
        analysis: {
          title: 'Analysis',
          description: 'In this section, you can view detailed statistics for a specific player.',
          selectPlayer: 'Select a player to view their statistics.',
          selectPeriod: 'Select the period for which statistics will be displayed.',
          selectFormat: 'Select the game format for the statistics.',
          selectTag: 'Select the tag to filter the statistics.',
          selectDistance: 'Select the distance for which statistics will be displayed.',
          result: 'The result based on the selected filters.',
          charts: 'Charts showing the dynamics of statistics, separately for points and shots.',
        },
      },
    },
  },
};
