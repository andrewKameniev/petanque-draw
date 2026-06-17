<template>
  <Navbar @open-menu="menuOpen = !menuOpen" />
  <MenuComponent :active="menuOpen" @closeMenu="menuOpen = false" />

  <div class="docs">
    <!-- Mobile nav toggle -->
    <button class="docs__mobile-toggle" @click="navOpen = !navOpen">
      <Menu :size="20" v-if="!navOpen" />
      <X :size="20" v-else />
      <span>{{ sections.find((s) => s.id === activeSection)?.label || $t('docs.title') }}</span>
      <ChevronDown :size="16" :class="{ 'docs__chevron--open': navOpen }" />
    </button>

    <DocsSidebar
      :open="navOpen"
      :activeSection="activeSection"
      :searchQuery="searchQuery"
      @update:searchQuery="searchQuery = $event"
      @navigate="scrollToSection"
    />

    <!-- Main content -->
    <main class="docs__content" ref="content">
      <!-- Search results -->
      <template v-if="searchQuery && searchResults.length">
        <section class="docs__section">
          <h2 class="docs__title">{{ $t('docs.search') }} "{{ searchQuery }}"</h2>
          <div class="docs__search-results">
            <a
              v-for="result in searchResults"
              :key="result.id"
              href="#"
              class="docs__search-result"
              @click.prevent="
                searchQuery = '';
                scrollToSection(result.id);
              "
            >
              <component :is="result.icon" :size="18" />
              <div>
                <strong>{{ result.label }}</strong>
                <span>{{ result.preview }}</span>
              </div>
            </a>
          </div>
        </section>
      </template>

      <template v-else-if="searchQuery && !searchResults.length">
        <section class="docs__section">
          <h2 class="docs__title">{{ $t('docs.search') }} "{{ searchQuery }}"</h2>
          <p class="docs__empty">{{ $t('teams.noResults') }}</p>
        </section>
      </template>

      <template v-else>
        <!-- Glossary -->
        <section id="glossary" class="docs__section" ref="glossary">
          <h2 class="docs__title">{{ $t('docs.glossary.title') }}</h2>
          <div class="docs__glossary-grid">
            <div
              v-for="key in glossaryKeys"
              :key="key"
              class="docs__glossary-card"
              :class="[`docs__glossary-card--${key}`, glossaryLink(key) ? 'docs__glossary-card--clickable' : '']"
              @click="glossaryLink(key) && scrollToSection(glossaryLink(key))"
            >
              <span class="docs__glossary-term">{{ $t(`docs.glossary.${key}.term`) }}</span>
              <span class="docs__glossary-desc">{{ $t(`docs.glossary.${key}.short`) }}</span>
            </div>
          </div>
        </section>

        <!-- Swiss System -->
        <section id="swiss" class="docs__section" ref="swiss">
          <div class="docs__section-header">
            <Shuffle :size="24" class="docs__section-icon docs__section-icon--purple" />
            <div>
              <h2 class="docs__title">{{ $t('docs.swissSystem.title') }}</h2>
              <p class="docs__subtitle">{{ $t('docs.swissSystem.subtitle') }}</p>
            </div>
          </div>
          <p class="docs__intro">{{ $t('docs.swissSystem.intro') }}</p>

          <div class="docs__card">
            <h3>{{ $t('docs.swissSystem.rules.title') }}</h3>
            <ul class="docs__list">
              <li>{{ $t('docs.swissSystem.rules.noRematch') }}</li>
              <li>{{ $t('docs.swissSystem.rules.equalWins') }}</li>
              <li>{{ $t('docs.swissSystem.rules.pairing') }}</li>
              <li>{{ $t('docs.swissSystem.rules.odd') }}</li>
            </ul>
          </div>

          <div class="docs__card">
            <h3>{{ $t('docs.swissSystem.maxRounds.title') }}</h3>
            <p>{{ $t('docs.swissSystem.maxRounds.explanation') }}</p>
            <table class="docs__table">
              <thead>
                <tr>
                  <th>{{ $t('docs.swissSystem.maxRounds.teams') }}</th>
                  <th>{{ $t('docs.swissSystem.maxRounds.rounds') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in maxRoundsTable" :key="row.teams">
                  <td>{{ row.teams }}</td>
                  <td>{{ row.rounds }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="docs__card">
            <h3>{{ $t('docs.swissSystem.firstRound.title') }}</h3>
            <ul class="docs__list">
              <li>{{ $t('docs.swissSystem.firstRound.noRating') }}</li>
              <li>{{ $t('docs.swissSystem.firstRound.withRating') }}</li>
            </ul>
          </div>

          <div class="docs__card">
            <h3>{{ $t('docs.swissSystem.subsequentRounds.title') }}</h3>
            <ol class="docs__list docs__list--ordered">
              <li>{{ $t('docs.swissSystem.subsequentRounds.step1') }}</li>
              <li>{{ $t('docs.swissSystem.subsequentRounds.step2') }}</li>
              <li>{{ $t('docs.swissSystem.subsequentRounds.step3') }}</li>
              <li>{{ $t('docs.swissSystem.subsequentRounds.step4') }}</li>
              <li>{{ $t('docs.swissSystem.subsequentRounds.step5') }}</li>
              <li>{{ $t('docs.swissSystem.subsequentRounds.step6') }}</li>
            </ol>
          </div>

          <div class="docs__card">
            <h3>{{ $t('docs.swissSystem.bye.title') }}</h3>
            <p>{{ $t('docs.swissSystem.bye.text') }}</p>
          </div>

          <!-- Swiss Calculator -->
          <div class="docs__card docs__card--highlight" id="calculator" ref="calculator">
            <h3><Calculator :size="18" /> {{ $t('docs.swissSystem.calculator.title') }}</h3>
            <p>{{ $t('docs.swissSystem.calculator.description') }}</p>
            <div class="docs__calculator">
              <label>{{ $t('docs.swissSystem.calculator.teamsLabel') }}</label>
              <input type="number" v-model.number="calcTeams" min="4" max="200" class="docs__calc-input" />
              <div class="docs__calc-result" v-if="calcTeams >= 4">
                {{ $t('docs.swissSystem.calculator.result', { rounds: calcRecommended, max: calcMax }) }}
              </div>
            </div>
          </div>
        </section>

        <!-- Groups -->
        <section id="groups" class="docs__section" ref="groups">
          <div class="docs__section-header">
            <Grid3x3 :size="24" class="docs__section-icon docs__section-icon--blue" />
            <div>
              <h2 class="docs__title">{{ $t('docs.groupsSystem.title') }}</h2>
              <p class="docs__subtitle">{{ $t('docs.groupsSystem.subtitle') }}</p>
            </div>
          </div>
          <p class="docs__intro">{{ $t('docs.groupsSystem.intro') }}</p>

          <div class="docs__card">
            <h3>{{ $t('docs.groupsSystem.formation.title') }}</h3>
            <ul class="docs__list">
              <li>{{ $t('docs.groupsSystem.formation.withRating') }}</li>
              <li>{{ $t('docs.groupsSystem.formation.noRating') }}</li>
              <li>{{ $t('docs.groupsSystem.formation.special') }}</li>
            </ul>
          </div>

          <div class="docs__card">
            <h3>{{ $t('docs.groupsSystem.scheduling.title') }}</h3>
            <p>{{ $t('docs.groupsSystem.scheduling.text') }}</p>
          </div>

          <div class="docs__card">
            <h3>{{ $t('docs.groupsSystem.ranking.title') }}</h3>
            <code class="docs__code">{{ $t('docs.groupsSystem.ranking.criteria') }}</code>
            <p>{{ $t('docs.groupsSystem.ranking.headToHead') }}</p>
          </div>

          <div class="docs__card">
            <h3>{{ $t('docs.groupsSystem.after.title') }}</h3>
            <p>{{ $t('docs.groupsSystem.after.text') }}</p>
          </div>
        </section>

        <!-- Barrage -->
        <section id="barrage" class="docs__section" ref="barrage">
          <div class="docs__section-header">
            <Users :size="24" class="docs__section-icon docs__section-icon--amber" />
            <div>
              <h2 class="docs__title">{{ $t('docs.barrageSystem.title') }}</h2>
              <p class="docs__subtitle">{{ $t('docs.barrageSystem.subtitle') }}</p>
            </div>
          </div>
          <p class="docs__intro">{{ $t('docs.barrageSystem.intro') }}</p>

          <div class="docs__card">
            <h3>{{ $t('docs.barrageSystem.standalone.title') }}</h3>
            <p>{{ $t('docs.barrageSystem.standalone.text') }}</p>
          </div>

          <div class="docs__card">
            <h3>{{ $t('docs.barrageSystem.withinSwiss.title') }}</h3>
            <ol class="docs__list docs__list--ordered">
              <li>{{ $t('docs.barrageSystem.withinSwiss.step1') }}</li>
              <li>{{ $t('docs.barrageSystem.withinSwiss.step2') }}</li>
              <li>{{ $t('docs.barrageSystem.withinSwiss.step3') }}</li>
              <li>{{ $t('docs.barrageSystem.withinSwiss.step4') }}</li>
            </ol>
          </div>

          <div class="docs__card">
            <h3>{{ $t('docs.barrageSystem.qualification.title') }}</h3>
            <p>{{ $t('docs.barrageSystem.qualification.text') }}</p>
          </div>

          <div class="docs__card">
            <h3>{{ $t('docs.barrageSystem.ranking.title') }}</h3>
            <p>{{ $t('docs.barrageSystem.ranking.text') }}</p>
          </div>
        </section>

        <!-- Supermele -->
        <section id="supermele" class="docs__section" ref="supermele">
          <div class="docs__section-header">
            <Shuffle :size="24" class="docs__section-icon docs__section-icon--green" />
            <div>
              <h2 class="docs__title">{{ $t('docs.supermeleSystem.title') }}</h2>
              <p class="docs__subtitle">{{ $t('docs.supermeleSystem.subtitle') }}</p>
            </div>
          </div>
          <p class="docs__intro">{{ $t('docs.supermeleSystem.intro') }}</p>

          <div class="docs__card">
            <h3>{{ $t('docs.supermeleSystem.howItWorks.title') }}</h3>
            <ul class="docs__list">
              <li>{{ $t('docs.supermeleSystem.howItWorks.individual') }}</li>
              <li>{{ $t('docs.supermeleSystem.howItWorks.shuffle') }}</li>
              <li>{{ $t('docs.supermeleSystem.howItWorks.optimal') }}</li>
              <li>{{ $t('docs.supermeleSystem.howItWorks.avoidRepeat') }}</li>
            </ul>
          </div>

          <div class="docs__card">
            <h3>{{ $t('docs.supermeleSystem.math.title') }}</h3>
            <p>{{ $t('docs.supermeleSystem.math.text') }}</p>
            <code class="docs__code">{{ $t('docs.supermeleSystem.math.example') }}</code>
          </div>

          <div class="docs__card">
            <h3>{{ $t('docs.supermeleSystem.ranking.title') }}</h3>
            <p>{{ $t('docs.supermeleSystem.ranking.text') }}</p>
          </div>
        </section>

        <!-- TIR -->
        <section id="tir" class="docs__section" ref="tir">
          <div class="docs__section-header">
            <Target :size="24" class="docs__section-icon docs__section-icon--green" />
            <div>
              <h2 class="docs__title">{{ $t('docs.tirSystem.title') }}</h2>
              <p class="docs__subtitle">{{ $t('docs.tirSystem.subtitle') }}</p>
            </div>
          </div>
          <p class="docs__intro">{{ $t('docs.tirSystem.intro') }}</p>

          <div class="docs__card">
            <h3>{{ $t('docs.tirSystem.structure.title') }}</h3>
            <ul class="docs__list">
              <li>{{ $t('docs.tirSystem.structure.ateliers') }}</li>
              <li>{{ $t('docs.tirSystem.structure.distances') }}</li>
              <li>{{ $t('docs.tirSystem.structure.maxSenior') }}</li>
              <li>{{ $t('docs.tirSystem.structure.maxJunior') }}</li>
            </ul>
          </div>

          <div class="docs__card docs__card--tir-scoring">
            <h3>{{ $t('docs.tirSystem.scoring.title') }}</h3>
            <div class="docs__tir-grid">
              <div class="docs__tir-score docs__tir-score--carreau">
                <span class="docs__tir-pts">5</span>
                <span>{{ $t('docs.tirSystem.scoring.carreau') }}</span>
              </div>
              <div class="docs__tir-score docs__tir-score--reussi">
                <span class="docs__tir-pts">3</span>
                <span>{{ $t('docs.tirSystem.scoring.reussi') }}</span>
              </div>
              <div class="docs__tir-score docs__tir-score--touche">
                <span class="docs__tir-pts">1</span>
                <span>{{ $t('docs.tirSystem.scoring.touche') }}</span>
              </div>
              <div class="docs__tir-score docs__tir-score--manque">
                <span class="docs__tir-pts">0</span>
                <span>{{ $t('docs.tirSystem.scoring.manque') }}</span>
              </div>
            </div>
          </div>

          <div class="docs__card">
            <h3>{{ $t('docs.tirSystem.modes.title') }}</h3>
            <ul class="docs__list">
              <li>{{ $t('docs.tirSystem.modes.byParticipant') }}</li>
              <li>{{ $t('docs.tirSystem.modes.byAtelier') }}</li>
            </ul>
          </div>

          <div class="docs__card">
            <h3>{{ $t('docs.tirSystem.rounds.title') }}</h3>
            <p>{{ $t('docs.tirSystem.rounds.text') }}</p>
          </div>

          <div class="docs__card">
            <h3>{{ $t('docs.tirSystem.ranking.title') }}</h3>
            <p>{{ $t('docs.tirSystem.ranking.text') }}</p>
          </div>
        </section>

        <!-- Playoff -->
        <section id="playoff" class="docs__section" ref="playoff">
          <div class="docs__section-header">
            <Trophy :size="24" class="docs__section-icon docs__section-icon--gold" />
            <div>
              <h2 class="docs__title">{{ $t('docs.playoffSystem.title') }}</h2>
              <p class="docs__subtitle">{{ $t('docs.playoffSystem.subtitle') }}</p>
            </div>
          </div>
          <p class="docs__intro">{{ $t('docs.playoffSystem.intro') }}</p>

          <div class="docs__card">
            <h3>{{ $t('docs.playoffSystem.seeding.title') }}</h3>
            <p>{{ $t('docs.playoffSystem.seeding.text') }}</p>
          </div>

          <div class="docs__card">
            <h3>{{ $t('docs.playoffSystem.bracket.title') }}</h3>
            <p>{{ $t('docs.playoffSystem.bracket.text') }}</p>
            <div class="docs__bracket-visual">
              <div class="docs__bracket-match">
                <span class="docs__bracket-seed">1</span> vs <span class="docs__bracket-seed">8</span>
              </div>
              <div class="docs__bracket-match">
                <span class="docs__bracket-seed">4</span> vs <span class="docs__bracket-seed">5</span>
              </div>
              <div class="docs__bracket-match">
                <span class="docs__bracket-seed">3</span> vs <span class="docs__bracket-seed">6</span>
              </div>
              <div class="docs__bracket-match">
                <span class="docs__bracket-seed">2</span> vs <span class="docs__bracket-seed">7</span>
              </div>
            </div>
          </div>

          <div class="docs__card">
            <h3>{{ $t('docs.playoffSystem.finalRanking.title') }}</h3>
            <ol class="docs__list docs__list--ordered">
              <li>{{ $t('docs.playoffSystem.finalRanking.first') }}</li>
              <li>{{ $t('docs.playoffSystem.finalRanking.second') }}</li>
              <li>{{ $t('docs.playoffSystem.finalRanking.third') }}</li>
              <li>{{ $t('docs.playoffSystem.finalRanking.fourth') }}</li>
              <li>{{ $t('docs.playoffSystem.finalRanking.rest') }}</li>
            </ol>
          </div>
        </section>

        <!-- Cadrage -->
        <section id="cadrage" class="docs__section" ref="cadrage">
          <div class="docs__section-header">
            <GitBranch :size="24" class="docs__section-icon docs__section-icon--amber" />
            <div>
              <h2 class="docs__title">{{ $t('docs.cadrageSystem.title') }}</h2>
              <p class="docs__subtitle">{{ $t('docs.cadrageSystem.subtitle') }}</p>
            </div>
          </div>
          <p class="docs__intro">{{ $t('docs.cadrageSystem.intro') }}</p>

          <div class="docs__card docs__card--example">
            <h3>{{ $t('docs.cadrageSystem.example.title') }}</h3>
            <div class="docs__cadrage-flow">
              <div class="docs__cadrage-step docs__cadrage-step--direct">
                <span class="docs__cadrage-badge">1-8</span>
                {{ $t('docs.cadrageSystem.example.direct') }}
              </div>
              <div class="docs__cadrage-step docs__cadrage-step--cadrage">
                <span class="docs__cadrage-badge">9-24</span>
                {{ $t('docs.cadrageSystem.example.cadrage') }}
              </div>
              <div class="docs__cadrage-step docs__cadrage-step--eliminated">
                <span class="docs__cadrage-badge">25-50</span>
                {{ $t('docs.cadrageSystem.example.eliminated') }}
              </div>
            </div>
          </div>

          <div class="docs__card">
            <h3>{{ $t('docs.cadrageSystem.pairing.title') }}</h3>
            <p>{{ $t('docs.cadrageSystem.pairing.text') }}</p>
          </div>

          <div class="docs__card">
            <h3>{{ $t('docs.cadrageSystem.math.title') }}</h3>
            <ul class="docs__list">
              <li>{{ $t('docs.cadrageSystem.math.directSeeds') }}</li>
              <li>{{ $t('docs.cadrageSystem.math.pool') }}</li>
              <li>{{ $t('docs.cadrageSystem.math.winners') }}</li>
            </ul>
          </div>
        </section>

        <!-- Swiss + Playoff -->
        <section id="swiss-playoff" class="docs__section" ref="swissPlayoff">
          <div class="docs__section-header">
            <Layers :size="24" class="docs__section-icon docs__section-icon--purple" />
            <div>
              <h2 class="docs__title">{{ $t('docs.swissPlayoff.title') }}</h2>
              <p class="docs__subtitle">{{ $t('docs.swissPlayoff.subtitle') }}</p>
            </div>
          </div>
          <p class="docs__intro">{{ $t('docs.swissPlayoff.intro') }}</p>

          <div class="docs__card">
            <h3>{{ $t('docs.swissPlayoff.flow.title') }}</h3>
            <div class="docs__flow">
              <div class="docs__flow-step">
                <span class="docs__flow-num">1</span>
                {{ $t('docs.swissPlayoff.flow.step1') }}
              </div>
              <div class="docs__flow-arrow"><ChevronDown :size="16" /></div>
              <div class="docs__flow-step">
                <span class="docs__flow-num">2</span>
                {{ $t('docs.swissPlayoff.flow.step2') }}
              </div>
              <div class="docs__flow-arrow"><ChevronDown :size="16" /></div>
              <div class="docs__flow-step">
                <span class="docs__flow-num">3</span>
                {{ $t('docs.swissPlayoff.flow.step3') }}
              </div>
            </div>
          </div>

          <div class="docs__card">
            <h3>{{ $t('docs.swissPlayoff.options.title') }}</h3>
            <ul class="docs__list">
              <li>{{ $t('docs.swissPlayoff.options.cadrage') }}</li>
              <li>{{ $t('docs.swissPlayoff.options.tournamentB') }}</li>
            </ul>
          </div>
        </section>

        <!-- Swiss + Barrage + Playoff -->
        <section id="swiss-barrage-playoff" class="docs__section" ref="swissBarragePlayoff">
          <div class="docs__section-header">
            <Layers :size="24" class="docs__section-icon docs__section-icon--blue" />
            <div>
              <h2 class="docs__title">{{ $t('docs.swissBarragePlayoff.title') }}</h2>
              <p class="docs__subtitle">{{ $t('docs.swissBarragePlayoff.subtitle') }}</p>
            </div>
          </div>
          <p class="docs__intro">{{ $t('docs.swissBarragePlayoff.intro') }}</p>

          <div class="docs__card">
            <h3>{{ $t('docs.swissBarragePlayoff.flow.title') }}</h3>
            <div class="docs__flow">
              <div class="docs__flow-step">
                <span class="docs__flow-num">1</span>
                {{ $t('docs.swissBarragePlayoff.flow.step1') }}
              </div>
              <div class="docs__flow-arrow"><ChevronDown :size="16" /></div>
              <div class="docs__flow-step">
                <span class="docs__flow-num">2</span>
                {{ $t('docs.swissBarragePlayoff.flow.step2') }}
              </div>
              <div class="docs__flow-arrow"><ChevronDown :size="16" /></div>
              <div class="docs__flow-step">
                <span class="docs__flow-num">3</span>
                {{ $t('docs.swissBarragePlayoff.flow.step3') }}
              </div>
            </div>
          </div>

          <div class="docs__card">
            <h3>{{ $t('docs.swissBarragePlayoff.whenToUse.title') }}</h3>
            <p>{{ $t('docs.swissBarragePlayoff.whenToUse.text') }}</p>
          </div>
        </section>

        <!-- Tournament B -->
        <section id="tournament-b" class="docs__section" ref="tournamentB">
          <div class="docs__section-header">
            <Copy :size="24" class="docs__section-icon docs__section-icon--blue" />
            <div>
              <h2 class="docs__title">{{ $t('docs.tournamentB.title') }}</h2>
              <p class="docs__subtitle">{{ $t('docs.tournamentB.subtitle') }}</p>
            </div>
          </div>
          <p class="docs__intro">{{ $t('docs.tournamentB.intro') }}</p>

          <div class="docs__card">
            <h3>{{ $t('docs.tournamentB.howItWorks.title') }}</h3>
            <ol class="docs__list docs__list--ordered">
              <li>{{ $t('docs.tournamentB.howItWorks.step1') }}</li>
              <li>{{ $t('docs.tournamentB.howItWorks.step2') }}</li>
              <li>{{ $t('docs.tournamentB.howItWorks.step3') }}</li>
              <li>{{ $t('docs.tournamentB.howItWorks.step4') }}</li>
            </ol>
          </div>
        </section>

        <!-- Rankings -->
        <section id="rankings" class="docs__section" ref="rankings">
          <div class="docs__section-header">
            <BarChart3 :size="24" class="docs__section-icon docs__section-icon--purple" />
            <div>
              <h2 class="docs__title">{{ $t('docs.rankingAlgorithms.title') }}</h2>
              <p class="docs__subtitle">{{ $t('docs.rankingAlgorithms.subtitle') }}</p>
            </div>
          </div>

          <div class="docs__rankings-grid">
            <div class="docs__ranking-card" v-for="sys in rankingSystems" :key="sys">
              <h4>{{ $t(`docs.rankingAlgorithms.${sys}.title`) }}</h4>
              <code class="docs__code">{{ $t(`docs.rankingAlgorithms.${sys}.criteria`) }}</code>
              <p v-if="$te(`docs.rankingAlgorithms.${sys}.note`)">
                {{ $t(`docs.rankingAlgorithms.${sys}.note`) }}
              </p>
            </div>
          </div>

          <div class="docs__card">
            <h3>{{ $t('docs.rankingAlgorithms.buchholz.title') }}</h3>
            <p>{{ $t('docs.rankingAlgorithms.buchholz.text') }}</p>
          </div>

          <div class="docs__card">
            <h3>{{ $t('docs.rankingAlgorithms.lanes.title') }}</h3>
            <p>{{ $t('docs.rankingAlgorithms.lanes.text') }}</p>
          </div>
        </section>

        <!-- FAQ -->
        <section id="faq" class="docs__section" ref="faq">
          <div class="docs__section-header">
            <HelpCircle :size="24" class="docs__section-icon docs__section-icon--blue" />
            <div>
              <h2 class="docs__title">{{ $t('docs.faqSection.title') }}</h2>
            </div>
          </div>

          <div class="docs__faq">
            <div v-for="n in 8" :key="n" class="docs__faq-item" :class="{ 'docs__faq-item--open': faqOpen === n }">
              <button class="docs__faq-question" @click="faqOpen = faqOpen === n ? null : n">
                <span>{{ $t(`docs.faqSection.items.q${n}`) }}</span>
                <ChevronDown :size="16" />
              </button>
              <div class="docs__faq-answer">
                <p>{{ $t(`docs.faqSection.items.a${n}`) }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Back to top -->
        <button class="docs__back-top" v-show="showBackTop" @click="scrollToTop">
          <ChevronUp :size="20" />
        </button>
      </template>
    </main>
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue';
import MenuComponent from '@/components/Menu.vue';
import DocsSidebar from '@/components/docs/DocsSidebar.vue';
import {
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Shuffle,
  Grid3x3,
  Users,
  Target,
  Trophy,
  GitBranch,
  Layers,
  Copy,
  BarChart3,
  HelpCircle,
  BookOpen,
  Calculator,
} from 'lucide-vue-next';

export default {
  name: 'Docs',
  components: {
    Navbar,
    MenuComponent,
    DocsSidebar,
    Menu,
    X,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    Shuffle,
    Grid3x3,
    Users,
    Target,
    Trophy,
    GitBranch,
    Layers,
    Copy,
    BarChart3,
    HelpCircle,
    BookOpen,
    Calculator,
  },
  data() {
    return {
      menuOpen: false,
      navOpen: false,
      searchQuery: '',
      activeSection: 'glossary',
      faqOpen: null,
      calcTeams: 16,
      showBackTop: false,
      observer: null,
    };
  },
  computed: {
    glossaryKeys() {
      return [
        'swiss',
        'barrage',
        'cadrage',
        'playoff',
        'tir',
        'supermele',
        'buchholz',
        'technical',
        'carreau',
        'reussi',
        'touche',
        'manque',
        'lane',
        'cochonnet',
      ];
    },
    maxRoundsTable() {
      return [
        { teams: 8, rounds: 4 },
        { teams: 12, rounds: 6 },
        { teams: 16, rounds: 8 },
        { teams: 24, rounds: 12 },
        { teams: 50, rounds: 25 },
      ];
    },
    rankingSystems() {
      return ['swiss', 'groups', 'supermele', 'barrage', 'tir'];
    },
    calcMax() {
      return Math.round(this.calcTeams / 2);
    },
    calcRecommended() {
      return Math.max(3, Math.round(Math.log2(this.calcTeams)));
    },
    sections() {
      return [
        { id: 'glossary', label: this.$t('docs.quickRef'), icon: BookOpen },
        { id: 'swiss', label: this.$t('docs.swissSystem.title'), icon: Shuffle },
        { id: 'groups', label: this.$t('docs.groupsSystem.title'), icon: Grid3x3 },
        { id: 'barrage', label: this.$t('docs.barrageSystem.title'), icon: Users },
        { id: 'supermele', label: this.$t('docs.supermeleSystem.title'), icon: Shuffle },
        { id: 'tir', label: 'TIR', icon: Target },
        { id: 'playoff', label: this.$t('docs.playoffSystem.title'), icon: Trophy },
        { id: 'cadrage', label: this.$t('docs.cadrageSystem.title'), icon: GitBranch },
        { id: 'swiss-playoff', label: this.$t('docs.swissPlayoff.title'), icon: Layers },
        { id: 'swiss-barrage-playoff', label: this.$t('docs.swissBarragePlayoff.title'), icon: Layers },
        { id: 'tournament-b', label: this.$t('docs.tournamentB.title'), icon: Copy },
        { id: 'rankings', label: this.$t('docs.rankingAlgorithms.title'), icon: BarChart3 },
        { id: 'faq', label: 'FAQ', icon: HelpCircle },
      ];
    },
    searchResults() {
      if (!this.searchQuery || this.searchQuery.length < 2) return [];
      const q = this.searchQuery.toLowerCase();
      const results = [];

      this.sections.forEach((s) => {
        if (s.label.toLowerCase().includes(q)) {
          results.push({ id: s.id, label: s.label, icon: s.icon, preview: '' });
        }
      });

      this.glossaryKeys.forEach((key) => {
        const term = this.$t(`docs.glossary.${key}.term`);
        const desc = this.$t(`docs.glossary.${key}.short`);
        if (term.toLowerCase().includes(q) || desc.toLowerCase().includes(q)) {
          const target = this.glossaryLink(key) || 'glossary';
          if (!results.find((r) => r.id === target && r.label === term)) {
            results.push({ id: target, label: term, icon: BookOpen, preview: desc });
          }
        }
      });

      const searchKeys = [
        {
          section: 'swiss',
          keys: [
            'docs.swissSystem.intro',
            'docs.swissSystem.rules.noRematch',
            'docs.swissSystem.rules.equalWins',
            'docs.swissSystem.rules.odd',
            'docs.swissSystem.bye.text',
          ],
        },
        { section: 'groups', keys: ['docs.groupsSystem.intro', 'docs.groupsSystem.ranking.headToHead'] },
        { section: 'barrage', keys: ['docs.barrageSystem.intro', 'docs.barrageSystem.qualification.text'] },
        { section: 'supermele', keys: ['docs.supermeleSystem.intro'] },
        { section: 'tir', keys: ['docs.tirSystem.intro', 'docs.tirSystem.rounds.text'] },
        { section: 'playoff', keys: ['docs.playoffSystem.intro', 'docs.playoffSystem.seeding.text'] },
        { section: 'cadrage', keys: ['docs.cadrageSystem.intro', 'docs.cadrageSystem.pairing.text'] },
        {
          section: 'rankings',
          keys: ['docs.rankingAlgorithms.buchholz.text', 'docs.rankingAlgorithms.lanes.text'],
        },
      ];

      searchKeys.forEach(({ section, keys }) => {
        if (results.find((r) => r.id === section)) return;
        for (const key of keys) {
          const text = this.$t(key);
          if (text.toLowerCase().includes(q)) {
            const s = this.sections.find((x) => x.id === section);
            results.push({
              id: section,
              label: s?.label || section,
              icon: s?.icon || BookOpen,
              preview: text.slice(0, 80),
            });
            break;
          }
        }
      });

      const faqResults = [];
      for (let i = 1; i <= 8; i++) {
        const question = this.$t(`docs.faqSection.items.q${i}`);
        const answer = this.$t(`docs.faqSection.items.a${i}`);
        if (question.toLowerCase().includes(q) || answer.toLowerCase().includes(q)) {
          faqResults.push({ id: 'faq', label: question, icon: HelpCircle, preview: answer.slice(0, 80) });
        }
      }
      results.push(...faqResults);

      return results.slice(0, 10);
    },
  },
  methods: {
    glossaryLink(key) {
      const map = {
        swiss: 'swiss',
        barrage: 'barrage',
        cadrage: 'cadrage',
        playoff: 'playoff',
        tir: 'tir',
        supermele: 'supermele',
        buchholz: 'rankings',
      };
      return map[key] || null;
    },
    smoothScroll(container, to, duration = 300) {
      const start = container.scrollTop;
      const diff = to - start;
      let startTime = null;
      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        container.scrollTop = start + diff * ease;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    scrollToSection(id) {
      this.navOpen = false;
      const el = document.getElementById(id);
      if (!el) return;
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const container = this.$refs.content;
        if (container) {
          const top = el.offsetTop - container.offsetTop;
          this.smoothScroll(container, top);
        }
      }
    },
    scrollToTop() {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (this.$refs.content) {
        this.smoothScroll(this.$refs.content, 0);
      }
    },
    setupObserver() {
      let scrolled = false;
      this.$refs.content?.addEventListener(
        'scroll',
        () => {
          scrolled = true;
        },
        { once: true },
      );

      const options = { root: this.$refs.content, rootMargin: '-80px 0px -60% 0px', threshold: 0 };
      this.observer = new IntersectionObserver((entries) => {
        if (!scrolled) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.activeSection = entry.target.id;
          }
        }
      }, options);

      this.sections.forEach((s) => {
        const el = document.getElementById(s.id);
        if (el) this.observer.observe(el);
      });
    },
    handleScroll() {
      const content = this.$refs.content;
      if (content) {
        this.showBackTop = content.scrollTop > 400;
      }
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.setupObserver();
      this.$refs.content?.addEventListener('scroll', this.handleScroll);
    });

    const hash = this.$route.hash?.slice(1);
    if (hash) {
      this.$nextTick(() => this.scrollToSection(hash));
    }
  },
  beforeUnmount() {
    this.observer?.disconnect();
    this.$refs.content?.removeEventListener('scroll', this.handleScroll);
  },
};
</script>

<style scoped>
.docs {
  display: flex;
  height: calc(100vh - 52px);
  overflow: hidden;
  background: var(--color-white);
  position: relative;
  z-index: 1;
}

/* Mobile toggle */

.docs__mobile-toggle {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--color-white);
  border: none;
  border-bottom: 1px solid var(--color-border-light);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.docs__mobile-toggle svg:last-child {
  margin-left: auto;
  transition: transform 0.2s;
}

.docs__chevron--open {
  transform: rotate(180deg);
}

/* Content */

.docs__content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  background: var(--color-surface-alt);
}

