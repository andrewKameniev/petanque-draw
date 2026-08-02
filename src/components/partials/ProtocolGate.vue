<template>
  <div class="protocol-gate">
    <div class="protocol-gate__card">
      <div class="protocol-gate__badge"><Star :size="14" /> Платна опція</div>
      <p class="protocol-gate__desc">
        Ви отримуєте на 80% готовий протокол. Треба дописати тільки тренерів та трохи відформатувати текстовий документ.
      </p>
      <div class="protocol-gate__payment">
        <span class="protocol-gate__price">300 грн</span>
        <span class="protocol-gate__card-number">5353 5423 2447 0856</span>
        <button
          class="protocol-gate__copy"
          @click="$emit('copy-card')"
          :title="cardCopied ? 'Скопійовано!' : 'Скопіювати'"
        >
          <Copy v-if="!cardCopied" :size="18" />
          <Check v-else :size="18" />
        </button>
      </div>
      <div class="protocol-gate__contact">
        Після оплати пишіть у Telegram <strong>@andrewkamenev</strong> або дзвоніть
        <a href="tel:+380951804418"><strong>+38-095-180-44-18</strong></a>
      </div>
      <div class="protocol-gate__tips">
        <div class="protocol-gate__tip">
          <Info :size="16" /> Ввести арбітрів можна тут же, або вже коли експортуєте у текстовий формат
        </div>
        <div class="protocol-gate__tip">
          <Info :size="16" /> Кнопка "Скопіювати протокол" і відредагувати у текстовому редакторі — найкращий варіант
        </div>
      </div>
    </div>
    <div class="protocol-gate__password">
      <label class="protocol-gate__label" for="protocolPassword">Пароль</label>
      <input
        class="protocol-gate__input"
        id="protocolPassword"
        type="number"
        :value="password"
        placeholder="Введіть пароль"
        @input="$emit('update:password', Number($event.target.value))"
      />
    </div>
  </div>
</template>

<script>
import { Check, Copy, Info, Star } from 'lucide-vue-next';

export default {
  name: 'ProtocolGate',
  components: { Check, Copy, Info, Star },
  props: {
    password: { type: Number, default: null },
    cardCopied: { type: Boolean, default: false },
  },
  emits: ['update:password', 'copy-card'],
};
</script>
