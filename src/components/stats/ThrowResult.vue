<script>
const clickOutsideDirective = {
    beforeMount(el, binding) {
        el.clickOutsideEvent = (event) => {
            if (!(el === event.target || el.contains(event.target))) {
                // Call the method provided in the binding
                binding.value(event);
            }
        };
        document.body.addEventListener('click', el.clickOutsideEvent);
    },
    unmounted(el) {
        document.body.removeEventListener('click', el.clickOutsideEvent);
    },
};
export default {
    name: "ThrowResult",
    props: ['info', 'iterator', 'system'],
    data() {
        return {
            isMenuVisible: false,
            longPressTimer: null,
            isLongPress: false,
            selectOpen: false,
            frenchSystem: ['H', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'I']
        };
    },
    directives: {
        clickOutside: clickOutsideDirective,
    },
    methods: {
        // Show the menu
        showMenu() {
            if (!this.selectOpen) {
                this.isMenuVisible = true;
            }
        },
        hideMenu() {
            this.isMenuVisible = false;
        },
        handleMouseDown() {
            this.isLongPress = false; // Reset the long-press flag

            this.longPressTimer = setTimeout(() => {
                this.isLongPress = true;
                this.showMenu();
            }, 500);
        },
        handleMouseUp() {
            clearTimeout(this.longPressTimer);
        },
        handleTouchStart() {
            this.isLongPress = false; // Reset the long-press flag
            this.longPressTimer = setTimeout(() => {
                this.isLongPress = true;
                this.showMenu();
            }, 500);
        },
        handleTouchEnd() {
            clearTimeout(this.longPressTimer);
        },
        handleElementClick(event) {
            if (this.isLongPress) {
                event.preventDefault();
                event.stopPropagation();
            }
        },
        removeThrow() {
            this.$emit('remove');
            this.hideMenu();
        },
        superThrow(result) {
            this.$emit('super', !result);
            this.hideMenu();
        },
        onClickOutside () {
            this.hideMenu()
        },
        getFrenchLabel(value) {
            if (value === 'H') {
                return '+'
            } else if (value === 'I') {
                return '-'
            } else {
                return value
            }
        }
    },
}
</script>

<template>
    <div @mousedown.stop="handleMouseDown" @mouseup="handleMouseUp" @mouseleave="handleMouseUp"
         @touchstart.stop="handleTouchStart" @touchend="handleTouchEnd" @touchcancel="handleTouchEnd"
         class="longpress-area" v-click-outside="onClickOutside">
        <div class="is-flex is-align-items-center" style="gap: 5px" v-if="info.isMade">
            <span class="is-size-3" :class="{'has-text-success': info.success, 'has-text-danger': !info.success}" v-if="info.x2">!</span>
            <div class="checkbox-wrapper-10">
                <input class="tgl tgl-flip" :id="iterator" type="checkbox" :checked="info.type === 'p'"
                       @change="$emit('updatetype', $event.target.checked ? 'p' : 't')"
                       @click="handleElementClick"/>
                <label class="tgl-btn" data-tg-off="Tir" data-tg-on="Point" :for="iterator"></label>
            </div>
            <div class="checkbox-wrapper-44" v-if="system === 'simple'">
                <label class="toggleButton">
                    <input type="checkbox" :checked="info.success" @change="$emit('updateresult', $event.target.checked)"
                           @click="handleElementClick">
                    <span>
                        <svg viewBox="0 0 44 44">
                            <path d="M14,24 L21,31 L39.7428882,11.5937758 C35.2809627,6.53125861 30.0333333,4 24,4 C12.95,4 4,12.95 4,24 C4,35.05 12.95,44 24,44 C35.05,44 44,35.05 44,24 C44,19.3 42.5809627,15.1645919 39.7428882,11.5937758" transform="translate(-2.000000, -2.000000)"></path>
                        </svg>
                    </span>
                </label>
            </div>
            <div v-else class="control">
                <div class="select">
                    <select :name="'throwResult' + iterator" :id="'throwResult' + iterator" :value="info.french"
                            @focus="selectOpen = true" @blur="selectOpen = true" @change="$emit('updateresultfrench', $event.target.value)">
                        <option v-for="value in frenchSystem" :value="value" :key="value">{{ getFrenchLabel(value) }}</option>
                    </select>
                </div>
            </div>
        </div>
        <div v-else class="gost-throw" @click="$emit('add')"></div>
        <div v-if="isMenuVisible" class="custom-menu">
            <ul>
                <li v-if="system === 'simple'" @click="superThrow(info.x2)">{{ info.x2 ? 'remove x2' : 'x2 result' }}</li>
                <li @click="removeThrow()">Remove throw</li>
            </ul>
        </div>
    </div>

