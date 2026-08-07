<template>
  <PageLoader v-if="isLoading" :label="$t('common.loading')" />
  <div v-else class="wrapper">
    <Navbar @open-menu="menuOpen = !menuOpen" />
    <div class="container">
      <div class="columns">
        <div class="column" v-if="user">
          <Tournament v-if="tournament" />
          <section v-else class="tournament-empty" data-testid="tournament-empty-state">
            <div class="tournament-empty__icon" aria-hidden="true">
              <Trophy :size="44" :stroke-width="1.6" />
            </div>
            <h1 class="tournament-empty__title">{{ $t('common.noActiveTournamentsTitle') }}</h1>
            <p class="tournament-empty__text">{{ $t('common.noActiveTournamentsText') }}</p>
            <button
              type="button"
              class="button tournament-empty__button"
              data-testid="create-tournament-empty"
              @click="addTournament"
            >
              <Plus :size="20" aria-hidden="true" />
              {{ $t('common.createTournament') }}
            </button>
          </section>
        </div>
        <div v-else class="login-section">
          <!-- Forgot password form -->
          <div class="login-card" v-if="forgotShow">
            <div class="login-card__logo">
              <img src="@/assets/img/logo.webp" alt="Petanque Draw" />
            </div>
            <h2 class="login-card__title">{{ $t('login.forgot') }}</h2>
            <p class="login-card__subtitle">{{ $t('login.forgotHint') }}</p>
            <form @submit.prevent="resetPassword">
              <div class="login-field">
                <input
                  type="email"
                  class="login-input"
                  :class="{ 'login-input--error': isEmailError }"
                  :placeholder="$t('login.emailPlaceholder')"
                  v-model="email"
                />
                <p v-if="isEmailError" class="login-error">{{ isEmailError }}</p>
              </div>
              <button type="submit" class="login-btn">{{ $t('login.resetPassword') }}</button>
            </form>
            <div class="login-card__footer">
              <a
                href="#"
                @click.prevent="
                  forgotShow = false;
                  resetErrors();
                "
                class="login-link"
              >
                ← {{ $t('login.backToLogin') }}
              </a>
            </div>
          </div>

          <!-- Login / Register form -->
          <div class="login-card" v-else>
            <div class="login-card__logo">
              <img src="@/assets/img/logo.webp" alt="Petanque Draw" />
            </div>
            <h2 class="login-card__title">
              {{ registerShow ? $t('login.registerTitle') : $t('login.loginTitle') }}
            </h2>
            <form @submit.prevent="loginOrRegister">
              <div class="login-field">
                <input
                  type="email"
                  class="login-input"
                  :class="{ 'login-input--error': isEmailError }"
                  data-testid="input-email"
                  :placeholder="$t('login.emailPlaceholder')"
                  v-model="email"
                />
                <p v-if="isEmailError" class="login-error" data-testid="login-error">
                  {{ isEmailError }}
                </p>
              </div>
              <div class="login-field">
                <input
                  type="password"
                  class="login-input"
                  :class="{ 'login-input--error': isPasswordError }"
                  data-testid="input-password"
                  :placeholder="$t('login.passwordPlaceholder')"
                  autocomplete="off"
                  v-model="password"
                />
                <p v-if="isPasswordError" class="login-error" data-testid="login-error">
                  {{ isPasswordError }}
                </p>
              </div>
              <div class="login-field" v-if="registerShow">
                <input
                  type="password"
                  class="login-input"
                  :class="{ 'login-input--error': isConfirmError }"
                  data-testid="input-password-confirm"
                  :placeholder="$t('login.confirmPlaceholder')"
                  autocomplete="off"
                  v-model="passwordConfirm"
                />
                <p v-if="isConfirmError" class="login-error" data-testid="login-error">
                  {{ isConfirmError }}
                </p>
              </div>
              <button type="submit" class="login-btn" data-testid="btn-submit">
                {{ registerShow ? $t('login.register') : $t('login.loginBtn') }}
              </button>
            </form>
            <div class="login-card__forgot" v-if="!registerShow">
              <a
                href="#"
                @click.prevent="
                  forgotShow = true;
                  resetErrors();
                "
                class="login-link login-link--subtle"
              >
                {{ $t('login.forgot') }}
              </a>
            </div>
            <div class="login-card__footer">
              <span class="login-card__footer-text">{{
                registerShow ? $t('login.hasAccount') : $t('login.noAccount')
              }}</span>
              <a
                href="#"
                @click.prevent="
                  registerShow = !registerShow;
                  resetErrors();
                "
                class="login-link login-link--bold"
                data-testid="link-toggle-auth"
              >
                {{ registerShow ? $t('login.loginBtn') : $t('login.register') }}
              </a>
            </div>
          </div>
        </div>
        <div class="column is-one-third is-hidden-touch" v-if="user">
          <img src="@/assets/img/bg.avif" alt="Petanque in Alps" class="image" />
        </div>
      </div>
      <Message v-if="message.show" />
      <Menu :active="menuOpen" @closeMenu="menuOpen = false" />
      <Help v-if="helpOpen" @close-modal="helpOpen = false" />
    </div>
    <Footer />
  </div>
</template>

<script>
import Message from './Message.vue';
import Menu from './Menu';
import Tournament from './Tournament';
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import Navbar from './Navbar';
import { defineAsyncComponent } from 'vue';
const Help = defineAsyncComponent(() => import('./Help'));
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/firebase';
import Footer from '@/components/partials/Footer.vue';
import PageLoader from '@/components/ui/PageLoader.vue';
import { Plus, Trophy } from 'lucide-vue-next';

