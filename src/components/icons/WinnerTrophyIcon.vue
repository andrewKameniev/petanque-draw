<template>
  <svg :width="size" :height="size" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#55E39A" />
        <stop offset="100%" stop-color="#20C86A" />
      </linearGradient>
    </defs>
    <g :fill="`url(#${gradientId})`">
      <path
        d="M163 138H121c-25 0-45 20-45 45v27c0 63 48 114 109 120v-31c-44-6-78-44-78-89v-27c0-8 6-14 14-14h42v-31z"
      />
      <path d="M349 138h42c25 0 45 20 45 45v27c0 63-48 114-109 120v-31c44-6 78-44 78-89v-27c0-8-6-14-14-14h-42v-31z" />
      <path
        d="M171 112h170a18 18 0 0 1 18 18v103c0 77-38 129-93 145v42h24a14 14 0 0 1 14 14v12H208v-12a14 14 0 0 1 14-14h24v-42c-55-16-93-68-93-145V130a18 18 0 0 1 18-18z"
      />
      <path d="M112 350c-38-44-58-94-59-150l10-1c1 53 20 100 56 141 21 24 47 43 78 57l-4 9c-32-14-59-33-81-56z" />
      <ellipse cx="71" cy="222" rx="13" ry="27" transform="rotate(-18 71 222)" />
      <ellipse cx="88" cy="263" rx="14" ry="29" transform="rotate(-46 88 263)" />
      <ellipse cx="119" cy="304" rx="15" ry="30" transform="rotate(-58 119 304)" />
      <ellipse cx="157" cy="341" rx="15" ry="30" transform="rotate(-65 157 341)" />
      <ellipse cx="69" cy="279" rx="14" ry="29" transform="rotate(-72 69 279)" />
      <ellipse cx="92" cy="320" rx="15" ry="30" transform="rotate(-72 92 320)" />
      <ellipse cx="128" cy="361" rx="15" ry="30" transform="rotate(-70 128 361)" />
      <path d="M400 350c38-44 58-94 59-150l-10-1c-1 53-20 100-56 141-21 24-47 43-78 57l4 9c32-14 59-33 81-56z" />
      <ellipse cx="441" cy="222" rx="13" ry="27" transform="rotate(18 441 222)" />
      <ellipse cx="424" cy="263" rx="14" ry="29" transform="rotate(46 424 263)" />
      <ellipse cx="393" cy="304" rx="15" ry="30" transform="rotate(58 393 304)" />
      <ellipse cx="355" cy="341" rx="15" ry="30" transform="rotate(65 355 341)" />
      <ellipse cx="443" cy="279" rx="14" ry="29" transform="rotate(72 443 279)" />
      <ellipse cx="420" cy="320" rx="15" ry="30" transform="rotate(72 420 320)" />
      <ellipse cx="384" cy="361" rx="15" ry="30" transform="rotate(70 384 361)" />
    </g>
  </svg>
</template>

<script>
let uid = 0;
export default {
  name: 'WinnerTrophyIcon',
  props: {
    size: { type: [Number, String], default: 16 },
  },
  data() {
    return { gradientId: `trophy-grad-${uid++}` };
  },
};
</script>