</template>

<style scoped>
.gost-throw {
    width: 79px;
    height: 32px;
    border: solid 1px;
    border-radius: 7px;
    cursor: pointer;
}

.longpress-area {
    width: 100%;
    position: relative;
    user-select: none;
}

.custom-menu {
    position: absolute;
    right: 0;
    background-color: #fff;
    border: 1px solid #ccc;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    width: 150px;
}

.custom-menu ul {
    list-style: none;
    margin: 0;
    padding: 0;
}

.custom-menu li {
    padding: 8px 16px;
    cursor: pointer;
}

.custom-menu li:hover {
    background-color: #eee;
}

.checkbox-wrapper-44 input[type="checkbox"] {
    display: none;
    visibility: hidden;
}

.checkbox-wrapper-44 *,
.checkbox-wrapper-44 *::before,
.checkbox-wrapper-44 *::after {
    box-sizing: border-box;
}

.checkbox-wrapper-44 .toggleButton {
    cursor: pointer;
    display: block;
    transform-origin: 50% 50%;
    transform-style: preserve-3d;
    transition: transform 0.14s ease;
}
.checkbox-wrapper-44 .toggleButton:active {
    transform: rotateX(30deg);
}
.checkbox-wrapper-44 .toggleButton input + span {
    display: block;
    border: 3px solid rgba(0, 0, 0, 0.2);
    border-radius: 50%;
    position: relative;
    width: 32px;
    height: 32px;
}
.checkbox-wrapper-44 .toggleButton input + span svg {
    fill: none;
    stroke-width: 3.6;
    stroke: #000;
    stroke-linecap: round;
    stroke-linejoin: round;
    width: 32px;
    height: 32px;
    display: block;
    position: absolute;
    left: -3px;
    top: -3px;
    right: -3px;
    bottom: -3px;
    z-index: 1;
    stroke-dashoffset: 124.6;
    stroke-dasharray: 0 162.6 133 29.6;
    transition: all 0.4s ease 0s;
}
.checkbox-wrapper-44 .toggleButton input + span:before,
.checkbox-wrapper-44 .toggleButton input + span:after {
    content: "";
    width: 3px;
    height: 16px;
    background: #000;
    position: absolute;
    left: 50%;
    top: 50%;
    border-radius: 5px;
}
.checkbox-wrapper-44 .toggleButton input + span:before {
    opacity: 0;
    transform: scale(0.3) translate(-50%, -50%) rotate(45deg);
    -webkit-animation: bounceInBefore-44 0.3s linear forwards 0.3s;
    animation: bounceInBefore-44 0.3s linear forwards 0.3s;
}
.checkbox-wrapper-44 .toggleButton input + span:after {
    opacity: 0;
    transform: scale(0.3) translate(-50%, -50%) rotate(-45deg);
    -webkit-animation: bounceInAfter-44 0.3s linear forwards 0.3s;
    animation: bounceInAfter-44 0.3s linear forwards 0.3s;
}
.checkbox-wrapper-44 .toggleButton input:checked + span svg {
    stroke-dashoffset: 162.6;
    stroke-dasharray: 0 162.6 28 134.6;
    transition: all 0.4s ease 0.2s;
}
.checkbox-wrapper-44 .toggleButton input:checked + span:before {
    opacity: 0;
    transform: scale(0.3) translate(-50%, -50%) rotate(45deg);
    -webkit-animation: bounceInBeforeDont-44 0.3s linear forwards 0s;
    animation: bounceInBeforeDont-44 0.3s linear forwards 0s;
}
.checkbox-wrapper-44 .toggleButton input:checked + span:after {
    opacity: 0;
    transform: scale(0.3) translate(-50%, -50%) rotate(-45deg);
    -webkit-animation: bounceInAfterDont-44 0.3s linear forwards 0s;
    animation: bounceInAfterDont-44 0.3s linear forwards 0s;
}

