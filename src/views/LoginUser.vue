<template>
  <div class="is-flex is-align-items-center is-justify-content-center login-container">
    <router-link to="/" class="button is-light back-link">
      {{ $t('login.back') }}
    </router-link>
    <div class="p-5 login-form">
      <h1 class="has-text-centered mb-2 is-size-3 is-bold">
        {{ registerShow ? $t('login.registerAccount') : $t('common.loginUser') }}
      </h1>
      <form action="post">
        <div class="field">
          <label for="password" class="label">{{ $t('login.email') }}</label>
          <input
            type="email"
            id="email"
            class="input"
            :class="{ 'is-danger': isEmailError }"
            v-model="email"
            @keyup.enter.prevent="loginOrRegister"
          />
          <p v-if="isEmailError" class="help is-danger">{{ $t('login.emailError') }}</p>
        </div>
        <div class="field">
          <label for="password" class="label">{{ $t('login.password') }}</label>
          <input
            type="password"
            id="password"
            class="input"
            :class="{ 'is-danger': isPasswordError }"
            autocomplete="off"
            v-model="password"
            @keyup.enter.prevent="loginOrRegister"
          />
          <p v-if="isPasswordError" class="help is-danger">{{ $t('login.passwordError') }}</p>
        </div>
        <div class="field text-center mb-3">
          <button class="button is-info" @click.prevent="loginOrRegister">
            {{ registerShow ? $t('login.register') : $t('common.loginUser') }}
          </button>
        </div>
        <div class="has-text-centered mb-4" v-if="!registerShow">
          <a href="#" @click.prevent="resetPassword">{{ $t('login.forgot') }}</a>
        </div>
        <div class="has-text-centered">
          <a href="#" @click.prevent="registerShow = !registerShow">{{
            registerShow ? $t('login.justLogin') : $t('login.newUser')
          }}</a>
        </div>
      </form>
    </div>
    <Message v-if="message.show" />
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import { auth } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import Message from '@/components/Message';

export default {
  name: 'Login',
  components: { Message },
  data() {
    return {
      email: '',
      password: '',
      isEmailError: false,
      isPasswordError: false,
      registerShow: false,
    };
  },
  computed: {
    ...mapState(useMainStore, ['message']),
  },
  methods: {
    ...mapActions(useMainStore, ['loginUser', 'showMessage', 'syncUserEmailIndex']),
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
      if (this.registerShow) {
        createUserWithEmailAndPassword(auth, this.email.trim(), this.password.trim())
          .then((data) => {
            this.loginUser(data.user);
            this.syncUserEmailIndex(data.user);
            this.$router.push('/');
          })
          .catch((error) => {
            console.error(error.code);
            this.handleFirebaseErrors(error.code);
          });
      } else {
        signInWithEmailAndPassword(auth, this.email.trim(), this.password.trim())
          .then((data) => {
            this.loginUser(data.user);
            this.syncUserEmailIndex(data.user);
            this.$router.push('/');
          })
          .catch((error) => {
            console.error(error.code);
            this.handleFirebaseErrors(error.code);
          });
      }
    },
    resetErrors() {
      this.isEmailError = false;
      this.isPasswordError = false;
    },
    handleFirebaseErrors(error) {
      console.error(error);
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
        default:
          this.isPasswordError = this.$t('messages.incorrectPassword');
          break;
      }
    },
  },
};
</script>

<style>
.login-container {
  min-height: 100vh;
  padding: 1em;
}
@media screen and (min-width: 501px) {
  .login-container {
    background-image: url('../assets/img/login-desktop.jpg');
  }
}

[data-theme='dark'] .login-container {
  background-image: none;
  background-color: var(--color-body-bg);
}

.login-form {
  width: 500px;
  max-width: 100%;
  border-radius: 0.5rem;
  background-color: var(--color-surface);
  box-shadow: 0 0 30px 2px var(--color-dropdown-shadow);
}

.back-link {
  position: fixed;
  left: 1em;
  top: 1em;
}
</style>