.docs__section {
  max-width: 720px;
  margin: 0 auto 3rem;
  scroll-margin-top: 1rem;
}

.docs__section-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.docs__section-icon {
  flex-shrink: 0;
  padding: 6px;
  border-radius: 8px;
  width: 36px;
  height: 36px;
}

.docs__section-icon--purple {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.docs__section-icon--blue {
  color: var(--blue-400);
  background: rgb(33 150 243 / 8%);
}

.docs__section-icon--green {
  color: var(--green-300);
  background: rgb(76 175 80 / 8%);
}

.docs__section-icon--amber {
  color: var(--amber-500);
  background: rgb(245 166 35 / 8%);
}

.docs__section-icon--gold {
  color: var(--gold-3);
  background: var(--gold-1);
}

.docs__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.75rem;
  line-height: 1.3;
}

.docs__subtitle {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin: 0.25rem 0 0;
}

.docs__intro {
  font-size: 1rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 1.25rem;
}

/* Cards */

.docs__card {
  background: var(--color-white);
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.docs__card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.docs__card p {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0 0 0.5rem;
}

.docs__card p:last-child {
  margin-bottom: 0;
}

.docs__card--highlight {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.docs__card--highlight h3 {
  color: var(--color-primary);
}

/* Lists */

.docs__list {
  margin: 0;
  padding-left: 1.25rem;
}

.docs__list li {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 0.4rem;
}

.docs__list--ordered {
  list-style: decimal;
}

/* Code */

.docs__code {
  display: block;
  padding: 0.5rem 0.75rem;
  background: var(--color-surface-alt);
  border-radius: 6px;
  font-size: 0.82rem;
  font-family: Menlo, Monaco, monospace;
  color: var(--color-primary);
  margin: 0.5rem 0;
  overflow-x: auto;
}

/* Table */

.docs__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  margin-top: 0.75rem;
}

.docs__table th,
.docs__table td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border-light);
}