@-webkit-keyframes bounceInBefore-44 {
    0% {
        opacity: 0;
        transform: scale(0.3) translate(-50%, -50%) rotate(45deg);
    }
    50% {
        opacity: 0.9;
        transform: scale(1.1) translate(-50%, -50%) rotate(45deg);
    }
    80% {
        opacity: 1;
        transform: scale(0.89) translate(-50%, -50%) rotate(45deg);
    }
    100% {
        opacity: 1;
        transform: scale(1) translate(-50%, -50%) rotate(45deg);
    }
}

@keyframes bounceInBefore-44 {
    0% {
        opacity: 0;
        transform: scale(0.3) translate(-50%, -50%) rotate(45deg);
    }
    50% {
        opacity: 0.9;
        transform: scale(1.1) translate(-50%, -50%) rotate(45deg);
    }
    80% {
        opacity: 1;
        transform: scale(0.89) translate(-50%, -50%) rotate(45deg);
    }
    100% {
        opacity: 1;
        transform: scale(1) translate(-50%, -50%) rotate(45deg);
    }
}
@-webkit-keyframes bounceInAfter-44 {
    0% {
        opacity: 0;
        transform: scale(0.3) translate(-50%, -50%) rotate(-45deg);
    }
    50% {
        opacity: 0.9;
        transform: scale(1.1) translate(-50%, -50%) rotate(-45deg);
    }
    80% {
        opacity: 1;
        transform: scale(0.89) translate(-50%, -50%) rotate(-45deg);
    }
    100% {
        opacity: 1;
        transform: scale(1) translate(-50%, -50%) rotate(-45deg);
    }
}
@keyframes bounceInAfter-44 {
    0% {
        opacity: 0;
        transform: scale(0.3) translate(-50%, -50%) rotate(-45deg);
    }
    50% {
        opacity: 0.9;
        transform: scale(1.1) translate(-50%, -50%) rotate(-45deg);
    }
    80% {
        opacity: 1;
        transform: scale(0.89) translate(-50%, -50%) rotate(-45deg);
    }
    100% {
        opacity: 1;
        transform: scale(1) translate(-50%, -50%) rotate(-45deg);
    }
}
@-webkit-keyframes bounceInBeforeDont-44 {
    0% {
        opacity: 1;
        transform: scale(1) translate(-50%, -50%) rotate(45deg);
    }
    100% {
        opacity: 0;
        transform: scale(0.3) translate(-50%, -50%) rotate(45deg);
    }
}
@keyframes bounceInBeforeDont-44 {
    0% {
        opacity: 1;
        transform: scale(1) translate(-50%, -50%) rotate(45deg);
    }
    100% {
        opacity: 0;
        transform: scale(0.3) translate(-50%, -50%) rotate(45deg);
    }
}
@-webkit-keyframes bounceInAfterDont-44 {
    0% {
        opacity: 1;
        transform: scale(1) translate(-50%, -50%) rotate(-45deg);
    }
    100% {
        opacity: 0;
        transform: scale(0.3) translate(-50%, -50%) rotate(-45deg);
    }
}
@keyframes bounceInAfterDont-44 {
    0% {
        opacity: 1;
        transform: scale(1) translate(-50%, -50%) rotate(-45deg);
    }
    100% {
        opacity: 0;
        transform: scale(0.3) translate(-50%, -50%) rotate(-45deg);
    }
}