export default {
  name: 'Draw',
  data() {
    return {
      showSaveTournament: false,
      menuOpen: false,
      helpOpen: false,
      isLoading: false,
      email: '',
      password: '',
      passwordConfirm: '',
      isEmailError: false,
      isPasswordError: false,
      isConfirmError: false,
      registerShow: false,
      forgotShow: false,
    };
  },
  watch: {
    '$route.query.t'(tournamentId) {
      if (!tournamentId || !this.user || String(this.currentTournamentIndex) === String(tournamentId)) return;
      if (this.tournaments[tournamentId]) {
        this.setActiveTournament(tournamentId);
      } else if (this.userTournamentMap?.[tournamentId] && this.userTournamentMap[tournamentId].role !== 'owner') {
        this.loadSharedTournament(tournamentId, this.userTournamentMap[tournamentId].ownerUid);
      }
    },
    currentTournamentIndex(id) {
      if (!id || !this.user || this.$route.path !== '/') return;
      if (String(this.$route.query.t) !== String(id)) {
        this.$router.replace({ path: '/', query: { t: id } });
      }
    },
  },
  mounted() {
    this.isLoading = false;
  },
  methods: {
    ...mapActions(useMainStore, [
      'setActiveTournament',
      'loadSharedTournament',
      'loginUser',
      'getTournaments',
      'showMessage',
      'addTournament',
    ]),
    async resetPassword() {
      try {
        this.resetErrors();
        await sendPasswordResetEmail(auth, this.email.trim());
        this.showMessage({ title: this.$t('messages.sent'), text: this.$t('messages.checkEmail') });
      } catch (error) {
        this.showMessage({
          title: this.$t('messages.error'),
          text: this.$t('messages.somethingWrong'),
          type: 'error',
        });
        this.handleFirebaseErrors(error.code);
      }
    },
    loginOrRegister() {
      this.resetErrors();
      if (this.password.trim().length < 6) {
        this.isPasswordError = this.$t('messages.weakPassword');
        return;
      }
      if (this.registerShow) {
        if (this.password.trim() !== this.passwordConfirm.trim()) {
          this.isConfirmError = this.$t('messages.passwordMismatch');
          return;
        }
        createUserWithEmailAndPassword(auth, this.email.trim(), this.password.trim())
          .then((data) => {
            this.loginUser(data.user);
            this.$store.dispatch('getTournaments');
          })
          .catch((error) => {
            this.handleFirebaseErrors(error.code);
          });
      } else {
        signInWithEmailAndPassword(auth, this.email.trim(), this.password.trim())
          .then((data) => {
            this.loginUser(data.user);
            this.$store.dispatch('getTournaments');
          })
          .catch((error) => {
            this.handleFirebaseErrors(error.code);
          });
      }
    },
    resetErrors() {
      this.isEmailError = false;
      this.isPasswordError = false;
      this.isConfirmError = false;
    },
    handleFirebaseErrors(error) {
      switch (error) {
        case 'auth/missing-email':
          this.isEmailError = this.$t('messages.missingEmail');
          break;
        case 'auth/invalid-email':
          this.isEmailError = this.$t('messages.invalidEmail');
          break;
        case 'auth/user-not-found':
          this.isPasswordError = this.$t('messages.noAccount');
          break;
        case 'auth/wrong-password':
          this.isPasswordError = this.$t('messages.incorrectPassword');
          break;
        case 'auth/weak-password':
          this.isPasswordError = this.$t('messages.weakPassword');
          break;
        default:
          this.isPasswordError = this.$t('messages.incorrectPassword');
          break;
      }
    },
  },
  computed: {
    ...mapState(useMainStore, [
      'message',
      'tournaments',
      'currentTournamentIndex',
      'user',
      'currentTournament',
      'userTournamentMap',
    ]),
    tournament() {
      return this.currentTournament;
    },
  },
  components: {
    PageLoader,
    Footer,
    Help,
    Navbar,
    Tournament,
    Menu,
    Message,
    Plus,
    Trophy,
  },
};
</script>

<style>
.menu-button {
  position: fixed;
  left: 0;
  top: 0;
  padding: 10px;
  border-radius: 0 0 5px;
}

.columns > .column {
  min-width: 0;
}

.tournament-empty {
  display: flex;
  min-height: 520px;
  margin: 1.5rem 0;
  padding: 4rem 2rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: var(--color-surface-semi);
  border: 1px solid var(--color-border-light);
  border-radius: 1rem;
}

.tournament-empty__icon {
  display: grid;
  width: 88px;
  height: 88px;
  margin-bottom: 1.5rem;
  place-items: center;
  color: var(--color-primary);
  background: var(--color-primary-bg);
  border-radius: 50%;
}

.tournament-empty__title {
  margin: 0 0 0.75rem;
  color: var(--color-text);
  font-size: clamp(1.65rem, 3vw, 2.15rem);
  font-weight: 700;
}

.tournament-empty__text {
  max-width: 480px;
  margin: 0 0 1.75rem;
  color: var(--color-text-muted);
  font-size: 1.05rem;
  line-height: 1.6;
}

.tournament-empty__button {
  display: inline-flex;
  min-height: 48px;
  padding: 0.7rem 1.4rem;
  align-items: center;
  gap: 0.55rem;
  color: var(--grey-0);
  background: var(--color-primary);
  border-color: var(--color-primary);
  border-radius: 0.65rem;
  font-weight: 700;
}

.tournament-empty__button:hover,
.tournament-empty__button:focus-visible {
  color: var(--grey-0);
  background: var(--color-primary-light);
  border-color: var(--color-primary-light);
  box-shadow: 0 0 0 3px var(--color-primary-shadow);
}

@media (max-width: 768px) {
  .tournament-empty {
    min-height: 400px;
    margin: 0.75rem 0;
    padding: 3rem 1.25rem;
  }
}
</style>