.docs__table th {
  font-weight: 600;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.docs__table td {
  color: var(--color-text-secondary);
}

/* Glossary */

.docs__glossary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
}

.docs__glossary-card {
  background: var(--color-white);
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  padding: 0.9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.docs__glossary-card--clickable {
  cursor: pointer;
}

.docs__glossary-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px var(--color-card-shadow);
}

.docs__glossary-term {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text);
}

.docs__glossary-desc {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.docs__glossary-card--swiss .docs__glossary-term {
  color: var(--color-primary);
}

.docs__glossary-card--barrage .docs__glossary-term {
  color: var(--amber-500);
}

.docs__glossary-card--cadrage .docs__glossary-term {
  color: var(--amber-500);
}

.docs__glossary-card--playoff .docs__glossary-term {
  color: var(--gold-3);
}

.docs__glossary-card--tir .docs__glossary-term {
  color: var(--green-300);
}

.docs__glossary-card--supermele .docs__glossary-term {
  color: var(--green-300);
}

.docs__glossary-card--buchholz .docs__glossary-term {
  color: var(--color-primary);
}

.docs__glossary-card--carreau .docs__glossary-term {
  color: var(--tir-carreau);
}

.docs__glossary-card--reussi .docs__glossary-term {
  color: var(--blue-400);
}

.docs__glossary-card--touche .docs__glossary-term {
  color: var(--amber-200);
}

/* TIR scoring visual */

.docs__tir-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.docs__tir-score {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.docs__tir-pts {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  color: white;
  flex-shrink: 0;
}

.docs__tir-score--carreau {
  background: rgb(76 175 80 / 8%);
}

.docs__tir-score--carreau .docs__tir-pts {
  background: var(--tir-carreau);
}

.docs__tir-score--reussi {
  background: rgb(33 150 243 / 8%);
}

.docs__tir-score--reussi .docs__tir-pts {
  background: var(--blue-400);
}

.docs__tir-score--touche {
  background: rgb(245 166 35 / 8%);
}

.docs__tir-score--touche .docs__tir-pts {
  background: var(--amber-200);
  color: var(--color-text);
}

.docs__tir-score--manque {
  background: rgb(0 0 0 / 4%);
}

.docs__tir-score--manque .docs__tir-pts {
  background: var(--grey-700);
}

/* Bracket visual */

.docs__bracket-visual {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.75rem;
}

.docs__bracket-match {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  background: var(--color-surface-alt);
  border-radius: 6px;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.docs__bracket-seed {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-weight: 600;
  font-size: 0.75rem;
}

/* Cadrage flow */

.docs__cadrage-flow {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.docs__cadrage-step {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.docs__cadrage-step--direct {
  background: rgb(76 175 80 / 8%);
}

.docs__cadrage-step--cadrage {
  background: rgb(245 166 35 / 8%);
}

.docs__cadrage-step--eliminated {
  background: rgb(0 0 0 / 4%);
}

.docs__cadrage-badge {
  font-weight: 700;
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: var(--color-white);
  border: 1px solid var(--color-border-light);
  white-space: nowrap;
}

/* Flow steps */

.docs__flow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.docs__flow-step {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 1rem;
  background: var(--color-surface-alt);
  border-radius: 8px;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  width: 100%;
}

.docs__flow-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: white;
  font-weight: 600;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.docs__flow-arrow {
  color: var(--color-text-muted);
}

/* Rankings grid */

.docs__rankings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.docs__ranking-card {
  background: var(--color-white);
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  padding: 1rem;
}

.docs__ranking-card h4 {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem;
}

.docs__ranking-card p {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: 0.4rem 0 0;
}

/* FAQ */

.docs__faq {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.docs__faq-item {
  background: var(--color-white);
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.docs__faq-item--open {
  border-color: var(--color-primary);
}

.docs__faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1rem 1.25rem;
  border: none;
  background: none;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
  gap: 0.5rem;
}

.docs__faq-question svg {
  flex-shrink: 0;
  color: var(--color-text-muted);
  transition: transform 0.2s;
}

.docs__faq-item--open .docs__faq-question svg {
  transform: rotate(180deg);
}

.docs__faq-answer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.docs__faq-item--open .docs__faq-answer {
  max-height: 200px;
}

.docs__faq-answer p {
  padding: 0 1.25rem 1rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* Calculator */

.docs__calculator {
  margin-top: 0.75rem;
}

.docs__calculator label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  display: block;
  margin-bottom: 0.4rem;
}

.docs__calc-input {
  width: 100%;
  max-width: 160px;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--color-white);
  color: var(--color-text);
}

.docs__calc-result {
  margin-top: 0.75rem;
  padding: 0.6rem 0.75rem;
  background: var(--color-white);
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-primary);
}

/* Link button */

.docs__link-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  transition: opacity 0.2s;
}

.docs__link-btn:hover {
  opacity: 0.9;
}

/* Back to top */

.docs__back-top {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 12px var(--color-primary-shadow);
  transition: transform 0.2s;
  z-index: 50;
}

.docs__back-top:hover {
  transform: scale(1.1);
}

/* Search results */

.docs__search-results {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.docs__search-result {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  background: var(--color-white);
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  text-decoration: none;
  transition: border-color 0.2s;
}

.docs__search-result:hover {
  border-color: var(--color-primary);
}

.docs__search-result svg {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.docs__search-result strong {
  display: block;
  font-size: 0.9rem;
  color: var(--color-text);
}

.docs__search-result span {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.docs__empty {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  text-align: center;
  padding: 2rem;
}

/* Mobile */
@media (max-width: 768px) {
  .docs {
    flex-direction: column;
    height: auto;
    min-height: calc(100vh - 52px);
  }

  .docs__sidebar {
    display: none;
    position: fixed;
    inset: 52px 0 0;
    width: 100%;
    z-index: 200;
    border-right: none;
  }

  .docs__sidebar--open {
    display: flex;
  }

  .docs__mobile-toggle {
    display: flex;
  }

  .docs__content {
    padding: 1rem;
    overflow-y: visible;
    height: auto;
  }

  .docs__glossary-grid {
    grid-template-columns: 1fr;
  }

  .docs__tir-grid {
    grid-template-columns: 1fr;
  }

  .docs__rankings-grid {
    grid-template-columns: 1fr;
  }

  .docs__section {
    scroll-margin-top: 60px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .docs__sidebar {
    width: 240px;
  }

  .docs__glossary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