.checkbox-wrapper-10 .tgl {
    display: none;
}
.checkbox-wrapper-10 .tgl,
.checkbox-wrapper-10 .tgl:after,
.checkbox-wrapper-10 .tgl:before,
.checkbox-wrapper-10 .tgl *,
.checkbox-wrapper-10 .tgl *:after,
.checkbox-wrapper-10 .tgl *:before,
.checkbox-wrapper-10 .tgl + .tgl-btn {
    box-sizing: border-box;
}
.checkbox-wrapper-10 .tgl::-moz-selection,
.checkbox-wrapper-10 .tgl:after::-moz-selection,
.checkbox-wrapper-10 .tgl:before::-moz-selection,
.checkbox-wrapper-10 .tgl *::-moz-selection,
.checkbox-wrapper-10 .tgl *:after::-moz-selection,
.checkbox-wrapper-10 .tgl *:before::-moz-selection,
.checkbox-wrapper-10 .tgl + .tgl-btn::-moz-selection,
.checkbox-wrapper-10 .tgl::selection,
.checkbox-wrapper-10 .tgl:after::selection,
.checkbox-wrapper-10 .tgl:before::selection,
.checkbox-wrapper-10 .tgl *::selection,
.checkbox-wrapper-10 .tgl *:after::selection,
.checkbox-wrapper-10 .tgl *:before::selection,
.checkbox-wrapper-10 .tgl + .tgl-btn::selection {
    background: none;
}
.checkbox-wrapper-10 .tgl + .tgl-btn {
    outline: 0;
    display: block;
    font-size: 0.8em;
    width: 32px;
    height: 32px;
    position: relative;
    cursor: pointer;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}
@media screen and (min-width: 501px) {
    .checkbox-wrapper-10 .tgl + .tgl-btn {
        width: 42px;
    }
}
.checkbox-wrapper-10 .tgl + .tgl-btn:after,
.checkbox-wrapper-10 .tgl + .tgl-btn:before {
    position: relative;
    display: block;
    content: "";
    width: 50%;
    height: 100%;
}
.checkbox-wrapper-10 .tgl + .tgl-btn:after {
    left: 0;
}
.checkbox-wrapper-10 .tgl + .tgl-btn:before {
    display: none;
}
.checkbox-wrapper-10 .tgl:checked + .tgl-btn:after {
    left: 50%;
}

.checkbox-wrapper-10 .tgl-flip + .tgl-btn {
    padding: 2px;
    transition: all 0.2s ease;
    font-family: sans-serif;
    perspective: 100px;
}
.checkbox-wrapper-10 .tgl-flip + .tgl-btn:after,
.checkbox-wrapper-10 .tgl-flip + .tgl-btn:before {
    display: inline-block;
    transition: all 0.4s ease;
    width: 100%;
    text-align: center;
    position: absolute;
    line-height: 32px;
    font-weight: bold;
    color: #fff;
    top: 0;
    left: 0;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    border-radius: 4px;
}
.checkbox-wrapper-10 .tgl-flip + .tgl-btn:after {
    content: attr(data-tg-on);
    background: #02C66F;
    transform: rotateY(-180deg);
}
.checkbox-wrapper-10 .tgl-flip + .tgl-btn:before {
    background: #1990ff;
    content: attr(data-tg-off);
}
.checkbox-wrapper-10 .tgl-flip + .tgl-btn:active:before {
    transform: rotateY(-20deg);
}
.checkbox-wrapper-10 .tgl-flip:checked + .tgl-btn:before {
    transform: rotateY(180deg);
}
.checkbox-wrapper-10 .tgl-flip:checked + .tgl-btn:after {
    transform: rotateY(0);
    left: 0;
    background: #7FC6A6;
}
.checkbox-wrapper-10 .tgl-flip:checked + .tgl-btn:active:after {
    transform: rotateY(20deg);
}
</style>